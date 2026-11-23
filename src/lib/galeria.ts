/**
 * Regras puras da galeria de imagens dos avisos (sem dependência de React Native),
 * para poderem ser testadas com node:test.
 */
import type { Aviso } from './types';

/** Limite de fotos por aviso, para não pesar o armazenamento local. */
export const MAX_IMAGENS_POR_AVISO = 8;

/** Acrescenta uma imagem ao fim da lista, sem repetir e respeitando o limite. */
export function adicionarImagem(imagens: string[] | undefined, url: string, max = MAX_IMAGENS_POR_AVISO): string[] {
  const lista = imagens ?? [];
  const limpa = url.trim();
  if (!limpa || lista.includes(limpa) || lista.length >= max) return lista;
  return [...lista, limpa];
}

/** Remove a imagem da posição indicada. Índice inválido devolve a lista intacta. */
export function removerImagem(imagens: string[] | undefined, indice: number): string[] {
  const lista = imagens ?? [];
  if (indice < 0 || indice >= lista.length) return lista;
  return lista.filter((_, i) => i !== indice);
}

/** Junta as imagens de vários avisos (ex.: um assunto), sem repetir, na ordem dos avisos. */
export function imagensDosAvisos(avisos: Pick<Aviso, 'imagens'>[]): string[] {
  const vistas = new Set<string>();
  for (const a of avisos) for (const url of a.imagens ?? []) vistas.add(url);
  return [...vistas];
}

/** Página atual do carrossel a partir do deslocamento horizontal. */
export function paginaDoDeslocamento(deslocamentoX: number, largura: number, total: number): number {
  if (largura <= 0 || total <= 0) return 0;
  const pagina = Math.round(deslocamentoX / largura);
  return Math.min(Math.max(pagina, 0), total - 1);
}
