import assert from 'node:assert/strict';
import test from 'node:test';
import { buscarLocais, encontrarLocalDoCurso, linkComoChegar, LOCAIS_UFRPE } from '../../data/ufrpeCampus';
import { editarAvisoNaLista } from '../crud';
import { adicionarImagem, imagensDosAvisos, MAX_IMAGENS_POR_AVISO, paginaDoDeslocamento, removerImagem } from '../galeria';
import type { Aviso } from '../types';

const aviso = (id: string, imagens?: string[]): Aviso => ({
  id,
  fonte: 'manual',
  texto: `msg ${id}`,
  recebidoEm: '2026-10-01T10:00:00Z',
  tipo: 'material',
  imagens,
});

test('adicionar imagem não repete, ignora vazio e respeita o limite', () => {
  assert.deepEqual(adicionarImagem(undefined, 'a.jpg'), ['a.jpg']);
  assert.deepEqual(adicionarImagem(['a.jpg'], 'a.jpg'), ['a.jpg']);
  assert.deepEqual(adicionarImagem(['a.jpg'], '   '), ['a.jpg']);
  const cheia = Array.from({ length: MAX_IMAGENS_POR_AVISO }, (_, i) => `${i}.jpg`);
  assert.equal(adicionarImagem(cheia, 'nova.jpg').length, MAX_IMAGENS_POR_AVISO);
});

test('remover imagem pelo índice e ignorar índice inválido', () => {
  assert.deepEqual(removerImagem(['a', 'b', 'c'], 1), ['a', 'c']);
  assert.deepEqual(removerImagem(['a'], 5), ['a']);
  assert.deepEqual(removerImagem(undefined, 0), []);
});

test('imagens de um assunto juntam as dos avisos sem repetir', () => {
  assert.deepEqual(imagensDosAvisos([aviso('1', ['x', 'y']), aviso('2'), aviso('3', ['y', 'z'])]), ['x', 'y', 'z']);
});

test('página do carrossel a partir do deslocamento fica dentro dos limites', () => {
  assert.equal(paginaDoDeslocamento(0, 300, 3), 0);
  assert.equal(paginaDoDeslocamento(310, 300, 3), 1);
  assert.equal(paginaDoDeslocamento(5000, 300, 3), 2);
  assert.equal(paginaDoDeslocamento(-50, 300, 3), 0);
  assert.equal(paginaDoDeslocamento(100, 0, 3), 0);
});

test('editar aviso grava e apaga a lista de imagens', () => {
  const comFotos = editarAvisoNaLista([aviso('a')], 'a', { imagens: ['f1', 'f2'] });
  assert.deepEqual(comFotos[0].imagens, ['f1', 'f2']);
  const semFotos = editarAvisoNaLista(comFotos, 'a', { imagens: [] });
  assert.equal(semFotos[0].imagens, undefined);
  const intacto = editarAvisoNaLista(comFotos, 'a', { texto: 'novo' });
  assert.deepEqual(intacto[0].imagens, ['f1', 'f2']);
});

test('mapa: curso do perfil encontra o prédio, com e sem acento', () => {
  assert.equal(encontrarLocalDoCurso('Sistemas de Informação')?.id, 'deinfo-dc');
  assert.equal(encontrarLocalDoCurso('Bacharelado em Sistemas de Informacao')?.id, 'deinfo-dc');
  assert.equal(encontrarLocalDoCurso('Não informado'), null);
  assert.equal(encontrarLocalDoCurso(null), null);
});

test('mapa: busca ignora acento e acha por sigla, nome e curso', () => {
  assert.ok(buscarLocais('computacao').some((l) => l.id === 'deinfo-dc'));
  assert.ok(buscarLocais('DC').some((l) => l.id === 'deinfo-dc'));
  assert.deepEqual(buscarLocais('   '), []);
});

test('mapa: link de rota usa as coordenadas do local', () => {
  const url = linkComoChegar({ latitude: -8.01, longitude: -34.95 });
  assert.match(url, /destination=-8\.01,-34\.95/);
});

test('mapa: ids únicos e coordenadas dentro da área do campus', () => {
  const ids = LOCAIS_UFRPE.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const l of LOCAIS_UFRPE) {
    assert.ok(l.latitude > -8.03 && l.latitude < -8.0, `${l.id} latitude fora do campus`);
    assert.ok(l.longitude > -34.96 && l.longitude < -34.94, `${l.id} longitude fora do campus`);
  }
});
