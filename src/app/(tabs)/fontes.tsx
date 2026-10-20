import React, { useState } from 'react';
import { Switch, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import {
  Botao,
  Cabecalho,
  Campo,
  Cartao,
  Chip,
  FONTES,
  Icone,
  Mensagem,
  Secao,
  Selo,
  Tela,
  Txt,
} from '@/components/ui';
import { haQuanto } from '@/lib/datas';
import { useAstra } from '@/lib/store';
import { useTheme } from '@/hooks/use-theme';
import { cofreDisponivel } from '@/lib/cofre';
import { sigaaNativoDisponivel } from '@/lib/sigaaNativo';
import type { FonteId } from '@/lib/types';

const FONTES_MENSAGEM: FonteId[] = ['whatsapp', 'telegram', 'classroom', 'discord', 'email'];

export default function Fontes() {
  const { sessao, sigaa, sigaaEm, lembrarSenha, sincronizando, erroSync, conectarSigaa, desconectarSigaa, avisos, importarMensagens, removerAvisosDaFonte, ponte, definirPonte, modoSigaa, definirModoSigaa } =
    useAstra();

  return (
    <Tela>
      <Cabecalho titulo="Fontes" subtitulo="De onde vêm as informações do ASTRA." />

      <Secao titulo="SIGAA">
        <CartaoSigaa
          demo={sessao === 'demo'}
          conectado={!!sigaa}
          sigaaEm={sigaaEm}
          curso={sigaa?.aluno.curso}
          ponte={ponte}
          onPonte={definirPonte}
          modo={modoSigaa}
          onModo={definirModoSigaa}
          lembrada={lembrarSenha}
          sincronizando={sincronizando}
          erroSync={erroSync}
          onConectar={conectarSigaa}
          onDesconectar={desconectarSigaa}
        />
      </Secao>

      <Secao titulo="Mensagens">
        <CartaoImportar
          contagem={(f) => avisos.filter((a) => a.fonte === f).length}
          onImportar={importarMensagens}
          onLimpar={removerAvisosDaFonte}
        />
      </Secao>
    </Tela>
  );
}

function CartaoSigaa({
  demo,
  conectado,
  sigaaEm,
  curso,
  ponte,
  onPonte,
  modo,
  onModo,
  lembrada,
  sincronizando,
  erroSync,
  onConectar,
  onDesconectar,
}: {
  demo: boolean;
  conectado: boolean;
  sigaaEm: string | null;
  curso?: string;
  ponte: string;
  onPonte: (url: string) => void;
  modo: 'nativo' | 'ponte';
  onModo: (m: 'nativo' | 'ponte') => void;
  lembrada: boolean;
  sincronizando: boolean;
  erroSync: string;
  onConectar: (usuario: string, senha: string, lembrar?: boolean) => Promise<void>;
  onDesconectar: () => void;
}) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [avancado, setAvancado] = useState(false);
  const usaNativo = sigaaNativoDisponivel && modo === 'nativo';
  const [lembrar, setLembrar] = useState(lembrada);
  const t = useTheme();

  async function conectar() {
    setErro('');
    if (!usuario.trim() || !senha) return setErro('Informe usuário e senha do SIGAA.');
    setCarregando(true);
    try {
      await onConectar(usuario.trim(), senha, lembrar);
      setSenha('');
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Cartao>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icone nome="school-outline" tamanho={22} cor="primary" />
        <View style={{ flex: 1 }}>
          <Txt v="subtitulo">SIGAA UFRPE</Txt>
          <Txt v="legenda" cor="textSecondary">
            {conectado
              ? `${curso ?? 'Conectado'}${sigaaEm ? ` · atualizado ${haQuanto(sigaaEm)}` : ''}`
              : 'Atividades, notas, faltas e índices'}
          </Txt>
        </View>
        <Selo rotulo={conectado ? (demo ? 'Demonstração' : 'Conectado') : 'Desconectado'} tom={conectado ? 'sucesso' : 'neutro'} />
      </View>

      {demo ? (
        <Txt v="legenda" cor="textSecondary">
          Você está no modo demonstração. Entre com sua conta para conectar o SIGAA de verdade.
        </Txt>
      ) : (
        <>
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
            {usaNativo
              ? 'A senha vai direto do seu celular para o SIGAA e não fica salva.'
              : 'A senha passa pela ponte só para ler seus dados e não fica salva.'}
          </Txt>
          {cofreDisponivel ? (
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Txt v="corpo" style={{ flex: 1, fontWeight: '600' }}>
                  Lembrar neste aparelho
                </Txt>
                <Switch
                  value={lembrar}
                  onValueChange={setLembrar}
                  accessibilityLabel="Lembrar usuário e senha do SIGAA neste aparelho"
                  trackColor={{ true: t.primary, false: t.border }}
                />
              </View>
              <Txt v="legenda" cor="textMuted">
                Guarda usuário e senha no cofre seguro do celular, criptografados, para atualizar o SIGAA sozinho a cada
                6 horas. Desligue e conecte de novo, ou desconecte, para apagar.
              </Txt>
            </View>
          ) : null}
          {lembrada ? (
            <Txt v="legenda" cor={erroSync ? 'danger' : 'success'} style={{ fontWeight: '600' }}>
              {sincronizando
                ? 'Atualizando o SIGAA...'
                : erroSync
                  ? `Atualização automática falhou: ${erroSync}`
                  : 'Atualização automática ligada.'}
            </Txt>
          ) : null}
          {erro ? <Mensagem tom="erro" texto={erro} /> : null}
          <Botao
            titulo={conectado ? 'Atualizar dados' : 'Conectar'}
            icone="sync-outline"
            onPress={conectar}
            carregando={carregando}
          />
          {conectado ? <Botao titulo="Desconectar" variante="perigo" onPress={onDesconectar} /> : null}
          <Botao
            titulo={avancado ? 'Esconder avançado' : 'Avançado'}
            variante="texto"
            onPress={() => setAvancado((v) => !v)}
          />
          {avancado ? (
            <View style={{ gap: 12 }}>
              {sigaaNativoDisponivel ? (
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <Chip rotulo="Direto no celular" ativo={modo === 'nativo'} onPress={() => onModo('nativo')} />
                  <Chip rotulo="Pela ponte" ativo={modo === 'ponte'} onPress={() => onModo('ponte')} />
                </View>
              ) : null}
              {!usaNativo ? (
                <Campo
                  rotulo="Endereço da ponte do SIGAA"
                  value={ponte}
                  onChangeText={onPonte}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              ) : null}
            </View>
          ) : null}
        </>
      )}
    </Cartao>
  );
}

function CartaoImportar({
  contagem,
  onImportar,
  onLimpar,
}: {
  contagem: (f: FonteId) => number;
  onImportar: (texto: string, fonte: FonteId) => number;
  onLimpar: (f: FonteId) => void;
}) {
  const [fonte, setFonte] = useState<FonteId>('whatsapp');
  const [texto, setTexto] = useState('');
  const [resultado, setResultado] = useState('');

  async function colar() {
    try {
      const copiado = await Clipboard.getStringAsync();
      if (!copiado.trim()) return setResultado('A área de transferência está vazia.');
      setTexto(copiado);
      setResultado('');
    } catch {
      setResultado('Não consegui ler a área de transferência.');
    }
  }

  function importar() {
    if (texto.trim().length < 8) return setResultado('Cole pelo menos uma mensagem.');
    const n = onImportar(texto, fonte);
    setResultado(n === 0 ? 'Nenhuma mensagem reconhecida.' : `${n} ${n === 1 ? 'mensagem importada' : 'mensagens importadas'}.`);
    if (n > 0) setTexto('');
  }

  const total = contagem(fonte);

  return (
    <Cartao>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {FONTES_MENSAGEM.map((f) => (
          <Chip key={f} rotulo={FONTES[f].nome} ativo={fonte === f} onPress={() => { setFonte(f); setResultado(''); }} />
        ))}
      </View>
      <Campo
        rotulo={`Mensagens do ${FONTES[fonte].nome}`}
        value={texto}
        onChangeText={setTexto}
        multiline
        placeholder="Cole aqui. A exportação de conversa do WhatsApp também funciona."
      />
      {resultado ? <Mensagem tom={resultado.includes('importad') ? 'sucesso' : 'erro'} texto={resultado} /> : null}
      <Botao titulo="Colar da área de transferência" icone="clipboard-outline" variante="secundario" onPress={colar} />
      <Botao titulo="Importar mensagens" icone="download-outline" onPress={importar} />
      {total > 0 ? (
        <Botao titulo={`Remover ${total} de ${FONTES[fonte].nome}`} variante="perigo" onPress={() => onLimpar(fonte)} />
      ) : null}
    </Cartao>
  );
}
