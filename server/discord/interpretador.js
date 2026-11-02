const DIAS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

function normalizar(texto) {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function extrairPrazo(texto, base = new Date()) {
  const normalizado = normalizar(texto);
  let data;
  const dataNumerica = normalizado.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (dataNumerica) {
    const ano = Number(dataNumerica[3] || base.getFullYear()) + (Number(dataNumerica[3]) < 100 ? 2000 : 0);
    data = new Date(ano, Number(dataNumerica[2]) - 1, Number(dataNumerica[1]));
    if (data.getMonth() !== Number(dataNumerica[2]) - 1) return null;
  } else if (/\bamanha\b/.test(normalizado)) {
    data = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1);
  } else if (/\bhoje\b/.test(normalizado)) {
    data = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  } else {
    const dia = DIAS.findIndex((nome) => new RegExp(`\\b${nome}\\b`).test(normalizado));
    if (dia < 0) return null;
    const distancia = (dia - base.getDay() + 7) % 7 || 7;
    data = new Date(base.getFullYear(), base.getMonth(), base.getDate() + distancia);
  }
  const hora = normalizado.match(/\b(\d{1,2})(?::|h)(\d{2})?\b/);
  const temHora = Boolean(hora && Number(hora[1]) < 24);
  data.setHours(temHora ? Number(hora[1]) : 23, temHora ? Number(hora[2] || 0) : 59, 0, 0);
  return { data, temHora };
}

function tipoDoTexto(texto) {
  const t = normalizar(texto);
  if (/\b(prova|avaliacao|exame|entrega|entregar|prazo|lista|trabalho|atividade|questionario|seminario|p1|p2|1va|2va)\b/.test(t)) return 'prazo';
  if (/\b(slide|slides|apostila|material|pdf|link|video|aula gravada|resumo|gabarito)\b/.test(t)) return 'material';
  return 'comunicado';
}

function hash(texto) {
  let resultado = 0;
  for (let i = 0; i < texto.length; i += 1) resultado = Math.imul(31, resultado) + texto.charCodeAt(i) | 0;
  return Math.abs(resultado);
}

function interpretarMensagemDiscord(mensagem) {
  const texto = String(mensagem.texto || '').trim();
  if (texto.length < 8) return null;
  const recebidoEm = new Date(mensagem.recebidoEm || Date.now());
  const tipo = tipoDoTexto(texto);
  const prazo = tipo === 'prazo' ? extrairPrazo(texto, recebidoEm) : null;
  return {
    id: `discord-${mensagem.id}-${hash(texto)}`,
    fonte: 'discord',
    texto,
    recebidoEm: recebidoEm.toISOString(),
    tipo,
    prazo: prazo ? prazo.data.toISOString() : undefined,
    prazoSemHora: prazo && !prazo.temHora ? true : undefined,
    autor: mensagem.autor || undefined,
    discord: {
      mensagemId: mensagem.id,
      servidorId: mensagem.servidorId,
      servidorNome: mensagem.servidorNome,
      canalId: mensagem.canalId,
      canalNome: mensagem.canalNome,
      anexos: mensagem.anexos || [],
    },
  };
}

module.exports = { interpretarMensagemDiscord, extrairPrazo, tipoDoTexto };
