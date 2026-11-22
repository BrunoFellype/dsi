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
    latitude: -8.017493848122164,
    longitude: -34.944525845240044,
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
    sigla: 'C1',
    descricao: 'Salas de aula de ciclos básicos, engenharias e ciências agrárias.',
    categoria: 'curso',
    latitude: -8.017527344979387,
    longitude: -34.94407191710958,
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
    sigla: 'C2',
    descricao: 'Prédio de aulas teóricas e laboratórios multidisciplinares.',
    categoria: 'curso',
    latitude: -8.017498208530691, 
    longitude: -34.944484917109165,
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
    latitude: -8.01736293657702, 
    longitude: -34.94972322875223,
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
    latitude: -8.01465150927084, 
    longitude: -34.94842969991711,
    cursosAtrelados: ['Medicina Veterinária'],
  },
  {
    id: 'dz',
    nome: 'Departamento de Zootecnia',
    sigla: 'DZ',
    descricao: 'Coordenação, laboratórios e áreas experimentais de Zootecnia.',
    categoria: 'curso',
    latitude: -8.019989466189095, 
    longitude: -34.9543493882728,
    cursosAtrelados: ['Zootecnia'],
  },
  {
    id: 'dtr-gastronomia',
    nome: 'Departamento de Tecnologia Rural / Gastronomia',
    sigla: 'DTR',
    descricao: 'Cozinhas laboratoriais, tecnologia de alimentos e economia doméstica.',
    categoria: 'curso',
    latitude: -8.018278531147017, 
    longitude: -34.94402354293197,
    cursosAtrelados: ['Gastronomia', 'Economia Doméstica', 'Engenharia de Alimentos'],
  },
  {
    id: 'biblioteca-central',
    nome: 'Biblioteca Central (BC)',
    sigla: 'BC',
    descricao: 'Acervo bibliográfico, cabines de estudo individual e em grupo.',
    categoria: 'servico',
    latitude: -8.013576067902683, 
    longitude: -34.948490225053476,
  },
  {
    id: 'ru',
    nome: 'Restaurante Universitário (RU)',
    sigla: 'RU',
    descricao: 'Almoço e jantar universitário.',
    categoria: 'convivencia',
    latitude: -8.014056675470266, 
    longitude: -34.95107478827291,
  },
  {
    id: 'predio-central',
    nome: 'Prédio Central / Reitoria / DRCA',
    sigla: 'Reitoria',
    descricao: 'Administração central, DRCA e atendimento acadêmico.',
    categoria: 'servico',
    latitude: -8.014014147259445, 
    longitude: -34.95083875427791,
  },
  {
    id: 'cegen',
    nome: 'CEGEN — Centro de Ensino de Graduação',
    sigla: 'CEGEN',
    descricao: 'Salas de aula de graduação e funcionamento do Departamento de Matemática (4º andar).',
    categoria: 'curso',
    latitude: -8.015781435793986, 
    longitude: -34.95127624779518,
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
    latitude: -8.017390832451431, 
    longitude: -34.95038283060297,
  },
  {
    id: 'dcfl',
    nome: 'Departamento de Ciência Florestal',
    sigla: 'DCFL',
    descricao: 'Coordenação, laboratórios e atividades de Ciência Florestal e Engenharia Florestal.',
    categoria: 'curso',
    latitude: -8.016764216379382, 
    longitude: -34.94526776738203,
    cursosAtrelados: ['Ciência Florestal', 'Engenharia Florestal'],
  },
  {
    id: 'dmfa',
    nome: 'Departamento de Morfologia e Fisiologia Animal',
    sigla: 'DMFA',
    descricao: 'Laboratórios e espaços acadêmicos de morfologia e fisiologia animal.',
    categoria: 'curso',
    latitude: -8.01406708684288, 
    longitude: -34.95049260546617,
    cursosAtrelados: ['Medicina Veterinária', 'Zootecnia'],
  },
  {
    id: 'depaq',
    nome: 'Departamento de Pesca e Aquicultura',
    sigla: 'DEPAQ',
    descricao: 'Laboratórios, coordenação e pesquisa em pesca, aquicultura e engenharia de pesca.',
    categoria: 'curso',
    latitude: -8.019196352753271, 
    longitude: -34.9441673594384,
    cursosAtrelados: ['Engenharia de Pesca', 'Pesca e Aquicultura'],
  },
  {
    id: 'decon',
    nome: 'Departamento de Ciências Econômicas',
    sigla: 'DECON',
    descricao: 'Coordenação, grupos de pesquisa e salas ligadas a Ciências Econômicas.',
    categoria: 'curso',
    latitude: -8.018407556788102, 
    longitude: -34.94985101710989,
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