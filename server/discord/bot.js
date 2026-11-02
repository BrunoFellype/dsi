const { Client, GatewayIntentBits } = require('discord.js');
const { canalAutorizado, lerConfiguracaoDiscord } = require('./config');
const { criarFirestore, salvarAvisoDiscord } = require('./firestore');
const { interpretarMensagemDiscord } = require('./interpretador');

function iniciarBotDiscord(env = process.env) {
  const config = lerConfiguracaoDiscord(env);
  const db = criarFirestore(env);
  const cliente = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  });

  cliente.once('ready', () => {
    console.log(`Bot Discord conectado como ${cliente.user.tag}.`);
  });
  cliente.on('messageCreate', async (mensagem) => {
    if (mensagem.author.bot || !mensagem.guild) return;
    const canal = canalAutorizado(config, mensagem.guild.id, mensagem.channelId);
    if (!canal) return;
    const aviso = interpretarMensagemDiscord({
      id: mensagem.id,
      texto: mensagem.content,
      recebidoEm: mensagem.createdAt.toISOString(),
      autor: mensagem.author.tag,
      servidorId: mensagem.guild.id,
      servidorNome: mensagem.guild.name,
      canalId: mensagem.channelId,
      canalNome: mensagem.channel.name,
      anexos: [...mensagem.attachments.values()].map((anexo) => ({
        nome: anexo.name,
        url: anexo.url,
        tipo: anexo.contentType || undefined,
      })),
    });
    if (!aviso) return;
    try {
      await salvarAvisoDiscord(db, aviso, canal.estudanteIds);
    } catch (erro) {
      console.error('Não foi possível salvar uma mensagem do Discord no Firestore:', erro);
    }
  });
  cliente.on('error', (erro) => console.error('Erro no bot Discord:', erro));
  void cliente.login(config.token);
  return cliente;
}

function iniciarBotDiscordSeConfigurado(env = process.env) {
  if (!env.DISCORD_BOT_TOKEN) {
    console.log('Integração Discord desativada: DISCORD_BOT_TOKEN não configurado.');
    return null;
  }
  return iniciarBotDiscord(env);
}

module.exports = { iniciarBotDiscord, iniciarBotDiscordSeConfigurado };
