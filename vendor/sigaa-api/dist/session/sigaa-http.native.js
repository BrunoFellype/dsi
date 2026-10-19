"use strict";

/**
 * Camada HTTP para React Native (iOS e Android).
 *
 * O Metro escolhe este arquivo no lugar de `sigaa-http.js` nas plataformas nativas.
 * O resto da biblioteca continua igual: aqui só trocamos `https`/`zlib`/`stream` do Node
 * por `expo/fetch`, que no aparelho:
 *   - deixa tratar redirecionamentos à mão (`redirect: 'manual'`), como o SIGAA exige;
 *   - não guarda cookies sozinho (`credentials: 'omit'`): a biblioteca mantém o próprio cookie jar;
 *   - descomprime a resposta sozinho.
 *
 * Para testes em Node, defina `globalThis.__SIGAA_FETCH__` com uma implementação de fetch.
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SigaaHTTP = void 0;

var _sigaaPageIfsc = require("./page/sigaa-page-ifsc");
var _sigaaPageUfpb = require("./page/sigaa-page-ufpb");
var _sigaaPageUnb = require("./page/sigaa-page-unb");

const TEMPO_LIMITE_MS = 30000;
const NAO_SUPORTADO = 'SIGAA: Envio e download de arquivos não são suportados no app.';

function obterFetch() {
  if (globalThis.__SIGAA_FETCH__) return globalThis.__SIGAA_FETCH__;
  // eslint-disable-next-line global-require
  return require('expo/fetch').fetch;
}

/** Decodifica bytes conforme o charset da resposta (o SIGAA usa ISO-8859-1). */
function decodificar(bytes, contentType) {
  const charset = ((contentType || '').match(/charset=([^;\s]+)/i) || [])[1];
  const nome = (charset || 'utf-8').toLowerCase().replace(/"/g, '');
  if (/^(iso-8859-1|latin1|windows-1252|cp1252|us-ascii|ascii)$/.test(nome)) {
    let texto = '';
    const bloco = 8192;
    for (let i = 0; i < bytes.length; i += bloco) {
      texto += String.fromCharCode.apply(null, bytes.subarray(i, i + bloco));
    }
    return texto;
  }
  if (typeof TextDecoder === 'function') {
    return new TextDecoder('utf-8').decode(bytes);
  }
  let latin = '';
  for (let i = 0; i < bytes.length; i++) latin += String.fromCharCode(bytes[i]);
  try {
    return decodeURIComponent(escape(latin));
  } catch (e) {
    return latin;
  }
}

/** Converte os cabeçalhos do fetch para o formato do Node (chaves minúsculas, set-cookie em lista). */
function converterCabecalhos(headers) {
  const resultado = {};
  headers.forEach((valor, chave) => {
    const k = chave.toLowerCase();
    if (k === 'set-cookie') return;
    resultado[k] = valor;
  });
  let cookies = [];
  if (typeof headers.getSetCookie === 'function') {
    cookies = headers.getSetCookie();
  }
  if (!cookies || cookies.length === 0) {
    const junto = headers.get('set-cookie');
    // Vários Set-Cookie vêm unidos por vírgula; vírgula de data (Expires) não é seguida de "nome="
    if (junto) cookies = junto.split(/,(?=\s*[^;,=\s]+=)/).map((c) => c.trim());
  }
  if (cookies && cookies.length > 0) resultado['set-cookie'] = cookies;
  return resultado;
}

// Igual à biblioteca original: codifica pelo ponto de código (ISO-8859-1 para letras acentuadas)
function codificarRFC3986(str) {
  let escapado = '';
  const naoReservados = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.~';
  for (let i = 0; i < str.length; i++) {
    if (naoReservados.includes(str.charAt(i))) {
      escapado += str.charAt(i);
    } else {
      const codePoint = str.codePointAt(i);
      if (codePoint === undefined) throw new Error('SIGAA: Invalid code point.');
      escapado += codePoint.toString(16).replace(/..?/g, '%$&');
    }
  }
  return escapado;
}

function stringify(valores) {
  return Object.keys(valores)
    .map((k) => `${codificarRFC3986(k)}=${codificarRFC3986(String(valores[k]))}`)
    .join('&');
}

class SigaaHTTP {
  constructor(httpSession) {
    this.httpSession = httpSession;
  }

  async downloadFileByGet() {
    throw new Error(NAO_SUPORTADO);
  }

  downloadFileByPost() {
    return Promise.reject(new Error(NAO_SUPORTADO));
  }

  async postMultipart() {
    throw new Error(NAO_SUPORTADO);
  }

  closeSession() {
    this.httpSession.close();
  }

  getRequestBasicOptions(method, link, additionalHeaders, options = { mobile: false }) {
    return {
      hostname: link.hostname,
      port: 443,
      path: link.pathname + link.search,
      method,
      headers: {
        'User-Agent': `SIGAA-Api/1.0 (${options.mobile ? 'Android 7.0; ' : ''}https://github.com/GeovaneSchmitz/sigaa-api)`,
        Accept: '*/*',
        'Cache-Control': 'max-age=0',
        ...additionalHeaders
      }
    };
  }

  async post(path, postValues, options = {}) {
    const url = this.httpSession.getURL(path);
    const body = stringify(postValues);
    const httpOptions = this.getRequestBasicOptions('POST', url, {
      'Content-Type': 'application/x-www-form-urlencoded'
    }, options);
    return this.requestPage(url, httpOptions, body, options);
  }

  async get(path, options) {
    const url = this.httpSession.getURL(path);
    const httpOptions = this.getRequestBasicOptions('GET', url, undefined, options);
    return this.requestPage(url, httpOptions, undefined, options);
  }

  async requestPage(url, httpOptions, requestBody, options) {
    try {
      const sessionHttpOptions = await this.httpSession.afterHTTPOptions(url, httpOptions, requestBody, options);
      const pageBeforeRequest = await this.httpSession.beforeRequest(url, sessionHttpOptions, requestBody, options);
      if (pageBeforeRequest) {
        return this.httpSession.afterSuccessfulRequest(pageBeforeRequest, options);
      }

      const { body, headers, statusCode } = await this.requestHTTP(url, httpOptions, requestBody);

      const SigaaPageInstitution = {
        IFSC: _sigaaPageIfsc.SigaaPageIFSC,
        UFPB: _sigaaPageUfpb.SigaaPageUFPB,
        UNB: _sigaaPageUnb.SigaaPageUNB,
        UFRPE: _sigaaPageUnb.SigaaPageUNB
      };
      const page = new SigaaPageInstitution[this.httpSession.institutionController.institution]({
        requestOptions: httpOptions,
        body,
        url,
        headers,
        statusCode,
        requestBody
      });
      return this.httpSession.afterSuccessfulRequest(page, options);
    } catch (err) {
      return this.httpSession.afterUnsuccessfulRequest(err, httpOptions, requestBody);
    }
  }

  async requestHTTP(url, httpOptions, requestBody) {
    const fetchImpl = obterFetch();
    const controlador = new AbortController();
    const limite = setTimeout(() => controlador.abort(), TEMPO_LIMITE_MS);
    try {
      const resposta = await fetchImpl(url.href, {
        method: httpOptions.method,
        headers: httpOptions.headers,
        body: requestBody,
        redirect: 'manual',
        credentials: 'omit',
        signal: controlador.signal
      });
      const bytes = new Uint8Array(await resposta.arrayBuffer());
      const headers = converterCabecalhos(resposta.headers);
      return {
        body: decodificar(bytes, headers['content-type']),
        headers,
        statusCode: resposta.status
      };
    } finally {
      clearTimeout(limite);
    }
  }

  async followAllRedirect(page, options) {
    while (page.headers.location) {
      page = await this.get(page.headers.location, options);
    }
    return page;
  }
}

exports.SigaaHTTP = SigaaHTTP;
