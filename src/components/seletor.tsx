import React, { useState } from 'react';
import { View, type KeyboardTypeOptions } from 'react-native';

import { Campo, Chip, Txt } from '@/components/ui';

export const NAO_INFORMADO_TEXTO = 'Não informado';
const OUTRO = 'Outro…';
/** Acima disso a lista ganha um campo de busca e mostra só as opções que combinam. */
const LIMITE_SEM_BUSCA = 8;

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Escolha por lista: o estudante toca numa opção; no fim da lista há "Outro…" (digita) e
 * "Não informado". Listas grandes ganham busca.
 */
export function Seletor({
  rotulo,
  opcoes,
  valor,
  onChange,
  outro = true,
  naoInformado = true,
  placeholderOutro,
  tecladoOutro,
}: {
  rotulo: string;
  opcoes: string[];
  valor: string;
  onChange: (valor: string) => void;
  outro?: boolean;
  naoInformado?: boolean;
  placeholderOutro?: string;
  tecladoOutro?: KeyboardTypeOptions;
}) {
  const valorEhOutro = valor !== '' && valor !== NAO_INFORMADO_TEXTO && !opcoes.includes(valor);
  const [digitando, setDigitando] = useState(valorEhOutro);
  const [busca, setBusca] = useState('');
  const comBusca = opcoes.length > LIMITE_SEM_BUSCA;

  const visiveis = comBusca
    ? opcoes
        .filter((o) => !busca.trim() || normalizar(o).includes(normalizar(busca.trim())))
        .slice(0, LIMITE_SEM_BUSCA)
    : opcoes;
  // A opção escolhida continua visível mesmo fora do filtro
  if (comBusca && opcoes.includes(valor) && !visiveis.includes(valor)) visiveis.unshift(valor);

  return (
    <View style={{ gap: 8 }}>
      <Txt v="legenda" cor="textSecondary" style={{ fontWeight: '700' }}>
        {rotulo}
      </Txt>
      {comBusca ? (
        <Campo rotulo="Buscar na lista" value={busca} onChangeText={setBusca} placeholder="Digite para filtrar" />
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {visiveis.map((o) => (
          <Chip
            key={o}
            rotulo={o}
            ativo={!digitando && valor === o}
            onPress={() => {
              setDigitando(false);
              onChange(o);
            }}
          />
        ))}
        {outro ? (
          <Chip
            rotulo={OUTRO}
            ativo={digitando}
            onPress={() => {
              setDigitando(true);
              if (!valorEhOutro) onChange('');
            }}
          />
        ) : null}
        {naoInformado ? (
          <Chip
            rotulo={NAO_INFORMADO_TEXTO}
            ativo={!digitando && valor === NAO_INFORMADO_TEXTO}
            onPress={() => {
              setDigitando(false);
              onChange(NAO_INFORMADO_TEXTO);
            }}
          />
        ) : null}
      </View>
      {comBusca && visiveis.length === 0 ? (
        <Txt v="legenda" cor="textMuted">
          Nada encontrado. Toque em &quot;{OUTRO}&quot; para digitar.
        </Txt>
      ) : null}
      {digitando ? (
        <Campo
          rotulo={`${rotulo} (digite)`}
          value={valorEhOutro ? valor : ''}
          onChangeText={onChange}
          placeholder={placeholderOutro}
          keyboardType={tecladoOutro}
          autoFocus
        />
      ) : null}
    </View>
  );
}
