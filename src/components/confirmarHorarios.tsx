import React, { useState } from 'react';
import { View } from 'react-native';

import { NAO_INFORMADO_TEXTO } from '@/components/seletor';
import { Botao, Campo, Cartao, Chip, Icone, Mensagem, Txt } from '@/components/ui';
import { rotuloDia } from '@/lib/datas';
import { HORARIOS_SUGERIDOS, lerHora, NAO_INFORMADO } from '@/lib/horarios';
import type { Atividade } from '@/lib/types';

/** Lista os prazos que vieram sem horário e pede a confirmação com um toque. */
export function ConfirmarHorarios({
  itens,
  onConfirmar,
}: {
  itens: Atividade[];
  onConfirmar: (atividade: Atividade, valor: string) => void;
}) {
  if (itens.length === 0) return null;
  return (
    <Cartao style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icone nome="time-outline" tamanho={22} cor="warning" />
        <View style={{ flex: 1 }}>
          <Txt v="subtitulo">Confirme o horário</Txt>
          <Txt v="legenda" cor="textSecondary">
            {itens.length === 1 ? 'Este prazo chegou sem horário.' : `${itens.length} prazos chegaram sem horário.`}
          </Txt>
        </View>
      </View>
      {itens.map((a) => (
        <ItemHorario key={a.id} atividade={a} onConfirmar={(v) => onConfirmar(a, v)} />
      ))}
    </Cartao>
  );
}

function ItemHorario({ atividade, onConfirmar }: { atividade: Atividade; onConfirmar: (valor: string) => void }) {
  const [outro, setOutro] = useState(false);
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState('');

  function salvarOutro() {
    const hm = lerHora(texto);
    if (!hm) return setErro('Use o formato 14:30.');
    onConfirmar(`${String(hm.h).padStart(2, '0')}:${String(hm.m).padStart(2, '0')}`);
  }

  return (
    <View style={{ gap: 8 }}>
      <Txt style={{ fontWeight: '700' }}>{atividade.titulo}</Txt>
      <Txt v="legenda" cor="textSecondary">
        {rotuloDia(new Date(atividade.data))}
        {atividade.disciplina ? ` · ${atividade.disciplina}` : ''}
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {HORARIOS_SUGERIDOS.map((h) => (
          <Chip key={h} rotulo={h} ativo={false} onPress={() => onConfirmar(h)} />
        ))}
        <Chip rotulo="Outro…" ativo={outro} onPress={() => setOutro((v) => !v)} />
        <Chip rotulo={NAO_INFORMADO_TEXTO} ativo={false} onPress={() => onConfirmar(NAO_INFORMADO)} />
      </View>
      {outro ? (
        <View style={{ gap: 8 }}>
          <Campo
            rotulo="Horário"
            value={texto}
            onChangeText={(v) => {
              setTexto(v);
              setErro('');
            }}
            placeholder="14:30"
            keyboardType="numbers-and-punctuation"
            onSubmitEditing={salvarOutro}
          />
          {erro ? <Mensagem tom="erro" texto={erro} /> : null}
          <Botao titulo="Salvar horário" variante="secundario" onPress={salvarOutro} />
        </View>
      ) : null}
    </View>
  );
}
