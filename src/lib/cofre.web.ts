/** No navegador não há cofre seguro: a senha nunca é guardada. */
export const cofreDisponivel = false;

export interface Credenciais {
  usuario: string;
  senha: string;
}

export async function salvarCredenciais(_uid: string, _c: Credenciais): Promise<void> {}
export async function lerCredenciais(_uid: string): Promise<Credenciais | null> {
  return null;
}
export async function apagarCredenciais(_uid: string): Promise<void> {}

/** Chave usada no sessionStorage para armazenar a sessão OAuth do Google Classroom no navegador. */
const CHAVE_CLASSROOM_TOKEN = 'astra_classroom_oauth_token_v1';

/** Dados da sessão do Google Classroom armazenados durante a navegação web. */
export interface SessaoClassroomSalva {
  accessToken: string;
  email: string;
  salvoEm: number;
}

/** Salva o token de acesso OAuth do Google Classroom no sessionStorage da aba do navegador. */
export async function salvarTokenClassroom(accessToken: string, email: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const payload: SessaoClassroomSalva = {
    accessToken,
    email,
    salvoEm: Date.now(),
  };
  window.sessionStorage.setItem(CHAVE_CLASSROOM_TOKEN, JSON.stringify(payload));
}

/**
 * Lê o token de acesso do Google Classroom salvo no sessionStorage.
 * Descarta tokens gravados há mais de 55 minutos para evitar requisições com credenciais expiradas.
 */
export async function lerTokenClassroom(): Promise<SessaoClassroomSalva | null> {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(CHAVE_CLASSROOM_TOKEN);
    if (!raw) return null;
    const dados = JSON.parse(raw) as SessaoClassroomSalva;
    if (Date.now() - dados.salvoEm > 55 * 60 * 1000) {
      window.sessionStorage.removeItem(CHAVE_CLASSROOM_TOKEN);
      return null;
    }
    return dados;
  } catch {
    return null;
  }
}

/** Remove o token do Google Classroom do sessionStorage ao desconectar a conta. */
export async function apagarTokenClassroom(): Promise<void> {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(CHAVE_CLASSROOM_TOKEN);
}