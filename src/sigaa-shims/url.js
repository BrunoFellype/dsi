/**
 * `URL` para a sigaa-api no celular.
 *
 * No Node, `require('url').URL` é o URL completo do padrão WHATWG. No celular, o pacote `url` do npm
 * não tem `URL`, e o `URL` global do React Native não resolve endereços relativos (ex.: o formulário
 * de login do SIGAA aponta para "/sigaa/logar.do;jsessionid=..."). Esta versão cobre o que a
 * biblioteca usa: endereços http(s) absolutos e relativos, href, hostname, pathname, search,
 * searchParams e afins.
 */

const ABSOLUTO = /^([a-zA-Z][a-zA-Z\d+.-]*:)\/\/(?:([^:@/?#]*)(?::([^@/?#]*))?@)?([^:/?#]*)(?::(\d*))?([^?#]*)(\?[^#]*)?(#.*)?$/;
const PORTA_PADRAO = { 'http:': '80', 'https:': '443' };

/** Remove "." e ".." do caminho (RFC 3986, 5.2.4). */
function limparCaminho(caminho) {
  const entrada = caminho.split('/');
  const saida = [];
  entrada.forEach((parte, i) => {
    const ultima = i === entrada.length - 1;
    if (parte === '..') {
      if (saida.length > 1) saida.pop();
      if (ultima) saida.push('');
    } else if (parte === '.') {
      if (ultima) saida.push('');
    } else {
      saida.push(parte);
    }
  });
  const resultado = saida.join('/');
  return resultado.startsWith('/') ? resultado : `/${resultado}`;
}

/** Separa "caminho?busca#âncora". */
function separar(ref) {
  const iHash = ref.indexOf('#');
  const hash = iHash >= 0 ? ref.slice(iHash) : '';
  const semHash = iHash >= 0 ? ref.slice(0, iHash) : ref;
  const iBusca = semHash.indexOf('?');
  return {
    caminho: iBusca >= 0 ? semHash.slice(0, iBusca) : semHash,
    busca: iBusca >= 0 ? semHash.slice(iBusca) : '',
    hash,
  };
}

const normalizarBusca = (b) => (b === '?' ? '' : b.replace(/ /g, '%20'));
const normalizarHash = (h) => (h === '#' ? '' : h.replace(/ /g, '%20'));
const normalizarCaminho = (c) => limparCaminho(c.replace(/ /g, '%20').replace(/\\/g, '/'));

function analisarAbsoluto(texto) {
  const m = texto.match(ABSOLUTO);
  if (!m) throw new TypeError(`Invalid URL: ${texto}`);
  const protocolo = m[1].toLowerCase();
  const porta = m[5] && m[5] !== PORTA_PADRAO[protocolo] ? m[5] : '';
  return {
    protocol: protocolo,
    username: m[2] || '',
    password: m[3] || '',
    hostname: (m[4] || '').toLowerCase(),
    port: porta,
    pathname: normalizarCaminho(m[6] || '/'),
    search: normalizarBusca(m[7] || ''),
    hash: normalizarHash(m[8] || ''),
  };
}

class URLSigaa {
  constructor(entrada, base) {
    const texto = String(entrada).trim();
    let partes;
    if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(texto)) {
      partes = analisarAbsoluto(texto);
    } else {
      if (base === undefined || base === null) throw new TypeError(`Invalid URL: ${texto}`);
      const b = base instanceof URLSigaa ? base : new URLSigaa(String(base));
      partes = { protocol: b.protocol, username: b.username, password: b.password, hostname: b.hostname, port: b.port };
      if (texto.startsWith('//')) {
        partes = analisarAbsoluto(`${b.protocol}${texto}`);
      } else {
        const { caminho, busca, hash } = separar(texto);
        if (caminho === '') {
          partes.pathname = b.pathname;
          partes.search = busca ? normalizarBusca(busca) : b.search;
        } else {
          const juntado = caminho.startsWith('/')
            ? caminho
            : `${b.pathname.slice(0, b.pathname.lastIndexOf('/') + 1)}${caminho}`;
          partes.pathname = normalizarCaminho(juntado);
          partes.search = normalizarBusca(busca);
        }
        partes.hash = normalizarHash(hash);
      }
    }
    Object.assign(this, partes);
  }

  get host() {
    return this.port ? `${this.hostname}:${this.port}` : this.hostname;
  }

  get origin() {
    return `${this.protocol}//${this.host}`;
  }

  get href() {
    const autenticacao = this.username ? `${this.username}${this.password ? `:${this.password}` : ''}@` : '';
    return `${this.protocol}//${autenticacao}${this.host}${this.pathname}${this.search}${this.hash}`;
  }

  get searchParams() {
    const pares = this.search
      .replace(/^\?/, '')
      .split('&')
      .filter(Boolean)
      .map((par) => {
        const i = par.indexOf('=');
        const decodificar = (s) => {
          try {
            return decodeURIComponent(s.replace(/\+/g, ' '));
          } catch {
            return s;
          }
        };
        return i >= 0 ? [decodificar(par.slice(0, i)), decodificar(par.slice(i + 1))] : [decodificar(par), ''];
      });
    return {
      get: (nome) => {
        const achado = pares.find(([k]) => k === nome);
        return achado ? achado[1] : null;
      },
      getAll: (nome) => pares.filter(([k]) => k === nome).map(([, v]) => v),
      has: (nome) => pares.some(([k]) => k === nome),
      toString: () => this.search.replace(/^\?/, ''),
    };
  }

  toString() {
    return this.href;
  }

  toJSON() {
    return this.href;
  }
}

module.exports = { URL: URLSigaa, URLSigaa };
