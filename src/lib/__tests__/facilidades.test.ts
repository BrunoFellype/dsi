import test from 'node:test';
import assert from 'node:assert/strict';
import { editarAvisoNaLista } from '../crud';
import { ehErroDeCredencialSigaa, explicarErroSigaa, mensagemCompletaSigaa } from '../errosSigaa';
import { aplicarHorarios, chaveHorario, lerHora, NAO_INFORMADO, pendentesDeHorario, semHoraNoSigaa } from '../horarios';
import { criarAvisos, extrairPrazoDetalhado } from '../parse';
import { cursoDoSigaa, periodoEstimado } from '../perfilDoSigaa';
import type { Atividade, Aviso } from '../types';

const BASE = new Date(2026, 9, 18, 10, 0);

test('erros do SIGAA: senha errada é reconhecida e o resto vira mensagem clara com detalhe', () => {
  assert.ok(ehErroDeCredencialSigaa('SIGAA: Invalid credentials.'));
  assert.ok(!ehErroDeCredencialSigaa('Nenhum vínculo de discente encontrado.'));
  assert.match(explicarErroSigaa(['expo: Nenhum vínculo de discente encontrado.']), /vínculo de aluno/);
  assert.match(explicarErroSigaa(['expo: SIGAA: Invalid response after login attempt.']), /tela inesperada/);
  assert.match(explicarErroSigaa(['aparelho: tempo esgotado esperando o SIGAA']), /demorou/);
  assert.match(explicarErroSigaa(['expo: Network request failed']), /internet/);
  const completa = mensagemCompletaSigaa(['expo: algo estranho', 'aparelho: outra coisa']);
  assert.match(completa, /Tente novamente mais tarde/);
  assert.match(completa, /Detalhe: expo: algo estranho \| aparelho: outra coisa/);
});

test('prazo sem horário é marcado; com horário, não', () => {
  assert.equal(extrairPrazoDetalhado('Prova dia 25/10', BASE)?.temHora, false);
  assert.equal(extrairPrazoDetalhado('Entrega 25/10 às 14h', BASE)?.temHora, true);
  const [semHora] = criarAvisos('Prova de Banco de Dados dia 25/10', 'whatsapp', [], BASE);
  assert.equal(semHora.prazoSemHora, true);
  const [comHora] = criarAvisos('Entrega do trabalho 25/10 às 14:30', 'whatsapp', [], BASE);
  assert.equal(comHora.prazoSemHora, undefined);
});

test('lerHora aceita formatos comuns e recusa inválidos', () => {
  assert.deepEqual(lerHora('14:30'), { h: 14, m: 30 });
  assert.deepEqual(lerHora('14h30'), { h: 14, m: 30 });
  assert.deepEqual(lerHora('9'), { h: 9, m: 0 });
  assert.equal(lerHora('25:00'), null);
  assert.equal(lerHora('abc'), null);
});

const atividade = (extra: Partial<Atividade>): Atividade => ({
  id: 'a1',
  titulo: 'Prova 1',
  data: new Date(2026, 9, 25, 23, 59).toISOString(),
  fonte: 'whatsapp',
  tipo: 'avaliacao',
  concluida: false,
  ...extra,
});

test('horário confirmado muda a hora; "não informado" tira da lista de pendentes', () => {
  const a = atividade({ semHora: true });
  assert.equal(pendentesDeHorario([a], BASE).length, 1);
  const [comHora] = aplicarHorarios([a], { a1: '08:00' });
  assert.equal(new Date(comHora.data).getHours(), 8);
  assert.equal(comHora.semHora, false);
  const [naoInformado] = aplicarHorarios([a], { a1: NAO_INFORMADO });
  assert.equal(naoInformado.horaNaoInformada, true);
  assert.equal(pendentesDeHorario([naoInformado], BASE).length, 0);
  // Concluídas e passadas não pedem horário
  assert.equal(pendentesDeHorario([atividade({ semHora: true, concluida: true })], BASE).length, 0);
  assert.equal(pendentesDeHorario([atividade({ semHora: true, data: new Date(2026, 9, 1).toISOString() })], BASE).length, 0);
});

test('no SIGAA, meia-noite é "sem horário" e a chave não depende do id', () => {
  assert.ok(semHoraNoSigaa(new Date(2026, 9, 25, 0, 0).toISOString()));
  assert.ok(!semHoraNoSigaa(new Date(2026, 9, 25, 14, 0).toISOString()));
  const s1 = atividade({ id: 'sigaa-0-1', fonte: 'sigaa' });
  const s2 = atividade({ id: 'sigaa-7-1', fonte: 'sigaa' });
  assert.equal(chaveHorario(s1), chaveHorario(s2));
});

test('editar mensagem troca texto, tipo, disciplina e prazo', () => {
  const avisos: Aviso[] = [
    { id: 'x', fonte: 'whatsapp', texto: 'Prova dia 25/10', recebidoEm: BASE.toISOString(), tipo: 'prazo', prazo: new Date(2026, 9, 25, 23, 59).toISOString(), prazoSemHora: true },
  ];
  const [editado] = editarAvisoNaLista(avisos, 'x', {
    texto: 'Prova de BD dia 25/10 às 10h',
    disciplina: 'Banco de Dados',
    prazo: new Date(2026, 9, 25, 10, 0).toISOString(),
  });
  assert.equal(editado.texto, 'Prova de BD dia 25/10 às 10h');
  assert.equal(editado.disciplina, 'Banco de Dados');
  assert.equal(new Date(editado.prazo!).getHours(), 10);
  assert.equal(editado.prazoSemHora, undefined);
  const [semPrazo] = editarAvisoNaLista(avisos, 'x', { tipo: 'comunicado', prazo: null, disciplina: null });
  assert.equal(semPrazo.prazo, undefined);
  assert.equal(semPrazo.disciplina, undefined);
  assert.equal(semPrazo.tipo, 'comunicado');
  const [naoInformado] = editarAvisoNaLista(avisos, 'x', { prazo: new Date(2026, 9, 25, 23, 59).toISOString(), horaNaoInformada: true });
  assert.equal(naoInformado.horaNaoInformada, true);
});

test('perfil a partir do SIGAA: curso limpo e período estimado', () => {
  assert.equal(cursoDoSigaa('SISTEMAS DE INFORMAÇÃO/DC - SEDE - BACHARELADO - Presencial'), 'Sistemas de Informação');
  assert.equal(cursoDoSigaa(''), null);
  assert.equal(
    periodoEstimado({
      historico: [
        { periodo: '2025.1', codigo: 'a', titulo: 'A', mediaFinal: 8, faltas: 0, situacao: 'APROVADO' },
        { periodo: '2025.2', codigo: 'b', titulo: 'B', mediaFinal: 7, faltas: 0, situacao: 'APROVADO' },
      ],
      disciplinas: [{ codigo: 'c', titulo: 'C', periodo: '2026.1' }],
    }),
    '3º'
  );
  assert.equal(periodoEstimado({ historico: [], disciplinas: [] }), null);
});

test('sessão expirada do SIGAA vira mensagem própria', () => {
  assert.match(explicarErroSigaa(['expo: SIGAA: Session expired.']), /encerrou a sessão/);
});
