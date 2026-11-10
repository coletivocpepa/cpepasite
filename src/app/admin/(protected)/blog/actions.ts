"use server";

import { revalidatePath } from "next/cache";
import sanitizeHtml from "sanitize-html";
import type { StatusPost } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { ADMIN_EMAILS } from "@/lib/admin-emails";
import { gerarSlug } from "./slug";

export type BlogActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  id?: string;
};

const STATUS_VALIDOS: StatusPost[] = ["rascunho", "publicado"];

interface Acesso {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  userId: string;
  isAdmin: boolean;
  nome: string | null;
}

/**
 * Exige admin OU autor de blog (psicanalista habilitado). Retorna o contexto
 * para que cada ação aplique as regras de posse. A RLS do banco é a última
 * linha de defesa (bloqueia edição de posts de terceiros).
 */
async function exigirAcesso(): Promise<Acesso> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado");

  const isAdmin = ADMIN_EMAILS.includes(user.email ?? "");

  if (isAdmin) {
    return { supabase, userId: user.id, isAdmin, nome: null };
  }

  const { data: psi } = await supabase
    .from("psicanalistas")
    .select("nome, acesso_blog, ativo")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!psi || !psi.acesso_blog || !psi.ativo) {
    throw new Error("Não autorizado");
  }

  return { supabase, userId: user.id, isAdmin, nome: psi.nome };
}

async function exigirAdmin(): Promise<Acesso> {
  const acesso = await exigirAcesso();
  if (!acesso.isAdmin) throw new Error("Não autorizado");
  return acesso;
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function sanitizarHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "hr",
      "strong",
      "em",
      "s",
      "u",
      "h2",
      "h3",
      "h4",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "img",
      "code",
      "pre",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https"],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer",
        target: "_blank",
      }),
    },
  });
}

export async function salvarPost(
  _prev: BlogActionState,
  formData: FormData,
): Promise<BlogActionState> {
  let acesso: Acesso;
  try {
    acesso = await exigirAcesso();
  } catch {
    return { status: "error", message: "Sessão expirada. Faça login novamente." };
  }

  const { supabase, userId, isAdmin, nome } = acesso;

  const id = String(formData.get("id") ?? "").trim();
  const titulo = String(formData.get("titulo") ?? "").trim();
  const resumo = String(formData.get("resumo") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const conteudoHtmlRaw = String(formData.get("conteudo_html") ?? "");
  const capaUrl = String(formData.get("capa_url") ?? "").trim();
  const categoriaId = String(formData.get("categoria_id") ?? "").trim();
  const autorInput = String(formData.get("autor") ?? "").trim();
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const status = String(formData.get("status") ?? "rascunho") as StatusPost;

  if (!titulo) {
    return { status: "error", message: "O título é obrigatório." };
  }

  if (!STATUS_VALIDOS.includes(status)) {
    return { status: "error", message: "Status inválido." };
  }

  const slug = gerarSlug(slugInput || titulo);
  if (!slug) {
    return { status: "error", message: "Não foi possível gerar um slug válido." };
  }

  const conteudo_html = sanitizarHtml(conteudoHtmlRaw);
  if (!conteudo_html.replace(/<[^>]*>/g, "").trim()) {
    return { status: "error", message: "O conteúdo não pode estar vazio." };
  }

  // autor não-admin sempre assina com o próprio nome
  const autor = isAdmin ? autorInput || null : nome || autorInput || null;

  const payload = {
    slug,
    titulo,
    resumo: resumo || null,
    conteudo_html,
    capa_url: capaUrl || null,
    categoria_id: categoriaId || null,
    tags,
    status,
    autor,
  };

  if (id) {
    // ao editar, autor só pode mexer no próprio post
    if (!isAdmin) {
      const { data: existente } = await supabase
        .from("posts")
        .select("autor_id")
        .eq("id", id)
        .maybeSingle();

      if (!existente || existente.autor_id !== userId) {
        return { status: "error", message: "Você não pode editar este texto." };
      }
    }

    const { data, error } = await supabase
      .from("posts")
      .update(payload)
      .eq("id", id)
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { status: "error", message: "Já existe um post com esse slug." };
      }
      console.error("[salvarPost] error:", error);
      return { status: "error", message: "Erro ao salvar o post." };
    }

    revalidatePath("/blog");
    revalidatePath("/admin/blog");
    revalidatePath(`/blog/${slug}`);
    revalidatePath("/sitemap.xml");

    return { status: "success", message: "Post salvo.", id: data.id };
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({ ...payload, autor_id: userId })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { status: "error", message: "Já existe um post com esse slug." };
    }
    console.error("[salvarPost] error:", error);
    return { status: "error", message: "Erro ao salvar o post." };
  }

  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");

  return { status: "success", message: "Post salvo.", id: data.id };
}

export async function publicarPost(
  id: string,
  status: StatusPost,
): Promise<BlogActionState> {
  let acesso: Acesso;
  try {
    acesso = await exigirAcesso();
  } catch {
    return { status: "error", message: "Sessão expirada." };
  }

  const { supabase, userId, isAdmin } = acesso;

  if (!isAdmin) {
    const { data: existente } = await supabase
      .from("posts")
      .select("autor_id")
      .eq("id", id)
      .maybeSingle();

    if (!existente || existente.autor_id !== userId) {
      return { status: "error", message: "Você não pode alterar este texto." };
    }
  }

  const { error } = await supabase
    .from("posts")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("[publicarPost] error:", error);
    return { status: "error", message: "Erro ao alterar o status." };
  }

  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  revalidatePath("/sitemap.xml");
  return { status: "success" };
}

export async function excluirPost(id: string): Promise<BlogActionState> {
  let acesso: Acesso;
  try {
    acesso = await exigirAcesso();
  } catch {
    return { status: "error", message: "Sessão expirada." };
  }

  const { supabase, userId, isAdmin } = acesso;

  if (!isAdmin) {
    const { data: existente } = await supabase
      .from("posts")
      .select("autor_id")
      .eq("id", id)
      .maybeSingle();

    if (!existente || existente.autor_id !== userId) {
      return { status: "error", message: "Você não pode excluir este texto." };
    }
  }

  const { error } = await supabase.from("posts").delete().eq("id", id);

  if (error) {
    console.error("[excluirPost] error:", error);
    return { status: "error", message: "Erro ao excluir o post." };
  }

  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  revalidatePath("/sitemap.xml");
  return { status: "success" };
}

export async function salvarCategoria(
  _prev: BlogActionState,
  formData: FormData,
): Promise<BlogActionState> {
  let supabase;
  try {
    supabase = (await exigirAdmin()).supabase;
  } catch {
    return { status: "error", message: "Sessão expirada." };
  }

  const id = String(formData.get("id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();

  if (!nome) return { status: "error", message: "Informe o nome da categoria." };

  const slug = gerarSlug(slugInput || nome);
  if (!slug) return { status: "error", message: "Slug inválido." };

  const query = id
    ? supabase.from("categorias").update({ nome, slug }).eq("id", id).select("id").single()
    : supabase.from("categorias").insert({ nome, slug }).select("id").single();

  const { data, error } = await query;

  if (error) {
    if (error.code === "23505") {
      return { status: "error", message: "Já existe uma categoria com esse slug." };
    }
    console.error("[salvarCategoria] error:", error);
    return { status: "error", message: "Erro ao salvar a categoria." };
  }

  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  return { status: "success", id: data.id };
}

export async function excluirCategoria(id: string): Promise<BlogActionState> {
  let supabase;
  try {
    supabase = (await exigirAdmin()).supabase;
  } catch {
    return { status: "error", message: "Sessão expirada." };
  }

  const { error } = await supabase.from("categorias").delete().eq("id", id);

  if (error) {
    console.error("[excluirCategoria] error:", error);
    return { status: "error", message: "Erro ao excluir a categoria." };
  }

  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  return { status: "success" };
}
