import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential, updateProfile } from 'firebase/auth';

import { Botao, Cabecalho, Campo, Cartao, Mensagem, Tela } from '@/components/ui';
import { auth } from '@/services/firebase';
import { GoogleSignin, isGoogleSigninSupported } from '@/services/googleSignin';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mapearErro(codigo: string): string {
  switch (codigo) {
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado.';
    case 'auth/invalid-email':
      return 'Formato de e-mail inválido.';
    case 'auth/weak-password':
      return 'A senha escolhida é muito fraca.';
    case 'auth/network-request-failed':
      return 'Falha de rede. Verifique sua conexão.';
    default:
      return 'Não foi possível criar a conta. Tente novamente.';
  }
}

export default function Cadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function criarConta() {
    if (!nome.trim()) return setErro('Informe seu nome completo.');
    if (!email.trim() || !senha || !confirmar) return setErro('Há campos não preenchidos.');
    if (!EMAIL_VALIDO.test(email.trim())) return setErro('Informe um e-mail válido.');
    if (senha.length < 8) return setErro('A senha deve ter no mínimo 8 caracteres.');
    if (!/[A-Za-z]/.test(senha) || !/[0-9]/.test(senha)) return setErro('A senha precisa de pelo menos 1 letra e 1 número.');
    if (senha !== confirmar) return setErro('As senhas não coincidem.');

    setErro('');
    setCarregando(true);
    try {
      const credencial = await createUserWithEmailAndPassword(auth, email.trim(), senha);
      await updateProfile(credencial.user, { displayName: nome.trim() });
      setSucesso('Conta criada! Redirecionando...');
      setTimeout(() => router.replace('/onboarding'), 800);
    } catch (error: any) {
      setErro(mapearErro(error?.code ?? ''));
    } finally {
      setCarregando(false);
    }
  }

  async function continuarComGoogle() {
    setErro('');
    if (!isGoogleSigninSupported || !GoogleSignin) {
      return setErro('O login com Google só funciona no app instalado. Use e-mail e senha.');
    }
    setCarregando(true);
    try {
      await GoogleSignin.hasPlayServices();
      const resposta = await GoogleSignin.signIn();
      if (resposta.type !== 'success') return;
      const { idToken } = await GoogleSignin.getTokens();
      if (!idToken) return setErro('Não foi possível obter a credencial do Google.');
      await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
      router.replace('/onboarding');
    } catch {
      setErro('Não foi possível entrar com o Google.');
    } finally {
      setCarregando(false);
    }
  }

  const limpar = (set: (v: string) => void) => (v: string) => {
    set(v);
    setErro('');
  };

  return (
    <Tela>
      <Cabecalho titulo="Criar conta" subtitulo="Leva menos de um minuto." voltar={() => router.back()} />

      <Cartao style={{ gap: 16 }}>
        <Campo rotulo="Nome completo" value={nome} onChangeText={limpar(setNome)} autoCapitalize="words" editable={!carregando} />
        <Campo
          rotulo="E-mail"
          value={email}
          onChangeText={limpar(setEmail)}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!carregando}
        />
        <Campo
          rotulo="Senha"
          value={senha}
          onChangeText={limpar(setSenha)}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Mínimo 8 caracteres, com letra e número"
          editable={!carregando}
        />
        <Campo
          rotulo="Confirmar senha"
          value={confirmar}
          onChangeText={limpar(setConfirmar)}
          secureTextEntry
          autoCapitalize="none"
          editable={!carregando}
          onSubmitEditing={criarConta}
        />
        {erro ? <Mensagem tom="erro" texto={erro} /> : null}
        {sucesso ? <Mensagem tom="sucesso" texto={sucesso} /> : null}
        <Botao titulo="Criar conta" onPress={criarConta} carregando={carregando} />
      </Cartao>

      <View style={{ gap: 12 }}>
        <Botao titulo="Continuar com Google" icone="logo-google" variante="secundario" onPress={continuarComGoogle} desabilitado={carregando} />
        <Botao titulo="Já tenho conta" variante="texto" onPress={() => router.replace('/login')} />
      </View>
    </Tela>
  );
}
