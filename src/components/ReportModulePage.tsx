/**
 * AstroWound-MEASURE Report Module Page
 * Wrapper component for routing
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, AlertCircle, Printer } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { useAppStore } from '@/store';
import * as db from '@/store/database';
import { getMeasurementEngine } from '@/engine';
import type { Patient, Wound, WoundAssessment, WoundAnalytics } from '@/types';

type ReportType = 'single_assessment' | 'progress_report' | 'discharge_summary';

export const ReportModulePage: React.FC = () => {
  const { woundId, assessmentId } = useParams<{ woundId?: string; assessmentId?: string }>();
  const navigate = useNavigate();

  const { setCurrentPatient } = useAppStore();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [wound, setWound] = useState<Wound | null>(null);
  const [assessments, setAssessments] = useState<WoundAssessment[]>([]);
  const [analytics, setAnalytics] = useState<WoundAnalytics | null>(null);
  const [reportType, setReportType] = useState<ReportType>('progress_report');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [clinicianName, setClinicianName] = useState('');
  const [clinicianCredentials, setClinicianCredentials] = useState('');

  useEffect(() => {
    loadReportData();
  }, [woundId, assessmentId]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      if (woundId) {
        const woundData = await db.getWound(woundId);
        if (woundData) {
          setWound(woundData);
          const patientData = await db.getPatient(woundData.patientId);
          if (patientData) {
            setPatient(patientData);
            setCurrentPatient(patientData);
          }
          const assessmentData = await db.getAssessmentsForWound(woundId);
          assessmentData.sort((a, b) => 
            new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
          );
          setAssessments(assessmentData);
          
          if (assessmentData.length > 0) {
            const analyticsData = getMeasurementEngine().calculateWoundAnalytics(
              woundId, 
              assessmentData, 
              new Date(woundData.onset)
            );
            setAnalytics(analyticsData);
          }
        }
      } else if (assessmentId) {
        const assessment = await db.getAssessment(assessmentId);
        if (assessment) {
          setAssessments([assessment]);
          setReportType('single_assessment');
          const woundData = await db.getWound(assessment.woundId);
          if (woundData) {
            setWound(woundData);
            const patientData = await db.getPatient(woundData.patientId);
            if (patientData) {
              setPatient(patientData);
              setCurrentPatient(patientData);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!patient || !wound || assessments.length === 0) return;

    setGenerating(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      let yPos = margin;

      // Header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(14, 165, 233);
      pdf.text('AstroWound-MEASURE', pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;

      pdf.setFontSize(12);
      pdf.setTextColor(100);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Clinical Wound Assessment Report', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Report type
      const reportTitle = {
        single_assessment: 'Single Assessment Report',
        progress_report: 'Progress Report',
        discharge_summary: 'Discharge Summary',
      }[reportType];
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0);
      pdf.text(reportTitle, margin, yPos);
      yPos += 7;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100);
      pdf.text(`Generated: ${format(new Date(), 'MMMM d, yyyy HH:mm')}`, margin, yPos);
      yPos += 12;

      // Patient Info
      pdf.setDrawColor(229, 231, 235);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0);
      pdf.text('PATIENT INFORMATION', margin, yPos);
      yPos += 7;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      [
        ['Name:', `${patient.firstName} ${patient.lastName}`],
        ['MRN:', patient.mrn],
        ['Date of Birth:', format(new Date(patient.dateOfBirth), 'MMMM d, yyyy')],
      ].forEach(([label, value]) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, margin, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, margin + 35, yPos);
        yPos += 5;
      });
      yPos += 5;

      // Wound Info
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('WOUND INFORMATION', margin, yPos);
      yPos += 7;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      [
        ['Type:', wound.type.replace('_', ' ').toUpperCase()],
        ['Location:', wound.location + (wound.locationDetail ? ` - ${wound.locationDetail}` : '')],
        ['Status:', wound.status.charAt(0).toUpperCase() + wound.status.slice(1)],
      ].forEach(([label, value]) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, margin, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, margin + 35, yPos);
        yPos += 5;
      });
      yPos += 8;

      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // Current Measurements
      const latestAssessment = assessments[0];
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CURRENT MEASUREMENTS', margin, yPos);
      yPos += 7;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      [
        ['Area:', `${latestAssessment.measurement.area} cm²`],
        ['Length:', `${latestAssessment.measurement.length} cm`],
        ['Width:', `${latestAssessment.measurement.width} cm`],
        ['Perimeter:', `${latestAssessment.measurement.perimeter} cm`],
      ].forEach(([label, value]) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, margin, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, margin + 35, yPos);
        yPos += 5;
      });
      yPos += 8;

      // Analytics (for progress reports)
      if (analytics && reportType === 'progress_report') {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('HEALING PROGRESS', margin, yPos);
        yPos += 7;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        [
          ['Initial Area:', `${analytics.initialArea} cm²`],
          ['Current Area:', `${analytics.currentArea} cm²`],
          ['Total Reduction:', `${analytics.totalReductionPercent.toFixed(1)}%`],
          ['Healing Rate:', `${analytics.healingVelocity} cm²/week`],
          ['Trend:', analytics.trend.charAt(0).toUpperCase() + analytics.trend.slice(1)],
        ].forEach(([label, value]) => {
          pdf.setFont('helvetica', 'bold');
          pdf.text(label, margin, yPos);
          pdf.setFont('helvetica', 'normal');
          pdf.text(value, margin + 35, yPos);
          yPos += 5;
        });
        yPos += 8;
      }

      // Disclaimer
      yPos = pdf.internal.pageSize.getHeight() - 40;
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text('CLINICAL DECISION SUPPORT', margin, yPos);
      yPos += 4;
      pdf.text('This report is generated by AstroWound-MEASURE, an AI-assisted clinical decision support tool.', margin, yPos);
      yPos += 4;
      pdf.text('All measurements should be verified by a qualified healthcare professional.', margin, yPos);

      // Signature area
      if (clinicianName) {
        yPos += 10;
        pdf.setFontSize(10);
        pdf.setTextColor(0);
        pdf.text(`Reviewed by: ${clinicianName}${clinicianCredentials ? `, ${clinicianCredentials}` : ''}`, margin, yPos);
        yPos += 4;
        pdf.text(`Date: ${format(new Date(), 'MMMM d, yyyy')}`, margin, yPos);
      }

      // Save
      const filename = `AstroWound-Report-${patient.mrn}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-astro-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!patient || !wound || assessments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h2>
        <p className="text-gray-500 mb-4">Unable to generate report. No assessments found.</p>
        <button onClick={() => navigate(-1)} className="btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  const latestAssessment = assessments[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Clinical Report</h1>
              <p className="text-sm text-gray-500">
                {patient.firstName} {patient.lastName} • MRN: {patient.mrn}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={generatePDF}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-astro-500 text-white rounded-lg hover:bg-astro-600 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {generating ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Report Type Selection */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
          <div className="flex gap-2">
            {[
              { value: 'single_assessment', label: 'Single Assessment' },
              { value: 'progress_report', label: 'Progress Report' },
              { value: 'discharge_summary', label: 'Discharge Summary' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setReportType(option.value as ReportType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  reportType === option.value
                    ? 'bg-astro-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Report Preview */}
        <div className="bg-white rounded-xl shadow-sm p-8" id="report-content">
          {/* Header */}
          <div className="text-center mb-8 border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-bold text-astro-600">AstroWound-MEASURE</h2>
            <p className="text-gray-500">Clinical Wound Assessment Report</p>
            <p className="text-sm text-gray-400 mt-2">
              Generated: {format(new Date(), 'MMMM d, yyyy HH:mm')}
            </p>
          </div>

          {/* Patient Info */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 uppercase text-sm tracking-wider">
              Patient Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <span className="ml-2 font-medium">{patient.firstName} {patient.lastName}</span>
              </div>
              <div>
                <span className="text-gray-500">MRN:</span>
                <span className="ml-2 font-medium">{patient.mrn}</span>
              </div>
              <div>
                <span className="text-gray-500">Date of Birth:</span>
                <span className="ml-2 font-medium">{format(new Date(patient.dateOfBirth), 'MMMM d, yyyy')}</span>
              </div>
              <div>
                <span className="text-gray-500">Gender:</span>
                <span className="ml-2 font-medium capitalize">{patient.gender}</span>
              </div>
            </div>
          </div>

          {/* Wound Info */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 uppercase text-sm tracking-wider">
              Wound Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-2 font-medium uppercase">{wound.type.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-gray-500">Location:</span>
                <span className="ml-2 font-medium capitalize">{wound.location}</span>
              </div>
              <div>
                <span className="text-gray-500">Onset:</span>
                <span className="ml-2 font-medium">{format(new Date(wound.onset), 'MMMM d, yyyy')}</span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="ml-2 font-medium capitalize">{wound.status}</span>
              </div>
            </div>
          </div>

          {/* Measurements */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 uppercase text-sm tracking-wider">
              Current Measurements
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{latestAssessment.measurement.area}</p>
                <p className="text-sm text-gray-500">Area (cm²)</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{latestAssessment.measurement.length}</p>
                <p className="text-sm text-gray-500">Length (cm)</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{latestAssessment.measurement.width}</p>
                <p className="text-sm text-gray-500">Width (cm)</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{latestAssessment.measurement.perimeter}</p>
                <p className="text-sm text-gray-500">Perimeter (cm)</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Captured: {format(new Date(latestAssessment.capturedAt), 'MMMM d, yyyy HH:mm')} • 
              Confidence: {Math.round(latestAssessment.segmentationResult.confidence * 100)}%
            </p>
          </div>

          {/* Analytics (Progress Report) */}
          {reportType === 'progress_report' && analytics && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 uppercase text-sm tracking-wider">
                Healing Progress
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className={`text-2xl font-bold ${analytics.totalReductionPercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.totalReductionPercent > 0 ? '-' : '+'}{Math.abs(analytics.totalReductionPercent).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">Total Reduction</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{analytics.healingVelocity}</p>
                  <p className="text-sm text-gray-500">cm²/week</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className={`text-2xl font-bold capitalize ${
                    analytics.trend === 'improving' ? 'text-green-600' :
                    analytics.trend === 'worsening' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {analytics.trend}
                  </p>
                  <p className="text-sm text-gray-500">Trend</p>
                </div>
              </div>
            </div>
          )}

          {/* Clinician Signature */}
          <div className="border-t border-gray-200 pt-6 mt-8">
            <h3 className="font-semibold text-gray-900 mb-3 uppercase text-sm tracking-wider">
              Clinical Review
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Clinician Name</label>
                <input
                  type="text"
                  value={clinicianName}
                  onChange={(e) => setClinicianName(e.target.value)}
                  placeholder="Enter name"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Credentials</label>
                <input
                  type="text"
                  value={clinicianCredentials}
                  onChange={(e) => setClinicianCredentials(e.target.value)}
                  placeholder="e.g., RN, CWOCN"
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>CLINICAL DECISION SUPPORT:</strong> This report is generated by AstroWound-MEASURE, 
              an AI-assisted clinical decision support tool. All measurements should be verified by a 
              qualified healthcare professional. This application does not replace clinical judgment.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportModulePage;
