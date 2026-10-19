const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const config = getDefaultConfig(__dirname);

const vazio = path.join(__dirname, 'src/sigaa-shims/vazio.js');
const registro = path.join(__dirname, 'src/sigaa-shims/registro.js');
const url = path.join(__dirname, 'src/sigaa-shims/url.js');

// Módulos do Node usados pela sigaa-api (vendor/sigaa-api) que não existem no celular.
// Só valem para arquivos da própria biblioteca; o resto do app resolve normalmente.
const SUBSTITUTOS = {
  'source-map-support/register': registro,
  fs: vazio,
  zlib: vazio,
  http: vazio,
  https: vazio,
  stream: vazio,
  'iconv-lite': vazio,
  'formdata-node': vazio,
  // O pacote `url` do npm não tem `URL`; o shim traz um URL que resolve endereços relativos
  url,
};

const pastaDaApi = path.join(__dirname, 'vendor', 'sigaa-api') + path.sep;

config.resolver.resolveRequest = (contexto, nome, plataforma) => {
  const vindoDaApi = contexto.originModulePath.startsWith(pastaDaApi);
  if (vindoDaApi && plataforma !== 'web' && SUBSTITUTOS[nome]) {
    return { type: 'sourceFile', filePath: SUBSTITUTOS[nome] };
  }
  return contexto.resolveRequest(contexto, nome, plataforma);
};

module.exports = config;
