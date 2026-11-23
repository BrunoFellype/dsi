/**
 * Captura e envio de imagens (câmera ou galeria) para anexar aos avisos.
 * Com a chave do ImgBB configurada, a foto vai para a nuvem e o link funciona em
 * qualquer aparelho; sem a chave, fica o endereço local da foto (só neste aparelho).
 */
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type OrigemImagem = 'camera' | 'galeria';

export interface ImagemEscolhida {
  url: string;
  /** false quando a imagem ficou só no aparelho (sem chave do ImgBB ou upload falhou). */
  naNuvem: boolean;
}

export class PermissaoNegada extends Error {}

/** Envia uma imagem em base64 para o ImgBB e devolve a URL pública. */
export async function enviarImagemImgBB(base64: string, chave = process.env.EXPO_PUBLIC_IMGBB_KEY): Promise<string> {
  if (!chave) throw new Error('Chave da API do ImgBB não configurada nas variáveis de ambiente.');
  const formData = new FormData();
  formData.append('key', chave);
  formData.append('image', base64);
  const resposta = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData });
  const json = await resposta.json();
  if (!json?.success || !json?.data?.url) throw new Error('Falha no upload para o serviço externo.');
  return json.data.url as string;
}

/**
 * Abre a câmera ou a galeria e devolve a imagem escolhida (já enviada, quando possível).
 * Retorna null se o estudante cancelar.
 */
export async function escolherImagem(origem: OrigemImagem): Promise<ImagemEscolhida | null> {
  const usarCamera = origem === 'camera' && Platform.OS !== 'web';
  const permissao = usarCamera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissao.granted) {
    throw new PermissaoNegada(
      usarCamera ? 'Precisamos de permissão para usar a câmera.' : 'Precisamos de permissão para acessar sua galeria de fotos.'
    );
  }

  const opcoes: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6, base64: true };
  const resultado = usarCamera
    ? await ImagePicker.launchCameraAsync(opcoes)
    : await ImagePicker.launchImageLibraryAsync(opcoes);
  if (resultado.canceled || !resultado.assets?.[0]) return null;

  const foto = resultado.assets[0];
  if (foto.base64 && process.env.EXPO_PUBLIC_IMGBB_KEY) {
    try {
      return { url: await enviarImagemImgBB(foto.base64), naNuvem: true };
    } catch {
      // Sem internet ou serviço fora do ar: guarda a foto local para não perder o registro
    }
  }
  // No navegador o endereço blob: some ao recarregar; guarda a própria imagem (data URI)
  if (Platform.OS === 'web' && foto.base64) {
    return { url: `data:${foto.mimeType ?? 'image/jpeg'};base64,${foto.base64}`, naNuvem: false };
  }
  return { url: foto.uri, naNuvem: false };
}
