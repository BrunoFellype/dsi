const CATEGORIAS = ['atividade', 'prova', 'avaliacao', 'prazo', 'material', 'comunicado', 'evento'];
const TIPOS_AVISO = new Set(['prazo', 'material', 'comunicado']);

const ESQUEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['categoria', 'titulo', 'disciplina', 'data', 'hora', 'evidenciaData'],
  properties: {
    categoria: { type: 'string', enum: CATEGORIAS },
    titulo: { type: ['string', 'null'] },
    disciplina: { type: ['string', 'null'] },
    data: { type: ['string', 'null'], description: 'Data ISO YYYY-MM-DD somente quando estiver explicitamente indicada.' },
    hora: { type: ['string', 'null'], description: 'Hora HH:mm somente quando estiver explicitamente indicada.' },
    evidenciaData: { type: ['string', 'null'], description: 'Trecho original que sustenta data e hora.' },
  },
};

function normalizar(texto) {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function jsonDaResposta(corpo) {
  const conteudo = corpo?.choices?.[0]?.message?.content;
  if (typeof conteudo !== 'string') throw new Error('A API de IA não retornou conteúdo JSON.');
  try {
    return JSON.parse(conteudo);
  } catch {
    throw new Error('A API de IA retornou JSON inválido.');
  }
}

function validarInterpretacao(valor, texto) {
  if (!valor || typeof valor !== 'object' || !CATEGORIAS.includes(valor.categoria)) {
    throw new Error('A API de IA retornou uma categoria inválida.');
  }
  for (const campo of ['titulo', 'disciplina', 'data', 'hora', 'evidenciaData']) {
    if (valor[campo] !== null && typeof valor[campo] !== 'string') {
      throw new Error(`A API de IA retornou ${campo} em formato inválido.`);
    }
  }
  if (valor.data !== null && !/^\d{4}-\d{2}-\d{2}$/.test(valor.data)) {
    throw new Error('A API de IA retornou uma data fora do formato ISO.');
  }
  if (valor.hora !== null && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(valor.hora)) {
    throw new Error('A API de IA retornou uma hora inválida.');
  }
  if (valor.data !== null && (!valor.evidenciaData || !normalizar(texto).includes(normalizar(valor.evidenciaData)))) {
    throw new Error('A data retornada pela IA não possui evidência na mensagem original.');
  }
  if (valor.data === null && valor.hora !== null) {
    throw new Error('A IA não pode retornar hora sem data.');
  }
  if (valor.data !== null) {
    const data = new Date(`${valor.data}T${valor.hora || '23:59'}:00`);
    if (Number.isNaN(data.getTime())) throw new Error('A API de IA retornou uma data inexistente.');
    const [ano, mes, dia] = valor.data.split('-').map(Number);
    if (data.getFullYear() !== ano || data.getMonth() + 1 !== mes || data.getDate() !== dia) {
      throw new Error('A API de IA retornou uma data inexistente.');
    }
  }
  return valor;
}

async function interpretarSemanticamente(mensagem, env = process.env) {
  const chave = String(env.AI_API_KEY || '').trim();
  if (!chave) throw new Error('AI_API_KEY não configurada; mensagem Discord não processada.');
  const endpoint = String(env.AI_API_URL || 'https://api.openai.com/v1/chat/completions').replace(/\/$/, '');
  const modelo = String(env.AI_MODEL || 'gpt-4o-mini');
  const controlador = new AbortController();
  const timeout = setTimeout(() => controlador.abort(), Number(env.AI_TIMEOUT_MS) || 30000);
  try {
    const resposta = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelo,
        temperature: 0,
        response_format: { type: 'json_schema', json_schema: { name: 'classificacao_academica', strict: true, schema: ESQUEMA } },
        messages: [
          {
            role: 'system',
            content: 'Classifique semanticamente mensagens acadêmicas em português. Use somente informações explícitas na mensagem. Se uma informação não estiver presente, retorne null. Não invente datas, horários, disciplinas ou títulos. Para data, evidenceData deve ser um trecho literal da mensagem.',
          },
          {
            role: 'user',
            content: JSON.stringify({ mensagem: mensagem.texto, anexos: mensagem.anexos || [] }),
          },
        ],
      }),
      signal: controlador.signal,
    });
    const corpo = await resposta.json().catch(() => null);
    if (!resposta.ok) throw new Error(`API de IA respondeu HTTP ${resposta.status}.`);
    return validarInterpretacao(jsonDaResposta(corpo), mensagem.texto);
  } catch (erro) {
    if (erro?.name === 'AbortError') throw new Error('A API de IA excedeu o tempo limite.');
    throw erro;
  } finally {
    clearTimeout(timeout);
  }
}

function construirAviso(mensagem, interpretacao) {
  const texto = String(mensagem.texto || '').trim();
  const prazo = interpretacao.data
    ? new Date(`${interpretacao.data}T${interpretacao.hora || '23:59'}:00`).toISOString()
    : undefined;
  const tipo = ['atividade', 'prova', 'avaliacao', 'prazo'].includes(interpretacao.categoria)
    ? 'prazo'
    : TIPOS_AVISO.has(interpretacao.categoria)
      ? interpretacao.categoria
      : 'comunicado';
  return {
    id: `discord-${mensagem.id}`,
    fonte: 'discord',
    texto,
    recebidoEm: new Date(mensagem.recebidoEm || Date.now()).toISOString(),
    tipo,
    disciplina: interpretacao.disciplina || undefined,
    prazo,
    prazoSemHora: Boolean(interpretacao.data && !interpretacao.hora) || undefined,
    autor: mensagem.autor || undefined,
    discord: {
      mensagemId: mensagem.id,
      servidorId: mensagem.servidorId,
      servidorNome: mensagem.servidorNome,
      canalId: mensagem.canalId,
      canalNome: mensagem.canalNome,
      anexos: mensagem.anexos || [],
      interpretacao,
    },
  };
}

async function interpretarMensagemDiscord(mensagem, env = process.env) {
  const texto = String(mensagem.texto || '').trim();
  if (!texto && (!mensagem.anexos || mensagem.anexos.length === 0)) return null;
  const interpretacao = await interpretarSemanticamente({ ...mensagem, texto }, env);
  return construirAviso({ ...mensagem, texto }, interpretacao);
}

module.exports = {
  interpretarMensagemDiscord,
  interpretarSemanticamente,
  validarInterpretacao,
  construirAviso,
  ESQUEMA,
};
