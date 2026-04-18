# ARRANQUE RAPIDO — MoscatiAI v2 (Firebase)
## Guia para que los 5 empiecen a programar YA

---

## PASO 0: Setup inicial (Aaron hace esto PRIMERO, los demas esperan 10 min)

### 0A. Crear proyecto en Firebase
```
1. Ir a https://console.firebase.google.com
2. Crear proyecto: "moscati-ai"
3. Ir a Project Settings > Service Accounts
4. Click "Generate new private key" → descarga JSON
5. Ir a Firestore Database > Create Database > Start in test mode
6. Seleccionar region: us-central1 (o la mas cercana)
```

### 0B. Configurar .env.local
```bash
# Opcion 1 (FACIL): Copiar todo el JSON del service account en una linea
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"moscati-ai","private_key":"-----BEGIN...","client_email":"..."}

# Opcion 2: Variables individuales (copiar del JSON descargado)
FIREBASE_PROJECT_ID=moscati-ai
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@moscati-ai.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgI...\n-----END PRIVATE KEY-----\n"
```

### 0C. Subir repo
```bash
cd moscati-ai
npm install
git init
git add .
git commit -m "feat: proyecto base MoscatiAI v2 con Firebase"
git remote add origin https://github.com/TU_ORG/moscati-ai.git
git push -u origin main
```

## PASO 1: Todos clonan (minuto 10)

```bash
git clone https://github.com/TU_ORG/moscati-ai.git
cd moscati-ai
npm install
```

## PASO 2: Cada quien crea su rama

```bash
# Aaron:
git checkout -b feat/backend-api

# Max:
git checkout -b feat/ai-engine

# Cris:
git checkout -b feat/dashboard

# Uri:
git checkout -b feat/consulta-egreso

# Luis:
git checkout -b feat/data-seed
```

## PASO 3: Configurar .env.local

Aaron comparte las keys de Firebase por Discord/Slack privado.
Cada quien copia `.env.local` y agrega sus propias keys:
```
- Aaron: FIREBASE_* (compartir con todos)
- Max: GEMINI_API_KEY + NEXT_PUBLIC_AZURE_SPEECH_*
- Uri: ELEVENLABS_API_KEY
```

## PASO 4: Luis ejecuta el seed

```bash
npm run seed
# Debe mostrar:
# ✅ 10 pacientes creados
# ✅ 3 alertas creadas
# ✅ 7 documentos de conocimiento médico creados
# ✅ 20 registros de signos vitales creados
```

**Verificar en Firebase Console:** ir a Firestore > ver colecciones patients, alerts, medical_knowledge

## PASO 5: Correr el proyecto

```bash
npm run dev
# Abrir http://localhost:3000
```

---

## DONDE EMPIEZA CADA QUIEN

### Aaron — Backend (hora 0)
**Primer archivo que toca:** `src/lib/firebase.ts`
1. Crear Firebase project + Firestore database en test mode
2. Generar service account key
3. Verificar conexion: `npm run dev` y abrir `/api/patients`
4. Si retorna datos del seed → backend funciona

**Archivos de Aaron (NO TOCAR si no eres Aaron):**
```
src/lib/firebase.ts          ← conexion a Firestore
src/app/api/patients/route.ts
src/app/api/notes/route.ts
src/app/api/egreso/route.ts
src/app/api/insurance/route.ts
src/app/api/alerts/route.ts
src/app/api/chat/route.ts
src/app/api/audit/route.ts
src/types/index.ts
```

### Max — IA/Voz (hora 0)
**Primer archivo que toca:** `src/lib/speech.ts`
1. Obtener Azure Speech key de portal.azure.com (o usar Web Speech API de inmediato)
2. Probar transcripcion: abrir `/consulta?patientId=pac-001`, presionar microfono
3. Obtener Gemini API key de aistudio.google.com
4. Probar que la nota SOAP se genere correctamente
5. Ajustar prompts en `gemini.ts` si la estructura no sale bien

**Archivos de Max (NO TOCAR si no eres Max):**
```
src/lib/speech.ts
src/lib/gemini.ts
src/lib/rag.ts
```

### Cris — Frontend (hora 0)
**Primer archivo que toca:** `src/app/page.tsx`
1. Verificar que `npm run dev` muestre el dashboard
2. Ajustar estilos, colores, layout del dashboard
3. Mejorar PatientCard, AlertBanner, StatsBar
4. Asegurar que la navegacion funcione

**Archivos de Cris (NO TOCAR si no eres Cris):**
```
src/app/page.tsx
src/app/layout.tsx
src/app/globals.css
src/components/PatientCard.tsx
src/components/AlertBanner.tsx
src/components/StatsBar.tsx
```

### Uri — Consulta + Egreso (hora 0)
**Primer archivo que toca:** `src/components/VoiceRecorder.tsx`
1. Probar que el VoiceRecorder grabe y muestre transcripcion
2. Verificar que SOAPNoteEditor muestre la nota correctamente
3. Probar el flujo completo: voz → nota → firmar → egreso
4. Integrar ElevenLabs cuando tenga la key

**Archivos de Uri (NO TOCAR si no eres Uri):**
```
src/components/VoiceRecorder.tsx
src/components/SOAPNoteEditor.tsx
src/app/consulta/page.tsx
src/app/egreso/page.tsx
src/lib/elevenlabs.ts
src/app/api/voice/route.ts
```

### Luis — Data + Demo (hora 0)
**Primer archivo que toca:** `scripts/seed.ts`
1. Revisar que los datos de pacientes sean realistas
2. Ejecutar `npm run seed` cuando Firebase este listo
3. Verificar en el dashboard que aparezcan los 10 pacientes
4. Empezar a escribir el guion del video

**Archivos de Luis (NO TOCAR si no eres Luis):**
```
scripts/seed.ts
```

---

## COMO SE CONECTA TODO (flujo tecnico)

```
USUARIO (doctor) presiona "Nueva Consulta" en dashboard
         |
         v
[page.tsx] navega a → /consulta?patientId=pac-001
         |
         v
[consulta/page.tsx] carga paciente via → GET /api/patients
  → firebase.ts → Firestore.collection('patients').doc(id).get()
         |
         v
Doctor presiona boton de microfono
         |
         v
[VoiceRecorder.tsx] → [speech.ts] → Azure Speech SDK o Web Speech API
  Audio se transcribe en tiempo real (texto en pantalla)
         |
         v
Doctor presiona STOP
         |
         v
[consulta/page.tsx] envia → POST /api/notes
  { transcription: "paciente de 45 años...", patientId: "pac-001" }
         |
         v
[api/notes/route.ts] ejecuta:
  1. firebase.ts → Firestore.doc('patients/pac-001').get() → datos paciente
  2. rag.ts → busca en Firestore 'medical_knowledge' → protocolos relevantes
  3. gemini.ts → transcriptionToSOAP(texto, contexto) → Gemini genera SOAP
  4. firebase.ts → Firestore.collection('notes').add(nota) → guarda
  5. Retorna nota SOAP al frontend
         |
         v
[SOAPNoteEditor.tsx] muestra nota prellenada y editable
  Doctor revisa → corrige si necesario → presiona "Firmar y Guardar"
         |
         v
Nota firmada. Doctor presiona "Continuar a Egreso"
         |
         v
[egreso/page.tsx] muestra checklist → presiona "Generar Documentos"
         |
         v
[api/egreso/route.ts] ejecuta:
  1. Lee nota firmada de Firestore
  2. gemini.ts → generateDischargeDocuments() → receta, indicaciones, resumen
  3. Retorna documentos generados
         |
         v
Doctor presiona "Completar Egreso y Enviar a Aseguradora"
         |
         v
[api/insurance/route.ts] → simula envio → retorna folio CLM-XXXXX
         |
         v
[egreso/page.tsx] → confirmacion + timeline
  [api/voice/route.ts] → elevenlabs.ts → audio: "Egreso completado"
         |
         v
FIN DEL FLUJO ✅
```

---

## FIREBASE vs MONGODB — QUE CAMBIO

| Antes (MongoDB) | Ahora (Firebase) |
|------------------|------------------|
| MongoDB Atlas cluster | Firebase Console > Firestore |
| `MONGODB_URI` en .env | `FIREBASE_PROJECT_ID` + service account |
| `collection.find()` | `collection().get()` |
| `collection.insertOne()` | `collection().add()` / `doc().set()` |
| `collection.findOne({_id})` | `doc(id).get()` |
| `collection.updateOne()` | `doc(id).update()` |
| Vector Search para RAG | Búsqueda por keywords en memoria (más simple) |
| Índices manuales | Firestore crea índices automáticamente |
| `_id` de MongoDB | `doc.id` de Firestore (mapeado con `docToObj()`) |

**Ventaja para el hackathon:** Firebase setup es más rápido (no necesitas crear cluster, configurar IP whitelist, etc.). Solo creas proyecto, habilitas Firestore en test mode, y listo.

---

## REGLAS DE GIT (CRITICAS)

```bash
# SIEMPRE trabajar en TU rama
git checkout feat/mi-feature

# Commits frecuentes (cada 30-60 min)
git add . && git commit -m "feat: descripcion corta"
git push origin feat/mi-feature

# Para traer cambios de main a tu rama:
git pull origin main

# Para mergear: crear PR en GitHub → merge rápido

# NUNCA hacer push directo a main
```

## MERGE SCHEDULE

```
Hora 3:  Primer merge de TODOS (Aaron coordina)
Hora 6:  Segundo merge — todo debe compilar
Hora 10: Tercer merge — MVP funcional
Hora 14: Cuarto merge — features completos
Hora 18: ULTIMO merge — feature freeze
Hora 22: Code freeze. Solo hotfixes.
```

---

## SI ALGO FALLA — PLAN B

| Problema | Solucion |
|----------|----------|
| Firebase no conecta | Verificar service account JSON, verificar Firestore en test mode |
| "Missing index" en Firestore | Click en el link del error → crea el índice automáticamente |
| Azure Speech no funciona | Web Speech API ya está como fallback (solo Chrome) |
| Gemini API no responde | Cambiar a `gemini-1.5-flash` en gemini.ts |
| ElevenLabs no genera audio | Fallback a SpeechSynthesis del browser (ya integrado) |
| El seed falla | Verificar .env.local, verificar que Firestore este habilitado |
| Next.js no compila | `npm run dev -- --turbo` |
| Vercel no deploya | Deploy local: `npm run build && npm start` |

---

## PRIORIDAD HORA 1

```
Aaron:  Firebase conectado + /api/patients retorna datos          = 20 min
Luis:   Seed ejecutado, 10 pacientes en Firestore                 = 10 min
Max:    Azure Speech o Web Speech API transcribiendo en español    = 30 min
Cris:   Dashboard mostrando pacientes reales                      = 30 min
Uri:    VoiceRecorder grabando y mostrando texto                   = 30 min
```

**Firebase es MÁS RÁPIDO de configurar que MongoDB Atlas.** Aaron debería tener la DB lista en 15-20 minutos vs 30-40 con Atlas.

Si alguno NO funciona en la hora 1: **PEDIR AYUDA INMEDIATAMENTE.**

---

Listo. A ganar. 🏆
