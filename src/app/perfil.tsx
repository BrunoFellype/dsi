import React, { useEffect, useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { deleteUser, signOut, updateProfile, verifyBeforeUpdateEmail } from 'firebase/auth';
import { deleteDoc, doc, getDoc, writeBatch } from 'firebase/firestore';

import { NAO_INFORMADO_TEXTO, Seletor } from '@/components/seletor';
import { Botao, Cabecalho, Campo, Cartao, Mensagem, Selo, Tela, Txt } from '@/components/ui';
import { CURSOS, PERIODOS } from '@/lib/opcoes';
import { useTheme } from '@/hooks/use-theme';
import { lembretesDisponiveis } from '@/lib/lembretes';
import { useAstra } from '@/lib/store';
import { auth, db } from '@/services/firebase';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Perfil() {
  const { sessao, sair, lembretes, alternarLembretes, resumoDiario, alternarResumoDiario } = useAstra();
  const [nome, setNome] = useState(auth.currentUser?.displayName ?? '');
  const [email, setEmail] = useState(auth.currentUser?.email ?? '');
  const [curso, setCurso] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [editando, setEditando] = useState(false);
  const [carregando, setCarregando] = useState(sessao === 'logado');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    const usuario = auth.currentUser;
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

  async function salvar() {
    const usuario = auth.currentUser;
    if (!usuario) return router.replace('/login');
    const emailNovo = email.trim().toLowerCase();
    if (!nome.trim() || !emailNovo) return setErro('Preencha nome e e-mail.');
    if (!EMAIL_VALIDO.test(emailNovo)) return setErro('Informe um e-mail válido.');

    setErro('');
    setSucesso('');
    setSalvando(true);
    try {
      if (nome.trim() !== (usuario.displayName ?? '')) await updateProfile(usuario, { displayName: nome.trim() });
      if (emailNovo !== (usuario.email ?? '').toLowerCase()) await verifyBeforeUpdateEmail(usuario, emailNovo);

      const lote = writeBatch(db);
      lote.update(doc(db, 'estudantes', usuario.uid), { nome: nome.trim(), email: emailNovo });
      lote.update(doc(db, 'perfisAprendizagem', usuario.uid), {
        curso: curso.trim() || NAO_INFORMADO_TEXTO,
        periodo: periodo.trim() || NAO_INFORMADO_TEXTO,
      });
      await lote.commit();

      setEditando(false);
      setSucesso('Perfil atualizado.');
    } catch (e: any) {
      if (e?.code === 'auth/requires-recent-login') setErro('Por segurança, entre de novo antes de trocar o e-mail.');
      else if (e?.code === 'auth/email-already-in-use') setErro('Esse e-mail já está em uso por outra conta.');
      else setErro('Não foi possível salvar. Verifique sua conexão.');
    } finally {
      setSalvando(false);
    }
  }

  async function sairDaConta() {
    await signOut(auth).catch(() => {});
    sair();
    router.replace('/login');
  }

  /** Apaga só o perfil de aprendizagem; o estudante refaz o onboarding. */
  async function excluirPerfil() {
    const usuario = auth.currentUser;
    if (!usuario) return router.replace('/login');
    setErro('');
    setSucesso('');
    setSalvando(true);
    try {
      await deleteDoc(doc(db, 'perfisAprendizagem', usuario.uid));
      setCurso('');
      setPeriodo('');
      setEditando(false);
      router.replace('/onboarding');
    } catch {
      setErro('Não foi possível excluir o perfil. Verifique sua conexão.');
    } finally {
      setSalvando(false);
    }
  }

  /** Apaga o cadastro (documentos no Firestore e a conta de login) e os dados deste aparelho. */
  async function excluirConta() {
    const usuario = auth.currentUser;
    if (!usuario) return router.replace('/login');
    setErro('');
    setSucesso('');
    setSalvando(true);
    try {
      const lote = writeBatch(db);
      lote.delete(doc(db, 'estudantes', usuario.uid));
      lote.delete(doc(db, 'perfisAprendizagem', usuario.uid));
      await lote.commit();
      await AsyncStorage.removeItem(`astra:v1:${usuario.uid}`).catch(() => {});
      await deleteUser(usuario);
      sair();
      router.replace('/login');
    } catch (e: any) {
      if (e?.code === 'auth/requires-recent-login') setErro('Por segurança, saia e entre de novo antes de excluir a conta.');
      else setErro('Não foi possível excluir a conta. Verifique sua conexão.');
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao(titulo: string, texto: string, acao: () => void) {
    Alert.alert(titulo, texto, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: acao },
    ]);
  }

  if (sessao === 'demo') {
    return (
      <Tela>
        <Cabecalho titulo="Perfil" voltar={() => router.back()} />
        <Cartao>
          <Selo rotulo="Modo demonstração" tom="primario" />
          <Txt cor="textSecondary">Você está vendo dados de exemplo. Crie uma conta para guardar suas informações.</Txt>
        </Cartao>
        <CartaoLembretes
          lembretes={lembretes}
          resumoDiario={resumoDiario}
          onLembretes={alternarLembretes}
          onResumo={alternarResumoDiario}
        />
        <Botao titulo="Sair da demonstração" variante="secundario" onPress={sairDaConta} />
      </Tela>
    );
  }

  return (
    <Tela>
      <Cabecalho
        titulo="Perfil"
        voltar={() => router.back()}
        acao={
          !editando && !carregando ? (
            <Botao titulo="Editar" icone="create-outline" variante="secundario" onPress={() => setEditando(true)} />
          ) : undefined
        }
      />

      <Cartao style={{ gap: 16 }}>
        <Campo rotulo="Nome" value={nome} onChangeText={setNome} editable={editando && !salvando} autoCapitalize="words" />
        <Campo rotulo="E-mail" value={email} onChangeText={setEmail} editable={editando && !salvando} keyboardType="email-address" autoCapitalize="none" />
        {editando ? (
          <>
            <Seletor
              rotulo="Curso"
              opcoes={curso && curso !== NAO_INFORMADO_TEXTO && !CURSOS.includes(curso) ? [curso, ...CURSOS] : CURSOS}
              valor={curso}
              onChange={setCurso}
              placeholderOutro="Nome do curso"
            />
            <Seletor rotulo="Período" opcoes={PERIODOS} valor={periodo} onChange={setPeriodo} placeholderOutro="Ex.: 13º" />
          </>
        ) : (
          <>
            <Campo rotulo="Curso" value={curso || NAO_INFORMADO_TEXTO} editable={false} />
            <Campo rotulo="Período" value={periodo || NAO_INFORMADO_TEXTO} editable={false} />
          </>
        )}
        {erro ? <Mensagem tom="erro" texto={erro} /> : null}
        {sucesso ? <Mensagem tom="sucesso" texto={sucesso} /> : null}
        {editando ? (
          <View style={{ gap: 8 }}>
            <Botao titulo="Salvar" onPress={salvar} carregando={salvando} />
            <Botao titulo="Cancelar" variante="texto" onPress={() => setEditando(false)} desabilitado={salvando} />
          </View>
        ) : null}
      </Cartao>

      <CartaoLembretes
        lembretes={lembretes}
        resumoDiario={resumoDiario}
        onLembretes={alternarLembretes}
        onResumo={alternarResumoDiario}
      />

      <Cartao style={{ gap: 12 }}>
        <Txt v="subtitulo">Excluir dados</Txt>
        <Txt v="legenda" cor="textSecondary">
          O perfil de aprendizagem pode ser excluído sem apagar a conta. Ao excluir, o onboarding aparece de novo.
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
    </Tela>
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
      <Switch value={valor} onValueChange={onChange} accessibilityLabel={titulo} trackColor={{ true: t.primary, false: t.border }} />
    </View>
  );
}
