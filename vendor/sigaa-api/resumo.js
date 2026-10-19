/**
 * Lê o SIGAA da UFRPE e devolve o resumo que o ASTRA usa.
 * É compartilhado pela ponte (server/) e pelo app (rodando no celular).
 *
 * @param {new (opts: object) => any} Sigaa classe Sigaa da biblioteca
 * @param {{ url: string, usuario: string, senha: string }} dados
 */
const tipoAtividade = { homework: 'tarefa', quiz: 'questionario', exam: 'avaliacao' };

function tituloAtividade(a) {
  if (a.type === 'homework') return a.homeworkTitle;
  if (a.type === 'quiz') return a.quizTitle;
  return a.examDescription;
}

// Cada seção roda isolada: se uma falhar, as outras continuam.
async function seguro(fn, padrao) {
  try {
    return await fn();
  } catch {
    return padrao;
  }
}

async function buscarResumo(Sigaa, { url, usuario, senha }) {
  const sigaa = new Sigaa({ url, institution: 'UFRPE' });
  const conta = await sigaa.login(usuario, senha);
  try {
    const ativos = await conta.getActiveBonds();
    const inativos = await conta.getInactiveBonds();
    const vinculo = [...ativos, ...inativos].find((v) => v.type === 'student');
    if (!vinculo) throw new Error('Nenhum vínculo de discente encontrado.');

    const atividadesBrutas = await seguro(() => vinculo.getActivities(), []);
    const indices = await seguro(() => vinculo.getAcademicIndices(), []);
    const turmas = await seguro(() => vinculo.getCourses(), []);
    const historico = await seguro(() => vinculo.getGradesHistory(), []);
    // Faltas de cada turma do período (uma página por turma, uma de cada vez)
    const frequencias = [];
    for (const t of turmas) {
      frequencias.push(await seguro(() => t.getAbsence(), null));
    }

    return {
      demo: false,
      aluno: { matricula: vinculo.registration, curso: vinculo.program },
      indices: indices.map((i) => ({ code: i.code, name: i.name, value: i.value })),
      atividades: atividadesBrutas
        .map((a, i) => ({
          id: `sigaa-${i}-${a.date.getTime()}`,
          tipo: tipoAtividade[a.type] || 'tarefa',
          titulo: tituloAtividade(a),
          disciplina: a.courseTitle,
          data: a.date.toISOString(),
          concluida: Boolean(a.done)
        }))
        .sort((a, b) => a.data.localeCompare(b.data)),
      disciplinas: turmas.map((t, i) => ({
        codigo: t.code,
        titulo: t.title,
        periodo: t.period,
        faltas: frequencias[i] ? frequencias[i].totalAbsences : null,
        maxFaltas: frequencias[i] ? frequencias[i].maxAbsences : null
      })),
      historico: historico.map((h) => ({
        periodo: h.period,
        codigo: h.code,
        titulo: h.title,
        mediaFinal: h.finalGrade ?? null,
        faltas: h.absences ?? null,
        situacao: h.situation ?? '',
        cargaHoraria: cargaHorariaDoRelatorio(h.raw)
      }))
    };
  } finally {
    await conta.logoff().catch(() => {});
  }
}

/** Procura a coluna de carga horária ("CH", "C.H.", "Carga Horária") no relatório de notas. */
function cargaHorariaDoRelatorio(raw) {
  if (!raw) return null;
  for (const [cabecalho, valor] of Object.entries(raw)) {
    const chave = cabecalho.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[.\s]/g, '');
    if (chave === 'ch' || chave === 'chtotal' || chave === 'cargahoraria') {
      const n = parseInt(String(valor).replace(/\D/g, ''), 10);
      if (n > 0) return n;
    }
  }
  return null;
}

/** Distingue "senha errada" de "SIGAA fora do ar". */
function ehErroDeCredencial(erro) {
  return /invalid credentials|usu[aá]rio|senha|credenc/i.test(String((erro && erro.message) || ''));
}

module.exports = { buscarResumo, ehErroDeCredencial, cargaHorariaDoRelatorio };
