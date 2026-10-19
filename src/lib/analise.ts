/**
 * Indicadores simples sobre desempenho e rotina (Pergunta de pesquisa 2).
 * São regras transparentes calculadas no aparelho. Os modelos de regressão do artigo
 * (Regressão Linear, Random Forest, Gradient Boosting) são treinados no repositório de
 * análise de dados e ainda não rodam dentro do app.
 */
import type { HistoricoDisciplina, RegistroDiario } from './types';

export interface MediasRotina {
  dias: number;
  sono: number;
  estudo: number;
  estresse: number;
}

export function mediasRotina(diario: RegistroDiario[], n = 7): MediasRotina | null {
  const recentes = diario.slice(-n);
  if (recentes.length === 0) return null;
  const media = (f: (r: RegistroDiario) => number) => recentes.reduce((s, r) => s + f(r), 0) / recentes.length;
  return {
    dias: recentes.length,
    sono: media((r) => r.sonoHoras),
    estudo: media((r) => r.estudoHoras),
    estresse: media((r) => r.estresse),
  };
}

export function alertasRotina(m: MediasRotina | null): string[] {
  if (!m || m.dias < 3) return [];
  const alertas: string[] = [];
  if (m.sono < 6) alertas.push(`Você dormiu em média ${fmt(m.sono)} h por noite. Dormir pouco costuma derrubar o rendimento.`);
  if (m.estresse >= 4) alertas.push('Seu estresse está alto nos últimos dias. Vale reservar tempo para descanso.');
  if (m.estudo >= 5 && m.sono < 6.5) alertas.push('Muitas horas de estudo com pouco sono. Rever o ritmo pode render mais.');
  return alertas;
}

export interface PontoAtencao {
  /** Único na lista: a mesma disciplina pode aparecer em mais de um período. */
  id: string;
  codigo: string;
  periodo: string;
  titulo: string;
  motivo: string;
}

export function pontosDeAtencao(historico: HistoricoDisciplina[]): PontoAtencao[] {
  const pontos: PontoAtencao[] = [];
  historico.forEach((h, i) => {
    const motivos: string[] = [];
    if (h.mediaFinal !== null && h.mediaFinal < 6) motivos.push(`média ${fmt(h.mediaFinal)}`);
    if (h.faltas !== null && h.faltas >= 10) motivos.push(`${h.faltas} faltas`);
    if (/reprov/i.test(h.situacao)) motivos.push('reprovada');
    if (motivos.length > 0) {
      pontos.push({
        id: `${h.periodo}|${h.codigo}|${i}`,
        codigo: h.codigo,
        periodo: h.periodo,
        titulo: h.titulo,
        motivo: [h.periodo ? `período ${h.periodo}` : '', ...motivos].filter(Boolean).join(' · '),
      });
    }
  });
  return pontos;
}

export function fmt(n: number): string {
  return n.toFixed(1).replace('.', ',');
}
