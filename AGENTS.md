<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Deploy (Cloudflare Workers via OpenNext)

- Comandos: `npm run deploy` (`opennextjs-cloudflare build && opennextjs-cloudflare deploy`), `npm run upload`, `npm run preview`.
- Autenticação: `CLOUDFLARE_API_TOKEN` (env var). Conta `3a42d7ec731a9747746418397d72f834`, worker `cepepa-site`.
- URL de produção: https://cepepa-site.cepepasite.workers.dev
- **Windows: symlink EPERM.** `@opennextjs/aws` usa `symlinkSync` ao rastrear módulos; sem admin/Developer Mode o build falha com `EPERM: operation not permitted, symlink`. Patch aplicado em `node_modules/@opennextjs/aws/dist/build/copyTracedFiles.js` (no ramo do symlink, cai em `cpSync(from, to, { recursive: true, force: true, dereference: true })`). **Este patch se perde a cada `npm install`** — reaplique-o ou, preferencialmente, faça o build em WSL/CI Linux.
- Antes do build, encerre `next dev`/`workerd` e remova `.open-next` (arquivos travados causam `EPERM` na limpeza): processos `node` do `next dev` e `workerd.exe` do projeto seguram `.open-next`.
- Sanitização de HTML no servidor usa `sanitize-html` (puro JS, compatível com Workers). **Não reintroduza `isomorphic-dompurify`** — ele puxa `jsdom`, que não funciona bem no Workers e complica o bundle.

## Blog

- Schema: tabelas `categorias` e `posts` (Supabase), bucket `blog` no Storage, função SQL `is_admin()`. Migration: `supabase/migrations/20261020000001_blog.sql`.
- Autorização: `is_admin()` consulta a tabela `public.admins` (fonte única no banco). Allowlist do app em `src/lib/admin-emails.ts` deve ficar sincronizada com `public.admins`.
- Leitura pública só de `status = 'publicado'`; escrita por admin. Preview de rascunho em `/blog/[slug]` para admin logado ou autor do post.
- Admin: `/admin/blog` (CRUD de posts + categorias), editor TipTap client-only (não entra no bundle público).
- Plano completo: `PLANO_BLOG_CPEPA.md`.

## Autores de blog (psicanalistas)

- Feature: psicanalistas cadastrados com e-mail podem receber acesso para publicar **os próprios** textos. Migration: `supabase/migrations/20261021000001_blog_autores.sql`.
- Colunas em `psicanalistas`: `acesso_blog` (habilita), `deve_trocar_senha`, `acesso_criado_em`. `posts.autor_id` → `auth.users` identifica o dono do post.
- Função SQL `pode_postar()` + policies de `posts` (`autor_select/insert/update/delete_own_posts`) e Storage. Autor só edita/exclui posts com `autor_id = auth.uid()`; admin gerencia tudo.
- Edge Function `supabase/functions/criar-acesso-blog` (service_role, deploy `--no-verify-jwt`): ações `criar` (cria/reusa usuário com senha `123mudar`, `app_metadata.must_change_password=true`), `resetar` e `confirmar_senha` (próprio usuário limpa a flag). Exige admin (exceto `confirmar_senha`).
- Botão **Criar acesso / Resetar senha / Revogar** em `/admin/psicanalistas`. Revogar mantém os posts já publicados.
- Login: usuário entra em `/admin/login` (a rota libera `/admin/blog` para autores). Primeiro acesso redireciona para `/trocar-senha` (gate via `app_metadata.must_change_password` no `src/proxy.ts`).
- `src/proxy.ts` injeta header `x-pathname` para o layout `admin/(protected)/layout.tsx` decidir entre admin e autor.

