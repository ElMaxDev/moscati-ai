// ============================================
// SPEECH-TO-TEXT — DUEÑO: Max (P2)
// Plan A: Azure Speech SDK (streaming real-time)
// Plan B: Web Speech API (gratis, solo Chrome)
// ============================================

// ---- PLAN A: AZURE SPEECH SDK ----
// Requiere: npm install microsoft-cognitiveservices-speech-sdk
// Keys en: NEXT_PUBLIC_AZURE_SPEECH_KEY y NEXT_PUBLIC_AZURE_SPEECH_REGION

interface SpeechCallbacks {
  onTranscribing: (text: string) => void;   // Texto parcial (mientras habla)
  onRecognized: (text: string) => void;     // Frase completa reconocida
  onError: (error: string) => void;         // Error
}

export async function createAzureSpeechRecognizer(callbacks: SpeechCallbacks) {
  // Import dinámico para evitar errores en SSR
  const SpeechSDK = await import('microsoft-cognitiveservices-speech-sdk');

  const key = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
  const region = process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION;

  if (!key || !region) {
    throw new Error('Azure Speech keys no configuradas. Usando fallback Web Speech API.');
  }

  const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(key, region);
  speechConfig.speechRecognitionLanguage = 'es-MX';

  // Configurar para dictado médico (texto largo continuo)
  speechConfig.setProperty(
    SpeechSDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
    '3000' // 3 segundos de silencio antes de cortar una frase
  );

  const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
  const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

  // Texto parcial mientras habla (subtítulos en vivo)
  recognizer.recognizing = (_: unknown, event: { result: { text: string } }) => {
    callbacks.onTranscribing(event.result.text);
  };

  // Frase completa reconocida
  recognizer.recognized = (_: unknown, event: { result: { reason: number; text: string } }) => {
    if (event.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
      callbacks.onRecognized(event.result.text);
    }
  };

  // Error
  recognizer.canceled = (_: unknown, event: { errorDetails: string }) => {
    callbacks.onError(`Azure Speech error: ${event.errorDetails}`);
  };

  return {
    start: () => recognizer.startContinuousRecognitionAsync(),
    stop: () => new Promise<void>((resolve) => {
      recognizer.stopContinuousRecognitionAsync(() => resolve());
    }),
    dispose: () => recognizer.close(),
  };
}


// ---- PLAN B: WEB SPEECH API (Fallback gratis, solo Chrome) ----

export function createWebSpeechRecognizer(callbacks: SpeechCallbacks) {
  // @ts-expect-error - webkitSpeechRecognition existe en Chrome
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    callbacks.onError('Web Speech API no soportada en este navegador. Usa Chrome.');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'es-MX';
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: { resultIndex: number; results: SpeechRecognitionResultList }) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    if (interimTranscript) {
      callbacks.onTranscribing(interimTranscript);
    }
    if (finalTranscript) {
      callbacks.onRecognized(finalTranscript.trim());
    }
  };

  recognition.onerror = (event: { error: string }) => {
    callbacks.onError(`Web Speech error: ${event.error}`);
  };

  // Auto-restart si se desconecta (Chrome lo hace a veces)
  recognition.onend = () => {
    // Se reinicia desde el componente si el usuario no presionó stop
  };

  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
    dispose: () => recognition.abort(),
  };
}


// ---- FACTORY: Crear el reconocedor correcto ----

export async function createSpeechRecognizer(callbacks: SpeechCallbacks) {
  const azureKey = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;

  if (azureKey && azureKey !== 'tu_azure_speech_key_aqui') {
    try {
      console.log('🎙️ Usando Azure Speech SDK');
      return await createAzureSpeechRecognizer(callbacks);
    } catch (error) {
      console.warn('⚠️ Azure Speech falló, usando Web Speech API:', error);
    }
  }

  console.log('🎙️ Usando Web Speech API (fallback)');
  return createWebSpeechRecognizer(callbacks);
}
