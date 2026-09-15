import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav from '../components/BottomNav';
import TopHeader from '../components/TopHeader';

interface NotificacaoItem {
  id: string;
  canal: 'Discord' | 'Google Classroom' | 'Whatsapp' | 'SIGAA';
  titulo: string;
  mensagem: string;
  horario: string;
  lida: boolean;
  prioridade: 'alta' | 'media' | 'normal';
}

export default function TelaNotificacoes() {
  const [notificacoes, setNotificacoes] = useState<NotificacaoItem[]>([
    {
      id: '1',
      canal: 'Google Classroom',
      prioridade: 'alta',
      titulo: 'Entrega de Engenharia de Software (DSI)',
      mensagem: 'Prof. Bruno postou nova atividade: Envio do código e dossiê do ASTRA até hoje às 23:59.',
      horario: 'Há 15 min',
      lida: false,
    },
    {
      id: '2',
      canal: 'SIGAA',
      prioridade: 'alta',
      titulo: 'Alteração na Sala de Banco de Dados',
      mensagem: 'A avaliação prática de Álgebra Relacional de quinta-feira será no Laboratório 2.',
      horario: 'Hoje 08:20',
      lida: false,
    },
    {
      id: '3',
      canal: 'Whatsapp',
      prioridade: 'media',
      titulo: 'Grupo da Turma • Algoritmos',
      mensagem: 'Monitor Victor compartilhou gabarito dos exercícios de grafos e árvore AVL.',
      horario: 'Ontem 17:40',
      lida: true,
    },
    {
      id: '4',
      canal: 'Discord',
      prioridade: 'normal',
      titulo: 'Canal de Estudos • Sistemas Operacionais',
      mensagem: 'Dúvidas abertas para a Lista 2 de escalonamento de CPU e semáforos.',
      horario: 'Há 2 dias',
      lida: true,
    },
    {
      id: '5',
      canal: 'Whatsapp',
      prioridade: 'normal',
      titulo: 'Comissão de Curso BSI',
      mensagem: 'Lembrete: Prazo final para cancelamento de disciplinas encerra na sexta-feira.',
      horario: 'Há 3 dias',
      lida: true,
    },
  ]);

  const marcarTodasLidas = () => {
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
  };

  const getCanalBadgeColor = (canal: string) => {
    switch (canal) {
      case 'Google Classroom':
        return { bg: '#E8F5E9', text: '#2E7D32' };
      case 'SIGAA':
        return { bg: '#E0F2FE', text: '#0369A1' };
      case 'Whatsapp':
        return { bg: '#DCFCE7', text: '#15803D' };
      case 'Discord':
        return { bg: '#EDE9FE', text: '#6D28D9' };
      default:
        return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        {/* Top Header Padronizado */}
        <TopHeader
          title="Notificações"
          subtitle="Avisos & Comunicados Centralizados"
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Cabeçalho da Lista (Figura 6) */}
          <View style={styles.headerRow}>
            <Text style={styles.secaoTitulo}>
              Comunicados Recebidos ({notificacoes.filter((n) => !n.lida).length} não lidos)
            </Text>
            <Pressable onPress={marcarTodasLidas}>
              <Text style={styles.marcarLidas}>Marcar lidos</Text>
            </Pressable>
          </View>

          {/* Cards Modulares de Notificação (Figura 6) */}
          <View style={styles.notifList}>
            {notificacoes.map((item) => {
              const canalCor = getCanalBadgeColor(item.canal);

              return (
                <View
                  key={item.id}
                  style={[
                    styles.notifCard,
                    !item.lida && styles.notifNaoLida,
                  ]}
                >
                  {/* Badge da Fonte de Origem (Figura 6) */}
                  <View style={styles.cardTopRow}>
                    <View style={[styles.canalBadge, { backgroundColor: canalCor.bg }]}>
                      <Text style={[styles.canalBadgeText, { color: canalCor.text }]}>
                        ● {item.canal}
                      </Text>
                    </View>
                    <Text style={styles.horarioTexto}>{item.horario}</Text>
                  </View>

                  <Text style={styles.notifTitulo}>{item.titulo}</Text>
                  <Text style={styles.notifMensagem}>{item.mensagem}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <BottomNav currentRoute="/telanotificacoes" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#9AD9EB',
  },
  root: {
    flex: 1,
    backgroundColor: '#F8FCFD',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 24,
  },

  headerRow: {
    width: '90%',
    maxWidth: 420,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  secaoTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D2A44',
  },
  marcarLidas: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3873A0',
  },

  notifList: {
    width: '90%',
    maxWidth: 420,
    gap: 10,
  },
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    elevation: 1,
  },
  notifNaoLida: {
    backgroundColor: '#F7FCFE',
    borderColor: '#9AD9EB',
    borderWidth: 1.5,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  canalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  canalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  horarioTexto: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  notifTitulo: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1D2A44',
  },
  notifMensagem: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
});