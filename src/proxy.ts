import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { ADMIN_EMAILS } from "@/lib/admin-emails";

const isAdminEmail = (email: string | undefined | null) =>
  ADMIN_EMAILS.includes(email ?? "");

const SKIP_EXT = /\.(?:avif|css|gif|ico|jpe?g|js|json|map|png|svg|txt|webp|woff2?|xml)$/i;

// Páginas públicas do site. Só elas entram no analytics: qualquer outro path
// é 404 (scanner de vulnerabilidade, URL inventada) e não é uma "página".
// Ao criar uma rota pública nova, inclua-a aqui.
// Mesma lista (em SQL) na migration 20261022000002_analytics_seguranca.sql.
const ROTAS_PUBLICAS: RegExp[] = [
  /^\/$/,
  /^\/solicitar-escuta$/,
  /^\/minhas-solicitacoes$/,
  /^\/blog$/,
  /^\/blog\/[^/]+$/,
  /^\/ebook$/,
  /^\/psicanalistas$/,
  /^\/psicanalistas\/[^/]+$/,
];

// Varredura automatizada de vulnerabilidade: bots procuram .env, phpinfo,
// dumps de banco, pastas de CMS etc. em qualquer domínio novo que encontram.
const PADRAO_DOTFILE = /(^|\/)\./;
const PADRAO_ENV = /\.env/i;
const PADRAO_ARQUIVO_SERVIDOR =
  /\.(?:php\d*|phtml|phar|asp|aspx|jsp|cgi|pl|sql|bak|old|orig|save|swp|swo|log|ini|conf|cfg|yaml|yml|toml|lock|key|pem|tar|tgz|zip|rar|7z)$/i;
const PADRAO_SONDA =
  /\/(?:phpinfo|php-info|_phpinfo|_environment|info|pi|pinfo|debug|phpversion|server-info|server-status|test|shell|cmd|cgi-bin|phpmyadmin|pma|adminer|wp-admin|wp-content|wp-includes|xmlrpc|readme|license|changelog|version|composer|package-lock|dockerfile|web\.config|htaccess|htpasswd|id_rsa|authorized_keys|known_hosts|crossdomain\.xml|elmah|trace|solr|jenkins|gitlab|bitbucket)(?:[./]|$)/i;

function ehRotaPublicaDoSite(pathname: string) {
  const path = pathname.replace(/\/+$/, "") || "/";
  return ROTAS_PUBLICAS.some((rota) => rota.test(path));
}

function ehVarreduraDeVulnerabilidade(pathname: string) {
  if (PADRAO_DOTFILE.test(pathname)) return true;
  if (PADRAO_ENV.test(pathname)) return true;
  if (PADRAO_ARQUIVO_SERVIDOR.test(pathname)) return true;
  if (PADRAO_SONDA.test(pathname)) return true;
  return false;
}

function ehRotaPublicaRegistravel(pathname: string) {
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/auth")) return false;
  if (pathname.startsWith("/painel")) return false;
  if (pathname.startsWith("/trocar-senha")) return false;
  if (pathname.startsWith("/api")) return false;
  if (pathname.startsWith("/_next")) return false;
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") return false;
  if (SKIP_EXT.test(pathname)) return false;
  // só páginas reais do site entram no analytics
  if (!ehRotaPublicaDoSite(pathname)) return false;
  // nem varredura de vulnerabilidade
  if (ehVarreduraDeVulnerabilidade(pathname)) return false;
  return true;
}

function registrarVisita(
  request: NextRequest,
  event: NextFetchEvent,
  isAdmin: boolean,
  sessionId: string | null,
) {
  // waitUntil mantém o proxy vivo até a RPC terminar. Sem isso o registro
  // some quando a resposta é devolvida antes da ida ao Supabase.
  event.waitUntil(
    (async () => {
      try {
        const userAgent = request.headers.get("user-agent") ?? "";
        if (
          /bot|crawler|spider|crawl|slurp|bingpreview|facebookexternalhit|preview/i.test(
            userAgent,
          )
        ) {
          return;
        }
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: { getAll: () => [], setAll: () => {} },
          },
        );
        await supabase.rpc("registrar_visita", {
          p_path: request.nextUrl.pathname,
          p_referrer: request.headers.get("referer"),
          p_session_id: sessionId,
          p_user_agent: userAgent,
          p_is_admin: isAdmin,
        });
      } catch {
        // nunca quebra a navegação por falha de analytics
      }
    })(),
  );
}

function nextWithPathname(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  let supabaseResponse = nextWithPathname(request);

  const pathname = request.nextUrl.pathname;

  // -- Rotas públicas: registra analytics e não toca em autenticação. --------
  const precisaAuth =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/painel") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/trocar-senha");

  if (!precisaAuth) {
    if (request.method === "GET" && ehRotaPublicaRegistravel(pathname)) {
      let sessionId = request.cookies.get("cpepa_sid")?.value;
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        supabaseResponse.cookies.set("cpepa_sid", sessionId, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
        });
      }
      try {
        registrarVisita(request, event, false, sessionId);
      } catch {
        // analytics nunca pode derrubar a navegação
      }
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = nextWithPathname(request);
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminPath = pathname.startsWith("/admin");
  const isAdminLogin = pathname.startsWith("/admin/login");
  const isAdminBlog = pathname === "/admin/blog" || pathname.startsWith("/admin/blog/");
  const isTrocarSenha = pathname.startsWith("/trocar-senha");
  const isAuthCallback = pathname.startsWith("/auth/callback");
  const isAuthLogin = pathname.startsWith("/auth/login");
  const isPainelPath = pathname.startsWith("/painel");

  const isAdmin = isAdminEmail(user?.email);

  // Troca obrigatória de senha no primeiro acesso.
  // Fonte de verdade: coluna deve_trocar_senha no banco (o JWT pode estar
  // defasado após a troca). Consultada só quando relevante.
  let mustChangePassword = user?.app_metadata?.must_change_password === true;
  if (
    user &&
    !isAdmin &&
    !isTrocarSenha &&
    !isAuthCallback &&
    !isAuthLogin &&
    !isAdminLogin
  ) {
    const { data: psi } = await supabase
      .from("psicanalistas")
      .select("deve_trocar_senha")
      .eq("user_id", user.id)
      .maybeSingle();
    if (psi) mustChangePassword = psi.deve_trocar_senha === true;
  }

  if (
    user &&
    mustChangePassword &&
    !isTrocarSenha &&
    !isAuthCallback &&
    !isAuthLogin &&
    !isAdminLogin
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/trocar-senha";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // já trocou a senha: não faz sentido ficar em /trocar-senha
  if (user && isTrocarSenha && !mustChangePassword) {
    const url = request.nextUrl.clone();
    url.pathname = isAdmin ? "/admin" : "/admin/blog";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isAdminLogin) {
    if (user && isAdmin) {
      const url = request.nextUrl.clone();
      const redirectTo = request.nextUrl.searchParams.get("redirectTo");
      url.pathname = redirectTo && redirectTo.startsWith("/admin") ? redirectTo : "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }
    if (user) {
      // usuário autenticado não-admin (ex.: autor de blog): manda para a área de blog
      const url = request.nextUrl.clone();
      url.pathname = "/admin/blog";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  if (isAdminPath) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }

    // autores (não-admin) só acessam a área do blog
    if (!isAdmin && !isAdminBlog) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/blog";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  if (isAuthCallback) {
    return supabaseResponse;
  }

  if (isAuthLogin) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isPainelPath) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
