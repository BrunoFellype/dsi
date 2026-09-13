import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import type {
  ViewStyle,
  StyleProp,
} from 'react-native';

import Input from '../components/Input';
import Button from '../components/Button';
import GoogleButton from '../components/GoogleButton';


import { useState } from "react";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../services/firebase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
export interface TelaCadastroProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

GoogleSignin.configure({
  webClientId: '543038942284-pqilv6jii90jle3h2s56d22sccon9qc8.apps.googleusercontent.com'});

export function TelaCadastro(props: TelaCadastroProps) {
  const[email, setEmail] = useState("");
  const[senha, setSenha] = useState("");
  const[confirmarSenha, setConfirmarSenha] = useState("");

  const[erro, setErro] = useState("");

  async function criarConta() {
    if (!email || !senha || !confirmarSenha){
      setErro("Há campos não preenchidos!");
      return;
    }
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValido) {
      setErro("Informe um email válido!");
      return;
    }
    if (senha.length < 8) {
      setErro("A senha deve conter um mínimo de 8 caracteres!");
      return;
    }

    if (!/[A-Za-z]/.test(senha) || !/[0-9]/.test(senha)) {
      setErro("A senha deve conter pelo menos 1 letra e 1 número!");
      return;
    }

    if (senha != confirmarSenha) {
      setErro("Senhas diferentes!");
      return;
    }

    try {
      const user = await createUserWithEmailAndPassword(auth, email, senha);
      router.replace('/telainicial');

    } catch(error) {
      setErro("Email já cadastrado!");
    }
  }

  async function continuarComGoogle(){
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      
      if (response.type != 'success') {
        return;
      }

      const { idToken } = await GoogleSignin.getTokens();

      if (!idToken) {
        setErro("Não foi possível obter a credencial do Google!");
        return;
      }

      const credential = await GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);

      router.replace('/telainicial');
    }catch(error: any){
      setErro('Não foi possível entrar com o Google');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View
          testID={props.testID ?? '95:12'}
          style={[styles.root, props.style]}
        >
          {/* Header */}
          <View
            testID="88:1063"
            style={styles.header}
          />

          {/* Título */}
          <Text
            testID="88:1064"
            style={styles.fazerCadastro}
          >
            Fazer cadastro
          </Text>

          {/* Formulário */}
          <View
            testID="95:6"
            style={styles.cadastroBox}
          >
            <View style={styles.field}>
              <Text
                testID="88:1070"
                style={styles.label}
              >
                Email
              </Text>

              <Input
                placeholder="Digite seu email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(texto) => {setEmail(texto); setErro("");}}
              />
  
            </View>

            <View style={styles.field}>
              <Text
                testID="88:1071"
                style={styles.label}
              >
                Senha
              </Text>

              <Input
                placeholder="Digite sua senha"
                secureTextEntry
                autoCapitalize = "none"
                value={senha}
                onChangeText={(texto) => {setSenha(texto); setErro("")}}
              />
            </View>

            <View style={styles.field}>
              <Text
                testID="88:1073"
                style={styles.label}
              >
                Confirmar senha
              </Text>

              <Input
                placeholder="Confirme sua senha"
                secureTextEntry
                autoCapitalize = "none"
                value={confirmarSenha}
                onChangeText={(texto) => {setConfirmarSenha(texto); setErro("")}}
              />
            </View>

            <Button
              title="Criar conta"
              onPress={() => criarConta()}
            />
            {erro != "" &&(
                <Text style={styles.errorText}>
                  {erro}
                </Text>
              )}
          </View>

          {/* Separador */}
          <View
            testID="95:11"
            style={styles.frame3}
          >
            <Text
              testID="88:1074"
              style={styles.ou}
            >
              OU
            </Text>
          </View>

          {/* Google */}
          <View
            testID="95:7"
            style={styles.googleContainer}
          >
            <GoogleButton
              onPress={() => {continuarComGoogle()}}
            />
          </View>

          {/* Login */}
          <View style={styles.loginContainer}>
            <Text
              testID="88:1065"
              style={styles.jaTemUmaConta}
            >
              Já tem uma conta?
            </Text>

            <Pressable
              onPress={() => {router.push('/login')}}
            >
              <Text
                testID="88:1066"
                style={styles.fazerLogin}
              >
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
    color: '#000000',
    fontSize: 25,
    padding: 20,
    fontWeight: '500',
  },

  cadastroBox: {
    width: '80%',
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'column',
    gap: 16,
    backgroundColor: '#E5F4F8',
    borderRadius: 4,
  },

  field: {
    width: '100%',
    gap: 8,
  },

  label: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '500',
  },

  frame3: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ou: {
    color: '#000000',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '400',
  },

  googleContainer: {
    width: '80%',
  },

  loginContainer: {
    alignItems: 'center',
    gap: 4,
  },

  jaTemUmaConta: {
    color: '#000000',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '400',
  },

  fazerLogin: {
    color: '#0059FF',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '400',
    textDecorationLine: 'underline',
  },

  errorText: {
    color: '#9e4141',
    fontSize: 18
  },
});

export default TelaCadastro;