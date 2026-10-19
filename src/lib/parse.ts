/**
 * Transforma texto solto de mensagens (WhatsApp, Telegram, Classroom, e-mail) em avisos
 * estruturados: separa as mensagens, descobre o tipo, a disciplina e o prazo.
 */
import { normalizar } from './ml';
import type { Aviso, FonteId, TipoAviso } from './types';

const DIAS_SEMANA = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

/** Procura uma data/hora de entrega no texto. Devolve null se não achar nenhuma. */
export function extrairPrazo(texto: string, base: Date = new Date()): Date | null {
  return extrairPrazoDetalhado(texto, base)?.data ?? null;
}

/** Como `extrairPrazo`, mas também diz se o texto trazia o horário (sem horário, usa 23h59). */
export function extrairPrazoDetalhado(texto: string, base: Date = new Date()): { data: Date; temHora: boolean } | null {
  const t = normalizar(texto);
  let data: Date | null = null;

  const dm = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (dm) {
    const dia = Number(dm[1]);
    const mes = Number(dm[2]) - 1;
    let ano = dm[3] ? Number(dm[3]) : base.getFullYear();
    if (ano < 100) ano += 2000;
    const candidata = new Date(ano, mes, dia);
    if (candidata.getMonth() === mes) {
      // Sem ano no texto e a data já passou: assume o próximo ano
      if (!dm[3] && candidata.getTime() < base.getTime() - 86400000) candidata.setFullYear(ano + 1);
      data = candidata;
    }
  } else if (/\bamanha\b/.test(t)) {
    data = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1);
  } else if (/\bhoje\b/.test(t)) {
    data = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  } else {
    for (let i = 0; i < DIAS_SEMANA.length; i++) {
      if (new RegExp(`\\b${DIAS_SEMANA[i]}\\b`).test(t)) {
        const falta = (i - base.getDay() + 7) % 7 || 7;
        data = new Date(base.getFullYear(), base.getMonth(), base.getDate() + falta);
        break;
      }
    }
  }
  if (!data) return null;

  const hora = t.match(/\b(\d{1,2})(?::|h)(\d{2})?\b/);
  if (hora && Number(hora[1]) < 24) {
    data.setHours(Number(hora[1]), Number(hora[2] ?? 0), 0, 0);
    return { data, temHora: true };
  }
  data.setHours(23, 59, 0, 0);
  return { data, temHora: false };
}

export function detectarTipo(texto: string): TipoAviso {
  const t = normalizar(texto);
  if (/\b(prova|avaliacao|exame|entrega|entregar|prazo|lista|trabalho|atividade|questionario|seminario|p1|p2|1va|2va)\b/.test(t)) {
    return 'prazo';
  }
  if (/\b(slide|slides|apostila|material|pdf|link|video|aula gravada|resumo|gabarito)\b/.test(t)) {
    return 'material';
  }
  return 'comunicado';
}

/** Tenta ligar o texto a uma disciplina conhecida pelo nome ou por palavras do nome. */
export function detectarDisciplina(texto: string, disciplinas: string[]): string | undefined {
  const t = normalizar(texto);
  let melhor: { nome: string; pontos: number } | undefined;
  for (const nome of disciplinas) {
    const palavras = normalizar(nome)
      .split(/\s+/)
      .filter((p) => p.length > 3);
    const pontos = palavras.filter((p) => t.includes(p)).length;
    if (pontos > 0 && (!melhor || pontos > melhor.pontos)) melhor = { nome, pontos };
  }
  return melhor?.nome;
}

interface Mensagem {
  texto: string;
  data?: Date;
}

const PADROES_EXPORTACAO = [
  // [12/10/2026 14:30] Fulano: texto   (WhatsApp)
  /^\[(\d{1,2})\/(\d{1,2})\/(\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::\d{2})?\]\s*[^:]+:\s*(.*)$/,
  // 12/10/2026 14:30 - Fulano: texto   (WhatsApp, outro formato)
  /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),?\s+(\d{1,2}):(\d{2})\s*-\s*[^:]+:\s*(.*)$/,
];

/** Separa um texto colado em mensagens. Entende a exportação do WhatsApp; senão usa linhas em branco. */
export function separarMensagens(bruto: string): Mensagem[] {
  const linhas = bruto.replace(/\r/g, '').split('\n');
  const mensagens: Mensagem[] = [];
  let atual: Mensagem | null = null;
  let achouPadrao = false;

  for (const linha of linhas) {
    let casou = false;
    for (const regex of PADROES_EXPORTACAO) {
      const m = linha.match(regex);
      if (m) {
        casou = achouPadrao = true;
        let ano = Number(m[3]);
        if (ano < 100) ano += 2000;
        atual = {
          texto: m[6],
          data: new Date(ano, Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5])),
        };
        mensagens.push(atual);
        break;
      }
    }
    if (!casou && achouPadrao && atual && linha.trim()) atual.texto += ` ${linha.trim()}`;
  }
  if (achouPadrao) return mensagens.filter((m) => m.texto.trim().length > 0);

  const blocos = bruto.replace(/\r/g, '').split(/\n\s*\n/);
  const porBloco = blocos.map((b) => b.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
  if (porBloco.length > 1) return porBloco.map((texto) => ({ texto }));
  return linhas.map((l) => l.trim()).filter(Boolean).map((texto) => ({ texto }));
}

export function criarAvisos(
  bruto: string,
  fonte: FonteId,
  disciplinas: string[],
  agora: Date = new Date()
): Aviso[] {
  return separarMensagens(bruto)
    .filter((m) => m.texto.trim().length >= 8)
    .map((m, i) => {
      const recebido = m.data ?? agora;
      const prazo = extrairPrazoDetalhado(m.texto, recebido);
      const tipo = detectarTipo(m.texto);
      const temPrazo = tipo === 'prazo' && prazo !== null;
      return {
        id: `${fonte}-${recebido.getTime()}-${i}-${Math.abs(hash(m.texto))}`,
        fonte,
        texto: m.texto.trim(),
        recebidoEm: recebido.toISOString(),
        tipo,
        disciplina: detectarDisciplina(m.texto, disciplinas),
        prazo: temPrazo ? prazo.data.toISOString() : undefined,
        prazoSemHora: temPrazo && !prazo.temHora ? true : undefined,
      };
    });
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
