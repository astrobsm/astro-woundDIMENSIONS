/**
 * AstroWound-MEASURE Patient Timeline Component
 * Progress tracking and healing visualization
 */

import React, { useEffect, useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Calendar,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useAssessmentsStore, useAppStore } from '@/store';
import { getMeasurementEngine } from '@/engine';
import type { Wound, WoundAssessment, WoundAnalytics } from '@/types';

interface PatientTimelineProps {
  wound: Wound;
  onAssessmentClick: (assessment: WoundAssessment) => void;
  onNewAssessment: () => void;
}

export const PatientTimeline: React.FC<PatientTimelineProps> = ({
  wound,
  onAssessmentClick,
  onNewAssessment,
}) => {
  const { assessments, loading, loadAssessmentsForWound } = useAssessmentsStore();
  const { currentPatient } = useAppStore();

  useEffect(() => {
    loadAssessmentsForWound(wound.id);
  }, [wound.id, loadAssessmentsForWound]);

  // Calculate analytics
  const analytics = useMemo<WoundAnalytics | null>(() => {
    if (assessments.length === 0) return null;
    
    const engine = getMeasurementEngine();
    return engine.calculateWoundAnalytics(wound.id, assessments, new Date(wound.onset));
  }, [assessments, wound.id, wound.onset]);

  // Chart data
  const chartData = useMemo(() => {
    return assessments
      .slice()
      .sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime())
      .map((assessment) => ({
        date: format(new Date(assessment.capturedAt), 'MMM d'),
        fullDate: format(new Date(assessment.capturedAt), 'MMM d, yyyy'),
        area: assessment.measurement.area,
        length: assessment.measurement.length,
        width: assessment.measurement.width,
      }));
  }, [assessments]);

  const getTrendIcon = () => {
    if (!analytics) return null;
    
    switch (analytics.trend) {
      case 'improving':
        return <TrendingDown className="w-5 h-5 text-clinical-success" />;
      case 'worsening':
        return <TrendingUp className="w-5 h-5 text-clinical-danger" />;
      default:
        return <Minus className="w-5 h-5 text-clinical-warning" />;
    }
  };

  const getTrendColor = () => {
    if (!analytics) return 'text-gray-500';
    
    switch (analytics.trend) {
      case 'improving':
        return 'text-clinical-success';
      case 'worsening':
        return 'text-clinical-danger';
      default:
        return 'text-clinical-warning';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-astro-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Patient & Wound Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {currentPatient?.firstName} {currentPatient?.lastName}
            </h2>
            <p className="text-gray-500">MRN: {currentPatient?.mrn}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="px-2 py-1 bg-astro-100 text-astro-700 rounded text-sm font-medium">
                {wound.type.replace('_', ' ').toUpperCase()}
              </span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-600">{wound.location}</span>
            </div>
          </div>
          <button
            onClick={onNewAssessment}
            className="px-4 py-2 bg-astro-500 text-white rounded-lg font-medium hover:bg-astro-600"
          >
            New Assessment
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500 mb-1">Current Area</p>
            <p className="text-2xl font-bold text-gray-900">{analytics.currentArea} cm²</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500 mb-1">Reduction</p>
            <p className={`text-2xl font-bold ${
              analytics.totalReductionPercent > 0 ? 'text-clinical-success' : 'text-clinical-danger'
            }`}>
              {analytics.totalReductionPercent > 0 ? '-' : '+'}{Math.abs(analytics.totalReductionPercent).toFixed(1)}%
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500 mb-1">Healing Rate</p>
            <p className="text-2xl font-bold text-gray-900">{analytics.healingVelocity} cm²/wk</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500 mb-1">Trend</p>
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className={`text-xl font-bold capitalize ${getTrendColor()}`}>
                {analytics.trend}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Healing Progress Chart */}
      {chartData.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-4">Healing Progress</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} unit=" cm²" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value} cm²`, 'Area']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="area"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  fill="url(#areaGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Dimensions Chart */}
      {chartData.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-4">Dimensions Over Time</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} unit=" cm" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="length"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Length"
                  dot={{ fill: '#10b981' }}
                />
                <Line
                  type="monotone"
                  dataKey="width"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Width"
                  dot={{ fill: '#f59e0b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-clinical-success" />
              <span className="text-sm text-gray-600">Length</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-clinical-warning" />
              <span className="text-sm text-gray-600">Width</span>
            </div>
          </div>
        </div>
      )}

      {/* Assessment Timeline */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold mb-4">Assessment History</h3>
        
        {assessments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No assessments yet</p>
            <button
              onClick={onNewAssessment}
              className="mt-4 text-astro-500 font-medium hover:text-astro-600"
            >
              Create first assessment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {assessments.map((assessment, index) => {
              const prev = assessments[index + 1];
              const change = prev
                ? ((assessment.measurement.area - prev.measurement.area) / prev.measurement.area) * 100
                : 0;

              return (
                <div
                  key={assessment.id}
                  onClick={() => onAssessmentClick(assessment)}
                  className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-astro-300 hover:bg-astro-50/50 cursor-pointer transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={assessment.originalImage}
                      alt="Wound"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {format(new Date(assessment.capturedAt), 'MMM d, yyyy')}
                      </p>
                      <span className="text-gray-400">·</span>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(assessment.capturedAt), { addSuffix: true })}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center gap-4">
                      <div>
                        <span className="text-lg font-bold text-gray-900">
                          {assessment.measurement.area} cm²
                        </span>
                        {prev && (
                          <span className={`ml-2 text-sm font-medium ${
                            change < 0 ? 'text-clinical-success' : change > 0 ? 'text-clinical-danger' : 'text-gray-500'
                          }`}>
                            {change > 0 ? '+' : ''}{change.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {assessment.measurement.length} × {assessment.measurement.width} cm
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      {assessment.clinicianVerified ? (
                        <span className="flex items-center gap-1 text-xs text-clinical-success">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-clinical-warning">
                          <AlertCircle className="w-3 h-3" />
                          Pending review
                        </span>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Projected Healing */}
      {analytics?.progressHistory.length && analytics.progressHistory[analytics.progressHistory.length - 1].projectedHealingDate && (
        <div className="bg-gradient-to-r from-astro-500 to-astro-600 rounded-xl shadow-sm p-6 text-white">
          <h3 className="font-semibold mb-2">Projected Complete Healing</h3>
          <p className="text-3xl font-bold">
            {format(
              analytics.progressHistory[analytics.progressHistory.length - 1].projectedHealingDate!,
              'MMMM d, yyyy'
            )}
          </p>
          <p className="mt-2 text-astro-100">
            Based on current healing rate of {analytics.healingVelocity} cm²/week
          </p>
          <p className="text-sm mt-1 text-astro-200">
            * Projection assumes consistent healing trajectory
          </p>
        </div>
      )}
    </div>
  );
};
