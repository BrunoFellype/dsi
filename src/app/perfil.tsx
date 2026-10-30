import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Switch, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { deleteUser, signOut, updateProfile, verifyBeforeUpdateEmail } from 'firebase/auth';
import { deleteDoc, doc, getDoc, writeBatch } from 'firebase/firestore';

import { NAO_INFORMADO_TEXTO, Seletor } from '@/components/seletor';
import { Botao, Cabecalho, Campo, Cartao, Icone, Mensagem, Selo, Tela, Txt, type IconName } from '@/components/ui';
import { CURSOS, PERIODOS } from '@/lib/opcoes';
import { useTheme } from '@/hooks/use-theme';
import { lembretesDisponiveis } from '@/lib/lembretes';
import { useAstra } from '@/lib/store';
import { auth, db } from '@/services/firebase';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CampoEditando = 'nome' | 'email' | 'curso' | 'periodo' | null;

export default function Perfil() {
  const { sessao, sair, lembretes, alternarLembretes, resumoDiario, alternarResumoDiario } = useAstra();
  const t = useTheme();

  const usuario = auth.currentUser;
  const [nome, setNome] = useState(usuario?.displayName ?? 'Estudante');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [curso, setCurso] = useState('');
  const [periodo, setPeriodo] = useState('');

  const [carregando, setCarregando] = useState(sessao === 'logado');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Controla qual campo específico está sendo editado no modal
  const [campoAtivo, setCampoAtivo] = useState<CampoEditando>(null);
  const [tempValor, setTempValor] = useState('');
  const [buscaCurso, setBuscaCurso] = useState('');

  const iniciais = nome
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');

  useEffect(() => {
    if (sessao !== 'logado' || !usuario) return;
    getDoc(doc(db, 'perfisAprendizagem', usuario.uid))
      .then((snap) => {
        if (snap.exists()) {
          setCurso(snap.data().curso ?? '');
          setPeriodo(snap.data().periodo ?? '');
        }
      })
      .catch(() => setErro('Não foi possível carregar o perfil.'))
      .finally(() => setCarregando(false));
  }, [sessao]);

  // Lista de cursos filtrada pela busca em tempo real
  const cursosFiltrados = useMemo(() => {
    const listaBase = tempValor && tempValor !== NAO_INFORMADO_TEXTO && !CURSOS.includes(tempValor)
      ? [tempValor, ...CURSOS]
      : CURSOS;

    if (!buscaCurso.trim()) return listaBase;
    return listaBase.filter((c) => c.toLowerCase().includes(buscaCurso.trim().toLowerCase()));
  }, [buscaCurso, tempValor]);

  async function salvarAlteracao(novoCurso?: string, novoPeriodo?: string) {
    if (!usuario) return router.replace('/login');
    setErro('');
    setSucesso('');
    setSalvando(true);

    try {
      const nomeFinal = campoAtivo === 'nome' ? tempValor.trim() : nome;
      const emailFinal = campoAtivo === 'email' ? tempValor.trim().toLowerCase() : email;
      const cursoFinal = novoCurso !== undefined ? novoCurso : curso;
      const periodoFinal = novoPeriodo !== undefined ? novoPeriodo : periodo;

      if (campoAtivo === 'email') {
        if (!EMAIL_VALIDO.test(emailFinal)) {
          setSalvando(false);
          return setErro('Informe um e-mail válido.');
        }
        await verifyBeforeUpdateEmail(usuario, emailFinal);
      }

      if (campoAtivo === 'nome' && nomeFinal !== usuario.displayName) {
        await updateProfile(usuario, { displayName: nomeFinal });
      }

      const lote = writeBatch(db);
      lote.update(doc(db, 'estudantes', usuario.uid), { nome: nomeFinal, email: emailFinal });
      lote.update(doc(db, 'perfisAprendizagem', usuario.uid), {
        curso: cursoFinal.trim() || NAO_INFORMADO_TEXTO,
        periodo: periodoFinal.trim() || NAO_INFORMADO_TEXTO,
      });
      await lote.commit();

      if (campoAtivo === 'nome') setNome(nomeFinal);
      if (campoAtivo === 'email') setEmail(emailFinal);
      if (novoCurso !== undefined) setCurso(cursoFinal);
      if (novoPeriodo !== undefined) setPeriodo(periodoFinal);

      setSucesso('Alteração salva com sucesso.');
      setCampoAtivo(null);
    } catch (e: any) {
      if (e?.code === 'auth/requires-recent-login') setErro('Por segurança, entre de novo antes de alterar dados sensíveis.');
      else if (e?.code === 'auth/email-already-in-use') setErro('Esse e-mail já está em uso.');
      else setErro('Não foi possível salvar. Verifique sua conexão.');
    } finally {
      setSalvando(false);
    }
  }

  function abrirEdicao(campo: CampoEditando, valorAtual: string) {
    setCampoAtivo(campo);
    setTempValor(valorAtual);
    setBuscaCurso('');
    setErro('');
    setSucesso('');
  }

  async function sairDaConta() {
    await signOut(auth).catch(() => {});
    sair();
    router.replace('/login');
  }

  async function excluirPerfil() {
    if (!usuario) return router.replace('/login');
    try {
      await deleteDoc(doc(db, 'perfisAprendizagem', usuario.uid));
      setCurso('');
      setPeriodo('');
      router.replace('/onboarding');
    } catch {
      setErro('Não foi possível excluir o perfil.');
    }
  }

  async function excluirConta() {
    if (!usuario) return router.replace('/login');
    try {
      const lote = writeBatch(db);
      lote.delete(doc(db, 'estudantes', usuario.uid));
      lote.delete(doc(db, 'perfisAprendizagem', usuario.uid));
      await lote.commit();
      await AsyncStorage.removeItem(`astra:v1:${usuario.uid}`).catch(() => {});
      await deleteUser(usuario);
      sair();
      router.replace('/login');
    } catch {
      setErro('Não foi possível excluir a conta.');
    }
  }

  function confirmarExclusao(titulo: string, texto: string, acao: () => void) {
    // Se estiver rodando na Web, usa o confirm nativo do navegador
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmado = window.confirm(`${titulo}\n\n${texto}`);
      if (confirmado) {
        acao();
      }
      return;
    }

    // No mobile nativo, usa o Alert do React Native
    Alert.alert(titulo, texto, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: acao },
    ]);
  }

  if (carregando) {
    return (
      <Tela>
        <Cabecalho titulo="" voltar={() => router.back()} />
        <Cartao style={{ alignItems: 'center', padding: 24 }}>
          <Txt cor="textSecondary">Carregando dados do perfil...</Txt>
        </Cartao>
      </Tela>
    );
  }

  return (
    <Tela>
      <Cabecalho titulo="" voltar={() => router.back()} />

      {/* CABEÇALHO DO USUÁRIO CENTRALIZADO */}
      <View style={{ alignItems: 'center', marginVertical: 8, gap: 6 }}>
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: 42,
            backgroundColor: t.primary,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Txt style={{ color: '#fff', fontSize: 30, fontWeight: '700' }}>{iniciais || 'A'}</Txt>
        </View>

        <Txt v="subtitulo" style={{ fontSize: 20, fontWeight: '700' }}>
          {nome}
        </Txt>

        {email ? (
          <Txt v="legenda" cor="textSecondary">
            {email}
          </Txt>
        ) : null}
      </View>

      {erro ? <Mensagem tom="erro" texto={erro} /> : null}
      {sucesso ? <Mensagem tom="sucesso" texto={sucesso} /> : null}

      {/* CÉLULAS INDIVIDUAIS DE INFORMAÇÕES */}
      <Cartao style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
        <LinhaInfo
          icone="person-outline"
          rotulo="Nome"
          valor={nome}
          onPress={() => abrirEdicao('nome', nome)}
        />
        <View style={{ height: 1, backgroundColor: t.border, opacity: 0.4 }} />
        <LinhaInfo
          icone="mail-outline"
          rotulo="E-mail"
          valor={email}
          onPress={() => abrirEdicao('email', email)}
        />
        <View style={{ height: 1, backgroundColor: t.border, opacity: 0.4 }} />
        <LinhaInfo
          icone="school-outline"
          rotulo="Curso"
          valor={curso || NAO_INFORMADO_TEXTO}
          onPress={() => abrirEdicao('curso', curso)}
        />
        <View style={{ height: 1, backgroundColor: t.border, opacity: 0.4 }} />
        <LinhaInfo
          icone="calendar-outline"
          rotulo="Período"
          valor={periodo || NAO_INFORMADO_TEXTO}
          onPress={() => abrirEdicao('periodo', periodo)}
        />
      </Cartao>

      {/* CONFIGURAÇÕES DE NOTIFICAÇÕES */}
      <CartaoLembretes
        lembretes={lembretes}
        resumoDiario={resumoDiario}
        onLembretes={alternarLembretes}
        onResumo={alternarResumoDiario}
      />

      {/* ZONA DE CONTA E SEGURANÇA */}
      <Cartao style={{ gap: 12 }}>
        <Txt v="subtitulo">Ações da conta</Txt>
        <Txt v="legenda">
          Excluir o perfil apenas reseta suas configurações e exige um novo onboarding; excluir a conta apaga tudo permanentemente.
        </Txt>
        <Botao
          titulo="Excluir perfil de aprendizagem"
          variante="perigo"
          desabilitado={salvando}
          onPress={() =>
            confirmarExclusao('Excluir perfil?', 'Seu curso e período serão apagados.', excluirPerfil)
          }
        />
        <Botao
          titulo="Excluir minha conta"
          variante="perigo"
          desabilitado={salvando}
          onPress={() =>
            confirmarExclusao(
              'Excluir conta?',
              'Sua conta, seu perfil e os dados deste aparelho serão apagados. Não dá para desfazer.',
              excluirConta
            )
          }
        />
      </Cartao>

      <Botao titulo="Sair da conta" icone="log-out-outline" variante="perigo" onPress={sairDaConta} />
      
      {/* MODAL DE EDIÇÃO DIRETA (SLIDE BOTTOM SHEET) */}
      <Modal visible={campoAtivo !== null} animationType="slide" transparent={true} onRequestClose={() => setCampoAtivo(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          {/* Fundo escuro clicável para fechar ao tocar fora */}
          <Pressable style={{ flex: 1 }} onPress={() => setCampoAtivo(null)} />

          {/* Conteúdo do Modal */}
          <View style={{ backgroundColor: t.background, padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 16, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt v="subtitulo" style={{ fontSize: 18 }}>
                {campoAtivo === 'nome' && 'Editar Nome'}
                {campoAtivo === 'email' && 'Editar E-mail'}
                {campoAtivo === 'curso' && 'Selecionar Curso'}
                {campoAtivo === 'periodo' && 'Selecionar Período'}
              </Txt>
              <Pressable onPress={() => setCampoAtivo(null)} hitSlop={10}>
                <Icone nome="close-outline" tamanho={24} cor="textMuted" />
              </Pressable>
            </View>

            {/* EDIÇÃO DE NOME E E-MAIL */}
            {campoAtivo === 'nome' || campoAtivo === 'email' ? (
              <View style={{ gap: 12 }}>
                <Campo
                  rotulo={campoAtivo === 'nome' ? 'Seu nome' : 'Seu e-mail'}
                  value={tempValor}
                  onChangeText={setTempValor}
                  autoFocus={true}
                  keyboardType={campoAtivo === 'email' ? 'email-address' : 'default'}
                  autoCapitalize={campoAtivo === 'email' ? 'none' : 'words'}
                />
                <Botao titulo="Salvar alteração" onPress={() => salvarAlteracao()} carregando={salvando} />
              </View>
            ) : null}

            {/* EDIÇÃO DE CURSO COM BUSCA E ROLAGEM */}
            {campoAtivo === 'curso' ? (
              <View style={{ gap: 12, flexShrink: 1 }}>
                <Campo
                  rotulo="Buscar curso"
                  value={buscaCurso}
                  onChangeText={setBuscaCurso}
                  placeholder="Digite para filtrar..."
                  autoFocus={true}
                />
                <ScrollView style={{ maxHeight: 300 }} keyboardShouldPersistTaps="handled">
                  <View style={{ gap: 8 }}>
                    {cursosFiltrados.map((item) => (
                      <Pressable
                        key={item}
                        onPress={() => {
                          setTempValor(item);
                          salvarAlteracao(item, undefined);
                        }}
                        style={{
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderRadius: 8,
                          backgroundColor: tempValor === item ? t.primary + '15' : 'transparent',
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Txt cor={tempValor === item ? 'primary' : 'text'} style={{ fontWeight: tempValor === item ? '700' : '400' }}>
                          {item}
                        </Txt>
                        {tempValor === item ? <Icone nome="checkmark-outline" tamanho={18} cor="primary" /> : null}
                      </Pressable>
                    ))}
                    {cursosFiltrados.length === 0 ? (
                      <Txt cor="textMuted" style={{ textAlign: 'center', marginVertical: 16 }}>
                        Nenhum curso encontrado.
                      </Txt>
                    ) : null}
                  </View>
                </ScrollView>
              </View>
            ) : null}

            {/* EDIÇÃO DE PERÍODO COM ROLAGEM (SEM PESQUISA) */}
            {campoAtivo === 'periodo' ? (
              <ScrollView style={{ maxHeight: 300 }} keyboardShouldPersistTaps="handled">
                <View style={{ gap: 8 }}>
                  {PERIODOS.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => {
                        setTempValor(item);
                        salvarAlteracao(undefined, item);
                      }}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                        backgroundColor: tempValor === item ? t.primary + '15' : 'transparent',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Txt cor={tempValor === item ? 'primary' : 'text'} style={{ fontWeight: tempValor === item ? '700' : '400' }}>
                        {item}
                      </Txt>
                      {tempValor === item ? <Icone nome="checkmark-outline" tamanho={18} cor="primary" /> : null}
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </Tela>
  );
}

function LinhaInfo({
  icone,
  rotulo,
  valor,
  onPress,
}: {
  icone: IconName;
  rotulo: string;
  valor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
      }}
    >
      <Icone nome={icone} tamanho={22} cor="primary" />
      <View style={{ flex: 1 }}>
        <Txt v="legenda" cor="textSecondary">
          {rotulo}
        </Txt>
        <Txt v="corpo" style={{ fontWeight: '500' }}>
          {valor}
        </Txt>
      </View>
      <Icone nome="chevron-forward-outline" tamanho={18} cor="textMuted" />
    </Pressable>
  );
}

function CartaoLembretes({
  lembretes,
  resumoDiario,
  onLembretes,
  onResumo,
}: {
  lembretes: boolean;
  resumoDiario: boolean;
  onLembretes: (ligar: boolean) => Promise<boolean>;
  onResumo: (ligar: boolean) => Promise<boolean>;
}) {
  const [erro, setErro] = useState('');
  if (!lembretesDisponiveis) return null;

  async function mudar(acao: (ligar: boolean) => Promise<boolean>, ligar: boolean) {
    setErro('');
    if (!(await acao(ligar))) setErro('Sem permissão para notificações. Ative nas configurações do celular.');
  }

  return (
    <Cartao style={{ gap: 16 }}>
      <LinhaInterruptor
        titulo="Lembretes de prazo"
        texto="Avisa 1 dia e 2 horas antes de cada prazo."
        valor={lembretes}
        onChange={(v) => mudar(onLembretes, v)}
      />
      <LinhaInterruptor
        titulo="Resumo diário"
        texto="Às 7h30, lista os prazos do dia."
        valor={resumoDiario}
        onChange={(v) => mudar(onResumo, v)}
      />
      {erro ? <Mensagem tom="erro" texto={erro} /> : null}
    </Cartao>
  );
}

function LinhaInterruptor({
  titulo,
  texto,
  valor,
  onChange,
}: {
  titulo: string;
  texto: string;
  valor: boolean;
  onChange: (v: boolean) => void;
}) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Txt v="subtitulo">{titulo}</Txt>
        <Txt v="legenda" cor="textSecondary">
          {texto}
        </Txt>
      </View>
      <Switch
        value={valor}
        onValueChange={onChange}
        accessibilityLabel={titulo}
        trackColor={{ true: t.primary, false: t.border }}
      />
    </View>
  );
}