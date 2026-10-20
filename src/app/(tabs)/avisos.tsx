import React, { useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';

import { NAO_INFORMADO_TEXTO, Seletor } from '@/components/seletor';
import { Botao, Cabecalho, Campo, Cartao, Chip, Icone, Mensagem, Selo, SeloFonte, Tela, Txt, Vazio, FONTES, type IconName } from '@/components/ui';
import { haQuanto, lerDataHora } from '@/lib/datas';
import { HORARIOS_SUGERIDOS, textoPrazo } from '@/lib/horarios';
import { useAstra } from '@/lib/store';
import type { EdicaoAviso } from '@/lib/crud';
import type { Aviso, TipoAviso } from '@/lib/types';

type Filtro = 'todos' | TipoAviso;

const FILTROS: { id: Filtro; rotulo: string }[] = [
  { id: 'todos', rotulo: 'Todos' },
  { id: 'prazo', rotulo: 'Prazos' },
  { id: 'comunicado', rotulo: 'Avisos' },
  { id: 'material', rotulo: 'Materiais' },
];

const ICONE_TIPO: Record<TipoAviso, IconName> = {
  prazo: 'alarm-outline',
  comunicado: 'megaphone-outline',
  material: 'document-text-outline',
};

function confirmarRemocao(texto: string, remover: () => void) {
  Alert.alert('Remover mensagem?', texto.length > 120 ? `${texto.slice(0, 117)}...` : texto, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Remover', style: 'destructive', onPress: remover },
  ]);
}

export default function Avisos() {
  const { avisos, repetidos, removerAviso, editarAviso, sigaa } = useAstra();
  const [editando, setEditando] = useState<string | null>(null);
  const disciplinas = (sigaa?.disciplinas ?? []).map((d) => d.titulo);
  const [filtro, setFiltro] = useState<Filtro>('todos');

  // Mensagens quase iguais de canais diferentes viram um único aviso
  const visiveis = useMemo(() => {
    const escondidos = new Set<string>();
    Object.values(repetidos).forEach((g) => g.slice(1).forEach((a) => escondidos.add(a.id)));
    return avisos.filter((a) => !escondidos.has(a.id) && (filtro === 'todos' || a.tipo === filtro));
  }, [avisos, repetidos, filtro]);

  return (
    <Tela>
      <Cabecalho titulo="Avisos" subtitulo="Tudo que chegou, sem repetição." />

      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {FILTROS.map((f) => (
          <Chip key={f.id} rotulo={f.rotulo} ativo={filtro === f.id} onPress={() => setFiltro(f.id)} />
        ))}
      </View>

      {visiveis.length === 0 ? (
        <Cartao>
          <Vazio
            icone="notifications-off-outline"
            titulo="Nenhum aviso"
            texto="Importe mensagens do WhatsApp, Telegram ou Classroom na aba Fontes."
            acao="Ir para Fontes"
            onAcao={() => router.push('/fontes')}
          />
        </Cartao>
      ) : (
        visiveis.map((a) => {
          const outros = (repetidos[a.id] ?? []).slice(1).map((x) => FONTES[x.fonte].nome);
          if (editando === a.id) {
            return (
              <EditorAviso
                key={a.id}
                aviso={a}
                disciplinas={disciplinas}
                onCancelar={() => setEditando(null)}
                onSalvar={(edicao) => {
                  editarAviso(a.id, edicao);
                  setEditando(null);
                }}
              />
            );
          }
          return (
            <Cartao key={a.id}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Icone nome={ICONE_TIPO[a.tipo]} tamanho={22} cor="primary" />
                <View style={{ flex: 1, gap: 6 }}>
                  <Txt>{a.texto}</Txt>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                    <SeloFonte fonte={a.fonte} />
                    <Txt v="legenda" cor="textMuted">
                      {haQuanto(a.recebidoEm)}
                    </Txt>
                    {a.prazo ? (
                      <Selo
                        rotulo={textoPrazo({ data: a.prazo, semHora: a.prazoSemHora && !a.horaNaoInformada, horaNaoInformada: a.horaNaoInformada })}
                        tom="alerta"
                      />
                    ) : null}
                  </View>
                  {a.disciplina ? (
                    <Txt v="legenda" cor="textSecondary">
                      {a.disciplina}
                    </Txt>
                  ) : null}
                  {outros.length > 0 ? (
                    <Txt v="legenda" cor="textMuted">
                      Também enviado em {outros.join(', ')}
                    </Txt>
                  ) : null}
                  <View style={{ flexDirection: 'row', gap: 20 }}>
                    <Pressable
                      onPress={() => setEditando(a.id)}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel="Editar mensagem"
                      style={{ minHeight: 44, justifyContent: 'center' }}
                    >
                      <Txt v="legenda" cor="primary" style={{ fontWeight: '700' }}>
                        Editar
                      </Txt>
                    </Pressable>
                    <Pressable
                      onPress={() => confirmarRemocao(a.texto, () => removerAviso(a.id))}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel="Remover mensagem"
                      style={{ minHeight: 44, justifyContent: 'center' }}
                    >
                      <Txt v="legenda" cor="danger" style={{ fontWeight: '700' }}>
                        Remover
                      </Txt>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Cartao>
          );
        })
      )}
    </Tela>
  );
}

const TIPOS: { id: TipoAviso; rotulo: string }[] = [
  { id: 'prazo', rotulo: 'Prazo' },
  { id: 'comunicado', rotulo: 'Aviso' },
  { id: 'material', rotulo: 'Material' },
];

const doisDigitos = (n: number) => String(n).padStart(2, '0');

function EditorAviso({
  aviso,
  disciplinas,
  onSalvar,
  onCancelar,
}: {
  aviso: Aviso;
  disciplinas: string[];
  onSalvar: (edicao: EdicaoAviso) => void;
  onCancelar: () => void;
}) {
  const prazo = aviso.prazo ? new Date(aviso.prazo) : null;
  const [texto, setTexto] = useState(aviso.texto);
  const [tipo, setTipo] = useState<TipoAviso>(aviso.tipo);
  const [disciplina, setDisciplina] = useState(aviso.disciplina ?? '');
  const [dia, setDia] = useState(prazo ? `${doisDigitos(prazo.getDate())}/${doisDigitos(prazo.getMonth() + 1)}` : '');
  const [horario, setHorario] = useState(
    !prazo || aviso.prazoSemHora
      ? ''
      : aviso.horaNaoInformada
        ? NAO_INFORMADO_TEXTO
        : `${doisDigitos(prazo.getHours())}:${doisDigitos(prazo.getMinutes())}`
  );
  const [erro, setErro] = useState('');

  function salvar() {
    if (texto.trim().length < 3) return setErro('A mensagem não pode ficar vazia.');
    const edicao: EdicaoAviso = {
      texto,
      tipo,
      disciplina: disciplina && disciplina !== NAO_INFORMADO_TEXTO ? disciplina : null,
    };
    if (tipo === 'prazo' && dia.trim()) {
      const semHora = !horario.trim() || horario === NAO_INFORMADO_TEXTO;
      const data = lerDataHora(dia, semHora ? '' : horario, prazo ?? new Date());
      if (!data) return setErro('Use a data como 25/10 e a hora como 14:30.');
      edicao.prazo = data.toISOString();
      edicao.horaNaoInformada = semHora;
    } else {
      edicao.prazo = null;
    }
    onSalvar(edicao);
  }

  return (
    <Cartao style={{ gap: 14 }}>
      <Txt v="subtitulo">Editar mensagem</Txt>
      <Campo rotulo="Mensagem" value={texto} onChangeText={setTexto} multiline />
      <View style={{ gap: 8 }}>
        <Txt v="legenda" cor="textSecondary" style={{ fontWeight: '700' }}>
          Tipo
        </Txt>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {TIPOS.map((t) => (
            <Chip key={t.id} rotulo={t.rotulo} ativo={tipo === t.id} onPress={() => setTipo(t.id)} />
          ))}
        </View>
      </View>
      {disciplinas.length > 0 ? (
        <Seletor rotulo="Disciplina" opcoes={disciplinas} valor={disciplina} onChange={setDisciplina} />
      ) : (
        <Campo rotulo="Disciplina (opcional)" value={disciplina} onChangeText={setDisciplina} />
      )}
      {tipo === 'prazo' ? (
        <>
          <Campo
            rotulo="Data do prazo"
            value={dia}
            onChangeText={setDia}
            placeholder="25/10"
            keyboardType="numbers-and-punctuation"
          />
          <Seletor
            rotulo="Horário"
            opcoes={HORARIOS_SUGERIDOS}
            valor={horario}
            onChange={setHorario}
            placeholderOutro="14:30"
            tecladoOutro="numbers-and-punctuation"
          />
          <Txt v="legenda" cor="textMuted">
            Sem horário escolhido, o prazo fica como &quot;horário não informado&quot;.
          </Txt>
        </>
      ) : null}
      {erro ? <Mensagem tom="erro" texto={erro} /> : null}
      <Botao titulo="Salvar" onPress={salvar} />
      <Botao titulo="Cancelar" variante="texto" onPress={onCancelar} />
    </Cartao>
  );
}
