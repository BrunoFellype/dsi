/**
 * Prazos que chegaram com a data mas sem o horário (ex.: "prova dia 25/10").
 * O app pede ao estudante para confirmar o horário ou marcar "não informado".
 */
import { diasAte, hora, rotuloDia, rotuloPrazo } from './datas';
import type { Atividade } from './types';

export const NAO_INFORMADO = 'nao-informado';

/** Horários comuns oferecidos como atalho. */
export const HORARIOS_SUGERIDOS = ['08:00', '10:00', '14:00', '18:00', '23:59'];

/** Lê "14:30", "14h30", "14h" ou "9". Devolve null se for inválido. */
export function lerHora(texto: string): { h: number; m: number } | null {
  const hm = texto.trim().match(/^(\d{1,2})(?:(?::|h)(\d{2})?)?$/i);
  if (!hm) return null;
  const h = Number(hm[1]);
  const m = Number(hm[2] ?? 0);
  if (h > 23 || m > 59) return null;
  return { h, m };
}

/** Chave estável do horário: no SIGAA o id muda a cada leitura, então usa título e dia. */
export function chaveHorario(a: Pick<Atividade, 'id' | 'fonte' | 'titulo' | 'data'>): string {
  return a.fonte === 'sigaa' ? `sigaa|${a.titulo}|${a.data.slice(0, 10)}` : a.id;
}

/** No SIGAA, provas e tarefas sem horário vêm à meia-noite. */
export function semHoraNoSigaa(iso: string): boolean {
  // O SIGAA fala em horário de Brasília (UTC-3), seja qual for o fuso da máquina.
  const b = new Date(new Date(iso).getTime() - 3 * 3600000);
  return b.getUTCHours() === 0 && b.getUTCMinutes() === 0;
}

/** Aplica os horários confirmados pelo estudante às atividades que estavam sem hora. */
export function aplicarHorarios(atividades: Atividade[], horarios: Record<string, string>): Atividade[] {
  return atividades.map((a) => {
    if (!a.semHora) return a;
    const valor = horarios[chaveHorario(a)];
    if (!valor) return a;
    if (valor === NAO_INFORMADO) return { ...a, semHora: false, horaNaoInformada: true };
    const hm = lerHora(valor);
    if (!hm) return a;
    // Mantém o dia de Brasília e troca só a hora (também em horário de Brasília).
    const b = new Date(new Date(a.data).getTime() - 3 * 3600000);
    const d = new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate(), hm.h + 3, hm.m));
    return { ...a, data: d.toISOString(), semHora: false, horaNaoInformada: false };
  });
}

/** Atividades de hoje em diante, não concluídas, que ainda esperam o horário. */
export function pendentesDeHorario(atividades: Atividade[], agora: Date = new Date()): Atividade[] {
  return atividades.filter((a) => a.semHora && !a.concluida && diasAte(new Date(a.data), agora) >= 0);
}

/** Hora para mostrar na lista: "14h30", "Horário a confirmar" ou "Horário não informado". */
export function textoHora(a: Pick<Atividade, 'data' | 'semHora' | 'horaNaoInformada'>): string {
  if (a.semHora) return 'Horário a confirmar';
  if (a.horaNaoInformada) return 'Horário não informado';
  return hora(new Date(a.data));
}

/** Prazo curto: "Amanhã, 14h" ou só "Amanhã" quando não há horário. */
export function textoPrazo(a: Pick<Atividade, 'data' | 'semHora' | 'horaNaoInformada'>, base: Date = new Date()): string {
  const data = new Date(a.data);
  if (!a.semHora && !a.horaNaoInformada) return rotuloPrazo(data, base);
  const n = diasAte(data, base);
  return n < 0 ? `Atrasado ${-n} d` : rotuloDia(data, base);
}
