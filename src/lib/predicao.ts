import { ErroPonte } from './api';

export interface DadosPredicao {
  study_hours_per_day?: number | null;
  sleep_hours?: number | null;
  mental_stress_level?: number | null;
  class_attendance_percent?: number | null;
  social_media_hours?: number | null;
  age?: number | null;
}

export interface ResultadoPredicao {
  gpa: number;
  modelo: string;
  perfil: string;
  features: string[];
}

export async function buscarPredicao(ponte: string, dados: DadosPredicao): Promise<ResultadoPredicao> {
  const controlador = new AbortController();
  const limite = setTimeout(() => controlador.abort(), 120000);
  try {
    const resposta = await fetch(`${ponte.replace(/\/$/, '')}/predicao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dados }),
      signal: controlador.signal,
    });
    const corpo = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new ErroPonte(corpo.erro ?? 'Não foi possível calcular a previsão.');
    return corpo.resultado as ResultadoPredicao;
  } catch (erro) {
    if (erro instanceof ErroPonte) throw erro;
    if ((erro as Error)?.name === 'AbortError') {
      throw new ErroPonte('O motor preditivo demorou demais para responder.');
    }
    throw new ErroPonte('Não consegui falar com o motor preditivo.');
  } finally {
    clearTimeout(limite);
  }
}
