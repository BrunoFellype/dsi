import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav from '../components/BottomNav';
import TopHeader from '../components/TopHeader';

interface AtividadeItem {
  id: string;
  titulo: string;
  disciplina: string;
  dataHora: string;
  origem: string;
  prioridade: 'alta' | 'media' | 'baixa';
  concluida: boolean;
  tag?: string;
}

export function TelaCalendario() {
  const [modoVisao, setModoVisao] = useState<'dia' | 'semana' | 'mes'>('semana');
  const [busca, setBusca] = useState('');
  const [modalNovaAtividade, setModalNovaAtividade] = useState(false);

  // Formulário Nova Atividade (US04)
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaDisciplina, setNovaDisciplina] = useState('Banco de Dados');
  const [novaData, setNovaData] = useState('2024-09-18 18:00');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novaPrioridade, setNovaPrioridade] = useState<'alta' | 'media' | 'baixa'>('alta');
  const [novaEtiqueta, setNovaEtiqueta] = useState('Projeto final');
  const [novoLembrete, setNovoLembrete] = useState('24h antes');

  const [atividades, setAtividades] = useState<AtividadeItem[]>([
    {
      id: '1',
      titulo: 'Entrega do Dossiê Técnico e Código DSI',
      disciplina: 'Engenharia de Software (BSI301)',
      dataHora: 'Hoje, 23:59',
      origem: '🏫 Google Classroom',
      prioridade: 'alta',
      concluida: false,
      tag: 'Projeto final',
    },
    {
      id: '2',
      titulo: 'Simulado Preparatório de Álgebra Relacional',
      disciplina: 'Banco de Dados (BSI204)',
      dataHora: 'Quarta, 14:00',
      origem: '🏛️ SIGAA',
      prioridade: 'alta',
      concluida: false,
      tag: 'Prova P1',
    },
    {
      id: '3',
      titulo: 'Lista 3 de Algoritmos (Árvores e Grafos)',
      disciplina: 'Algoritmos (BCC201)',
      dataHora: 'Sexta, 18:00',
      origem: '💬 WhatsApp Turma',
      prioridade: 'media',
      concluida: false,
      tag: 'Leitura obrigatória',
    },
    {
      id: '4',
      titulo: 'Revisão de Sistemas de Arquivos e Memória',
      disciplina: 'Sistemas Operacionais (BCC203)',
      dataHora: 'Sábado, 10:00',
      origem: '✍️ Manual',
      prioridade: 'baixa',
      concluida: true,
      tag: 'Estudo autônomo',
    },
  ]);

  // US02 - Critério 6: Alternar conclusão
  const toggleConcluida = (id: string) => {
    setAtividades((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, concluida: !item.concluida } : item
      )
    );
  };

  // US04: Validações de Criação de Tarefa
  const handleCriarAtividade = () => {
    // Critério 5: título possua no mínimo 3 caracteres
    if (novoTitulo.trim().length < 3) {
      Alert.alert('Erro de Validação', 'O título da atividade deve possuir no mínimo 3 caracteres.');
      return;
    }
    // Critério 2: disciplina e data/hora preenchidos
    if (!novaDisciplina || !novaData) {
      Alert.alert('Erro de Validação', 'A disciplina e a data/hora de entrega são obrigatórias.');
      return;
    }
    // Critério 5: limite de descrição
    if (novaDescricao.length > 1000) {
      Alert.alert('Erro de Validação', 'A descrição não pode ultrapassar 1000 caracteres.');
      return;
    }

    const nova: AtividadeItem = {
      id: String(Date.now()),
      titulo: novoTitulo.trim(),
      disciplina: novaDisciplina,
      dataHora: novaData,
      origem: '✍️ Manual',
      prioridade: novaPrioridade,
      concluida: false,
      tag: novaEtiqueta,
    };

    setAtividades((prev) => [nova, ...prev]);
    setNovoTitulo('');
    setNovaDescricao('');
    setModalNovaAtividade(false);
    Alert.alert('Sucesso', 'Atividade cadastrada com sucesso na sua agenda!');
  };

  // US02 - Critério 4: Exigir no mínimo 3 caracteres para filtrar na busca
  const atividadesFiltradas = atividades.filter((item) => {
    if (busca.trim().length >= 3) {
      return (
        item.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        item.disciplina.toLowerCase().includes(busca.toLowerCase())
      );
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        {/* Top Header Padronizado */}
        <TopHeader
          title="Grade de Atividades"
          subtitle="Calendário Unificado • UFRPE"
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* SELETOR DE VISUALIZAÇÃO (US02 / Figura 4) */}
          <View style={styles.topControlRow}>
            <View style={styles.seletorVisao}>
              <Pressable
                style={[styles.visaoBtn, modoVisao === 'dia' && styles.visaoBtnAtivo]}
                onPress={() => setModoVisao('dia')}
              >
                <Text style={[styles.visaoTexto, modoVisao === 'dia' && styles.visaoTextoAtivo]}>Dia</Text>
              </Pressable>
              <Pressable
                style={[styles.visaoBtn, modoVisao === 'semana' && styles.visaoBtnAtivo]}
                onPress={() => setModoVisao('semana')}
              >
                <Text style={[styles.visaoTexto, modoVisao === 'semana' && styles.visaoTextoAtivo]}>Semana</Text>
              </Pressable>
              <Pressable
                style={[styles.visaoBtn, modoVisao === 'mes' && styles.visaoBtnAtivo]}
                onPress={() => setModoVisao('mes')}
              >
                <Text style={[styles.visaoTexto, modoVisao === 'mes' && styles.visaoTextoAtivo]}>Mês</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.btnNovaAtividade}
              onPress={() => setModalNovaAtividade(true)}
            >
              <Text style={styles.btnNovaAtividadeText}>+ Nova Atividade</Text>
            </Pressable>
          </View>

          {/* BARRA DE BUSCA (US02 - Critério 4) */}
          <View style={styles.buscaContainer}>
            <Text style={styles.buscaIcon}>🔍</Text>
            <TextInput
              style={styles.buscaInput}
              placeholder="Buscar atividades por título ou matéria (mín. 3 letras)..."
              value={busca}
              onChangeText={setBusca}
              placeholderTextColor="#94A3B8"
            />
            {busca.length > 0 && busca.length < 3 && (
              <Text style={styles.buscaAviso}>Mín. 3 letras</Text>
            )}
          </View>

          {/* CARROSSEL DE PRAZOS PRÓXIMOS NAS PRÓXIMAS 48H (US02 / Figura 4) */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>🔥 Prazos Críticos (Próximas 48h)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carrosselPrazos}>
              <View style={[styles.prazoCardDestaque, { borderColor: '#EF4444' }]}>
                <View style={[styles.urgenteBadge, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.urgenteText, { color: '#B91C1C' }]}>HOJE 23:59</Text>
                </View>
                <Text style={styles.prazoCardTitulo} numberOfLines={2}>
                  Dossiê e Código DSI
                </Text>
                <Text style={styles.prazoCardSub}>Eng. de Software</Text>
              </View>

              <View style={[styles.prazoCardDestaque, { borderColor: '#F59E0B' }]}>
                <View style={[styles.urgenteBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.urgenteText, { color: '#B45309' }]}>EM 48H</Text>
                </View>
                <Text style={styles.prazoCardTitulo} numberOfLines={2}>
                  Simulado Banco de Dados
                </Text>
                <Text style={styles.prazoCardSub}>Álgebra e SQL</Text>
              </View>
            </ScrollView>
          </View>

          {/* LISTA VERTICAL DE ATIVIDADES AGRUPADA POR DIAS (US02 / Figura 4) */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>📋 Lista de Atividades & Prazos</Text>
            <View style={styles.atividadesList}>
              {atividadesFiltradas.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.cardAtividade,
                    item.concluida && styles.cardAtividadeConcluida,
                  ]}
                >
                  <Pressable
                    style={[
                      styles.checkCircle,
                      item.concluida && styles.checkCircleConcluido,
                    ]}
                    onPress={() => toggleConcluida(item.id)}
                  >
                    {item.concluida && <Text style={styles.checkIcon}>✓</Text>}
                  </Pressable>

                  <View style={{ flex: 1, gap: 3 }}>
                    <Text
                      style={[
                        styles.atividadeTitulo,
                        item.concluida && styles.textoRiscado,
                      ]}
                    >
                      {item.titulo}
                    </Text>
                    <Text style={styles.atividadeDisciplina}>{item.disciplina}</Text>
                    <View style={styles.atividadeMetaRow}>
                      <Text style={styles.atividadeOrigem}>{item.origem}</Text>
                      <Text style={styles.atividadeData}>• {item.dataHora}</Text>
                      {item.tag ? (
                        <View style={styles.tagBadge}>
                          <Text style={styles.tagBadgeText}>{item.tag}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <View
                    style={[
                      styles.prioridadeDot,
                      {
                        backgroundColor:
                          item.prioridade === 'alta'
                            ? '#EF4444'
                            : item.prioridade === 'media'
                            ? '#F59E0B'
                            : '#10B981',
                      },
                    ]}
                  />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* MODAL DE NOVA ATIVIDADE (US04) */}
        <Modal visible={modalNovaAtividade} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitulo}>Adicionar Nova Atividade</Text>
              <Text style={styles.modalSub}>
                Cadastre lembretes e tarefas informadas em sala ou no quadro.
              </Text>

              <Text style={styles.inputLabel}>Título da Atividade *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Exercícios de Normalização (mín. 3 letras)"
                value={novoTitulo}
                onChangeText={setNovoTitulo}
              />

              <Text style={styles.inputLabel}>Disciplina *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Banco de Dados"
                value={novaDisciplina}
                onChangeText={setNovaDisciplina}
              />

              <Text style={styles.inputLabel}>Data e Hora de Entrega *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 2024-09-18 18:00"
                value={novaData}
                onChangeText={setNovaData}
              />

              <Text style={styles.inputLabel}>Etiqueta / Categoria</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Leitura obrigatória, Projeto final"
                value={novaEtiqueta}
                onChangeText={setNovaEtiqueta}
              />

              <Text style={styles.inputLabel}>Lembrete de Antecedência</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 24h antes ou 2h antes"
                value={novoLembrete}
                onChangeText={setNovoLembrete}
              />

              <View style={styles.modalAcoesRow}>
                <Pressable
                  style={styles.btnModalCancelar}
                  onPress={() => setModalNovaAtividade(false)}
                >
                  <Text style={styles.btnModalCancelarText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={styles.btnModalSalvar}
                  onPress={handleCriarAtividade}
                >
                  <Text style={styles.btnModalSalvarText}>Salvar Atividade</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <BottomNav currentRoute="/telacalendario" />
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

  topControlRow: {
    width: '90%',
    maxWidth: 420,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seletorVisao: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    padding: 3,
  },
  visaoBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  visaoBtnAtivo: {
    backgroundColor: '#FFFFFF',
  },
  visaoTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  visaoTextoAtivo: {
    color: '#1D2A44',
    fontWeight: '700',
  },
  btnNovaAtividade: {
    backgroundColor: '#3873A0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnNovaAtividadeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // BUSCA
  buscaContainer: {
    width: '90%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    marginBottom: 16,
    height: 42,
  },
  buscaIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  buscaInput: {
    flex: 1,
    fontSize: 12,
    color: '#1E293B',
  },
  buscaAviso: {
    fontSize: 10,
    color: '#B45309',
    fontWeight: '600',
  },

  // SEÇÃO GERAL
  sectionContainer: {
    width: '90%',
    maxWidth: 420,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D2A44',
    marginBottom: 10,
  },

  // CARROSSEL PRAZOS PRÓXIMOS
  carrosselPrazos: {
    flexDirection: 'row',
  },
  prazoCardDestaque: {
    width: 170,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    marginRight: 10,
    gap: 4,
  },
  urgenteBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgenteText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  prazoCardTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D2A44',
    marginTop: 2,
  },
  prazoCardSub: {
    fontSize: 11,
    color: '#64748B',
  },

  // LISTA DE ATIVIDADES
  atividadesList: {
    gap: 8,
  },
  cardAtividade: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardAtividadeConcluida: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.7,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleConcluido: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  atividadeTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  textoRiscado: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  atividadeDisciplina: {
    fontSize: 11,
    color: '#64748B',
  },
  atividadeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  atividadeOrigem: {
    fontSize: 10.5,
    color: '#3873A0',
    fontWeight: '600',
  },
  atividadeData: {
    fontSize: 10.5,
    color: '#64748B',
  },
  tagBadge: {
    backgroundColor: '#E0EEF5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tagBadgeText: {
    fontSize: 9.5,
    color: '#1D2A44',
    fontWeight: '600',
  },
  prioridadeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // MODAL NOVA ATIVIDADE
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
    gap: 10,
  },
  modalTitulo: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1D2A44',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  modalAcoesRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  btnModalCancelar: {
    paddingHorizontal: 12,
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

export default TelaCalendario;