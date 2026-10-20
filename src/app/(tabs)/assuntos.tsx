import React, { useState } from 'react';
import { Alert, Pressable, Share, View } from 'react-native';
import { router } from 'expo-router';

import { Botao, Cabecalho, Cartao, Chip, Icone, Selo, SeloFonte, Tela, Txt, Vazio } from '@/components/ui';
import { montarExportacao } from '@/lib/exportacao';
import { useAstra } from '@/lib/store';
import type { Aviso, Grupo } from '@/lib/types';

export default function Assuntos() {
  const { agrupamento, corrigirGrupo, desfazerCorrecao, correcoes } = useAstra();
  const [aberto, setAberto] = useState<string | null>(null);
  const [corrigindo, setCorrigindo] = useState<string | null>(null);
  const totalCorrecoes = Object.keys(correcoes).length;

  return (
    <Tela>
      <Cabecalho titulo="Assuntos" subtitulo="O ASTRA agrupa suas mensagens por tema." />

      {agrupamento.grupos.length === 0 ? (
        <Cartao>
          <Vazio
            icone="sparkles-outline"
            titulo="Sem mensagens para agrupar"
            texto="Importe mensagens de WhatsApp, Telegram ou Classroom para ver os assuntos."
            acao="Ir para Fontes"
            onAcao={() => router.push('/fontes')}
          />
        </Cartao>
      ) : (
        <>
          {agrupamento.silhueta !== null ? (
            <Txt v="legenda" cor="textMuted">
              {agrupamento.k} assuntos · qualidade do agrupamento (silhueta):{' '}
              {agrupamento.silhueta.toFixed(2).replace('.', ',')}
              {totalCorrecoes > 0 ? ` · ${totalCorrecoes} ${totalCorrecoes === 1 ? 'correção sua' : 'correções suas'}` : ''}
            </Txt>
          ) : null}

          {totalCorrecoes > 0 ? (
            <Botao
              titulo="Exportar minhas correções"
              icone="share-outline"
              variante="secundario"
              onPress={() =>
                Share.share({
                  title: 'Correções de agrupamento do ASTRA',
                  message: JSON.stringify(montarExportacao(agrupamento.grupos, correcoes), null, 2),
                })
              }
            />
          ) : null}

          {agrupamento.grupos.map((g) => (
            <CartaoGrupo
              key={g.id}
              grupo={g}
              todos={agrupamento.grupos}
              aberto={aberto === g.id}
              corrigindo={corrigindo}
              correcoes={correcoes}
              onDesfazer={desfazerCorrecao}
              onAlternar={() => setAberto(aberto === g.id ? null : g.id)}
              onCorrigir={setCorrigindo}
              onMover={(aviso, destino) => {
                corrigirGrupo(aviso.id, destino.avisos[0].id);
                setCorrigindo(null);
              }}
            />
          ))}
        </>
      )}
    </Tela>
  );
}

function CartaoGrupo({
  grupo,
  todos,
  aberto,
  corrigindo,
  correcoes,
  onDesfazer,
  onAlternar,
  onCorrigir,
  onMover,
}: {
  grupo: Grupo;
  todos: Grupo[];
  aberto: boolean;
  corrigindo: string | null;
  correcoes: Record<string, string>;
  onDesfazer: (avisoId: string) => void;
  onAlternar: () => void;
  onCorrigir: (id: string | null) => void;
  onMover: (aviso: Aviso, destino: Grupo) => void;
}) {
  return (
    <Cartao>
      <Pressable
        onPress={onAlternar}
        accessibilityRole="button"
        accessibilityState={{ expanded: aberto }}
        accessibilityLabel={`${grupo.rotulo}, ${grupo.avisos.length} mensagens`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
      >
        <View style={{ flex: 1, gap: 6 }}>
          <Txt v="subtitulo">{grupo.rotulo}</Txt>
          <Selo rotulo={`${grupo.avisos.length} ${grupo.avisos.length === 1 ? 'mensagem' : 'mensagens'}`} tom="primario" />
        </View>
        <Icone nome={aberto ? 'chevron-up' : 'chevron-down'} cor="textMuted" />
      </Pressable>

      {aberto ? (
        <View style={{ gap: 14, marginTop: 8 }}>
          {grupo.avisos.map((a) => (
            <View key={a.id} style={{ gap: 6 }}>
              <Txt>{a.texto}</Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <SeloFonte fonte={a.fonte} />
                {todos.length > 1 ? (
                  <Pressable
                    onPress={() => onCorrigir(corrigindo === a.id ? null : a.id)}
                    hitSlop={8}
                    accessibilityRole="button"
                  >
                    <Txt v="legenda" cor="primary" style={{ fontWeight: '700' }}>
                      Assunto errado?
                    </Txt>
                  </Pressable>
                ) : null}
                {correcoes[a.id] ? (
                  <Pressable
                    onPress={() =>
                      Alert.alert('Desfazer correção?', 'A mensagem volta para o agrupamento automático.', [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Desfazer', style: 'destructive', onPress: () => onDesfazer(a.id) },
                      ])
                    }
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Desfazer correção desta mensagem"
                  >
                    <Txt v="legenda" cor="danger" style={{ fontWeight: '700' }}>
                      Desfazer correção
                    </Txt>
                  </Pressable>
                ) : null}
              </View>
              {corrigindo === a.id ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {todos
                    .filter((d) => d.id !== grupo.id)
                    .map((d) => (
                      <Chip key={d.id} rotulo={d.rotulo} ativo={false} onPress={() => onMover(a, d)} />
                    ))}
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </Cartao>
  );
}
