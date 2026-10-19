import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';

import { Botao, Cabecalho, Cartao, Chip, Mensagem, Secao, Tela, Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { fmt } from '@/lib/analise';
import { chaveDia } from '@/lib/datas';
import { useAstra } from '@/lib/store';
import type { RegistroDiario } from '@/lib/types';

const ROTULOS_ESTRESSE = ['Tranquilo', 'Leve', 'Médio', 'Alto', 'Muito alto'];

export default function Diario() {
  const { diario } = useAstra();
  const hoje = diario.find((r) => r.dia === chaveDia(new Date()));
  // A chave refaz o formulário com o registro de hoje quando ele existir
  return <Formulario key={hoje ? 'com-registro' : 'novo'} hoje={hoje} />;
}

function Formulario({ hoje }: { hoje?: RegistroDiario }) {
  const { diario, registrarDia, removerRegistroDiario } = useAstra();
  const [sono, setSono] = useState(hoje?.sonoHoras ?? 7);
  const [estudo, setEstudo] = useState(hoje?.estudoHoras ?? 2);
  const [estresse, setEstresse] = useState(hoje?.estresse ?? 3);
  const [salvo, setSalvo] = useState(false);

  function salvar() {
    registrarDia({ sonoHoras: sono, estudoHoras: estudo, estresse });
    setSalvo(true);
  }

  return (
    <Tela>
      <Cabecalho titulo="Diário" subtitulo="Como foi o seu dia?" voltar={() => router.back()} />

      <Cartao style={{ gap: 20 }}>
        <Contador rotulo="Horas de sono" valor={sono} onChange={(v) => { setSono(v); setSalvo(false); }} />
        <Contador rotulo="Horas de estudo" valor={estudo} onChange={(v) => { setEstudo(v); setSalvo(false); }} />
        <View style={{ gap: 8 }}>
          <Txt v="legenda" cor="textSecondary" style={{ fontWeight: '700' }}>
            Estresse: {ROTULOS_ESTRESSE[estresse - 1]}
          </Txt>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Chip key={n} rotulo={String(n)} ativo={estresse === n} onPress={() => { setEstresse(n); setSalvo(false); }} />
            ))}
          </View>
        </View>
        {salvo ? <Mensagem tom="sucesso" texto="Registro de hoje salvo." /> : null}
        <Botao titulo={hoje ? 'Atualizar registro de hoje' : 'Salvar registro de hoje'} onPress={salvar} />
      </Cartao>

      {diario.length > 0 ? (
        <Secao titulo="Últimos dias" acao="Ver desempenho" onAcao={() => router.push('/desempenho')}>
          <Cartao>
            <Grafico diario={diario.slice(-7)} />
          </Cartao>
        </Secao>
      ) : null}

      {diario.length > 0 ? (
        <Secao titulo="Registros">
          {[...diario].reverse().map((r) => (
            <Cartao key={r.dia}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Txt style={{ fontWeight: '700' }}>{r.dia}</Txt>
                  <Txt v="legenda" cor="textSecondary">
                    Sono {fmt(r.sonoHoras)} h · Estudo {fmt(r.estudoHoras)} h · Estresse {r.estresse}/5
                  </Txt>
                </View>
                <Pressable
                  onPress={() =>
                    Alert.alert('Excluir registro?', `O registro de ${r.dia} será apagado.`, [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Excluir', style: 'destructive', onPress: () => removerRegistroDiario(r.dia) },
                    ])
                  }
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={`Excluir registro de ${r.dia}`}
                  style={{ minHeight: 44, justifyContent: 'center' }}
                >
                  <Txt v="legenda" cor="danger" style={{ fontWeight: '700' }}>
                    Excluir
                  </Txt>
                </Pressable>
              </View>
            </Cartao>
          ))}
        </Secao>
      ) : null}
    </Tela>
  );
}

function Contador({ rotulo, valor, onChange }: { rotulo: string; valor: number; onChange: (v: number) => void }) {
  const t = useTheme();
  const botao = (sinal: 1 | -1) => (
    <Pressable
      onPress={() => onChange(Math.min(14, Math.max(0, valor + sinal * 0.5)))}
      accessibilityRole="button"
      accessibilityLabel={`${sinal > 0 ? 'Aumentar' : 'Diminuir'} ${rotulo}`}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: t.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Txt v="subtitulo" cor="primary">
        {sinal > 0 ? '+' : '−'}
      </Txt>
    </Pressable>
  );
  return (
    <View style={{ gap: 8 }}>
      <Txt v="legenda" cor="textSecondary" style={{ fontWeight: '700' }}>
        {rotulo}
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {botao(-1)}
        <Txt style={{ fontSize: 30, fontWeight: '800' }}>{fmt(valor)} h</Txt>
        {botao(1)}
      </View>
    </View>
  );
}

/** Barras simples: altura = horas de sono; cor mais forte quando o estresse é alto. */
function Grafico({ diario }: { diario: { dia: string; sonoHoras: number; estresse: number }[] }) {
  const t = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 90 }}>
        {diario.map((r) => (
          <View key={r.dia} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
            <View
              accessibilityLabel={`${r.dia}: ${fmt(r.sonoHoras)} horas de sono, estresse ${r.estresse}`}
              style={{
                width: '100%',
                height: `${Math.max(6, (r.sonoHoras / 10) * 100)}%`,
                borderRadius: 6,
                backgroundColor: r.estresse >= 4 ? t.warning : t.primary,
              }}
            />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {diario.map((r) => (
          <Txt key={r.dia} v="legenda" cor="textMuted" style={{ flex: 1, textAlign: 'center' }}>
            {r.dia.slice(8)}
          </Txt>
        ))}
      </View>
      <Txt v="legenda" cor="textMuted">
        Altura: horas de sono. Barras laranja: estresse alto.
      </Txt>
    </View>
  );
}
