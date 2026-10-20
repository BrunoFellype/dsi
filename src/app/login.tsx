import React, { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import {
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { Botao, Campo, Cartao, Mensagem, Tela, Txt } from '@/components/ui';
import { auth, db } from '@/services/firebase';
import { GoogleSignin, isGoogleSigninSupported } from '@/services/googleSignin';
import { useAstra } from '@/lib/store';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { entrarDemo } = useAstra();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    setErro('');
    setSucesso('');
    if (!email.trim() || !senha) return setErro('Preencha seu e-mail e sua senha.');
    if (!EMAIL_VALIDO.test(email.trim())) return setErro('Informe um e-mail válido.');

    setCarregando(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), senha);
      router.replace('/inicio');
    } catch (error: any) {
      const code = error?.code;
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setErro('E-mail ou senha incorretos.');
      } else if (code === 'auth/too-many-requests') {
        setErro('Muitas tentativas. Tente novamente mais tarde.');
      } else {
        setErro('Não foi possível entrar. Verifique seus dados.');
      }
    } finally {
      setCarregando(false);
    }
  }

  async function continuarComGoogle() {
    setErro('');
    setSucesso('');
    if (!isGoogleSigninSupported || !GoogleSignin) {
      return setErro('O login com Google só funciona no app instalado. Use e-mail e senha.');
    }

    setCarregando(true);
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signOut().catch(() => {});
      const resposta = await GoogleSignin.signIn();
      if (resposta.type !== 'success') return;

      const { idToken } = await GoogleSignin.getTokens();
      if (!idToken) return setErro('Não foi possível obter a credencial do Google.');

      const credencial = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
      const uid = credencial.user.uid;
      const [estudante, perfil] = await Promise.all([
        getDoc(doc(db, 'estudantes', uid)),
        getDoc(doc(db, 'perfisAprendizagem', uid)),
      ]);
      router.replace(estudante.exists() && perfil.exists() ? '/inicio' : '/onboarding');
    } catch (error: any) {
      setErro(
        error?.code === 'auth/network-request-failed'
          ? 'Erro de conexão. Verifique sua internet.'
          : 'Não foi possível entrar com o Google.'
      );
    } finally {
      setCarregando(false);
    }
  }

  async function esqueciSenha() {
    setErro('');
    setSucesso('');
    if (!EMAIL_VALIDO.test(email.trim())) return setErro('Digite seu e-mail acima para receber o link de recuperação.');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSucesso('Enviamos um e-mail de recuperação.');
    } catch {
      setErro('Não foi possível enviar o e-mail de recuperação.');
    }
  }

  return (
    <Tela style={{ paddingTop: 48, gap: 28 }}>
      <View style={{ alignItems: 'center', gap: 12 }}>
        <Image
          source={require('../../assets/images/straremovebgpreview2.png')}
          style={{ width: 150, height: 70 }}
          resizeMode="contain"
          accessibilityLabel="ASTRA"
        />
        <Txt v="corpo" cor="textSecondary" style={{ textAlign: 'center' }}>
          Sua rotina acadêmica em um só lugar.
        </Txt>
      </View>

      <Cartao style={{ gap: 16 }}>
        <Campo
          rotulo="E-mail"
          value={email}
          onChangeText={(v) => { setEmail(v); setErro(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!carregando}
        />
        <Campo
          rotulo="Senha"
          value={senha}
          onChangeText={(v) => { setSenha(v); setErro(''); }}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          editable={!carregando}
          onSubmitEditing={entrar}
        />
        {erro ? <Mensagem tom="erro" texto={erro} /> : null}
        {sucesso ? <Mensagem tom="sucesso" texto={sucesso} /> : null}
        <Botao titulo="Entrar" onPress={entrar} carregando={carregando} />
        <Pressable onPress={esqueciSenha} hitSlop={8} accessibilityRole="button" style={{ alignSelf: 'center' }}>
          <Txt v="legenda" cor="primary" style={{ fontWeight: '700' }}>
            Esqueci minha senha
          </Txt>
        </Pressable>
      </Cartao>

      <View style={{ gap: 12 }}>
        <Botao titulo="Continuar com Google" icone="logo-google" variante="secundario" onPress={continuarComGoogle} desabilitado={carregando} />
        <Botao titulo="Criar uma conta" variante="secundario" onPress={() => router.push('/cadastro')} />
        <Botao
          titulo="Explorar com dados de exemplo"
          variante="texto"
          onPress={() => {
            entrarDemo();
            router.replace('/inicio');
          }}
        />
      </View>
    </Tela>
  );
}
