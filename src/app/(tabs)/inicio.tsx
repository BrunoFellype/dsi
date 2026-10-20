import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { Botao, Cabecalho, Cartao, Icone, Secao, Selo, SeloFonte, Tela, Txt, Vazio } from '@/components/ui';
import { ConfirmarHorarios } from '@/components/confirmarHorarios';
import { diasAte } from '@/lib/datas';
import { textoPrazo } from '@/lib/horarios';
import { useAstra } from '@/lib/store';
import { useTheme } from '@/hooks/use-theme';

export default function Inicio() {
  const { nome, atividades, avisos, sigaa, pendentesHorario, confirmarHorario } = useAstra();
  const t = useTheme();

  const pendentes = atividades.filter((a) => !a.concluida && diasAte(new Date(a.data)) >= 0);
  const proximas = pendentes.slice(0, 3);
  const naSemana = pendentes.filter((a) => diasAte(new Date(a.data)) <= 7).length;
  const primeiroNome = nome.trim().split(/\s+/)[0];
  const semDados = avisos.length === 0 && !sigaa && atividades.length === 0;

  return (
    <Tela>
      <Cabecalho
        titulo={primeiroNome ? `Olá, ${primeiroNome}` : 'Olá'}
        subtitulo={
          naSemana === 0
            ? 'Nenhum prazo nos próximos 7 dias.'
            : `${naSemana} ${naSemana === 1 ? 'prazo' : 'prazos'} nos próximos 7 dias.`
        }
        acao={
          <Botao
            titulo="Perfil"
            icone="person-circle-outline"
            variante="texto"
            onPress={() => router.push('/perfil')}
          />
        }
      />

      {semDados ? (
        <Cartao>
          <Vazio
            icone="link-outline"
            titulo="Conecte suas fontes"
            texto="Traga o SIGAA e suas mensagens para ver tudo em um lugar só."
            acao="Conectar fontes"
            onAcao={() => router.push('/fontes')}
          />
        </Cartao>
      ) : (
        <ConfirmarHorarios itens={pendentesHorario} onConfirmar={confirmarHorario} />
      )}

      {semDados ? null : (
        <Secao titulo="Próximos prazos" acao="Ver agenda" onAcao={() => router.push('/agenda')}>
          {proximas.length === 0 ? (
            <Cartao>
              <Txt cor="textSecondary">Tudo em dia por enquanto.</Txt>
            </Cartao>
          ) : (
            proximas.map((a) => {
              const urgente = diasAte(new Date(a.data)) <= 1;
              return (
                <Cartao key={a.id} onPress={() => router.push('/agenda')} accessibilityLabel={a.titulo}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                    <Txt v="subtitulo" style={{ flex: 1 }} numberOfLines={2}>
                      {a.titulo}
                    </Txt>
                    <Selo rotulo={textoPrazo(a)} tom={urgente ? 'alerta' : 'neutro'} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    {a.disciplina ? (
                      <Txt v="legenda" cor="textSecondary" numberOfLines={1} style={{ flexShrink: 1 }}>
                        {a.disciplina}
                      </Txt>
                    ) : null}
                    <SeloFonte fonte={a.fonte} />
                  </View>
                </Cartao>
              );
            })
          )}
        </Secao>
      )}

      <Secao titulo="Seu acompanhamento">
        <View style={{ gap: 12 }}>
          <Atalho
            icone="book-outline"
            titulo="Diário de rotina"
            texto="Sono, estudo e estresse de hoje"
            onPress={() => router.push('/diario')}
          />
          <Atalho
            icone="stats-chart-outline"
            titulo="Desempenho"
            texto={
              sigaa?.indices.find((i) => i.code === 'IRA')
                ? `IRA ${sigaa.indices.find((i) => i.code === 'IRA')!.value.toFixed(1)} · notas e faltas`
                : 'Notas, faltas e pontos de atenção'
            }
            onPress={() => router.push('/desempenho')}
          />
        </View>
      </Secao>

      {sigaa?.demo ? (
        <Txt v="legenda" cor="textMuted" style={{ textAlign: 'center', color: t.textMuted }}>
          Modo demonstração: dados de exemplo.
        </Txt>
      ) : null}
    </Tela>
  );
}

function Atalho({
  icone,
  titulo,
  texto,
  onPress,
}: {
  icone: React.ComponentProps<typeof Icone>['nome'];
  titulo: string;
  texto: string;
  onPress: () => void;
}) {
  return (
    <Cartao onPress={onPress} accessibilityLabel={titulo}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Icone nome={icone} tamanho={24} cor="primary" />
        <View style={{ flex: 1 }}>
          <Txt v="subtitulo">{titulo}</Txt>
          <Txt v="legenda" cor="textSecondary">
            {texto}
          </Txt>
        </View>
        <Icone nome="chevron-forward" cor="textMuted" />
      </View>
    </Cartao>
  );
}
