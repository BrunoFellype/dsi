// Dados de demonstração. Usados quando SIGAA_MOCK=1, sem acessar o SIGAA real.
function emDias(dias, hora = 23, minuto = 59) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(hora, minuto, 0, 0);
  return d.toISOString();
}

module.exports = function resumoDemo() {
  return {
    demo: true,
    aluno: { matricula: '000000000', curso: 'Bacharelado em Sistemas de Informação' },
    indices: [
      { code: 'IRA', name: 'Índice de Rendimento Acadêmico', value: 7.8 },
      { code: 'MC', name: 'Média de Conclusão', value: 8.1 },
    ],
    atividades: [
      { id: 'd1', tipo: 'tarefa', titulo: 'Entrega do dossiê do projeto', disciplina: 'Desenvolvimento de Sistemas de Informação', data: emDias(1), concluida: false },
      { id: 'd2', tipo: 'avaliacao', titulo: 'Primeira prova', disciplina: 'Banco de Dados', data: emDias(3, 14, 0), concluida: false },
      { id: 'd3', tipo: 'questionario', titulo: 'Questionário de revisão', disciplina: 'Estrutura de Dados', data: emDias(5), concluida: false },
      { id: 'd4', tipo: 'tarefa', titulo: 'Lista de exercícios 3', disciplina: 'Estrutura de Dados', data: emDias(7), concluida: false },
    ],
    disciplinas: [
      { codigo: 'BD01', titulo: 'Banco de Dados', periodo: '2026.2', faltas: 4, maxFaltas: 15 },
      { codigo: 'ED01', titulo: 'Estrutura de Dados', periodo: '2026.2', faltas: 2, maxFaltas: 15 },
      { codigo: 'DSI01', titulo: 'Desenvolvimento de Sistemas de Informação', periodo: '2026.2', faltas: 8, maxFaltas: 15 },
    ],
    historico: [
      { periodo: '2026.1', codigo: 'AL01', titulo: 'Álgebra Linear', mediaFinal: 7.4, faltas: 4, situacao: 'APROVADO' },
      { periodo: '2026.1', codigo: 'PR01', titulo: 'Programação', mediaFinal: 9.1, faltas: 0, situacao: 'APROVADO' },
    ],
  };
};
