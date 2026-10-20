import test from 'node:test';
import assert from 'node:assert/strict';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { URLSigaa } = require('../../sigaa-shims/url.js');

const BASE = 'https://sigs.ufrpe.br/sigaa/verTelaLogin.do';
const CASOS: [string, string | undefined][] = [
  ['https://sigs.ufrpe.br', undefined],
  ['https://sigs.ufrpe.br/', undefined],
  ['https://SIGS.ufrpe.br:443/sigaa/portais/discente/discente.jsf?x=1#topo', undefined],
  ['http://localhost:3333/sigaa/a.do', undefined],
  ['/sigaa/logar.do;jsessionid=9827E5835EA800DAA72901B19FAB53F5.producao-jboss01?dispatch=logOn', BASE],
  ['logar.do?dispatch=logOn', BASE],
  ['../portais/discente/discente.jsf', 'https://sigs.ufrpe.br/sigaa/ava/index.jsf'],
  ['./index.jsf', 'https://sigs.ufrpe.br/sigaa/ava/turma.jsf?a=1'],
  ['?pagina=2', 'https://sigs.ufrpe.br/sigaa/busca.jsf?pagina=1'],
  ['#ancora', 'https://sigs.ufrpe.br/sigaa/busca.jsf?pagina=1'],
  ['//sigs.ufrpe.br/sigaa/x.jsf', BASE],
  ['/sigaa/verFoto?idFoto=10&key=abc', BASE],
  ['https://outro.br/a/b/../c', BASE],
  ['/sigaa/paginaIntermediaria.do', 'https://sigs.ufrpe.br/'],
];

test('o URL do celular resolve endereços igual ao URL do Node', () => {
  for (const [entrada, base] of CASOS) {
    const nosso = new URLSigaa(entrada, base);
    const node = new URL(entrada, base);
    for (const campo of ['href', 'protocol', 'hostname', 'host', 'port', 'pathname', 'search', 'hash', 'origin'] as const) {
      assert.equal(nosso[campo], node[campo], `${campo} de "${entrada}" (base ${base})`);
    }
    assert.equal(String(nosso), node.href);
  }
});

test('searchParams lê os parâmetros e base pode ser outro URL', () => {
  const u = new URLSigaa('/sigaa/verArquivo?key=a%20b&idArquivo=42', new URLSigaa(BASE));
  assert.equal(u.searchParams.get('key'), 'a b');
  assert.equal(u.searchParams.get('idArquivo'), '42');
  assert.equal(u.searchParams.get('nada'), null);
});

test('endereço relativo sem base é inválido, como no Node', () => {
  assert.throws(() => new URLSigaa('/sigaa/logar.do'), TypeError);
});
