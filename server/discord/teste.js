const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
const { canalAutorizado, lerConfiguracaoDiscord } = require('./config');
const { interpretarMensagemDiscord, validarInterpretacao } = require('./interpretador');

const ambiente = {
  DISCORD_BOT_TOKEN: 'token-de-teste',
  AI_API_KEY: 'chave-de-teste',
  DISCORD_ALLOWED_CHANNELS: JSON.stringify([
    { guildId: 'servidor-1', channelId: 'canal-1', estudanteIds: ['aluno-1'] },
  ]),
};

afterEach(() => {
  delete globalThis.fetch;
});

function respostaIA(classificacao) {
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content: JSON.stringify(classificacao) } }] }),
  });
}

test('aceita somente o servidor e canal configurados', () => {
  const config = lerConfiguracaoDiscord(ambiente);
  assert.ok(canalAutorizado(config, 'servidor-1', 'canal-1'));
  assert.equal(canalAutorizado(config, 'servidor-1', 'canal-2'), undefined);
});

test('interpreta semanticamente uma mensagem acadêmica via JSON da IA', async () => {
  respostaIA({
    categoria: 'prova',
    titulo: 'Prova de Banco de Dados',
    disciplina: 'Banco de Dados',
    data: '2026-11-20',
    hora: '14:00',
    evidenciaData: 'dia 20/11 às 14h',
  });
  const aviso = await interpretarMensagemDiscord({
    id: 'mensagem-1',
    texto: 'A prova de Banco de Dados será dia 20/11 às 14h.',
    recebidoEm: '2026-11-02T10:00:00.000Z',
    autor: 'professor#1234',
    servidorId: 'servidor-1',
    canalId: 'canal-1',
    anexos: [{ nome: 'enunciado.pdf', url: 'https://discord.test/anexo' }],
  }, ambiente);
  assert.equal(aviso.id, 'discord-mensagem-1');
  assert.equal(aviso.tipo, 'prazo');
  assert.equal(aviso.disciplina, 'Banco de Dados');
  assert.equal(aviso.discord.interpretacao.categoria, 'prova');
});

test('não processa sem chave da API e não usa fallback heurístico', async () => {
  await assert.rejects(
    () => interpretarMensagemDiscord({ id: '1', texto: 'Entrega dia 20/11' }, {}),
    /AI_API_KEY não configurada/
  );
});

test('rejeita data sem evidência na mensagem original', () => {
  assert.throws(() => validarInterpretacao({
    categoria: 'prazo',
    titulo: null,
    disciplina: null,
    data: '2026-11-20',
    hora: null,
    evidenciaData: 'dia 20/11',
  }, 'Mensagem sem data.'), /evidência/);
});

test('preserva mensagens que só contêm anexos', async () => {
  respostaIA({
    categoria: 'material',
    titulo: 'Material da aula',
    disciplina: null,
    data: null,
    hora: null,
    evidenciaData: null,
  });
  const aviso = await interpretarMensagemDiscord({
    id: 'anexo-1',
    texto: '',
    anexos: [{ nome: 'slide.pdf', url: 'https://discord.test/slide' }],
  }, ambiente);
  assert.equal(aviso.tipo, 'material');
  assert.equal(aviso.texto, '');
});
