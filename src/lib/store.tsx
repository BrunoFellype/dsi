import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { auth } from '../services/firebase';
import type { AccentColor } from '@/constants/colors';
import { AparenciaContext, type ModoAparencia } from '@/hooks/appearance-context';
import { obterOuRenovarTokenClassroom } from '../services/googleSignin';
import { buscarResumoSigaa, PONTE_PADRAO } from './api';
import { buscarDadosGoogleClassroom } from './classroomApi';
import {
  apagarCredenciais,
  apagarTokenClassroom,
  cofreDisponivel,
  lerCredenciais,
  lerTokenClassroom,
  salvarCredenciais,
} from './cofre';
import {
  desfazerCorrecaoDoAviso,
  editarAvisoNaLista,
  removerAvisoEComCorrecoes,
  removerRegistroDoDia,
  type EdicaoAviso,
} from './crud';
import { chaveDia, diasAte } from './datas';
import { avisosDemo, diarioDemo, resumoDemo } from './demo';
import { aplicarHorarios, chaveHorario, lerHora, NAO_INFORMADO, pendentesDeHorario, semHoraNoSigaa } from './horarios';
import { agendarLembretes, cancelarLembretes, lembretesDisponiveis, pedirPermissaoLembretes } from './lembretes';
import { calcularNotificacoes } from './lembretesLogica';
import { agruparAvisos, agruparRepetidos, type ResultadoAgrupamento } from './ml';
import { criarAvisos, detectarDisciplina } from './parse';
import { buscarResumoNativo, sigaaNativoDisponivel } from './sigaaNativo';
import { precisaAtualizar } from './sync';
import type { Atividade, Aviso, Disciplina, FonteId, RegistroDiario, ResumoSigaa, StatusClassroom } from './types';

export type Sessao = 'carregando' | 'logado' | 'demo' | 'anonimo';
export type { ModoAparencia } from '@/hooks/appearance-context';

const CHAVE_APARENCIA = 'astra:aparencia:v1';
const MODOS_APARENCIA: ModoAparencia[] = ['claro', 'escuro', 'automatico'];
const CORES_DESTAQUE: AccentColor[] = ['original', 'verde', 'roxo', 'violeta', 'turquesa', 'ambar'];

function eModoAparencia(valor: unknown): valor is ModoAparencia {
  return typeof valor === 'string' && MODOS_APARENCIA.includes(valor as ModoAparencia);
}

function eCorDestaque(valor: unknown): valor is AccentColor {
  return typeof valor === 'string' && CORES_DESTAQUE.includes(valor as AccentColor);
}

interface Persistido {
  avisos: Aviso[];
  manuais: Atividade[];
  /** Atividades sincronizadas da Google Classroom API. */
  classroomAtividades: Atividade[];
  /** Disciplinas e turmas ativas do Google Classroom. */
  classroomDisciplinas: Disciplina[];
  /** Status da conexão e sincronização com o Google Classroom. */
  statusClassroom: StatusClassroom;
  sigaa: ResumoSigaa | null;
  sigaaEm: string | null;
  concluidas: Record<string, true>;
  diario: RegistroDiario[];
  correcoes: Record<string, string>;
  /** Horários confirmados pelo estudante para prazos que vieram sem hora ('HH:MM' ou 'nao-informado'). */
  horarios: Record<string, string>;
  ponte: string;
  /** De onde ler o SIGAA: direto no celular ou por um servidor (ponte). */
  modoSigaa: 'nativo' | 'ponte';
  /** Lembretes de prazo no celular. */
  lembretes: boolean;
  /** Resumo diário às 7h30 com os prazos do dia. */
  resumoDiario: boolean;
  /** A senha do SIGAA está no cofre seguro deste aparelho. */
  lembrarSenha: boolean;
}

const VAZIO: Persistido = {
  avisos: [],
  manuais: [],
  classroomAtividades: [],
  classroomDisciplinas: [],
  statusClassroom: {
    conectado: false,
    sincronizando: false,
    erro: null,
  },
  sigaa: null,
  sigaaEm: null,
  concluidas: {},
  diario: [],
  correcoes: {},
  horarios: {},
  ponte: PONTE_PADRAO,
  modoSigaa: sigaaNativoDisponivel ? 'nativo' : 'ponte',
  lembretes: false,
  resumoDiario: false,
  lembrarSenha: false,
};

interface Contexto extends Persistido {
  modoAparencia: ModoAparencia;
  corDestaque: AccentColor;
  definirModoAparencia: (modo: ModoAparencia) => void;
  definirCorDestaque: (cor: AccentColor) => void;
  sessao: Sessao;
  nome: string;
  atividades: Atividade[];
  disciplinas: Disciplina[];
  agrupamento: ResultadoAgrupamento;
  repetidos: Record<string, Aviso[]>;
  entrarDemo: () => void;
  sair: () => void;
  conectarSigaa: (usuario: string, senha: string, lembrar?: boolean) => Promise<void>;
  /** Atualização automática do SIGAA em andamento e último erro dela. */
  sincronizando: boolean;
  erroSync: string;
  desconectarSigaa: () => void;
  importarMensagens: (texto: string, fonte: FonteId) => number;
  removerAvisosDaFonte: (fonte: FonteId) => void;
  removerAviso: (id: string) => void;
  editarAviso: (id: string, edicao: EdicaoAviso) => void;
  /** Atividades futuras que esperam o estudante confirmar o horário. */
  pendentesHorario: Atividade[];
  confirmarHorario: (atividade: Atividade, valor: string) => void;
  desfazerCorrecao: (avisoId: string) => void;
  removerRegistroDiario: (dia: string) => void;
  alternarConcluida: (id: string) => void;
  adicionarAtividade: (a: Omit<Atividade, 'id' | 'concluida' | 'fonte'>) => void;
  removerAtividade: (id: string) => void;
  atualizarAtividade: (id: string, dados: Partial<Omit<Atividade, 'id'>>) => void;
  registrarDia: (r: Omit<RegistroDiario, 'dia'>) => void;
  corrigirGrupo: (avisoId: string, ancoraId: string) => void;
  definirPonte: (url: string) => void;
  definirModoSigaa: (modo: 'nativo' | 'ponte') => void;
  /** Liga ou desliga os lembretes. Devolve false se o usuário negou a permissão. */
  alternarLembretes: (ligar: boolean) => Promise<boolean>;
  alternarResumoDiario: (ligar: boolean) => Promise<boolean>;
  /** Sincroniza tarefas, avisos e notas do Google Classroom via Classroom API. */
  sincronizarClassroom: (tokenDireto?: string, emailDireto?: string) => Promise<void>;
  /** Desconecta a conta do Google Classroom e remove os dados sincronizados. */
  desconectarClassroom: () => Promise<void>;
}

const AstraContext = createContext<Contexto | null>(null);

const resumoParaAtividades = (r: ResumoSigaa | null): Atividade[] =>
  (r?.atividades ?? []).map((a) => ({
    id: a.id,
    titulo: a.titulo,
    disciplina: a.disciplina,
    data: a.data,
    fonte: 'sigaa',
    tipo: a.tipo,
    concluida: a.concluida,
    semHora: semHoraNoSigaa(a.data) || undefined,
  }));

function tituloDoAviso(texto: string): string {
  const primeira = texto.split(/(?<=[.!?])\s/)[0].trim();
  return primeira.length > 72 ? `${primeira.slice(0, 69)}...` : primeira;
}

export function AstraProvider({ children }: { children: React.ReactNode }) {
  const [modoAparencia, setModoAparencia] = useState<ModoAparencia>('automatico');
  const [corDestaque, setCorDestaque] = useState<AccentColor>('original');
  const [preferenciasAparenciaCarregadas, setPreferenciasAparenciaCarregadas] = useState(false);
  const [sessao, setSessao] = useState<Sessao>('carregando');
  const [chave, setChave] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [dados, setDados] = useState<Persistido>(VAZIO);
  const carregado = useRef(false);
  const modoDemo = useRef(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [erroSync, setErroSync] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(CHAVE_APARENCIA)
      .then((bruto) => {
        if (!bruto) return;
        const preferencias: unknown = JSON.parse(bruto);
        if (!preferencias || typeof preferencias !== 'object') return;
        const dadosAparencia = preferencias as { modo?: unknown; cor?: unknown };
        if (eModoAparencia(dadosAparencia.modo)) setModoAparencia(dadosAparencia.modo);
        if (eCorDestaque(dadosAparencia.cor)) setCorDestaque(dadosAparencia.cor);
      })
      .catch(() => console.warn('Não foi possível carregar as preferências de aparência.'))
      .finally(() => setPreferenciasAparenciaCarregadas(true));
  }, []);

  useEffect(() => {
    if (!preferenciasAparenciaCarregadas) return;
    AsyncStorage.setItem(CHAVE_APARENCIA, JSON.stringify({ modo: modoAparencia, cor: corDestaque }))
      .catch(() => console.warn('Não foi possível salvar as preferências de aparência.'));
  }, [corDestaque, modoAparencia, preferenciasAparenciaCarregadas]);

  const definirModoAparencia = useCallback((modo: ModoAparencia) => setModoAparencia(modo), []);
  const definirCorDestaque = useCallback((cor: AccentColor) => setCorDestaque(cor), []);

  // Referência sempre atual para funções que não podem depender do estado (evita recriá-las)
  const dadosRef = useRef(dados);
  const chaveRef = useRef<string | null>(null);

  useEffect(() => {
    dadosRef.current = dados;
  }, [dados]);

  useEffect(() => {
    chaveRef.current = chave;
  }, [chave]);

  // Sessão: Firebase ou modo demonstração
  useEffect(() => {
    // Sem rede o Firebase pode demorar a responder: depois de 6 s mostramos o login
    const limite = setTimeout(() => setSessao((s) => (s === 'carregando' ? 'anonimo' : s)), 6000);
    const cancelar = onAuthStateChanged(auth, (usuario) => {
      clearTimeout(limite);
      if (usuario) {
        modoDemo.current = false;
        setNome(usuario.displayName ?? '');
        setChave(usuario.uid);
        setSessao('logado');
      } else if (!modoDemo.current) {
        setChave(null);
        setSessao('anonimo');
      }
    });
    return () => {
      clearTimeout(limite);
      cancelar();
    };
  }, []);

  // Carrega os dados salvos de quem entrou
  useEffect(() => {
    // O modo demonstração já define os próprios dados e nunca lê nem grava no aparelho
    if (!chave || chave === 'demo') return;
    carregado.current = false;
    AsyncStorage.getItem(`astra:v1:${chave}`)
      .then((bruto) => {
        if (bruto) {
          const dadosRestaurados = JSON.parse(bruto);
          // Reseta o estado de sincronização ao restaurar do armazenamento local para evitar loading infinito residual
          setDados({
            ...VAZIO,
            ...dadosRestaurados,
            statusClassroom: {
              ...(dadosRestaurados.statusClassroom ?? VAZIO.statusClassroom),
              sincronizando: false,
            },
          });
        } else {
          setDados(VAZIO);
        }
      })
      .catch(() => setDados(VAZIO))
      .finally(() => {
        carregado.current = true;
      });
  }, [chave]);

  // Salva a cada mudança (o modo demonstração parte sempre do zero)
  useEffect(() => {
    if (!chave || !carregado.current || sessao === 'demo') return;
    AsyncStorage.setItem(`astra:v1:${chave}`, JSON.stringify(dados)).catch(() => {});
  }, [dados, chave, sessao]);

  const entrarDemo = useCallback(() => {
    // O modo demonstração já define os próprios dados e nunca lê nem grava no aparelho
    modoDemo.current = true;
    carregado.current = true;
    setNome('Estudante');
    setDados({
      ...VAZIO,
      avisos: avisosDemo(),
      sigaa: resumoDemo(),
      sigaaEm: new Date().toISOString(),
      diario: diarioDemo(),
    });
    setChave('demo');
    setSessao('demo');
  }, []);

  const sair = useCallback(() => {
    void cancelarLembretes();
    if (chaveRef.current) void apagarCredenciais(chaveRef.current);
    modoDemo.current = false;
    setDados(VAZIO);
    setChave(null);
    setSessao('anonimo');
  }, []);

  const aplicarResumo = useCallback((resumo: ResumoSigaa) => {
    const nomes = resumo.disciplinas.map((x) => x.titulo);
    setDados((d) => ({
      ...d,
      sigaa: resumo,
      sigaaEm: new Date().toISOString(),
      // Avisos importados antes da conexão passam a reconhecer a disciplina
      avisos: d.avisos.map((a) => (a.disciplina ? a : { ...a, disciplina: detectarDisciplina(a.texto, nomes) })),
    }));
  }, []);

  const lerSigaa = useCallback(async (usuario: string, senha: string) => {
    const { modoSigaa, ponte } = dadosRef.current;
    return modoSigaa === 'nativo' && sigaaNativoDisponivel
      ? buscarResumoNativo(usuario, senha)
      : buscarResumoSigaa(ponte, usuario, senha);
  }, []);

  const conectarSigaa = useCallback(
    async (usuario: string, senha: string, lembrar = false) => {
      const resumo = await lerSigaa(usuario, senha);
      aplicarResumo(resumo);
      setErroSync('');
      const uid = chaveRef.current;
      if (cofreDisponivel && uid && uid !== 'demo') {
        if (lembrar) {
          await salvarCredenciais(uid, { usuario, senha }).catch(() => {});
          setDados((d) => ({ ...d, lembrarSenha: true }));
        } else {
          await apagarCredenciais(uid);
          setDados((d) => ({ ...d, lembrarSenha: false }));
        }
      }
    },
    [aplicarResumo, lerSigaa]
  );

  const desconectarSigaa = useCallback(() => {
    const uid = chaveRef.current;
    if (uid) void apagarCredenciais(uid);
    setErroSync('');
    setDados((d) => ({ ...d, sigaa: null, sigaaEm: null, lembrarSenha: false }));
  }, []);

  /**
   * Sincronização com o Google Classroom:
   * Obtém ou renova o token OAuth, consulta cursos, tarefas e mural na API,
   * e mescla com os dados locais marcando entregas já concluídas.
   */
  const sincronizarClassroom = useCallback(
    async (tokenDireto?: string, emailDireto?: string) => {
      setDados((d) => ({
        ...d,
        statusClassroom: { ...d.statusClassroom, sincronizando: true, erro: null },
      }));

      try {
        let token = tokenDireto;
        let email = emailDireto;

        if (!token) {
          const sessaoSalva = await lerTokenClassroom();
          if (sessaoSalva?.accessToken) {
            token = sessaoSalva.accessToken;
            email = sessaoSalva.email;
          } else {
            const renovado = await obterOuRenovarTokenClassroom();
            token = renovado.accessToken;
            email = renovado.email;
          }
        }

        const pacote = await buscarDadosGoogleClassroom(token);

        setDados((d) => {
          const outrosAvisos = d.avisos.filter((a) => a.fonte !== 'classroom');
          const concluidas = { ...d.concluidas };

          pacote.atividades.forEach((a) => {
            if (a.concluida) concluidas[a.id] = true;
          });

          return {
            ...d,
            avisos: [...pacote.avisos, ...outrosAvisos],
            classroomAtividades: pacote.atividades,
            classroomDisciplinas: pacote.disciplinas,
            concluidas,
            statusClassroom: {
              conectado: true,
              sincronizando: false,
              email: email || d.statusClassroom?.email,
              ultimaSincronizacao: pacote.sincronizadoEm,
              erro: null,
            },
          };
        });
      } catch (err: any) {
        // Se o usuário fechou o popup/janela do Google, não exibe erro na tela e apenas destrava o botão
        const popupFechado =
          err?.code === 'auth/popup-closed-by-user' ||
          err?.code === 'auth/cancelled-popup-request' ||
          err?.message?.includes('closed-by-user');

        if (!popupFechado) {
          await apagarTokenClassroom();
        }

        setDados((d) => ({
          ...d,
          statusClassroom: {
            ...d.statusClassroom,
            conectado: false,
            sincronizando: false,
            erro: popupFechado
              ? null
              : err?.message === 'TOKEN_EXPIRADO_OU_SEM_PERMISSAO'
              ? 'Sessão do Google Classroom expirou. Conecte novamente.'
              : err?.message || 'Falha ao sincronizar Google Classroom.',
          },
        }));
      } finally {
        // Garante que o loading seja sempre desligado, mesmo em cancelamentos ou erros inesperados
        setDados((d) => ({
          ...d,
          statusClassroom: {
            ...d.statusClassroom,
            sincronizando: false,
          },
        }));
      }
    },
    []
  );

  /** Desconecta a conta do Google Classroom, remove o token do cofre e limpa os dados associados. */
  const desconectarClassroom = useCallback(async () => {
    await apagarTokenClassroom();
    setDados((d) => ({
      ...d,
      avisos: d.avisos.filter((a) => a.fonte !== 'classroom'),
      classroomAtividades: [],
      classroomDisciplinas: [],
      statusClassroom: {
        conectado: false,
        sincronizando: false,
        erro: null,
      },
    }));
  }, []);

  // Tenta sincronizar automaticamente o Google Classroom ao abrir o app se houver token salvo
  useEffect(() => {
    let ativo = true;
    lerTokenClassroom().then((sessaoClass) => {
      if (ativo && sessaoClass?.accessToken && !dadosRef.current.statusClassroom?.conectado) {
        void sincronizarClassroom(sessaoClass.accessToken, sessaoClass.email);
      }
    });
    return () => {
      ativo = false;
    };
  }, [sincronizarClassroom]);

  const importarMensagens = useCallback((texto: string, fonte: FonteId) => {
    const disciplinas = (dadosRef.current.sigaa?.disciplinas ?? []).map((x) => x.titulo);
    const novos = criarAvisos(texto, fonte, disciplinas);
    setDados((d) => {
      const existentes = new Set(d.avisos.map((a) => `${a.fonte}|${a.texto}`));
      const unicos = novos.filter((a) => !existentes.has(`${a.fonte}|${a.texto}`));
      return { ...d, avisos: [...unicos, ...d.avisos] };
    });
    return novos.length;
  }, []);

  const removerAvisosDaFonte = useCallback(
    (fonte: FonteId) => setDados((d) => ({ ...d, avisos: d.avisos.filter((a) => a.fonte !== fonte) })),
    []
  );

  const removerAviso = useCallback(
    (id: string) =>
      setDados((d) => ({ ...d, ...removerAvisoEComCorrecoes(d.avisos, d.correcoes, id) })),
    []
  );

  const editarAviso = useCallback(
    (id: string, edicao: EdicaoAviso) =>
      setDados((d) => {
        const horarios = { ...d.horarios };
        // Quem edita o prazo já decidiu o horário
        if (edicao.prazo !== undefined) delete horarios[id];
        return { ...d, avisos: editarAvisoNaLista(d.avisos, id, edicao), horarios };
      }),
    []
  );

  const confirmarHorario = useCallback(
    (atividade: Atividade, valor: string) =>
      setDados((d) => {
        // Prazo que veio de uma mensagem: corrige a própria mensagem, para tudo mostrar o mesmo horário
        if (d.avisos.some((a) => a.id === atividade.id)) {
          const hm = valor === NAO_INFORMADO ? null : lerHora(valor);
          const data = new Date(atividade.data);
          if (hm) data.setHours(hm.h, hm.m, 0, 0);
          return {
            ...d,
            avisos: editarAvisoNaLista(d.avisos, atividade.id, { prazo: data.toISOString(), horaNaoInformada: !hm }),
          };
        }
        return { ...d, horarios: { ...d.horarios, [chaveHorario(atividade)]: valor } };
      }),
    []
  );

  const desfazerCorrecao = useCallback(
    (avisoId: string) =>
      setDados((d) => ({ ...d, correcoes: desfazerCorrecaoDoAviso(d.correcoes, avisoId) })),
    []
  );

  const removerRegistroDiario = useCallback(
    (dia: string) => setDados((d) => ({ ...d, diario: removerRegistroDoDia(d.diario, dia) })),
    []
  );

  const alternarConcluida = useCallback(
    (id: string) =>
      setDados((d) => {
        const concluidas = { ...d.concluidas };
        if (concluidas[id]) delete concluidas[id];
        else concluidas[id] = true;
        return { ...d, concluidas };
      }),
    []
  );

  const adicionarAtividade = useCallback(
    (a: Omit<Atividade, 'id' | 'concluida' | 'fonte'>) =>
      setDados((d) => ({
        ...d,
        manuais: [...d.manuais, { ...a, id: `manual-${Date.now()}`, fonte: 'manual', concluida: false }],
      })),
    []
  );

  const removerAtividade = useCallback(
    (id: string) => setDados((d) => ({ ...d, manuais: d.manuais.filter((a) => a.id !== id) })),
    []
  );

  // Permite atualizar os dados de uma tarefa manual por ID no estado global
  const atualizarAtividade = useCallback(
    (id: string, novosDados: Partial<Omit<Atividade, 'id' | 'fonte'>>) =>
      setDados((d) => ({
        ...d,
        manuais: d.manuais.map((item) =>
          item.id === id ? { ...item, ...novosDados } : item
        ),
      })),
    []
  );

  const registrarDia = useCallback(
    (r: Omit<RegistroDiario, 'dia'>) =>
      setDados((d) => {
        const dia = chaveDia(new Date());
        const resto = d.diario.filter((x) => x.dia !== dia);
        return { ...d, diario: [...resto, { dia, ...r }].sort((a, b) => a.dia.localeCompare(b.dia)) };
      }),
    []
  );


  const corrigirGrupo = useCallback(
    (avisoId: string, ancoraId: string) =>
      setDados((d) => ({ ...d, correcoes: { ...d.correcoes, [avisoId]: ancoraId } })),
    []
  );

  const definirPonte = useCallback((url: string) => setDados((d) => ({ ...d, ponte: url.trim() })), []);
  const definirModoSigaa = useCallback((modo: 'nativo' | 'ponte') => setDados((d) => ({ ...d, modoSigaa: modo })), []);

  const avisosOrdenados = useMemo(
    () => [...dados.avisos].sort((a, b) => b.recebidoEm.localeCompare(a.recebidoEm)),
    [dados.avisos]
  );

  const repetidos = useMemo(() => {
    const mapa: Record<string, Aviso[]> = {};
    agruparRepetidos(avisosOrdenados).forEach((g) => {
      mapa[g[0].id] = g;
    });
    return mapa;
  }, [avisosOrdenados]);

  const agrupamento = useMemo(
    () => agruparAvisos(avisosOrdenados, dados.correcoes),
    [avisosOrdenados, dados.correcoes]
  );

  const atividades = useMemo(() => {
    const doSigaa = resumoParaAtividades(dados.sigaa);
    // Atividades importadas da API do Google Classroom
    const doClassroom: Atividade[] = dados.classroomAtividades ?? [];
    // Avisos com prazo: uma atividade por grupo de mensagens repetidas
    const comPrazo = avisosOrdenados.filter((a) => a.prazo && a.fonte !== 'classroom');

    const dosAvisos: Atividade[] = agruparRepetidos(comPrazo)
      .map((g) => g[0])
      .filter(
        (a) =>
          !doSigaa.some(
            (s) => s.disciplina === a.disciplina && diasAte(new Date(s.data), new Date(a.prazo!)) === 0
          )
      )
      .map((a) => ({
        id: a.id,
        titulo: tituloDoAviso(a.texto),
        disciplina: a.disciplina,
        data: a.prazo!,
        fonte: a.fonte,
        tipo: /prova|avalia|exame/i.test(a.texto) ? 'avaliacao' : 'tarefa',
        concluida: false,
        semHora: (a.prazoSemHora && !a.horaNaoInformada) || undefined,
        horaNaoInformada: a.horaNaoInformada,
      }));

    const todas = [...doSigaa, ...doClassroom, ...dosAvisos, ...dados.manuais].map((a) => ({
      ...a,
      concluida: a.concluida || Boolean(dados.concluidas[a.id]),
    }));

    return aplicarHorarios(todas, dados.horarios).sort((a, b) => a.data.localeCompare(b.data));
  }, [dados.sigaa, dados.classroomAtividades, dados.manuais, dados.concluidas, dados.horarios, avisosOrdenados]);

  const disciplinas = useMemo(() => {
    const doSigaa: Disciplina[] = (dados.sigaa?.disciplinas ?? []).map((ds) => ({
      id: `sigaa-${ds.codigo}`,
      codigo: ds.codigo,
      nome: ds.titulo,
      fonte: 'sigaa',
    }));
    // Disciplinas e turmas ativas vindas do Google Classroom
    const doClassroom: Disciplina[] = dados.classroomDisciplinas ?? [];
    return [...doSigaa, ...doClassroom];
  }, [dados.sigaa, dados.classroomDisciplinas]);

  const pendentesHorario = useMemo(() => pendentesDeHorario(atividades), [atividades]);

  const alternarNotificacao = useCallback(async (campo: 'lembretes' | 'resumoDiario', ligar: boolean) => {
    if (ligar && !(await pedirPermissaoLembretes())) return false;
    setDados((d) => {
      const novo = { ...d, [campo]: ligar };
      if (!novo.lembretes && !novo.resumoDiario) void cancelarLembretes();
      return novo;
    });
    return true;
  }, []);

  const alternarLembretes = useCallback((ligar: boolean) => alternarNotificacao('lembretes', ligar), [alternarNotificacao]);
  const alternarResumoDiario = useCallback((ligar: boolean) => alternarNotificacao('resumoDiario', ligar), [alternarNotificacao]);

  // Mantém as notificações do sistema iguais às atividades pendentes
  useEffect(() => {
    if (!lembretesDisponiveis || sessao === 'carregando' || sessao === 'anonimo') return;
    if (!dados.lembretes && !dados.resumoDiario) return;
    void agendarLembretes(calcularNotificacoes(atividades, { lembretes: dados.lembretes, resumoDiario: dados.resumoDiario }));
  }, [atividades, dados.lembretes, dados.resumoDiario, sessao]);

  // Atualização automática do SIGAA (só com a senha guardada no cofre, a pedido do estudante)
  const atualizarSozinho = useCallback(async () => {
    const uid = chaveRef.current;
    const atual = dadosRef.current;
    if (!cofreDisponivel || !uid || uid === 'demo' || !atual.lembrarSenha) return;
    if (!precisaAtualizar(atual.sigaaEm)) return;
    const c = await lerCredenciais(uid);
    if (!c) return;
    setSincronizando(true);
    try {
      aplicarResumo(await lerSigaa(c.usuario, c.senha));
      setErroSync('');
    } catch (e) {
      setErroSync((e as Error).message || 'Não foi possível atualizar o SIGAA.');
    } finally {
      setSincronizando(false);
    }
  }, [aplicarResumo, lerSigaa]);

  const sincronizacaoEmCurso = useRef(false);
  useEffect(() => {
    if (sessao !== 'logado' || !dados.lembrarSenha) return;
    const rodar = async () => {
      if (sincronizacaoEmCurso.current) return;
      sincronizacaoEmCurso.current = true;
      try {
        await atualizarSozinho();
      } finally {
        sincronizacaoEmCurso.current = false;
      }
    };
    void rodar();
    const inscricao = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void rodar();
    });
    return () => inscricao.remove();
  }, [sessao, dados.lembrarSenha, atualizarSozinho]);

  const valor: Contexto = {
    ...dados,
    modoAparencia,
    corDestaque,
    definirModoAparencia,
    definirCorDestaque,
    avisos: avisosOrdenados,
    sessao,
    nome,
    atividades,
    disciplinas,
    agrupamento,
    repetidos,
    entrarDemo,
    sair,
    conectarSigaa,
    desconectarSigaa,
    importarMensagens,
    removerAvisosDaFonte,
    removerAviso,
    editarAviso,
    pendentesHorario,
    confirmarHorario,
    desfazerCorrecao,
    removerRegistroDiario,
    alternarConcluida,
    adicionarAtividade,
    removerAtividade,
    atualizarAtividade,
    registrarDia,
    corrigirGrupo,
    definirPonte,
    definirModoSigaa,
    alternarLembretes,
    alternarResumoDiario,
    sincronizando,
    erroSync,
    statusClassroom: dados.statusClassroom ?? VAZIO.statusClassroom,
    sincronizarClassroom,
    desconectarClassroom,
  };

  return (
    <AparenciaContext.Provider value={{ modoAparencia, corDestaque }}>
      <AstraContext.Provider value={valor}>{children}</AstraContext.Provider>
    </AparenciaContext.Provider>
  );
}

export function useAstra(): Contexto {
  const ctx = useContext(AstraContext);
  if (!ctx) throw new Error('useAstra precisa estar dentro de <AstraProvider>.');
  return ctx;
}

export const useAstraStore = useAstra;