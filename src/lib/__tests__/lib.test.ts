import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { alertasRotina, mediasRotina, pontosDeAtencao } from '../analise';
import { chaveDia, diasAte, lerDataHora, rotuloDia, rotuloPrazo } from '../datas';
import { avisosDemo } from '../demo';
import { calcularLembretes, LIMITE_LEMBRETES } from '../lembretesLogica';
import type { Atividade } from '../types';
import { agruparAvisos, agruparRepetidos, silhueta, tfidf, tokenizar } from '../ml';
import { criarAvisos, detectarDisciplina, detectarTipo, extrairPrazo, separarMensagens } from '../parse';

// Quarta-feira, 14/10/2026, 12h
const BASE = new Date(2026, 9, 14, 12, 0, 0);

describe('datas', () => {
  it('lê data e hora válidas', () => {
    const d = lerDataHora('25/10', '14:30', BASE)!;
    assert.equal(d.getDate(), 25);
    assert.equal(d.getMonth(), 9);
    assert.equal(d.getHours(), 14);
    assert.equal(d.getMinutes(), 30);
  });

  it('usa 23h59 quando a hora está vazia', () => {
    const d = lerDataHora('25/10', '', BASE)!;
    assert.equal(d.getHours(), 23);
    assert.equal(d.getMinutes(), 59);
  });

  it('rejeita datas e horas inválidas', () => {
    assert.equal(lerDataHora('31/02', '10:00', BASE), null);
    assert.equal(lerDataHora('abc', '10:00', BASE), null);
    assert.equal(lerDataHora('25/10', '25:00', BASE), null);
    assert.equal(lerDataHora('25/10', '10:99', BASE), null);
  });

  it('rotula hoje, amanhã e atrasado', () => {
    assert.equal(rotuloDia(BASE, BASE), 'Hoje');
    assert.equal(rotuloDia(new Date(2026, 9, 15), BASE), 'Amanhã');
    assert.equal(rotuloPrazo(new Date(2026, 9, 13, 10), BASE), 'Atrasado 1 d');
    assert.equal(rotuloPrazo(new Date(2026, 9, 15, 23, 59), BASE), 'Amanhã, 23h59');
  });

  it('calcula diferença de dias e chave do dia', () => {
    assert.equal(diasAte(new Date(2026, 9, 17), BASE), 3);
    assert.equal(chaveDia(new Date(2026, 0, 5)), '2026-01-05');
  });
});

describe('extração de prazos', () => {
  it('entende dd/mm com hora', () => {
    const d = extrairPrazo('Seminário dia 28/10 às 10h', BASE)!;
    assert.equal(d.getDate(), 28);
    assert.equal(d.getHours(), 10);
  });

  it('entende horário com dois pontos', () => {
    const d = extrairPrazo('Entrega 30/10 23:59 pelo SIGAA', BASE)!;
    assert.equal(d.getDate(), 30);
    assert.equal(d.getHours(), 23);
    assert.equal(d.getMinutes(), 59);
  });

  it('entende amanhã, hoje e dia da semana', () => {
    assert.equal(extrairPrazo('entrega amanhã às 18h', BASE)!.getDate(), 15);
    assert.equal(extrairPrazo('prova hoje', BASE)!.getDate(), 14);
    const sexta = extrairPrazo('lista na sexta 18h', BASE)!;
    assert.equal(sexta.getDay(), 5);
    assert.equal(sexta.getDate(), 16);
  });

  it('dia da semana igual a hoje significa a próxima semana', () => {
    assert.equal(extrairPrazo('prova na quarta', BASE)!.getDate(), 21);
  });

  it('data sem ano que já passou vai para o ano seguinte', () => {
    assert.equal(extrairPrazo('entrega 01/03', BASE)!.getFullYear(), 2027);
  });

  it('devolve null sem data', () => {
    assert.equal(extrairPrazo('bom dia, pessoal', BASE), null);
  });

  it('ignora data impossível', () => {
    assert.equal(extrairPrazo('entrega 45/13', BASE), null);
  });
});

describe('mensagens', () => {
  it('separa a exportação do WhatsApp e junta linhas continuadas', () => {
    const texto = [
      '[14/10/2026 09:15] Ana: Prova dia 20/10',
      'às 14h na sala 3',
      '[14/10/2026 09:20] João: ok',
      '14/10/2026 10:00 - Ana: Lista 2 até sexta',
    ].join('\n');
    const m = separarMensagens(texto);
    assert.equal(m.length, 3);
    assert.equal(m[0].texto, 'Prova dia 20/10 às 14h na sala 3');
    assert.equal(m[2].texto, 'Lista 2 até sexta');
    assert.equal(m[0].data!.getHours(), 9);
  });

  it('usa linhas em branco como separador', () => {
    assert.equal(separarMensagens('primeira mensagem\n\nsegunda mensagem').length, 2);
  });

  it('usa uma linha por mensagem quando não há outro padrão', () => {
    assert.equal(separarMensagens('mensagem um aqui\nmensagem dois aqui').length, 2);
  });

  it('descarta mensagens muito curtas e classifica o resto', () => {
    const avisos = criarAvisos('ok\n\nEntrega do trabalho de Banco de Dados 30/10', 'whatsapp', ['Banco de Dados'], BASE);
    assert.equal(avisos.length, 1);
    assert.equal(avisos[0].tipo, 'prazo');
    assert.equal(avisos[0].disciplina, 'Banco de Dados');
    assert.ok(avisos[0].prazo);
  });

  it('gera ids únicos', () => {
    const avisos = criarAvisos('mensagem igual aqui\n\nmensagem igual aqui', 'telegram', [], BASE);
    assert.equal(new Set(avisos.map((a) => a.id)).size, avisos.length);
  });

  it('classifica o tipo', () => {
    assert.equal(detectarTipo('A prova será quarta'), 'prazo');
    assert.equal(detectarTipo('Slides publicados no drive'), 'material');
    assert.equal(detectarTipo('Aula cancelada hoje'), 'comunicado');
  });

  it('reconhece a disciplina sem depender de acento', () => {
    assert.equal(detectarDisciplina('lista de estrutura de dados', ['Banco de Dados', 'Estrutura de Dados']), 'Estrutura de Dados');
    assert.equal(detectarDisciplina('nada a ver', ['Banco de Dados']), undefined);
  });
});

describe('aprendizado de máquina', () => {
  it('tokeniza sem acento, stopwords nem horários', () => {
    const t = tokenizar('A prova será amanhã às 14h na sala 3');
    assert.ok(t.includes('prova'));
    assert.ok(!t.includes('14h'));
    assert.ok(!t.includes('amanha'));
  });

  it('vetores TF-IDF têm norma 1', () => {
    const { vetores } = tfidf(['prova de banco de dados', 'lista de grafos']);
    vetores.forEach((v) => {
      const norma = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
      assert.ok(Math.abs(norma - 1) < 1e-9);
    });
  });

  it('junta mensagens repetidas e mantém as diferentes separadas', () => {
    const avisos = avisosDemo();
    const grupos = agruparRepetidos(avisos);
    const dobro = (a: string, b: string) => grupos.some((g) => g.some((x) => x.id === a) && g.some((x) => x.id === b));
    assert.ok(dobro('demo-1', 'demo-2'));
    assert.ok(dobro('demo-3', 'demo-4'));
    assert.ok(dobro('demo-8', 'demo-9'));
    assert.ok(!dobro('demo-1', 'demo-3'));
  });

  it('agrupa por assunto e nomeia pela disciplina', () => {
    const r = agruparAvisos(avisosDemo());
    const nomes = r.grupos.map((g) => g.rotulo);
    assert.ok(nomes.includes('Banco de Dados'));
    assert.ok(nomes.includes('Estrutura de Dados'));
    assert.equal(r.grupos.reduce((s, g) => s + g.avisos.length, 0), avisosDemo().length);
    assert.ok(r.silhueta !== null && r.silhueta > -1 && r.silhueta <= 1);
  });

  it('é determinístico', () => {
    const a = agruparAvisos(avisosDemo());
    const b = agruparAvisos(avisosDemo());
    assert.deepEqual(a.grupos.map((g) => g.avisos.map((x) => x.id)), b.grupos.map((g) => g.avisos.map((x) => x.id)));
  });

  it('lida com poucos ou nenhum aviso', () => {
    assert.equal(agruparAvisos([]).grupos.length, 0);
    assert.equal(agruparAvisos(avisosDemo().slice(0, 2)).grupos.length, 1);
  });

  it('aplica a correção do estudante', () => {
    const avisos = avisosDemo();
    const antes = agruparAvisos(avisos);
    const origem = antes.grupos.find((g) => g.rotulo === 'Banco de Dados')!;
    const destino = antes.grupos.find((g) => g.rotulo === 'Estrutura de Dados')!;
    const mover = origem.avisos[0];
    const depois = agruparAvisos(avisos, { [mover.id]: destino.avisos[0].id });
    const grupoDoAviso = depois.grupos.find((g) => g.avisos.some((a) => a.id === mover.id))!;
    assert.ok(grupoDoAviso.avisos.some((a) => a.id === destino.avisos[0].id));
  });

  it('ignora correção que aponta para aviso inexistente', () => {
    const avisos = avisosDemo();
    const r = agruparAvisos(avisos, { 'nao-existe': 'tambem-nao' });
    assert.equal(r.grupos.reduce((s, g) => s + g.avisos.length, 0), avisos.length);
  });

  it('silhueta de grupos bem separados é alta', () => {
    const v = [[1, 0], [0.99, 0.14], [0, 1], [0.14, 0.99]];
    assert.ok(silhueta(v, [0, 0, 1, 1]) > 0.8);
  });
});

describe('desempenho e rotina', () => {
  const registro = (sono: number, estudo: number, estresse: number, i: number) => ({
    dia: `2026-10-0${i + 1}`,
    sonoHoras: sono,
    estudoHoras: estudo,
    estresse,
  });

  it('calcula médias dos últimos dias', () => {
    const m = mediasRotina([registro(6, 2, 2, 0), registro(8, 4, 4, 1)])!;
    assert.equal(m.sono, 7);
    assert.equal(m.estudo, 3);
    assert.equal(m.estresse, 3);
    assert.equal(mediasRotina([]), null);
  });

  it('só alerta com pelo menos 3 registros', () => {
    assert.deepEqual(alertasRotina(mediasRotina([registro(4, 2, 5, 0)])), []);
    const m = mediasRotina([registro(4, 2, 5, 0), registro(4.5, 2, 5, 1), registro(5, 2, 4, 2)]);
    assert.ok(alertasRotina(m).length >= 2);
  });

  it('não alerta quando a rotina está boa', () => {
    const m = mediasRotina([registro(8, 2, 2, 0), registro(7.5, 3, 2, 1), registro(8, 2, 1, 2)]);
    assert.deepEqual(alertasRotina(m), []);
  });

  it('aponta disciplinas com média baixa, faltas ou reprovação', () => {
    const pontos = pontosDeAtencao([
      { periodo: '2026.1', codigo: 'A', titulo: 'A', mediaFinal: 5.2, faltas: 2, situacao: 'APROVADO' },
      { periodo: '2026.1', codigo: 'B', titulo: 'B', mediaFinal: 9, faltas: 12, situacao: 'APROVADO' },
      { periodo: '2026.1', codigo: 'C', titulo: 'C', mediaFinal: 9, faltas: 0, situacao: 'APROVADO' },
      { periodo: '2026.1', codigo: 'D', titulo: 'D', mediaFinal: null, faltas: null, situacao: 'REPROVADO' },
    ]);
    assert.deepEqual(pontos.map((p) => p.codigo), ['A', 'B', 'D']);
  });

  it('a mesma disciplina reprovada em dois períodos gera pontos com ids diferentes', () => {
    const pontos = pontosDeAtencao([
      { periodo: '2025.1', codigo: 'X', titulo: 'Cálculo', mediaFinal: 3, faltas: 0, situacao: 'REPROVADO' },
      { periodo: '2025.2', codigo: 'X', titulo: 'Cálculo', mediaFinal: 4, faltas: 0, situacao: 'REPROVADO' },
    ]);
    assert.equal(pontos.length, 2);
    assert.notEqual(pontos[0].id, pontos[1].id);
    assert.match(pontos[0].motivo, /período 2025\.1/);
  });
});

describe('lembretes', () => {
  const atividade = (id: string, quando: Date, extra: Partial<Atividade> = {}): Atividade => ({
    id,
    titulo: `Tarefa ${id}`,
    data: quando.toISOString(),
    fonte: 'manual',
    tipo: 'tarefa',
    concluida: false,
    ...extra,
  });

  it('agenda um dia antes e duas horas antes', () => {
    const l = calcularLembretes([atividade('a', new Date(2026, 9, 20, 18, 0))], BASE);
    assert.equal(l.length, 2);
    assert.equal(l[0].id, 'a:dia');
    assert.equal(l[0].quando.getTime(), new Date(2026, 9, 19, 18, 0).getTime());
    assert.equal(l[1].id, 'a:horas');
    assert.equal(l[1].quando.getHours(), 16);
  });

  it('não agenda o que já passou', () => {
    // Prazo em 5 horas: o aviso de um dia antes já passou, o de 2 horas ainda não
    const l = calcularLembretes([atividade('a', new Date(2026, 9, 14, 17, 0))], BASE);
    assert.deepEqual(l.map((x) => x.id), ['a:horas']);
    assert.equal(calcularLembretes([atividade('b', new Date(2026, 9, 14, 13, 0))], BASE).length, 0);
  });

  it('ignora atividades concluídas e datas inválidas', () => {
    const futuro = new Date(2026, 9, 30);
    assert.equal(calcularLembretes([atividade('a', futuro, { concluida: true })], BASE).length, 0);
    assert.equal(calcularLembretes([{ ...atividade('b', futuro), data: 'lixo' }], BASE).length, 0);
  });

  it('ordena por horário e respeita o limite do iOS', () => {
    const muitas = Array.from({ length: 100 }, (_, i) => atividade(String(i), new Date(2026, 10, 1 + (i % 28), 10 + (i % 8))));
    const l = calcularLembretes(muitas, BASE);
    assert.equal(l.length, LIMITE_LEMBRETES);
    for (let i = 1; i < l.length; i++) assert.ok(l[i].quando >= l[i - 1].quando);
  });

  it('inclui disciplina e horário no texto', () => {
    const [l] = calcularLembretes([atividade('a', new Date(2026, 9, 20, 18, 30), { disciplina: 'Banco de Dados' })], BASE);
    assert.ok(l.corpo.includes('Banco de Dados'));
    assert.ok(l.corpo.includes('18h30'));
    assert.ok(l.titulo.includes('Tarefa a'));
  });
});
