const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export function inicioDoDia(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function diasAte(data: Date, base: Date = new Date()): number {
  return Math.round((inicioDoDia(data).getTime() - inicioDoDia(base).getTime()) / 86400000);
}

export function hora(data: Date): string {
  const h = data.getHours();
  const m = data.getMinutes();
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

/** "Hoje", "Amanhã", "Seg, 12 out". */
export function rotuloDia(data: Date, base: Date = new Date()): string {
  const n = diasAte(data, base);
  if (n === 0) return 'Hoje';
  if (n === 1) return 'Amanhã';
  if (n === -1) return 'Ontem';
  const dia = DIAS[data.getDay()];
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)}, ${data.getDate()} ${MESES[data.getMonth()]}`;
}

/** "Hoje, 23h59" ou "Em 3 dias". Texto curto para listas. */
export function rotuloPrazo(data: Date, base: Date = new Date()): string {
  const n = diasAte(data, base);
  if (n < 0) return `Atrasado ${-n} d`;
  if (n === 0) return `Hoje, ${hora(data)}`;
  if (n === 1) return `Amanhã, ${hora(data)}`;
  return `${rotuloDia(data, base)}, ${hora(data)}`;
}

export function chaveDia(data: Date): string {
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const d = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${m}-${d}`;
}

/** "há 5 min", "há 3 h", "há 2 d". */
export function haQuanto(iso: string, agora: Date = new Date()): string {
  const min = Math.max(0, Math.round((agora.getTime() - new Date(iso).getTime()) / 60000));
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  if (min < 1440) return `há ${Math.round(min / 60)} h`;
  return `há ${Math.round(min / 1440)} d`;
}

/** Converte "25/10" ou "25/10/2026" e "14:30" em Date. Devolve null se for inválido. */
export function lerDataHora(dataTxt: string, horaTxt: string, base: Date = new Date()): Date | null {
  const dm = dataTxt.trim().match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (!dm) return null;
  let ano = dm[3] ? Number(dm[3]) : base.getFullYear();
  if (ano < 100) ano += 2000;
  const d = new Date(ano, Number(dm[2]) - 1, Number(dm[1]));
  if (d.getMonth() !== Number(dm[2]) - 1) return null;
  const hm = horaTxt.trim().match(/^(\d{1,2})(?::|h)?(\d{2})?$/);
  if (horaTxt.trim() && !hm) return null;
  if (hm) {
    const h = Number(hm[1]);
    const m = Number(hm[2] ?? 0);
    if (h > 23 || m > 59) return null;
    d.setHours(h, m, 0, 0);
  } else {
    d.setHours(23, 59, 0, 0);
  }
  return d;
}
