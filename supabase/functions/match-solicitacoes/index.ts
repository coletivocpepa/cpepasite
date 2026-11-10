import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

interface MatchRequest {
  responsavel_id: string;
}

interface Psicanalista {
  id: string;
  nome: string;
  telefone: string | null;
  bio: string | null;
  modalidades: string[];
  valor_simbolico: string | null;
  formacao: string | null;
}

interface MatchResponse {
  solicitacao_id: string;
  tipo: "exato" | "proximo";
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  modalidade: string;
  solicitado: {
    dia_semana: number;
    hora_inicio: string;
    hora_fim: string;
  };
  psicanalista: Psicanalista;
}

interface Disponibilidade {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  modalidade: string;
  psicanalista: Psicanalista;
}

function corsHeaders(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

// Verifica se dois intervalos de tempo se sobrepõem
function intervalsOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 < end2 && start2 < end1;
}

function timeToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Distância circular entre dias da semana (0 a 3; ex.: domingo -> segunda = 1)
function dayDistance(d1: number, d2: number): number {
  const diff = Math.abs(d1 - d2);
  return Math.min(diff, 7 - diff);
}

// Menor "vão" em minutos entre dois intervalos (0 se houver sobreposição).
function intervalGapMinutes(aStart: string, aEnd: string, bStart: string, bEnd: string): number {
  if (intervalsOverlap(aStart, aEnd, bStart, bEnd)) return 0;

  const a1 = timeToMinutes(aStart);
  const a2 = timeToMinutes(aEnd);
  const b1 = timeToMinutes(bStart);
  const b2 = timeToMinutes(bEnd);

  const gap1 = b1 - a2; // B começa depois de A terminar
  const gap2 = a1 - b2; // A começa depois de B terminar

  if (gap1 >= 0 && gap2 >= 0) return Math.min(gap1, gap2);
  if (gap1 >= 0) return gap1;
  return gap2;
}

// Inserção defensiva: respeita o unique index que reserva a disponibilidade
// para apenas uma indicação pendente/aceita. Retorna true se a indicação
// já existia para esta solicitação ou foi criada agora.
async function ensureIndicacao(solicitacaoId: string, psicanalistaId: string, disponibilidadeId: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from("indicacoes")
    .select("id")
    .eq("solicitacao_id", solicitacaoId)
    .eq("disponibilidade_id", disponibilidadeId)
    .maybeSingle();

  if (existing) return true;

  const { error } = await supabase.from("indicacoes").insert({
    solicitacao_id: solicitacaoId,
    psicanalista_id: psicanalistaId,
    disponibilidade_id: disponibilidadeId,
    status: "pendente",
    alternativa: true,
  });

  if (error) {
    // 23505 = unique index de disponibilidade reservada (outra solicitação já
    // reservou este horário), então apenas descartamos este candidato.
    if (error.code === "23505") return false;
    console.error("Erro ao criar indicação alternativa:", error);
    return false;
  }

  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req.headers.get("Origin") ?? undefined) });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { ...corsHeaders(req.headers.get("Origin") ?? undefined), "Content-Type": "application/json" },
    });
  }

  let body: MatchRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), {
      status: 400,
      headers: { ...corsHeaders(req.headers.get("Origin") ?? undefined), "Content-Type": "application/json" },
    });
  }

  if (!body.responsavel_id) {
    return new Response(JSON.stringify({ error: "responsavel_id obrigatório" }), {
      status: 400,
      headers: { ...corsHeaders(req.headers.get("Origin") ?? undefined), "Content-Type": "application/json" },
    });
  }

  try {
    // Busca todas as solicitações do responsável que estão abertas
    const { data: solicitacoes, error: solError } = await supabase
      .from("solicitacoes")
      .select("id, dia_semana, hora_inicio, hora_fim, modalidade")
      .eq("responsavel_id", body.responsavel_id)
      .eq("status", "aberta");

    if (solError) throw solError;
    if (!solicitacoes || solicitacoes.length === 0) {
      return new Response(JSON.stringify({ matches: [] }), {
        status: 200,
        headers: { ...corsHeaders(req.headers.get("Origin") ?? undefined), "Content-Type": "application/json" },
      });
    }

    const allMatches: MatchResponse[] = [];

    for (const sol of solicitacoes) {
      // 1) Match exato: mesma modalidade, mesmo dia, horário sobreposto
      const { data: disponibilidades, error: dispError } = await supabase
        .from("disponibilidades")
        .select(`
          id,
          dia_semana,
          hora_inicio,
          hora_fim,
          modalidade,
          psicanalista:psicanalistas!inner (
            id,
            nome,
            telefone,
            bio,
            modalidades,
            valor_simbolico,
            formacao,
            ativo
          )
        `)
        .eq("dia_semana", sol.dia_semana)
        .eq("modalidade", sol.modalidade)
        .eq("status", "disponivel")
        .eq("psicanalistas.ativo", true);

      if (dispError) throw dispError;

      let encontrouExato = false;

      for (const disp of disponibilidades ?? []) {
        if (
          intervalsOverlap(
            sol.hora_inicio,
            sol.hora_fim,
            disp.hora_inicio,
            disp.hora_fim
          )
        ) {
          const { data: existing } = await supabase
            .from("indicacoes")
            .select("id")
            .eq("solicitacao_id", sol.id)
            .eq("psicanalista_id", disp.psicanalista.id)
            .maybeSingle();

          if (!existing) {
            const { error: indError } = await supabase.from("indicacoes").insert({
              solicitacao_id: sol.id,
              psicanalista_id: disp.psicanalista.id,
              disponibilidade_id: disp.id,
              status: "pendente",
            });
            if (indError) console.error("Erro ao criar indicação:", indError);
          }

          encontrouExato = true;
          allMatches.push({
            solicitacao_id: sol.id,
            tipo: "exato",
            dia_semana: sol.dia_semana,
            hora_inicio: sol.hora_inicio,
            hora_fim: sol.hora_fim,
            modalidade: sol.modalidade,
            solicitado: {
              dia_semana: sol.dia_semana,
              hora_inicio: sol.hora_inicio,
              hora_fim: sol.hora_fim,
            },
            psicanalista: disp.psicanalista,
          });
        }
      }

      if (encontrouExato) continue;

      // 2) Fallback: horário mais próximo na mesma modalidade
      //    (qualquer dia, ordenado por proximidade de dia e de horário)
      const { data: candidatos, error: candError } = await supabase
        .from("disponibilidades")
        .select(`
          id,
          dia_semana,
          hora_inicio,
          hora_fim,
          modalidade,
          psicanalista:psicanalistas!inner (
            id,
            nome,
            telefone,
            bio,
            modalidades,
            valor_simbolico,
            formacao,
            ativo
          )
        `)
        .eq("modalidade", sol.modalidade)
        .eq("status", "disponivel")
        .eq("psicanalistas.ativo", true);

      if (candError) throw candError;

      const ordenados = (candidatos ?? [] as Disponibilidade[]).sort((a, b) => {
        const dayA = dayDistance(sol.dia_semana, a.dia_semana);
        const dayB = dayDistance(sol.dia_semana, b.dia_semana);
        if (dayA !== dayB) return dayA - dayB;

        const gapA = intervalGapMinutes(sol.hora_inicio, sol.hora_fim, a.hora_inicio, a.hora_fim);
        const gapB = intervalGapMinutes(sol.hora_inicio, sol.hora_fim, b.hora_inicio, b.hora_fim);
        if (gapA !== gapB) return gapA - gapB;

        return a.id.localeCompare(b.id);
      });

      let alternativas = 0;
      for (const disp of ordenados) {
        if (alternativas >= 3) break;

        const ok = await ensureIndicacao(sol.id, disp.psicanalista.id, disp.id);
        if (!ok) continue;

        alternativas += 1;
        allMatches.push({
          solicitacao_id: sol.id,
          tipo: "proximo",
          dia_semana: disp.dia_semana,
          hora_inicio: disp.hora_inicio,
          hora_fim: disp.hora_fim,
          modalidade: disp.modalidade,
          solicitado: {
            dia_semana: sol.dia_semana,
            hora_inicio: sol.hora_inicio,
            hora_fim: sol.hora_fim,
          },
          psicanalista: disp.psicanalista,
        });
      }
    }

    return new Response(JSON.stringify({ matches: allMatches }), {
      status: 200,
      headers: { ...corsHeaders(req.headers.get("Origin") ?? undefined), "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erro no match:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders(req.headers.get("Origin") ?? undefined), "Content-Type": "application/json" },
    });
  }
});