import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Colors } from '../../constants/colors';
import { montarExportacao } from '../exportacao';
import { calcularNotificacoes, calcularResumosDiarios, LIMITE_LEMBRETES } from '../lembretesLogica';
import { precisaAtualizar } from '../sync';
import type { Atividade, Grupo } from '../types';

// Quarta-feira, 14/10/2026, 12h
const BASE = new Date(2026, 9, 14, 12, 0, 0);

const atividade = (id: string, quando: Date, extra: Partial<Atividade> = {}): Atividade => ({
  id,
  titulo: `Tarefa ${id}`,
  data: quando.toISOString(),
  fonte: 'manual',
  tipo: 'tarefa',
  concluida: false,
  ...extra,
});

describe('resumo diário', () => {
  it('gera um resumo às 7h30 só nos dias com prazo', () => {
    const r = calcularResumosDiarios(
      [atividade('a', new Date(2026, 9, 16, 18, 0)), atividade('b', new Date(2026, 9, 16, 9, 0))],
      BASE
    );
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 'resumo:2026-10-16');
    assert.equal(r[0].quando.getHours(), 7);
    assert.equal(r[0].quando.getMinutes(), 30);
    assert.equal(r[0].titulo, 'Hoje: 2 prazos');
    // ordenado por horário
    assert.ok(r[0].corpo.indexOf('9h Tarefa b') < r[0].corpo.indexOf('18h Tarefa a'));
  });

  it('não gera resumo para hoje depois das 7h30 nem para dias sem prazo', () => {
    assert.equal(calcularResumosDiarios([atividade('a', new Date(2026, 9, 14, 20, 0))], BASE).length, 0);
    assert.equal(calcularResumosDiarios([], BASE).length, 0);
  });

  it('usa o singular com um prazo e ignora concluídos e muito distantes', () => {
    const [um] = calcularResumosDiarios([atividade('a', new Date(2026, 9, 15, 10, 0))], BASE);
    assert.equal(um.titulo, 'Hoje: 1 prazo');
    assert.equal(calcularResumosDiarios([atividade('a', new Date(2026, 9, 15), { concluida: true })], BASE).length, 0);
    assert.equal(calcularResumosDiarios([atividade('a', new Date(2026, 10, 30))], BASE).length, 0);
  });
});

describe('notificações combinadas', () => {
  it('respeita as opções ligadas', () => {
    const lista = [atividade('a', new Date(2026, 9, 20, 18, 0))];
    assert.equal(calcularNotificacoes(lista, { lembretes: false, resumoDiario: false }, BASE).length, 0);
    assert.equal(calcularNotificacoes(lista, { lembretes: true, resumoDiario: false }, BASE).length, 2);
    assert.equal(calcularNotificacoes(lista, { lembretes: false, resumoDiario: true }, BASE).length, 1);
    assert.equal(calcularNotificacoes(lista, { lembretes: true, resumoDiario: true }, BASE).length, 3);
  });

  it('nunca passa do limite do sistema e fica em ordem', () => {
    const muitas = Array.from({ length: 80 }, (_, i) => atividade(String(i), new Date(2026, 9, 15 + (i % 7), 9 + (i % 10))));
    const r = calcularNotificacoes(muitas, { lembretes: true, resumoDiario: true }, BASE);
    assert.ok(r.length <= LIMITE_LEMBRETES);
    for (let i = 1; i < r.length; i++) assert.ok(r[i].quando >= r[i - 1].quando);
  });
});

describe('atualização automática', () => {
  it('atualiza quando nunca atualizou ou passou do prazo', () => {
    assert.equal(precisaAtualizar(null, BASE), true);
    assert.equal(precisaAtualizar('lixo', BASE), true);
    assert.equal(precisaAtualizar(new Date(2026, 9, 14, 5, 0).toISOString(), BASE), true);
  });

  it('não atualiza antes de 6 horas', () => {
    assert.equal(precisaAtualizar(new Date(2026, 9, 14, 8, 0).toISOString(), BASE), false);
  });
});

describe('exportação de correções', () => {
  const grupos: Grupo[] = [
    {
      id: 'g1',
      rotulo: 'Banco de Dados',
      avisos: [
        { id: 'x', fonte: 'whatsapp', texto: 'Prova de SQL quarta', recebidoEm: BASE.toISOString(), tipo: 'prazo', disciplina: 'Banco de Dados' },
        { id: 'y', fonte: 'telegram', texto: 'Outra mensagem', recebidoEm: BASE.toISOString(), tipo: 'comunicado' },
      ],
    },
  ];

  it('exporta só as mensagens corrigidas, com o grupo escolhido', () => {
    const r = montarExportacao(grupos, { x: 'y' });
    assert.equal(r.length, 1);
    assert.deepEqual(r[0], {
      texto: 'Prova de SQL quarta',
      disciplina: 'Banco de Dados',
      fonte: 'whatsapp',
      grupoEscolhido: 'Banco de Dados',
    });
  });

  it('ignora correções de mensagens que não existem mais e não vaza o id', () => {
    const r = montarExportacao(grupos, { sumiu: 'y', x: 'y' });
    assert.equal(r.length, 1);
    assert.ok(!JSON.stringify(r).includes('"id"'));
  });
});

// Contraste mínimo de texto normal (WCAG 2.1 AA)
function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contraste = (a: string, b: string) => {
  const [x, y] = [luminancia(a), luminancia(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

describe('acessibilidade: contraste das cores', () => {
  const pares: [keyof typeof Colors.light, keyof typeof Colors.light][] = [
    ['text', 'background'],
    ['text', 'surface'],
    ['textSecondary', 'surface'],
    ['textSecondary', 'background'],
    ['textSecondary', 'surfaceAlt'],
    ['textMuted', 'surface'],
    ['textMuted', 'background'],
    ['primary', 'surface'],
    ['primary', 'background'],
    ['primary', 'primarySoft'],
    ['onPrimary', 'primary'],
    ['success', 'successSoft'],
    ['success', 'surface'],
    ['warning', 'warningSoft'],
    ['warning', 'surface'],
    ['danger', 'dangerSoft'],
    ['danger', 'surface'],
  ];

  for (const tema of ['light', 'dark'] as const) {
    for (const [texto, fundo] of pares) {
      it(`${tema}: ${texto} sobre ${fundo} tem contraste mínimo de 4,5`, () => {
        const r = contraste(Colors[tema][texto], Colors[tema][fundo]);
        assert.ok(r >= 4.5, `contraste ${r.toFixed(2)}`);
      });
    }
  }
});
