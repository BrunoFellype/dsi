import { Botao, Cabecalho, Cartao, Chip, Icone, Selo, SeloFonte, Tela, Txt, Vazio, type IconName } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { haQuanto } from '@/lib/datas';
import { montarExportacao } from '@/lib/exportacao';
import { textoPrazo } from '@/lib/horarios';
import { useAstra } from '@/lib/store';
import type { Aviso, Grupo, TipoAviso } from '@/lib/types';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Share, View } from 'react-native';

const ICONE_TIPO: Record<TipoAviso, IconName> = {
  prazo: 'alarm-outline',
  comunicado: 'megaphone-outline',
  material: 'document-text-outline',
};

const ROTULO_TIPO: Record<TipoAviso, string> = {
  prazo: 'Prazo',
  comunicado: 'Aviso',
  material: 'Material',
};

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
              {agrupamento.k} assuntos • {agrupamento.grupos.reduce((acc, g) => acc + g.avisos.length, 0)} mensagens distribuídas
              {totalCorrecoes > 0 ? ` • ${totalCorrecoes} ${totalCorrecoes === 1 ? 'correção sua' : 'correções suas'}` : ''}
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
  const t = useTheme();

  return (
    <Cartao style={{ padding: 16 }}>
      <Pressable
        onPress={onAlternar}
        accessibilityRole="button"
        accessibilityState={{ expanded: aberto }}
        accessibilityLabel={`${grupo.rotulo}, ${grupo.avisos.length} mensagens`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Txt v="subtitulo" style={{ fontSize: 18 }}>{grupo.rotulo}</Txt>
          <Selo rotulo={`${grupo.avisos.length} ${grupo.avisos.length === 1 ? 'mensagem' : 'mensagens'}`} tom="primario" />
        </View>
        <Icone nome={aberto ? 'chevron-up' : 'chevron-down'} cor="textMuted" />
      </Pressable>

      {aberto ? (
        <View style={{ gap: 12, marginTop: 16 }}>
          {grupo.avisos.map((a) => {
            const ehPrazo = a.tipo === 'prazo' || Boolean(a.prazo);
            return (
              <View
                key={a.id}
                style={{
                  backgroundColor: t.surfaceAlt,
                  borderWidth: 1,
                  borderColor: t.border,
                  borderRadius: 12,
                  padding: 14,
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                    <Icone nome={ICONE_TIPO[a.tipo ?? 'comunicado']} tamanho={16} cor="primary" />
                    <Selo
                      rotulo={ROTULO_TIPO[a.tipo ?? 'comunicado']}
                      tom={ehPrazo ? 'alerta' : a.tipo === 'material' ? 'primario' : 'neutro'}
                    />
                    <SeloFonte fonte={a.fonte} />
                    {a.autor ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Icone nome="person-outline" tamanho={12} cor="textSecondary" />
                        <Txt v="legenda" cor="textSecondary" style={{ fontSize: 12, fontWeight: '600' }}>
                          {a.autor}
                        </Txt>
                      </View>
                    ) : null}
                  </View>

                  <Txt v="legenda" cor="textMuted" style={{ fontSize: 11 }}>
                    {haQuanto(a.recebidoEm)}
                  </Txt>
                </View>

                {a.prazo ? (
                  <View style={{ alignSelf: 'flex-start' }}>
                    <Selo
                      rotulo={`Entrega: ${textoPrazo({
                        data: a.prazo,
                        semHora: a.prazoSemHora && !a.horaNaoInformada,
                        horaNaoInformada: a.horaNaoInformada,
                      })}`}
                      tom="alerta"
                    />
                  </View>
                ) : null}

                <Txt style={{ fontSize: 14, lineHeight: 21, color: t.text }}>
                  {a.texto}
                </Txt>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 16, marginTop: 2 }}>
                  {todos.length > 1 ? (
                    <Pressable
                      onPress={() => onCorrigir(corrigindo === a.id ? null : a.id)}
                      hitSlop={8}
                      accessibilityRole="button"
                    >
                      <Txt v="legenda" cor="primary" style={{ fontWeight: '700' }}>
                        {corrigindo === a.id ? 'Cancelar' : 'Assunto errado?'}
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
                    >
                      <Txt v="legenda" cor="danger" style={{ fontWeight: '700' }}>
                        Desfazer correção
                      </Txt>
                    </Pressable>
                  ) : null}
                </View>

                {corrigindo === a.id ? (
                  <View style={{ gap: 8, marginTop: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: t.border }}>
                    <Txt v="legenda" cor="textSecondary">Mover esta mensagem para:</Txt>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {todos
                        .filter((d) => d.id !== grupo.id)
                        .map((d) => (
                          <Chip key={d.id} rotulo={d.rotulo} ativo={false} onPress={() => onMover(a, d)} />
                        ))}
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}
    </Cartao>
  );
}