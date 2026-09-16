import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import type {
  ViewStyle,
  StyleProp,
} from 'react-native';

import Button from '../components/Button';
import Input from '../components/Input';
import GoogleButton from '../components/GoogleButton';

import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { auth as authInstance } from '../services/firebase';
import { GoogleSignin, isGoogleSigninSupported } from '../services/googleSignin';
import { Platform } from 'react-native';

export interface TelaLoginProps {
  /** Used to override the default root style. */
  style?: StyleProp<ViewStyle>;

  /** Used to locate this view in end-to-end tests. */
  testID?: string;
}

export function TelaLogin(props: TelaLoginProps) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    setErro('');
    setSucesso('');

    if (!email.trim() || !senha.trim()) {
      setErro('Preencha seu e-mail e sua senha!');
      return;
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailValido) {
      setErro('Informe um e-mail válido!');
      return;
    }

    setCarregando(true);

    try {
      if (authInstance) {
        const userCredential = await signInWithEmailAndPassword(
          authInstance,
          email.trim(),
          senha
        );
        // Redireciona: pós-login, verifica se já fez onboarding ou segue para a rotina
        router.replace('/telainicial');
      } else {
        // Fallback demonstrativo caso firebase.ts local ainda não esteja configurado
        setTimeout(() => {
          router.replace('/telainicial');
        }, 500);
      }
    } catch (error: any) {
      const code = error?.code;
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setErro('E-mail ou senha incorretos!');
      } else if (code === 'auth/too-many-requests') {
        setErro('Muitas tentativas sem sucesso. Tente novamente mais tarde.');
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
      Alert.alert(
        'Google Sign-In',
        'O login social com Google depende de binários nativos que não estão no Expo Go padrão. Entre com seu e-mail e senha para testar no Expo Go!'
      );
      setErro('Login Google requer Development Build. Use e-mail e senha no Expo Go.');
      return;
    }

    setCarregando(true);

    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (response.type !== 'success') {
        setCarregando(false);
        return;
      }

      const { idToken } = await GoogleSignin.getTokens();

      if (!idToken) {
        setErro('Não foi possível obter a credencial do Google!');
        setCarregando(false);
        return;
      }

      if (authInstance) {
        const credential = await GoogleAuthProvider.credential(idToken);
        await signInWithCredential(authInstance, credential);
      }

      // Primeiro login com Google pode seguir para onboarding
      router.replace('/onboarding');
    } catch (error: any) {
      setErro('Não foi possível autenticar com o Google.');
    } finally {
      setCarregando(false);
    }
  }

  async function esqueciMinhaSenha() {
    setErro('');
    setSucesso('');

    if (!email.trim()) {
      setErro('Digite seu e-mail no campo acima para recuperar a senha.');
      return;
    }

    try {
      if (authInstance) {
        await sendPasswordResetEmail(authInstance, email.trim());
        setSucesso('E-mail de recuperação enviado com sucesso!');
      } else {
        setSucesso('Link de recuperação enviado para o seu e-mail!');
      }
    } catch (error: any) {
      setErro('Erro ao enviar e-mail de recuperação. Verifique o e-mail digitado.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View
          testID={props.testID ?? '88:1169'}
          style={[styles.root, props.style]}
        >
          <View testID="88:1043" style={styles.header} />

          <Text testID="88:1044" style={styles.bemVindoAAoAstra}>
            Bem-vindo(a) ao ASTRA
          </Text>

          <Text
            testID="88:1045"
            style={
              styles.assistenteDeAutorregulacaoDeAprendizagemEProdutividadeAcademica
            }
          >
            {`Assistente de autorregulação de aprendizagem\ne produtividade acadêmica`}
          </Text>

          <Text testID="88:1048" style={styles.login}>
            LOGIN
          </Text>

          {erro ? <Text style={styles.errorText}>{erro}</Text> : null}
          {sucesso ? <Text style={styles.successText}>{sucesso}</Text> : null}

          <View style={styles.loginBox}>
            <View style={styles.field}>
              <Text testID="88:1070" style={styles.label}>
                Email
              </Text>

              <Input
                placeholder="Digite seu email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (erro) setErro('');
                }}
              />
            </View>

            <View style={styles.field}>
              <Text testID="88:1071" style={styles.label}>
                Senha
              </Text>

              <Input
                placeholder="Digite sua senha"
                secureTextEntry
                autoCapitalize="none"
                value={senha}
                onChangeText={(text) => {
                  setSenha(text);
                  if (erro) setErro('');
                }}
              />
            </View>

            <Pressable onPress={esqueciMinhaSenha}>
              <Text testID="88:1066" style={styles.esqueciSenha}>
                Esqueci minha senha
              </Text>
            </Pressable>

            {carregando ? (
              <ActivityIndicator size="small" color="#1D2A44" style={{ marginVertical: 10 }} />
            ) : (
              <Button title="Entrar" onPress={entrar} />
            )}
          </View>

          <View style={styles.googleContainer}>
            <Text style={styles.ou}>OU</Text>

            <GoogleButton onPress={continuarComGoogle} />
          </View>

          <View style={styles.cadastroContainer}>
            <Text testID="88:1065" style={styles.naoTemCadastro}>
              Ainda não tem cadastro?
            </Text>

            <Pressable
              onPress={() => {
                router.replace('/cadastro');
              }}
            >
              <Text testID="88:1066" style={styles.fazerCadastro}>
                Fazer cadastro
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
  },

  root: {
    width: '100%',
    flexGrow: 1,
    paddingBottom: 70,
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FDFFFF',
  },

  header: {
    width: '100%',
    height: 70,
    backgroundColor: '#9AD9EB',
  },

  bemVindoAAoAstra: {
    color: '#000000',
    fontSize: 25,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },

  assistenteDeAutorregulacaoDeAprendizagemEProdutividadeAcademica: {
    color: '#333333',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '400',
    paddingHorizontal: 20,
    lineHeight: 22,
  },

  field: {
    width: '100%',
    gap: 6,
  },

  label: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '500',
  },

  login: {
    color: '#000000',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 6,
  },

  esqueciSenha: {
    fontSize: 14,
    paddingTop: 4,
    paddingBottom: 4,
    color: '#0059FF',
    fontWeight: '400',
    textDecorationLine: 'underline',
  },

  loginBox: {
    width: '85%',
    maxWidth: 380,
    padding: 20,
    gap: 14,
    borderRadius: 12,
    backgroundColor: '#E5F4F8',
    borderWidth: 1,
    borderColor: '#D4EBF3',
  },

  ou: {
    color: '#666666',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },

  googleContainer: {
    width: '85%',
    maxWidth: 380,
    gap: 14,
    marginTop: 10,
  },

  cadastroContainer: {
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },

  naoTemCadastro: {
    color: '#000000',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '400',
  },

  fazerCadastro: {
    color: '#0059FF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  successText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default TelaLogin;