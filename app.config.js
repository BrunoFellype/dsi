const fs = require('fs');
const path = require('path');

/**
 * Lê o app.json e só aponta para o google-services.json se o arquivo existir neste computador
 * (ele não vai para o Git). Sem o arquivo, o Expo Go e o servidor de desenvolvimento funcionam
 * normalmente; o arquivo só é necessário para gerar o build com login do Google.
 */
module.exports = ({ config }) => {
  const android = { ...config.android };
  if (!fs.existsSync(path.join(__dirname, 'google-services.json'))) {
    delete android.googleServicesFile;
  }
  return { ...config, android };
};
