/**
 * Ponte ASTRA <-> SIGAA (UFRPE).
 *
 * O app de celular não consegue rodar a sigaa-api (ela é feita para Node), então
 * este servidor faz o login no SIGAA, lê os dados e devolve um JSON simples.
 *
 * Privacidade: a senha do SIGAA é usada só durante a requisição. Não é gravada
 * e não vai para log.
 *
 *   npm start   -> usa o SIGAA real
 *   npm run mock -> usa dados de demonstração (sem credenciais)
 */
const http = require('http');
const resumoDemo = require('./mock');
const { ehErroDeCredencial } = require('sigaa-api/resumo');

const PORT = Number(process.env.PORT) || 3333;
const MOCK = process.env.SIGAA_MOCK === '1';
const SIGAA_URL = process.env.SIGAA_URL || 'https://sigs.ufrpe.br';
const ORIGEM_PERMITIDA = process.env.ALLOWED_ORIGIN || '*';
const TRUST_PROXY = process.env.TRUST_PROXY === '1';
const LIMITE_CORPO = 10 * 1024; // 10 KB
const JANELA_MS = 60 * 1000;
const MAX_TENTATIVAS = 5;

const tentativas = new Map(); // ip -> { n, inicio }

function limitarTaxa(ip) {
  const agora = Date.now();
  const t = tentativas.get(ip);
  if (!t || agora - t.inicio > JANELA_MS) {
    tentativas.set(ip, { n: 1, inicio: agora });
    return true;
  }
  t.n += 1;
  return t.n <= MAX_TENTATIVAS;
}

function responder(res, status, corpo) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': ORIGEM_PERMITIDA,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(corpo));
}

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    let dados = '';
    req.on('data', (parte) => {
      dados += parte;
      if (dados.length > LIMITE_CORPO) {
        reject(new Error('corpo grande demais'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(dados || '{}'));
      } catch {
        reject(new Error('JSON inválido'));
      }
    });
    req.on('error', reject);
  });
}

async function buscarNoSigaa(usuario, senha) {
  const { Sigaa } = require('sigaa-api');
  const { buscarResumo } = require('sigaa-api/resumo');
  return buscarResumo(Sigaa, { url: SIGAA_URL, usuario, senha });
}

const servidor = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return responder(res, 204, {});
  if (req.method === 'GET' && req.url === '/saude') {
    return responder(res, 200, { ok: true, modo: MOCK ? 'demonstracao' : 'sigaa' });
  }
  if (req.method !== 'POST' || req.url !== '/sigaa/resumo') {
    return responder(res, 404, { erro: 'Rota não encontrada.' });
  }

  // Atrás de um proxy (Render, Fly, etc.) o IP real vem no cabeçalho X-Forwarded-For
  const encaminhado = TRUST_PROXY ? String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() : '';
  const ip = encaminhado || req.socket.remoteAddress || 'desconhecido';
  if (!limitarTaxa(ip)) {
    return responder(res, 429, { erro: 'Muitas tentativas. Aguarde um minuto.' });
  }

  try {
    if (MOCK) return responder(res, 200, resumoDemo());

    const { usuario, senha } = await lerCorpo(req);
    if (typeof usuario !== 'string' || typeof senha !== 'string' || !usuario || !senha) {
      return responder(res, 400, { erro: 'Informe usuário e senha do SIGAA.' });
    }
    const resumo = await buscarNoSigaa(usuario.trim(), senha);
    return responder(res, 200, resumo);
  } catch (erro) {
    const credenciais = ehErroDeCredencial(erro);
    return responder(res, credenciais ? 401 : 502, {
      erro: credenciais
        ? 'Usuário ou senha do SIGAA incorretos.'
        : 'Não foi possível ler o SIGAA agora. Tente novamente mais tarde.',
    });
  }
});

if (process.env.NODE_ENV === 'production' && ORIGEM_PERMITIDA === '*') {
  console.warn('Aviso: defina ALLOWED_ORIGIN com o endereço do app web para limitar quem pode usar a ponte.');
}

servidor.listen(PORT, () => {
  console.log(`Ponte ASTRA-SIGAA em http://localhost:${PORT} (${MOCK ? 'demonstração' : 'SIGAA real'})`);
});
