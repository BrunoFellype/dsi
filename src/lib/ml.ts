/**
 * Agrupamento de avisos (Seção 2.2 do artigo):
 *  - vetorização TF-IDF;
 *  - K-Means (esférico, com inicialização k-means++);
 *  - número de grupos k escolhido pelo Coeficiente de Silhueta;
 *  - correções do estudante (human-in-the-loop) aplicadas por cima do resultado.
 * Tudo roda no próprio aparelho, sem enviar mensagens para servidor.
 */
import type { Aviso, Grupo } from './types';

const STOPWORDS = new Set(
  (
    'a o as os um uma uns umas de da do das dos em na no nas nos por para pra com sem sobre entre ' +
    'e ou mas que se ao aos como mais muito muita ja nao sim foi ser sao esta estao esse essa isso ' +
    'este esta isto aqui ali la tem ter vai vao pois porque quando onde qual quais ate depois antes ' +
    'ola oi bom boa dia tarde noite pessoal galera gente favor obrigado obrigada pf pfv tb tbm vcs voces ' +
    'amanha hoje ontem semana proxima proximo vale ficar fica vai estar disponivel quem quiser ' +
    'classroom whatsapp telegram discord sigaa drive grupo'
  ).split(' ')
);

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function tokenizar(texto: string): string[] {
  return normalizar(texto)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t) && !/^\d+(h\d*)?$/.test(t))
    .map((t) => (t.length > 4 && t.endsWith('s') ? t.slice(0, -1) : t));
}

interface Vetorizacao {
  vocabulario: string[];
  vetores: number[][];
}

export function tfidf(documentos: string[]): Vetorizacao {
  const tokens = documentos.map(tokenizar);
  const df = new Map<string, number>();
  tokens.forEach((ts) => new Set(ts).forEach((t) => df.set(t, (df.get(t) ?? 0) + 1)));
  const vocabulario = [...df.keys()].sort();
  const indice = new Map(vocabulario.map((t, i) => [t, i]));
  const n = documentos.length;
  const vetores = tokens.map((ts) => {
    const v = new Array<number>(vocabulario.length).fill(0);
    ts.forEach((t) => {
      v[indice.get(t)!] += 1;
    });
    let norma = 0;
    for (let i = 0; i < v.length; i++) {
      if (v[i] > 0) {
        const idf = Math.log((1 + n) / (1 + df.get(vocabulario[i])!)) + 1;
        v[i] = (1 + Math.log(v[i])) * idf;
        norma += v[i] * v[i];
      }
    }
    norma = Math.sqrt(norma) || 1;
    return v.map((x) => x / norma);
  });
  return { vocabulario, vetores };
}

export function cosseno(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function gerador(semente: number) {
  let s = semente >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalizarVetor(v: number[]): number[] {
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / n);
}

export function kmeans(vetores: number[][], k: number, semente = 42) {
  const rnd = gerador(semente);
  const n = vetores.length;
  const dim = vetores[0].length;
  if (dim === 0 || n === 0) {
    return { rotulos: new Array<number>(n).fill(0), centros: [] };
  }

  // k-means++: sorteia o primeiro centro e depois favorece pontos distantes
  const centros: number[][] = [vetores[Math.floor(rnd() * n)].slice()];
  while (centros.length < k) {
    const dist = vetores.map((v) => Math.min(...centros.map((c) => 1 - cosseno(v, c))) ** 2);
    const total = dist.reduce((a, b) => a + b, 0);
    if (total === 0) {
      centros.push(vetores[Math.floor(rnd() * n)].slice());
      continue;
    }
    let alvo = rnd() * total;
    let escolhido = n - 1;
    for (let i = 0; i < n; i++) {
      alvo -= dist[i];
      if (alvo <= 0) {
        escolhido = i;
        break;
      }
    }
    centros.push(vetores[escolhido].slice());
  }

  let rotulos = new Array<number>(n).fill(0);
  for (let iter = 0; iter < 40; iter++) {
    const novos = vetores.map((v) => {
      let melhor = 0;
      let melhorSim = -Infinity;
      centros.forEach((c, i) => {
        const sim = cosseno(v, c);
        if (sim > melhorSim) {
          melhorSim = sim;
          melhor = i;
        }
      });
      return melhor;
    });
    const mudou = novos.some((r, i) => r !== rotulos[i]);
    rotulos = novos;
    for (let c = 0; c < k; c++) {
      const membros = vetores.filter((_, i) => rotulos[i] === c);
      if (membros.length === 0) continue;
      const soma = new Array<number>(dim).fill(0);
      membros.forEach((m) => m.forEach((x, d) => (soma[d] += x)));
      centros[c] = normalizarVetor(soma);
    }
    if (!mudou) break;
  }
  return { rotulos, centros };
}

/** Coeficiente de Silhueta médio (distância = 1 - cosseno). Vai de -1 a 1. */
export function silhueta(vetores: number[][], rotulos: number[]): number {
  const k = Math.max(...rotulos) + 1;
  if (k <= 1 || vetores.length <= k) return 0;
  let total = 0;
  vetores.forEach((v, i) => {
    const somas = new Array<number>(k).fill(0);
    const contagem = new Array<number>(k).fill(0);
    vetores.forEach((w, j) => {
      if (i === j) return;
      somas[rotulos[j]] += 1 - cosseno(v, w);
      contagem[rotulos[j]] += 1;
    });
    const proprio = rotulos[i];
    if (contagem[proprio] === 0) return;
    const a = somas[proprio] / contagem[proprio];
    let b = Infinity;
    for (let c = 0; c < k; c++) {
      if (c !== proprio && contagem[c] > 0) b = Math.min(b, somas[c] / contagem[c]);
    }
    if (b === Infinity) return;
    total += (b - a) / Math.max(a, b, 1e-9);
  });
  return total / vetores.length;
}

/**
 * Testa k de 2 até kMax e fica com o agrupamento de maior Coeficiente de Silhueta.
 * Precisa de pelo menos 3 vetores (k vai até n - 1).
 */
export function escolherK(vetores: number[][], kMax = 6) {
  const limite = Math.min(kMax, vetores.length - 1);
  let melhor = {
    k: 1,
    rotulos: new Array<number>(vetores.length).fill(0),
    centros: [] as number[][],
    silhueta: -Infinity,
  };
  for (let k = 2; k <= limite; k++) {
    const resultado = kmeans(vetores, k);
    const valor = silhueta(vetores, resultado.rotulos);
    if (valor > melhor.silhueta) melhor = { k, ...resultado, silhueta: valor };
  }
  return melhor;
}

/** Recupera a grafia original (com acento) de um termo normalizado, olhando os textos do grupo. */
function palavraOriginal(termo: string, textos: string[]): string {
  for (const texto of textos) {
    for (const palavra of texto.split(/[^\p{L}\p{N}]+/u)) {
      if (palavra && tokenizar(palavra)[0] === termo) return palavra.toLowerCase();
    }
  }
  return termo;
}

function rotuloDoGrupo(centro: number[], vocabulario: string[], textos: string[]): string {
  const principais = centro
    .map((peso, i) => ({ peso, termo: vocabulario[i] }))
    .sort((x, y) => y.peso - x.peso)
    .slice(0, 2)
    .filter((t) => t.peso > 0)
    .map((t) => palavraOriginal(t.termo, textos));
  if (principais.length === 0) return 'Geral';
  const texto = principais.join(' • ');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function limparNomeDisciplina(nome: string): string {
  return nome.replace(/^[[(]?\s*(?:\d{4}\.?\d?|[a-z0-9_-]+)\s*[\])]\s*/i, '').trim() || nome.trim();
}

export interface ResultadoAgrupamento {
  grupos: Grupo[];
  /** Silhueta do k escolhido; null quando há poucos avisos para medir. */
  silhueta: number | null;
  k: number;
}

/**
 * Agrupa os avisos por assunto.
 * `correcoes` liga o aviso corrigido ao aviso-âncora do grupo que o estudante escolheu.
 */
export function agruparAvisos(
  avisos: Aviso[],
  correcoes: Record<string, string> = {}
): ResultadoAgrupamento {
  if (avisos.length === 0) return { grupos: [], silhueta: null, k: 0 };

  // Deduplica mensagens idênticas
  const unicos: Aviso[] = [];
  const vistos = new Set<string>();
  for (const a of avisos) {
    const textoLimpo = a.texto.trim().toLowerCase();
    const chave = `${a.disciplina ?? ''}|${textoLimpo}`;
    if (!vistos.has(chave)) {
      vistos.add(chave);
      unicos.push(a);
    }
  }

  // Agrupa mensagens que já possuem disciplina identificada (SIGAA ou Classroom)
  const gruposMap = new Map<string, Aviso[]>();
  const avulsos: Aviso[] = [];

  for (const a of unicos) {
    if (a.disciplina && a.disciplina.trim().length > 0) {
      const chaveDisc = limparNomeDisciplina(a.disciplina);
      const lista = gruposMap.get(chaveDisc) ?? [];
      lista.push(a);
      gruposMap.set(chaveDisc, lista);
    } else {
      avulsos.push(a);
    }
  }

  // Mensagens avulsas sem disciplina são agrupadas via TF-IDF e K-Means
  if (avulsos.length > 0) {
    if (avulsos.length < 3) {
      const lista = gruposMap.get('Outros Avisos') ?? [];
      lista.push(...avulsos);
      gruposMap.set('Outros Avisos', lista);
    } else {
      const docs = avulsos.map((a) => a.texto);
      const { vocabulario, vetores } = tfidf(docs);
      // k escolhido pelo Coeficiente de Silhueta (k de 2 a 6)
      const { k, rotulos, centros } = escolherK(vetores);
      for (let c = 0; c < k; c++) {
        const membros = avulsos.filter((_, i) => rotulos[i] === c);
        if (membros.length === 0) continue;
        const rotulo = rotuloDoGrupo(centros[c] ?? [], vocabulario, membros.map((m) => m.texto));
        const lista = gruposMap.get(rotulo) ?? [];
        lista.push(...membros);
        gruposMap.set(rotulo, lista);
      }
    }
  }

  // Monta os grupos iniciais
  let grupos: Grupo[] = Array.from(gruposMap.entries()).map(([rotulo, itens], idx) => ({
    id: `grupo-${idx}`,
    rotulo,
    avisos: itens,
  }));

  // Correções do estudante: o aviso vai para o grupo onde está o aviso-âncora.
  if (Object.keys(correcoes).length > 0) {
    const mapaAvisoParaGrupo = new Map<string, Grupo>();
    grupos.forEach((g) => g.avisos.forEach((a) => mapaAvisoParaGrupo.set(a.id, g)));

    Object.entries(correcoes).forEach(([avisoId, ancoraId]) => {
      const grupoDestino = mapaAvisoParaGrupo.get(ancoraId);
      const grupoOrigem = mapaAvisoParaGrupo.get(avisoId);
      if (grupoDestino && grupoOrigem && grupoDestino.id !== grupoOrigem.id) {
        const avisoMovido = grupoOrigem.avisos.find((a) => a.id === avisoId);
        if (avisoMovido) {
          grupoOrigem.avisos = grupoOrigem.avisos.filter((a) => a.id !== avisoId);
          grupoDestino.avisos.push(avisoMovido);
          mapaAvisoParaGrupo.set(avisoId, grupoDestino);
        }
      }
    });

    grupos = grupos.filter((g) => g.avisos.length > 0);
  }

  // Ordena por grupos com mais mensagens primeiro
  grupos.sort((a, b) => b.avisos.length - a.avisos.length);

  // Silhueta do agrupamento final (com as correções), medida nos vetores TF-IDF
  let valorSilhueta: number | null = null;
  if (grupos.length > 1) {
    const todos = grupos.flatMap((g) => g.avisos);
    const rotulosFinais = grupos.flatMap((g, i) => g.avisos.map(() => i));
    const { vetores } = tfidf(todos.map((a) => a.texto));
    valorSilhueta = Math.round(silhueta(vetores, rotulosFinais) * 1000) / 1000;
  }

  return {
    grupos,
    silhueta: valorSilhueta,
    k: grupos.length,
  };
}

/** Avisos quase iguais vindos de canais diferentes (ruído de comunicação). */
export function agruparRepetidos(avisos: Aviso[], limite = 0.4): Aviso[][] {
  if (avisos.length === 0) return [];
  const { vetores } = tfidf(avisos.map((a) => a.texto));
  const usado = new Array<boolean>(avisos.length).fill(false);
  const resultado: Aviso[][] = [];
  avisos.forEach((aviso, i) => {
    if (usado[i]) return;
    usado[i] = true;
    const grupo = [aviso];
    for (let j = i + 1; j < avisos.length; j++) {
      if (!usado[j] && cosseno(vetores[i], vetores[j]) >= limite) {
        usado[j] = true;
        grupo.push(avisos[j]);
      }
    }
    resultado.push(grupo);
  });
  return resultado;
}