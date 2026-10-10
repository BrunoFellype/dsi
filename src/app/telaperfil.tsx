import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { auth, db } from '../services/firebase';
import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { signOut, onAuthStateChanged, updateProfile, verifyBeforeUpdateEmail,type User } from 'firebase/auth';
import TopHeader from '../components/TopHeader';
import BottomNav from '../components/BottomNav';

export default function TelaPerfil() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState(auth.currentUser?.email || '');
  const [curso, setCurso] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [modoEscuro, setModoEscuro] = useState(false);
  const [editando, setEditando] = useState(false);

  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usuarioAtual) => {
      const carregarPerfil = async (usuario: User) => {
        try{
          setNome(usuario.displayName ?? '');
          setEmail(usuario.email ?? '');

          const perfilRef = doc(
            db,
            'perfisAprendizagem',
            usuario.uid
          );
          const perfilSnap = await getDoc(perfilRef);

          if (perfilSnap.exists()) {
            const dados = perfilSnap.data();

            setCurso(dados.curso ?? '');
            setPeriodo(dados.periodo ?? '');
          } 
        } catch (erro) {
          console.error('Erro ao carregar perfil:', erro);

          Alert.alert(
            'Erro',
            'Não foi possível carregar os dados do perfil.'
          );
        } finally {
          setCarregando(false);
        }
      };

      if (usuarioAtual) {
        void carregarPerfil(usuarioAtual);
      } else {
        setCarregando(false);
        router.replace('/login');
      }
    });
    return unsubscribe;
  }, []);

  const handleSalvar = async () => {
    const usuario = auth.currentUser;

    if (!usuario) {
      Alert.alert(
        'Sessão expirada',
        'Faça login novamente para atualizar seu perfil.'
      );
      router.replace('/login');
      return;
    }

    const nomeNormalizado = nome.trim();
    const emailNormalizado = email.trim().toLowerCase();
    const cursoNormalizado = curso.trim();
    const periodoNormalizado = periodo.trim();

    if (
      !nomeNormalizado ||
      !emailNormalizado ||
      !cursoNormalizado ||
      !periodoNormalizado
    ) {
      Alert.alert(
        'Campos obrigatórios',
        'Preencha nome, e-mail, curso e período.'
      );
      return;
    }
    
    const formatoEmailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado);

    if (!formatoEmailValido) {
      Alert.alert(
        'E-mail inválido! Informe um endereço de e-mail válido.'
      );
      return;
    }

    try {
      if (nomeNormalizado !== (usuario.displayName ?? '')) {
        await updateProfile(usuario, {
          displayName: nomeNormalizado,
        });
      }

      if (emailNormalizado !== (usuario.email ?? '').toLowerCase()) {
        await verifyBeforeUpdateEmail(usuario, emailNormalizado);
      }

      const estudanteRef = doc(
        db,
        'estudantes',
        usuario.uid
      );

      const perfilRef = doc(
        db,
        'perfisAprendizagem',
        usuario.uid
      );

      const batch = writeBatch(db);

      batch.update(estudanteRef, {
        nome: nomeNormalizado,
        email: emailNormalizado,
      });

      batch.update(perfilRef, {
        curso: cursoNormalizado,
        periodo: periodoNormalizado,
      });

      await batch.commit();

      setNome(nomeNormalizado);
      setEmail(emailNormalizado);
      setCurso(cursoNormalizado);
      setPeriodo(periodoNormalizado);
      setEditando(false);

      Alert.alert(
        'Sucesso! Dados do perfil atualizados com sucesso!'
      );
    } catch (erro: any) {
      console.error('Erro ao atualizar perfil:', erro);

      if (erro.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Autenticação necessária! Por segurança, faça login novamente antes de alterar seu e-mail.'
        );
        return;
      }

      if (erro.code === 'auth/email-already-in-use') {
        Alert.alert(
          'E-mail já cadastrado! Esse endereço de e-mail já está sendo utilizado por outra conta.'
        );
        return;
      }

      if (erro.code === 'auth/invalid-email') {
        Alert.alert(
          'E-mail inválido! O Firebase não aceitou o endereço informado.'
        );
        return;
      }

      Alert.alert(
        'Erro ao salvar! Não foi possível concluir a atualização do perfil. Verifique sua conexão e tente novamente.',
      );
    }
  };

  const handleSair = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    router.replace('/login');
  };

  if (carregando) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.root}>
          <Text style={styles.campoValor}>
            Carregando perfil...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        {/* Faixa Azul Padronizada */}
        <TopHeader
          title="Perfil e Personalização"
          subtitle="Configurações da Conta"
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* CABEÇALHO DO PERFIL (Figura 8) */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <Text style={styles.perfilNome}>{nome}</Text>
            <Text style={styles.perfilEmail}>{email}</Text>
            <View style={styles.badgeUniversidade}>
              <Text style={styles.badgeUniversidadeText}>UFRPE • Discente Ativo</Text>
            </View>
          </View>

          {/* DADOS PESSOAIS (Figura 8) */}
          <View style={styles.cardSecao}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitulo}>Dados Pessoais</Text>
              <Pressable
                style={styles.btnEditar}
                onPress={() => (editando ? handleSalvar() : setEditando(true))}
              >
                <Text style={styles.btnEditarText}>{editando ? '💾 Salvar' : '✏️ Editar'}</Text>
              </Pressable>
            </View>

            <View style={styles.campoGrupo}>
              <Text style={styles.campoLabel}>Nome Completo</Text>
              {editando ? (
                <TextInput
                  style={styles.input}
                  value={nome}
                  onChangeText={setNome}
                  placeholder="Nome do usuário"
                />
              ) : (
                <Text style={styles.campoValor}>{nome}</Text>
              )}
            </View>

            <View style={styles.campoGrupo}>
              <Text style={styles.campoLabel}>E-mail Institucional / Pessoal</Text>
              {editando ? (
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Text style={styles.campoValor}>{email}</Text>
              )}
            </View>
          </View>

          {/* INFORMAÇÕES ACADÊMICAS (Figura 8) */}
          <View style={styles.cardSecao}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitulo}>Informações Acadêmicas</Text>
            </View>

            <View style={styles.campoGrupo}>
              <Text style={styles.campoLabel}>Curso</Text>
              {editando ? (
                <TextInput
                  style={styles.input}
                  value={curso}
                  onChangeText={setCurso}
                />
              ) : (
                <Text style={styles.campoValor}>{curso}</Text>
              )}
            </View>

            <View style={styles.campoGrupo}>
              <Text style={styles.campoLabel}>Período Atual</Text>
              {editando ? (
                <TextInput
                  style={styles.input}
                  value={periodo}
                  onChangeText={setPeriodo}
                />
              ) : (
                <Text style={styles.campoValor}>{periodo}</Text>
              )}
            </View>

            <View style={styles.campoGrupo}>
              <Text style={styles.campoLabel}>Instituição</Text>
              <Text style={styles.campoValor}>Universidade Federal Rural de Pernambuco</Text>
            </View>
          </View>

          {/* PREFERÊNCIAS DE EXIBIÇÃO (Figura 8) */}
          <View style={styles.cardSecao}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitulo}>Preferências de Exibição</Text>
            </View>

            <View style={styles.preferenciaRow}>
              <View>
                <Text style={styles.preferenciaNome}>Tema de Exibição</Text>
                <Text style={styles.preferenciaDesc}>
                  {modoEscuro ? '🌙 Modo Escuro Ativo' : '☀️ Modo Claro Ativo'}
                </Text>
              </View>
              <Switch
                value={modoEscuro}
                onValueChange={setModoEscuro}
                trackColor={{ false: '#CBD5E1', true: '#3873A0' }}
                thumbColor={modoEscuro ? '#1D2A44' : '#FFFFFF'}
              />
            </View>
          </View>

          {/* BOTÃO SAIR DA CONTA (Figura 8) */}
          <Pressable style={styles.btnSair} onPress={handleSair}>
            <Text style={styles.btnSairText}>➔ Sair da conta (Logout)</Text>
          </Pressable>
        </ScrollView>

        <BottomNav />
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
    paddingBottom: 30,
  },

  // AVATAR SECTION
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#9AD9EB',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 40,
  },
  perfilNome: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D2A44',
  },
  perfilEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  badgeUniversidade: {
    backgroundColor: '#E0EEF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
  },
  badgeUniversidadeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3873A0',
  },

  // CARDS SEÇÃO
  cardSecao: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  cardTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D2A44',
  },
  btnEditar: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#E5F4F8',
  },
  btnEditarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3873A0',
  },
  campoGrupo: {
    gap: 2,
  },
  campoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  campoValor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    marginTop: 4,
  },

  // PREFERÊNCIAS
  preferenciaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  preferenciaNome: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D2A44',
  },
  preferenciaDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  // BOTÃO SAIR
  btnSair: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnSairText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
});
