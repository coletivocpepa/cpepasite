import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SENHA_PADRAO = "123mudar";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

interface Payload {
  psicanalista_id?: string;
  acao?: "criar" | "resetar" | "confirmar_senha";
}

function corsHeaders(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, apikey, x-client-info, x-supabase-api-version",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body: unknown, status: number, origin?: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin") ?? undefined;

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return json({ status: "erro", codigo: "metodo_invalido" }, 405, origin);
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return json({ status: "erro", codigo: "nao_autenticado" }, 401, origin);
    }

    // valida o chamador
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return json({ status: "erro", codigo: "nao_autenticado" }, 401, origin);
    }

    const body = (await req.json()) as Payload;
    const acao = body.acao ?? "criar";

    // o próprio usuário confirma a troca de senha no primeiro acesso
    if (acao === "confirmar_senha") {
      const { error: err } = await admin.auth.admin.updateUserById(userData.user.id, {
        app_metadata: { must_change_password: false, role: "blog_autor" },
      });
      if (err) {
        return json({ status: "erro", codigo: "falha_confirmar", detalhe: err.message }, 500, origin);
      }
      await admin
        .from("psicanalistas")
        .update({ deve_trocar_senha: false })
        .eq("user_id", userData.user.id);
      return json({ status: "ok", acao: "confirmar_senha" }, 200, origin);
    }

    // demais ações exigem admin
    const chamadorEmail = userData.user.email.toLowerCase();
    const { data: adminRow } = await admin
      .from("admins")
      .select("email")
      .eq("email", chamadorEmail)
      .maybeSingle();

    if (!adminRow) {
      return json({ status: "erro", codigo: "sem_permissao" }, 403, origin);
    }

    if (!body.psicanalista_id) {
      return json({ status: "erro", codigo: "dados_invalidos" }, 400, origin);
    }

    const { data: psi, error: psiError } = await admin
      .from("psicanalistas")
      .select("id, nome, email, user_id, acesso_blog")
      .eq("id", body.psicanalista_id)
      .single();

    if (psiError || !psi) {
      return json({ status: "erro", codigo: "psicanalista_nao_encontrado" }, 404, origin);
    }

    if (!psi.email) {
      return json({ status: "erro", codigo: "sem_email" }, 400, origin);
    }

    const email = psi.email.toLowerCase();

    // RESETAR senha de acesso existente
    if (acao === "resetar") {
      if (!psi.user_id) {
        return json({ status: "erro", codigo: "sem_acesso" }, 400, origin);
      }

      const { error: updateAuthError } = await admin.auth.admin.updateUserById(psi.user_id, {
        password: SENHA_PADRAO,
        app_metadata: { must_change_password: true, role: "blog_autor" },
      });

      if (updateAuthError) {
        return json({ status: "erro", codigo: "falha_reset", detalhe: updateAuthError.message }, 500, origin);
      }

      await admin
        .from("psicanalistas")
        .update({ deve_trocar_senha: true })
        .eq("id", psi.id);

      return json({ status: "ok", acao: "resetar", email }, 200, origin);
    }

    // CRIAR acesso (ou reutilizar user existente)
    if (psi.user_id) {
      // já tem acesso: trata como reset
      const { error: updateAuthError } = await admin.auth.admin.updateUserById(psi.user_id, {
        password: SENHA_PADRAO,
        app_metadata: { must_change_password: true, role: "blog_autor" },
      });

      if (updateAuthError) {
        return json({ status: "erro", codigo: "falha_reset", detalhe: updateAuthError.message }, 500, origin);
      }

      await admin
        .from("psicanalistas")
        .update({ acesso_blog: true, deve_trocar_senha: true, acesso_criado_em: new Date().toISOString() })
        .eq("id", psi.id);

      return json({ status: "ok", acao: "resetar", email }, 200, origin);
    }

    // procura um usuário auth existente com esse e-mail
    const { data: listData } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existente = listData?.users?.find((u) => u.email?.toLowerCase() === email);

    let userId: string;

    if (existente) {
      userId = existente.id;
      const { error: updateAuthError } = await admin.auth.admin.updateUserById(userId, {
        password: SENHA_PADRAO,
        app_metadata: { must_change_password: true, role: "blog_autor" },
      });
      if (updateAuthError) {
        return json({ status: "erro", codigo: "falha_reset", detalhe: updateAuthError.message }, 500, origin);
      }
    } else {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: SENHA_PADRAO,
        email_confirm: true,
        app_metadata: { must_change_password: true, role: "blog_autor" },
      });

      if (createError || !created.user) {
        return json({ status: "erro", codigo: "falha_criar", detalhe: createError?.message }, 500, origin);
      }

      userId = created.user.id;
    }

    // vincula e habilita acesso no registro do psicanalista
    const { error: linkError } = await admin
      .from("psicanalistas")
      .update({
        user_id: userId,
        acesso_blog: true,
        deve_trocar_senha: true,
        acesso_criado_em: new Date().toISOString(),
      })
      .eq("id", psi.id);

    if (linkError) {
      return json({ status: "erro", codigo: "falha_vincular", detalhe: linkError.message }, 500, origin);
    }

    return json({ status: "ok", acao: "criar", email }, 200, origin);
  } catch (err) {
    console.error("Erro criar-acesso-blog:", err);
    return json({ status: "erro", codigo: "erro_interno" }, 500, origin);
  }
});
