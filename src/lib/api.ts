import { Platform } from 'react-native';
import type { ResumoSigaa } from './types';

/**
 * Endereço padrão da ponte com o SIGAA (pasta /server).
 * - Web e iOS Simulator: localhost
 * - Emulador Android: 10.0.2.2 aponta para o computador
 * - Celular físico: use o IP do computador na rede (ex.: http://192.168.0.10:3333), na tela Fontes.
 */
export const PONTE_PADRAO =
  process.env.EXPO_PUBLIC_SIGAA_BRIDGE_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:3333' : 'http://localhost:3333');

export class ErroPonte extends Error {}

export async function buscarResumoSigaa(
  ponte: string,
  usuario: string,
  senha: string
): Promise<ResumoSigaa> {
  const controlador = new AbortController();
  const limite = setTimeout(() => controlador.abort(), 60000);
  try {
    const resposta = await fetch(`${ponte.replace(/\/$/, '')}/sigaa/resumo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, senha }),
      signal: controlador.signal,
    });
    const corpo = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new ErroPonte(corpo.erro ?? 'Não foi possível ler o SIGAA.');
    return corpo as ResumoSigaa;
  } catch (erro) {
    if (erro instanceof ErroPonte) throw erro;
    if ((erro as Error)?.name === 'AbortError') {
      throw new ErroPonte('O SIGAA demorou demais para responder. Tente de novo.');
    }
    throw new ErroPonte(
      'Não consegui falar com a ponte do SIGAA. Confira se ela está ligada e se o endereço está certo.'
    );
  } finally {
    clearTimeout(limite);
  }
}
