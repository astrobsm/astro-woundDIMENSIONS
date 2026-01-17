/**
 * AstroWound-MEASURE Clinical Report Generator
 * PDF export and EMR-ready reports
 */

import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import {
  FileText,
  Download,
  Loader2,
  User,
  Calendar,
  Activity,
} from 'lucide-react';
import { getMeasurementEngine } from '@/engine';
import type { Patient, Wound, WoundAssessment, WoundAnalytics } from '@/types';

interface ReportModuleProps {
  patient: Patient;
  wound: Wound;
  assessments: WoundAssessment[];
  reportType: 'single_assessment' | 'progress_report' | 'discharge_summary';
  dateRange?: { start: Date; end: Date };
  onClose: () => void;
}

export const ReportModule: React.FC<ReportModuleProps> = ({
  patient,
  wound,
  assessments,
  reportType,
  onClose,
}) => {
  const [generating, setGenerating] = useState(false);
  const [clinicianName, setClinicianName] = useState('');
  const [clinicianCredentials, setClinicianCredentials] = useState('');

  // Calculate analytics
  const analytics: WoundAnalytics | null = assessments.length > 0
    ? getMeasurementEngine().calculateWoundAnalytics(wound.id, assessments, new Date(wound.onset))
    : null;

  const generatePDF = async () => {
    setGenerating(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      // Header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(14, 165, 233); // Astro blue
      pdf.text('AstroWound-MEASURE', pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;

      pdf.setFontSize(12);
      pdf.setTextColor(100);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Clinical Wound Assessment Report', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Report type and date
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0);
      const reportTitle = {
        single_assessment: 'Single Assessment Report',
        progress_report: 'Progress Report',
        discharge_summary: 'Discharge Summary',
      }[reportType];
      pdf.text(reportTitle, margin, yPos);
      yPos += 7;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100);
      pdf.text(`Generated: ${format(new Date(), 'MMMM d, yyyy HH:mm')}`, margin, yPos);
      yPos += 12;

      // Divider
      pdf.setDrawColor(229, 231, 235);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // Patient Information Section
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0);
      pdf.text('PATIENT INFORMATION', margin, yPos);
      yPos += 7;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const patientInfo = [
        ['Name:', `${patient.firstName} ${patient.lastName}`],
        ['MRN:', patient.mrn],
        ['Date of Birth:', format(new Date(patient.dateOfBirth), 'MMMM d, yyyy')],
        ['Gender:', patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)],
      ];

      patientInfo.forEach(([label, value]) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, margin, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, margin + 30, yPos);
        yPos += 5;
      });
      yPos += 8;

      // Wound Information Section
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('WOUND INFORMATION', margin, yPos);
      yPos += 7;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const woundInfo = [
        ['Type:', wound.type.replace('_', ' ').toUpperCase()],
        ['Location:', wound.location + (wound.locationDetail ? ` - ${wound.locationDetail}` : '')],
        ['Onset Date:', format(new Date(wound.onset), 'MMMM d, yyyy')],
        ['Status:', wound.status.charAt(0).toUpperCase() + wound.status.slice(1)],
      ];

      woundInfo.forEach(([label, value]) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, margin, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, margin + 30, yPos);
        yPos += 5;
      });
      yPos += 8;

      // Divider
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // Measurements Section
      if (assessments.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('CURRENT MEASUREMENTS', margin, yPos);
        yPos += 7;

        const latestAssessment = assessments[0];
        const { measurement } = latestAssessment;

        pdf.setFontSize(10);
        const measurementData = [
          ['Area:', `${measurement.area} cm²`],
          ['Length:', `${measurement.length} cm`],
          ['Width:', `${measurement.width} cm`],
          ['Perimeter:', `${measurement.perimeter} cm`],
        ];

        if (measurement.depth) {
          measurementData.push(['Depth:', `${measurement.depth} cm`]);
        }
        if (measurement.volume) {
          measurementData.push(['Volume:', `${measurement.volume} cm³`]);
        }

        measurementData.forEach(([label, value]) => {
          pdf.setFont('helvetica', 'bold');
          pdf.text(label, margin, yPos);
          pdf.setFont('helvetica', 'normal');
          pdf.text(value, margin + 30, yPos);
          yPos += 5;
        });
        yPos += 5;

        pdf.setFontSize(9);
        pdf.setTextColor(100);
        pdf.text(`Captured: ${format(new Date(latestAssessment.capturedAt), 'MMMM d, yyyy HH:mm')}`, margin, yPos);
        pdf.text(`Confidence: ${Math.round(latestAssessment.segmentationResult.confidence * 100)}%`, margin + 70, yPos);
        yPos += 10;
      }

      // Progress Analytics (for progress reports)
      if (reportType === 'progress_report' && analytics) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0);
        pdf.text('HEALING PROGRESS', margin, yPos);
        yPos += 7;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const progressData = [
          ['Initial Area:', `${analytics.initialArea} cm²`],
          ['Current Area:', `${analytics.currentArea} cm²`],
          ['Total Reduction:', `${analytics.totalReduction} cm² (${analytics.totalReductionPercent.toFixed(1)}%)`],
          ['Healing Rate:', `${analytics.healingVelocity} cm²/week`],
          ['Trend:', analytics.trend.charAt(0).toUpperCase() + analytics.trend.slice(1)],
          ['Days Since Onset:', `${analytics.daysSinceOnset} days`],
          ['Total Assessments:', `${analytics.assessmentCount}`],
        ];

        progressData.forEach(([label, value]) => {
          pdf.setFont('helvetica', 'bold');
          pdf.text(label, margin, yPos);
          pdf.setFont('helvetica', 'normal');
          pdf.text(value, margin + 40, yPos);
          yPos += 5;
        });
        yPos += 10;
      }

      // Add wound image if available
      if (assessments.length > 0 && assessments[0].originalImage) {
        // Check if we need a new page
        if (yPos > pageHeight - 80) {
          pdf.addPage();
          yPos = margin;
        }

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('WOUND IMAGE', margin, yPos);
        yPos += 5;

        try {
          const imgWidth = 80;
          const imgHeight = 60;
          pdf.addImage(
            assessments[0].originalImage,
            'JPEG',
            margin,
            yPos,
            imgWidth,
            imgHeight
          );
          yPos += imgHeight + 10;
        } catch (err) {
          console.error('Failed to add image to PDF:', err);
        }
      }

      // Clinical Notes
      if (assessments.length > 0 && assessments[0].notes) {
        if (yPos > pageHeight - 40) {
          pdf.addPage();
          yPos = margin;
        }

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('CLINICAL NOTES', margin, yPos);
        yPos += 7;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const splitNotes = pdf.splitTextToSize(assessments[0].notes, pageWidth - 2 * margin);
        pdf.text(splitNotes, margin, yPos);
        yPos += splitNotes.length * 5 + 10;
      }

      // Disclaimer
      if (yPos > pageHeight - 50) {
        pdf.addPage();
        yPos = margin;
      }

      yPos = pageHeight - 35;
      pdf.setDrawColor(229, 231, 235);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;

      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.setFont('helvetica', 'italic');
      const disclaimer = 'DISCLAIMER: This report is generated by AstroWound-MEASURE, an AI-assisted clinical decision support tool. All measurements and analyses should be verified by a qualified healthcare professional. This is not a substitute for clinical judgment.';
      const splitDisclaimer = pdf.splitTextToSize(disclaimer, pageWidth - 2 * margin);
      pdf.text(splitDisclaimer, margin, yPos);
      yPos += splitDisclaimer.length * 4 + 5;

      // Signature line
      if (clinicianName) {
        pdf.setFontSize(10);
        pdf.setTextColor(0);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Reviewed by: ${clinicianName}${clinicianCredentials ? `, ${clinicianCredentials}` : ''}`, margin, yPos);
        yPos += 5;
        pdf.text(`Date: ${format(new Date(), 'MMMM d, yyyy')}`, margin, yPos);
      }

      // Save PDF
      const filename = `AstroWound_${patient.lastName}_${patient.mrn}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-astro-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-astro-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Generate Report</h2>
              <p className="text-sm text-gray-500">
                {reportType === 'single_assessment' && 'Single Assessment Report'}
                {reportType === 'progress_report' && 'Progress Report'}
                {reportType === 'discharge_summary' && 'Discharge Summary'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Report Preview */}
          <div className="bg-gray-50 rounded-xl p-6 space-y-4">
            {/* Patient info */}
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium">{patient.firstName} {patient.lastName}</p>
                <p className="text-sm text-gray-500">MRN: {patient.mrn}</p>
              </div>
            </div>

            {/* Wound info */}
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium">
                  {wound.type.replace('_', ' ').toUpperCase()} - {wound.location}
                </p>
                <p className="text-sm text-gray-500">
                  {assessments.length} assessment{assessments.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Date range */}
            {assessments.length > 0 && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium">
                    {format(new Date(assessments[assessments.length - 1].capturedAt), 'MMM d, yyyy')}
                    {assessments.length > 1 && (
                      <> — {format(new Date(assessments[0].capturedAt), 'MMM d, yyyy')}</>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">Date range</p>
                </div>
              </div>
            )}

            {/* Analytics summary */}
            {analytics && reportType === 'progress_report' && (
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Healing Summary</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Initial Area:</span>{' '}
                    <span className="font-medium">{analytics.initialArea} cm²</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Current Area:</span>{' '}
                    <span className="font-medium">{analytics.currentArea} cm²</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Reduction:</span>{' '}
                    <span className={`font-medium ${
                      analytics.totalReductionPercent > 0 ? 'text-clinical-success' : 'text-clinical-danger'
                    }`}>
                      {analytics.totalReductionPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Trend:</span>{' '}
                    <span className="font-medium capitalize">{analytics.trend}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Clinician Signature */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Clinician Signature (Optional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  value={clinicianName}
                  onChange={(e) => setClinicianName(e.target.value)}
                  placeholder="Dr. Jane Smith"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Credentials</label>
                <input
                  type="text"
                  value={clinicianCredentials}
                  onChange={(e) => setClinicianCredentials(e.target.value)}
                  placeholder="MD, CWOCN"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Clinical Decision Support Tool:</strong> This report is AI-assisted and should be
              verified by a qualified healthcare professional. All measurements are subject to
              calibration accuracy and image quality.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={generatePDF}
            disabled={generating}
            className="px-6 py-2 bg-astro-500 text-white rounded-lg font-medium hover:bg-astro-600 disabled:opacity-50 flex items-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
