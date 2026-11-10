# Analytics de visitas (CPEPA)

Sistema de analytics **first-party** (sem serviços externos), que registra as
visitas às páginas públicas do site e exibe as métricas na área administrativa
em `/admin/analytics`.

## Visão geral

- **Captura:** no middleware (`src/proxy.ts`), no servidor, para todas as rotas
  públicas. Nenhum JavaScript adicional é enviado ao cliente e não é afetado por
  adblockers.
- **Armazenamento:** tabela `public.visitas` no Supabase (uma linha por
  pageview).
- **Leitura/agregação:** funções SQL `security definer` restritas a admins
  (`public.is_admin()`).
- **Visualização:** página `/admin/analytics` com cards de resumo, gráfico de
  visitas por dia e tabela de páginas mais vistas (filtros de 7/30/90 dias).

## Fluxo

```
Navegação pública (GET)
        │
        ▼
src/proxy.ts  ── cria/recupera cookie cpepa_sid (visitante único, 365 dias)
        │      ── ignora bots, /admin, /auth, /painel, /api, assets
        │      ── chama RPC registrar_visita() em fire-and-forget
        ▼
Supabase  public.visitas  (1 linha por pageview, is_admin = false)
        │
        ▼
/admin/analytics (server component)
        │      ── RPC resumo_visitas / visitas_por_dia / paginas_mais_vistas
        ▼
AdminAnalyticsContent.tsx (cards + gráfico + tabela)
```

## Arquivos

| Arquivo | Papel |
| --- | --- |
| `supabase/migrations/20261022000001_analytics_visitas.sql` | Tabela `visitas`, RLS e funções RPC |
| `supabase/migrations/20261022000002_analytics_seguranca.sql` | Permissões das RPCs, guarda `is_admin()`, descarte de scanner e limpeza |
| `supabase/migrations/20261022000003_analytics_rpc_sql.sql` | RPCs de leitura em SQL puro (com trava `is_admin()`) |
| `supabase/migrations/20261022000004_analytics_slug_blog.sql` | `/blog/<slug>` só é registrado se o post existir e estiver publicado |
| `src/proxy.ts` | Captura de pageviews (middleware/server-side) |
| `src/lib/supabase/database.types.ts` | Tipos manuais de `visitas` e das RPCs |
| `src/app/admin/(protected)/analytics/page.tsx` | Server component que busca os dados |
| `src/app/admin/(protected)/analytics/AdminAnalyticsContent.tsx` | UI (cards, gráfico, tabela) |
| `src/app/admin/(protected)/layout.tsx` | Item de navegação "Visitas" |
| `src/app/admin/(protected)/AdminDashboardContent.tsx` | Ação rápida "Ver visitas do site" |

## Banco de dados

### Tabela `public.visitas`

| Coluna | Tipo | Descrição |
| --- | --- | --- |
| `id` | `bigint` (identity) | Chave primária |
| `path` | `text` | Caminho visitado (sem querystring) |
| `referrer` | `text` | Referer da requisição (até 400 chars) |
| `session_id` | `text` | ID do visitante (cookie `cpepa_sid`, 64 chars) |
| `user_agent` | `text` | User-agent (até 400 chars) |
| `is_admin` | `boolean` | Marca tráfego de admin (hoje sempre `false` nas capturas públicas) |
| `created_at` | `timestamptz` | Momento da visita |

Índices: `visitas_created_at_idx (created_at desc)`, `visitas_path_idx (path)`.

### RLS

- `admin_read_visitas` — **select** para `authenticated` somente quando
  `is_admin()`.
- **Não há policy de insert** para `anon`/`authenticated`. A inserção acontece
  exclusivamente pela RPC `registrar_visita()` (SECURITY DEFINER), executável por
  `anon` e `authenticated`.

### Funções RPC

- `registrar_visita(p_path, p_referrer, p_session_id, p_user_agent, p_is_admin)`
  → `void`. Grava uma visita; trunca o path no `?` e limita os campos de texto.
  Descarta paths de varredura de vulnerabilidade (dotfiles, `.env*`, `phpinfo.php`,
  dumps, sondas de CMS/infra) e, no caso de `/blog/<slug>`, só grava se existir
  post publicado com aquele slug. `grant execute` para `anon, authenticated`
  (o middleware roda no Worker e só tem a chave pública `anon`).
- `visitas_por_dia(p_dias default 30)` → `(dia date, total bigint, unicos bigint)`.
  Agrupa por dia (fuso `America/Sao_Paulo`), ignorando `is_admin = true`.
- `paginas_mais_vistas(p_dias default 30, p_limite default 20)`
  → `(path text, total bigint, unicos bigint)`. Ranking por página.
- `resumo_visitas(p_dias default 30)`
  → `(total bigint, unicos bigint, hoje bigint, ultimos_7_dias bigint)`.

As três funções de leitura são `security definer` (portanto ignoram a RLS da
tabela `visitas`) e por isso:

- exigem `public.is_admin()` no corpo: quem não for admin recebe conjunto vazio
  (zero visits, ranking vazio);
- têm o `EXECUTE` revogado de `public` e de `anon` — só `authenticated`
  (e o admin logado) consegue chamá-las. Chamadas anônimas recebem
  `401 / 42501 permission denied`.

> Sem esse endurecimento, a chave `anon` (pública, vai no bundle do site)
> permitia ler as métricas de visita de qualquer visitante e injetar
> registros falsos chamando `registrar_visita`.

## Captura no middleware (`src/proxy.ts`)

- O `matcher` cobre todas as rotas exceto `_next/static`, `_next/image` e
  `favicon.ico`.
- Rotas que exigem autenticação (`/admin`, `/painel`, `/auth`, `/trocar-senha`)
  seguem o fluxo normal e **não** geram visita.
- Rotas públicas fazem curto-circuito: registram a visita e retornam sem tocar no
  Supabase Auth.
- Filtros aplicados antes de gravar:
  - apenas `GET`;
  - ignora `/admin`, `/auth`, `/painel`, `/trocar-senha`, `/api`, `/_next`,
    `/robots.txt`, `/sitemap.xml` e arquivos com extensão estática;
  - ignora user-agents de bots (`bot`, `crawler`, `spider`, `slurp`,
    `bingpreview`, `facebookexternalhit`, `preview`);
  - **só registra páginas reais do site**: a lista `ROTAS_PUBLICAS`
    (`src/proxy.ts`) cobre `/`, `/solicitar-escuta`, `/minhas-solicitacoes`,
    `/blog`, `/blog/[slug]`, `/psicanalistas` e `/psicanalistas/[id]`.
    Qualquer outro path é 404 e não entra;
  - descarta paths de varredura de vulnerabilidade (dotfiles, `.env*`,
    `phpinfo.php`, `*.sql`, `wp-admin`, `phpmyadmin`, `cgi-bin`, …).
- Ao criar uma rota pública nova, inclua-a em `ROTAS_PUBLICAS`
  (`src/proxy.ts`) e na lista equivalente da migration
  `20261022000002_analytics_seguranca.sql`.
- Cookie `cpepa_sid` (`httpOnly`, `sameSite=lax`, `maxAge` 365 dias) identifica o
  visitante para o cálculo de "únicos". É criado no primeiro acesso.
- O registro usa `event.waitUntil(...)` (`NextFetchEvent`): o proxy permanece
  vivo até a RPC terminar. Sem isso, pageviews de respostas rápidas eram
  perdidos (o registro era "fire-and-forget" e a chamada ao Supabase morria
  junto com a resposta).

## Página `/admin/analytics`

- Server component com `dynamic = "force-dynamic"`.
- Parâmetro de query `?dias=7|30|90` (default 30); valores inválidos caem em 30.
- Chama as RPCs `resumo_visitas`, `visitas_por_dia`, `paginas_mais_vistas` e
  `is_admin` em paralelo.
- `AdminAnalyticsContent.tsx` renderiza:
  - 4 cards: visitas no período, visitantes únicos, hoje, últimos 7 dias;
  - gráfico de barras (CSS puro, sem bibliotecas) de visitas por dia;
  - tabela de páginas mais vistas (visitas e únicos), com "Home" para `/`.
- Apenas admins veem os dados; outros perfis recebem uma mensagem.

## Limitações e observações

- Os dados começam a ser coletados **a partir do deploy** desta feature; não há
  histórico anterior.
- "Visitantes únicos" é baseado em cookie de sessão, não em IP — usuários que
  limpam cookies ou usam navegadores diferentes contam como novos.
- Navegação client-side (SPA) entre páginas gera uma visita por troca de rota,
  pois o middleware roda em cada requisição.
- Rotas admin, login e painel **não** são contabilizadas.
- Rotas fora da lista `ROTAS_PUBLICAS` (404, URLs inventadas, sondas de
  scanner) **não** são contabilizadas.
- Sem serviço externo, sem custo adicional; o volume é limitado ao tráfego do
  site.

## Como aplicar as migrations

Migrations do analytics:

- `supabase/migrations/20261022000001_analytics_visitas.sql` — tabela, RLS e RPCs;
- `supabase/migrations/20261022000002_analytics_seguranca.sql` — permissões das
  RPCs, guarda `is_admin()`, descarte de scanner e limpeza dos registros
  antigos que não são páginas do site;
- `supabase/migrations/20261022000003_analytics_rpc_sql.sql` — reescreve as RPCs
  de leitura em SQL puro (evita conflito entre nome de coluna e parâmetro de
  saída do PL/pgSQL) mantendo a trava `is_admin()` e os `revoke` de `anon`;
- `supabase/migrations/20261022000004_analytics_slug_blog.sql` — `/blog/<slug>`
  só é registrado quando existe post publicado com aquele slug.

Aplicar via:

```bash
npx supabase db push --yes
```

ou colar o conteúdo no SQL Editor do Supabase (dashboard).

> As quatro migrations acima já estão aplicadas no projeto
> `xeglpwjgyyzzfqurdauf` e registradas em
> `supabase_migrations.schema_migrations`, então o `db push` não as reaplica.
