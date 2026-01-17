/**
 * AstroWound-MEASURE Patient Timeline Page
 * Wrapper component for routing
 */

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { PatientTimeline } from './PatientTimeline';
import { usePatientsStore, useWoundsStore, useAppStore } from '@/store';
import * as db from '@/store/database';
import type { Wound, WoundAssessment } from '@/types';

export const PatientTimelinePage: React.FC = () => {
  const { id: patientId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const woundIdParam = searchParams.get('woundId');

  const { patients, loadPatients } = usePatientsStore();
  const { wounds, loadWoundsForPatient } = useWoundsStore();
  const { setCurrentPatient } = useAppStore();

  const [selectedWound, setSelectedWound] = useState<Wound | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      loadData(patientId);
    }
  }, [patientId, woundIdParam]);

  const loadData = async (pId: string) => {
    setLoading(true);
    try {
      await loadPatients();
      const patient = patients.find(p => p.id === pId) || await db.getPatient(pId);
      
      if (patient) {
        setCurrentPatient(patient);
        await loadWoundsForPatient(pId);
        
        if (woundIdParam) {
          const wound = await db.getWound(woundIdParam);
          if (wound) {
            setSelectedWound(wound);
          }
        } else if (wounds.length > 0) {
          setSelectedWound(wounds[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssessmentClick = (assessment: WoundAssessment) => {
    navigate(`/assessments/${assessment.id}/report`);
  };

  const handleNewAssessment = () => {
    if (selectedWound) {
      navigate(`/wounds/${selectedWound.id}/capture`);
    } else {
      navigate(`/capture?patientId=${patientId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-astro-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!selectedWound) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 mb-4">No wounds found for this patient</p>
        <button 
          onClick={() => navigate(`/capture?patientId=${patientId}`)}
          className="btn-primary"
        >
          Create First Assessment
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/patients/${patientId}`)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Go back to patient"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Wound Timeline</h1>
          </div>
          <button
            onClick={() => navigate(`/wounds/${selectedWound.id}/report`)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FileText className="w-4 h-4" />
            Generate Report
          </button>
        </div>
      </header>

      {/* Wound Selector (if multiple wounds) */}
      {wounds.length > 1 && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {wounds.map((wound) => (
              <button
                key={wound.id}
                onClick={() => setSelectedWound(wound)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedWound?.id === wound.id
                    ? 'bg-astro-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {wound.location}
                {wound.locationDetail ? ` - ${wound.locationDetail}` : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <PatientTimeline
          wound={selectedWound}
          onAssessmentClick={handleAssessmentClick}
          onNewAssessment={handleNewAssessment}
        />
      </main>
    </div>
  );
};

// Re-export the PatientTimeline component for use in App.tsx
export { PatientTimeline };
export default PatientTimelinePage;
