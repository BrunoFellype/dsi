import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import type { IconName } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { useAstra } from '@/lib/store';

const ABAS: { nome: string; titulo: string; icone: IconName; ativo: IconName }[] = [
  { nome: 'inicio', titulo: 'Início', icone: 'home-outline', ativo: 'home' },
  { nome: 'agenda', titulo: 'Agenda', icone: 'calendar-outline', ativo: 'calendar' },
  { nome: 'avisos', titulo: 'Avisos', icone: 'notifications-outline', ativo: 'notifications' },
  { nome: 'assuntos', titulo: 'Assuntos', icone: 'sparkles-outline', ativo: 'sparkles' },
  { nome: 'fontes', titulo: 'Fontes', icone: 'link-outline', ativo: 'link' },
];

export default function LayoutAbas() {
  const t = useTheme();
  const { sessao } = useAstra();

  if (sessao === 'carregando') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.background }}>
        <ActivityIndicator color={t.primary} />
      </View>
    );
  }
  if (sessao === 'anonimo') return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.border },
      }}
    >
      {ABAS.map((aba) => (
        <Tabs.Screen
          key={aba.nome}
          name={aba.nome}
          options={{
            title: aba.titulo,
            tabBarAccessibilityLabel: aba.titulo,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? aba.ativo : aba.icone} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
