import {
    Image,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import type {
    StyleProp,
    ViewStyle,
} from 'react-native';

export interface TelaIaProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function TelaIa(props: TelaIaProps) {
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
          style={styles.recomendacoesIa}
        >
          Recomendações da IA
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
          style={[styles.navigationIcon, { tintColor: '#6EA1C5'}]}

        />

        <Image
          source={require('../../assets/images/doorbell.png')}
          style={styles.navigationIcon}
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
    width: '100%',
    flex: 1,
    minHeight: 0,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#FDFFFF',
  },

  header: {
    width: '100%',
    height: 64,
    flexShrink: 0,
    backgroundColor: '#9AD9EB',
    borderBottomWidth: 1,
    borderBottomColor: '#87C3D5',
  },

  telaSup: {
    position: 'relative',
    flexDirection: 'row',
    width: '100%',
    height: 96,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexShrink: 0,
  },

  astraImage: {
    width: 90,
    height: 42,
  },

  profileImage: {
    width: 36,
    height: 36,
    marginLeft: 'auto',
  },

  recomendacoesIa: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 8,
    color: '#1D2A44',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },

  frame4: {
    width: '88%',
    maxWidth: 420,
    flex: 1,
    minHeight: 0,
    padding: 10,
    flexDirection: 'column',
    gap: 12,
  },

  frame5: {
    width: '100%',
    flex: 4,
    minHeight: 0,
    backgroundColor: '#E5F4F8',
    borderWidth: 1,
    borderColor: '#C8E0E8',
    borderRadius: 10,
  },

  frame6: {
    width: '100%',
    flex: 3,
    minHeight: 0,
    backgroundColor: '#E5F4F8',
    borderWidth: 1,
    borderColor: '#C8E0E8',
    borderRadius: 10,
  },

  frame7: {
    width: '100%',
    flex: 4,
    minHeight: 0,
    backgroundColor: '#E5F4F8',
    borderWidth: 1,
    borderColor: '#C8E0E8',
    borderRadius: 10,
  },

  spacer: {
    flex: 0,
    width: 100,
  },

  frame10: {
    width: '100%',
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 13,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: '#F4F4FC',
    borderTopWidth: 1,
    borderTopColor: '#E2E6EE',
  },

  navigationIcon: {
    width: 28,
    height: 28,
  },
});

export default TelaIa;