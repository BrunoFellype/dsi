/**
 * Cofre seguro do celular (Keychain no iOS, Keystore no Android) para a senha do SIGAA.
 * Só é usado se o estudante ligar "Lembrar neste aparelho".
 */
import * as SecureStore from 'expo-secure-store';

export const cofreDisponivel = true;

export interface Credenciais {
  usuario: string;
  senha: string;
}

const chave = (uid: string) => `astra.sigaa.${uid.replace(/[^A-Za-z0-9._-]/g, '_')}`;

export async function salvarCredenciais(uid: string, c: Credenciais): Promise<void> {
  await SecureStore.setItemAsync(chave(uid), JSON.stringify(c));
}

export async function lerCredenciais(uid: string): Promise<Credenciais | null> {
  try {
    const bruto = await SecureStore.getItemAsync(chave(uid));
    if (!bruto) return null;
    const c = JSON.parse(bruto);
    return typeof c.usuario === 'string' && typeof c.senha === 'string' ? c : null;
  } catch {
    return null;
  }
}

export async function apagarCredenciais(uid: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(chave(uid));
  } catch {
    // já não existia
  }
}
