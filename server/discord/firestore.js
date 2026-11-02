const admin = require('firebase-admin');

function validarProjetoFirebase(projeto) {
  const valor = String(projeto || '').trim();
  if (valor && !/^[a-z0-9][a-z0-9-]{4,28}[a-z0-9]$/.test(valor)) {
    throw new Error('FIREBASE_PROJECT_ID inválido.');
  }
  return valor || undefined;
}

function lerCredencialFirebase(valor) {
  if (!String(valor || '').trim()) return undefined;
  let credencial;
  try {
    credencial = JSON.parse(valor);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON deve ser um JSON válido.');
  }
  const campos = ['project_id', 'private_key', 'client_email'];
  if (
    !credencial ||
    credencial.type !== 'service_account' ||
    campos.some((campo) => typeof credencial[campo] !== 'string' || !credencial[campo].trim())
  ) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON não contém uma credencial service_account válida.');
  }
  return credencial;
}

function criarFirestore(env = process.env) {
  const projeto = validarProjetoFirebase(env.FIREBASE_PROJECT_ID);
  const credencial = lerCredencialFirebase(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (!admin.apps.length) {
    admin.initializeApp(
      credencial
        ? { credential: admin.credential.cert(credencial), projectId: projeto || credencial.project_id }
        : { credential: admin.credential.applicationDefault(), projectId: projeto }
    );
  }
  return admin.firestore();
}

async function salvarAvisoDiscord(db, aviso, estudanteIds) {
  await Promise.all(
    estudanteIds.map((estudanteId) =>
      db.collection('estudantes').doc(estudanteId).collection('avisosDiscord').doc(aviso.id).set({
        ...aviso,
        estudanteId,
        atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })
    )
  );
}

async function removerAvisoDiscord(db, mensagemId, estudanteIds) {
  await Promise.all(
    estudanteIds.map((estudanteId) =>
      db.collection('estudantes').doc(estudanteId).collection('avisosDiscord').doc(`discord-${mensagemId}`).delete()
    )
  );
}

module.exports = {
  criarFirestore,
  salvarAvisoDiscord,
  removerAvisoDiscord,
  lerCredencialFirebase,
  validarProjetoFirebase,
};
