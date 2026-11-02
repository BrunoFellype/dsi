const { Client, GatewayIntentBits } = require('discord.js');
const { canalAutorizado, lerConfiguracaoDiscord } = require('./config');
const { criarFirestore, removerAvisoDiscord, salvarAvisoDiscord } = require('./firestore');
const { interpretarMensagemDiscord } = require('./interpretador');

function iniciarBotDiscord(env = process.env) {
  const config = lerConfiguracaoDiscord(env);
  const db = criarFirestore(env);
  const cliente = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  });

  function dadosDaMensagem(mensagem) {
    const servidor = mensagem.guild || cliente.guilds.cache.get(mensagem.guildId);
    if (!servidor) return null;
    const canal = canalAutorizado(config, servidor.id, mensagem.channelId);
    if (!canal) return null;
    return {
      canal,
      entrada: {
        id: mensagem.id,
        texto: mensagem.content || '',
        recebidoEm: mensagem.createdAt.toISOString(),
        autor: mensagem.author?.tag,
        servidorId: servidor.id,
        servidorNome: servidor.name,
        canalId: mensagem.channelId,
        canalNome: mensagem.channel?.name,
        anexos: [...(mensagem.attachments?.values() || [])].map((anexo) => ({
          nome: anexo.name,
          url: anexo.url,
          tipo: anexo.contentType || undefined,
        })),
      },
    };
  }

  async function processarMensagem(mensagem) {
    if (mensagem.author?.bot) return;
    const dados = dadosDaMensagem(mensagem);
    if (!dados) return;
    try {
      const aviso = await interpretarMensagemDiscord(dados.entrada, env);
      if (aviso) await salvarAvisoDiscord(db, aviso, dados.canal.estudanteIds);
    } catch (erro) {
      console.error(`Não foi possível interpretar/salvar a mensagem Discord ${mensagem.id}:`, erro);
    }
  }

  cliente.once('ready', () => {
    console.log(`Bot Discord conectado como ${cliente.user.tag}.`);
  });
  cliente.on('messageCreate', processarMensagem);
  cliente.on('messageUpdate', (_anterior, atual) => void processarMensagem(atual));
  cliente.on('messageDelete', async (mensagem) => {
    const dados = dadosDaMensagem(mensagem);
    if (!dados) return;
    try {
      await removerAvisoDiscord(db, mensagem.id, dados.canal.estudanteIds);
    } catch (erro) {
      console.error(`Não foi possível remover a mensagem Discord ${mensagem.id}:`, erro);
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
