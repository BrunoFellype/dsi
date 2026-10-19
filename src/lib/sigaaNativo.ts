/**
 * SIGAA direto do celular (iOS e Android): a biblioteca sigaa-api roda dentro do app,
 * sem servidor. O Metro troca a camada HTTP do Node por `sigaa-http.native.js`.
 *
 * São duas tentativas:
 *  1. `expo/fetch`, com redirecionamentos e cookies tratados pela própria biblioteca;
 *  2. o `fetch` do React Native, que segue redirecionamentos e guarda cookies no aparelho.
 * Se a primeira falhar por algo que não seja senha errada, a segunda é tentada.
 *
 * As leituras rodam uma de cada vez: duas sessões ao mesmo tempo (ex.: a atualização automática
 * ao abrir o app e o botão "Conectar") fazem o SIGAA derrubar uma delas ("Session expired").
 */
import { ehErroDeCredencialSigaa, mensagemCompletaSigaa, mensagemDoErro } from './errosSigaa';
import type { ResumoSigaa } from './types';

export const sigaaNativoDisponivel = true;

const URL_SIGAA = 'https://sigs.ufrpe.br';
/** Tempo máximo de cada tentativa completa (login + leitura). */
const TEMPO_TENTATIVA_MS = 90000;

export class ErroSigaa extends Error {}

type FetchSigaa = (url: string, init: RequestInit) => Promise<Response>;

/** `fetch` do React Native: o Android/iOS seguem redirecionamentos e guardam os cookies da sessão. */
const fetchDoAparelho: FetchSigaa = (url, init) =>
  fetch(url, {
    method: init.method,
    headers: init.headers,
    body: init.body,
    signal: init.signal,
    credentials: 'include',
  });

/** Apaga os cookies que o aparelho guardou, para a segunda tentativa não reusar uma sessão vencida. */
function limparCookiesDoAparelho(): Promise<void> {
  return new Promise((resolve) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const rede = require('react-native/Libraries/Network/RCTNetworking').default;
      rede.clearCookies(() => resolve());
    } catch {
      resolve();
    }
  });
}

const ehSessaoExpirada = (mensagem: string) => /session expired|expirad/i.test(mensagem);

/** Fila: uma leitura do SIGAA por vez. */
let fila: Promise<unknown> = Promise.resolve();

function comTempoLimite<T>(promessa: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const limite = setTimeout(() => reject(new Error('tempo esgotado esperando o SIGAA')), ms);
    promessa.then(
      (valor) => {
        clearTimeout(limite);
        resolve(valor);
      },
      (erro) => {
        clearTimeout(limite);
        reject(erro);
      }
    );
  });
}

export function buscarResumoNativo(usuario: string, senha: string): Promise<ResumoSigaa> {
  const leitura = fila.then(
    () => lerSigaa(usuario, senha),
    () => lerSigaa(usuario, senha)
  );
  fila = leitura.catch(() => {});
  return leitura;
}

async function lerSigaa(usuario: string, senha: string): Promise<ResumoSigaa> {
  // Carregado só quando necessário: a biblioteca é grande e só faz sentido depois do login
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { Sigaa } = require('../../vendor/sigaa-api/dist/sigaa-all-types');
  const { buscarResumo } = require('../../vendor/sigaa-api/resumo');
  /* eslint-enable @typescript-eslint/no-require-imports */
  const global = globalThis as { __SIGAA_FETCH__?: FetchSigaa };
  const tentativas: { nome: string; fetch?: FetchSigaa }[] = [
    { nome: 'expo', fetch: undefined },
    { nome: 'aparelho', fetch: fetchDoAparelho },
  ];
  const erros: string[] = [];

  for (const tentativa of tentativas) {
    // Sessão vencida costuma ser passageira: cada forma de conexão tenta duas vezes, do zero
    for (let vez = 1; vez <= 2; vez++) {
      if (tentativa.fetch) await limparCookiesDoAparelho();
      global.__SIGAA_FETCH__ = tentativa.fetch;
      try {
        return (await comTempoLimite(
          buscarResumo(Sigaa, { url: URL_SIGAA, usuario, senha }),
          TEMPO_TENTATIVA_MS
        )) as ResumoSigaa;
      } catch (erro) {
        const mensagem = mensagemDoErro(erro);
        if (ehErroDeCredencialSigaa(mensagem)) throw new ErroSigaa('Usuário ou senha do SIGAA incorretos.');
        erros.push(`${tentativa.nome}: ${mensagem}`);
        if (!ehSessaoExpirada(mensagem)) break;
      } finally {
        global.__SIGAA_FETCH__ = undefined;
      }
    }
  }
  throw new ErroSigaa(mensagemCompletaSigaa(erros));
}
