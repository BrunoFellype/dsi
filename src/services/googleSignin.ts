import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { salvarTokenClassroom } from '../lib/cofre';
import { auth } from './firebase';

/**
 * Escopos OAuth 2.0 necessários para acessar os dados do Google Classroom em modo leitura:
 * - classroom.courses.readonly: lista as turmas ativas do estudante.
 * - classroom.coursework.me.readonly: tarefas, perguntas e status de submissão do estudante.
 * - classroom.announcements.readonly: avisos e comunicados postados no mural das turmas.
 * - classroom.courseworkmaterials.readonly: materiais didáticos disponibilizados pelos professores.
 * - classroom.rosters.readonly: lista de professores e estudantes para identificar a autoria dos posts.
 */
export const CLASSROOM_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.announcements.readonly',
  'https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
];

let GoogleSigninModule: any = null;

// No celular (Android/iOS), carrega defensivamente o módulo nativo do Google Sign-In e configura os escopos do Classroom
if (Platform.OS !== 'web') {
  try {
    // Verifica defensivamente se o módulo nativo existe antes de carregar
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-google-signin/google-signin');
    GoogleSigninModule = mod.GoogleSignin;
    GoogleSigninModule?.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      scopes: CLASSROOM_SCOPES,
      offlineAccess: true,
    });
  } catch {
    GoogleSigninModule = null;
  }
}

export const GoogleSignin = GoogleSigninModule;
export const isGoogleSigninSupported = Platform.OS !== 'web' && GoogleSigninModule !== null;

/** Resultado da autenticação contendo o usuário do Firebase e o token de acesso à API do Google Classroom. */
export interface ResultadoLoginGoogle {
  user: any;
  accessToken: string | null;
}

/**
 * Realiza o login com a conta Google solicitando os escopos do Google Classroom:
 * - No navegador: utiliza popup do Firebase Auth com os escopos adicionais do Classroom.
 * - No celular: utiliza o Google Play Services nativo para autenticar e obter os tokens de acesso.
 * O access token obtido é salvo no cofre seguro para permitir sincronizações subsequentes.
 */
export async function entrarComGoogle(): Promise<ResultadoLoginGoogle> {
  if (Platform.OS === 'web') {
    // Configura o provedor Google com os escopos do Classroom e prompt de consentimento
    const provider = new GoogleAuthProvider();
    CLASSROOM_SCOPES.forEach((scope) => provider.addScope(scope));
    provider.setCustomParameters({
      prompt: 'consent',
      access_type: 'offline',
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken ?? null;

    // Salva o token de acesso do Classroom para a sessão web
    if (accessToken) {
      await salvarTokenClassroom(accessToken, result.user.email ?? '');
    }

    return { user: result.user, accessToken };
  }

  if (!GoogleSigninModule) {
    throw new Error('Login nativo com Google indisponível neste ambiente (use Web ou Dev Client).');
  }

  // Verifica suporte aos serviços do Google Play
  await GoogleSigninModule.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const signInResult = await GoogleSigninModule.signIn();
  const idToken = signInResult?.data?.idToken ?? signInResult?.idToken;

  if (!idToken) {
    throw new Error('Não foi possível obter o token de autenticação do Google.');
  }

  // Obtém o accessToken do Google que concede acesso aos escopos do Classroom
  const tokens = await GoogleSigninModule.getTokens();
  const accessToken = tokens?.accessToken ?? null;

  // Autentica o usuário na sessão do Firebase Auth com a credencial do Google
  const googleCredential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, googleCredential);

  // Armazena o token de acesso do Classroom no cofre seguro do aparelho
  if (accessToken) {
    await salvarTokenClassroom(accessToken, userCredential.user.email ?? '');
  }

  return { user: userCredential.user, accessToken };
}

/**
 * Obtém ou renova as credenciais de acesso ao Google Classroom disparando o fluxo de autenticação do Google.
 */
export async function obterOuRenovarTokenClassroom(): Promise<{
  accessToken: string;
  email: string;
}> {
  const resultado = await entrarComGoogle();
  if (!resultado.accessToken) {
    throw new Error('Permissão de acesso ao Google Classroom não concedida.');
  }
  return {
    accessToken: resultado.accessToken,
    email: resultado.user?.email ?? '',
  };
}