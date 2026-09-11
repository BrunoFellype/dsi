import {
  Pressable,
  Text,
  StyleSheet,
  Image
} from 'react-native';

interface GoogleButtonProps {
  onPress?: () => void;
}

export default function GoogleButton({
  onPress,
}: GoogleButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
    >
      <Image
        source={require("../../assets/images/image3.png")}
        style={styles.googleLogo}
      />

      <Text style={styles.text}>
        Continuar com Google
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    backgroundColor: '#FFFFFF',

    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },

  googleLogo: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },

  text: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },

  pressed: {
    opacity: 0.7,
  },
});