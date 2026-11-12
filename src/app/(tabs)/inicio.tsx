import React, { useState } from 'react';
import { RefreshControl, View, Image, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

import { Botao, Cabecalho, Cartao, Icone, Secao, Selo, SeloFonte, Tela, Txt, Vazio } from '@/components/ui';
import { ConfirmarHorarios } from '@/components/confirmarHorarios';
import { diasAte } from '@/lib/datas';
import { textoPrazo } from '@/lib/horarios';
import { useAstra } from '@/lib/store';
import { useTheme } from '@/hooks/use-theme';

export default function Inicio() {
  const { nome, atividades, avisos, sigaa, pendentesHorario, confirmarHorario, usuario } = useAstra() as any;
  const t = useTheme();
  const [atualizando, setAtualizando] = useState(false);

  async function aoAtualizar() {
    setAtualizando(true);
    setTimeout(() => {
      setAtualizando(false);
    }, 1200);
  }

  // Função simples para calcular as iniciais caso não haja foto
  const obterIniciais = (strNome: string) => {
    if (!strNome) return 'U';
    const partes = strNome.trim().split(' ');
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  };

  const nomeUsuario = usuario?.displayName || nome || 'Usuário';
  const iniciais = obterIniciais(nomeUsuario);
  const fotoUrl = usuario?.photoURL;

  const pendentes = atividades.filter((a: any) => !a.concluida && diasAte(new Date(a.data)) >= 0);
  const proximas = pendentes.slice(0, 3);
  const naSemana = pendentes.filter((a: any) => diasAte(new Date(a.data)) <= 7).length;
  const primeiroNome = nome.trim().split(/\s+/)[0];
  const semDados = avisos.length === 0 && !sigaa && atividades.length === 0;

  return (
    <Tela
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={aoAtualizar}
            tintColor={t.primary}
            colors={[t.primary]}
          />
        }
      >
      <Cabecalho
        titulo={primeiroNome ? `Olá, ${primeiroNome}` : 'Olá'}
        subtitulo={
          naSemana === 0
            ? 'Nenhum prazo nos próximos 7 dias.'
            : `${naSemana} ${naSemana === 1 ? 'prazo' : 'prazos'} nos próximos 7 dias.`
        }
        acao={
          <TouchableOpacity
            onPress={() => router.push('/perfil')}
            activeOpacity={0.8}
            accessibilityLabel="Ir para o perfil"
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: t.primary,
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
              borderWidth: 1.5,
              borderColor: t.border || '#E5E7EB',
            }}
          >
            {fotoUrl ? (
              <Image source={{ uri: fotoUrl }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                <Txt 
                  style={{ 
                    color: '#fff', 
                    fontSize: 14, 
                    fontWeight: '700',
                    lineHeight: 18,
                    textAlign: 'center',
                    includeFontPadding: false,
                  }}
                >
                  {iniciais}
                </Txt>
              </View>
            )}
          </TouchableOpacity>
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
            proximas.map((a: any) => {
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
              sigaa?.indices.find((i: any) => i.code === 'IRA')
                ? `IRA ${sigaa.indices.find((i: any) => i.code === 'IRA')!.value.toFixed(1)} · notas e faltas`
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