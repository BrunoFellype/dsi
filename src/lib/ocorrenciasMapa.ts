/**
 * Avisos do campus feitos pelos próprios alunos: área em manutenção e evento acontecendo.
 * Cada aviso fica ligado a um pino do mapa; o pino muda de cor enquanto o aviso estiver valendo
 * e volta à cor normal quando ele acaba, é removido ou nunca existiu.
 */
export type TipoOcorrencia = 'manutencao' | 'evento';

export interface OcorrenciaMapa {
  id: string;
  localId: string;
  tipo: TipoOcorrencia;
  titulo: string;
  /** ISO. Depois dessa hora o aviso deixa de valer e o pino volta ao normal. */
  ate: string;
  criadoEm: string;
}

/** Cores chamativas, bem diferentes do cinza e do azul dos pinos normais. */
export const COR_OCORRENCIA: Record<TipoOcorrencia, string> = {
  manutencao: '#F97316',
  evento: '#DB2777',
};

export const ROTULO_OCORRENCIA: Record<TipoOcorrencia, string> = {
  manutencao: 'Em manutenção',
  evento: 'Evento',
};

/** Durações oferecidas ao criar o aviso (horas). */
export const DURACOES_HORAS = [2, 8, 24, 72, 168];

export function rotuloDuracao(horas: number): string {
  if (horas < 24) return `${horas} h`;
  const dias = horas / 24;
  return dias === 1 ? '1 dia' : `${dias} dias`;
}

export function novaOcorrencia(
  dados: { localId: string; tipo: TipoOcorrencia; titulo: string; horas: number },
  agora: Date = new Date()
): OcorrenciaMapa | null {
  const titulo = dados.titulo.trim().slice(0, 80);
  if (!dados.localId || !titulo || !(dados.horas > 0)) return null;
  return {
    id: `oc-${agora.getTime()}-${Math.abs(hash(`${dados.localId}${titulo}`))}`,
    localId: dados.localId,
    tipo: dados.tipo,
    titulo,
    ate: new Date(agora.getTime() + dados.horas * 3600000).toISOString(),
    criadoEm: agora.toISOString(),
  };
}

/** Só os avisos que ainda valem. */
export function ocorrenciasAtivas(lista: OcorrenciaMapa[], agora: Date = new Date()): OcorrenciaMapa[] {
  return lista.filter((o) => new Date(o.ate).getTime() > agora.getTime());
}

/** Por pino: manutenção ganha de evento (é o que o aluno mais precisa saber antes de ir). */
export function destaquePorLocal(lista: OcorrenciaMapa[], agora: Date = new Date()): Record<string, TipoOcorrencia> {
  const mapa: Record<string, TipoOcorrencia> = {};
  for (const o of ocorrenciasAtivas(lista, agora)) {
    if (o.tipo === 'manutencao' || !mapa[o.localId]) mapa[o.localId] = o.tipo;
  }
  return mapa;
}

export function removerOcorrencia(lista: OcorrenciaMapa[], id: string): OcorrenciaMapa[] {
  return lista.filter((o) => o.id !== id);
}

/** Lê o que estava salvo; descarta lixo e avisos já vencidos. */
export function lerOcorrenciasSalvas(bruto: string | null, agora: Date = new Date()): OcorrenciaMapa[] {
  if (!bruto) return [];
  try {
    const lista = JSON.parse(bruto);
    if (!Array.isArray(lista)) return [];
    return ocorrenciasAtivas(
      lista.filter(
        (o): o is OcorrenciaMapa =>
          o &&
          typeof o.id === 'string' &&
          typeof o.localId === 'string' &&
          (o.tipo === 'manutencao' || o.tipo === 'evento') &&
          typeof o.titulo === 'string' &&
          typeof o.ate === 'string' &&
          !Number.isNaN(new Date(o.ate).getTime())
      ),
      agora
    );
  } catch {
    return [];
  }
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
