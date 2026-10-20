// Import the functions you need from the SDKs you need
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, type Auth, type Persistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCM_WKldVxj_djECx55fI7stVL5KWUpE6M",
  authDomain: "astra-a4948.firebaseapp.com",
  projectId: "astra-a4948",
  storageBucket: "astra-a4948.firebasestorage.app",
  messagingSenderId: "543038942284",
  appId: "1:543038942284:web:16e0476e2ff243e33718e9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

/**
 * No celular o login é guardado no AsyncStorage, para continuar logado ao reabrir o app.
 * `getReactNativePersistence` só existe na versão React Native do Firebase (não está nos tipos),
 * por isso é lido em tempo de execução. Se o Auth já tiver sido criado (recarga rápida), reaproveita.
 */
function criarAuth(): Auth {
  if (Platform.OS === 'web') return getAuth(app);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getReactNativePersistence } = require('firebase/auth') as {
      getReactNativePersistence: (armazenamento: typeof AsyncStorage) => Persistence;
    };
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    return getAuth(app);
  }
}

export const auth = criarAuth();
export const db = getFirestore(app);
