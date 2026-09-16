import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function OnboardingScreen() {
  const router = useRouter();

  // Estados dos campos de perfil acadêmico
  const [curso, setCurso] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [metaHoras, setMetaHoras] = useState('');
  const [metodoAnotacao, setMetodoAnotacao] = useState<'Digital' | 'Papel' | 'Híbrido'>('Digital');
  
  // Canais de integração ativos
  const [canais, setCanais] = useState<string[]>(['SIGAA']);

  // Estados de feedback visual (Erros e Sucesso)
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const toggleCanal = (nomeCanal: string) => {
    if (canais.includes(nomeCanal)) {
      setCanais(canais.filter((c) => c !== nomeCanal));
    } else {
      setCanais([...canais, nomeCanal]);
    }
  };

  const handleSalvarPerfil = () => {
    setErro(null);

    // Validações defensivas de preenchimento
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
      setErro('Selecione pelo menos um canal de integração para sincronização.');
      return;
    }

    setCarregando(true);

    // Simulação de persistência das configurações do estudante
    setTimeout(() => {
      setCarregando(false);
      setSucesso(true);

      // Transição automática para a tela inicial
      setTimeout(() => {
        router.replace('/telainicial');
      }, 1200);
    }, 800);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.card}>
        <Text style={styles.title}>Configuração Inicial</Text>
        <Text style={styles.subtitle}>
          Personalize sua rotina acadêmica no ASTRA para calibrar suas notificações e metas.
        </Text>

        {/* Bloco de Mensagem de Erro */}
        {erro && (
          <View style={styles.erroBox}>
            <Text style={styles.erroTexto}>{erro}</Text>
          </View>
        )}

        {/* Bloco de Confirmação de Sucesso */}
        {sucesso && (
          <View style={styles.sucessoBox}>
            <Text style={styles.sucessoTexto}>Perfil configurado com sucesso! Redirecionando...</Text>
          </View>
        )}

        {/* Campo: Curso */}
        <Text style={styles.label}>Curso de Graduação *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Bacharelado em Sistemas de Informação"
          placeholderTextColor="#8F9BB3"
          value={curso}
          onChangeText={setCurso}
        />

        {/* Campo: Período */}
        <Text style={styles.label}>Período Atual *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 3º Período"
          placeholderTextColor="#8F9BB3"
          value={periodo}
          onChangeText={setPeriodo}
        />

        {/* Campo: Meta diária de horas */}
        <Text style={styles.label}>Meta Diária de Estudos (horas) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 4"
          placeholderTextColor="#8F9BB3"
          keyboardType="numeric"
          value={metaHoras}
          onChangeText={setMetaHoras}
        />

        {/* Seleção de Método de Anotação */}
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

        {/* Seleção de Canais de Integração */}
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

        {/* Botão de Submissão */}
        <TouchableOpacity
          style={[styles.botao, (carregando || sucesso) && styles.botaoDesabilitado]}
          onPress={handleSalvarPerfil}
          disabled={carregando || sucesso}
        >
          {carregando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.botaoTexto}>Concluir e Ir para o Painel</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#F4FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#003366',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#41689E',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  erroBox: {
    backgroundColor: '#FFEBEE',
    borderColor: '#E53935',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  erroTexto: {
    color: '#C62828',
    fontSize: 13,
    fontWeight: '500',
  },
  sucessoBox: {
    backgroundColor: '#E8F5E9',
    borderColor: '#43A047',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  sucessoTexto: {
    color: '#2E7D32',
    fontSize: 13,
    fontWeight: '500',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A4B7C',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: '#C9F7FF',
    backgroundColor: '#FDFAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#201D2A',
  },
  opcoesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#9AD9EB',
    backgroundColor: '#FFFFFF',
  },
  chipSelecionado: {
    backgroundColor: '#003366',
    borderColor: '#003366',
  },
  chipTexto: {
    fontSize: 12,
    color: '#2A4B7C',
    fontWeight: '500',
  },
  chipTextoSelecionado: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  botao: {
    backgroundColor: '#003366',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  botaoDesabilitado: {
    backgroundColor: '#6EA1C5',
  },
  botaoTexto: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});