import test from 'node:test';
import assert from 'node:assert/strict';
import {
  destaquePorLocal,
  lerOcorrenciasSalvas,
  novaOcorrencia,
  ocorrenciasAtivas,
  removerOcorrencia,
} from '../ocorrenciasMapa';

const AGORA = new Date(2026, 9, 18, 10, 0);

test('cria aviso com validade e recusa dados vazios', () => {
  const o = novaOcorrencia({ localId: 'deinfo-dc', tipo: 'manutencao', titulo: '  Elevador quebrado ', horas: 24 }, AGORA)!;
  assert.equal(o.titulo, 'Elevador quebrado');
  assert.equal(new Date(o.ate).getTime() - AGORA.getTime(), 24 * 3600000);
  assert.equal(novaOcorrencia({ localId: 'deinfo-dc', tipo: 'evento', titulo: '   ', horas: 2 }, AGORA), null);
  assert.equal(novaOcorrencia({ localId: '', tipo: 'evento', titulo: 'Feira', horas: 2 }, AGORA), null);
  assert.equal(novaOcorrencia({ localId: 'x', tipo: 'evento', titulo: 'Feira', horas: 0 }, AGORA), null);
});

test('pino só muda de cor enquanto o aviso vale; depois volta ao normal', () => {
  const o = novaOcorrencia({ localId: 'ceagri-1', tipo: 'evento', titulo: 'Feira de ciências', horas: 2 }, AGORA)!;
  assert.deepEqual(destaquePorLocal([o], AGORA), { 'ceagri-1': 'evento' });
  const depois = new Date(AGORA.getTime() + 3 * 3600000);
  assert.deepEqual(destaquePorLocal([o], depois), {});
  assert.equal(ocorrenciasAtivas([o], depois).length, 0);
});

test('pino sem aviso não aparece no destaque', () => {
  assert.deepEqual(destaquePorLocal([], AGORA), {});
});

test('manutenção tem prioridade sobre evento no mesmo pino', () => {
  const ev = novaOcorrencia({ localId: 'cegoe', tipo: 'evento', titulo: 'Palestra', horas: 8 }, AGORA)!;
  const man = novaOcorrencia({ localId: 'cegoe', tipo: 'manutencao', titulo: 'Sem energia', horas: 8 }, AGORA)!;
  assert.equal(destaquePorLocal([ev, man], AGORA).cegoe, 'manutencao');
  assert.equal(destaquePorLocal([man, ev], AGORA).cegoe, 'manutencao');
});

test('remover o aviso devolve a cor normal', () => {
  const o = novaOcorrencia({ localId: 'cegoe', tipo: 'manutencao', titulo: 'Goteira', horas: 72 }, AGORA)!;
  assert.deepEqual(destaquePorLocal(removerOcorrencia([o], o.id), AGORA), {});
});

test('leitura do que estava salvo ignora lixo e avisos vencidos', () => {
  const vivo = novaOcorrencia({ localId: 'cegoe', tipo: 'evento', titulo: 'Palestra', horas: 8 }, AGORA)!;
  const vencido = novaOcorrencia({ localId: 'cegoe', tipo: 'evento', titulo: 'Velho', horas: 1 }, new Date(2026, 0, 1))!;
  const salvo = JSON.stringify([vivo, vencido, { id: 1 }, null, { ...vivo, id: 'z', tipo: 'outro' }]);
  assert.deepEqual(lerOcorrenciasSalvas(salvo, AGORA).map((o) => o.id), [vivo.id]);
  assert.deepEqual(lerOcorrenciasSalvas('{quebrado', AGORA), []);
  assert.deepEqual(lerOcorrenciasSalvas(null, AGORA), []);
});
