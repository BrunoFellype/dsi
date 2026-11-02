const assert = require('node:assert/strict');
const { test } = require('node:test');
const { canalAutorizado, lerConfiguracaoDiscord } = require('./config');
const { interpretarMensagemDiscord } = require('./interpretador');

const ambiente = {
  DISCORD_BOT_TOKEN: 'token-de-teste',
  DISCORD_ALLOWED_CHANNELS: JSON.stringify([
    { guildId: 'servidor-1', channelId: 'canal-1', estudanteIds: ['aluno-1'] },
  ]),
};

test('aceita somente o servidor e canal configurados', () => {
  const config = lerConfiguracaoDiscord(ambiente);
  assert.ok(canalAutorizado(config, 'servidor-1', 'canal-1'));
  assert.equal(canalAutorizado(config, 'servidor-1', 'canal-2'), undefined);
});

test('interpreta uma mensagem acadêmica do Discord', () => {
  const aviso = interpretarMensagemDiscord({
    id: 'mensagem-1',
    texto: 'Entrega do trabalho de Banco de Dados dia 20/11 às 14h',
    recebidoEm: '2026-11-02T10:00:00.000Z',
    autor: 'professor#1234',
    servidorId: 'servidor-1',
    canalId: 'canal-1',
    anexos: [{ nome: 'enunciado.pdf', url: 'https://discord.test/anexo' }],
  });
  assert.equal(aviso.fonte, 'discord');
  assert.equal(aviso.tipo, 'prazo');
  assert.equal(new Date(aviso.prazo).getHours(), 14);
  assert.equal(aviso.discord.anexos[0].nome, 'enunciado.pdf');
});

test('descarta mensagens curtas', () => {
  assert.equal(interpretarMensagemDiscord({ id: '1', texto: 'ok' }), null);
});
