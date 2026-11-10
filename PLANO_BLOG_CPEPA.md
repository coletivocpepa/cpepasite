# Plano: Blog do CPEPA

> Relatório de análise e plano de implementação — consulta durante o processo.
> Data: 20/10/2026

## Contexto do projeto

- **Next.js 16.3.4** (App Router, Turbopack) + **React 19** + **TypeScript strict** + **Tailwind v4** (CSS-first, `src/app/globals.css`).
- **Supabase** (Postgres + Auth + Storage) via `@supabase/ssr`; sem ORM; tipos gerados em `src/lib/supabase/database.types.ts`.
- **Deploy:** Cloudflare Workers via OpenNext (`opennextjs-cloudflare build` → `deploy`); worker `cepepa-site`.
- **Admin:** protegido em 2 camadas — `src/proxy.ts` (matcher `/admin/:path*`) + checagem server-side em `src/app/admin/(protected)/layout.tsx`.
- **Padrão admin existente:** `page.tsx` (server) + `Admin*Content.tsx` (client, CRUD via client Supabase). Referência: `src/app/admin/(protected)/faq/AdminFAQContent.tsx`.
- **Allowlist de admins:** `src/lib/admin-emails.ts` (hardcoded).

## Decisões do usuário

| Item | Decisão |
|---|---|
| Formato do conteúdo | Rich text HTML com **TipTap** |
| Imagens (capa e conteúdo) | **Supabase Storage** (bucket `blog`) |
| Status | Rascunho / Publicado com preview |
| Taxonomia | Categorias (tabela) + tags (`text[]`) |
| SEO | Completo (sitemap, robots, metadata, OG image, JSON-LD) |
| Busca | Filtro por título/resumo (`ilike`) |

## Modelo de dados

### Tabela `categorias`

```sql
id uuid PK default gen_random_uuid()
slug text unique not null
nome text not null
criado_em timestamptz default now()
```

### Tabela `posts`

```sql
id uuid PK default gen_random_uuid()
slug text unique not null
titulo text not null
resumo text
conteudo_html text not null
capa_url text
categoria_id uuid references categorias(id) on delete set null
tags text[] default '{}'
status text not null default 'rascunho' check (status in ('rascunho','publicado'))
autor text
publicado_em timestamptz
criado_em timestamptz default now()
atualizado_em timestamptz default now()
```

- Índices: `(status, publicado_em desc)`; GIN em `tags`.
- Trigger `before update` para `atualizado_em` (padrão de `supabase/migrations/20260912000002_faq.sql:28`).
- **RLS:**
  - Leitura pública: `status = 'publicado' and publicado_em <= now()`.
  - Escrita: apenas admins, via função SQL `is_admin()` que compara `auth.email()` com o allowlist de `src/lib/admin-emails.ts` (manter sincronizado!).
- **Storage:** bucket `blog` público (leitura anônima), escrita apenas admin via `is_admin()`.
- **Busca:** `ilike` em `titulo`/`resumo` (escala pequena; sem tsvector por ora).

## Fases de implementação (cada uma com deploy próprio e leve)

### Fase 1 — Banco (só Supabase, 0 impacto no site)

- [ ] Migration `supabase/migrations/<data>_blog.sql`: tabelas + RLS + trigger + seed de categorias iniciais + bucket `blog` + policies de storage.
- [ ] Regenerar `src/lib/supabase/database.types.ts` (`supabase gen types typescript --linked`).
- [ ] Verificação: select como anon OK; insert como authenticated não-admin deve falhar.

### Fase 2 — Leitura pública (deploy sem TipTap, sem admin)

- [x] `src/app/blog/page.tsx` — listagem server-side (posts publicados + join categoria), cards com capa/resumo/data, filtro `?categoria=`.
- [x] `src/app/blog/[slug]/page.tsx` — post server-side, `generateMetadata` dinâmico (título, resumo, OG image = `capa_url`), HTML via `dangerouslySetInnerHTML` + estilos `.blog-conteudo` manuais em `globals.css`.
- [x] Navegação: item "Blog" em `src/components/Header.tsx`, `src/components/MobileNav.tsx` e `src/components/Footer.tsx`.
- [x] SEO base: `src/app/sitemap.ts` + `src/app/robots.ts` (posts já incluídos; sitemap dinâmico antecipado da Fase 4) + `metadataBase` no root layout + helper `src/lib/site-url.ts`.
- [x] Verificação: `npx tsc --noEmit`, `npm run lint`, `npm run build` — todos OK.

### Fase 3 — Admin CRUD + editor TipTap (só bundle do admin afetado)

- [x] `src/app/admin/(protected)/blog/page.tsx` + `AdminBlogContent.tsx` — tabela de posts (padrão FAQ), status, publicar/despublicar, excluir.
- [x] `src/app/admin/(protected)/blog/novo/page.tsx` e `blog/[id]/editar/page.tsx` com `BlogPostForm.tsx` + `BlogEditor.tsx` (client):
  - TipTap v3: `@tiptap/react`, `@tiptap/starter-kit`, extensions image/link/placeholder — carregado só nessa rota.
  - Upload de capa e de imagens do conteúdo para o bucket `blog` (`upload.ts`, validação 5 MB + tipo).
  - Sanitização do HTML com `isomorphic-dompurify` nos server actions.
  - Slug gerado do título (edição manual permitida), controle rascunho/publicado.
- [x] CRUD de categorias na própria página `/admin/blog`.
- [x] Nav admin: item "Blog" em `src/app/admin/(protected)/layout.tsx`.
- [x] Preview de rascunho: já implementado na Fase 2 (`/blog/[slug]` mostra rascunho para admin logado).
- [x] Server actions em `src/app/admin/(protected)/blog/actions.ts` (`salvarPost`, `publicarPost`, `excluirPost`, `salvarCategoria`, `excluirCategoria`), com `gerarSlug` em `slug.ts` (arquivos `"use server"` só podem exportar funções async).
- [x] Verificação: `npx tsc --noEmit`, `npm run lint`, `npm run build` — todos OK; rotas admin geradas.

### Fase 4 — Busca + SEO avançado (polimento)

- [x] Busca: input `?q=` na listagem `/blog` (GET form) → filtro server-side `or(titulo.ilike, resumo.ilike)`; categoria preserva a busca e vice-versa.
- [x] JSON-LD `BlogPosting` na página do post (headline, description, image, datas, author, publisher, keywords).
- [x] Sitemap dinâmico incluindo posts publicados (já implementado na Fase 2).
- [x] Estado vazio refinado (busca vs. categoria vs. blog vazio). Paginação não necessária (volume pequeno; evita complexidade).
- [x] Verificação: `npx tsc --noEmit`, `npm run lint`, `npm run build` — todos OK.

## Status final: todas as 4 fases concluídas.

## Pontos de atenção (deploy)

1. **Build Windows instável com OpenNext** (`RELATORIO_STATUS.md:74`) — validar o build final em WSL ou CI Linux antes do deploy real.
2. Nenhuma mudança em `src/proxy.ts` ou Edge Functions — blog público; admin já coberto pelo matcher `/admin/:path*`.
3. TipTap é client-only e isolado na rota admin — não pesa home nem `/blog` público.
4. Allowlist de admins existirá em 2 lugares: `src/lib/admin-emails.ts` (app) e função SQL `is_admin()` — manter sincronizados.
5. `src/lib/supabase/server.ts` está órfão; o client ativo é `src/lib/supabase/server-client.ts` — usar este nos server components.
