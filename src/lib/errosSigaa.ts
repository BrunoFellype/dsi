/** Traduz os erros técnicos da leitura do SIGAA para mensagens que o estudante entende. */

export function mensagemDoErro(erro: unknown): string {
  if (erro instanceof Error) return erro.message || erro.name;
  return String(erro ?? 'erro desconhecido');
}

/** Usuário ou senha errados (a biblioteca lança "SIGAA: Invalid credentials."). */
export function ehErroDeCredencialSigaa(mensagem: string): boolean {
  return /invalid credentials|usu[aá]rio e\/ou senha|senha inv[aá]lida/i.test(mensagem);
}

/** Escolhe a mensagem amigável a partir dos erros de cada tentativa. */
export function explicarErroSigaa(mensagens: string[]): string {
  const todas = mensagens.join(' | ');
  if (/v[ií]nculo/i.test(todas)) {
    return 'Sua conta do SIGAA não tem vínculo de aluno. Confira se entrou com o usuário de discente.';
  }
  if (/invalid response after login|unexpected|inesperad/i.test(todas)) {
    return 'O SIGAA mostrou uma tela inesperada depois do login. Entre uma vez pelo site do SIGAA (pode haver um aviso ou termo para aceitar) e tente de novo.';
  }
  if (/session expired|expirad/i.test(todas)) {
    return 'O SIGAA encerrou a sessão no meio da leitura. Tente de novo; se continuar, entre uma vez pelo site do SIGAA.';
  }
  if (/tempo esgotado|timeout|abort/i.test(todas)) {
    return 'O SIGAA demorou demais para responder. Tente de novo em alguns minutos.';
  }
  if (/network|failed to fetch|unable to resolve|enotfound|econn|internet|ssl|certificate/i.test(todas)) {
    return 'Não consegui conectar ao SIGAA. Confira a internet do celular e tente de novo.';
  }
  return 'Não foi possível ler o SIGAA agora. Tente novamente mais tarde.';
}

/** Junta a mensagem amigável com o detalhe técnico (curto), para facilitar o suporte. */
export function mensagemCompletaSigaa(mensagens: string[]): string {
  const detalhe = mensagens.join(' | ').slice(0, 240);
  return detalhe ? `${explicarErroSigaa(mensagens)}\nDetalhe: ${detalhe}` : explicarErroSigaa(mensagens);
}
