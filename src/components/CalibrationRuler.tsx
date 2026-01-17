/**
 * AstroWound-MEASURE Printable Calibration Ruler
 * Clinical-grade calibration template with instructions
 */

import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Info, CheckCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const CalibrationRuler: React.FC = () => {
  const navigate = useNavigate();
  const rulerRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!rulerRef.current) return;

    try {
      const canvas = await html2canvas(rulerRef.current, {
        scale: 4, // High resolution
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190; // A4 width minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        10,
        10,
        imgWidth,
        imgHeight
      );

      pdf.save('AstroWound-Calibration-Ruler.pdf');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Hidden in print */}
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
            <h1 className="text-lg font-semibold text-gray-900">
              Calibration Kit
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-astro-500 text-white rounded-lg hover:bg-astro-600"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>
      </header>

      {/* Instructions - Hidden in print */}
      <div className="max-w-4xl mx-auto p-4 print:hidden">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                How to Use the Calibration Ruler
              </h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-1" />
                  <span>Print this page at <strong>100% scale</strong> (no scaling)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-1" />
                  <span>Verify the printed ruler against a physical ruler</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-1" />
                  <span>Place the ruler on the <strong>same plane</strong> as the wound</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-1" />
                  <span>Position 2-5 cm from wound edge</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-1" />
                  <span>Ensure ruler is fully visible in the photograph</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Ruler */}
      <div className="max-w-4xl mx-auto p-4">
        <div
          ref={rulerRef}
          className="bg-white p-8 print:p-0 print:shadow-none ruler-page-height"
        >
          {/* Header */}
          <div className="text-center mb-8 print:mb-4">
            <h1 className="text-2xl font-bold text-gray-900 print:text-xl">
              AstroWound-MEASURE
            </h1>
            <p className="text-gray-600">Wound Measurement Calibration Template</p>
          </div>

          {/* Main Ruler - 15cm */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              PRIMARY RULER (15 cm)
            </h3>
            <svg
              viewBox="0 0 600 80"
              className="w-full border border-gray-300 ruler-primary-height"
            >
              {/* Background */}
              <rect x="0" y="0" width="600" height="80" fill="white" />
              
              {/* Ruler markings */}
              {Array.from({ length: 151 }, (_, i) => {
                const x = (i / 150) * 600;
                const isCm = i % 10 === 0;
                const isHalfCm = i % 5 === 0;
                const height = isCm ? 30 : isHalfCm ? 20 : 12;
                
                return (
                  <g key={i}>
                    <line
                      x1={x}
                      y1={0}
                      x2={x}
                      y2={height}
                      stroke="black"
                      strokeWidth={isCm ? 2 : 1}
                    />
                    {isCm && (
                      <text
                        x={x}
                        y={45}
                        textAnchor="middle"
                        fontSize="14"
                        fontWeight="bold"
                        fill="black"
                      >
                        {i / 10}
                      </text>
                    )}
                  </g>
                );
              })}
              
              {/* Bottom border */}
              <line
                x1="0"
                y1="0"
                x2="600"
                y2="0"
                stroke="black"
                strokeWidth="2"
              />
              
              {/* Unit label */}
              <text
                x="580"
                y="70"
                textAnchor="end"
                fontSize="12"
                fill="gray"
              >
                cm
              </text>
            </svg>
          </div>

          {/* Grid Pattern */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              CALIBRATION GRID (1cm × 1cm squares)
            </h3>
            <svg
              viewBox="0 0 200 200"
              className="border border-gray-300 calibration-grid"
            >
              {/* Grid lines */}
              {Array.from({ length: 9 }, (_, i) => (
                <g key={i}>
                  <line
                    x1={(i + 1) * 20}
                    y1="0"
                    x2={(i + 1) * 20}
                    y2="200"
                    stroke="black"
                    strokeWidth="0.5"
                  />
                  <line
                    x1="0"
                    y1={(i + 1) * 20}
                    x2="200"
                    y2={(i + 1) * 20}
                    stroke="black"
                    strokeWidth="0.5"
                  />
                </g>
              ))}
              
              {/* Border */}
              <rect
                x="0"
                y="0"
                width="200"
                height="200"
                fill="none"
                stroke="black"
                strokeWidth="2"
              />
              
              {/* Crosshairs */}
              <line x1="100" y1="90" x2="100" y2="110" stroke="black" strokeWidth="1" />
              <line x1="90" y1="100" x2="110" y2="100" stroke="black" strokeWidth="1" />
              <circle cx="100" cy="100" r="3" fill="black" />
            </svg>
          </div>

          {/* Circle Markers */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              FIDUCIAL CIRCLES
            </h3>
            <div className="flex gap-8">
              {/* 2.5cm circle */}
              <div className="text-center">
                <svg
                  viewBox="0 0 100 100"
                  className="circle-25mm"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="48"
                    fill="none"
                    stroke="black"
                    strokeWidth="2"
                  />
                  <circle cx="50" cy="50" r="3" fill="black" />
                  <line x1="50" y1="2" x2="50" y2="20" stroke="black" strokeWidth="1" />
                  <line x1="50" y1="80" x2="50" y2="98" stroke="black" strokeWidth="1" />
                  <line x1="2" y1="50" x2="20" y2="50" stroke="black" strokeWidth="1" />
                  <line x1="80" y1="50" x2="98" y2="50" stroke="black" strokeWidth="1" />
                </svg>
                <p className="text-xs text-gray-600 mt-1">Ø 2.5 cm</p>
              </div>
              
              {/* 2cm circle */}
              <div className="text-center">
                <svg
                  viewBox="0 0 80 80"
                  className="circle-20mm"
                >
                  <circle
                    cx="40"
                    cy="40"
                    r="38"
                    fill="none"
                    stroke="black"
                    strokeWidth="2"
                  />
                  <circle cx="40" cy="40" r="3" fill="black" />
                </svg>
                <p className="text-xs text-gray-600 mt-1">Ø 2.0 cm</p>
              </div>
              
              {/* 1cm circle */}
              <div className="text-center">
                <svg
                  viewBox="0 0 40 40"
                  className="circle-10mm"
                >
                  <circle
                    cx="20"
                    cy="20"
                    r="18"
                    fill="black"
                  />
                </svg>
                <p className="text-xs text-gray-600 mt-1">Ø 1.0 cm</p>
              </div>
            </div>
          </div>

          {/* L-Shaped Ruler */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              L-SHAPED WOUND RULER
            </h3>
            <svg
              viewBox="0 0 300 300"
              className="l-ruler"
            >
              {/* Vertical ruler */}
              <rect x="0" y="0" width="30" height="300" fill="white" stroke="black" strokeWidth="2" />
              {Array.from({ length: 101 }, (_, i) => {
                const y = (i / 100) * 300;
                const isCm = i % 10 === 0;
                const isHalfCm = i % 5 === 0;
                const width = isCm ? 20 : isHalfCm ? 14 : 8;
                
                return (
                  <g key={`v${i}`}>
                    <line
                      x1={30}
                      y1={y}
                      x2={30 - width}
                      y2={y}
                      stroke="black"
                      strokeWidth={isCm ? 1.5 : 0.5}
                    />
                    {isCm && i > 0 && (
                      <text
                        x={5}
                        y={y + 4}
                        fontSize="10"
                        fontWeight="bold"
                        fill="black"
                      >
                        {i / 10}
                      </text>
                    )}
                  </g>
                );
              })}
              
              {/* Horizontal ruler */}
              <rect x="0" y="270" width="300" height="30" fill="white" stroke="black" strokeWidth="2" />
              {Array.from({ length: 101 }, (_, i) => {
                const x = (i / 100) * 300;
                const isCm = i % 10 === 0;
                const isHalfCm = i % 5 === 0;
                const height = isCm ? 20 : isHalfCm ? 14 : 8;
                
                return (
                  <g key={`h${i}`}>
                    <line
                      x1={x}
                      y1={270}
                      x2={x}
                      y2={270 + height}
                      stroke="black"
                      strokeWidth={isCm ? 1.5 : 0.5}
                    />
                    {isCm && i > 0 && (
                      <text
                        x={x}
                        y={295}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="bold"
                        fill="black"
                      >
                        {i / 10}
                      </text>
                    )}
                  </g>
                );
              })}
              
              {/* Corner square */}
              <rect x="0" y="270" width="30" height="30" fill="black" />
            </svg>
          </div>

          {/* Print verification */}
          <div className="border-t pt-4 mt-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">
                  <strong>PRINT VERIFICATION:</strong> The box below should measure exactly 1cm × 1cm
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div
                    className="border-2 border-black bg-white verification-box"
                  />
                  <span className="text-xs text-gray-600">← 1cm × 1cm</span>
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">
                <p>AstroWound-MEASURE v1.0</p>
                <p>astrowound.medical</p>
              </div>
            </div>
          </div>

          {/* Usage instructions for print */}
          <div className="border-t pt-4 mt-4 print:block hidden">
            <h4 className="text-sm font-semibold mb-2">USAGE INSTRUCTIONS</h4>
            <ol className="text-xs text-gray-600 space-y-1">
              <li>1. Verify print scale using the 1cm verification box</li>
              <li>2. Cut out desired calibration marker(s)</li>
              <li>3. Place on same plane as wound, 2-5cm from wound edge</li>
              <li>4. Ensure marker is fully visible in photograph</li>
              <li>5. Take photo perpendicular to wound surface</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block,
          .print\\:block * {
            visibility: visible;
          }
          [ref="rulerRef"],
          [ref="rulerRef"] * {
            visibility: visible;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
};
