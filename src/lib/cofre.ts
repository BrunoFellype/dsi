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

/** Chave no cofre seguro (SecureStore) onde o token OAuth do Google Classroom é armazenado. */
const CHAVE_CLASSROOM_TOKEN = 'astra_classroom_oauth_token_v1';

/** Dados da sessão do Google Classroom persistidos no cofre seguro. */
export interface SessaoClassroomSalva {
  accessToken: string;
  email: string;
  salvoEm: number;
}

/** Salva o token de acesso OAuth do Google Classroom de forma criptografada no aparelho. */
export async function salvarTokenClassroom(accessToken: string, email: string): Promise<void> {
  const payload: SessaoClassroomSalva = {
    accessToken,
    email,
    salvoEm: Date.now(),
  };
  await SecureStore.setItemAsync(CHAVE_CLASSROOM_TOKEN, JSON.stringify(payload));
}

/**
 * Lê o token de acesso do Google Classroom salvo no cofre.
 * Descarta tokens gravados há mais de 55 minutos para evitar requisições com credenciais expiradas.
 */
export async function lerTokenClassroom(): Promise<SessaoClassroomSalva | null> {
  try {
    const raw = await SecureStore.getItemAsync(CHAVE_CLASSROOM_TOKEN);
    if (!raw) return null;
    const dados = JSON.parse(raw) as SessaoClassroomSalva;
    if (Date.now() - dados.salvoEm > 55 * 60 * 1000) {
      return null;
    }
    return dados;
  } catch {
    return null;
  }
}

/** Remove o token do Google Classroom do cofre seguro ao desconectar a conta. */
export async function apagarTokenClassroom(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(CHAVE_CLASSROOM_TOKEN);
  } catch {
    // Chave não existia
  }
}