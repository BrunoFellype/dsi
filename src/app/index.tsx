import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { useAstra } from '@/lib/store';

/** Porta de entrada: manda para o app ou para o login, conforme a sessão. */
export default function Index() {
  const { sessao } = useAstra();
  const t = useTheme();

  if (sessao === 'carregando') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.background }}>
        <ActivityIndicator color={t.primary} />
      </View>
    );
  }
  return <Redirect href={sessao === 'anonimo' ? '/login' : '/inicio'} />;
}
