/**
 * Decide quais lembretes agendar. Fica separado do código do celular para poder ser testado.
 * Cada atividade pendente gera até dois avisos: 1 dia antes e 2 horas antes do prazo.
 */
import { chaveDia, hora, rotuloDia } from './datas';
import type { Atividade } from './types';

export interface Lembrete {
  /** Identificador estável: mesma atividade e mesmo tipo de aviso geram o mesmo id. */
  id: string;
  quando: Date;
  titulo: string;
  corpo: string;
}

/** O iOS aceita no máximo 64 notificações agendadas; deixamos folga. */
export const LIMITE_LEMBRETES = 60;

const HORA_MS = 3600000;

export function calcularLembretes(
  atividades: Atividade[],
  agora: Date = new Date(),
  limite: number = LIMITE_LEMBRETES
): Lembrete[] {
  const lista: Lembrete[] = [];
  for (const a of atividades) {
    if (a.concluida) continue;
    const prazo = new Date(a.data);
    if (isNaN(prazo.getTime())) continue;

    const detalhe = [a.disciplina, `${rotuloDia(prazo, agora)}, ${hora(prazo)}`].filter(Boolean).join(' · ');
    const umDiaAntes = new Date(prazo.getTime() - 24 * HORA_MS);
    const duasHorasAntes = new Date(prazo.getTime() - 2 * HORA_MS);

    if (umDiaAntes > agora) {
      lista.push({ id: `${a.id}:dia`, quando: umDiaAntes, titulo: `Amanhã: ${a.titulo}`, corpo: detalhe });
    }
    if (duasHorasAntes > agora) {
      lista.push({ id: `${a.id}:horas`, quando: duasHorasAntes, titulo: `Em 2 horas: ${a.titulo}`, corpo: detalhe });
    }
  }
  return lista.sort((x, y) => x.quando.getTime() - y.quando.getTime()).slice(0, limite);
}

/** Dias à frente que ganham um resumo da manhã. */
const DIAS_DE_RESUMO = 7;
const HORA_DO_RESUMO = 7;
const MINUTO_DO_RESUMO = 30;

/**
 * Resumo das 7h30: um aviso por dia com os prazos daquele dia.
 * Só gera resumo para dias que têm algo pendente.
 */
export function calcularResumosDiarios(atividades: Atividade[], agora: Date = new Date()): Lembrete[] {
  const lista: Lembrete[] = [];
  for (let i = 0; i < DIAS_DE_RESUMO; i++) {
    const quando = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + i, HORA_DO_RESUMO, MINUTO_DO_RESUMO);
    if (quando <= agora) continue;
    const doDia = atividades
      .filter((a) => !a.concluida && !isNaN(new Date(a.data).getTime()) && chaveDia(new Date(a.data)) === chaveDia(quando))
      .sort((x, y) => x.data.localeCompare(y.data));
    if (doDia.length === 0) continue;
    const titulo = doDia.length === 1 ? 'Hoje: 1 prazo' : `Hoje: ${doDia.length} prazos`;
    const corpo = doDia.map((a) => `${hora(new Date(a.data))} ${a.titulo}`).join('\n');
    lista.push({ id: `resumo:${chaveDia(quando)}`, quando, titulo, corpo });
  }
  return lista;
}

export interface OpcoesNotificacao {
  lembretes: boolean;
  resumoDiario: boolean;
}

/** Junta lembretes e resumos respeitando o limite de notificações agendadas do sistema. */
export function calcularNotificacoes(
  atividades: Atividade[],
  opcoes: OpcoesNotificacao,
  agora: Date = new Date()
): Lembrete[] {
  const resumos = opcoes.resumoDiario ? calcularResumosDiarios(atividades, agora) : [];
  const lembretes = opcoes.lembretes ? calcularLembretes(atividades, agora, LIMITE_LEMBRETES - resumos.length) : [];
  return [...lembretes, ...resumos].sort((x, y) => x.quando.getTime() - y.quando.getTime());
}
