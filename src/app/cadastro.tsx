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

export interface TelaCadastroProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function TelaCadastro(props: TelaCadastroProps) {
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
              />
            </View>

            <Button
              title="Criar conta"
              onPress={() => {}}
            />
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
              onPress={() => {}}
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
});

export default TelaCadastro;