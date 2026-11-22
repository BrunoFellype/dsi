export type CategoriaLocal = 'curso' | 'servico' | 'convivencia';

export interface LocalCampus {
  id: string;
  nome: string;
  sigla?: string;
  descricao: string;
  categoria: CategoriaLocal;
  latitude: number;
  longitude: number;
  cursosAtrelados?: string[];
}

export const CENTRO_UFRPE = {
  latitude: -8.0176,
  longitude: -34.9492,
};

export const LOCAIS_UFRPE: LocalCampus[] = [
  {
    id: 'deinfo-dc',
    nome: 'Departamento de Computação (DC / DEINFO)',
    sigla: 'DC',
    descricao: 'Laboratórios de informática, salas de aula e coordenações de Computação.',
    categoria: 'curso',
    latitude: -8.01455,
    longitude: -34.95035,
    cursosAtrelados: [
      'Sistemas de Informação',
      'Ciência da Computação',
      'Licenciatura em Computação',
      'Computação',
    ],
  },
  {
    id: 'ceagri-1',
    nome: 'CEAGRI I — Complexo de Salas de Aula',
    sigla: 'CEAGRI I',
    descricao: 'Salas de aula de ciclos básicos, engenharias e ciências agrárias.',
    categoria: 'curso',
    latitude: -8.01835,
    longitude: -34.94895,
    cursosAtrelados: [
      'Agronomia',
      'Engenharia Agrícola e Ambiental',
      'Engenharia Florestal',
      'Engenharia de Pesca',
    ],
  },
  {
    id: 'ceagri-2',
    nome: 'CEAGRI II — Complexo de Salas de Aula',
    sigla: 'CEAGRI II',
    descricao: 'Prédio de aulas teóricas e laboratórios multidisciplinares.',
    categoria: 'curso',
    latitude: -8.01745,
    longitude: -34.94785,
    cursosAtrelados: [
      'Administração',
      'Ciências Econômicas',
      'Ciências Contábeis',
      'Ciências do Consumo',
    ],
  },
  {
    id: 'cegoe',
    nome: 'CEGOE — Centro de Ensino de Graduação',
    sigla: 'CEGOE',
    descricao: 'Salas de aula das licenciaturas, biológicas e humanas.',
    categoria: 'curso',
    latitude: -8.01615,
    longitude: -34.94865,
    cursosAtrelados: [
      'Ciências Biológicas',
      'Física',
      'Matemática',
      'Química',
      'História',
      'Letras',
      'Pedagogia',
      'Educação Física',
    ],
  },
  {
    id: 'dmv',
    nome: 'Departamento de Medicina Veterinária',
    sigla: 'DMV',
    descricao: 'Hospital Veterinário, clínicas e salas de aula de Veterinária.',
    categoria: 'curso',
    latitude: -8.01965,
    longitude: -34.95115,
    cursosAtrelados: ['Medicina Veterinária'],
  },
  {
    id: 'dz',
    nome: 'Departamento de Zootecnia',
    sigla: 'DZ',
    descricao: 'Coordenação, laboratórios e áreas experimentais de Zootecnia.',
    categoria: 'curso',
    latitude: -8.02045,
    longitude: -34.94985,
    cursosAtrelados: ['Zootecnia'],
  },
  {
    id: 'dtr-gastronomia',
    nome: 'Departamento de Tecnologia Rural / Gastronomia',
    sigla: 'DTR',
    descricao: 'Cozinhas laboratoriais, tecnologia de alimentos e economia doméstica.',
    categoria: 'curso',
    latitude: -8.01685,
    longitude: -34.95145,
    cursosAtrelados: ['Gastronomia', 'Economia Doméstica', 'Engenharia de Alimentos'],
  },
  {
    id: 'biblioteca-central',
    nome: 'Biblioteca Central (BC)',
    sigla: 'BC',
    descricao: 'Acervo bibliográfico, cabines de estudo individual e em grupo.',
    categoria: 'servico',
    latitude: -8.01785,
    longitude: -34.95025,
  },
  {
    id: 'ru',
    nome: 'Restaurante Universitário (RU)',
    sigla: 'RU',
    descricao: 'Almoço e jantar universitário.',
    categoria: 'convivencia',
    latitude: -8.01695,
    longitude: -34.94965,
  },
  {
    id: 'predio-central',
    nome: 'Prédio Central / Reitoria / DRCA',
    sigla: 'Reitoria',
    descricao: 'Administração central, DRCA e atendimento acadêmico.',
    categoria: 'servico',
    latitude: -8.01895,
    longitude: -34.94935,
  },
  {
    id: 'cegen',
    nome: 'CEGEN — Centro de Ensino de Graduação',
    sigla: 'CEGEN',
    descricao: 'Salas de aula de graduação e funcionamento do Departamento de Matemática (4º andar).',
    categoria: 'curso',
    latitude: -8.01615,
    longitude: -34.94865,
    cursosAtrelados: [
      'Matemática',
      'Física',
      'Química',
      'Ciências Biológicas',
      'História',
      'Letras',
      'Pedagogia',
      'Educação Física',
      'Ciências Sociais',
    ],
  },
  {
    id: 'cenapesq',
    nome: 'CENAPESQ — Centro de Apoio à Pesquisa',
    sigla: 'CENAPESQ',
    descricao: 'Centro de apoio à pesquisa com laboratórios e espaços de investigação científica.',
    categoria: 'servico',
    latitude: -8.01655,
    longitude: -34.95085,
  },
  {
    id: 'dcfl',
    nome: 'Departamento de Ciência Florestal',
    sigla: 'DCFL',
    descricao: 'Coordenação, laboratórios e atividades de Ciência Florestal e Engenharia Florestal.',
    categoria: 'curso',
    latitude: -8.01915,
    longitude: -34.94815,
    cursosAtrelados: ['Ciência Florestal', 'Engenharia Florestal'],
  },
  {
    id: 'dmfa',
    nome: 'Departamento de Morfologia e Fisiologia Animal',
    sigla: 'DMFA',
    descricao: 'Laboratórios e espaços acadêmicos de morfologia e fisiologia animal.',
    categoria: 'curso',
    latitude: -8.01995,
    longitude: -34.95055,
    cursosAtrelados: ['Medicina Veterinária', 'Zootecnia'],
  },
  {
    id: 'depaq',
    nome: 'Departamento de Pesca e Aquicultura',
    sigla: 'DEPAQ',
    descricao: 'Laboratórios, coordenação e pesquisa em pesca, aquicultura e engenharia de pesca.',
    categoria: 'curso',
    latitude: -8.01865,
    longitude: -34.95135,
    cursosAtrelados: ['Engenharia de Pesca', 'Pesca e Aquicultura'],
  },
  {
    id: 'decon',
    nome: 'Departamento de Ciências Econômicas',
    sigla: 'DECON',
    descricao: 'Coordenação, grupos de pesquisa e salas ligadas a Ciências Econômicas.',
    categoria: 'curso',
    latitude: -8.01725,
    longitude: -34.94745,
    cursosAtrelados: ['Ciências Econômicas'],
  },
];

function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Encontra o prédio correspondente ao curso do estudante.
 * Faz correspondência exata primeiro e parcial como fallback.
 */

export function encontrarLocalDoCurso(cursoUsuario?: string | null): LocalCampus | null {
  if (!cursoUsuario) return null;
  const alvo = normalizarTexto(cursoUsuario);
  if (!alvo || alvo === 'nao informado') return null;

  // 1. Busca exata
  const exato = LOCAIS_UFRPE.find((local) =>
    local.cursosAtrelados?.some((c) => normalizarTexto(c) === alvo)
  );
  if (exato) return exato;

  // 2. Busca parcial (ex.: "Bacharelado em Sistemas de Informação" -> "Sistemas de Informação")

  const parcial = LOCAIS_UFRPE.find((local) =>
    local.cursosAtrelados?.some((c) => {
      const nc = normalizarTexto(c);
      return alvo.includes(nc) || nc.includes(alvo);
    })
  );
  return parcial ?? null;
}