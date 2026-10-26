/**
 * Integração com a Google Classroom REST API v1.
 * Realiza a leitura de cursos ativos, tarefas, comunicados do mural,
 * materiais didáticos, submissões de alunos e perfis de docentes.
 */
import { detectarTipo } from './parse';
import type { Atividade, Aviso, Disciplina } from './types';

const CLASSROOM_BASE_URL = 'https://classroom.googleapis.com/v1';

/** Representação de um curso retornado pela API do Classroom. */
interface GoogleCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  courseState?: string;
  ownerId?: string;
}

/** Componentes de data do prazo de entrega no formato da API do Google. */
interface GoogleDate {
  year: number;
  month: number;
  day: number;
}

/** Horário limite de entrega no formato da API do Google. */
interface GoogleTime {
  hours?: number;
  minutes?: number;
}

/** Tarefa ou trabalho avaliativo de um curso. */
interface GoogleCourseWork {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  dueDate?: GoogleDate;
  dueTime?: GoogleTime;
  maxPoints?: number;
  workType?: string;
  creationTime?: string;
  alternateLink?: string;
  creatorUserId?: string;
}

/** Submissão e status de entrega de uma tarefa do estudante. */
interface GoogleStudentSubmission {
  id: string;
  courseWorkId: string;
  state?: 'NEW' | 'CREATED' | 'TURNED_IN' | 'RETURNED' | 'RECLAIMED_BY_STUDENT';
  assignedGrade?: number;
  late?: boolean;
}

/** Postagem ou aviso no mural do curso. */
interface GoogleAnnouncement {
  id: string;
  courseId: string;
  text: string;
  creationTime?: string;
  updateTime?: string;
  alternateLink?: string;
  creatorUserId?: string;
}

/** Material de apoio ou leitura publicado pelo professor. */
interface GoogleCourseWorkMaterial {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  creationTime?: string;
  alternateLink?: string;
  creatorUserId?: string;
}

/** Membro do curso (professor ou estudante) para resolução de nomes e autoria. */
interface GoogleClassroomMember {
  userId?: string;
  id?: string;
  profile?: {
    id?: string;
    name?: {
      givenName?: string;
      familyName?: string;
      fullName?: string;
    };
    emailAddress?: string;
  };
  name?: {
    fullName?: string;
  };
}

/** Conjunto consolidado de dados obtidos na sincronização do Google Classroom. */
export interface PacoteClassroom {
  disciplinas: Disciplina[];
  atividades: Atividade[];
  avisos: Aviso[];
  sincronizadoEm: string;
}

/**
 * Executa chamadas HTTP autenticadas com Bearer token para os endpoints da API do Classroom.
 * Identifica tokens expirados (401) e erros de autorização (403).
 */
async function fetchClassroom<T>(endpoint: string, accessToken: string): Promise<T> {
  const resposta = await fetch(`${CLASSROOM_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!resposta.ok) {
    const textoErro = await resposta.text().catch(() => '');
    if (resposta.status === 401) {
      throw new Error('TOKEN_EXPIRADO_OU_SEM_PERMISSAO');
    }
    try {
      const jsonErro = JSON.parse(textoErro);
      const mensagemGoogle = jsonErro?.error?.message || textoErro;
      throw new Error(`Google Classroom (403): ${mensagemGoogle}`);
    } catch {
      throw new Error(`Google Classroom (${resposta.status}): ${textoErro || 'Acesso negado'}`);
    }
  }

  return (await resposta.json()) as T;
}

/** Converte a data e hora do Classroom em uma string no padrão ISO 8601. */
function formatarPrazoISO(dueDate?: GoogleDate, dueTime?: GoogleTime): string | undefined {
  if (!dueDate) return undefined;
  const ano = String(dueDate.year).padStart(4, '0');
  const mes = String(dueDate.month).padStart(2, '0');
  const dia = String(dueDate.day).padStart(2, '0');
  const hora = String(dueTime?.hours ?? 23).padStart(2, '0');
  const min = String(dueTime?.minutes ?? 59).padStart(2, '0');
  return `${ano}-${mes}-${dia}T${hora}:${min}:00`;
}

/** Formata a data de entrega no formato legível DD/MM/AAAA. */
function formatarDataCurta(dueDate?: GoogleDate): string {
  if (!dueDate) return 'Sem prazo';
  const dia = String(dueDate.day).padStart(2, '0');
  const mes = String(dueDate.month).padStart(2, '0');
  return `${dia}/${mes}/${dueDate.year}`;
}

/**
 * Consulta e consolida todos os dados do Google Classroom do estudante:
 * - Lista de turmas ativas
 * - Tarefas e prazos de entrega (com status de submissão e notas)
 * - Comunicados do mural
 * - Materiais didáticos
 * - Resolução de nomes dos professores e autores das mensagens
 */
export async function buscarDadosGoogleClassroom(accessToken: string): Promise<PacoteClassroom> {
  // Busca os cursos ativos nos quais o usuário está matriculado ou leciona
  const listaCursos = await fetchClassroom<{ courses?: GoogleCourse[] }>(
    '/courses?courseStates=ACTIVE&pageSize=30',
    accessToken
  );

  const cursos = listaCursos.courses ?? [];
  const disciplinas: Disciplina[] = [];
  const atividades: Atividade[] = [];
  const avisos: Aviso[] = [];

  // Itera sobre cada curso buscando seus recursos em paralelo
  await Promise.all(
    cursos.map(async (curso) => {
      const nomeDisciplina = curso.section ? `${curso.name} (${curso.section})` : curso.name;

      // Consulta simultaneamente tarefas, comunicados do mural, materiais e membros da turma
      const [cwResp, annResp, matResp, teachResp, studResp] = await Promise.all([
        fetchClassroom<{ courseWork?: GoogleCourseWork[] }>(
          `/courses/${curso.id}/courseWork?pageSize=40`,
          accessToken
        ).catch(() => ({ courseWork: [] })),
        fetchClassroom<{ announcements?: GoogleAnnouncement[] }>(
          `/courses/${curso.id}/announcements?pageSize=30`,
          accessToken
        ).catch(() => ({ announcements: [] })),
        fetchClassroom<{ courseWorkMaterial?: GoogleCourseWorkMaterial[] }>(
          `/courses/${curso.id}/courseWorkMaterials?pageSize=30`,
          accessToken
        ).catch(() => ({ courseWorkMaterial: [] })),
        fetchClassroom<{ teachers?: GoogleClassroomMember[] }>(
          `/courses/${curso.id}/teachers?pageSize=20`,
          accessToken
        ).catch(() => ({ teachers: [] })),
        fetchClassroom<{ students?: GoogleClassroomMember[] }>(
          `/courses/${curso.id}/students?pageSize=60`,
          accessToken
        ).catch(() => ({ students: [] })),
      ]);

      // Mapeia os professores do curso por ID
      const mapaProfessores = new Map<string, string>();
      let nomeProfessorTitular: string | undefined;

      for (const t of teachResp.teachers ?? []) {
        const idProf = t.userId || t.profile?.id;
        const nomeProf = t.profile?.name?.fullName || t.profile?.emailAddress;
        if (idProf && nomeProf) {
          mapaProfessores.set(idProf, nomeProf);
          if (!nomeProfessorTitular) nomeProfessorTitular = nomeProf;
        }
      }

      // Se o professor titular/dono não veio na lista geral, consulta seu perfil individual
      if (curso.ownerId && !mapaProfessores.has(curso.ownerId)) {
        const perfilDono = await fetchClassroom<GoogleClassroomMember>(
          `/userProfiles/${curso.ownerId}`,
          accessToken
        ).catch(() => null);

        const nomeDono = perfilDono?.profile?.name?.fullName || perfilDono?.name?.fullName;
        if (nomeDono) {
          mapaProfessores.set(curso.ownerId, nomeDono);
          nomeProfessorTitular = nomeDono;
        }
      }

      // Mapeia os alunos matriculados no curso
      const mapaAlunos = new Map<string, string>();
      for (const s of studResp.students ?? []) {
        const idAluno = s.userId || s.profile?.id;
        const nomeAluno = s.profile?.name?.fullName || s.profile?.emailAddress;
        if (idAluno && nomeAluno) {
          mapaAlunos.set(idAluno, nomeAluno);
        }
      }

      /**
       * Resolve o nome do autor da publicação (professor titular, docente ou estudante),
       * combinando os perfis da turma e o tipo de publicação.
       */
      const resolverAutor = (creatorUserId?: string, texto = '', ehMaterialOuTarefa = false): string => {
        // Dono da sala no Classroom
        if (creatorUserId && curso.ownerId && creatorUserId === curso.ownerId) {
          const nomeDono = mapaProfessores.get(creatorUserId) || nomeProfessorTitular;
          return nomeDono ? `Prof. ${nomeDono}` : 'Professor(a)';
        }

        // Criador presente na lista de docentes
        if (creatorUserId && mapaProfessores.has(creatorUserId)) {
          return `Prof. ${mapaProfessores.get(creatorUserId)!}`;
        }

        // Criador identificado na lista de estudantes
        if (creatorUserId && mapaAlunos.has(creatorUserId)) {
          return mapaAlunos.get(creatorUserId)!;
        }

        // Trabalhos e materiais pedagógicos são criados exclusivamente por docentes
        if (ehMaterialOuTarefa) {
          const nome = nomeProfessorTitular;
          return nome ? `Prof. ${nome}` : 'Professor(a)';
        }

        // Análise semântica do conteúdo da mensagem
        const textoMin = texto.toLowerCase();
        const ehMensagemDeAluno = /^\s*(?:ol[aá]|bom dia|boa tarde|boa noite)?\s*professor\b/i.test(textoMin);
        const ehMensagemDeProfessor = /\b(minha filha|n[aã]o teremos prova|cancelo|cancelar|aula ser[aá] remota|olhem a planilha|mudo o calend[aá]rio|apresenta[cç][aã]o dos trabalhos|remanejad[ao])\b/i.test(textoMin);

        if (ehMensagemDeAluno) {
          return 'Aluno(a)';
        }

        if (ehMensagemDeProfessor) {
          const nome = nomeProfessorTitular;
          return nome ? `Prof. ${nome}` : 'Professor(a)';
        }

        if (creatorUserId) {
          return 'Aluno(a)';
        }

        const fallback = nomeProfessorTitular;
        return fallback ? `Prof. ${fallback}` : 'Professor(a)';
      };

      const trabalhos = cwResp.courseWork ?? [];
      const avisosMural = annResp.announcements ?? [];
      const materiaisAula = matResp.courseWorkMaterial ?? [];

      // Consulta o status de submissão e notas do estudante nas tarefas do curso
      const subResp = await fetchClassroom<{ studentSubmissions?: GoogleStudentSubmission[] }>(
        `/courses/${curso.id}/courseWork/-/studentSubmissions?pageSize=50`,
        accessToken
      ).catch(() => ({ studentSubmissions: [] }));

      const mapaSubmissoes = new Map<string, GoogleStudentSubmission>();
      for (const sub of subResp.studentSubmissions ?? []) {
        if (sub.courseWorkId) {
          mapaSubmissoes.set(sub.courseWorkId, sub);
        }
      }

      const notasObtidas: number[] = [];

      // Processamento das tarefas: gera Atividades da agenda e Avisos de prazo
      for (const cw of trabalhos) {
        const sub = mapaSubmissoes.get(cw.id);
        const concluida = sub?.state === 'TURNED_IN' || sub?.state === 'RETURNED';
        const dataISO =
          formatarPrazoISO(cw.dueDate, cw.dueTime) ??
          cw.creationTime ??
          new Date().toISOString();

        if (
          typeof sub?.assignedGrade === 'number' &&
          typeof cw.maxPoints === 'number' &&
          cw.maxPoints > 0
        ) {
          notasObtidas.push((sub.assignedGrade / cw.maxPoints) * 10);
        }

        atividades.push({
          id: `classroom-cw-${cw.id}`,
          titulo: cw.title,
          disciplina: nomeDisciplina,
          disciplinaId: `classroom-disc-${curso.id}`,
          data: dataISO,
          concluida,
          tipo: cw.workType === 'MULTIPLE_CHOICE_QUESTION' ? 'avaliacao' : 'tarefa',
          fonte: 'classroom',
          descricao: cw.description ?? '',
          nota: sub?.assignedGrade,
        });

        const autorPostagem = resolverAutor(cw.creatorUserId, cw.title, true);
        const textoPrazo = `[${nomeDisciplina}] Atividade: ${cw.title}${
          cw.description ? ` — ${cw.description}` : ''
        } (Entrega: ${formatarDataCurta(cw.dueDate)})`;

        avisos.push({
          id: `classroom-msg-cw-${cw.id}`,
          texto: textoPrazo,
          fonte: 'classroom',
          tipo: 'prazo',
          disciplina: nomeDisciplina,
          recebidoEm: cw.creationTime ?? dataISO,
          prazo: formatarPrazoISO(cw.dueDate, cw.dueTime),
          prazoSemHora: !cw.dueTime,
          autor: autorPostagem,
        });
      }

      // Processamento do mural: gera comunicados e avisos com detecção de tipo
      for (const ann of avisosMural) {
        const textoLimpo = (ann.text ?? '').trim();
        if (!textoLimpo) continue;

        const textoFormatado = `[${nomeDisciplina}] ${textoLimpo}`;
        const tipoDet = detectarTipo(textoFormatado);
        const autorPostagem = resolverAutor(ann.creatorUserId, textoLimpo, false);

        avisos.push({
          id: `classroom-msg-ann-${ann.id}`,
          texto: textoFormatado,
          fonte: 'classroom',
          tipo: tipoDet === 'material' ? 'material' : 'comunicado',
          disciplina: nomeDisciplina,
          recebidoEm: ann.creationTime ?? new Date().toISOString(),
          autor: autorPostagem,
        });
      }

      // Processamento de materiais didáticos disponibilizados
      for (const mat of materiaisAula) {
        const textoMaterial = `[${nomeDisciplina}] Material: ${mat.title}${
          mat.description ? ` — ${mat.description}` : ''
        }`;
        const autorPostagem = resolverAutor(mat.creatorUserId, mat.title, true);

        avisos.push({
          id: `classroom-msg-mat-${mat.id}`,
          texto: textoMaterial,
          fonte: 'classroom',
          tipo: 'material',
          disciplina: nomeDisciplina,
          recebidoEm: mat.creationTime ?? new Date().toISOString(),
          autor: autorPostagem,
        });
      }

      // Calcula a média das notas obtidas nas tarefas avaliadas
      const mediaCalculada =
        notasObtidas.length > 0
          ? Number((notasObtidas.reduce((a, b) => a + b, 0) / notasObtidas.length).toFixed(2))
          : undefined;

      disciplinas.push({
        id: `classroom-disc-${curso.id}`,
        codigo: curso.section || `GC-${curso.id.slice(-4)}`,
        nome: nomeDisciplina,
        media: mediaCalculada,
        faltas: 0,
        cargaHoraria: 60,
        fonte: 'classroom',
      });
    })
  );

  // Ordena tarefas cronologicamente e avisos por ordem de chegada mais recente
  atividades.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  avisos.sort((a, b) => new Date(b.recebidoEm).getTime() - new Date(a.recebidoEm).getTime());

  return {
    disciplinas,
    atividades,
    avisos,
    sincronizadoEm: new Date().toISOString(),
  };
}

