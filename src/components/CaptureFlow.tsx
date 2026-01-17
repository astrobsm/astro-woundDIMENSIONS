/**
 * AstroWound-MEASURE Capture Flow Component
 * Complete workflow for capturing and analyzing wound photographs
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  User,
  MapPin,
} from 'lucide-react';
// CameraModule is used within WoundCapture
import { WoundCapture } from './WoundCapture';
import { usePatientsStore, useWoundsStore, useAppStore } from '@/store';
import * as db from '@/store/database';
import type { Patient, Wound, WoundType, WoundLocation, WoundAssessment } from '@/types';

type CaptureStep = 'select-patient' | 'select-wound' | 'capture' | 'complete';

export const CaptureFlow: React.FC = () => {
  const { woundId } = useParams<{ woundId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<CaptureStep>('select-patient');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedWound, setSelectedWound] = useState<Wound | null>(null);
  const [isNewWound, setIsNewWound] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [completedAssessment, setCompletedAssessment] = useState<WoundAssessment | null>(null);

  // New wound form state
  const [newWoundData, setNewWoundData] = useState({
    type: 'pressure_ulcer' as WoundType,
    location: 'sacrum' as WoundLocation,
    locationDetail: '',
    etiology: '',
    notes: '',
  });

  const { patients, loadPatients, searchPatients } = usePatientsStore();
  const { wounds, loadWoundsForPatient, addWound } = useWoundsStore();
  const { currentPatient, setCurrentPatient } = useAppStore();

  useEffect(() => {
    loadPatients();
    
    // Check if we have a patient ID from URL params
    const patientIdParam = searchParams.get('patientId');
    if (patientIdParam) {
      loadPatientById(patientIdParam);
    } else if (currentPatient) {
      setSelectedPatient(currentPatient);
      setStep('select-wound');
      loadWoundsForPatient(currentPatient.id);
    }

    // If we have a wound ID, skip to capture
    if (woundId) {
      loadWoundById(woundId);
    }
  }, [woundId, searchParams]);

  const loadPatientById = async (patientId: string) => {
    try {
      const patient = await db.getPatient(patientId);
      if (patient) {
        setSelectedPatient(patient);
        setCurrentPatient(patient);
        setStep('select-wound');
        await loadWoundsForPatient(patientId);
      }
    } catch (error) {
      console.error('Failed to load patient:', error);
    }
  };

  const loadWoundById = async (id: string) => {
    try {
      const wound = await db.getWound(id);
      if (wound) {
        setSelectedWound(wound);
        const patient = await db.getPatient(wound.patientId);
        if (patient) {
          setSelectedPatient(patient);
          setCurrentPatient(patient);
        }
        setStep('capture');
      }
    } catch (error) {
      console.error('Failed to load wound:', error);
    }
  };

  const handlePatientSelect = async (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentPatient(patient);
    await loadWoundsForPatient(patient.id);
    setStep('select-wound');
  };

  const handleWoundSelect = (wound: Wound) => {
    setSelectedWound(wound);
    setStep('capture');
  };

  const handleCreateNewWound = async () => {
    if (!selectedPatient) return;

    const newWound: Wound = {
      id: uuid(),
      patientId: selectedPatient.id,
      type: newWoundData.type,
      location: newWoundData.location,
      locationDetail: newWoundData.locationDetail || undefined,
      onset: new Date(),
      etiology: newWoundData.etiology || undefined,
      notes: newWoundData.notes || undefined,
      status: 'active',
      assessments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await addWound(newWound);
    setSelectedWound(newWound);
    setIsNewWound(false);
    setStep('capture');
  };

  const handleCaptureComplete = (assessment: WoundAssessment) => {
    setCompletedAssessment(assessment);
    setStep('complete');
  };

  const handlePatientSearch = (query: string) => {
    setPatientSearch(query);
    if (query.length > 2) {
      searchPatients(query);
    } else if (query.length === 0) {
      loadPatients();
    }
  };

  const renderPatientSelection = () => (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={patientSearch}
          onChange={(e) => handlePatientSearch(e.target.value)}
          placeholder="Search patients by name or MRN..."
          className="input-field pl-10"
        />
        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      </div>

      {/* Patient List */}
      <div className="space-y-2">
        {patients.map((patient) => (
          <button
            key={patient.id}
            onClick={() => handlePatientSelect(patient)}
            className="w-full bg-white rounded-xl shadow-sm p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-astro-100 flex items-center justify-center">
                <User className="w-5 h-5 text-astro-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {patient.firstName} {patient.lastName}
                </p>
                <p className="text-sm text-gray-500">MRN: {patient.mrn}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        ))}

        {patients.length === 0 && patientSearch.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No patients found matching "{patientSearch}"</p>
          </div>
        )}
      </div>

      {/* Add New Patient Button */}
      <button
        onClick={() => navigate('/patients/new')}
        className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-500 hover:border-astro-500 hover:text-astro-500 transition-colors"
      >
        + Add New Patient
      </button>
    </div>
  );

  const renderWoundSelection = () => (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Selected Patient */}
      <div className="bg-astro-50 rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-astro-100 flex items-center justify-center">
          <User className="w-5 h-5 text-astro-600" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900">
            {selectedPatient?.firstName} {selectedPatient?.lastName}
          </p>
          <p className="text-sm text-gray-500">MRN: {selectedPatient?.mrn}</p>
        </div>
        <button
          onClick={() => setStep('select-patient')}
          className="text-sm text-astro-600 hover:text-astro-700"
        >
          Change
        </button>
      </div>

      {/* Existing Wounds */}
      {wounds.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Existing Wounds</h3>
          <div className="space-y-2">
            {wounds.filter(w => w.status !== 'healed').map((wound) => (
              <button
                key={wound.id}
                onClick={() => handleWoundSelect(wound)}
                className="w-full bg-white rounded-xl shadow-sm p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {wound.location.charAt(0).toUpperCase() + wound.location.slice(1)}
                      {wound.locationDetail ? ` - ${wound.locationDetail}` : ''}
                    </p>
                    <p className="text-sm text-gray-500">
                      {wound.type.replace('_', ' ')} • {wound.assessments?.length || 0} assessments
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* New Wound Form */}
      {isNewWound ? (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">New Wound</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wound Type
            </label>
            <select
              value={newWoundData.type}
              onChange={(e) => setNewWoundData(prev => ({ ...prev, type: e.target.value as WoundType }))}
              className="input-field"
              title="Select wound type"
            >
              <option value="pressure_ulcer">Pressure Ulcer</option>
              <option value="diabetic_ulcer">Diabetic Ulcer</option>
              <option value="venous_ulcer">Venous Ulcer</option>
              <option value="arterial_ulcer">Arterial Ulcer</option>
              <option value="surgical_wound">Surgical Wound</option>
              <option value="traumatic_wound">Traumatic Wound</option>
              <option value="burn">Burn</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              value={newWoundData.location}
              onChange={(e) => setNewWoundData(prev => ({ ...prev, location: e.target.value as WoundLocation }))}
              className="input-field"
              title="Select wound location"
            >
              <option value="sacrum">Sacrum</option>
              <option value="heel">Heel</option>
              <option value="ankle">Ankle</option>
              <option value="leg">Leg</option>
              <option value="foot">Foot</option>
              <option value="arm">Arm</option>
              <option value="hand">Hand</option>
              <option value="back">Back</option>
              <option value="abdomen">Abdomen</option>
              <option value="chest">Chest</option>
              <option value="head">Head</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Detail (optional)
            </label>
            <input
              type="text"
              value={newWoundData.locationDetail}
              onChange={(e) => setNewWoundData(prev => ({ ...prev, locationDetail: e.target.value }))}
              placeholder="e.g., Left lateral, Lower third"
              className="input-field"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setIsNewWound(false)}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateNewWound}
              className="flex-1 btn-primary"
            >
              Create & Continue
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsNewWound(true)}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-500 hover:border-astro-500 hover:text-astro-500 transition-colors"
        >
          + Add New Wound
        </button>
      )}
    </div>
  );

  const renderCapture = () => (
    <WoundCapture
      woundId={selectedWound!.id}
      onComplete={handleCaptureComplete}
      onCancel={() => navigate(-1)}
    />
  );

  const renderComplete = () => (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Complete</h2>
        <p className="text-gray-500 mb-6">
          The wound assessment has been saved successfully.
        </p>

        {completedAssessment && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-medium text-gray-900 mb-2">Measurements</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Area:</span>
                <span className="ml-2 font-semibold">{completedAssessment.measurement.area.toFixed(2)} cm²</span>
              </div>
              <div>
                <span className="text-gray-500">Perimeter:</span>
                <span className="ml-2 font-semibold">{completedAssessment.measurement.perimeter.toFixed(2)} cm</span>
              </div>
              <div>
                <span className="text-gray-500">Length:</span>
                <span className="ml-2 font-semibold">{completedAssessment.measurement.length.toFixed(2)} cm</span>
              </div>
              <div>
                <span className="text-gray-500">Width:</span>
                <span className="ml-2 font-semibold">{completedAssessment.measurement.width.toFixed(2)} cm</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(`/wounds/${selectedWound?.id}/report`)}
            className="btn-primary w-full"
          >
            View Report
          </button>
          <button
            onClick={() => {
              setSelectedWound(null);
              setStep('select-wound');
            }}
            className="btn-secondary w-full"
          >
            Capture Another Wound
          </button>
          <button
            onClick={() => navigate(`/patients/${selectedPatient?.id}`)}
            className="text-gray-500 hover:text-gray-700"
          >
            Back to Patient
          </button>
        </div>
      </div>
    </div>
  );

  const getStepTitle = () => {
    switch (step) {
      case 'select-patient':
        return 'Select Patient';
      case 'select-wound':
        return 'Select Wound';
      case 'capture':
        return 'Capture Wound';
      case 'complete':
        return 'Complete';
      default:
        return 'Capture';
    }
  };

  // Show full-screen views for capture and complete steps
  if (step === 'capture' && selectedWound) {
    return renderCapture();
  }

  if (step === 'complete') {
    return renderComplete();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (step === 'select-wound') {
                  setStep('select-patient');
                } else {
                  navigate(-1);
                }
              }}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{getStepTitle()}</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-8 h-1 rounded ${step === 'select-patient' || step === 'select-wound' || step === 'capture' ? 'bg-astro-500' : 'bg-gray-200'}`} />
                <div className={`w-8 h-1 rounded ${step === 'select-wound' || step === 'capture' ? 'bg-astro-500' : 'bg-gray-200'}`} />
                <div className={`w-8 h-1 rounded ${step === 'capture' ? 'bg-astro-500' : 'bg-gray-200'}`} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      {step === 'select-patient' && renderPatientSelection()}
      {step === 'select-wound' && renderWoundSelection()}
    </div>
  );
};

export default CaptureFlow;
