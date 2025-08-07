// Utilidad para verificar variables de entorno de Firebase
export const checkFirebaseConfig = () => {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };


  const missingKeys = Object.keys(config).filter(key => !config[key]);
  
  if (missingKeys.length > 0) {
    console.error('Variables de entorno faltantes:', missingKeys);
    return false;
  }

  console.log('✅ Todas las variables de entorno de Firebase están configuradas');
  return true;
};

// Utilidad para obtener datos bancarios desde variables de entorno
export const getBankingData = () => {
  const bankingData = {
    alias: import.meta.env.VITE_BANK_ALIAS || 'quicobasquet',
    cbu: import.meta.env.VITE_BANK_CBU || '0000076500000031784748',
    bank: import.meta.env.VITE_BANK_NAME || 'Personal Pay',
    holder: import.meta.env.VITE_BANK_HOLDER || 'Santiago Manuel Oru',
    whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER || '+54 9 343 682439'
  };

  return bankingData;
};
