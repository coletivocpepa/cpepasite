# Plano de Desenvolvimento — Site CPEPA

**Coletivo Psicanalítico de Escuta de Pais de Autistas**

---

## 1. Visão geral

### 1.1. Objetivo

Construir o site institucional do CPEPA com três frentes:

1. **Divulgação** — apresentar a proposta do coletivo ao público-alvo (mães, pais e responsáveis por pessoas autistas), com linguagem clara, acolhedora e não culpabilizadora.
2. **Cadastro** — banco de dados no Supabase para o cadastro de mães/pais/responsáveis que desejam escuta e para o cadastro dos psicanalistas que serão indicados a eles.
3. **Indicação automática** — pequeno sistema que relaciona os horários disponíveis dos psicanalistas com os horários pretendidos pelos responsáveis, realizando a combinação de forma automática.

### 1.2. Stack tecnológica

| Camada | Tecnologia |
| --- | --- |
| Frontend | Next.js (App Router, TypeScript, Tailwind CSS) |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) |
| Envio de e-mails | Edge Functions + Resend/SMTP |
| Deploy | Cloudflare Workers (via `@opennextjs/cloudflare`) |

### 1.3. Público-alvo

Baseado nas seções 10 e 16 do *Documento Conceitual*:

- mães de pessoas autistas;
- pais de pessoas autistas;
- responsáveis diretamente envolvidos com a experiência parental;
- pais com diagnóstico recente ou que convivem há anos com o diagnóstico.

A comunicação deve ser: clara, acolhedora, não infantilizada, não medicalizante, não culpabilizadora, acessível ao público leigo, rigorosa do ponto de vista ético e coerente com a psicanálise.

### 1.4. Identidade visual

Baseada na seção 17 do *Documento Conceitual*:

- azul profundo;
- azul institucional;
- branco e tons neutros;
- tipografia limpa;
- composição minimalista;
- fotografias que expressem encontro e escuta;
- ausência de excesso de elementos gráficos.

Evitar: quebra-cabeças, cérebros, símbolos médicos, imagens excessivamente infantis e representações estereotipadas do autismo.

---

## 2. Modelo de dados (Supabase)

### 2.1. Tabela `responsaveis`

Cadastro dos pais, mães e responsáveis que solicitam escuta.

| Campo | Tipo | Observação |
| --- | --- | --- |
| `id` | uuid | PK |
| `nome` | text | |
| `email` | text | único |
| `telefone` | text | |
| `cidade_uf` | text | |
| `relacao` | text | mãe / pai / responsável |
| `lgpd_consent` | boolean | consentimento obrigatório |
| `lgpd_consent_at` | timestamptz | |
| `created_at` | timestamptz | |

### 2.2. Tabela `solicitacoes`

Horários pretendidos pelos responsáveis (can ter várias solicitações).

| Campo | Tipo | Observação |
| --- | --- | --- |
| `id` | uuid | PK |
| `responsavel_id` | uuid | FK → `responsaveis` |
| `dia_semana` | int | 0–6 (domingo–sábado) |
| `hora_inicio` | time | faixa pretendida (início) |
| `hora_fim` | time | faixa pretendida (fim) |
| `modalidade` | text | online / presencial |
| `mensagem` | text | opcional |
| `status` | text | aberta / em_andamento / concluida / cancelada |
| `created_at` | timestamptz | |

### 2.3. Tabela `psicanalistas`

Cadastro dos psicanalistas do coletivo, vinculados ao Supabase Auth.

| Campo | Tipo | Observação |
| --- | --- | --- |
| `id` | uuid | PK |
| `user_id` | uuid | FK → `auth.users` |
| `nome` | text | |
| `email` | text | |
| `telefone` | text | |
| `formacao` | text | formação em psicanálise / registro |
| `bio` | text | apresentação curta |
| `modalidade` | text | online / presencial |
| `valor_simbolico` | text | faixa de valor praticada |
| `status` | text | ativo / inativo |
| `created_at` | timestamptz | |

### 2.4. Tabela `disponibilidades`

Slots de horário dos psicanalistas (padrão de 50 minutos por sessão).

| Campo | Tipo | Observação |
| --- | --- | --- |
| `id` | uuid | PK |
| `psicanalista_id` | uuid | FK → `psicanalistas` |
| `dia_semana` | int | 0–6 |
| `hora_inicio` | time | início do slot |
| `hora_fim` | time | fim do slot |
| `modalidade` | text | online / presencial |
| `status` | text | disponivel / reservada / em_pausa |
| `created_at` | timestamptz | |

### 2.5. Tabela `indicacoes`

Vínculo entre solicitação, psicanalista e slot (resultado do match).

| Campo | Tipo | Observação |
| --- | --- | --- |
| `id` | uuid | PK |
| `solicitacao_id` | uuid | FK → `solicitacoes` |
| `psicanalista_id` | uuid | FK → `psicanalistas` |
| `disponibilidade_id` | uuid | FK → `disponibilidades` |
| `status` | text | pendente / aceita / recusada / realizada / cancelada |
| `notificado_psicanalista_at` | timestamptz | |
| `notificado_responsavel_at` | timestamptz | |
| `created_at` | timestamptz | |

### 2.6. Row Level Security

- `responsaveis`: escritas públicas apenas para a submissão do formulário; leitura restrita ao próprio registro ou ao admin.
- `solicitacoes` e `indicacoes`: acesso restrito ao admin e, parcialmente, ao psicanalista envolvido.
- `psicanalistas` e `disponibilidades`: o psicanalista gerencia apenas seu próprio perfil e seus slots; leitura do perfil é pública para divulgação.

---

## 3. Etapas

### Etapa 1 — Home (landing page) de divulgação

Foco inicial: construir a home como landing page de divulgação, de acordo com a seção 18 do *Documento Conceitual*.

**Conteúdo da home:**
- hero com nome completo: **CPEPA — Coletivo Psicanalítico de Escuta de Pais de Autistas**;
- frase central: **"Antes de cuidar, é preciso poder falar."**;
- texto de apresentação: *"Ser mãe ou pai de uma pessoa autista pode produzir perguntas, angústias, conflitos e transformações que nem sempre encontram espaço para serem ditos. O CPEPA oferece um espaço de escuta psicanalítica para mães e pais que desejam falar sobre aquilo que essa experiência produz em suas vidas."*;
- CTA principal: **QUERO SER ESCUTADO**;
- seções da home: hero, manifesto, O que é o CPEPA, A Escuta, Para Pais, Como Funciona, Valor Simbólico, Quem Somos (resumo), Perguntas Frequentes e rodapé.

**Atividades:**
- criar projeto Next.js com TypeScript e Tailwind CSS;
- aplicar identidade visual (azul profundo/institucional, branco e neutros, minimalismo);
- construir as seções da home com copy institucional (frases da seção 21);
- garantir responsividade e acessibilidade básica;
- configurar SEO básico (título, descrição, Open Graph).

**Entrega:** home responsiva e publicável, com CTA direcionando ao fluxo de solicitação de escuta (Etapa 2).

### Etapa 2 — Cadastro de responsáveis e solicitação de escuta

- Página/formulário de solicitação de escuta (ponto de destino do CTA **QUERO SER ESCUTADO**);
- cadastro do responsável (nome, email, telefone, cidade, relação) com consentimento LGPD;
- registro dos horários pretendidos (dia da semana, faixa de horário, modalidade online/presencial);
- validação de dados e prevenção de duplicidade por email;
- aplicação de RLS nas tabelas;
- confirmação amigável ao responsável ao final da submissão.

**Entrega:** responsáveis conseguem se cadastrar e solicitar escuta com horário pretendido.

### Etapa 3 — Cadastro e autogestão dos psicanalistas

- Página institutional de adesão com formulário (formação, contato, modalidade, valor simbólico);
- cadastro no Supabase Auth + criação do perfil em `psicanalistas`;
- painel simples para o psicanalista informar e manter seus slots de disponibilidade (CRUD de `disponibilidades`);
- visualização pública dos psicanalistas do coletivo.

**Entrega:** psicanalistas conseguem se cadastrar e manter sua agenda de disponibilidade.

### Etapa 4 — Sistema automático de indicação

- Regra de match: cruzar `solicitacoes` (dia + faixa + modalidade) com `disponibilidades` (dia + slot + modalidade);
- priorização: compatibilidade exata de faixa, depois faixas mais próximas; rotação entre psicanalistas para distribuir demandas;
- Edge Function acionada no insert de uma solicitação (ou app-level): busca compatíveis, reserva o slot, cria registro em `indicacoes` e envia notificações por e-mail;
- fluxo de resposta do psicanalista: aceite → contato entre as partes; recusa → slot liberado e re-tentativa com o próximo compatível;
- ausência de match → solicitação entra em fila de espera com aviso ao responsável;
- página de acompanhamento do status para o responsável (pendente / aceita / recusada).

**Entrega:** combinação automática entre horários pretendidos e disponíveis, com notificação por e-mail.

### Etapa 5 — Páginas institucionais completas

Páginas da arquitetura do site (seção 19 do *Documento Conceitual*):

- O CPEPA;
- A Escuta;
- Para Pais;
- Como Funciona;
- Valor Simbólico;
- Quem Somos;
- Perguntas Frequentes;
- Solicitar Escuta*.

*Solicitar Escuta já implementado na Etapa 2; apenas integrar à navegação.

**Entrega:** site institucional completo conforme arquitetura conceitual.

### Etapa 6 — Painel administrativo do CPEPA

- visão geral de solicitações, indicações e psicanalistas;
- moderação e acompanhamento do fluxo de indicações;
- gestão de conteúdo institucional (textos, FAQ).

**Entrega:** coordenação do CPEPA consegue acompanhar e gerenciar todo o fluxo.

### Etapa 7 — Qualidade e lançamento

- SEO avançado (sitemap, meta tags, Open Graph, `robots.txt`);
- testes de Lighthouse e acessibilidade;
- testes end-to-end dos fluxos principais (solicitação → match → resposta);
- seed SQL e variáveis de ambiente documentadas;
- deploy no Cloudflare Workers (`npx opennextjs-cloudflare build && wrangler deploy`) com variáveis do Supabase configuradas;
- domínio customizado do CPEPA apontando para o Worker.

**Entrega:** site publicado e estável em produção.

### Etapa 8 — Pós-lançamento

- monitoramento de métricas (visitas, solicitações, taxa de match);
- feedback de pais e psicanalistas;
- iterações de conteúdo e UX;
- expansão (pagamentos do valor simbólico, integrações, etc.) quando necessário.

---

## 4. Cronograma sugerido

| Etapa | Descrição | Estimativa |
| --- | --- | --- |
| 1 | Home (landing page) de divulgação | 1–2 semanas |
| 2 | Cadastro de responsáveis e solicitação de escuta | 1 semana |
| 3 | Cadastro e autogestão dos psicanalistas | 1–2 semanas |
| 4 | Sistema automático de indicação | 1–2 semanas |
| 5 | Páginas institucionais completas | 1 semana |
| 6 | Painel administrativo do CPEPA | 1–2 semanas |
| 7 | Qualidade e lançamento | 1 semana |
| 8 | Pós-lançamento | contínuo |

As estimativas são referenciais e podem ser ajustadas conforme o ritmo de desenvolvimento e validações.

---

**Documento de planejamento — CPEPA**  
**Coletivo Psicanalítico de Escuta de Pais de Autistas**