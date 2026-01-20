/**
 * AstroWound-MEASURE User Guide Component
 * Exportable PDF documentation for end users
 */

import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import {
  ArrowLeft,
  Download,
  BookOpen,
  Users,
  Camera,
  Ruler,
  FileText,
  Settings,
  Shield,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export const UserGuide: React.FC = () => {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const generatePDF = async () => {
    setGenerating(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      const addPage = () => {
        pdf.addPage();
        yPos = margin;
      };

      const checkPageBreak = (neededSpace: number) => {
        if (yPos + neededSpace > pageHeight - margin) {
          addPage();
        }
      };

      // Title Page
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(14, 165, 233);
      pdf.text('AstroWound-MEASURE', pageWidth / 2, 60, { align: 'center' });

      pdf.setFontSize(16);
      pdf.setTextColor(100);
      pdf.setFont('helvetica', 'normal');
      pdf.text('User Guide', pageWidth / 2, 75, { align: 'center' });

      pdf.setFontSize(12);
      pdf.text('AI-Powered Clinical Wound Assessment Application', pageWidth / 2, 90, { align: 'center' });

      pdf.setFontSize(10);
      pdf.text('Bonne Santé Medicals', pageWidth / 2, 105, { align: 'center' });
      pdf.text('bonnesantemedicals.com', pageWidth / 2, 112, { align: 'center' });
      pdf.text('Version 1.0.0', pageWidth / 2, 125, { align: 'center' });

      // Getting Started
      addPage();
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(14, 165, 233);
      pdf.text('Getting Started', margin, yPos);
      yPos += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60);
      const intro = 'AstroWound-MEASURE is a clinical wound measurement and tracking application that uses AI to automatically detect and measure wounds from photographs. The app works offline and stores all data securely on your device.';
      const introLines = pdf.splitTextToSize(intro, pageWidth - 2 * margin);
      pdf.text(introLines, margin, yPos);
      yPos += introLines.length * 5 + 10;

      // Dashboard Section
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0);
      pdf.text('Dashboard Overview', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60);
      const dashboardItems = [
        '• Total Patients — Number of registered patients',
        '• Active Wounds — Wounds currently being tracked',
        '• Healing Wounds — Wounds showing improvement',
        '• Recent Activity — Latest wound assessments',
      ];
      dashboardItems.forEach((item) => {
        pdf.text(item, margin, yPos);
        yPos += 5;
      });
      yPos += 8;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Quick Actions:', margin, yPos);
      yPos += 6;
      pdf.setFont('helvetica', 'normal');
      const quickActions = [
        '• New Patient — Register a new patient',
        '• Quick Capture — Start a wound assessment',
        '• Calibration Kit — Print calibration ruler',
        '• User Guide — Access this documentation',
      ];
      quickActions.forEach((item) => {
        pdf.text(item, margin, yPos);
        yPos += 5;
      });
      yPos += 10;

      // Patient Management
      checkPageBreak(60);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0);
      pdf.text('Patient Management', margin, yPos);
      yPos += 8;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Adding a New Patient:', margin, yPos);
      yPos += 6;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60);
      const patientSteps = [
        '1. From the Dashboard, tap "New Patient"',
        '2. Fill in required information:',
        '   - First Name & Last Name',
        '   - Medical Record Number (MRN)',
        '   - Date of Birth & Gender',
        '3. Optional: Add contact info, medical history, allergies',
        '4. Tap "Save Patient"',
      ];
      patientSteps.forEach((step) => {
        pdf.text(step, margin, yPos);
        yPos += 5;
      });
      yPos += 10;

      // Wound Management
      checkPageBreak(50);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0);
      pdf.text('Wound Management', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60);
      const woundSteps = [
        '1. Open a patient\'s profile',
        '2. Tap "+ Add Wound"',
        '3. Select wound type (Pressure ulcer, Diabetic ulcer, etc.)',
        '4. Select body location (Sacrum, Heel, Ankle, etc.)',
        '5. Add location detail and notes',
        '6. Save the wound record',
      ];
      woundSteps.forEach((step) => {
        pdf.text(step, margin, yPos);
        yPos += 5;
      });
      yPos += 8;

      // Wound Status Table
      pdf.setFont('helvetica', 'bold');
      pdf.text('Wound Status Types:', margin, yPos);
      yPos += 6;
      pdf.setFont('helvetica', 'normal');
      const statuses = [
        '• Active — Wound requires ongoing treatment',
        '• Healing — Wound showing improvement',
        '• Healed — Wound has fully healed',
        '• Worsening — Wound condition is declining',
      ];
      statuses.forEach((status) => {
        pdf.text(status, margin, yPos);
        yPos += 5;
      });
      yPos += 10;

      // Capturing Wound Images
      checkPageBreak(80);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0);
      pdf.text('Capturing Wound Images', margin, yPos);
      yPos += 8;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Before You Start:', margin, yPos);
      yPos += 6;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60);
      const beforeStart = [
        '1. Print the Calibration Ruler (Settings > Calibration Kit)',
        '2. Print at 100% scale (no scaling)',
        '3. Verify accuracy against a physical ruler',
      ];
      beforeStart.forEach((step) => {
        pdf.text(step, margin, yPos);
        yPos += 5;
      });
      yPos += 6;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0);
      pdf.text('Capture Process:', margin, yPos);
      yPos += 6;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60);
      const captureSteps = [
        '1. Tap "Quick Capture" from Dashboard',
        '2. Select patient and wound',
        '3. Position calibration ruler:',
        '   - Place on same plane as wound',
        '   - Position 2-5 cm from wound edge',
        '   - Ensure ruler is fully visible',
        '4. Tap capture button to take photo',
        '5. AI will automatically:',
        '   - Detect calibration ruler',
        '   - Segment wound boundary',
        '   - Calculate measurements',
      ];
      captureSteps.forEach((step) => {
        pdf.text(step, margin, yPos);
        yPos += 5;
      });
      yPos += 8;

      // Image Quality Tips
      checkPageBreak(40);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0);
      pdf.text('Image Quality Tips:', margin, yPos);
      yPos += 6;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60);
      const tips = [
        '✓ Use good, even lighting',
        '✓ Hold camera parallel to wound surface',
        '✓ Keep ruler and wound in sharp focus',
        '✓ Avoid shadows across the wound',
        '✗ Don\'t capture at steep angles',
      ];
      tips.forEach((tip) => {
        pdf.text(tip, margin, yPos);
        yPos += 5;
      });
      yPos += 10;

      // Understanding Measurements
      checkPageBreak(60);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0);
      pdf.text('Understanding Measurements', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60);
      const measurements = [
        '• Area — Total wound surface in cm²',
        '• Length — Longest axis measurement in cm',
        '• Width — Perpendicular to length in cm',
        '• Perimeter — Wound edge circumference in cm',
        '• Depth — Manual entry (if applicable)',
        '• Volume — Calculated if depth is provided',
      ];
      measurements.forEach((item) => {
        pdf.text(item, margin, yPos);
        yPos += 5;
      });
      yPos += 10;

      // Tracking Progress
      checkPageBreak(40);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0);
      pdf.text('Tracking Progress', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60);
      const tracking = [
        'The app automatically tracks healing trends:',
        '• Improving — Area decreasing >5%',
        '• Stable — Minimal change',
        '• Worsening — Area increasing >5%',
        '',
        'View the Patient Timeline to see all assessments',
        'in chronological order and compare over time.',
      ];
      tracking.forEach((item) => {
        pdf.text(item, margin, yPos);
        yPos += 5;
      });
      yPos += 10;

      // Generating Reports
      checkPageBreak(50);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0);
      pdf.text('Generating Reports', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60);
      const reports = [
        'Available Report Types:',
        '• Single Assessment — One measurement snapshot',
        '• Progress Report — Multiple assessments over time',
        '• Discharge Summary — Complete wound history',
        '',
        'To create a report:',
        '1. Open the wound timeline',
        '2. Tap "Generate Report"',
        '3. Select report type',
        '4. Enter clinician name and credentials',
        '5. Tap "Download PDF"',
      ];
      reports.forEach((item) => {
        pdf.text(item, margin, yPos);
        yPos += 5;
      });
      yPos += 10;

      // Privacy & Data
      checkPageBreak(40);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0);
      pdf.text('Privacy & Data', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60);
      const privacy = [
        '• All data is stored locally on your device',
        '• The app works fully offline',
        '• No patient data is sent to external servers',
        '• Export data regularly for backup (Settings > Export)',
      ];
      privacy.forEach((item) => {
        pdf.text(item, margin, yPos);
        yPos += 5;
      });
      yPos += 10;

      // Troubleshooting
      checkPageBreak(60);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0);
      pdf.text('Troubleshooting', margin, yPos);
      yPos += 8;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Calibration Not Detected:', margin, yPos);
      yPos += 6;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60);
      const calibrationTips = [
        '• Ensure ruler is printed at 100% scale',
        '• Check lighting — avoid glare on ruler',
        '• Keep ruler flat and fully visible',
        '• Hold camera steady and parallel',
      ];
      calibrationTips.forEach((item) => {
        pdf.text(item, margin, yPos);
        yPos += 5;
      });
      yPos += 6;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0);
      pdf.text('Poor Measurement Accuracy:', margin, yPos);
      yPos += 6;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60);
      const accuracyTips = [
        '• Verify ruler calibration is accurate',
        '• Ensure wound and ruler are on same plane',
        '• Avoid capturing at angles',
        '• Use consistent lighting',
      ];
      accuracyTips.forEach((item) => {
        pdf.text(item, margin, yPos);
        yPos += 5;
      });

      // Footer on last page
      pdf.setFontSize(9);
      pdf.setTextColor(150);
      pdf.text('AstroWound-MEASURE User Guide — Version 1.0.0', pageWidth / 2, pageHeight - 10, { align: 'center' });

      pdf.save('AstroWound-MEASURE-User-Guide.pdf');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40 print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Go back"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-astro-600" />
              <h1 className="text-lg font-semibold text-gray-900">User Guide</h1>
            </div>
          </div>
          <button
            onClick={generatePDF}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-astro-500 text-white rounded-lg hover:bg-astro-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {generating ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </header>

      {/* Content */}
      <main ref={contentRef} className="max-w-4xl mx-auto p-4 space-y-8">
        {/* Getting Started */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-astro-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-astro-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Getting Started</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            AstroWound-MEASURE is a clinical wound measurement and tracking application that uses AI 
            to automatically detect and measure wounds from photographs. The app works offline and 
            stores all data securely on your device.
          </p>
        </section>

        {/* Dashboard Overview */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Dashboard Overview</h2>
          </div>
          <p className="text-gray-600 mb-4">The Dashboard is your home screen showing:</p>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span><strong>Total Patients</strong> — Number of registered patients</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span><strong>Active Wounds</strong> — Wounds currently being tracked</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span><strong>Healing Wounds</strong> — Wounds showing improvement</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span><strong>Recent Activity</strong> — Latest wound assessments</span>
            </li>
          </ul>
        </section>

        {/* Patient Management */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Patient Management</h2>
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">Adding a New Patient:</h3>
          <ol className="list-decimal list-inside space-y-1 text-gray-600 mb-4">
            <li>From the Dashboard, tap <strong>"New Patient"</strong></li>
            <li>Fill in required information: Name, MRN, Date of Birth, Gender</li>
            <li>Optional: Add contact info, medical history, and allergies</li>
            <li>Tap <strong>"Save Patient"</strong></li>
          </ol>
          <h3 className="font-semibold text-gray-800 mb-2">Viewing Patient Details:</h3>
          <ol className="list-decimal list-inside space-y-1 text-gray-600">
            <li>Tap on any patient from the Dashboard list</li>
            <li>View patient information, active wounds, and assessment history</li>
            <li>Use the Edit button to update patient details</li>
          </ol>
        </section>

        {/* Wound Management */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Camera className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Wound Management</h2>
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">Creating a New Wound Record:</h3>
          <ol className="list-decimal list-inside space-y-1 text-gray-600 mb-4">
            <li>Open a patient's profile</li>
            <li>Tap <strong>"+ Add Wound"</strong></li>
            <li>Select wound type (Pressure ulcer, Diabetic ulcer, Surgical wound, etc.)</li>
            <li>Select body location (Sacrum, Heel, Ankle, Leg, etc.)</li>
            <li>Add any relevant notes and save</li>
          </ol>
          <h3 className="font-semibold text-gray-800 mb-2">Wound Status Types:</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-sm"><strong>Active</strong> — Ongoing treatment</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm"><strong>Healing</strong> — Improving</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm"><strong>Healed</strong> — Fully healed</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm"><strong>Worsening</strong> — Declining</span>
            </div>
          </div>
        </section>

        {/* Capturing Wound Images */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Camera className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Capturing Wound Images</h2>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Before You Start — Print the Calibration Ruler
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
              <li>Go to <strong>Settings → Calibration Kit</strong></li>
              <li>Print at <strong>100% scale</strong> (no scaling)</li>
              <li>Verify accuracy against a physical ruler</li>
            </ol>
          </div>

          <h3 className="font-semibold text-gray-800 mb-2">Capture Process:</h3>
          <ol className="list-decimal list-inside space-y-1 text-gray-600 mb-4">
            <li>From Dashboard, tap <strong>"Quick Capture"</strong></li>
            <li>Select the patient and wound</li>
            <li>Position the calibration ruler on the <strong>same plane</strong> as the wound</li>
            <li>Position <strong>2-5 cm</strong> from wound edge</li>
            <li>Ensure ruler is <strong>fully visible</strong></li>
            <li>Tap the capture button to take the photo</li>
          </ol>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Image Quality Tips:</h3>
            <ul className="space-y-1 text-gray-600 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Use good, even lighting
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Hold camera parallel to wound surface
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Keep ruler and wound in sharp focus
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Avoid shadows across the wound
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Don't capture at steep angles
              </li>
            </ul>
          </div>
        </section>

        {/* Understanding Measurements */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Ruler className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Understanding Measurements</h2>
          </div>
          <p className="text-gray-600 mb-4">After capture, the app displays:</p>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-900">Measurement</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-900">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr><td className="px-4 py-2 font-medium">Area</td><td className="px-4 py-2 text-gray-600">Total wound surface in cm²</td></tr>
                <tr><td className="px-4 py-2 font-medium">Length</td><td className="px-4 py-2 text-gray-600">Longest axis measurement in cm</td></tr>
                <tr><td className="px-4 py-2 font-medium">Width</td><td className="px-4 py-2 text-gray-600">Perpendicular to length in cm</td></tr>
                <tr><td className="px-4 py-2 font-medium">Perimeter</td><td className="px-4 py-2 text-gray-600">Wound edge circumference in cm</td></tr>
                <tr><td className="px-4 py-2 font-medium">Depth</td><td className="px-4 py-2 text-gray-600">Manual entry (if applicable)</td></tr>
                <tr><td className="px-4 py-2 font-medium">Volume</td><td className="px-4 py-2 text-gray-600">Calculated if depth is provided</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Generating Reports */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Generating Reports</h2>
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">Available Report Types:</h3>
          <ul className="space-y-1 text-gray-600 mb-4">
            <li><strong>Single Assessment</strong> — One measurement snapshot</li>
            <li><strong>Progress Report</strong> — Multiple assessments over time</li>
            <li><strong>Discharge Summary</strong> — Complete wound history</li>
          </ul>
          <h3 className="font-semibold text-gray-800 mb-2">Creating a Report:</h3>
          <ol className="list-decimal list-inside space-y-1 text-gray-600">
            <li>Open the wound timeline</li>
            <li>Tap <strong>"Generate Report"</strong></li>
            <li>Select report type</li>
            <li>Enter clinician name and credentials</li>
            <li>Tap <strong>"Download PDF"</strong></li>
          </ol>
        </section>

        {/* Privacy & Data */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-gray-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Privacy & Data</h2>
          </div>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>All data is stored <strong>locally on your device</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>The app works <strong>fully offline</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>No patient data is sent to external servers</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Export data regularly for backup (Settings → Export Data)</span>
            </li>
          </ul>
        </section>

        {/* Troubleshooting */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Troubleshooting</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Calibration Not Detected:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                <li>Ensure ruler is printed at 100% scale</li>
                <li>Check lighting — avoid glare on ruler</li>
                <li>Keep ruler flat and fully visible</li>
                <li>Hold camera steady and parallel</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">AI Model Won't Load:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                <li>Check device has sufficient memory</li>
                <li>Try refreshing the app</li>
                <li>Clear browser cache if using web version</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Poor Measurement Accuracy:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                <li>Verify ruler calibration is accurate</li>
                <li>Ensure wound and ruler are on same plane</li>
                <li>Avoid capturing at angles</li>
                <li>Use consistent lighting</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Version Info */}
        <div className="text-center py-6 text-gray-500 text-sm">
          <p><strong>Version:</strong> 1.0.0</p>
          <p>AstroWound-MEASURE — Clinical Wound Assessment Made Simple</p>
        </div>
      </main>
    </div>
  );
};

export default UserGuide;
