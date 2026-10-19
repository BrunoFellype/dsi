import type { Aviso, RegistroDiario, ResumoSigaa } from './types';
import { chaveDia } from './datas';

function em(dias: number, h = 12, m = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(h, m, 0, 0);
  return d;
}

function aviso(
  id: string,
  fonte: Aviso['fonte'],
  texto: string,
  tipo: Aviso['tipo'],
  quando: Date,
  disciplina?: string,
  prazo?: Date
): Aviso {
  return {
    id,
    fonte,
    texto,
    tipo,
    disciplina,
    recebidoEm: quando.toISOString(),
    prazo: prazo?.toISOString(),
  };
}

const BD = 'Banco de Dados';
const ED = 'Estrutura de Dados';
const DSI = 'Desenvolvimento de Sistemas de Informação';

/** Mensagens de exemplo espalhadas em vários canais, com repetições, como no problema do artigo. */
export function avisosDemo(): Aviso[] {
  return [
    aviso('demo-1', 'classroom', 'Entrega do dossiê e do código do projeto até amanhã às 23h59. Enviar pelo Classroom.', 'prazo', em(0, 9), DSI, em(1, 23, 59)),
    aviso('demo-2', 'whatsapp', 'Pessoal, lembrando: dossiê e código do projeto até amanhã 23:59 no Classroom!', 'prazo', em(0, 10), DSI, em(1, 23, 59)),
    aviso('demo-3', 'sigaa', 'A primeira prova de Banco de Dados será na quarta às 14h, laboratório 2. Conteúdo: álgebra relacional e SQL.', 'prazo', em(-1, 18), BD, em(3, 14, 0)),
    aviso('demo-4', 'telegram', 'Prova de banco de dados quarta 14h no laboratório 2, vai cair álgebra relacional e SQL.', 'prazo', em(-1, 20), BD, em(3, 14, 0)),
    aviso('demo-5', 'whatsapp', 'Gabarito da lista de grafos já está disponível no link do drive. Vale conferir antes da prova.', 'material', em(-1, 8), ED),
    aviso('demo-6', 'classroom', 'Slides da aula de árvores e grafos publicados no material da disciplina.', 'material', em(-2, 15), ED),
    aviso('demo-7', 'whatsapp', 'Lista 3 de grafos, entrega sexta 18h. Implementação em C++.', 'prazo', em(-2, 11), ED, em(5, 18, 0)),
    aviso('demo-8', 'sigaa', 'Aula de sexta cancelada. A professora vai repor a aula na próxima semana.', 'comunicado', em(-1, 7), BD),
    aviso('demo-9', 'telegram', 'Aula de banco de dados de sexta foi cancelada, reposição na semana que vem.', 'comunicado', em(-1, 9), BD),
    aviso('demo-10', 'discord', 'Grupo de estudo de estrutura de dados hoje às 19h na biblioteca, quem quiser aparecer.', 'comunicado', em(0, 8), ED),
    aviso('demo-11', 'classroom', 'Material complementar de SQL: apostila em PDF e vídeo sobre junções.', 'material', em(-3, 16), BD),
    aviso('demo-12', 'sigaa', 'Semana acadêmica do departamento começa dia 20/10. Inscrições abertas.', 'comunicado', em(-2, 9)),
  ];
}

export function resumoDemo(): ResumoSigaa {
  return {
    demo: true,
    aluno: { matricula: '000000000', curso: 'Bacharelado em Sistemas de Informação' },
    indices: [
      { code: 'IRA', name: 'Índice de Rendimento Acadêmico', value: 7.8 },
      { code: 'MC', name: 'Média de Conclusão', value: 8.1 },
    ],
    atividades: [
      { id: 'dm1', tipo: 'tarefa', titulo: 'Entrega do dossiê do projeto', disciplina: DSI, data: em(1, 23, 59).toISOString(), concluida: false },
      { id: 'dm2', tipo: 'avaliacao', titulo: 'Primeira prova', disciplina: BD, data: em(3, 14, 0).toISOString(), concluida: false },
      { id: 'dm3', tipo: 'questionario', titulo: 'Questionário de revisão', disciplina: ED, data: em(5, 23, 59).toISOString(), concluida: false },
      { id: 'dm4', tipo: 'tarefa', titulo: 'Lista de exercícios 3', disciplina: ED, data: em(7, 23, 59).toISOString(), concluida: false },
    ],
    disciplinas: [
      { codigo: 'BD01', titulo: BD, periodo: '2026.2', faltas: 4, maxFaltas: 15 },
      { codigo: 'ED01', titulo: ED, periodo: '2026.2', faltas: 2, maxFaltas: 15 },
      { codigo: 'DSI01', titulo: DSI, periodo: '2026.2', faltas: 8, maxFaltas: 15 },
    ],
    historico: [
      { periodo: '2026.1', codigo: 'AL01', titulo: 'Álgebra Linear', mediaFinal: 6.4, faltas: 10, situacao: 'APROVADO' },
      { periodo: '2026.1', codigo: 'PR01', titulo: 'Programação', mediaFinal: 9.1, faltas: 0, situacao: 'APROVADO' },
      { periodo: '2026.1', codigo: 'LG01', titulo: 'Lógica para Computação', mediaFinal: 5.2, faltas: 14, situacao: 'REPROVADO' },
    ],
  };
}

export function diarioDemo(): RegistroDiario[] {
  const sono = [7, 6.5, 5.5, 8, 6, 5, 7.5];
  const estudo = [2, 3, 4, 1.5, 3.5, 4.5, 2];
  const estresse = [2, 3, 4, 2, 3, 5, 2];
  return sono.map((s, i) => ({
    dia: chaveDia(em(i - 6)),
    sonoHoras: s,
    estudoHoras: estudo[i],
    estresse: estresse[i],
  }));
}
