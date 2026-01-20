/**
 * AstroWound-MEASURE Dashboard Component
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Users,
  Activity,
  Calendar,
  Plus,
  Search,
  FileText,
  Settings,
  Wifi,
  WifiOff,
  ChevronRight,
  TrendingDown,
  Download,
  HelpCircle,
} from 'lucide-react';
import { usePatientsStore, useAppStore } from '@/store';
import * as db from '@/store/database';
import type { Patient, Wound } from '@/types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { patients, loading, loadPatients, searchPatients } = usePatientsStore();
  const { isOnline, isModelLoaded, setModelLoaded, pendingSync } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentWounds, setRecentWounds] = useState<Array<{ wound: Wound; patient: Patient }>>([]);
  const [modelStatus, setModelStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeWounds: 0,
    assessmentsToday: 0,
    healingWounds: 0,
  });

  useEffect(() => {
    loadPatients();
    loadDashboardData();
    initializeAIModel();
  }, []);

  // Initialize AI model in background
  const initializeAIModel = async () => {
    if (isModelLoaded) {
      setModelStatus('ready');
      return;
    }
    
    setModelStatus('loading');
    try {
      const { getSegmentationEngine } = await import('@/engine');
      const engine = getSegmentationEngine();
      await engine.initialize();
      setModelLoaded(true);
      setModelStatus('ready');
    } catch (error) {
      console.error('Failed to initialize AI model:', error);
      setModelStatus('error');
    }
  };

  const loadDashboardData = async () => {
    try {
      const allPatients = await db.getAllPatients();
      let totalActiveWounds = 0;
      let healingWounds = 0;
      const woundsWithPatients: Array<{ wound: Wound; patient: Patient }> = [];

      for (const patient of allPatients) {
        const wounds = await db.getWoundsForPatient(patient.id);
        for (const wound of wounds) {
          if (wound.status === 'active' || wound.status === 'healing') {
            totalActiveWounds++;
            woundsWithPatients.push({ wound, patient });
          }
          if (wound.status === 'healing') {
            healingWounds++;
          }
        }
      }

      // Sort by most recent update
      woundsWithPatients.sort((a, b) => 
        new Date(b.wound.updatedAt).getTime() - new Date(a.wound.updatedAt).getTime()
      );

      setRecentWounds(woundsWithPatients.slice(0, 5));
      setStats({
        totalPatients: allPatients.length,
        activeWounds: totalActiveWounds,
        assessmentsToday: 0, // TODO: Calculate from assessments
        healingWounds,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 2) {
      searchPatients(query);
    } else if (query.length === 0) {
      loadPatients();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-astro-500 to-astro-600 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AstroWound-MEASURE</h1>
                <p className="text-xs text-gray-500">Clinical Wound Assessment</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Online Status */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isOnline ? 'Online' : 'Offline'}
              </div>

              {/* Pending sync */}
              {pendingSync > 0 && (
                <div className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">
                  {pendingSync} pending
                </div>
              )}

              {/* User Guide */}
              <Link
                to="/guide"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title="User Guide"
              >
                <HelpCircle className="w-5 h-5" />
              </Link>

              {/* Settings */}
              <Link
                to="/settings"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
                <p className="text-sm text-gray-500">Patients</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.activeWounds}</p>
                <p className="text-sm text-gray-500">Active Wounds</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.healingWounds}</p>
                <p className="text-sm text-gray-500">Healing</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.assessmentsToday}</p>
                <p className="text-sm text-gray-500">Today</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/patients/new')}
            className="bg-astro-500 hover:bg-astro-600 text-white rounded-xl p-4 flex items-center gap-3 transition-colors"
          >
            <Plus className="w-6 h-6" />
            <span className="font-medium">New Patient</span>
          </button>

          <button
            onClick={() => navigate('/capture')}
            className="bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 text-gray-700 rounded-xl p-4 flex items-center gap-3 transition-colors"
          >
            <Activity className="w-6 h-6" />
            <span className="font-medium">Quick Capture</span>
          </button>

          <Link
            to="/calibration"
            className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl p-4 flex items-center gap-3 transition-colors"
          >
            <Download className="w-6 h-6" />
            <span className="font-medium">Calibration Kit</span>
          </Link>

          <Link
            to="/reports"
            className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl p-4 flex items-center gap-3 transition-colors"
          >
            <FileText className="w-6 h-6" />
            <span className="font-medium">Reports</span>
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search patients by name or MRN..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-astro-500 focus:border-transparent"
          />
        </div>

        {/* Recent Wounds */}
        {recentWounds.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="divide-y">
              {recentWounds.map(({ wound, patient }) => (
                <button
                  key={wound.id}
                  onClick={() => navigate(`/patients/${patient.id}/wounds/${wound.id}`)}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className={`w-3 h-3 rounded-full ${
                    wound.status === 'healing' ? 'bg-clinical-success' :
                    wound.status === 'worsening' ? 'bg-clinical-danger' :
                    'bg-clinical-warning'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {patient.firstName} {patient.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {wound.type.replace('_', ' ')} · {wound.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {format(new Date(wound.updatedAt), 'MMM d')}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{wound.status}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Patient List */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Patients</h2>
            <Link
              to="/patients"
              className="text-sm text-astro-500 hover:text-astro-600 font-medium"
            >
              View all
            </Link>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-astro-500 mx-auto" />
            </div>
          ) : patients.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No patients found</p>
              <button
                onClick={() => navigate('/patients/new')}
                className="text-astro-500 font-medium hover:text-astro-600"
              >
                Add your first patient
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {patients.slice(0, 10).map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => navigate(`/patients/${patient.id}`)}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-astro-100 flex items-center justify-center">
                    <span className="text-astro-600 font-medium">
                      {patient.firstName[0]}{patient.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {patient.firstName} {patient.lastName}
                    </p>
                    <p className="text-sm text-gray-500">MRN: {patient.mrn}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Model Status */}
        <div className={`rounded-xl p-6 text-white ${
          modelStatus === 'error' 
            ? 'bg-gradient-to-r from-red-500 to-red-600' 
            : 'bg-gradient-to-r from-astro-500 to-astro-600'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full bg-white/20 flex items-center justify-center ${
              modelStatus === 'loading' ? 'animate-pulse' : ''
            }`}>
              <Activity className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">AI Segmentation Engine (TensorFlow.js)</h3>
              <p className="text-white/80">
                {modelStatus === 'idle' && 'Preparing to load...'}
                {modelStatus === 'loading' && 'Loading TensorFlow.js model...'}
                {modelStatus === 'ready' && '✓ Model loaded & ready for wound analysis'}
                {modelStatus === 'error' && 'Failed to load - will retry on capture'}
              </p>
            </div>
            {modelStatus === 'ready' && (
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-green-300" />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
