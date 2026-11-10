"use client";

import { createClient } from "@/lib/supabase/client";

const MAX_SIZE = 5 * 1024 * 1024;

function extensao(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

export async function uploadImagemBlog(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("O arquivo precisa ser uma imagem.");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("A imagem deve ter no máximo 5 MB.");
  }

  const supabase = createClient();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensao(file)}`;

  const { error } = await supabase.storage
    .from("blog")
    .upload(path, file, { cacheControl: "31536000", upsert: false });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from("blog").getPublicUrl(path);
  return data.publicUrl;
}
