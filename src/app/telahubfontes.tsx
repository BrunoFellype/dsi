import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav from '../components/BottomNav';
import TopHeader from '../components/TopHeader';
import { Colors } from '../constants/theme';

interface FonteIntegracao {
  id: string;
  nome: string;
  tipo: string;
  ativo: boolean;
  status: 'sincronizado' | 'sincronizando' | 'erro';
  statusTexto: string;
  ultimaSinc: string;
}

const PALETA = Colors.light;

export default function TelaHubFontes() {
  const [fontes, setFontes] = useState<FonteIntegracao[]>([
    {
      id: 'classroom',
      nome: 'Google Classroom',
      tipo: 'Ambiente Virtual de Aprendizagem (AVA)',
      ativo: true,
      status: 'sincronizado',
      statusTexto: 'Conectado • 5 disciplinas ativas',
      ultimaSinc: 'Hoje às 08:30',
    },
    {
      id: 'sigaa',
      nome: 'Portal SIGAA (UFRPE)',
      tipo: 'Sistema Integrado de Gestão Acadêmica',
      ativo: true,
      status: 'sincronizado',
      statusTexto: 'Conectado • Matrícula ativa',
      ultimaSinc: 'Hoje às 08:30',
    },
    {
      id: 'whatsapp',
      nome: 'WhatsApp Acadêmico',
      tipo: 'Grupos e Comunicados Rápidos',
      ativo: true,
      status: 'sincronizado',
      statusTexto: '3 grupos monitorados',
      ultimaSinc: 'Há 15 min',
    },
    {
      id: 'discord',
      nome: 'Discord de Turma',
      tipo: 'Canais de Monitores e Dúvidas',
      ativo: false,
      status: 'erro',
      statusTexto: 'Requer autenticação',
      ultimaSinc: 'Não sincronizado',
    },
  ]);

  const [sincronizando, setSincronizando] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);

  useEffect(() => {
    let intervalo: ReturnType<typeof setInterval>;
    if (cooldown > 0) {
      intervalo = setInterval(() => {
        setCooldown((tempoRestante) => tempoRestante - 1);
      }, 1000);
    }
    return () => clearInterval(intervalo);
  }, [cooldown]);

  const alternarStatusFonte = (id: string) => {
    setFontes((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ativo: !item.ativo } : item
      )
    );
  };

  const executarSincronizacaoGlobal = () => {
    if (cooldown > 0) {
      const minutos = Math.floor(cooldown / 60);
      const segundos = cooldown % 60;
      Alert.alert(
        'Cooldown Ativo',
        `Aguarde ${minutos}m ${segundos}s para efetuar uma nova sincronização sem sobrecarregar as APIs institucionais.`
      );
      return;
    }

    setSincronizando(true);

    setTimeout(() => {
      setSincronizando(false);
      setCooldown(300);
      setFontes((prev) =>
        prev.map((item) =>
          item.ativo
            ? {
                ...item,
                status: 'sincronizado',
                statusTexto: 'Conectado e atualizado',
                ultimaSinc: 'Agora há pouco',
              }
            : item
        )
      );
      Alert.alert(
        'Sincronização Concluída',
        'As informações das plataformas ativas foram consolidadas com sucesso no ASTRA.'
      );
    }, 1500);
  };

  const formatarTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min}:${seg < 10 ? '0' : ''}${seg}`;
  };

  const selecionarArquivoIcs = () => {
    Alert.alert(
      'Importação de Calendário (.ics)',
      'Selecione um arquivo de extensão .ics válido (máximo de 5 MB e não vazio) para integrar prazos ao calendário.'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <TopHeader
          title="Hub de Fontes"
          subtitle="Sincronização & Provedores Externos"
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.bannerInfo}>
            <Text style={styles.bannerTitulo}>Central de Conectores</Text>
            <Text style={styles.bannerDescricao}>
              Conecte suas fontes oficiais e informais para que o ASTRA extraia avisos e agrupe atividades de forma unificada.
            </Text>
          </View>

          <View style={styles.secaoHeader}>
            <Text style={styles.secaoTitulo}>Plataformas Acadêmicas</Text>
            <Text style={styles.secaoContador}>
              {fontes.filter((f) => f.ativo).length} de {fontes.length} ativas
            </Text>
          </View>

          <View style={styles.listaFontes}>
            {fontes.map((item) => (
              <View key={item.id} style={styles.cardFonte}>
                <View style={styles.cardLinhaSuperior}>
                  <View style={styles.infoFonte}>
                    <Text style={styles.nomeFonte}>{item.nome}</Text>
                    <Text style={styles.tipoFonte}>{item.tipo}</Text>
                  </View>
                  <Switch
                    value={item.ativo}
                    onValueChange={() => alternarStatusFonte(item.id)}
                    trackColor={{ false: PALETA.borderLight, true: PALETA.inputBorder }}
                    thumbColor={item.ativo ? PALETA.primary : PALETA.white}
                  />
                </View>

                {item.ativo ? (
                  <View style={styles.cardLinhaInferior}>
                    <View style={styles.statusIndicador}>
                      <View
                        style={[
                          styles.statusPonto,
                          {
                            backgroundColor:
                              item.status === 'sincronizado'
                                ? PALETA.success
                                : item.status === 'sincronizando'
                                ? PALETA.warning
                                : PALETA.error,
                          },
                        ]}
                      />
                      <Text style={styles.statusTexto}>{item.statusTexto}</Text>
                    </View>
                    <Text style={styles.ultimaSincTexto}>{item.ultimaSinc}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>

          <Pressable
            onPress={executarSincronizacaoGlobal}
            disabled={cooldown > 0 || sincronizando}
            style={({ pressed }) => [
              styles.btnSincronizar,
              cooldown > 0 && styles.btnDesabilitado,
              pressed && cooldown === 0 && styles.pressed,
            ]}
          >
            <Text style={styles.btnSincronizarTexto}>
              {sincronizando
                ? 'Sincronizando plataformas...'
                : cooldown > 0
                ? `Aguarde Cooldown (${formatarTempo(cooldown)})`
                : 'Sincronizar Todas as Fontes Agora'}
            </Text>
          </Pressable>

          <View style={styles.cardUpload}>
            <View style={styles.uploadInfo}>
              <Text style={styles.uploadTitulo}>Importação de Calendário (.ics)</Text>
              <Text style={styles.uploadDescricao}>
                Compatível com arquivos exportados do Google Agenda ou SIGAA (limite de 5 MB).
              </Text>
            </View>
            <Pressable
              onPress={selecionarArquivoIcs}
              style={({ pressed }) => [
                styles.btnUpload,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.btnUploadTexto}>Upload .ics</Text>
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
  bannerInfo: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: PALETA.backgroundCard,
    borderWidth: 1,
    borderColor: PALETA.cardBorder,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 4,
  },
  bannerTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETA.text,
  },
  bannerDescricao: {
    fontSize: 12,
    color: PALETA.textSecondary,
    lineHeight: 18,
  },
  secaoHeader: {
    width: '90%',
    maxWidth: 420,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  secaoTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETA.text,
  },
  secaoContador: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETA.textSecondary,
  },
  listaFontes: {
    width: '90%',
    maxWidth: 420,
    gap: 12,
    marginBottom: 16,
  },
  cardFonte: {
    backgroundColor: PALETA.white,
    borderWidth: 1,
    borderColor: PALETA.cardBorder,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  cardLinhaSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoFonte: {
    flex: 1,
    paddingRight: 10,
  },
  nomeFonte: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETA.text,
  },
  tipoFonte: {
    fontSize: 11.5,
    color: PALETA.textSecondary,
    marginTop: 2,
  },
  cardLinhaInferior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: PALETA.borderLight,
  },
  statusIndicador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPonto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusTexto: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETA.textSecondary,
  },
  ultimaSincTexto: {
    fontSize: 11,
    color: PALETA.textMuted,
  },
  btnSincronizar: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: PALETA.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  btnDesabilitado: {
    backgroundColor: PALETA.textMuted,
  },
  btnSincronizarTexto: {
    color: PALETA.white,
    fontSize: 14,
    fontWeight: '700',
  },
  cardUpload: {
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
    gap: 12,
  },
  uploadInfo: {
    flex: 1,
  },
  uploadTitulo: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETA.text,
  },
  uploadDescricao: {
    fontSize: 11.5,
    color: PALETA.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  btnUpload: {
    backgroundColor: PALETA.white,
    borderWidth: 1,
    borderColor: PALETA.inputBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnUploadTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETA.primary,
  },
  pressed: {
    opacity: 0.75,
  },
});
