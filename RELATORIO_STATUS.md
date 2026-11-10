# Relatório de Status - Projeto CPEPA

**Data:** 12/09/2026  
**Projeto:** Site institucional do CPEPA (Coletivo Psicanalítico de Escuta de Pais de Autistas)  
**Stack:** Next.js 16.3.4 + Supabase + Cloudflare Workers

---

## ✅ Concluído

### Etapa 1 - Home/Landing Page
- [x] Hero com nome completo e frase central
- [x] Seções: Manifesto, O que é o CPEPA, A Escuta, Para Pais, Como Funciona, Valor Simbólico, Quem Somos, FAQ
- [x] CTA "Quero ser escutado" → `/solicitar-escuta`
- [x] Responsivo, acessível, SEO básico

### Etapa 2 - Cadastro de Responsáveis + Solicitação de Escuta
- [x] Página `/solicitar-escuta` com formulário completo
- [x] Validação client-side + server-side
- [x] Edge Function `solicitar-escuta` (Deno, service_role)
- [x] Inserção em `responsaveis` + `solicitacoes` transacional
- [x] Tratamento de email duplicado (código 23505)
- [x] Redirecionamento para `/minhas-solicitacoes?resp=<id>`

### Etapa 3 - Schema Supabase + RLS
- [x] 5 tabelas: `responsaveis`, `solicitacoes`, `psicanalistas`, `disponibilidades`, `indicacoes`
- [x] Enums: `modalidade`, `tipo_relacao`, `status_solicitacao`, `status_disponibilidade`, `status_indicacao`
- [x] RLS ativo em todas as tabelas
- [x] Policies: `anon` insert público, `authenticated` own data
- [x] RPC `solicitar_escuta` (SECURITY DEFINER) para encapsular lógica

### Etapa 4 - Match Automático
- [x] Edge Function `match-solicitacoes` (Deno, service_role)
- [x] Cruzamento: `solicitacoes` × `disponibilidades` (dia + faixa horária + modalidade)
- [x] Criação de `indicacoes` com status `pendente`
- [x] Evita duplicatas (verifica `indicacoes` existente)

### Etapa 5 - Acompanhamento do Responsável
- [x] Página `/minhas-solicitacoes?resp=<id>`
- [x] Fetch direto da Edge Function `match-solicitacoes`
- [x] Cards de match com:
  - Botão **WhatsApp** (`wa.me/55<telefone>`)
  - Link **Ver perfil** → `/psicanalistas/[id]`
- [x] Agrupamento por solicitação

### Etapa 6 - Painel Admin (`/admin/*`)
| Sub-página | Funcionalidades |
|------------|-----------------|
| `/admin` | Dashboard com 6 cards de estatísticas |
| `/admin/solicitacoes` | Listagem paginada, filtro por status, select inline para alterar status |
| `/admin/indicacoes` | Listagem paginada, filtro por status, botões Aceitar/Recusar |
| `/admin/psicanalistas` | CRUD completo, toggle ativo/inativo, modalidades checkbox |
| `/admin/conteudo` | CMS chave-valor (chave, título, conteúdo, tipo) |
| `/admin/faq` | CRUD FAQ (pergunta, resposta, categoria, ordem, ativo) |
| `/admin/login` | Login email/senha + magic link (redirectTo) |
| `/auth/callback` | Callback OAuth |

**Auth Admin:** Middleware protege `/admin/*` e `/painel/*` — só emails `admin@cpepa.org` e `coordenacao@cpepa.org` têm acesso.

### Deploy Cloudflare Workers
- [x] `@opennextjs/cloudflare` + `wrangler`
- [x] `wrangler.jsonc` com `nodejs_compat`, `global_fetch_strictly_public`
- [x] Worker publicado: `https://cepepa-site.cepepasite.workers.dev`
- [x] Variáveis de ambiente (Supabase URL + Anon Key) no Worker
- [x] Assets estáticos servidos via Workers Assets

---

## 🔧 Pendências / Debt Técnico

| Item | Prioridade | Notas |
|------|------------|-------|
| **Match duplicado** na Edge Function `match-solicitacoes` | **Alta** | Cria 2 registros por match (bug no insert duplo) |
| **Windows + OpenNext** warnings | Média | Builds em Windows instáveis; recomenda WSL/CI Linux |
| **Middleware `middleware.ts`** deprecated (Next 16) | Baixa | Migrar para `proxy.ts` (`npx @next/codemod@canary middleware-to-proxy`) |
| **CI/CD** ausente | Média | Deploy manual via token; falta GitHub Actions + OIDC |
| **Domínio customizado** | Baixa | Apontar `cpepa.org` → Worker |
| **Testes E2E** ausentes | Média | Cypress/Playwright para fluxos críticos |
| **SEO avançado** (sitemap, robots, OG) | Baixa | Etapa 7 do plano original |

---

## 📦 Arquitetura Atual

| Camada | Tech |
|--------|------|
| Frontend | Next.js 16.3.4 (App Router, TS, Tailwind v4) |
| Backend/API | Supabase (Postgres, Auth, Edge Functions Deno) |
| Deploy | Cloudflare Workers via `@opennextjs/cloudflare` |
| Auth | Supabase Auth (email/senha + magic link OTP) |
| RLS | Políticas por tabela (`anon` insert, `authenticated` own data) |
| Formulário público | Browser → Edge Function `solicitar-escuta` (service_role) |
| Match | Edge Function `match-solicitacoes` (service_role) |
| Admin | Middleware (`/admin/*`, `/painel/*`) + Server Components |

---

## 🎯 Próximos Passos Sugeridos

1. **Corrigir match duplicado** na Edge Function `match-solicitacoes` (remover insert duplo)
2. **Migrar middleware** para `proxy.ts` (Next 16)
3. **Criar CI/CD** (GitHub Actions + Wrangler OIDC + Supabase CLI)
4. **Domínio customizado** + SSL
5. **Etapa 5** do plano original: páginas institucionais completas (O CPEPA, A Escuta, Para Pais, Como Funciona, Valor Simbólico, Quem Somos, FAQ)

---

## 📁 Estrutura de Pastas Relevante

```
cepepasite/
├── src/
│   ├── app/
│   │   ├── admin/                 # Painel admin completo
│   │   ├── auth/                  # Login, callback
│   │   ├── minhas-solicitacoes/   # Acompanhamento do responsável
│   │   ├── psicanalistas/         # Listagem + perfil público
│   │   ├── solicitar-escuta/      # Formulário público
│   │   ├── layout.tsx
│   │   └── page.tsx               # Home
│   ├── components/                # Header, Footer, sections
│   └── lib/supabase/              # Clients (client/server) + types
├── supabase/
│   ├── functions/
│   │   ├── solicitar-escuta/      # Edge Function (inserção)
│   │   └── match-solicitacoes/    # Edge Function (match)
│   └── migrations/                # Schema + RLS + triggers
├── .github/workflows/             # (futuro) CI/CD
├── wrangler.jsonc                 # Config Cloudflare Workers
├── open-next.config.ts            # Config OpenNext
└── package.json
```

---

## 🔗 Links Úteis

- **Produção:** https://cepepa-site.cepepasite.workers.dev
- **Supabase Dashboard:** https://supabase.com/dashboard/project/xeglpwjgyyzzfqurdauf
- **Cloudflare Dashboard:** https://dash.cloudflare.com/3a42d7ec731a9747746418397d72f834
- **Plano original:** `PLANO_SITE_CPEPA.md`
- **Documento conceitual:** `CPEPA_Documento_Conceitual.md`

---

*Relatório gerado automaticamente para continuidade do desenvolvimento.*