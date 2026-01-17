/**
 * AstroWound-MEASURE Settings Component
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Wifi,
  WifiOff,
  HardDrive,
  Trash2,
  Download,
  ChevronRight,
  Shield,
  Ruler,
  Brain,
  RefreshCw,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useAppStore } from '@/store';
import * as db from '@/store/database';
import { getSegmentationEngine } from '@/engine';

interface StorageInfo {
  patients: number;
  wounds: number;
  assessments: number;
  estimatedSize: string;
}

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { isOnline, isModelLoaded, setModelLoaded } = useAppStore();
  
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    try {
      const patients = await db.getAllPatients();
      let woundCount = 0;
      let assessmentCount = 0;

      for (const patient of patients) {
        const wounds = await db.getWoundsForPatient(patient.id);
        woundCount += wounds.length;
        for (const wound of wounds) {
          assessmentCount += wound.assessments?.length || 0;
        }
      }

      // Estimate storage size (rough estimate)
      const estimatedBytes = assessmentCount * 500000; // ~500KB per assessment (including images)
      const estimatedMB = estimatedBytes / (1024 * 1024);

      setStorageInfo({
        patients: patients.length,
        wounds: woundCount,
        assessments: assessmentCount,
        estimatedSize: estimatedMB > 1 ? `${estimatedMB.toFixed(1)} MB` : `${(estimatedBytes / 1024).toFixed(0)} KB`,
      });
    } catch (error) {
      console.error('Failed to load storage info:', error);
    }
  };

  const handleLoadModel = async () => {
    if (modelLoading) return;
    
    setModelLoading(true);
    setMessage(null);

    try {
      const engine = getSegmentationEngine();
      await engine.initialize();
      setModelLoaded(true);
      setMessage({ type: 'success', text: 'AI model loaded successfully' });
    } catch (error) {
      console.error('Failed to load model:', error);
      setMessage({ type: 'error', text: 'Failed to load AI model' });
    } finally {
      setModelLoading(false);
    }
  };

  const handleUnloadModel = () => {
    const engine = getSegmentationEngine();
    engine.dispose();
    setModelLoaded(false);
    setMessage({ type: 'success', text: 'AI model unloaded' });
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const patients = await db.getAllPatients();
      const exportData: any = { patients: [], wounds: [] };

      for (const patient of patients) {
        exportData.patients.push(patient);
        const wounds = await db.getWoundsForPatient(patient.id);
        exportData.wounds.push(...wounds);
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `astrowound-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Data exported successfully' });
    } catch (error) {
      console.error('Failed to export data:', error);
      setMessage({ type: 'error', text: 'Failed to export data' });
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    setLoading(true);
    try {
      await db.clearAllData();
      await loadStorageInfo();
      setShowDeleteConfirm(false);
      setMessage({ type: 'success', text: 'All data cleared successfully' });
    } catch (error) {
      console.error('Failed to clear data:', error);
      setMessage({ type: 'error', text: 'Failed to clear data' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Connection Status */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Status</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOnline ? <Wifi className="w-5 h-5 text-green-600" /> : <WifiOff className="w-5 h-5 text-red-600" />}
                <div>
                  <p className="font-medium text-gray-900">Connection</p>
                  <p className="text-sm text-gray-500">{isOnline ? 'Online' : 'Offline'}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {isOnline ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-astro-600" />
                <div>
                  <p className="font-medium text-gray-900">AI Model</p>
                  <p className="text-sm text-gray-500">{isModelLoaded ? 'Loaded and ready' : 'Not loaded'}</p>
                </div>
              </div>
              <button
                onClick={isModelLoaded ? handleUnloadModel : handleLoadModel}
                disabled={modelLoading}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  isModelLoaded
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-astro-500 text-white hover:bg-astro-600'
                }`}
              >
                {modelLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : isModelLoaded ? (
                  'Unload'
                ) : (
                  'Load'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Storage Info */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Storage</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Local Data</p>
                <p className="text-sm text-gray-500">
                  {storageInfo
                    ? `${storageInfo.patients} patients, ${storageInfo.wounds} wounds, ${storageInfo.assessments} assessments`
                    : 'Loading...'}
                </p>
              </div>
              <span className="text-sm text-gray-500">{storageInfo?.estimatedSize || '—'}</span>
            </div>
          </div>
        </div>

        {/* Calibration */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Calibration</h2>
          </div>
          <button
            onClick={() => navigate('/calibration')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Ruler className="w-5 h-5 text-astro-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Calibration Ruler</p>
                <p className="text-sm text-gray-500">Download printable calibration template</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Data Management</h2>
          </div>
          <div className="divide-y divide-gray-100">
            <button
              onClick={handleExportData}
              disabled={loading}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-astro-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Export Data</p>
                  <p className="text-sm text-gray-500">Download all patient and wound data</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full p-4 flex items-center justify-between hover:bg-red-50"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-red-500" />
                <div className="text-left">
                  <p className="font-medium text-red-600">Clear All Data</p>
                  <p className="text-sm text-gray-500">Permanently delete all local data</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">About</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Version</span>
              <span className="font-medium text-gray-900">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">AI Model</span>
              <span className="font-medium text-gray-900">AstroWound-UNet v1.0</span>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Clinical Decision Support</p>
              <p className="text-sm text-yellow-700 mt-1">
                AstroWound-MEASURE is an AI-assisted clinical decision support tool. 
                All measurements should be verified by a qualified healthcare professional. 
                This application does not replace clinical judgment.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Clear All Data?</h3>
            <p className="text-gray-500 text-center mb-6">
              This will permanently delete all patients, wounds, and assessments. 
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleClearData}
                disabled={loading}
                className="flex-1 btn-danger"
              >
                {loading ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
