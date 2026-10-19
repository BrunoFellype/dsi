/**
 * Lembretes de prazo no celular (notificações locais, sem servidor).
 * A cada mudança nas atividades, os lembretes antigos saem e os novos são agendados.
 */
import { Platform } from 'react-native';
import type * as NotificacoesTipos from 'expo-notifications';

import type { Lembrete } from './lembretesLogica';

const CANAL = 'prazos';

/**
 * O módulo de notificações precisa de código nativo que o Expo Go não traz (ele quebra o app inteiro ao
 * carregar). Por isso é carregado dentro de um try: sem ele, os lembretes ficam indisponíveis e o resto do
 * app funciona. Em um build de desenvolvimento ou de produção, os lembretes funcionam normalmente.
 */
let Notifications: typeof NotificacoesTipos | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications') as typeof NotificacoesTipos;
  // Mostra o lembrete mesmo com o app aberto
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
} catch {
  Notifications = null;
}

export const lembretesDisponiveis = Notifications !== null;

async function prepararCanal() {
  if (!Notifications) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Prazos',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

/** Pede permissão ao usuário (se ainda não foi dada). Devolve true quando os lembretes podem funcionar. */
export async function pedirPermissaoLembretes(): Promise<boolean> {
  if (!Notifications) return false;
  try {
    await prepararCanal();
    const atual = await Notifications.getPermissionsAsync();
    if (atual.granted) return true;
    if (!atual.canAskAgain) return false;
    const nova = await Notifications.requestPermissionsAsync();
    return nova.granted;
  } catch {
    return false;
  }
}

export async function cancelarLembretes(): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // sem permissão ou sem suporte: nada a cancelar
  }
}

/** Troca as notificações agendadas pela lista recebida. Devolve quantas foram agendadas. */
export async function agendarLembretes(lembretes: Lembrete[]): Promise<number> {
  if (!Notifications) return 0;
  try {
    await prepararCanal();
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const l of lembretes) {
      await Notifications.scheduleNotificationAsync({
        content: { title: l.titulo, body: l.corpo },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: l.quando,
          channelId: CANAL,
        },
      });
    }
    return lembretes.length;
  } catch {
    return 0;
  }
}
