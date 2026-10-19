/** Opções prontas para as listas de escolha (o estudante ainda pode digitar "Outro…"). */

/** Cursos de graduação da UFRPE (sede e unidades acadêmicas). */
export const CURSOS = [
  'Administração',
  'Agronomia',
  'Bacharelado em Ciência da Computação',
  'Bacharelado em Ciências Biológicas',
  'Bacharelado em Ciências Econômicas',
  'Bacharelado em Ciências Sociais',
  'Bacharelado em Sistemas de Informação',
  'Ciências Contábeis',
  'Educação Física',
  'Engenharia Agrícola e Ambiental',
  'Engenharia de Alimentos',
  'Engenharia de Pesca',
  'Engenharia Florestal',
  'Gastronomia',
  'Licenciatura em Ciências Biológicas',
  'Licenciatura em Computação',
  'Licenciatura em Física',
  'Licenciatura em História',
  'Licenciatura em Letras',
  'Licenciatura em Matemática',
  'Licenciatura em Pedagogia',
  'Licenciatura em Química',
  'Medicina Veterinária',
  'Zootecnia',
];

export const PERIODOS = ['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10º', '11º', '12º'];

export const METAS_HORAS = ['1 h', '2 h', '3 h', '4 h', '5 h', '6 h'];

export const METODOS_ANOTACAO = ['Digital', 'Papel', 'Híbrido'];

export const CANAIS = ['SIGAA', 'Google Classroom', 'WhatsApp', 'Telegram', 'Discord', 'E-mail'];

/** "2 h", "2,5" ou "3" viram número; o resto vira null (não informado). */
export function lerHorasMeta(valor: string): number | null {
  const n = Number(valor.replace(',', '.').replace(/[^\d.]/g, ''));
  return valor.trim() && Number.isFinite(n) && n > 0 ? n : null;
}
