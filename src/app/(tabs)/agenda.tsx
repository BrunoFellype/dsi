import { useMemo, useRef, useState } from 'react';
import { Modal, Pressable, RefreshControl, View } from 'react-native';

import { ConfirmarHorarios } from '@/components/confirmarHorarios';
import { NAO_INFORMADO_TEXTO, Seletor } from '@/components/seletor';
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
import { useTheme } from '@/hooks/use-theme'; // <- Adicionado para usar a cor primária no tintColor
import { chaveDia, lerDataHora, rotuloDia } from '@/lib/datas';
import { textoHora } from '@/lib/horarios';
import { useAstra } from '@/lib/store';
import type { Atividade } from '@/lib/types';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
type Filtro = 'pendentes' | 'concluidas';

export default function Agenda() {
  const { atividades, alternarConcluida, adicionarAtividade, removerAtividade, atualizarAtividade, pendentesHorario, confirmarHorario, sigaa } = useAstra();
  const t = useTheme(); // <- Instancia o tema atual
  const [filtro, setFiltro] = useState<Filtro>('pendentes');
  const [formAberto, setFormAberto] = useState(false);
  const [atualizando, setAtualizando] = useState(false); // <- Estado de reload

  // Estados para controle do modal e campos de edição de tarefas manuais
  const [editando, setEditando] = useState<Atividade | null>(null);
  const [tituloEdicao, setTituloEdicao] = useState('');
  const [disciplinaEdicao, setDisciplinaEdicao] = useState('');
  const [diaEdicao, setDiaEdicao] = useState('');
  const [horarioEdicao, setHorarioEdicao] = useState('');
  const [erroEdicao, setErroEdicao] = useState('');

  // Abre o modal de edição preenchendo os campos com as informações atuais da atividade
  function abrirEdicao(a: Atividade) {
    const dataObj = new Date(a.data);
    const d = String(dataObj.getDate()).padStart(2, '0');
    const m = String(dataObj.getMonth() + 1).padStart(2, '0');
    const h = String(dataObj.getHours()).padStart(2, '0');
    const min = String(dataObj.getMinutes()).padStart(2, '0');

    setEditando(a);
    setTituloEdicao(a.titulo);
    setDisciplinaEdicao(a.disciplina ?? '');
    setDiaEdicao(`${d}/${m}`);
    setHorarioEdicao(a.horaNaoInformada ? '' : `${h}:${min}`);
    setErroEdicao('');
  }

  // Valida os campos editados e atualiza a atividade manual na lista através do store
  function salvarEdicao() {
    if (!editando) return;
    if (tituloEdicao.trim().length < 3) return setErroEdicao('Dê um nome para a tarefa.');

    const data = lerDataHora(diaEdicao, horarioEdicao);
    if (!data) return setErroEdicao('Data ou horário inválidos. Use DD/MM e HH:MM.');

    atualizarAtividade(editando.id, {
      titulo: tituloEdicao.trim(),
      disciplina: disciplinaEdicao.trim() && disciplinaEdicao !== NAO_INFORMADO_TEXTO ? disciplinaEdicao.trim() : undefined,
      data: data.toISOString(),
      horaNaoInformada: horarioEdicao.trim() ? undefined : true,
    });
    setEditando(null);
  }

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
                onEditar={a.fonte === 'manual' ? () => abrirEdicao(a) : undefined}
              />
            ))}
          </Secao>
        ))
      )}
      {/* Modal para edição dos dados de tarefas manuais */}
      <Modal visible={editando !== null} transparent animationType="slide" onRequestClose={() => setEditando(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setEditando(null)} />
          <Cartao style={{ backgroundColor: t.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 14 }}>
            <Txt v="subtitulo">Editar Tarefa</Txt>
            <Campo rotulo="Título" value={tituloEdicao} onChangeText={setTituloEdicao} />
            {(sigaa?.disciplinas ?? []).length > 0 ? (
              <Seletor
                rotulo="Disciplina"
                opcoes={(sigaa?.disciplinas ?? []).map((d) => d.titulo)}
                valor={disciplinaEdicao}
                onChange={setDisciplinaEdicao}
              />
            ) : (
              <Campo rotulo="Disciplina (opcional)" value={disciplinaEdicao} onChangeText={setDisciplinaEdicao} />
            )}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Campo rotulo="Data" value={diaEdicao} onChangeText={setDiaEdicao} placeholder="dd/mm" keyboardType="numeric" maxLength={5} />
              </View>
              <View style={{ flex: 1 }}>
                <Campo rotulo="Hora" value={horarioEdicao} onChangeText={setHorarioEdicao} placeholder="hh:mm" keyboardType="numeric" maxLength={5} />
              </View>
            </View>
            {erroEdicao ? <Mensagem tom="erro" texto={erroEdicao} /> : null}
            <Botao titulo="Salvar alterações" onPress={salvarEdicao} />
            <Botao titulo="Cancelar" variante="texto" onPress={() => setEditando(null)} />
          </Cartao>
        </View>
      </Modal>
    </Tela>
  );
}

function LinhaAtividade({
  atividade: a,
  onAlternar,
  onRemover,
  onEditar,
}: {
  atividade: Atividade;
  onAlternar: () => void;
  onRemover?: () => void;
  onEditar?: () => void;
}) {
  const t = useTheme();
  const swipeableRef = useRef<SwipeableMethods>(null);
  
  // Estado local para dar o feedback visual imediato antes de sumir
  const [concluindoLocal, setConcluindoLocal] = useState(a.concluida);

  // Sincroniza o estado local caso mude externamente
  useState(() => {
    setConcluindoLocal(a.concluida);
  });

  const detalhe = [a.tipo === 'avaliacao' ? 'Avaliação' : a.tipo === 'questionario' ? 'Questionário' : null, a.disciplina]
    .filter(Boolean)
    .join(' · ');

  function lidarComCliqueAlternar() {
    const proximoEstado = !concluindoLocal;
    setConcluindoLocal(proximoEstado); // Feedback visual instantâneo

    // Aguarda 600ms para o usuário ver o feedback antes de sumir/mudar de lista
    setTimeout(() => {
      onAlternar();
    }, 600);
  }

  // Botão revelado ao arrastar para o lado (Swipe)
  const renderAcoesDireita = () => {
    if (!onRemover) return null;
    return (
      <Pressable
        onPress={() => {
          swipeableRef.current?.close();
          onRemover();
        }}
        style={{
          backgroundColor: '#ef4444',
          justifyContent: 'center',
          alignItems: 'center',
          width: 80,
          borderRadius: 12,
          marginVertical: 4,
          marginLeft: 8,
        }}
      >
        <Icone nome="trash-outline" cor="onPrimary" tamanho={24} />
      </Pressable>
    );
  };

  return (
    <ReanimatedSwipeable ref={swipeableRef} renderRightActions={renderAcoesDireita}>
      <Cartao onPress={onEditar}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <Pressable
            onPress={lidarComCliqueAlternar}
            hitSlop={10}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: concluindoLocal }}
            accessibilityLabel={`Marcar "${a.titulo}" como ${concluindoLocal ? 'pendente' : 'concluída'}`}
          >
            <Icone
              nome={concluindoLocal ? 'checkmark-circle' : 'ellipse-outline'}
              tamanho={26}
              cor={concluindoLocal ? 'success' : 'textMuted'}
            />
          </Pressable>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt
              v="subtitulo"
              style={concluindoLocal ? { textDecorationLine: 'line-through', opacity: 0.6 } : undefined}
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
        </View>
      </Cartao>
    </ReanimatedSwipeable>
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

  // Função para aplicar máscara automática na Data (dd/mm)
  function handleMudarData(texto: string) {
    const numeros = texto.replace(/\D/g, '').slice(0, 4);
    let formatado = numeros;
    if (numeros.length > 2) {
      formatado = `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}`;
    }
    setDia(formatado);
  }

  // Função para aplicar máscara automática na Hora (hh:mm)
  function handleMudarHorario(texto: string) {
    const numeros = texto.replace(/\D/g, '').slice(0, 4);
    let formatado = numeros;
    if (numeros.length > 2) {
      formatado = `${numeros.slice(0, 2)}:${numeros.slice(2, 4)}`;
    }
    setHorario(formatado);
  }

  function salvar() {
    if (titulo.trim().length < 3) return setErro('Dê um nome para a tarefa.');

    // 1. Validação de Estrutura (se o usuário preencheu parcialmente)
    if (dia.length > 0 && dia.length < 5) {
      return setErro('Data incompleta. Digite no formato DD/MM.');
    }
    if (horario.length > 0 && horario.length < 5) {
      return setErro('Horário incompleto. Digite no formato HH:MM.');
    }

    // 2. Validação de Valores Reais (Datas/Horas inválidas como 32/13 ou 25:99)
    if (dia.length === 5) {
      const [d, m] = dia.split('/').map(Number);
      if (m < 1 || m > 12 || d < 1 || d > 31) {
        return setErro('Data inválida. Verifique o dia e o mês informados.');
      }
    }

    if (horario.length === 5) {
      const [h, min] = horario.split(':').map(Number);
      if (h > 23 || min > 59) {
        return setErro('Horário inválido. As horas vão até 23 e os minutos até 59.');
      }
    }

    const data = lerDataHora(dia, horario);
    if (!data) return setErro('Não foi possível interpretar a data informada.');

    const disciplinaFinal = disciplina.trim() && disciplina !== NAO_INFORMADO_TEXTO ? disciplina.trim() : undefined;
    
    onSalvar({
      titulo: titulo.trim(),
      disciplina: disciplinaFinal,
      data: data.toISOString(),
      tipo: 'tarefa',
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
          <Campo
            rotulo="Data"
            value={dia}
            onChangeText={handleMudarData}
            placeholder="dd/mm"
            keyboardType="numeric"
            maxLength={5}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Campo
            rotulo="Hora (opcional)"
            value={horario}
            onChangeText={handleMudarHorario}
            placeholder="hh:mm"
            keyboardType="numeric"
            maxLength={5}
          />
        </View>
      </View>
      {erro ? <Mensagem tom="erro" texto={erro} /> : null}
      <Botao titulo="Salvar tarefa" onPress={salvar} />
    </Cartao>
  );
}