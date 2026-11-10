"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="inline-flex items-center gap-1 rounded-full border border-brand-200 px-4 py-1.5 text-sm font-semibold text-brand-800 transition-colors hover:border-brand-800 hover:bg-brand-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? "Saindo..." : "Sair"}
    </button>
  );
}