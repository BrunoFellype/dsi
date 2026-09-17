import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav from '../components/BottomNav';
import TopHeader from '../components/TopHeader';

interface ResumoInteligente {
  id: string;
  disciplina: string;
  topico: string;
  resumo: string;
  fontes: string[];
  data: string;
  confianca: string;
}

export default function TelaDisciplinasIa() {
  const [modalAnexoAberto, setModalAnexoAberto] = useState(false);
  const [modalCorrecaoAberto, setModalCorrecaoAberto] = useState(false);
  const [sugestaoTag, setSugestaoTag] = useState('');
  const [itemSelecionado, setItemSelecionado] = useState<ResumoInteligente | null>(null);

  // Estados para Anexar Materiais (Figura 5 - US04/US03)
  const [materialTitulo, setMaterialTitulo] = useState('');
  const [materialDisciplina, setMaterialDisciplina] = useState('Banco de Dados');

  // Resumos Inteligentes gerados por Clustering Não Supervisionado (US03)
  const [resumos, setResumos] = useState<ResumoInteligente[]>([
    {
      id: '1',
      disciplina: 'Banco de Dados (BSI204)',
      topico: 'Aula 04 – Álgebra Relacional e SQL Avançado',
      resumo:
        'Aviso unificado: Prova P1 confirmada para quinta-feira no laboratório 2. O professor disponibilizou lista preparatória e slide no Classroom; no WhatsApp da turma foram tiradas dúvidas sobre normalização 3FN.',
      fontes: ['🏛️ SIGAA', '🏫 Google Classroom', '💬 WhatsApp Turma'],
      data: 'Hoje, 09:15',
      confianca: 'Cluster ML 96% de coerência',
    },
    {
      id: '2',
      disciplina: 'Engenharia de Software (BSI301)',
      topico: 'Aula 07 – Requisitos & Arquitetura ASTRA',
      resumo:
        'Comunicado consolidado: A entrega do Dossiê Técnico de Engenharia de Software e protótipo funcional deve ser realizada hoje até 23:59. Apresentação à banca agendada com foco em aprendizado não supervisionado.',
      fontes: ['🏫 Google Classroom', '👾 Discord BSI'],
      data: 'Hoje, 08:30',
      confianca: 'Cluster ML 99% de coerência',
    },
    {
      id: '3',
      disciplina: 'Algoritmos e Estruturas de Dados (BCC201)',
      topico: 'Aula 05 – Árvores AVL e Grafos',
      resumo:
        'Síntese de avisos: Exercícios práticos da Lista 3 prorrogados para sexta-feira. Material em PDF sobre percurso em largura e profundidade adicionado no AVA.',
      fontes: ['🏫 Google Classroom', '💬 WhatsApp Turma'],
      data: 'Ontem, 16:40',
      confianca: 'Cluster ML 94% de coerência',
    },
  ]);

  const handleAbrirCorrecao = (item: ResumoInteligente) => {
    setItemSelecionado(item);
    setSugestaoTag('');
    setModalCorrecaoAberto(true);
  };

  const handleSalvarCorrecao = () => {
    // US03 - Critério 7: Bloquear envios contendo apenas espaços em branco
    if (!sugestaoTag.trim()) {
      Alert.alert('Aviso', 'O campo de sugestão de tag/tópico não pode ficar em branco.');
      return;
    }

    Alert.alert(
      'Sugestão Registrada',
      `Sua sugestão "${sugestaoTag.trim()}" foi enviada para retroalimentar o pipeline de clustering da disciplina!`
    );
    setModalCorrecaoAberto(false);
  };

  const handleSalvarMaterial = () => {
    if (!materialTitulo.trim()) {
      Alert.alert('Erro', 'Por favor informe o título ou anotação do material.');
      return;
    }

    Alert.alert(
      'Material Anexado',
      `O material "${materialTitulo.trim()}" foi anexado à disciplina ${materialDisciplina} e enviado ao algoritmo de agrupamento!`
    );
    setMaterialTitulo('');
    setModalAnexoAberto(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        {/* Top Header Padronizado */}
        <TopHeader
          title="Disciplinas e IA"
          subtitle="Agrupamento Não Supervisionado (ML)"
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* BANNER TEÓRICO / MACHINE LEARNING (Documento 1 e 2) */}
          <View style={styles.mlBanner}>
            <View style={styles.mlBadgeRow}>
              <View style={styles.mlTag}>
                <Text style={styles.mlTagText}>MODELO K-MEANS & TOPIC MODELING</Text>
              </View>
              <Text style={styles.mlStatusText}>● IA Ativa</Text>
            </View>
            <Text style={styles.mlBannerTitulo}>Consolidação Automática de Conteúdos</Text>
            <Text style={styles.mlBannerDesc}>
              O ASTRA processa avisos e arquivos do SIGAA, Classroom, WhatsApp e Discord, agrupando comunicações redundantes em tópicos únicos para eliminar ruídos.
            </Text>
          </View>

          {/* 1. DISCIPLINAS ATIVAS (Figura 5) */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>📚 Disciplinas Ativas no Semestre</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <View style={[styles.disciplinaChip, styles.disciplinaChipActive]}>
                <Text style={[styles.disciplinaChipText, styles.disciplinaChipTextActive]}>Todas (5)</Text>
              </View>
              <View style={styles.disciplinaChip}>
                <Text style={styles.disciplinaChipText}>Banco de Dados</Text>
              </View>
              <View style={styles.disciplinaChip}>
                <Text style={styles.disciplinaChipText}>Engenharia de Software</Text>
              </View>
              <View style={styles.disciplinaChip}>
                <Text style={styles.disciplinaChipText}>Algoritmos</Text>
              </View>
              <View style={styles.disciplinaChip}>
                <Text style={styles.disciplinaChipText}>Sistemas Operacionais</Text>
              </View>
            </ScrollView>
          </View>

          {/* 2. ANEXAR MATERIAIS (Figura 5) */}
          <View style={styles.sectionContainer}>
            <View style={styles.cardAnexo}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.anexoTitulo}>📎 Anexar Materiais ou Anotações</Text>
                <Text style={styles.anexoDesc}>
                  Envie fotos de quadro, anotações de aula ou arquivos para a IA agrupar automaticamente no tópico correto.
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.btnAnexar, pressed && styles.pressed]}
                onPress={() => setModalAnexoAberto(true)}
              >
                <Text style={styles.btnAnexarText}>+ Anexar</Text>
              </Pressable>
            </View>
          </View>

          {/* 3. RESUMOS INTELIGENTES (Figura 5 - US03) */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>🧠 Resumos Inteligentes (Agrupados)</Text>
              <Text style={styles.clusterBadge}>3 Tópicos Sintetizados</Text>
            </View>

            <View style={styles.resumosList}>
              {resumos.map((item) => (
                <View key={item.id} style={styles.resumoCard}>
                  <View style={styles.resumoHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resumoDisciplina}>{item.disciplina}</Text>
                      <Text style={styles.resumoTopico}>{item.topico}</Text>
                    </View>
                    <Text style={styles.resumoData}>{item.data}</Text>
                  </View>

                  <Text style={styles.resumoCorpo}>{item.resumo}</Text>

                  {/* Fontes Consolidadas */}
                  <View style={styles.fontesBox}>
                    <Text style={styles.fontesLabel}>Fontes Consolidadas no Cluster:</Text>
                    <View style={styles.fontesChipsRow}>
                      {item.fontes.map((f, idx) => (
                        <View key={idx} style={styles.fonteMiniChip}>
                          <Text style={styles.fonteMiniChipText}>{f}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Botão de Sugerir Correção (US03 - Critérios 3, 5, 7) */}
                  <View style={styles.resumoFooterRow}>
                    <Text style={styles.confiancaText}>✨ {item.confianca}</Text>
                    <Pressable
                      style={styles.btnCorrecao}
                      onPress={() => handleAbrirCorrecao(item)}
                    >
                      <Text style={styles.btnCorrecaoText}>Sugerir Correção ➔</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* MODAL DE ANEXAR MATERIAIS */}
        <Modal visible={modalAnexoAberto} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitulo}>Anexar Material Acadêmico</Text>
              <Text style={styles.modalSub}>
                O arquivo ou texto será processado pelo algoritmo de ML para vinculação ao tópico correto.
              </Text>

              <Text style={styles.inputLabel}>Título ou Descrição do Material</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Exercícios de Normalização 3FN"
                value={materialTitulo}
                onChangeText={setMaterialTitulo}
              />

              <Text style={styles.inputLabel}>Disciplina de Destino</Text>
              <View style={styles.inputDisabledBox}>
                <Text style={{ fontSize: 13, color: '#1E293B' }}>{materialDisciplina}</Text>
              </View>

              <View style={styles.modalAcoesRow}>
                <Pressable
                  style={styles.btnModalCancelar}
                  onPress={() => setModalAnexoAberto(false)}
                >
                  <Text style={styles.btnModalCancelarText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={styles.btnModalSalvar}
                  onPress={handleSalvarMaterial}
                >
                  <Text style={styles.btnModalSalvarText}>Salvar e Processar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL DE SUGERIR CORREÇÃO DE AGRUPAMENTO (US03) */}
        <Modal visible={modalCorrecaoAberto} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitulo}>Sugerir Correção de Agrupamento</Text>
              <Text style={styles.modalSub}>
                Caso o algoritmo de IA tenha vinculado este comunicado ao tópico errado, informe a nova tag ou tópico:
              </Text>

              <Text style={styles.inputLabel}>Nova Tag ou Tópico de Aula</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Aula 05 - Normalização e Índices B+"
                value={sugestaoTag}
                onChangeText={setSugestaoTag}
              />

              <View style={styles.modalAcoesRow}>
                <Pressable
                  style={styles.btnModalCancelar}
                  onPress={() => setModalCorrecaoAberto(false)}
                >
                  <Text style={styles.btnModalCancelarText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={styles.btnModalSalvar}
                  onPress={handleSalvarCorrecao}
                >
                  <Text style={styles.btnModalSalvarText}>Enviar Correção</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <BottomNav currentRoute="/telacronogramaia" />
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
    paddingTop: 16,
    paddingBottom: 24,
  },

  // BANNER ML
  mlBanner: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: '#E5F4F8',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#9AD9EB',
    marginBottom: 16,
    gap: 8,
  },
  mlBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mlTag: {
    backgroundColor: '#3873A0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mlTagText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mlStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  mlBannerTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D2A44',
  },
  mlBannerDesc: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },

  // SEÇÃO GERAL
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
    marginBottom: 8,
  },
  clusterBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3873A0',
    backgroundColor: '#E0EEF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  // CHIPS DISCIPLINAS
  chipScroll: {
    flexDirection: 'row',
    marginTop: 4,
  },
  disciplinaChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 8,
  },
  disciplinaChipActive: {
    backgroundColor: '#3873A0',
    borderColor: '#3873A0',
  },
  disciplinaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  disciplinaChipTextActive: {
    color: '#FFFFFF',
  },

  // CARD ANEXAR MATERIAIS
  cardAnexo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#C3E5EF',
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  anexoTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2A44',
  },
  anexoDesc: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  btnAnexar: {
    backgroundColor: '#3873A0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnAnexarText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },

  // RESUMOS INTELIGENTES
  resumosList: {
    gap: 12,
  },
  resumoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    elevation: 1,
  },
  resumoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  resumoDisciplina: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#3873A0',
  },
  resumoTopico: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  resumoData: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  resumoCorpo: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  fontesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    gap: 4,
  },
  fontesLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },
  fontesChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  fonteMiniChip: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fonteMiniChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#334155',
  },
  resumoFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  confiancaText: {
    fontSize: 10.5,
    color: '#059669',
    fontWeight: '600',
  },
  btnCorrecao: {
    backgroundColor: '#E5F4F8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  btnCorrecaoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3873A0',
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  modalTitulo: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1D2A44',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  inputDisabledBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
  },
  modalAcoesRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  btnModalCancelar: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnModalCancelarText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  btnModalSalvar: {
    backgroundColor: '#3873A0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnModalSalvarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});