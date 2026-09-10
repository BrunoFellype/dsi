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

export interface TelaLoginProps {
  /** Used to override the default root style. */
  style?: StyleProp<ViewStyle>;

  /** Used to locate this view in end-to-end tests. */
  testID?: string;
}

export function TelaLogin(props: TelaLoginProps) {
  return (
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
        {`Assistente de autorregulação de aprendizagem e
produtividade acadêmica`}
      </Text>

      <Text
        testID="88:1048"
        style={styles.login}
      >
        LOGIN
      </Text>

      <View
        testID="95:4"
        style={styles.loginBox}
      >
        <View
          testID="88:1050"
          style={styles.rectangle8}
        />

        <View
          testID="88:1052"
          style={styles.rectangle19}
        />

        <View
          testID="88:1053"
          style={styles.rectangle20}
        />

        <Text
          testID="88:1056"
          style={styles.senha}
        >
          Senha
        </Text>

        <Text
          testID="88:1054"
          style={styles.email}
        >
          Email
        </Text>
      </View>

      <Text
        testID="88:1049"
        style={styles.ou}
      >
        OU
      </Text>

      <View
        testID="95:3"
        style={styles.loginGoogle}
      >
        <Image
          source={require('../../assets/images/image3.png')}
          style={styles.googleIcon}
        />

        <Text
          testID="88:1055"
          style={styles.continueComOGoogle}
        >
          Continue com o Google
        </Text>
      </View>

      <Text
        testID="88:1046"
        style={styles.aindaNaoTemCadastro}
      >
        Ainda não tem cadastro?
      </Text>

      <Text
        testID="88:1047"
        style={styles.fazerCadastro}
      >
        Fazer cadastro
      </Text>

      <View
        testID="95:2"
        style={styles.loginButton}
      >
        <View
          testID="88:1060"
          style={styles.rectangle22}
        />

        <Text
          testID="88:1061"
          style={styles.login2}
        >
          LOGIN
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 402,
    height: 874,
    paddingBottom: 70,
    flexDirection: 'column',
    alignItems: 'center',
    rowGap: 18,
    columnGap: 18,
    backgroundColor: 'rgba(253, 255, 255, 1)',
  },

  header: {
    width: 402,
    height: 70,
    flexShrink: 0,
    backgroundColor: 'rgba(154, 217, 235, 1)',
  },

  bemVindoAAoAstra: {
    color: 'rgba(0, 0, 0, 1)',
    fontSize: 25,
    fontWeight: '500',
  },

  assistenteDeAutorregulacaoDeAprendizagemEProdutividadeAcademica: {
    color: 'rgba(0, 0, 0, 1)',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '400',
  },

  login: {
    color: 'rgba(0, 0, 0, 1)',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '500',
  },

  rectangle8: {
    width: 325,
    height: 314,
    borderRadius: 10,
    backgroundColor: 'rgba(229, 244, 248, 1)',
  },

  rectangle19: {
    width: 279,
    height: 52,
    position: 'absolute',
    left: 22.5,
    top: 67,
    backgroundColor: 'rgba(217, 217, 217, 1)',
  },

  rectangle20: {
    width: 279,
    height: 52,
    position: 'absolute',
    left: 22.5,
    bottom: 87,
    backgroundColor: 'rgba(217, 217, 217, 1)',
  },

  senha: {
    position: 'absolute',
    left: 23.5,
    bottom: 139,
    color: 'rgba(0, 0, 0, 1)',
    fontSize: 15,
    fontWeight: '500',
  },

  email: {
    position: 'absolute',
    left: 23.5,
    top: 45,
    color: 'rgba(0, 0, 0, 1)',
    fontSize: 15,
    fontWeight: '500',
  },

  loginBox: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    rowGap: 10,
    columnGap: 10,
  },

  ou: {
    color: 'rgba(0, 0, 0, 1)',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '400',
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

  aindaNaoTemCadastro: {
    color: 'rgba(0, 0, 0, 1)',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '400',
  },

  fazerCadastro: {
    color: 'rgba(0, 89, 255, 1)',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '400',
    textDecorationLine: 'underline',
  },

  rectangle22: {
    width: 153,
    height: 41,
    borderRadius: 10,
    backgroundColor: 'rgba(154, 217, 235, 1)',
  },

  login2: {
    position: 'absolute',
    right: 52,
    top: 10,
    color: 'rgba(0, 0, 0, 1)',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500',
  },

  loginButton: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    rowGap: 10,
    columnGap: 10,
    position: 'absolute',
    left: 124,
    bottom: 331,
  },
});

export default TelaLogin;