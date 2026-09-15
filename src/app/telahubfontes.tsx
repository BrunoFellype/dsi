import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopHeader from '../components/TopHeader';
import BottomNav from '../components/BottomNav';

interface FonteIntegracao {
  id: string;
  nome: string;
  tipo: string;
  ativo: boolean;
  status: 'sincronizado' | 'sincronizando' | 'erro';
  statusTexto: string;
  ultimaSinc: string;
  icone: string;
}

export default function TelaHubFontes() {
  const [fontes, setFontes] = useState<FonteIntegracao[]>([
    {
      id: 'classroom',
      nome: 'Google Classroom',
      tipo: 'Ambiente Virtual (AVA)',
      ativo: true,
      status: 'sincronizado',
      statusTexto: 'Conectado • 5 disciplinas',
      ultimaSinc: 'Hoje às 08:30',
      icone: '🏫',
    },
    {
      id: 'sigaa',
      nome: 'Portal SIGAA (UFRPE)',
      tipo: 'Sistema de Gestão Acadêmica',
      ativo: true,
      status: 'sincronizado',
      statusTexto: 'Conectado • Matrícula 2024.1',
      ultimaSinc: 'Hoje às 08:30',
      icone: '🏛️',
    },
    {
      id: 'whatsapp',
      nome: 'WhatsApp Acadêmico',
      tipo: 'Grupos das Disciplinas',
      ativo: true,
      status: 'sincronizado',
      statusTexto: '3 grupos monitorados',
      ultimaSinc: 'Há 12 min',
      icone: '💬',
    },
    {
      id: 'discord',
      nome: 'Discord de Turma',
      tipo: 'Canais de Dúvidas e Estudos',
      ativo: true,
      status: 'sincronizado',
      statusTexto: 'Conectado • Canal BSI',
      ultimaSinc: 'Há 25 min',
      icone: '👾',
    },
  ]);

  const [sincronizando, setSincronizando] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Timer de cooldown (US05 - Critério 5: 5 minutos / 300 segundos)
  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const toggleFonte = (id: string) => {
    setFontes((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ativo: !f.ativo } : f))
    );
  };

  const handleSincronizarTodas = () => {
    if (cooldown > 0) {
      const min = Math.floor(cooldown / 60);
      const seg = cooldown % 60;
      Alert.alert(
        'Aguarde o Cooldown',
        `Para não sobrecarregar as APIs acadêmicas, aguarde ${min}m ${seg}s para uma nova sincronização.`
      );
      return;
    }

    setSincronizando(true);
    setTimeout(() => {
      setSincronizando(false);
      setCooldown(300); // 5 minutos de cooldown
      const agora = 'Agora há pouco';
      setFontes((prev) =>
        prev.map((f) => ({
          ...f,
          ultimaSinc: agora,
          status: 'sincronizado',
        }))
      );
      Alert.alert(
        'Sincronização Concluída',
        'Todas as 4 fontes (SIGAA, Classroom, WhatsApp e Discord) foram atualizadas e consolidadas no ASTRA.'
      );
    }, 1500);
  };

  const formatCooldown = (segundos: number) => {
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        {/* Top Header Padronizado */}
        <TopHeader
          title="Hub de Fontes"
          subtitle="Integração & Sincronização Acadêmica"
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* BANNER EXPLICATIVO (US05) */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoTitulo}>Centralização de Canais</Text>
            <Text style={styles.infoDesc}>
              O ASTRA conecta suas plataformas acadêmicas e extrai comunicados, prazos e notas para alimentar o algoritmo de agrupamento via IA.
            </Text>
          </View>

          {/* LISTA DE CONECTORES (Figura 7) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Plataformas Conectadas</Text>
            <Text style={styles.sectionCount}>{fontes.filter((f) => f.ativo).length} de {fontes.length} ativas</Text>
          </View>

          <View style={styles.listaFontes}>
            {fontes.map((item) => (
              <View key={item.id} style={styles.cardFonte}>
                <View style={styles.fonteTopRow}>
                  <View style={styles.iconeContainer}>
                    <Text style={{ fontSize: 24 }}>{item.icone}</Text>
                  </View>

                  <View style={styles.fonteInfo}>
                    <Text style={styles.fonteNome}>{item.nome}</Text>
                    <Text style={styles.fonteTipo}>{item.tipo}</Text>
                  </View>

                  <Switch
                    value={item.ativo}
                    onValueChange={() => toggleFonte(item.id)}
                    trackColor={{ false: '#CBD5E1', true: '#9AD9EB' }}
                    thumbColor={item.ativo ? '#3873A0' : '#FFFFFF'}
                  />
                </View>

                {item.ativo && (
                  <View style={styles.fonteFooterRow}>
                    <View style={styles.statusBadgeRow}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              item.status === 'sincronizado'
                                ? '#10B981'
                                : item.status === 'sincronizando'
                                ? '#F59E0B'
                                : '#EF4444',
                          },
                        ]}
                      />
                      <Text style={styles.statusTexto}>{item.statusTexto}</Text>
                    </View>
                    <Text style={styles.ultimaSincTexto}>Última sinc: {item.ultimaSinc}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* BOTÃO GLOBAL DE SINCRONIZAÇÃO (US05 - Critério 5) */}
          <Pressable
            style={({ pressed }) => [
              styles.btnSincronizar,
              cooldown > 0 && styles.btnSincronizarDisabled,
              pressed && cooldown === 0 && styles.pressed,
            ]}
            onPress={handleSincronizarTodas}
            disabled={cooldown > 0 || sincronizando}
          >
            <Text style={styles.btnSincronizarTexto}>
              {sincronizando
                ? '🔄 Sincronizando Fontes...'
                : cooldown > 0
                ? `⏳ Cooldown Ativo (${formatCooldown(cooldown)})`
                : '⚡ Sincronizar Todas as Fontes Agora'}
            </Text>
          </Pressable>

          {/* IMPORTAÇÃO DE ARQUIVO .ICS (US05 - Critérios 6 e 7) */}
          <View style={styles.cardIcs}>
            <View style={{ flex: 1 }}>
              <Text style={styles.icsTitulo}>Importar Calendário Externo (.ics)</Text>
              <Text style={styles.icsDesc}>
                Importe calendários do Google ou Outlook (formato .ics até 5MB).
              </Text>
            </View>
            <Pressable
              style={styles.btnIcs}
              onPress={() =>
                Alert.alert(
                  'Importação de Calendário',
                  'Selecione um arquivo .ics válido (máx. 5 MB) do seu dispositivo para importar datas comemorativas e cronograma acadêmico.'
                )
              }
            >
              <Text style={styles.btnIcsText}>Upload .ics</Text>
            </Pressable>
          </View>
        </ScrollView>

        <BottomNav currentRoute="/telahubfontes" />
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

  infoBanner: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: '#E5F4F8',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#9AD9EB',
    marginBottom: 16,
  },
  infoTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2A44',
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },

  sectionHeaderRow: {
    width: '90%',
    maxWidth: 420,
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
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },

  listaFontes: {
    width: '90%',
    maxWidth: 420,
    gap: 12,
    marginBottom: 16,
  },
  cardFonte: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    elevation: 1,
  },
  fonteTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconeContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fonteInfo: {
    flex: 1,
  },
  fonteNome: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  fonteTipo: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  fonteFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusTexto: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  ultimaSincTexto: {
    fontSize: 11,
    color: '#94A3B8',
  },

  // BOTÃO GLOBAL
  btnSincronizar: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: '#3873A0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  btnSincronizarDisabled: {
    backgroundColor: '#94A3B8',
  },
  btnSincronizarTexto: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },

  // CARD .ICS
  cardIcs: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  icsTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D2A44',
  },
  icsDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  btnIcs: {
    backgroundColor: '#E5F4F8',
    borderWidth: 1,
    borderColor: '#9AD9EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnIcsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3873A0',
  },
});
