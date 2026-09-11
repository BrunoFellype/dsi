import {
  Pressable,
  Text,
  StyleSheet,
  type PressableProps,
} from 'react-native';

interface ButtonProps extends PressableProps {
  title: string;
}

export default function Button({
  title,
  style,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      {...props}
      style={(state) => [
        styles.button,
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    backgroundColor: '#9AD9EB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  pressed: {
    opacity: 0.7,
  },

  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});