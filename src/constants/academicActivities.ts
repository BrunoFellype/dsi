export interface AcademicActivity {
  id: string;
  title: string;
  details: string;
  source: string;
  deadline: string;
  borderColor: string;
  deadlineBackgroundColor: string;
  deadlineTextColor: string;
}

export const academicActivities: AcademicActivity[] = [
  {
    id: 'dossie-dsi',
    title: 'Entrega do Dossiê e Código DSI',
    details: 'Engenharia de Software • Apresentação à Banca',
    source: '🏫 Google Classroom',
    deadline: 'Hoje, 23:59',
    borderColor: '#EF4444',
    deadlineBackgroundColor: '#FEE2E2',
    deadlineTextColor: '#B91C1C',
  },
  {
    id: 'simulado-banco-dados',
    title: 'Simulado de Banco de Dados (P1)',
    details: 'Álgebra Relacional e SQL • Prof. Ricardo',
    source: '🏛️ SIGAA UFRPE',
    deadline: 'Quarta, 14h',
    borderColor: '#F59E0B',
    deadlineBackgroundColor: '#FEF3C7',
    deadlineTextColor: '#B45309',
  },
  {
    id: 'lista-algoritmos',
    title: 'Lista 3 de Algoritmos (Grafos)',
    details: 'Estruturas de Dados • Implementação C++',
    source: '💬 WhatsApp Turma',
    deadline: 'Sexta, 18h',
    borderColor: '#10B981',
    deadlineBackgroundColor: '#DCFCE7',
    deadlineTextColor: '#15803D',
  },
];