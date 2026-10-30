import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';

import {
  Botao,
  Cabecalho,
  Campo,
  Cartao,
  Chip,
  Icone,
  Mensagem,
  Secao,
  SeloFonte,
  Tela,
  Txt,
  Vazio,
} from '@/components/ui';
import { ConfirmarHorarios } from '@/components/confirmarHorarios';
import { Seletor, NAO_INFORMADO_TEXTO } from '@/components/seletor';
import { chaveDia, lerDataHora, rotuloDia } from '@/lib/datas';
import { textoHora } from '@/lib/horarios';
import { useAstra } from '@/lib/store';
import { useTheme } from '@/hooks/use-theme'; // <- Adicionado para usar a cor primária no tintColor
import type { Atividade } from '@/lib/types';

type Filtro = 'pendentes' | 'concluidas';

export default function Agenda() {
  const { atividades, alternarConcluida, adicionarAtividade, removerAtividade, pendentesHorario, confirmarHorario, sigaa } = useAstra();
  const t = useTheme(); // <- Instancia o tema atual
  const [filtro, setFiltro] = useState<Filtro>('pendentes');
  const [formAberto, setFormAberto] = useState(false);
  const [atualizando, setAtualizando] = useState(false); // <- Estado de reload

  // Função disparada ao puxar a tela para baixo
  async function aoAtualizar() {
    setAtualizando(true);
    // Aqui você pode chamar a sincronização real da agenda/SIGAA se houver
    setTimeout(() => {
      setAtualizando(false);
    }, 1200);
  }

  const lista = atividades.filter((a) => (filtro === 'pendentes' ? !a.concluida : a.concluida));

  const porDia = useMemo(() => {
    const mapa = new Map<string, Atividade[]>();
    lista.forEach((a) => {
      const k = chaveDia(new Date(a.data));
      mapa.set(k, [...(mapa.get(k) ?? []), a]);
    });
    return [...mapa.entries()];
  }, [lista]);

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
        titulo="Agenda"
        subtitulo="Prazos e avaliações de todas as fontes."
        acao={
          <Botao
            titulo={formAberto ? 'Fechar' : 'Adicionar'}
            icone={formAberto ? 'close' : 'add'}
            variante="secundario"
            onPress={() => setFormAberto((v) => !v)}
          />
        }
      />

      <ConfirmarHorarios itens={pendentesHorario} onConfirmar={confirmarHorario} />

      {formAberto ? (
        <NovaAtividade
          disciplinas={(sigaa?.disciplinas ?? []).map((d) => d.titulo)}
          onSalvar={(a) => {
            adicionarAtividade(a);
            setFormAberto(false);
            setFiltro('pendentes');
          }}
        />
      ) : null}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip rotulo="Pendentes" ativo={filtro === 'pendentes'} onPress={() => setFiltro('pendentes')} />
        <Chip rotulo="Concluídas" ativo={filtro === 'concluidas'} onPress={() => setFiltro('concluidas')} />
      </View>

      {porDia.length === 0 ? (
        <Cartao>
          <Vazio
            icone="calendar-clear-outline"
            titulo={filtro === 'pendentes' ? 'Nada pendente' : 'Nenhuma atividade concluída'}
            texto={
              filtro === 'pendentes'
                ? 'Conecte o SIGAA, importe mensagens ou adicione uma tarefa.'
                : 'As atividades que você marcar como feitas aparecem aqui.'
            }
          />
        </Cartao>
      ) : (
        porDia.map(([dia, itens]) => (
          <Secao key={dia} titulo={rotuloDia(new Date(itens[0].data))}>
            {itens.map((a) => (
              <LinhaAtividade
                key={a.id}
                atividade={a}
                onAlternar={() => alternarConcluida(a.id)}
                onRemover={a.fonte === 'manual' ? () => removerAtividade(a.id) : undefined}
              />
            ))}
          </Secao>
        ))
      )}
    </Tela>
  );
}

function LinhaAtividade({
  atividade: a,
  onAlternar,
  onRemover,
}: {
  atividade: Atividade;
  onAlternar: () => void;
  onRemover?: () => void;
}) {
  const detalhe = [a.tipo === 'avaliacao' ? 'Avaliação' : a.tipo === 'questionario' ? 'Questionário' : null, a.disciplina]
    .filter(Boolean)
    .join(' · ');
  return (
    <Cartao>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <Pressable
          onPress={onAlternar}
          hitSlop={10}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: a.concluida }}
          accessibilityLabel={`Marcar "${a.titulo}" como ${a.concluida ? 'pendente' : 'concluída'}`}
        >
          <Icone
            nome={a.concluida ? 'checkmark-circle' : 'ellipse-outline'}
            tamanho={26}
            cor={a.concluida ? 'success' : 'textMuted'}
          />
        </Pressable>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt
            v="subtitulo"
            style={a.concluida ? { textDecorationLine: 'line-through', opacity: 0.6 } : undefined}
          >
            {a.titulo}
          </Txt>
          {detalhe ? (
            <Txt v="legenda" cor="textSecondary">
              {detalhe}
            </Txt>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Txt v="legenda" cor="primary" style={{ fontWeight: '700' }}>
              {textoHora(a)}
            </Txt>
            <SeloFonte fonte={a.fonte} />
          </View>
        </View>
        {onRemover ? (
          <Pressable onPress={onRemover} hitSlop={10} accessibilityRole="button" accessibilityLabel="Remover tarefa">
            <Icone nome="trash-outline" cor="textMuted" />
          </Pressable>
        ) : null}
      </View>
    </Cartao>
  );
}

function NovaAtividade({
  disciplinas,
  onSalvar,
}: {
  disciplinas: string[];
  onSalvar: (a: {
    titulo: string;
    disciplina?: string;
    data: string;
    tipo: Atividade['tipo'];
    horaNaoInformada?: boolean;
  }) => void;
}) {
  const [titulo, setTitulo] = useState('');
  const [disciplina, setDisciplina] = useState('');
  const [dia, setDia] = useState('');
  const [horario, setHorario] = useState('');
  const [erro, setErro] = useState('');

  function salvar() {
    if (titulo.trim().length < 3) return setErro('Dê um nome para a tarefa.');
    const data = lerDataHora(dia, horario);
    if (!data) return setErro('Use a data no formato 25/10 e a hora como 14:30.');
    const disciplinaFinal = disciplina.trim() && disciplina !== NAO_INFORMADO_TEXTO ? disciplina.trim() : undefined;
    onSalvar({
      titulo: titulo.trim(),
      disciplina: disciplinaFinal,
      data: data.toISOString(),
      tipo: 'tarefa',
      // Sem hora, a tarefa fica "horário não informado" (sem perguntar de novo)
      horaNaoInformada: horario.trim() ? undefined : true,
    });
  }

  return (
    <Cartao>
      <Campo rotulo="Tarefa" value={titulo} onChangeText={setTitulo} placeholder="Ex.: Estudar para a prova" />
      {disciplinas.length > 0 ? (
        <Seletor rotulo="Disciplina" opcoes={disciplinas} valor={disciplina} onChange={setDisciplina} />
      ) : (
        <Campo rotulo="Disciplina (opcional)" value={disciplina} onChangeText={setDisciplina} />
      )}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Campo rotulo="Data" value={dia} onChangeText={setDia} placeholder="dd/mm" keyboardType="numbers-and-punctuation" />
        </View>
        <View style={{ flex: 1 }}>
          <Campo rotulo="Hora (opcional)" value={horario} onChangeText={setHorario} placeholder="hh:mm" keyboardType="numbers-and-punctuation" />
        </View>
      </View>
      {erro ? <Mensagem tom="erro" texto={erro} /> : null}
      <Botao titulo="Salvar tarefa" onPress={salvar} />
    </Cartao>
  );
}
