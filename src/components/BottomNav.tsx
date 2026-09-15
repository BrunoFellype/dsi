import React from 'react';
import { View, StyleSheet, Image, Pressable, Text } from 'react-native';
import { router, usePathname } from 'expo-router';

export type TabRoute =
  | '/telainicial'
  | '/telacalendario'
  | '/telacronogramaia'
  | '/telanotificacoes'
  | '/telahubfontes';

interface BottomNavProps {
  currentRoute?: TabRoute;
}

interface TabItem {
  id: TabRoute;
  title: string;
  icon: any;
}

const TABS: TabItem[] = [
  {
    id: '/telainicial',
    title: 'Início',
    icon: require('../../assets/images/homepage.png'),
  },
  {
    id: '/telacalendario',
    title: 'Agenda',
    icon: require('../../assets/images/calendar.png'),
  },
  {
    id: '/telacronogramaia',
    title: 'Disciplinas & IA',
    icon: require('../../assets/images/clock.png'),
  },
  {
    id: '/telanotificacoes',
    title: 'Notificações',
    icon: require('../../assets/images/doorbell.png'),
  },
  {
    id: '/telahubfontes',
    title: 'Hub Fontes',
    icon: require('../../assets/images/tabIcons/explore.png'),
  },
];

export default function BottomNav({ currentRoute }: BottomNavProps) {
  const pathname = usePathname() as TabRoute;
  const activeRoute = currentRoute || pathname;

  function handleNavigate(route: TabRoute) {
    if (activeRoute !== route) {
      router.replace(route as any);
    }
  }

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = activeRoute === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => handleNavigate(tab.id)}
            style={({ pressed }) => [
              styles.tabButton,
              pressed && styles.tabPressed,
            ]}
          >
            <View style={[styles.iconWrapper, isActive && styles.activeIconWrapper]}>
              <Image
                source={tab.icon}
                style={styles.icon}
                tintColor={isActive ? '#3873A0' : '#8A99AD'}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {tab.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 14,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F4F4FC',
    borderTopWidth: 1,
    borderTopColor: '#E2E6EE',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    maxWidth: 72,
    gap: 2,
  },
  tabPressed: {
    opacity: 0.6,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconWrapper: {
    backgroundColor: '#E5F4F8',
  },
  icon: {
    width: 22,
    height: 22,
  },
  label: {
    fontSize: 9.5,
    fontWeight: '500',
    color: '#8A99AD',
    textAlign: 'center',
    lineHeight: 11,
  },
  activeLabel: {
    color: '#1D2A44',
    fontWeight: '700',
  },
});
