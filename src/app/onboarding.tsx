import { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';

import Input from '../components/Input';
import Button from '../components/Button';
import { auth, db } from '../services/firebase';

export interface OnboardingScreenProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export default function OnboardingScreen(props: OnboardingScreenProps) {
  const router = useRouter();

  // Estados dos campos de perfil acadêmico
  const [curso, setCurso] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [metaHoras, setMetaHoras] = useState('');
  const [metodoAnotacao, setMetodoAnotacao] = useState<'Digital' | 'Papel' | 'Híbrido'>('Digital');

  // Canais de integração ativos
  const [canais, setCanais] = useState<string[]>(['SIGAA']);

  // Estados de feedback visual (Erros, Sucesso e Loading)
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  const toggleCanal = (nomeCanal: string) => {
    if (canais.includes(nomeCanal)) {
      setCanais(canais.filter((c) => c !== nomeCanal));
    } else {
      setCanais([...canais, nomeCanal]);
    }
  };

  const handleSalvarPerfil = async () => {
    setErro('');
    setSucesso('');

    // Validações defensivas
    if (!curso.trim()) {
      setErro('Por favor, informe seu curso de graduação.');
      return;
    }

    if (!periodo.trim()) {
      setErro('Informe o período letivo atual (ex: 3º Período).');
      return;
    }

    if (!metaHoras.trim() || isNaN(Number(metaHoras)) || Number(metaHoras) <= 0) {
      setErro('Informe uma meta diária válida de estudo em horas.');
      return;
    }

    if (canais.length === 0) {
      setErro('Selecione pelo menos um canal de integração.');
      return;
    }

    const usuario = auth?.currentUser;

    if (!usuario) {
      setErro('Não foi possível identificar sua conta. Faça login novamente.');
      return;
    }

    if (!db) {
      setErro('O banco de dados não foi inicializado corretamente.');
      return;
    }

    setCarregando(true);

    try {
      const uid = usuario.uid;

      const estudanteRef = doc(db, 'estudantes', uid);
      const perfilRef = doc(db, 'perfisAprendizagem', uid);

      const batch = writeBatch(db);

      batch.set(
        estudanteRef,
        {
          id: uid,
          nome: usuario.displayName ?? 'Estudante',
          email: usuario.email ?? '',
          dataCadastro: serverTimestamp(),
        },
        { merge: true }
      );

      batch.set(
        perfilRef,
        {
          estudanteId: uid,
          curso: curso.trim(),
          periodo: periodo.trim(),
          metaHoras: Number(metaHoras),
          metodoAnotacao,
          canais: [...canais],
          dataIdentificacao: serverTimestamp(),
        },
        { merge: true }
      );

      await batch.commit();

      setSucesso('Perfil configurado com sucesso! Redirecionando...');
      setTimeout(() => {
        router.replace('/telainicial');
      }, 1200);
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      setErro('Não foi possível salvar seu perfil. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.root, props.style]}>
          {/* Faixa do Topo (Header) igual ao Login */}
          <View style={styles.header} />

          <Text style={styles.tituloPrincipal}>Configuração Inicial</Text>

          <Text style={styles.subtitulo}>
            Personalize sua rotina no ASTRA para calibrar suas notificações e metas de estudo.
          </Text>

          {/* Feedbacks Visuais */}
          {erro ? <Text style={styles.errorText}>{erro}</Text> : null}
          {sucesso ? <Text style={styles.successText}>{sucesso}</Text> : null}

          <View style={styles.formBox}>
            {/* Campo: Curso */}
            <View style={styles.field}>
              <Text style={styles.label}>Curso de Graduação *</Text>
              <Input
                placeholder="Ex: Bacharelado em BSI"
                value={curso}
                onChangeText={(text) => {
                  setCurso(text);
                  if (erro) setErro('');
                }}
              />
            </View>

            {/* Campo: Período */}
            <View style={styles.field}>
              <Text style={styles.label}>Período Atual *</Text>
              <Input
                placeholder="Ex: 3º Período"
                value={periodo}
                onChangeText={(text) => {
                  setPeriodo(text);
                  if (erro) setErro('');
                }}
              />
            </View>

            {/* Campo: Meta de Horas */}
            <View style={styles.field}>
              <Text style={styles.label}>Meta Diária de Estudos (horas) *</Text>
              <Input
                placeholder="Ex: 4"
                keyboardType="numeric"
                value={metaHoras}
                onChangeText={(text) => {
                  setMetaHoras(text);
                  if (erro) setErro('');
                }}
              />
            </View>

            {/* Método de Anotação */}
            <View style={styles.field}>
              <Text style={styles.label}>Método Principal de Anotação</Text>
              <View style={styles.opcoesContainer}>
                {(['Digital', 'Papel', 'Híbrido'] as const).map((opcao) => (
                  <TouchableOpacity
                    key={opcao}
                    style={[
                      styles.chip,
                      metodoAnotacao === opcao && styles.chipSelecionado,
                    ]}
                    onPress={() => setMetodoAnotacao(opcao)}
                  >
                    <Text
                      style={[
                        styles.chipTexto,
                        metodoAnotacao === opcao && styles.chipTextoSelecionado,
                      ]}
                    >
                      {opcao}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Canais de Integração */}
            <View style={styles.field}>
              <Text style={styles.label}>Canais Acadêmicos Utilizados *</Text>
              <View style={styles.opcoesContainer}>
                {['SIGAA', 'Google Classroom', 'WhatsApp', 'Discord'].map((canal) => {
                  const selecionado = canais.includes(canal);
                  return (
                    <TouchableOpacity
                      key={canal}
                      style={[styles.chip, selecionado && styles.chipSelecionado]}
                      onPress={() => toggleCanal(canal)}
                    >
                      <Text
                        style={[
                          styles.chipTexto,
                          selecionado && styles.chipTextoSelecionado,
                        ]}
                      >
                        {canal}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Botão de Conclusão */}
            <View style={styles.actionContainer}>
              {carregando ? (
                <ActivityIndicator
                  size="small"
                  color="#1D2A44"
                  style={{ marginVertical: 10 }}
                />
              ) : (
                <Button title="Concluir e Ir para o Painel" onPress={handleSalvarPerfil} />
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
  },
  root: {
    width: '100%',
    flexGrow: 1,
    paddingBottom: 70,
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FDFFFF',
  },
  header: {
    width: '100%',
    height: 70,
    backgroundColor: '#9AD9EB',
  },
  tituloPrincipal: {
    color: '#000000',
    fontSize: 25,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  subtitulo: {
    color: '#333333',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '400',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  formBox: {
    width: '85%',
    maxWidth: 380,
    padding: 20,
    gap: 14,
    borderRadius: 12,
    backgroundColor: '#E5F4F8',
    borderWidth: 1,
    borderColor: '#D4EBF3',
  },
  field: {
    width: '100%',
    gap: 6,
  },
  label: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '500',
  },
  opcoesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#B0D8E6',
    backgroundColor: '#FDFFFF',
  },
  chipSelecionado: {
    backgroundColor: '#9AD9EB',
    borderColor: '#72C4DC',
  },
  chipTexto: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '500',
  },
  chipTextoSelecionado: {
    color: '#000000',
    fontWeight: '600',
  },
  actionContainer: {
    marginTop: 8,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  successText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});