export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Modalidade = "online" | "presencial";
export type TipoRelacao = "mae" | "pai" | "responsavel";
export type StatusSolicitacao =
  | "aberta"
  | "em_andamento"
  | "concluida"
  | "cancelada";
export type StatusDisponibilidade = "disponivel" | "reservada" | "em_pausa";
export type StatusIndicacao =
  | "pendente"
  | "aceita"
  | "recusada"
  | "realizada"
  | "cancelada";
export type StatusPost = "rascunho" | "publicado";

export interface Database {
  public: {
    Tables: {
      admins: {
        Row: {
          email: string;
          created_at: string;
        };
        Insert: {
          email: string;
          created_at?: string;
        };
        Update: {
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      responsaveis: {
        Row: {
          id: string;
          nome: string;
          email: string;
          telefone: string | null;
          cidade_uf: string | null;
          relacao: TipoRelacao;
          lgpd_consent: boolean;
          lgpd_consent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          email: string;
          telefone?: string | null;
          cidade_uf?: string | null;
          relacao: TipoRelacao;
          lgpd_consent: boolean;
          lgpd_consent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          email?: string;
          telefone?: string | null;
          cidade_uf?: string | null;
          relacao?: TipoRelacao;
          lgpd_consent?: boolean;
          lgpd_consent_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "solicitacoes_responsavel_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "solicitacoes";
            referencedColumns: ["responsavel_id"];
          },
        ];
      };
      solicitacoes: {
        Row: {
          id: string;
          responsavel_id: string;
          dia_semana: number;
          hora_inicio: string;
          hora_fim: string;
          modalidade: Modalidade;
          mensagem: string | null;
          status: StatusSolicitacao;
          created_at: string;
        };
        Insert: {
          id?: string;
          responsavel_id: string;
          dia_semana: number;
          hora_inicio: string;
          hora_fim: string;
          modalidade: Modalidade;
          mensagem?: string | null;
          status?: StatusSolicitacao;
          created_at?: string;
        };
        Update: {
          id?: string;
          responsavel_id?: string;
          dia_semana?: number;
          hora_inicio?: string;
          hora_fim?: string;
          modalidade?: Modalidade;
          mensagem?: string | null;
          status?: StatusSolicitacao;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "solicitacoes_responsavel_id_fkey";
            columns: ["responsavel_id"];
            isOneToOne: false;
            referencedRelation: "responsaveis";
            referencedColumns: ["id"];
          },
        ];
      };
      psicanalistas: {
        Row: {
          id: string;
          user_id: string | null;
          nome: string;
          email: string | null;
          telefone: string | null;
          formacao: string | null;
          bio: string | null;
          modalidades: Modalidade[];
          valor_simbolico: string | null;
          ativo: boolean;
          convite_token: string | null;
          convite_expira: string | null;
          acesso_blog: boolean;
          deve_trocar_senha: boolean;
          acesso_criado_em: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          nome: string;
          email?: string | null;
          telefone?: string | null;
          formacao?: string | null;
          bio?: string | null;
          modalidades?: Modalidade[];
          valor_simbolico?: string | null;
          ativo?: boolean;
          convite_token?: string | null;
          convite_expira?: string | null;
          acesso_blog?: boolean;
          deve_trocar_senha?: boolean;
          acesso_criado_em?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          nome?: string;
          email?: string | null;
          telefone?: string | null;
          formacao?: string | null;
          bio?: string | null;
          modalidades?: Modalidade[];
          valor_simbolico?: string | null;
          ativo?: boolean;
          convite_token?: string | null;
          convite_expira?: string | null;
          acesso_blog?: boolean;
          deve_trocar_senha?: boolean;
          acesso_criado_em?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "psicanalistas_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      disponibilidades: {
        Row: {
          id: string;
          psicanalista_id: string;
          dia_semana: number;
          hora_inicio: string;
          hora_fim: string;
          modalidade: Modalidade;
          status: StatusDisponibilidade;
          created_at: string;
        };
        Insert: {
          id?: string;
          psicanalista_id: string;
          dia_semana: number;
          hora_inicio: string;
          hora_fim: string;
          modalidade: Modalidade;
          status?: StatusDisponibilidade;
          created_at?: string;
        };
        Update: {
          id?: string;
          psicanalista_id?: string;
          dia_semana?: number;
          hora_inicio?: string;
          hora_fim?: string;
          modalidade?: Modalidade;
          status?: StatusDisponibilidade;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "disponibilidades_psicanalista_id_fkey";
            columns: ["psicanalista_id"];
            isOneToOne: false;
            referencedRelation: "psicanalistas";
            referencedColumns: ["id"];
          },
        ];
      };
      indicacoes: {
        Row: {
          id: string;
          solicitacao_id: string;
          psicanalista_id: string;
          disponibilidade_id: string | null;
          status: StatusIndicacao;
          alternativa: boolean;
          notificado_psicanalista_at: string | null;
          notificado_responsavel_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          solicitacao_id: string;
          psicanalista_id: string;
          disponibilidade_id?: string | null;
          status?: StatusIndicacao;
          alternativa?: boolean;
          notificado_psicanalista_at?: string | null;
          notificado_responsavel_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          solicitacao_id?: string;
          psicanalista_id?: string;
          disponibilidade_id?: string | null;
          status?: StatusIndicacao;
          alternativa?: boolean;
          notificado_psicanalista_at?: string | null;
          notificado_responsavel_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "indicacoes_solicitacao_id_fkey";
            columns: ["solicitacao_id"];
            isOneToOne: false;
            referencedRelation: "solicitacoes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "indicacoes_psicanalista_id_fkey";
            columns: ["psicanalista_id"];
            isOneToOne: false;
            referencedRelation: "psicanalistas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "indicacoes_disponibilidade_id_fkey";
            columns: ["disponibilidade_id"];
            isOneToOne: false;
            referencedRelation: "disponibilidades";
            referencedColumns: ["id"];
          },
        ];
      };
      conteudo_site: {
        Row: {
          id: string;
          chave: string;
          titulo: string;
          conteudo: string;
          tipo: string;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          chave: string;
          titulo: string;
          conteudo: string;
          tipo?: string;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          chave?: string;
          titulo?: string;
          conteudo?: string;
          tipo?: string;
          criado_em?: string;
          atualizado_em?: string;
        };
        Relationships: [];
      };
      faq: {
        Row: {
          id: string;
          pergunta: string;
          resposta: string;
          categoria: string | null;
          ordem: number;
          ativo: boolean;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          pergunta: string;
          resposta: string;
          categoria?: string | null;
          ordem?: number;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          pergunta?: string;
          resposta?: string;
          categoria?: string | null;
          ordem?: number;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Relationships: [];
      };
      categorias: {
        Row: {
          id: string;
          slug: string;
          nome: string;
          criado_em: string;
        };
        Insert: {
          id?: string;
          slug: string;
          nome: string;
          criado_em?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          nome?: string;
          criado_em?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          slug: string;
          titulo: string;
          resumo: string | null;
          conteudo_html: string;
          capa_url: string | null;
          categoria_id: string | null;
          tags: string[];
          status: StatusPost;
          autor: string | null;
          autor_id: string | null;
          publicado_em: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          slug: string;
          titulo: string;
          resumo?: string | null;
          conteudo_html?: string;
          capa_url?: string | null;
          categoria_id?: string | null;
          tags?: string[];
          status?: StatusPost;
          autor?: string | null;
          autor_id?: string | null;
          publicado_em?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          titulo?: string;
          resumo?: string | null;
          conteudo_html?: string;
          capa_url?: string | null;
          categoria_id?: string | null;
          tags?: string[];
          status?: StatusPost;
          autor?: string | null;
          autor_id?: string | null;
          publicado_em?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posts_categoria_id_fkey";
            columns: ["categoria_id"];
            isOneToOne: false;
            referencedRelation: "categorias";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_autor_id_fkey";
            columns: ["autor_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      ebook_leads: {
        Row: {
          id: string;
          nome: string;
          whatsapp: string;
          lgpd_consent: boolean;
          lgpd_consent_at: string | null;
          origem: string;
          downloads: number;
          created_at: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          nome: string;
          whatsapp: string;
          lgpd_consent?: boolean;
          lgpd_consent_at?: string | null;
          origem?: string;
          downloads?: number;
          created_at?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          whatsapp?: string;
          lgpd_consent?: boolean;
          lgpd_consent_at?: string | null;
          origem?: string;
          downloads?: number;
          created_at?: string;
          atualizado_em?: string;
        };
        Relationships: [];
      };
      visitas: {
        Row: {
          id: number;
          path: string;
          referrer: string | null;
          session_id: string | null;
          user_agent: string | null;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          path: string;
          referrer?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          path?: string;
          referrer?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          is_admin?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      pode_postar: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      solicitar_escuta: {
        Args: {
          p_nome: string;
          p_email: string;
          p_telefone?: string | null;
          p_cidade_uf?: string | null;
          p_relacao: TipoRelacao;
          p_lgpd_consent: boolean;
          p_dia_semana: number;
          p_hora_inicio: string;
          p_hora_fim: string;
          p_modalidade: Modalidade;
          p_mensagem?: string | null;
        };
        Returns: Json;
      };
      registrar_lead_ebook: {
        Args: {
          p_nome: string;
          p_whatsapp: string;
          p_lgpd_consent: boolean;
          p_origem?: string | null;
        };
        Returns: Json;
      };
      registrar_visita: {
        Args: {
          p_path: string;
          p_referrer?: string | null;
          p_session_id?: string | null;
          p_user_agent?: string | null;
          p_is_admin?: boolean;
        };
        Returns: undefined;
      };
      visitas_por_dia: {
        Args: { p_dias?: number };
        Returns: { dia: string; total: number; unicos: number }[];
      };
      paginas_mais_vistas: {
        Args: { p_dias?: number; p_limite?: number };
        Returns: { path: string; total: number; unicos: number }[];
      };
      resumo_visitas: {
        Args: { p_dias?: number };
        Returns: {
          total: number;
          unicos: number;
          hoje: number;
          ultimos_7_dias: number;
        }[];
      };
    };
    Enums: {
      modalidade: Modalidade;
      tipo_relacao: TipoRelacao;
      status_solicitacao: StatusSolicitacao;
      status_disponibilidade: StatusDisponibilidade;
      status_indicacao: StatusIndicacao;
      status_post: StatusPost;
    };
    CompositeTypes: Record<string, never>;
  };
}