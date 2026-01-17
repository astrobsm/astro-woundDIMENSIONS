/**
 * AstroWound-MEASURE Patient Detail Component
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, differenceInYears } from 'date-fns';
import {
  ArrowLeft,
  Edit,
  Plus,
  Camera,
  FileText,
  Activity,
  Calendar,
  User,
  Phone,
  Mail,
  AlertCircle,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';
import { usePatientsStore, useWoundsStore, useAppStore } from '@/store';
import * as db from '@/store/database';
import type { Patient, Wound, WoundAssessment } from '@/types';

export const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patients, loadPatients } = usePatientsStore();
  const { wounds, loadWoundsForPatient } = useWoundsStore();
  const { setCurrentPatient } = useAppStore();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [latestAssessments, setLatestAssessments] = useState<Map<string, WoundAssessment>>(new Map());

  useEffect(() => {
    if (id) {
      loadPatientData(id);
    }
  }, [id]);

  const loadPatientData = async (patientId: string) => {
    setLoading(true);
    try {
      await loadPatients();
      const found = patients.find((p) => p.id === patientId) || await db.getPatient(patientId);
      
      if (found) {
        setPatient(found);
        setCurrentPatient(found);
        await loadWoundsForPatient(patientId);
        
        // Load latest assessment for each wound
        const patientWounds = await db.getWoundsForPatient(patientId);
        const assessmentMap = new Map<string, WoundAssessment>();
        
        for (const wound of patientWounds) {
          if (wound.assessments && wound.assessments.length > 0) {
            const latest = wound.assessments.sort(
              (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
            )[0];
            assessmentMap.set(wound.id, latest);
          }
        }
        setLatestAssessments(assessmentMap);
      }
    } catch (error) {
      console.error('Failed to load patient:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAge = (dob: string) => {
    return differenceInYears(new Date(), new Date(dob));
  };

  const getWoundStatusColor = (status: Wound['status']) => {
    switch (status) {
      case 'active':
        return 'bg-orange-100 text-orange-700';
      case 'healing':
        return 'bg-green-100 text-green-700';
      case 'healed':
        return 'bg-blue-100 text-blue-700';
      case 'worsening':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getHealingTrend = (wound: Wound) => {
    const assessment = latestAssessments.get(wound.id);
    if (!assessment || wound.assessments.length < 2) return null;

    const sorted = [...wound.assessments].sort(
      (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
    );
    
    if (sorted.length < 2) return null;
    
    const latest = sorted[0];
    const previous = sorted[1];
    const change = ((previous.measurement.area - latest.measurement.area) / previous.measurement.area) * 100;

    if (change > 5) {
      return { trend: 'improving', change };
    } else if (change < -5) {
      return { trend: 'worsening', change: Math.abs(change) };
    }
    return { trend: 'stable', change: 0 };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-astro-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Patient Not Found</h2>
        <p className="text-gray-500 mb-4">The patient you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Back to Dashboard
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
              onClick={() => navigate('/')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Go back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {patient.firstName} {patient.lastName}
              </h1>
              <p className="text-sm text-gray-500">MRN: {patient.mrn}</p>
            </div>
          </div>
          <Link
            to={`/patients/${patient.id}/edit`}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Edit className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Patient Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-astro-100 flex items-center justify-center flex-shrink-0">
              <User className="w-8 h-8 text-astro-600" />
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Age / Gender</p>
                <p className="font-medium text-gray-900">
                  {getAge(patient.dateOfBirth)} years / {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(patient.dateOfBirth), 'MMM d, yyyy')}
                </p>
              </div>
              {patient.contact?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{patient.contact.phone}</span>
                </div>
              )}
              {patient.contact?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{patient.contact.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Medical History */}
          {(patient.medicalHistory?.length || patient.allergies?.length) && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                {patient.medicalHistory?.length ? (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Medical History</p>
                    <div className="flex flex-wrap gap-1">
                      {patient.medicalHistory.map((item, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {patient.allergies?.length ? (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Allergies</p>
                    <div className="flex flex-wrap gap-1">
                      {patient.allergies.map((item, i) => (
                        <span key={i} className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* Wounds Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Active Wounds</h2>
            <button
              onClick={() => navigate(`/capture?patientId=${patient.id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-astro-500 text-white rounded-lg hover:bg-astro-600"
            >
              <Plus className="w-4 h-4" />
              New Wound
            </button>
          </div>

          {wounds.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No wounds recorded for this patient</p>
              <button
                onClick={() => navigate(`/capture?patientId=${patient.id}`)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Start Assessment
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {wounds.map((wound) => {
                const healingTrend = getHealingTrend(wound);
                const latestAssessment = latestAssessments.get(wound.id);

                return (
                  <div key={wound.id} className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getWoundStatusColor(wound.status)}`}>
                            {wound.status.charAt(0).toUpperCase() + wound.status.slice(1)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {wound.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">
                          {wound.location.charAt(0).toUpperCase() + wound.location.slice(1)}
                          {wound.locationDetail ? ` - ${wound.locationDetail}` : ''}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Onset: {format(new Date(wound.onset), 'MMM d, yyyy')}
                        </p>

                        {latestAssessment && (
                          <div className="mt-3 flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Area: </span>
                              <span className="font-semibold text-gray-900">
                                {latestAssessment.measurement.area.toFixed(2)} cm²
                              </span>
                            </div>
                            {healingTrend && (
                              <div className={`flex items-center gap-1 ${
                                healingTrend.trend === 'improving' ? 'text-green-600' :
                                healingTrend.trend === 'worsening' ? 'text-red-600' : 'text-gray-500'
                              }`}>
                                {healingTrend.trend === 'improving' ? <TrendingDown className="w-4 h-4" /> :
                                 healingTrend.trend === 'worsening' ? <TrendingUp className="w-4 h-4" /> :
                                 <Minus className="w-4 h-4" />}
                                <span className="font-medium">
                                  {healingTrend.change > 0 ? `${healingTrend.change.toFixed(1)}%` : 'Stable'}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/patients/${patient.id}/timeline?woundId=${wound.id}`}
                          className="p-2 text-gray-500 hover:text-astro-600 hover:bg-gray-100 rounded-lg"
                          title="View Timeline"
                        >
                          <Calendar className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => navigate(`/wounds/${wound.id}/capture`)}
                          className="p-2 text-gray-500 hover:text-astro-600 hover:bg-gray-100 rounded-lg"
                          title="New Assessment"
                        >
                          <Camera className="w-5 h-5" />
                        </button>
                        <Link
                          to={`/wounds/${wound.id}/report`}
                          className="p-2 text-gray-500 hover:text-astro-600 hover:bg-gray-100 rounded-lg"
                          title="Generate Report"
                        >
                          <FileText className="w-5 h-5" />
                        </Link>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>

                    {/* Assessment count */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                      <span>{wound.assessments?.length || 0} assessments</span>
                      {latestAssessment && (
                        <span>Last: {format(new Date(latestAssessment.capturedAt), 'MMM d, yyyy')}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PatientDetail;
