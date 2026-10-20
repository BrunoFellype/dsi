import React, { useState } from 'react';
import { Switch, View } from 'react-native';
import { router } from 'expo-router';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';

import { NAO_INFORMADO_TEXTO, Seletor } from '@/components/seletor';
import { Botao, Cabecalho, Campo, Cartao, Chip, Icone, Mensagem, Tela, Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { fmt } from '@/lib/analise';
import { cofreDisponivel } from '@/lib/cofre';
import { CANAIS, CURSOS, lerHorasMeta, METAS_HORAS, METODOS_ANOTACAO, PERIODOS } from '@/lib/opcoes';
import { cursoDoSigaa, periodoEstimado } from '@/lib/perfilDoSigaa';
import { useAstra } from '@/lib/store';
import { auth, db } from '@/services/firebase';

type Etapa = 'sigaa' | 'perfil';

export default function Onboarding() {
  const { sigaa } = useAstra();
  const conectado = Boolean(sigaa && !sigaa.demo);
  const [etapa, setEtapa] = useState<Etapa>(conectado ? 'perfil' : 'sigaa');

  return etapa === 'sigaa' ? (
    <EtapaSigaa onContinuar={() => setEtapa('perfil')} />
  ) : (
    <EtapaPerfil onVoltar={conectado ? undefined : () => setEtapa('sigaa')} />
  );
}

/** Passo 1: conectar o SIGAA, que já traz curso, notas, índices e prazos. Pode ser pulado. */
function EtapaSigaa({ onContinuar }: { onContinuar: () => void }) {
  const { conectarSigaa, sigaa } = useAstra();
  const t = useTheme();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function conectar() {
    setErro('');
    if (!usuario.trim() || !senha) return setErro('Informe usuário e senha do SIGAA.');
    setCarregando(true);
    try {
      await conectarSigaa(usuario.trim(), senha, lembrar);
      setSenha('');
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }

  const leu = sigaa && !sigaa.demo;
  const ira = sigaa?.indices.find((i) => i.code === 'IRA');

  return (
    <Tela>
      <Cabecalho titulo="Vamos começar" subtitulo="Passo 1 de 2 · Conecte o SIGAA" />

      {leu ? (
        <Cartao style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icone nome="checkmark-circle" tamanho={24} cor="success" />
            <Txt v="subtitulo">SIGAA conectado</Txt>
          </View>
          <Txt cor="textSecondary">
            {[
              cursoDoSigaa(sigaa.aluno.curso),
              ira ? `IRA ${fmt(ira.value)}` : null,
              `${sigaa.disciplinas.length} ${sigaa.disciplinas.length === 1 ? 'disciplina' : 'disciplinas'}`,
              `${sigaa.atividades.length} ${sigaa.atividades.length === 1 ? 'atividade' : 'atividades'}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Txt>
          <Txt v="legenda" cor="textMuted">
            No próximo passo, seu curso e período já vêm preenchidos. É só conferir.
          </Txt>
          <Botao titulo="Continuar" onPress={onContinuar} />
        </Cartao>
      ) : (
        <Cartao style={{ gap: 14 }}>
          <Txt cor="textSecondary">
            Com o SIGAA, o ASTRA já traz suas disciplinas, notas, índices e prazos, e personaliza o app para você.
          </Txt>
          <Campo
            rotulo="Usuário do SIGAA"
            value={usuario}
            onChangeText={setUsuario}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
          />
          <Campo
            rotulo="Senha do SIGAA"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            autoCapitalize="none"
            textContentType="password"
            onSubmitEditing={conectar}
          />
          <Txt v="legenda" cor="textMuted">
            A senha vai direto do seu celular para o SIGAA.
          </Txt>
          {cofreDisponivel ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Txt style={{ flex: 1, fontWeight: '600' }}>Atualizar sozinho (guarda a senha no cofre do celular)</Txt>
              <Switch
                value={lembrar}
                onValueChange={setLembrar}
                accessibilityLabel="Guardar usuário e senha do SIGAA neste aparelho"
                trackColor={{ true: t.primary, false: t.border }}
              />
            </View>
          ) : null}
          {carregando ? (
            <Txt v="legenda" cor="textSecondary">
              Lendo o SIGAA. Isso pode levar até 1 minuto.
            </Txt>
          ) : null}
          {erro ? <Mensagem tom="erro" texto={erro} /> : null}
          <Botao titulo="Conectar SIGAA" icone="school-outline" onPress={conectar} carregando={carregando} />
          <Botao titulo="Pular por enquanto" variante="texto" onPress={onContinuar} desabilitado={carregando} />
          <Txt v="legenda" cor="textMuted">
            Você pode conectar depois, na aba Fontes.
          </Txt>
        </Cartao>
      )}
    </Tela>
  );
}

/** Passo 2: perfil por listas de opções, já preenchido com o que veio do SIGAA. */
function EtapaPerfil({ onVoltar }: { onVoltar?: () => void }) {
  const { sigaa } = useAstra();
  const doSigaa = sigaa && !sigaa.demo ? sigaa : null;
  // Este passo abre depois da conexão: o que veio do SIGAA já entra como sugestão
  const [curso, setCurso] = useState(() => (doSigaa ? cursoDoSigaa(doSigaa.aluno.curso) ?? '' : ''));
  const [periodo, setPeriodo] = useState(() => (doSigaa ? periodoEstimado(doSigaa) ?? '' : ''));
  const [meta, setMeta] = useState('');
  const [metodo, setMetodo] = useState('');
  const [canais, setCanais] = useState<string[]>(doSigaa ? ['SIGAA'] : []);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const opcoesCurso = curso && curso !== NAO_INFORMADO_TEXTO && !CURSOS.includes(curso) ? [curso, ...CURSOS] : CURSOS;
  const alternarCanal = (c: string) =>
    setCanais((atual) => (atual.includes(c) ? atual.filter((x) => x !== c) : [...atual, c]));

  async function salvar() {
    const usuario = auth.currentUser;
    if (!usuario) return setErro('Não identificamos sua conta. Entre novamente.');
    setErro('');
    setCarregando(true);
    try {
      const uid = usuario.uid;
      const lote = writeBatch(db);
      lote.set(
        doc(db, 'estudantes', uid),
        {
          id: uid,
          nome: usuario.displayName ?? 'Estudante',
          email: usuario.email ?? '',
          dataCadastro: serverTimestamp(),
        },
        { merge: true }
      );
      lote.set(
        doc(db, 'perfisAprendizagem', uid),
        {
          estudanteId: uid,
          // Campo em branco conta como "Não informado": nada é obrigatório
          curso: curso.trim() || NAO_INFORMADO_TEXTO,
          periodo: periodo.trim() || NAO_INFORMADO_TEXTO,
          metaHoras: lerHorasMeta(meta),
          metodoAnotacao: metodo || NAO_INFORMADO_TEXTO,
          canais: [...canais],
          sigaaConectado: Boolean(sigaa && !sigaa.demo),
          dataIdentificacao: serverTimestamp(),
        },
        { merge: true }
      );
      await lote.commit();
      router.replace('/inicio');
    } catch {
      setErro('Não foi possível salvar seu perfil. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Tela>
      <Cabecalho titulo="Vamos começar" subtitulo="Passo 2 de 2 · Seu perfil" voltar={onVoltar} />

      <Cartao style={{ gap: 18 }}>
        <Txt v="legenda" cor="textMuted">
          Toque nas opções. Nada é obrigatório: o que ficar em branco conta como &quot;Não informado&quot;.
        </Txt>
        <Seletor rotulo="Curso" opcoes={opcoesCurso} valor={curso} onChange={setCurso} placeholderOutro="Nome do curso" />
        <Seletor
          rotulo="Período atual"
          opcoes={PERIODOS}
          valor={periodo}
          onChange={setPeriodo}
          placeholderOutro="Ex.: 13º"
        />
        <Seletor
          rotulo="Meta diária de estudo"
          opcoes={METAS_HORAS}
          valor={meta}
          onChange={setMeta}
          placeholderOutro="Ex.: 2,5"
          tecladoOutro="decimal-pad"
        />
        <Seletor rotulo="Como você anota?" opcoes={METODOS_ANOTACAO} valor={metodo} onChange={setMetodo} outro={false} />

        <View style={{ gap: 8 }}>
          <Txt v="legenda" cor="textSecondary" style={{ fontWeight: '700' }}>
            Onde chegam suas informações? (pode escolher várias)
          </Txt>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {CANAIS.map((c) => (
              <Chip key={c} rotulo={c} ativo={canais.includes(c)} onPress={() => alternarCanal(c)} />
            ))}
          </View>
        </View>

        {erro ? <Mensagem tom="erro" texto={erro} /> : null}
        <Botao titulo="Concluir" onPress={salvar} carregando={carregando} />
      </Cartao>
    </Tela>
  );
}
