/**
 * AstroWound-MEASURE Global State Store
 * Zustand-based state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  Patient, 
  Wound, 
  WoundAssessment, 
  AppState, 
  CaptureState 
} from '@/types';
import * as db from './database';

// ============================================
// App State Store
// ============================================

interface AppStore extends AppState {
  // Actions
  setCurrentPatient: (patient: Patient | null) => void;
  setCurrentWound: (wound: Wound | null) => void;
  setModelLoaded: (loaded: boolean) => void;
  setOnlineStatus: (online: boolean) => void;
  updatePendingSync: (count: number) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      currentPatient: null,
      currentWound: null,
      isModelLoaded: false,
      isOnline: navigator.onLine,
      pendingSync: 0,

      setCurrentPatient: (patient) => set({ currentPatient: patient }),
      setCurrentWound: (wound) => set({ currentWound: wound }),
      setModelLoaded: (loaded) => set({ isModelLoaded: loaded }),
      setOnlineStatus: (online) => set({ isOnline: online }),
      updatePendingSync: (count) => set({ pendingSync: count }),
    }),
    {
      name: 'astrowound-app-store',
      partialize: (state) => ({
        currentPatient: state.currentPatient,
        currentWound: state.currentWound,
      }),
    }
  )
);

// ============================================
// Capture State Store
// ============================================

interface CaptureStore extends CaptureState {
  // Actions
  setCapturing: (capturing: boolean) => void;
  setCalibrationDetected: (detected: boolean) => void;
  setQualityPassed: (passed: boolean) => void;
  setPreviewImage: (image: string | null) => void;
  setSegmentationPreview: (result: CaptureState['segmentationPreview']) => void;
  reset: () => void;
}

const initialCaptureState: CaptureState = {
  isCapturing: false,
  calibrationDetected: false,
  qualityPassed: false,
  previewImage: null,
  segmentationPreview: null,
};

export const useCaptureStore = create<CaptureStore>()((set) => ({
  ...initialCaptureState,

  setCapturing: (capturing) => set({ isCapturing: capturing }),
  setCalibrationDetected: (detected) => set({ calibrationDetected: detected }),
  setQualityPassed: (passed) => set({ qualityPassed: passed }),
  setPreviewImage: (image) => set({ previewImage: image }),
  setSegmentationPreview: (result) => set({ segmentationPreview: result }),
  reset: () => set(initialCaptureState),
}));

// ============================================
// Patients Store
// ============================================

interface PatientsStore {
  patients: Patient[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadPatients: () => Promise<void>;
  addPatient: (patient: Patient) => Promise<void>;
  updatePatient: (patient: Patient) => Promise<void>;
  removePatient: (id: string) => Promise<void>;
  searchPatients: (query: string) => Promise<void>;
}

export const usePatientsStore = create<PatientsStore>()((set, get) => ({
  patients: [],
  loading: false,
  error: null,

  loadPatients: async () => {
    set({ loading: true, error: null });
    try {
      const patients = await db.getAllPatients();
      set({ patients, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addPatient: async (patient) => {
    try {
      await db.createPatient(patient);
      set({ patients: [...get().patients, patient] });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updatePatient: async (patient) => {
    try {
      await db.updatePatient(patient);
      set({
        patients: get().patients.map((p) =>
          p.id === patient.id ? patient : p
        ),
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  removePatient: async (id) => {
    try {
      await db.deletePatient(id);
      set({ patients: get().patients.filter((p) => p.id !== id) });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  searchPatients: async (query) => {
    set({ loading: true });
    try {
      const patients = await db.searchPatients(query);
      set({ patients, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));

// ============================================
// Wounds Store
// ============================================

interface WoundsStore {
  wounds: Wound[];
  loading: boolean;
  error: string | null;

  // Actions
  loadWoundsForPatient: (patientId: string) => Promise<void>;
  addWound: (wound: Wound) => Promise<void>;
  updateWound: (wound: Wound) => Promise<void>;
  removeWound: (id: string) => Promise<void>;
}

export const useWoundsStore = create<WoundsStore>()((set, get) => ({
  wounds: [],
  loading: false,
  error: null,

  loadWoundsForPatient: async (patientId) => {
    set({ loading: true, error: null });
    try {
      const wounds = await db.getWoundsForPatient(patientId);
      set({ wounds, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addWound: async (wound) => {
    try {
      await db.createWound(wound);
      set({ wounds: [...get().wounds, wound] });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateWound: async (wound) => {
    try {
      await db.updateWound(wound);
      set({
        wounds: get().wounds.map((w) => (w.id === wound.id ? wound : w)),
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  removeWound: async (id) => {
    try {
      await db.deleteWound(id);
      set({ wounds: get().wounds.filter((w) => w.id !== id) });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
}));

// ============================================
// Assessments Store
// ============================================

interface AssessmentsStore {
  assessments: WoundAssessment[];
  loading: boolean;
  error: string | null;

  // Actions
  loadAssessmentsForWound: (woundId: string) => Promise<void>;
  addAssessment: (assessment: WoundAssessment) => Promise<void>;
  updateAssessment: (assessment: WoundAssessment) => Promise<void>;
  removeAssessment: (id: string) => Promise<void>;
}

export const useAssessmentsStore = create<AssessmentsStore>()((set, get) => ({
  assessments: [],
  loading: false,
  error: null,

  loadAssessmentsForWound: async (woundId) => {
    set({ loading: true, error: null });
    try {
      const assessments = await db.getAssessmentsForWound(woundId);
      // Sort by date descending
      assessments.sort((a, b) => 
        new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
      );
      set({ assessments, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addAssessment: async (assessment) => {
    try {
      await db.createAssessment(assessment);
      set({ assessments: [assessment, ...get().assessments] });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateAssessment: async (assessment) => {
    try {
      await db.updateAssessment(assessment);
      set({
        assessments: get().assessments.map((a) =>
          a.id === assessment.id ? assessment : a
        ),
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  removeAssessment: async (id) => {
    try {
      await db.deleteAssessment(id);
      set({ assessments: get().assessments.filter((a) => a.id !== id) });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
}));

// ============================================
// Online Status Listener
// ============================================

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useAppStore.getState().setOnlineStatus(true);
  });

  window.addEventListener('offline', () => {
    useAppStore.getState().setOnlineStatus(false);
  });
}
