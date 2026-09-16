import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import Input from '../components/Input';
import Button from '../components/Button';

const TURNOS = ['Manhã', 'Tarde', 'Noite', 'Integral'] as const;
type Turno = typeof TURNOS[number];

const PERIODOS = ['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º+'];

export default function TelaOnboarding() {
  // Estados do Perfil Acadêmico
  const [curso, setCurso] = useState('Sistemas de Informação');
  const [periodo, setPeriodo] = useState('3º');
  const [turno, setTurno] = useState<Turno>('Manhã');

  // Estados de Metas e Disciplinas
  const [metaMedia, setMetaMedia] = useState(8.5);
  const [novaDisciplina, setNovaDisciplina] = useState('');
  const [disciplinas, setDisciplinas] = useState<string[]>([
    'Algoritmos',
    'Banco de Dados',
    'Engenharia de Software',
  ]);

  function adicionarDisciplina() {
    const nomeLimpo = novaDisciplina.trim();
    if (!nomeLimpo) return;
    if (disciplinas.includes(nomeLimpo)) {
      Alert.alert('Aviso', 'Esta disciplina já foi adicionada.');
      return;
    }
    setDisciplinas([...disciplinas, nomeLimpo]);
    setNovaDisciplina('');
  }

  function removerDisciplina(index: number) {
    setDisciplinas(disciplinas.filter((_, i) => i !== index));
  }

  function alterarMeta(delta: number) {
    setMetaMedia((prev) => {
      const novo = Math.round((prev + delta) * 10) / 10;
      return Math.min(10, Math.max(5.0, novo));
    });
  }

  function concluir() {
    // Redireciona para a visão geral após configurar o perfil
    router.replace('/telainicial');
  }

  function pular() {
    router.replace('/telainicial');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.root}>
          {/* Header estilizado ASTRA */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/straremovebgpreview2.png')}
              style={styles.astraLogo}
              resizeMode="contain"
            />
          </View>

          {/* Barra de Progresso do Onboarding */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTextRow}>
              <Text style={styles.stepTitle}>Passo 1 de 2 • Perfil Acadêmico</Text>
              <Text style={styles.percentageText}>50%</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '50%' }]} />
            </View>
          </View>

          {/* Título Principal */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Configure sua Rotina Acadêmica</Text>
            <Text style={styles.subtitle}>
              Personalize seu perfil para que a IA do ASTRA possa calibrar suas metas e predições.
            </Text>
          </View>

          {/* CARD 1: Dados Acadêmicos */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dados Acadêmicos</Text>

            {/* Curso */}
            <View style={styles.field}>
              <Text style={styles.label}>Curso de Graduação</Text>
              <Input
                placeholder="Ex: Sistemas de Informação"
                value={curso}
                onChangeText={setCurso}
              />
            </View>

            {/* Período */}
            <View style={styles.field}>
              <Text style={styles.label}>Período Atual</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.periodosRow}
              >
                {PERIODOS.map((p) => {
                  const isSelected = periodo === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setPeriodo(p)}
                      style={[
                        styles.periodoChip,
                        isSelected && styles.periodoChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.periodoText,
                          isSelected && styles.periodoTextSelected,
                        ]}
                      >
                        {p}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Turno */}
            <View style={styles.field}>
              <Text style={styles.label}>Turno das Aulas</Text>
              <View style={styles.turnosContainer}>
                {TURNOS.map((t) => {
                  const isSelected = turno === t;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setTurno(t)}
                      style={[
                        styles.turnoButton,
                        isSelected && styles.turnoButtonSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.turnoText,
                          isSelected && styles.turnoTextSelected,
                        ]}
                      >
                        {t}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* CARD 2: Metas & Disciplinas */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Metas & Disciplinas</Text>

            {/* Meta de Média */}
            <View style={styles.field}>
              <View style={styles.metaHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Meta de Média / GPA Alvo</Text>
                  <Text style={styles.metaSubtext}>
                    Sua meta pretendida para este semestre
                  </Text>
                </View>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>{metaMedia.toFixed(1)}</Text>
                </View>
              </View>

              {/* Controles da Meta */}
              <View style={styles.metaAdjustRow}>
                <Pressable
                  onPress={() => alterarMeta(-0.5)}
                  style={styles.stepperButton}
                >
                  <Text style={styles.stepperText}>-</Text>
                </Pressable>

                <View style={styles.metaBarBackground}>
                  <View
                    style={[
                      styles.metaBarProgress,
                      { width: `${((metaMedia - 5) / 5) * 100}%` },
                    ]}
                  />
                </View>

                <Pressable
                  onPress={() => alterarMeta(0.5)}
                  style={styles.stepperButton}
                >
                  <Text style={styles.stepperText}>+</Text>
                </Pressable>
              </View>
            </View>

            {/* Disciplinas Matriculadas */}
            <View style={styles.field}>
              <Text style={styles.label}>Disciplinas Matriculadas</Text>
              <View style={styles.addDisciplinaRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    placeholder="Adicionar disciplina..."
                    value={novaDisciplina}
                    onChangeText={setNovaDisciplina}
                    onSubmitEditing={adicionarDisciplina}
                  />
                </View>
                <Pressable
                  onPress={adicionarDisciplina}
                  style={styles.addButton}
                >
                  <Text style={styles.addButtonText}>+</Text>
                </Pressable>
              </View>

              {/* Lista de tags de disciplinas */}
              <View style={styles.tagsContainer}>
                {disciplinas.map((disc, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => removerDisciplina(idx)}
                    style={styles.tag}
                  >
                    <Text style={styles.tagText}>{disc}</Text>
                    <Text style={styles.tagClose}>✕</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Botão Concluir */}
          <View style={styles.actionContainer}>
            <Button
              title="Concluir e Ir para o Painel →"
              onPress={concluir}
            />

            <Pressable onPress={pular} style={styles.skipButton}>
              <Text style={styles.skipText}>Pular configuração inicial</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FDFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 40,
  },
  root: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#FDFFFF',
  },
  header: {
    width: '100%',
    height: 75,
    backgroundColor: '#9AD9EB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  astraLogo: {
    width: 140,
    height: 60,
  },
  progressContainer: {
    width: '88%',
    maxWidth: 420,
    marginTop: 16,
    gap: 8,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  percentageText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D2A44',
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1D2A44',
    borderRadius: 3,
  },
  titleSection: {
    width: '88%',
    maxWidth: 420,
    marginVertical: 18,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    width: '88%',
    maxWidth: 420,
    backgroundColor: '#E5F4F8',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D0E9F2',
    gap: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  periodosRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  periodoChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  periodoChipSelected: {
    backgroundColor: '#1D2A44',
    borderColor: '#1D2A44',
  },
  periodoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  periodoTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  turnosContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  turnoButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnoButtonSelected: {
    backgroundColor: '#1D2A44',
    borderColor: '#1D2A44',
  },
  turnoText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  turnoTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  metaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  metaSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  metaBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9AD9EB',
  },
  metaBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D2A44',
  },
  metaAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#9AD9EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1D2A44',
  },
  metaBarBackground: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1E6ED',
    overflow: 'hidden',
  },
  metaBarProgress: {
    height: '100%',
    backgroundColor: '#1D2A44',
    borderRadius: 4,
  },
  addDisciplinaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#9AD9EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 26,
    fontWeight: '600',
    color: '#000000',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
  },
  tagClose: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  actionContainer: {
    width: '88%',
    maxWidth: 420,
    gap: 14,
    marginTop: 8,
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
