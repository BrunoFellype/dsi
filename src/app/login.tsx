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

import Button from '../components/Button';
import Input from '../components/Input';
import GoogleButton from '../components/GoogleButton';

export interface TelaLoginProps {
  /** Used to override the default root style. */
  style?: StyleProp<ViewStyle>;

  /** Used to locate this view in end-to-end tests. */
  testID?: string;
}

export function TelaLogin(props: TelaLoginProps) {
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
            <View
              testID="88:1043"
              style={styles.header}
            />

            <Text
              testID="88:1044"
              style={styles.bemVindoAAoAstra}
            >
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

            <Text
              testID="88:1048"
              style={styles.login}
            >
              LOGIN
            </Text>

            <View style={styles.loginBox}>
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
                />
              </View>

              <Pressable
                onPress={() => {}}
              >
                <Text
                  testID="88:1066"
                  style={styles.esqueciSenha}
                >
                  Esqueci minha senha
                </Text>
              </Pressable>

              <Button
                title="Entrar"
              />
            </View>

            <View style={styles.googleContainer}>
              <Text style={styles.ou}>OU</Text>

              <GoogleButton/>
            </View>

            <View style={styles.cadastroContainer}>
              <Text
                testID="88:1065"
                style={styles.naoTemCadastro}
              >
                Ainda não tem cadastro?
              </Text>
  
              <Pressable
                onPress={() => {router.replace('/cadastro')}}
              >
                <Text
                  testID="88:1066"
                  style={styles.fazerCadastro}
                >
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
    gap: 18,
    backgroundColor: '#FDFFFF',
  },

  header: {
    width: '100%',
    height: 70,
    backgroundColor: '#9AD9EB',
  },

  bemVindoAAoAstra: {
    color: 'rgba(0, 0, 0, 1)',
    fontSize: 25,
    fontWeight: '500',
    marginTop: 20,
  },

  assistenteDeAutorregulacaoDeAprendizagemEProdutividadeAcademica: {
    color: 'rgba(0, 0, 0, 1)',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '400',
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

  login: {
    color: 'rgba(0, 0, 0, 1)',
    textAlign: 'center',
    fontSize: 20,
    padding: 20,
    fontWeight: '500',
  },

  esqueciSenha: {
    fontSize: 15,
    paddingTop: 5,
    paddingBottom: 5,
    color: '#0059FF',
    fontWeight: '400',
    textDecorationLine: 'underline',
  },

  loginBox: {
    width: '80%',
    padding: 20,
    gap: 16,
    borderRadius: 10,
    backgroundColor: '#E5F4F8',
  },

  ou: {
    color: 'rgba(0, 0, 0, 1)',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '400',
  },

  googleContainer: {
    width: '80%',
    gap: 20,
    marginTop: 20,
  },


  cadastroContainer: {
    alignItems: 'center',
    gap: 4,
  },

  naoTemCadastro: {
    color: '#000000',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '400',
  },

  fazerCadastro: {
    color: '#0059FF',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '400',
    textDecorationLine: 'underline',
  },

});

export default TelaLogin;