export type FonteId = 'sigaa' | 'classroom' | 'whatsapp' | 'telegram' | 'discord' | 'email' | 'manual';

export type TipoAviso = 'prazo' | 'comunicado' | 'material';

export interface Aviso {
  id: string;
  fonte: FonteId;
  texto: string;
  /** Quando a mensagem foi enviada (ISO). */
  recebidoEm: string;
  tipo: TipoAviso;
  disciplina?: string;
  /** Data de entrega/prova encontrada dentro do texto (ISO). */
  prazo?: string;
  /** O texto tinha a data mas não o horário: o app pede para o estudante confirmar. */
  prazoSemHora?: boolean;
  /** O estudante disse que o horário não foi informado. */
  horaNaoInformada?: boolean;
  categoria?: TipoAviso;
  /** Usuário responsável pela publicação (professor ou autor). */
  autor?: string;
}

export type MensagemImportada = Aviso;

export interface Atividade {
  id: string;
  titulo: string;
  disciplina?: string;
  /** Identificador da disciplina associada (ex.: Classroom ou SIGAA). */
  disciplinaId?: string;
  data: string;
  fonte: FonteId;
  tipo: 'tarefa' | 'avaliacao' | 'questionario' | 'prova';
  concluida: boolean;
  /** Falta confirmar o horário (a data veio sem hora). */
  semHora?: boolean;
  /** O horário não foi informado (escolha do estudante). */
  horaNaoInformada?: boolean;
  descricao?: string;
  nota?: number;
}

/** Disciplina unificada oriunda do SIGAA ou do Google Classroom. */
export interface Disciplina {
  id: string;
  codigo: string;
  nome: string;
  media?: number;
  faltas?: number;
  cargaHoraria?: number;
  fonte?: FonteId;
}

export interface IndiceAcademico {
  code: string;
  name: string;
  value: number;
}

export interface DisciplinaSigaa {
  codigo: string;
  titulo: string;
  periodo: string;
  /** Faltas lançadas até agora (aba Frequência da turma). */
  faltas?: number | null;
  /** Máximo de faltas permitido (25% da carga horária). */
  maxFaltas?: number | null;
}

export interface HistoricoDisciplina {
  periodo: string;
  codigo: string;
  titulo: string;
  mediaFinal: number | null;
  faltas: number | null;
  situacao: string;
  /** Carga horária, quando o relatório do SIGAA mostra essa coluna. */
  cargaHoraria?: number | null;
}

/** Resposta da ponte com o SIGAA. */
export interface ResumoSigaa {
  demo: boolean;
  aluno: { matricula: string; curso: string };
  indices: IndiceAcademico[];
  atividades: {
    id: string;
    tipo: 'tarefa' | 'avaliacao' | 'questionario';
    titulo: string;
    disciplina: string;
    data: string;
    concluida: boolean;
  }[];
  disciplinas: DisciplinaSigaa[];
  historico: HistoricoDisciplina[];
}

export interface RegistroDiario {
  /** Dia no formato AAAA-MM-DD. */
  dia: string;
  sonoHoras: number;
  estudoHoras: number;
  /** 1 (tranquilo) a 5 (muito estressado). */
  estresse: number;
}

export interface Grupo {
  id: string;
  rotulo: string;
  avisos: Aviso[];
}

/** Estado da conexão e sincronização com o Google Classroom. */
export interface StatusClassroom {
  /** Indica se há uma conta Google vinculada com acesso autorizado ao Classroom. */
  conectado: boolean;
  /** Indica se há uma sincronização em andamento via Classroom API. */
  sincronizando: boolean;
  /** E-mail da conta Google conectada. */
  email?: string;
  /** Timestamp ISO da última sincronização bem-sucedida. */
  ultimaSincronizacao?: string;
  /** Mensagem de erro caso a última tentativa de sincronização tenha falhado. */
  erro?: string | null;
}