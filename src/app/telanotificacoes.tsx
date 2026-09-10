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

export interface TelaNotificacoesProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function TelaNotificacoes(props: TelaNotificacoesProps) {
  return (
    <View
      testID={props.testID ?? '101:25'}
      style={[styles.root, props.style]}
    >
      {/* Header */}
      <View
        testID="88:1035"
        style={styles.header}
      />

      {/* Parte superior */}
      <View
        testID="98:13"
        style={styles.telaSup}
      >
        <Image
          source={require('../../assets/images/straremovebgpreview2.png')}
          style={styles.astraImage}
        />

        <Image
          source={require('../../assets/images/profile.png')}
          style={styles.profileImage}
        />

        <Text
          testID="88:1041"
          style={styles.notificacoes}
        >
          Notificações
        </Text>
      </View>

      {/*Seção de cards */}
      <View
        testID="98:14"
        style={styles.frame4}
      >
        <View
          testID="99:15"
          style={styles.frame5}
        />

        <View
          testID="99:16"
          style={styles.frame6}
        />

        <View
          testID="100:22"
          style={styles.frame7}
        />
        
        <View
          testID="100:22"
          style={styles.frame8}
        />

        <View
          testID="100:22"
          style={styles.frame9}
        />
      </View>

      {/* Espaço flexível */}
      <View
        testID="101:29"
        style={styles.spacer}
      />

      {/* Barra inferior */}
      <View
        testID="100:24"
        style={styles.frame10}
      >
        <Image
          source={require('../../assets/images/homepage.png')}
          style={styles.navigationIcon}
        />

        <Image
          source={require('../../assets/images/calendar.png')}
          style={styles.navigationIcon}
        />

        <Image
          source={require('../../assets/images/clock.png')}
          style={styles.navigationIcon}
        />

        <Image
          source={require('../../assets/images/doorbell.png')}
          style={[styles.navigationIcon, { tintColor: '#6EA1C5'}]}
        />

        <Image
          source={require('../../assets/images/journal.png')}
          style={styles.navigationIcon}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 402,
    height: 874,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'rgba(253, 255, 255, 1)',
  },

  header: {
    width: 402,
    height: 70,
    backgroundColor: 'rgba(154, 217, 235, 1)',
  },

  telaSup: {
    position: 'relative',
    flexDirection: 'row',
    width: 400,
    height: 115,
    paddingTop: 0,
    paddingLeft: 10,
    paddingRight: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },

  astraImage: {
    width: 133,
    height: 133,
    marginTop: 20,
  },

  profileImage: {
    width: 40,
    height: 40,
    marginLeft: 'auto',
  },

  notificacoes: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    color: 'rgba(0, 0, 0, 1)',
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
  },

  frame4: {
    width: 355,
    paddingTop: 10,
    paddingLeft: 10,
    paddingBottom: 10,
    paddingRight: 10,
    flexDirection: 'column',
    gap: 10,
  },

  frame5: {
    width: 335,
    height: 100,
    backgroundColor: 'rgba(229, 244, 248, 1)',
  },

  frame6: {
    width: 335,
    height: 100,
    backgroundColor: 'rgba(229, 244, 248, 1)',
  },

  frame7: {
    width: 335,
    height: 100,
    backgroundColor: 'rgba(229, 244, 248, 1)',
  },

  frame8: {
    width: 335,
    height: 100,
    backgroundColor: 'rgba(229, 244, 248, 1)',
  },

  frame9: {
    width: 335,
    height: 100,
    backgroundColor: 'rgba(229, 244, 248, 1)',
  },

  spacer: {
    flex: 1,
    width: 100,
  },

  frame10: {
    width: '100%',
    flexDirection: 'row',
    paddingTop: 20,
    paddingLeft: 13,
    paddingBottom: 20,
    paddingRight: 13,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(244, 244, 252, 1)',
  },

  navigationIcon: {
    width: 40,
    height: 40,
  },
});

export default TelaNotificacoes;