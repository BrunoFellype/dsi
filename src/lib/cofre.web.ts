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
