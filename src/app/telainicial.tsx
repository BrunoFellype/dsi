import { router } from 'expo-router';
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
import { academicActivities } from '../constants/academicActivities';

export default function TelaInicial() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        {/* Top Header Padronizado com Faixa Azul, Logo e Perfil de Riquelme (Figura 3) */}
        <TopHeader
          title="Visão Geral Acadêmica"
          subtitle="Semestre 2024.1 • UFRPE"
          onProfilePress={() => router.push('/telaperfil')}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* SAUDAÇÃO INICIAL */}
          <View style={styles.greetingSection}>
            <View>
              <Text style={styles.greetingText}>Olá, Riquelme 👋</Text>
              <Text style={styles.greetingSub}>Painel consolidado da sua rotina universitária</Text>
            </View>
            <View style={styles.periodoBadge}>
              <Text style={styles.periodoBadgeText}>3º Período • BSI</Text>
            </View>
          </View>

          {/* 1. RESUMO DO DIA (Figura 3 - Wireframe Tela Inicial) */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>📊 Resumo do Dia</Text>
              <Text style={styles.sectionBadgeDate}>Segunda-feira, 14 Set</Text>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricEmoji}>🎓</Text>
                <Text style={styles.metricValue}>3 Aulas</Text>
                <Text style={styles.metricLabel}>Horário de Hoje</Text>
                <Text style={styles.metricSub}>BSI204, BSI301, BCC201</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricEmoji}>📌</Text>
                <Text style={[styles.metricValue, { color: '#B91C1C' }]}>2 Prazos</Text>
                <Text style={styles.metricLabel}>Entrega Próxima</Text>
                <Text style={styles.metricSub}>1 hoje, 1 em 48h</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricEmoji}>🤖</Text>
                <Text style={[styles.metricValue, { color: '#3873A0' }]}>4 Avisos</Text>
                <Text style={styles.metricLabel}>Agrupados por IA</Text>
                <Text style={styles.metricSub}>Sem duplicidades</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricEmoji}>⏱️</Text>
                <Text style={[styles.metricValue, { color: '#15803D' }]}>4.5h</Text>
                <Text style={styles.metricLabel}>Estudo Planejado</Text>
                <Text style={styles.metricSub}>Meta diária em dia</Text>
              </View>
            </View>
          </View>

          {/* 2. PRINCIPAIS ATIVIDADES (Figura 3 - Wireframe Tela Inicial) */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>📌 Principais Atividades</Text>
              <Pressable onPress={() => router.push('/telacalendario')}>
                <Text style={styles.sectionLink}>Ver Agenda ➔</Text>
              </Pressable>
            </View>

            <View style={styles.atividadesList}>
              {academicActivities.map((activity) => (
                <View key={activity.id} style={[styles.atividadeCard, { borderLeftColor: activity.borderColor }]}>
                  <View style={styles.atividadeContent}>
                    <Text style={styles.atividadeTitulo}>{activity.title}</Text>
                    <Text style={styles.atividadeSub}>{activity.details}</Text>
                    <View style={styles.fonteTagRow}>
                      <Text style={styles.fonteTag}>{activity.source}</Text>
                    </View>
                  </View>
                  <View style={[styles.prazoBadge, { backgroundColor: activity.deadlineBackgroundColor }]}>
                    <Text style={[styles.prazoText, { color: activity.deadlineTextColor }]}>{activity.deadline}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 3. DISCIPLINAS ATIVAS (Figura 3 - Wireframe Tela Inicial) */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>📚 Disciplinas Ativas (5)</Text>
              <Pressable onPress={() => router.push('/telacronogramaia')}>
                <Text style={styles.sectionLink}>Disciplinas & IA ➔</Text>
              </Pressable>
            </View>

            <View style={styles.disciplinasList}>
              <View style={styles.disciplinaCard}>
                <View style={styles.disciplinaTopRow}>
                  <View>
                    <Text style={styles.disciplinaNome}>Banco de Dados</Text>
                    <Text style={styles.disciplinaCodigo}>BSI204 • Prof. Ricardo</Text>
                  </View>
                  <View style={[styles.notaBadge, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.notaBadgeText, { color: '#B45309' }]}>Média: 7.8</Text>
                  </View>
                </View>
                <View style={styles.disciplinaFooterRow}>
                  <Text style={styles.disciplinaPresenca}>Presença: 88%</Text>
                  <View style={styles.tagAlerta}>
                    <Text style={styles.tagAlertaText}>⚠️ Prova P1 em 3 dias</Text>
                  </View>
                </View>
              </View>

              <View style={styles.disciplinaCard}>
                <View style={styles.disciplinaTopRow}>
                  <View>
                    <Text style={styles.disciplinaNome}>Engenharia de Software (DSI)</Text>
                    <Text style={styles.disciplinaCodigo}>BSI301 • Projeto ASTRA</Text>
                  </View>
                  <View style={[styles.notaBadge, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={[styles.notaBadgeText, { color: '#15803D' }]}>Média: 9.2</Text>
                  </View>
                </View>
                <View style={styles.disciplinaFooterRow}>
                  <Text style={styles.disciplinaPresenca}>Presença: 96%</Text>
                  <View style={styles.tagSucesso}>
                    <Text style={styles.tagSucessoText}>✅ Dossiê em finalização</Text>
                  </View>
                </View>
              </View>

              <View style={styles.disciplinaCard}>
                <View style={styles.disciplinaTopRow}>
                  <View>
                    <Text style={styles.disciplinaNome}>Algoritmos e Estruturas de Dados</Text>
                    <Text style={styles.disciplinaCodigo}>BCC201 • Turma Manhã</Text>
                  </View>
                  <View style={[styles.notaBadge, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={[styles.notaBadgeText, { color: '#15803D' }]}>Média: 8.5</Text>
                  </View>
                </View>
                <View style={styles.disciplinaFooterRow}>
                  <Text style={styles.disciplinaPresenca}>Presença: 94%</Text>
                  <View style={styles.tagInfo}>
                    <Text style={styles.tagInfoText}>🔵 Em dia</Text>
                  </View>
                </View>
              </View>

              <View style={styles.disciplinaCard}>
                <View style={styles.disciplinaTopRow}>
                  <View>
                    <Text style={styles.disciplinaNome}>Sistemas Operacionais</Text>
                    <Text style={styles.disciplinaCodigo}>BCC203 • Prof. Carlos</Text>
                  </View>
                  <View style={[styles.notaBadge, { backgroundColor: '#E0EEF5' }]}>
                    <Text style={[styles.notaBadgeText, { color: '#1D2A44' }]}>Média: 8.0</Text>
                  </View>
                </View>
                <View style={styles.disciplinaFooterRow}>
                  <Text style={styles.disciplinaPresenca}>Presença: 90%</Text>
                  <View style={styles.tagAlerta}>
                    <Text style={styles.tagAlertaText}>📝 Lista 2 pendente</Text>
                  </View>
                </View>
              </View>

              <View style={styles.disciplinaCard}>
                <View style={styles.disciplinaTopRow}>
                  <View>
                    <Text style={styles.disciplinaNome}>Cálculo Numérico</Text>
                    <Text style={styles.disciplinaCodigo}>MAT102 • Profª. Helena</Text>
                  </View>
                  <View style={[styles.notaBadge, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.notaBadgeText, { color: '#B45309' }]}>Média: 7.5</Text>
                  </View>
                </View>
                <View style={styles.disciplinaFooterRow}>
                  <Text style={styles.disciplinaPresenca}>Presença: 86%</Text>
                  <View style={styles.tagInfo}>
                    <Text style={styles.tagInfoText}>🔵 Revisão agendada</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* 4. CONEXÕES ATIVAS (Figura 3 - Wireframe Tela Inicial) */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>🔗 Conexões Ativas</Text>
              <Pressable onPress={() => router.push('/telahubfontes')}>
                <Text style={styles.sectionLink}>Gerenciar no Hub ➔</Text>
              </Pressable>
            </View>

            <View style={styles.conexoesGrid}>
              <Pressable
                style={styles.conexaoChip}
                onPress={() => router.push('/telahubfontes')}
              >
                <View style={styles.statusDotGreen} />
                <Text style={styles.conexaoText}>Google Classroom (Sync)</Text>
              </Pressable>

              <Pressable
                style={styles.conexaoChip}
                onPress={() => router.push('/telahubfontes')}
              >
                <View style={styles.statusDotGreen} />
                <Text style={styles.conexaoText}>SIGAA UFRPE (Conectado)</Text>
              </Pressable>

              <Pressable
                style={styles.conexaoChip}
                onPress={() => router.push('/telahubfontes')}
              >
                <View style={styles.statusDotGreen} />
                <Text style={styles.conexaoText}>WhatsApp Acadêmico (Ativo)</Text>
              </Pressable>

              <Pressable
                style={styles.conexaoChip}
                onPress={() => router.push('/telahubfontes')}
              >
                <View style={styles.statusDotGreen} />
                <Text style={styles.conexaoText}>Discord da Turma (Ativo)</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <BottomNav currentRoute="/telainicial" />
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
    width: '100%',
    backgroundColor: '#F8FCFD',
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 24,
  },

  // SAUDAÇÃO
  greetingSection: {
    width: '90%',
    maxWidth: 420,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D2A44',
  },
  greetingSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  periodoBadge: {
    backgroundColor: '#E5F4F8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C3E5EF',
  },
  periodoBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3873A0',
  },

  // SEÇÕES GERAIS
  sectionContainer: {
    width: '90%',
    maxWidth: 420,
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D2A44',
  },
  sectionBadgeDate: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3873A0',
  },

  // 1. RESUMO DO DIA (Figura 3)
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'flex-start',
    gap: 2,
  },
  metricEmoji: {
    fontSize: 20,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1D2A44',
    marginTop: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  metricSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },

  // 2. PRINCIPAIS ATIVIDADES
  atividadesList: {
    gap: 8,
  },
  atividadeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  atividadeContent: {
    flex: 1,
    marginRight: 10,
  },
  atividadeTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D2A44',
  },
  atividadeSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  fonteTagRow: {
    marginTop: 4,
  },
  fonteTag: {
    fontSize: 10,
    color: '#3873A0',
    fontWeight: '600',
  },
  prazoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  prazoText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // 3. DISCIPLINAS ATIVAS
  disciplinasList: {
    gap: 10,
  },
  disciplinaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  disciplinaTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  disciplinaNome: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2A44',
  },
  disciplinaCodigo: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  notaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  notaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  disciplinaFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  disciplinaPresenca: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  tagAlerta: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagAlertaText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#B45309',
  },
  tagSucesso: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagSucessoText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#15803D',
  },
  tagInfo: {
    backgroundColor: '#E0EEF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagInfoText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1D2A44',
  },

  // 4. CONEXÕES ATIVAS
  conexoesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  conexaoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    width: '48%',
  },
  statusDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  conexaoText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
});