const admin = require('firebase-admin');

function criarFirestore(env = process.env) {
  if (!admin.apps.length) {
    const credencial = env.FIREBASE_SERVICE_ACCOUNT_JSON
      ? JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON)
      : undefined;
    admin.initializeApp(credencial ? { credential: admin.credential.cert(credencial) } : {
      credential: admin.credential.applicationDefault(),
      projectId: env.FIREBASE_PROJECT_ID || undefined,
    });
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

module.exports = { criarFirestore, salvarAvisoDiscord };
