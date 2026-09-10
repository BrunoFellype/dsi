import {
  StyleSheet,
  View,
  Text,
  Image,
} from 'react-native';

import type {
  ViewStyle,
  StyleProp,
} from 'react-native';

export interface TelaCadastroProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function TelaCadastro(props: TelaCadastroProps) {
  return (
    <View
      testID={props.testID ?? '95:12'}
      style={[styles.root, props.style]}
    >
      <View
        testID="88:1063"
        style={styles.header}
      />

      <Text
        testID="88:1064"
        style={styles.fazerCadastro}
      >
        Fazer cadastro
      </Text>

      <View
        testID="95:6"
        style={styles.frame2}
      >
        <Text
          testID="88:1070"
          style={styles.email}
        >
          Email
        </Text>

        <View
          testID="88:1068"
          style={styles.rectangle19}
        />

        <Text
          testID="88:1071"
          style={styles.senha}
        >
          Senha
        </Text>

        <View
          testID="88:1072"
          style={styles.rectangle21}
        />

        <Text
          testID="88:1073"
          style={styles.confirmarSenha}
        >
          Confirmar senha
        </Text>

        <View
          testID="88:1069"
          style={styles.rectangle20}
        />
      </View>

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

      <View
        testID="95:7"
        style={styles.loginGoogle}
      >
        <Image
          source={require('../../assets/images/image3.png')}
          style={styles.googleIcon}
        />

        <Text
          testID="95:9"
          style={styles.continueComOGoogle}
        >
          Continue com o Google
        </Text>
      </View>

      <Text
        testID="88:1065"
        style={styles.jaTemUmaConta}
      >
        Já tem uma conta?
      </Text>

      <Text
        testID="88:1066"
        style={styles.fazerLogin}
      >
        Fazer login
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 402,
    height: 874,
    paddingBottom: 92,
    flexDirection: 'column',
    alignItems: 'center',
    rowGap: 42,
    columnGap: 42,
    backgroundColor: 'rgba(253, 255, 255, 1)',
  },

  header: {
    width: 402,
    height: 70,
    flexShrink: 0,
    backgroundColor: 'rgba(154, 217, 235, 1)',
  },

  fazerCadastro: {
    color: 'rgba(0, 0, 0, 1)',
    fontSize: 25,
    fontWeight: '500',
  },

  email: {
    color: 'rgba(0, 0, 0, 1)',
    fontSize: 15,
    fontWeight: '500',
  },

  rectangle19: {
    width: 285,
    height: 52,
    flexShrink: 0,
    backgroundColor: 'rgba(217, 217, 217, 1)',
  },

  senha: {
    color: 'rgba(0, 0, 0, 1)',
    fontSize: 15,
    fontWeight: '500',
  },

  rectangle21: {
    width: 285,
    height: 52,
    flexShrink: 0,
    backgroundColor: 'rgba(217, 217, 217, 1)',
  },

  confirmarSenha: {
    color: 'rgba(0, 0, 0, 1)',
    fontSize: 15,
    fontWeight: '500',
  },

  rectangle20: {
    width: 285,
    height: 52,
    flexShrink: 0,
    backgroundColor: 'rgba(217, 217, 217, 1)',
  },

  frame2: {
    width: 325,
    height: 300,
    paddingTop: 10,
    paddingLeft: 20,
    paddingBottom: 10,
    paddingRight: 20,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    rowGap: 10,
    columnGap: 10,
    flexShrink: 0,
    backgroundColor: 'rgba(229, 244, 248, 1)',
  },

  ou: {
    color: 'rgba(0, 0, 0, 1)',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '400',
  },

  frame3: {
    flexDirection: 'row',
    alignItems: 'center',
    rowGap: 15,
    columnGap: 15,
  },

  continueComOGoogle: {
    color: 'rgba(0, 0, 0, 1)',
    fontSize: 16,
    fontWeight: '500',
  },

  loginGoogle: {
    flexDirection: 'row',
    width: 300,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    rowGap: 10,
    columnGap: 10,
    flexShrink: 0,
    borderRadius: 20,
    backgroundColor: 'rgba(210, 237, 244, 1)',
  },

  googleIcon: {
    width: 35,
    height: 35,
  },

  jaTemUmaConta: {
    color: 'rgba(0, 0, 0, 1)',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '400',
  },

  fazerLogin: {
    color: 'rgba(0, 89, 255, 1)',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '400',
    textDecorationLine: 'underline',
  },
});

export default TelaCadastro;