import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { StyleProp, ViewStyle } from 'react-native';

import Button from '../components/Button';
import GoogleButton from '../components/GoogleButton';
import Input from '../components/Input';

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { GoogleSignin, isGoogleSigninSupported } from '../services/googleSignin';

export interface TelaCadastroProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function TelaCadastro(props: TelaCadastroProps) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  function mapearErroFirebase(codigoErro: string): string {
    switch (codigoErro) {
      case 'auth/email-already-in-use':
        return 'Este e-mail já está cadastrado no sistema.';
      case 'auth/invalid-email':
        return 'Formato de e-mail inválido.';
      case 'auth/weak-password':
        return 'A senha escolhida é muito fraca.';
      case 'auth/network-request-failed':
        return 'Falha de rede. Verifique sua conexão com a internet.';
      default:
        return 'Ocorreu um erro ao criar a conta. Tente novamente.';
    }
  }

  async function criarConta() {
    const emailNormalizado = email.trim();

    if (!emailNormalizado || !senha || !confirmarSenha) {
      setErro('Há campos não preenchidos!');
      return;
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado);
    if (!emailValido) {
      setErro('Informe um e-mail válido!');
      return;
    }

    if (senha.length < 8) {
      setErro('A senha deve conter no mínimo 8 caracteres!');
      return;
    }

    if (!/[A-Za-z]/.test(senha) || !/[0-9]/.test(senha)) {
      setErro('A senha deve conter pelo menos 1 letra e 1 número!');
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas digitadas não coincidem!');
      return;
    }

    setErro('');
    setCarregando(true);

    try {
      if (auth) {
        await createUserWithEmailAndPassword(auth, emailNormalizado, senha);
      }

      setSucesso('Conta criada com sucesso! Redirecionando...');

      // Pequena pausa para o discente visualizar a mensagem de sucesso
      setTimeout(() => {
        router.replace('/onboarding');
      }, 1000);
    } catch (error: any) {
      const mensagem = mapearErroFirebase(error?.code ?? '');
      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  async function continuarComGoogle() {
    setErro('');

    if (!isGoogleSigninSupported || !GoogleSignin) {
      Alert.alert(
        'Google Sign-In',
        'O login social com Google depende de binários nativos que não estão no Expo Go padrão. Cadastre-se com e-mail e senha para testar no Expo Go!'
      );
      setErro('Login Google requer Development Build. Use e-mail e senha no Expo Go.');
      return;
    }

    try {
      setCarregando(true);
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

      if (auth) {
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
      }

      setSucesso('Autenticação Google realizada! Redirecionando...');
      setTimeout(() => {
        router.replace('/onboarding');
      }, 1000);
    } catch (error: any) {
      setErro('Não foi possível entrar com o Google.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View testID={props.testID ?? '95:12'} style={[styles.root, props.style]}>
          {/* Header decorativo */}
          <View testID="88:1063" style={styles.header} />

          {/* Título */}
          <Text testID="88:1064" style={styles.fazerCadastro}>
            Fazer cadastro
          </Text>

          {/* Formulário */}
          <View testID="95:6" style={styles.cadastroBox}>
            {/* Mensagem de Erro Formal */}
            {erro !== '' && (
              <View style={styles.erroBox}>
                <Text style={styles.erroTexto}>{erro}</Text>
              </View>
            )}

            {/* Mensagem de Sucesso Formal */}
            {sucesso !== '' && (
              <View style={styles.sucessoBox}>
                <Text style={styles.sucessoTexto}>{sucesso}</Text>
              </View>
            )}

            <View style={styles.field}>
              <Text testID="88:1070" style={styles.label}>
                Email
              </Text>
              <Input
                placeholder="Digite seu email institucional ou pessoal"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!carregando}
                value={email}
                onChangeText={(texto) => {
                  setEmail(texto);
                  setErro('');
                }}
              />
            </View>

            <View style={styles.field}>
              <Text testID="88:1071" style={styles.label}>
                Senha
              </Text>
              <Input
                placeholder="Mínimo 8 caracteres (letras e números)"
                secureTextEntry
                autoCapitalize="none"
                editable={!carregando}
                value={senha}
                onChangeText={(texto) => {
                  setSenha(texto);
                  setErro('');
                }}
              />
            </View>

            <View style={styles.field}>
              <Text testID="88:1073" style={styles.label}>
                Confirmar senha
              </Text>
              <Input
                placeholder="Confirme sua senha"
                secureTextEntry
                autoCapitalize="none"
                editable={!carregando}
                value={confirmarSenha}
                onChangeText={(texto) => {
                  setConfirmarSenha(texto);
                  setErro('');
                }}
              />
            </View>

            <Button
              title={carregando ? 'Criando conta...' : 'Criar conta'}
              onPress={criarConta}
              disabled={carregando || sucesso !== ''}
            />

            {carregando && (
              <ActivityIndicator
                size="small"
                color="#003366"
                style={styles.loadingIndicator}
              />
            )}
          </View>

          {/* Separador */}
          <View testID="95:11" style={styles.frame3}>
            <Text testID="88:1074" style={styles.ou}>
              OU
            </Text>
          </View>

          {/* Google */}
          <View testID="95:7" style={styles.googleContainer}>
            <GoogleButton onPress={continuarComGoogle} />
          </View>

          {/* Login */}
          <View style={styles.loginContainer}>
            <Text testID="88:1065" style={styles.jaTemUmaConta}>
              Já tem uma conta?
            </Text>

            <Pressable
              disabled={carregando}
              onPress={() => {
                router.push('/login');
              }}
            >
              <Text testID="88:1066" style={styles.fazerLogin}>
                Fazer login
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
    backgroundColor: '#FDFFFF',
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
    gap: 18,
    backgroundColor: '#FDFFFF',
  },
  header: {
    width: '100%',
    height: 70,
    flexShrink: 0,
    backgroundColor: '#9AD9EB',
  },
  fazerCadastro: {
    color: '#003366',
    fontSize: 24,
    paddingTop: 16,
    paddingBottom: 8,
    fontWeight: '700',
  },
  cadastroBox: {
    width: '85%',
    maxWidth: 420,
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'column',
    gap: 14,
    backgroundColor: '#E5F4F8',
    borderRadius: 8,
  },
  erroBox: {
    backgroundColor: '#FFEBEE',
    borderColor: '#E53935',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
  },
  erroTexto: {
    color: '#C62828',
    fontSize: 13,
    fontWeight: '600',
  },
  sucessoBox: {
    backgroundColor: '#E8F5E9',
    borderColor: '#43A047',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
  },
  sucessoTexto: {
    color: '#2E7D32',
    fontSize: 13,
    fontWeight: '600',
  },
  field: {
    width: '100%',
    gap: 6,
  },
  label: {
    color: '#2A4B7C',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingIndicator: {
    marginTop: 4,
  },
  frame3: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ou: {
    color: '#41689E',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  googleContainer: {
    width: '85%',
    maxWidth: 420,
  },
  loginContainer: {
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  jaTemUmaConta: {
    color: '#201D2A',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '400',
  },
  fazerLogin: {
    color: '#003366',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default TelaCadastro;