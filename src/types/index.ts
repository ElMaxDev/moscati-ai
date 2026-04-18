// ============================================
// TIPOS COMPARTIDOS — Auralis Health v2
// DUEÑO: Aarón (P1)
// REGLA: NO modificar sin avisar al equipo
// ============================================

// ---- PACIENTES ----
export interface Patient {
  _id?: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  bed: string;
  status: 'stable' | 'warning' | 'critical' | 'discharged';
  triageLevel: 1 | 2 | 3 | 4 | 5;
  medicalHistory: string;
  currentMedications: string[];
  allergies: string[];
  insuranceProvider: string;      // "MetLife", "GNP", "AXA", "IMSS", "Ninguno"
  insurancePolicyNumber: string;
  admissionDate: string;
  admissionReason: string;
  attendingDoctor: string;
  previousNotes: ClinicalDocument[];
  createdAt: string;
  updatedAt: string;
}

// ---- SIGNOS VITALES ----
export interface VitalSigns {
  patientId: string;
  heartRate: number;          // bpm
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  spO2: number;               // porcentaje
  temperature: number;        // Celsius
  respiratoryRate: number;    // rpm
  timestamp: string;
}

// ---- DOCUMENTO CLINICO GENERADO POR IA ----
export type DocumentType = 'SOAP' | 'POST_OP' | 'CIRCULATING_NURSE';

export interface ClinicalDocument {
  _id?: string;
  patientId: string;
  doctorName: string;
  rawTranscription: string;
  status: 'draft' | 'signed';
  
  // Nueva estructura dinámica
  document_content: any;
  clinical_codes_resolved: {
    primary_diagnosis_code?: string;
    primary_diagnosis_label?: string;
    post_op_diagnosis_code?: string;
    post_op_diagnosis_label?: string;
    [key: string]: any;
  };
  audit_metadata: {
    document_type: string;
    author_id: string;
    author_role: string;
    created_at_iso: string;
    system_version: string;
    legal_disclaimer: string;
  };

  signedAt?: string;
  createdAt: string;
}

export interface Medication {
  name: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
}

// ---- ALERTAS ----
export interface Alert {
  _id?: string;
  patientId: string;
  patientName: string;
  bed: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'vital_sign' | 'predictive' | 'system';
  message: string;
  recommendation: string;
  acknowledged: boolean;
  createdAt: string;
}

// ---- DOCUMENTOS DE EGRESO ----
export interface DischargeDocuments {
  prescription: {
    medications: Medication[];
    general_instructions: string;
  };
  discharge_summary: {
    admission_reason: string;
    hospital_course: string;
    discharge_condition: string;
    discharge_diagnosis: string;
    follow_up_instructions: string;
  };
  patient_instructions: {
    diet: string;
    activity: string;
    warning_signs: string[];
    next_appointment: string;
  };
  insurance_form: {
    diagnosis_code: string;
    procedure_codes: string[];
    length_of_stay: string;
    total_charges_estimate: string;
  };
}

// ---- EGRESO ----
export interface DischargeChecklist {
  patientId: string;
  notesSigned: boolean;
  labResultsReady: boolean;
  dischargeInstructions: boolean;
  prescriptionReady: boolean;
  insuranceFormReady: boolean;
  allComplete: boolean;
}

// ---- ASEGURADORA ----
export interface InsuranceSubmission {
  provider: string;
  claimId: string;
  status: 'received' | 'processing' | 'approved' | 'rejected';
  documentsReceived: number;
  estimatedProcessingTime: string;
  message: string;
  timestamp: string;
}

// ---- AUDIT LOG ----
export interface AuditEntry {
  _id?: string;
  action: 'note_created' | 'note_signed' | 'discharge_initiated' | 'insurance_submitted' | 'alert_generated';
  patientId: string;
  details: string;
  solanaTxHash?: string;
  timestamp: string;
}

// ---- CHAT ----
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ---- API RESPONSES ----
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// ENDPOINTS CONTRATO (para que frontend y backend no se bloqueen)
// ============================================
// GET    /api/patients              → Patient[]
// GET    /api/patients/[id]         → Patient
// GET    /api/vitals?patientId=X    → VitalSigns[] (ultimos 20)
// GET    /api/vitals/stream         → SSE de signos vitales
// POST   /api/notes                 → { transcription: string, patientId: string } → ClinicalDocument
// PUT    /api/notes/[id]/sign       → { noteId: string } → ClinicalDocument (firmada)
// GET    /api/notes?patientId=X     → ClinicalDocument[]
// GET    /api/alerts                → Alert[]
// POST   /api/chat                  → { message: string, patientId: string } → { reply: string }
// POST   /api/triage                → { patientId: string, vitals: VitalSigns } → { level, recommendation }
// POST   /api/egreso                → { patientId: string } → DischargeDocuments
// GET    /api/egreso/[patientId]    → DischargeChecklist
// POST   /api/insurance             → { patientId: string, provider: string, documents: any[] } → InsuranceSubmission
// POST   /api/audit                 → AuditEntry → { txHash?: string }
