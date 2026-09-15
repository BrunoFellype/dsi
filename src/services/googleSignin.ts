import { TurboModuleRegistry, Platform, Alert } from 'react-native';

let GoogleSignin: any = null;
let isGoogleSigninSupported = false;

try {
  if (Platform.OS !== 'web') {
    // Verifica defensivamente se o módulo nativo existe antes de carregar
    const hasNative = !!TurboModuleRegistry.get('RNGoogleSignin');
    if (hasNative) {
      const mod = require('@react-native-google-signin/google-signin');
      GoogleSignin = mod.GoogleSignin;
      isGoogleSigninSupported = true;
      try {
        GoogleSignin.configure({
          webClientId: '543038942284-pqilv6jii90jle3h2s56d22sccon9qc8.apps.googleusercontent.com',
        });
      } catch (err) {
        console.warn('Falha ao configurar GoogleSignin:', err);
      }
    }
  }
} catch (e) {
  isGoogleSigninSupported = false;
  GoogleSignin = null;
}

export { GoogleSignin, isGoogleSigninSupported };
