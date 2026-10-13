import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav from '../components/BottomNav';
import TopHeader from '../components/TopHeader';
import { Colors } from '../constants/theme';

interface NotificacaoItem {
  id: string;
  canal: 'Google Classroom' | 'SIGAA' | 'Whatsapp' | 'Discord';
  disciplina: string;
  titulo: string;
  mensagem: string;
  horario: string;
  lida: boolean;
  prioridade: 'alta' | 'media' | 'normal';
}

const PALETA = Colors.light;

export default function TelaNotificacoes() {
  const [filtroAtivo, setFiltroAtivo] = useState<string>('Todas');
  const [notificacoes, setNotificacoes] = useState<NotificacaoItem[]>([
    {
      id: '1',
      canal: 'Google Classroom',
      disciplina: 'Engenharia de Software (DSI)',
      prioridade: 'alta',
      titulo: 'Envio do Dossiê e Código Final',
      mensagem: 'Atividade cadastrada com prazo improrrogável até 23:59.',
      horario: 'Há 10 min',
      lida: false,
    },
    {
      id: '2',
      canal: 'SIGAA',
      disciplina: 'Banco de Dados',
      prioridade: 'alta',
      titulo: 'Alteração do Local da Avaliação',
      mensagem: 'A prova prática será realizada no Laboratório 2 de Informática.',
      horario: 'Hoje 08:30',
      lida: false,
    },
    {
      id: '3',
      canal: 'Whatsapp',
      disciplina: 'Estruturas de Dados',
      prioridade: 'media',
      titulo: 'Gabarito da Lista de Grafos',
      mensagem: 'Monitor Victor disponibilizou o roteiro de resolução das árvores AVL.',
      horario: 'Ontem 18:20',
      lida: true,
    },
    {
      id: '4',
      canal: 'Discord',
      disciplina: 'Sistemas Operacionais',
      prioridade: 'normal',
      titulo: 'Canal de Dúvidas Aberto',
      mensagem: 'Discussão sobre escalonamento de processos e threads iniciada.',
      horario: 'Há 2 dias',
      lida: true,
    },
  ]);

  const alternarLeitura = (id: string) => {
    setNotificacoes((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, lida: !item.lida } : item
      )
    );
  };

  const marcarTodasComoLidas = () => {
    setNotificacoes((prev) => prev.map((item) => ({ ...item, lida: true })));
  };

  const notificacoesFiltradas = notificacoes.filter((item) => {
    if (filtroAtivo === 'Todas') return true;
    if (filtroAtivo === 'Urgentes') return item.prioridade === 'alta';
    return item.canal === filtroAtivo;
  });

  const contagemNaoLidas = notificacoes.filter((item) => !item.lida).length;

  const obterCoresCanal = (canal: string) => {
    switch (canal) {
      case 'Google Classroom':
        return { background: '#E8F5E9', texto: '#2E7D32' };
      case 'SIGAA':
        return { background: '#E0F2FE', texto: '#0369A1' };
      case 'Whatsapp':
        return { background: '#DCFCE7', texto: '#15803D' };
      case 'Discord':
        return { background: '#EDE9FE', texto: '#6D28D9' };
      default:
        return { background: '#F1F5F9', texto: '#475569' };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <TopHeader
          title="Notificações"
          subtitle="Alertas & Central de Avisos"
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.resumoBox}>
            <View style={styles.resumoTextos}>
              <Text style={styles.resumoTitulo}>Central de Avisos</Text>
              <Text style={styles.resumoDescricao}>
                Você possui {contagemNaoLidas} comunicado(s) pendente(s) de leitura.
              </Text>
            </View>
            <Pressable
              onPress={marcarTodasComoLidas}
              style={({ pressed }) => [
                styles.btnMarcarTodas,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.btnMarcarTodasTexto}>Marcar lidos</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtrosBar}
          >
            {['Todas', 'Urgentes', 'SIGAA', 'Google Classroom', 'Whatsapp', 'Discord'].map(
              (opcao) => {
                const ativo = filtroAtivo === opcao;
                return (
                  <Pressable
                    key={opcao}
                    onPress={() => setFiltroAtivo(opcao)}
                    style={[
                      styles.filtroChip,
                      ativo && styles.filtroChipAtivo,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filtroChipTexto,
                        ativo && styles.filtroChipTextoAtivo,
                      ]}
                    >
                      {opcao}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </ScrollView>

          <View style={styles.listaContainer}>
            {notificacoesFiltradas.map((item) => {
              const corCanal = obterCoresCanal(item.canal);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => alternarLeitura(item.id)}
                  style={({ pressed }) => [
                    styles.cardNotificacao,
                    !item.lida && styles.cardNaoLido,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.headerEsquerda}>
                      <View
                        style={[
                          styles.canalTag,
                          { backgroundColor: corCanal.background },
                        ]}
                      >
                        <Text
                          style={[
                            styles.canalTagTexto,
                            { color: corCanal.texto },
                          ]}
                        >
                          {item.canal}
                        </Text>
                      </View>
                      <Text style={styles.disciplinaTexto}>{item.disciplina}</Text>
                    </View>
                    <Text style={styles.horarioTexto}>{item.horario}</Text>
                  </View>

                  <Text style={styles.tituloTexto}>{item.titulo}</Text>
                  <Text style={styles.mensagemTexto}>{item.mensagem}</Text>

                  <View style={styles.cardFooter}>
                    <View style={styles.prioridadeContainer}>
                      {item.prioridade === 'alta' ? (
                        <View style={styles.urgenteBadge}>
                          <Text style={styles.urgenteBadgeTexto}>Prazo Crítico</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.statusLeituraTexto}>
                      {item.lida ? 'Lida' : 'Toque para marcar como lida'}
                    </Text>
                  </View>
                </Pressable>
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
    backgroundColor: PALETA.header,
  },
  root: {
    flex: 1,
    backgroundColor: PALETA.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 30,
  },
  resumoBox: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: PALETA.backgroundCard,
    borderWidth: 1,
    borderColor: PALETA.cardBorder,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  resumoTextos: {
    flex: 1,
    marginRight: 10,
  },
  resumoTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETA.text,
  },
  resumoDescricao: {
    fontSize: 12,
    color: PALETA.textSecondary,
    marginTop: 2,
  },
  btnMarcarTodas: {
    backgroundColor: PALETA.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PALETA.inputBorder,
  },
  btnMarcarTodasTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETA.primary,
  },
  filtrosBar: {
    paddingHorizontal: '5%',
    gap: 8,
    marginBottom: 16,
  },
  filtroChip: {
    backgroundColor: PALETA.white,
    borderWidth: 1,
    borderColor: PALETA.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  filtroChipAtivo: {
    backgroundColor: PALETA.text,
    borderColor: PALETA.text,
  },
  filtroChipTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETA.textSecondary,
  },
  filtroChipTextoAtivo: {
    color: PALETA.white,
  },
  listaContainer: {
    width: '90%',
    maxWidth: 420,
    gap: 12,
  },
  cardNotificacao: {
    backgroundColor: PALETA.white,
    borderWidth: 1,
    borderColor: PALETA.borderLight,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  cardNaoLido: {
    backgroundColor: PALETA.backgroundCard,
    borderColor: PALETA.inputBorder,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  canalTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  canalTagTexto: {
    fontSize: 11,
    fontWeight: '700',
  },
  disciplinaTexto: {
    fontSize: 11,
    color: PALETA.textSecondary,
    fontWeight: '500',
    flexShrink: 1,
  },
  horarioTexto: {
    fontSize: 11,
    color: PALETA.textMuted,
  },
  tituloTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETA.text,
    marginTop: 2,
  },
  mensagemTexto: {
    fontSize: 12.5,
    color: PALETA.textSecondary,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: PALETA.borderLight,
  },
  prioridadeContainer: {
    flex: 1,
  },
  urgenteBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  urgenteBadgeTexto: {
    color: PALETA.error,
    fontSize: 10.5,
    fontWeight: '700',
  },
  statusLeituraTexto: {
    fontSize: 11,
    color: PALETA.textMuted,
    fontStyle: 'italic',
  },
  pressed: {
    opacity: 0.75,
  },
});
