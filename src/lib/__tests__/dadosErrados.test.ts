import test from 'node:test';
import assert from 'node:assert/strict';
import { criarAvisos, detectarTipo, extrairPrazo } from '../parse';

const BASE = new Date(2026, 9, 18, 10, 0);

test('aviso que diz que NÃO haverá prova não vira prova com prazo', () => {
  for (const texto of [
    'Pessoal, não teremos prova na quarta, 22/10.',
    'A prova de 22/10 foi cancelada.',
    'Não haverá avaliação dia 22/10',
    'Atividade suspensa, entrega 25/10 adiada para depois',
  ]) {
    assert.equal(detectarTipo(texto), 'comunicado', texto);
    const [aviso] = criarAvisos(texto, 'whatsapp', [], BASE);
    assert.equal(aviso.prazo, undefined, texto);
  }
});

test('gabarito e resultado de prova que já passou não viram prazo', () => {
  assert.equal(detectarTipo('Gabarito da prova no drive'), 'material');
  assert.equal(detectarTipo('Resultado da prova saiu, nota no SIGAA'), 'comunicado');
});

test('avisos de prazo de verdade continuam funcionando', () => {
  assert.equal(detectarTipo('A prova será quarta às 14h'), 'prazo');
  assert.equal(detectarTipo('Entrega sem falta até 25/10'), 'prazo');
  const [aviso] = criarAvisos('Entrega do trabalho 25/10 às 14:30', 'whatsapp', [], BASE);
  assert.ok(aviso.prazo);
});

test('"segunda chamada" e "segunda prova" não são segunda-feira', () => {
  assert.equal(extrairPrazo('A segunda chamada será avisada depois', BASE), null);
  assert.equal(extrairPrazo('Resultado da segunda prova em breve', BASE), null);
  assert.equal(extrairPrazo('prova na segunda 8h', BASE)!.getDay(), 1);
});

test('data recente sem ano continua no passado; só a muito antiga vai para o ano seguinte', () => {
  // 10 dias atrás: ainda é 2026 (antes virava 2027 e a entrega aparecia 1 ano no futuro)
  assert.equal(extrairPrazo('A entrega era dia 08/10', BASE)!.getFullYear(), 2026);
  assert.equal(extrairPrazo('entrega 01/03', BASE)!.getFullYear(), 2027);
});

test('horário do SIGAA vira instante de Brasília, em qualquer fuso do servidor', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { isoDeBrasilia } = require('../../../vendor/sigaa-api/resumo');
  assert.equal(isoDeBrasilia(new Date(2026, 9, 25, 14, 30)), '2026-10-25T17:30:00.000Z');
  assert.equal(isoDeBrasilia(new Date(2026, 9, 25, 0, 0)), '2026-10-25T03:00:00.000Z');
});
