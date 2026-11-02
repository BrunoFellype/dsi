function lerConfiguracaoDiscord(env = process.env) {
  const token = String(env.DISCORD_BOT_TOKEN || '').trim();
  const aiApiKey = String(env.AI_API_KEY || '').trim();
  const bruto = String(env.DISCORD_ALLOWED_CHANNELS || '').trim();
  if (!token) throw new Error('DISCORD_BOT_TOKEN não configurado.');
  if (!aiApiKey) throw new Error('AI_API_KEY não configurada.');
  if (!bruto) throw new Error('DISCORD_ALLOWED_CHANNELS não configurado.');

  let canais;
  try {
    canais = JSON.parse(bruto);
  } catch {
    throw new Error('DISCORD_ALLOWED_CHANNELS deve ser um JSON válido.');
  }
  if (!Array.isArray(canais) || canais.length === 0) {
    throw new Error('DISCORD_ALLOWED_CHANNELS deve conter ao menos um canal.');
  }

  const permitidos = canais.map((canal) => {
    if (!canal || typeof canal.guildId !== 'string' || typeof canal.channelId !== 'string') {
      throw new Error('Cada canal autorizado precisa de guildId e channelId.');
    }
    if (!Array.isArray(canal.estudanteIds) || canal.estudanteIds.some((id) => typeof id !== 'string' || !id)) {
      throw new Error('Cada canal autorizado precisa de estudanteIds não vazios.');
    }
    return {
      guildId: canal.guildId,
      channelId: canal.channelId,
      estudanteIds: [...new Set(canal.estudanteIds)],
    };
  });
  return { token, aiApiKey, canais: permitidos };
}

function canalAutorizado(config, guildId, channelId) {
  return config.canais.find((canal) => canal.guildId === guildId && canal.channelId === channelId);
}

module.exports = { lerConfiguracaoDiscord, canalAutorizado };
