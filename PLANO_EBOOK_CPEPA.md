# Plano de Implementação — Landing Page do E-book

**E-book:** Autismo: O Que Não Contarão Às Famílias
**Projeto:** Site CPEPA
**Data:** 10/11/2026
**Status:** planejado

---

## 1. Objetivo

Criar uma landing page pública em `/ebook` para distribuir gratuitamente o e-book **Autismo: O Que Não Contarão Às Famílias**, mediante preenchimento de nome e WhatsApp. A página deve apresentar a proposta do material, a autoria, o conteúdo abordado e um formulário que libera o download imediato do PDF.

A landing deve ser coerente com a identidade e o posicionamento do CPEPA: linguagem acolhedora, responsável, não medicalizante, não culpabilizadora e sem promessas de cura.

---

## 2. Decisões aprovadas

| Item | Decisão |
|---|---|
| Rota pública | `/ebook` |
| Proteção do PDF | Soft gate: PDF em `public/ebook/`, download liberado após o formulário |
| Dados captados | Nome + WhatsApp + consentimento LGPD (sem e-mail) |
| Painel administrativo | `/admin/ebook` com lista, busca, paginação, exclusão e exportação CSV |
| Divulgação na home | Banner após a seção “Para Pais” |
| Autoria | Individual (nome, formação/credencial e bio pendentes) |
| Download | Imediato após o envio do formulário, com botão de fallback |

### O que é soft gate

O PDF fica em `public/ebook/` e é servido como asset estático. O formulário é o caminho oficial de download, mas o arquivo é tecnicamente acessível por quem souber a URL. Essa é a opção mais simples e compatível com o deploy atual em Cloudflare Workers.

Se no futuro for necessário um hard gate, o caminho é migrar o PDF para um bucket privado (Supabase Storage ou R2) e liberar uma URL assinada após a validação do formulário. A interface da landing não precisa mudar.

---

## 3. Análise do projeto existente

- Next.js 16 (App Router), TypeScript, Tailwind CSS v4 e Supabase.
- Deploy em Cloudflare Workers via OpenNext.
- Shell público em `src/components/PublicShell.tsx`, com `Header` e `Footer`.
- Formulário público de referência: `src/app/solicitar-escuta/SolicitarEscutaForm.tsx`, que usa RPC Supabase (`security definer`) e consentimento LGPD.
- Admin protegido por `src/proxy.ts` e pelo layout `src/app/admin/(protected)/layout.tsx`.
- Fonte de verdade de admin no banco: função `public.is_admin()`; allowlist do app em `src/lib/admin-emails.ts`.
- Analytics first-party registra apenas rotas listadas em `src/proxy.ts` (`ROTAS_PUBLICAS`).
- `Capa.png` e o PDF estão na raiz do projeto e não são servidos pelo site. Precisam ser movidos para `public/`.
- Imagens do site usam `next/image` com `unoptimized`, por causa do ambiente Cloudflare.

---

## 4. Assets

### 4.1. Mover e renomear

Mover da raiz para `public/ebook/`:

| Origem | Destino |
|---|---|
| `Capa.png` | `public/ebook/capa.png` |
| `E-book Completo Autismo o que não contaram as familiaas.pdf` | `public/ebook/ebook-autismo-o-que-nao-contaram-as-familias.pdf` |

O nome original do PDF contém acento e espaços. O nome de destino deve ser seguro para URL, sem acentos e sem espaços.

### 4.2. Versões otimizadas

Gerar, a partir da capa original (1086×1448):

- `public/ebook/capa.jpg` — aproximadamente 800 px de largura, qualidade 85, para o hero e o banner da home.
- `public/ebook/og.jpg` — 1200×630, com a capa sobre fundo `brand-950`, para Open Graph e Twitter Card.

O PNG original pode ser mantido em `public/ebook/capa.png` como fonte, mas a página deve usar o JPG otimizado para não carregar 2,1 MB no hero.

### 4.3. Cache

Adicionar em `public/_headers`:

```
/ebook/*
  Cache-Control: public,max-age=86400
```

### 4.4. Robots (opcional, recomendado)

Criar `public/robots.txt` para evitar indexação direta do PDF:

```
User-agent: *
Allow: /
Disallow: /ebook/*.pdf
```

A landing `/ebook` continua indexável.

---

## 5. Banco de dados

### 5.1. Migration

Criar `supabase/migrations/20261110000001_ebook_leads.sql`.

```sql
-- Leads do e-book: captura nome + WhatsApp mediante consentimento LGPD.
-- Inserção exclusivamente via RPC (security definer). Leitura/exclusão por admin.

create table if not exists public.ebook_leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  whatsapp text not null,
  lgpd_consent boolean not null default false,
  lgpd_consent_at timestamptz,
  origem text not null default 'ebook-autismo',
  downloads integer not null default 1,
  created_at timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint ebook_leads_nome_len
    check (char_length(btrim(nome)) between 2 and 120),
  constraint ebook_leads_whatsapp_formato
    check (whatsapp ~ '^55[1-9][0-9]{9,10}$'),
  constraint ebook_leads_lgpd
    check (lgpd_consent = true)
);

create unique index if not exists ebook_leads_whatsapp_key
  on public.ebook_leads (whatsapp);

create index if not exists ebook_leads_created_at_idx
  on public.ebook_leads (created_at desc);

alter table public.ebook_leads enable row level security;

revoke all on public.ebook_leads from anon;
grant select, delete on public.ebook_leads to authenticated;

drop policy if exists "admin_read_ebook_leads" on public.ebook_leads;
create policy "admin_read_ebook_leads"
on public.ebook_leads
for select
to authenticated
using (public.is_admin());

drop policy if exists "admin_delete_ebook_leads" on public.ebook_leads;
create policy "admin_delete_ebook_leads"
on public.ebook_leads
for delete
to authenticated
using (public.is_admin());

create or replace function public.registrar_lead_ebook(
  p_nome text,
  p_whatsapp text,
  p_lgpd_consent boolean,
  p_origem text default 'ebook-autismo'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text := btrim(coalesce(p_nome, ''));
  v_whatsapp text := regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g');
  v_origem text := left(coalesce(nullif(btrim(p_origem), ''), 'ebook-autismo'), 60);
begin
  if char_length(v_nome) < 2 or char_length(v_nome) > 120 then
    return jsonb_build_object('status', 'erro', 'codigo', 'nome');
  end if;

  -- Número local (DDD + número): prefixa o código do Brasil.
  if char_length(v_whatsapp) in (10, 11) then
    v_whatsapp := '55' || v_whatsapp;
  end if;

  if v_whatsapp !~ '^55[1-9][0-9]{9,10}$' then
    return jsonb_build_object('status', 'erro', 'codigo', 'whatsapp');
  end if;

  if not coalesce(p_lgpd_consent, false) then
    return jsonb_build_object('status', 'erro', 'codigo', 'lgpd');
  end if;

  insert into public.ebook_leads
    (nome, whatsapp, lgpd_consent, lgpd_consent_at, origem)
  values
    (v_nome, v_whatsapp, true, now(), v_origem)
  on conflict (whatsapp) do update set
    nome = excluded.nome,
    lgpd_consent = true,
    lgpd_consent_at = now(),
    origem = excluded.origem,
    downloads = public.ebook_leads.downloads + 1,
    atualizado_em = now();

  return jsonb_build_object('status', 'ok');
exception
  when others then
    return jsonb_build_object('status', 'erro', 'codigo', 'erro');
end;
$$;

revoke all on function public.registrar_lead_ebook(text, text, boolean, text) from public;
grant execute on function public.registrar_lead_ebook(text, text, boolean, text)
  to anon, authenticated;
```

### 5.2. Regras da RPC

- Nome: 2 a 120 caracteres após `trim`.
- WhatsApp:
  - Remove tudo que não for dígito.
  - Se tiver 10 ou 11 dígitos, prefixa `55`.
  - Aceita apenas o formato `55` + DDD válido + 8 ou 9 dígitos.
- Consentimento LGPD obrigatório.
- O mesmo WhatsApp não cria duplicata: atualiza nome, consentimento, origem, incrementa `downloads` e atualiza `atualizado_em`.
- Retornos:
  - `{ "status": "ok" }`
  - `{ "status": "erro", "codigo": "nome" }`
  - `{ "status": "erro", "codigo": "whatsapp" }`
  - `{ "status": "erro", "codigo": "lgpd" }`
  - `{ "status": "erro", "codigo": "erro" }`

### 5.3. Tipos do Supabase

Atualizar `src/lib/supabase/database.types.ts` com:

- Tabela `ebook_leads` (`Row`, `Insert`, `Update`, `Relationships: []`).
- Função `registrar_lead_ebook`:

```ts
registrar_lead_ebook: {
  Args: {
    p_nome: string;
    p_whatsapp: string;
    p_lgpd_consent: boolean;
    p_origem?: string | null;
  };
  Returns: Json;
};
```

---

## 6. Landing page `/ebook`

### 6.1. Arquivos

- `src/app/ebook/page.tsx` — server component com metadata, JSON-LD e composição das seções.
- `src/app/ebook/EbookLeadForm.tsx` — client component do formulário.
- `src/lib/whatsapp.ts` — normalização e validação compartilhadas.

### 6.2. Estrutura e conteúdo

#### 1. Hero

- Fundo escuro (`bg-brand-950`), seguindo o padrão do hero da home.
- Eyebrow: “E-book gratuito · CPEPA”.
- H1: **Autismo: O Que Não Contarão Às Famílias**.
- Lead: “Quando uma família recebe o diagnóstico, não recebe apenas uma informação clínica. Ela entra em um sistema de orientações, promessas, advertências e urgências. Este e-book abre espaço para as perguntas que costumam ficar de fora.”
- CTA principal: “Quero baixar o e-book” → `#baixar`.
- Capa à direita, com moldura, sombra e `priority`.
- Frase de apoio: “O problema não é buscar tratamento. O problema começa quando a família é colocada diante de uma única narrativa.”

#### 2. A proposta do e-book

- Título: “Informação ampla, honesta e contextualizada”.
- Três blocos:
  1. **Perguntas, não slogans** — ciência verdadeira também exige dúvida, comparação, revisão, crítica, transparência e reconhecimento dos limites.
  2. **O que está sendo recomendado** — por quê, com base em quais estudos, com quais limites, custos, riscos e efeitos possíveis.
  3. **A criança como sujeito** — não um conjunto de comportamentos a serem corrigidos.
- Destaque: “Este livro não é contra a ciência. Ele é contra o uso simplificado da ciência como instrumento de convencimento das famílias.”

#### 3. O que você vai encontrar

- Os limites das pesquisas e as fragilidades metodológicas.
- Os conflitos de interesse que atravessam recomendações.
- Os efeitos subjetivos das intervenções intensivas.
- A escuta dos próprios autistas.
- O sofrimento das famílias submetidas à lógica da urgência permanente.
- O que está sendo recomendado, por quê, com base em quais estudos, limites, custos e riscos.

Fechamento: “Não é um receituário. É um material para pensar com mais contexto.”

#### 4. Para quem é

- Mães, pais e responsáveis que receberam um diagnóstico recente.
- Famílias que convivem há anos com o diagnóstico e sentem falta de contexto.
- Quem foi colocado diante de uma única narrativa e quer entender o que está sendo silenciado.
- Pessoas que acompanham famílias autistas e desejam ampliar a escuta.

#### 5. Citação em destaque

“Uma criança autista não é um conjunto de comportamentos a serem corrigidos. Ela é um sujeito. Tem corpo, linguagem, sensibilidade, recusas, invenções, medos, modos próprios de estar no mundo e formas singulares de laço. E nenhuma decisão terapêutica deveria apagar isso.”

#### 6. Sobre a autoria

- Nome do autor(a).
- Formação/credencial.
- Bio curta.
- Nota institucional: “Publicação do CPEPA — Coletivo Psicanalítico de Escuta de Pais de Autistas.”

> Pendente: nome, formação/credencial e bio. Até o recebimento, usar placeholder claramente marcado no código.

#### 7. Dúvidas frequentes

- **O e-book é gratuito?** Sim. Basta preencher nome e WhatsApp para liberar o download.
- **Preciso ter um diagnóstico para baixar?** Não. O material é para famílias e pessoas interessadas em compreender melhor o debate sobre autismo.
- **O e-book substitui acompanhamento profissional?** Não. É um material informativo e não substitui avaliação, acompanhamento ou decisão clínica individual.
- **Como recebo o arquivo?** O download é liberado imediatamente após o preenchimento do formulário.
- **Meus dados serão usados para quê?** Para liberar o material e registrar o interesse no e-book. Os dados não são compartilhados com terceiros.

#### 8. CTA final e formulário (`#baixar`)

- Título: “Baixe o e-book completo”.
- Texto: “Preencha seu nome e WhatsApp para liberar o arquivo. O download é imediato e gratuito.”
- Formulário:
  - Nome completo.
  - WhatsApp com `inputMode="tel"` e placeholder `(11) 99999-9999`.
  - Checkbox obrigatório de consentimento LGPD.
  - Botão “Quero baixar o e-book”.
- Estado de sucesso:
  - Título “Download liberado”.
  - Botão “Baixar o e-book (PDF)”.
  - Texto de fallback: “Se o download não iniciar, clique no botão acima.”
- Nota final: “Este material tem caráter informativo e não substitui acompanhamento individual.”

### 6.3. Metadata e SEO

Em `src/app/ebook/page.tsx`:

- `title`: “E-book: Autismo — O Que Não Contarão Às Famílias”.
- `description`: resumo do material e do formulário.
- `openGraph`:
  - título e descrição;
  - `images: [{ url: "/ebook/og.jpg", width: 1200, height: 630 }]`;
  - `type: "article"`.
- `twitter.card`: `summary_large_image`.
- `alternates.canonical: "/ebook"`.
- JSON-LD `Book`:
  - `name`, `description`, `image`, `inLanguage: "pt-BR"`;
  - `bookFormat: "https://schema.org/EBook"`;
  - `author` com o nome informado;
  - `publisher` CPEPA;
  - `offers` com `price: "0"` e `priceCurrency: "BRL"`.

Opcional: criar `src/app/sitemap.ts` incluindo `/ebook` e as demais rotas públicas.

---

## 7. Formulário

### 7.1. Comportamento

- Client component com estados `idle`, `error`, `success` e `pending`.
- Validação no cliente:
  - nome mínimo de 2 caracteres;
  - WhatsApp normalizado;
  - consentimento obrigatório.
- Honeypot oculto (`tabIndex={-1}`, `autoComplete="off"`) e tempo mínimo de preenchimento para reduzir bots.
- Chamada direta à RPC `registrar_lead_ebook` via `createClient()` de `src/lib/supabase/client.ts`.
- Em sucesso:
  - mostra o estado de sucesso;
  - dispara o download de `/ebook/ebook-autismo-o-que-nao-contaram-as-familias.pdf` por meio de uma âncora com `download`;
  - mantém o botão visível caso o navegador bloqueie o download automático.
- Em erro, exibir mensagem mapeada por código.

### 7.2. Texto de consentimento LGPD

“Autorizo o CPEPA a armazenar meu nome e WhatsApp para liberar o e-book e registrar meu interesse no material, nos termos da Lei Geral de Proteção de Dados (LGPD). Os dados não serão compartilhados com terceiros.”

### 7.3. Helper de WhatsApp

Criar `src/lib/whatsapp.ts`:

```ts
export function normalizarWhatsapp(valor: string): string {
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length === 10 || digitos.length === 11) {
    return `55${digitos}`;
  }
  return digitos;
}

export function whatsappValido(valor: string): boolean {
  return /^55[1-9][0-9]{9,10}$/.test(normalizarWhatsapp(valor));
}
```

O helper pode ser usado no cliente para validação imediata. A validação definitiva permanece na RPC.

### 7.4. Acessibilidade

- `label` associado a cada campo.
- `aria-describedby` para textos de ajuda e erros.
- `role="alert"` na mensagem de erro.
- Foco visível.
- Navegação completa por teclado.
- Contraste adequado.

---

## 8. Admin `/admin/ebook`

### 8.1. Arquivos

- `src/app/admin/(protected)/ebook/page.tsx`
- `src/app/admin/(protected)/ebook/AdminEbookContent.tsx`

### 8.2. Funcionalidades

- Server component com `export const dynamic = "force-dynamic"`.
- Consulta `ebook_leads` com:
  - busca por nome ou WhatsApp;
  - ordenação por `created_at desc`;
  - paginação de 50 por página;
  - contagem total.
- Busca por WhatsApp deve normalizar os dígitos digitados antes da consulta.
- Tabela com:
  - nome;
  - WhatsApp;
  - consentimento;
  - data de consentimento;
  - downloads;
  - data de criação;
  - ação de exclusão.
- Exclusão com confirmação, para atender pedidos de remoção LGPD.
- Exportação CSV no cliente:
  - buscar todos os registros em blocos de 1000;
  - gerar CSV com BOM UTF-8 para preservar acentos no Excel;
  - colunas: `nome`, `whatsapp`, `lgpd_consent`, `lgpd_consent_at`, `downloads`, `created_at`, `atualizado_em`, `origem`;
  - escapar aspas e quebras de linha.

### 8.3. Integração com o admin

- Adicionar item “E-book” ao menu de `src/app/admin/(protected)/layout.tsx`.
- Adicionar card “Leads do E-book” ao dashboard:
  - atualizar `src/app/admin/(protected)/page.tsx` com a contagem;
  - atualizar `src/app/admin/(protected)/AdminDashboardContent.tsx` com o card.

---

## 9. Navegação e home

### 9.1. Header

Em `src/components/Header.tsx`, adicionar link “E-book” ao lado de “Blog”, visível em todas as páginas.

### 9.2. MobileNav

Em `src/components/MobileNav.tsx`, adicionar link “E-book” abaixo de “Blog”.

### 9.3. Footer

Em `src/components/Footer.tsx`, adicionar link “E-book” na coluna “Navegação”, após “Blog”.

### 9.4. Banner na home

Criar `src/components/sections/EbookBanner.tsx` e inserir em `src/app/page.tsx` após `<ParaPais />`.

Conteúdo do banner:

- Eyebrow: “E-book gratuito”.
- Título: “Autismo: O Que Não Contarão Às Famílias”.
- Texto curto: “Um material para famílias que querem mais do que uma única narrativa sobre o autismo.”
- Capa em miniatura.
- CTA: “Baixar o e-book” → `/ebook`.
- Estilo claro (`bg-brand-50` ou similar), para não competir com o CTA final escuro.

---

## 10. Analytics

- Adicionar `/ebook` a `ROTAS_PUBLICAS` em `src/proxy.ts`.
- Não adicionar `/ebook/*.pdf`: o PDF não deve entrar como página visitada.
- A conversão principal é o registro em `ebook_leads`; não é necessário criar evento separado de download nesta fase.
- A página `/ebook` passará a aparecer automaticamente no ranking de páginas do admin de analytics.

---

## 11. Arquivos a criar e alterar

### Criar

- `public/ebook/capa.png`
- `public/ebook/capa.jpg`
- `public/ebook/og.jpg`
- `public/ebook/ebook-autismo-o-que-nao-contaram-as-familias.pdf`
- `supabase/migrations/20261110000001_ebook_leads.sql`
- `src/app/ebook/page.tsx`
- `src/app/ebook/EbookLeadForm.tsx`
- `src/lib/whatsapp.ts`
- `src/components/sections/EbookBanner.tsx`
- `src/app/admin/(protected)/ebook/page.tsx`
- `src/app/admin/(protected)/ebook/AdminEbookContent.tsx`

### Alterar

- `src/lib/supabase/database.types.ts`
- `src/proxy.ts`
- `src/components/Header.tsx`
- `src/components/MobileNav.tsx`
- `src/components/Footer.tsx`
- `src/app/page.tsx`
- `src/app/admin/(protected)/layout.tsx`
- `src/app/admin/(protected)/page.tsx`
- `src/app/admin/(protected)/AdminDashboardContent.tsx`
- `public/_headers`
- `public/robots.txt` (opcional)

---

## 12. Ordem de implementação

- [ ] 1. Aplicar a migration no Supabase (SQL Editor ou CLI).
- [ ] 2. Mover os assets da raiz para `public/ebook/` com nomes seguros.
- [ ] 3. Gerar `capa.jpg` e `og.jpg` otimizados.
- [ ] 4. Atualizar `src/lib/supabase/database.types.ts`.
- [ ] 5. Criar `src/lib/whatsapp.ts`.
- [ ] 6. Criar a landing `/ebook` e o formulário.
- [ ] 7. Criar a tela admin `/admin/ebook` e o CSV.
- [ ] 8. Integrar admin ao menu e ao dashboard.
- [ ] 9. Criar o banner da home e os links de navegação.
- [ ] 10. Adicionar `/ebook` ao analytics em `src/proxy.ts`.
- [ ] 11. Adicionar cache em `public/_headers` e, se desejado, `robots.txt`.
- [ ] 12. Rodar `npm run lint` e `npm run build`.
- [ ] 13. Testar o fluxo completo localmente.
- [ ] 14. Fazer o deploy no Cloudflare.

---

## 13. Checklist de testes

### Formulário

- [ ] Nome vazio ou com menos de 2 caracteres.
- [ ] WhatsApp com letras, curto, sem DDD ou com DDD inválido.
- [ ] WhatsApp celular com 11 dígitos.
- [ ] WhatsApp fixo com 10 dígitos.
- [ ] WhatsApp já cadastrado: atualiza o lead e incrementa `downloads`.
- [ ] Sem consentimento LGPD: bloqueia.
- [ ] Honeypot preenchido: não grava.
- [ ] Sucesso: download inicia e botão de fallback funciona.
- [ ] Mensagens de erro claras e acessíveis.

### Banco e segurança

- [ ] `anon` não consegue ler `ebook_leads`.
- [ ] Admin consegue ler e excluir.
- [ ] RPC acessível por `anon` e `authenticated`.
- [ ] Constraints de nome, WhatsApp e LGPD funcionando.
- [ ] Nenhum dado sensível exposto no cliente.

### Admin

- [ ] Lista carrega com paginação.
- [ ] Busca por nome funciona.
- [ ] Busca por WhatsApp funciona com número formatado e só dígitos.
- [ ] CSV abre no Excel com acentos corretos.
- [ ] Exclusão pede confirmação.
- [ ] Card do dashboard mostra a contagem.

### Página e SEO

- [ ] `/ebook` carrega no shell público com Header e Footer.
- [ ] Metadata, Open Graph, Twitter Card e canonical corretos.
- [ ] JSON-LD válido.
- [ ] Capa otimizada e sem layout shift.
- [ ] Layout mobile, tablet e desktop.
- [ ] Navegação por teclado e leitor de tela.
- [ ] Links de menu, rodapé e banner da home funcionando.

### Analytics

- [ ] `/ebook` aparece no admin de analytics.
- [ ] `/ebook/*.pdf` não é registrado como visita.
- [ ] Rotas antigas continuam sendo registradas.

---

## 14. Deploy

Seguir as orientações do `AGENTS.md`:

- [ ] Encerrar `next dev` e `workerd`.
- [ ] Remover `.open-next`.
- [ ] Reaplicar o patch de symlink do OpenNext se necessário (Windows).
- [ ] Rodar `npm run lint`.
- [ ] Rodar `npm run build`.
- [ ] Rodar `npm run deploy` com `CLOUDFLARE_API_TOKEN`.
- [ ] Verificar `/ebook` em produção.
- [ ] Enviar um lead de teste e conferir no admin.
- [ ] Baixar o PDF em produção.
- [ ] Conferir o registro de visita em `/ebook`.

---

## 15. Pendências de conteúdo

Antes de finalizar a landing, receber:

- Nome do autor(a).
- Formação/credencial.
- Bio curta (opcional, mas recomendada).
- Confirmar se o autor(a) tem perfil público em `/psicanalistas/[id]` para eventual link.

Enquanto isso, usar placeholders claramente marcados no código, sem publicar dados inventados.

---

## 16. Riscos e observações

- **Soft gate:** o PDF é público se a URL for descoberta. Se isso não for aceitável, planejar a fase de hard gate com bucket privado e URL assinada.
- **LGPD:** o consentimento deve ser explícito e o uso dos dados limitado à finalidade informada. Recomenda-se, em fase futura, uma página de política de privacidade.
- **Spam:** honeypot e validação reduzem bots, mas não eliminam spam. Se necessário, avaliar Cloudflare Turnstile em uma segunda fase.
- **Autoria:** não publicar nome, formação ou bio sem confirmação.
- **Direitos do material:** confirmar que o CPEPA tem autorização para distribuir a capa e o conteúdo do PDF.
- **Build no Windows:** o OpenNext pode falhar com `EPERM` em symlink. O patch está documentado no `AGENTS.md` e se perde a cada `npm install`.
- **Título provocativo:** manter o tom responsável da introdução. Evitar promessas de “verdades secretas” ou ataques genéricos a terapias específicas.

---

## 17. Estimativa

| Etapa | Estimativa |
|---|---|
| Assets + migration | 0,5 dia |
| Landing page + formulário | 1 a 1,5 dia |
| Admin + CSV | 0,5 a 1 dia |
| Banner, navegação, analytics e SEO | 0,5 dia |
| Testes e deploy | 0,5 dia |
| **Total** | **3 a 4 dias** |
