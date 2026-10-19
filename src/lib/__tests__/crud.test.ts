import test from 'node:test';
import assert from 'node:assert/strict';
import { desfazerCorrecaoDoAviso, removerAvisoEComCorrecoes, removerRegistroDoDia } from '../crud';
import type { Aviso, RegistroDiario } from '../types';

const aviso = (id: string): Aviso => ({ id, fonte: 'manual', texto: `msg ${id}`, recebidoEm: '2026-10-01T10:00:00Z', tipo: 'comunicado' });

test('remover aviso também tira correções que o citavam como origem ou âncora', () => {
  const avisos = [aviso('a'), aviso('b'), aviso('c')];
  const correcoes = { a: 'b', c: 'a', d: 'c' };
  const r = removerAvisoEComCorrecoes(avisos, correcoes, 'a');
  assert.deepEqual(r.avisos.map((x) => x.id), ['b', 'c']);
  assert.deepEqual(r.correcoes, { d: 'c' });
});

test('remover aviso inexistente não altera nada', () => {
  const avisos = [aviso('a')];
  const r = removerAvisoEComCorrecoes(avisos, { a: 'a' }, 'zzz');
  assert.equal(r.avisos.length, 1);
  assert.deepEqual(r.correcoes, { a: 'a' });
});

test('desfazer correção remove só a correção daquela mensagem', () => {
  const original = { a: 'b', c: 'b' };
  assert.deepEqual(desfazerCorrecaoDoAviso(original, 'a'), { c: 'b' });
  assert.deepEqual(original, { a: 'b', c: 'b' }, 'não deve mutar o original');
});

test('remover registro do diário apaga só o dia escolhido', () => {
  const diario: RegistroDiario[] = [
    { dia: '2026-10-01', sonoHoras: 7, estudoHoras: 2, estresse: 3 },
    { dia: '2026-10-02', sonoHoras: 6, estudoHoras: 3, estresse: 4 },
  ];
  assert.deepEqual(removerRegistroDoDia(diario, '2026-10-01').map((r) => r.dia), ['2026-10-02']);
});
