/**
 * Teste da camada HTTP nativa em Node, contra um "SIGAA falso" local.
 * O servidor falso imita o que importa no SIGAA real: formulário de login, POST com
 * redirecionamento 302, cookie de sessão, página em ISO-8859-1 e mensagem de senha inválida.
 *
 *   cd server && npm test
 */
const assert = require('node:assert/strict');
const http = require('node:http');
const { test } = require('node:test');
const Module = require('node:module');
const path = require('node:path');

// A camada nativa pede `expo/fetch`; em Node usamos o fetch do próprio Node.
globalThis.__SIGAA_FETCH__ = fetch;

const raiz = path.join(path.dirname(require.resolve('sigaa-api')));
const nativo = require(path.join(raiz, 'session/sigaa-http.native.js'));
const { SigaaHTTP } = nativo;
// No aparelho o Metro escolhe `.native.js` sozinho; em Node trocamos o módulo à mão
const caminhoNode = require.resolve(path.join(raiz, 'session/sigaa-http.js'));
require.cache[caminhoNode] = { id: caminhoNode, filename: caminhoNode, loaded: true, exports: nativo };
const { Sigaa } = require(path.join(raiz, 'sigaa-all-types.js'));
void Module;

const latin1 = (texto) => Buffer.from(texto, 'latin1');
const SENHA_CERTA = 'senha-certa';

function criarServidor() {
  const requisicoes = [];
  const servidor = http.createServer((req, res) => {
    const corpo = [];
    req.on('data', (c) => corpo.push(c));
    req.on('end', () => {
      const dados = Buffer.concat(corpo).toString('latin1');
      requisicoes.push({ metodo: req.method, url: req.url, cookie: req.headers.cookie, dados });
      const html = (texto, extra = {}) => {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=ISO-8859-1', ...extra });
        res.end(latin1(texto));
      };

      if (req.url === '/sigaa/verTelaLogin.do') {
        return html(
          `<html><body><form name="loginForm" action="/sigaa/logar.do"><input name="dispatch" value="logOn"><input name="user.login"><input name="user.senha"></form></body></html>`,
          { 'Set-Cookie': 'JSESSIONID=abc123; Path=/sigaa; HttpOnly' }
        );
      }
      if (req.url === '/sigaa/logar.do' && req.method === 'POST') {
        if (!req.headers.cookie || !req.headers.cookie.includes('JSESSIONID=abc123')) {
          return html('<html><body>Entrar no Sistema sem cookie</body></html>');
        }
        if (!dados.includes(`user.senha=${SENHA_CERTA}`)) {
          return html(
            '<html><body><form name="loginForm" action="/sigaa/logar.do"></form>Entrar no Sistema. Usuário e/ou senha inválidos</body></html>'
          );
        }
        res.writeHead(302, { Location: '/sigaa/paginaIntermediaria.do', 'Set-Cookie': 'SESSAO=ok; Path=/' });
        return res.end();
      }
      if (req.url === '/sigaa/paginaIntermediaria.do') {
        res.writeHead(302, { Location: '/sigaa/portal.do' });
        return res.end();
      }
      if (req.url === '/sigaa/portal.do') {
        return html('<html><body>Olá, João da Conceição. Ação concluída: matrícula ativa.</body></html>');
      }
      res.writeHead(404);
      res.end();
    });
  });
  return new Promise((resolve) => servidor.listen(0, () => resolve({ servidor, requisicoes, porta: servidor.address().port })));
}

function sessaoFalsa(porta) {
  const cookies = [];
  return {
    cookies,
    getURL: (p) => new URL(p, `http://localhost:${porta}`),
    institutionController: { institution: 'UFRPE', url: new URL(`http://localhost:${porta}`) },
    afterHTTPOptions: async (link, opcoes) => {
      if (cookies.length) opcoes.headers.Cookie = cookies.join('; ');
      return opcoes;
    },
    beforeRequest: async () => null,
    afterSuccessfulRequest: async (page) => {
      const sc = page.headers['set-cookie'];
      if (sc) sc.forEach((c) => cookies.push(c.split(';')[0]));
      return page;
    },
    afterUnsuccessfulRequest: async (erro) => {
      throw erro;
    },
    close() {}
  };
}

test('segue redirecionamentos à mão, guarda cookies e decodifica ISO-8859-1', async () => {
  const { servidor, requisicoes, porta } = await criarServidor();
  try {
    const sessao = sessaoFalsa(porta);
    const clienteHttp = new SigaaHTTP(sessao);

    const login = await clienteHttp.get('/sigaa/verTelaLogin.do');
    assert.equal(login.statusCode, 200);
    assert.deepEqual(login.headers['set-cookie'], ['JSESSIONID=abc123; Path=/sigaa; HttpOnly']);

    const resposta = await clienteHttp.post('/sigaa/logar.do', {
      dispatch: 'logOn',
      'user.login': 'joao',
      'user.senha': SENHA_CERTA
    });
    assert.equal(resposta.statusCode, 302);
    assert.equal(resposta.headers.location, '/sigaa/paginaIntermediaria.do');

    const final = await clienteHttp.followAllRedirect(resposta);
    assert.equal(final.statusCode, 200);
    assert.ok(final.bodyDecoded.includes('João da Conceição'), 'acentos devem sobreviver ao ISO-8859-1');
    assert.ok(final.bodyDecoded.includes('Ação concluída'));

    const post = requisicoes.find((r) => r.metodo === 'POST');
    assert.ok(post.cookie.includes('JSESSIONID=abc123'), 'o cookie da sessão vai junto no POST');
    assert.ok(post.dados.includes('user.login=joao'));
  } finally {
    servidor.close();
  }
});

test('codifica acentos da senha como ISO-8859-1 (igual à biblioteca original)', async () => {
  const { servidor, requisicoes, porta } = await criarServidor();
  try {
    const clienteHttp = new SigaaHTTP(sessaoFalsa(porta));
    await clienteHttp.get('/sigaa/verTelaLogin.do');
    await clienteHttp.post('/sigaa/logar.do', { 'user.senha': 'ação' });
    const post = requisicoes.find((r) => r.metodo === 'POST');
    assert.ok(post.dados.includes('user.senha=a%e7%e3o'), post.dados);
  } finally {
    servidor.close();
  }
});

test('login completo pela biblioteca: senha certa e senha errada', async () => {
  const { servidor, porta } = await criarServidor();
  try {
    const sigaa = new Sigaa({ url: `http://localhost:${porta}`, institution: 'UFRPE' });
    await assert.rejects(() => sigaa.login('joao', 'senha-errada'), /Invalid credentials/);

    const sigaa2 = new Sigaa({ url: `http://localhost:${porta}`, institution: 'UFRPE' });
    // Com a senha certa o login passa; a leitura do portal pode falhar porque a página falsa é mínima,
    // então só conferimos que o erro, se houver, não é de credencial.
    try {
      await sigaa2.login('joao', SENHA_CERTA);
    } catch (erro) {
      assert.ok(!/Invalid credentials/.test(erro.message), erro.message);
    }
  } finally {
    servidor.close();
  }
});

test('descarta envio e download de arquivos com mensagem clara', async () => {
  const clienteHttp = new SigaaHTTP(sessaoFalsa(1));
  await assert.rejects(() => clienteHttp.postMultipart(), /não são suportados no app/);
});
