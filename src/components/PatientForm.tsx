/**
 * AstroWound-MEASURE Patient Management Component
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import {
  ArrowLeft,
  User,
  Save,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { usePatientsStore } from '@/store';
import type { Patient } from '@/types';

interface PatientFormProps {
  patient?: Patient;
  onSave?: (patient: Patient) => void;
}

export const PatientForm: React.FC<PatientFormProps> = ({ patient, onSave }) => {
  const navigate = useNavigate();
  const { addPatient, updatePatient } = usePatientsStore();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    firstName: patient?.firstName || '',
    lastName: patient?.lastName || '',
    mrn: patient?.mrn || '',
    dateOfBirth: patient?.dateOfBirth || '',
    gender: patient?.gender || 'male',
    phone: patient?.contact?.phone || '',
    email: patient?.contact?.email || '',
    address: patient?.contact?.address || '',
    medicalHistory: patient?.medicalHistory?.join(', ') || '',
    allergies: patient?.allergies?.join(', ') || '',
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.mrn.trim()) {
      newErrors.mrn = 'MRN is required';
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSaving(true);

    try {
      const patientData: Patient = {
        id: patient?.id || uuid(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        mrn: formData.mrn.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender as Patient['gender'],
        contact: {
          phone: formData.phone.trim() || undefined,
          email: formData.email.trim() || undefined,
          address: formData.address.trim() || undefined,
        },
        medicalHistory: formData.medicalHistory
          ? formData.medicalHistory.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        allergies: formData.allergies
          ? formData.allergies.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        createdAt: patient?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      if (patient) {
        await updatePatient(patientData);
      } else {
        await addPatient(patientData);
      }

      if (onSave) {
        onSave(patientData);
      } else {
        navigate(`/patients/${patientData.id}`);
      }
    } catch (error) {
      console.error('Failed to save patient:', error);
      setErrors({ submit: 'Failed to save patient. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
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
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {patient ? 'Edit Patient' : 'New Patient'}
          </h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Error message */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{errors.submit}</p>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Basic Information</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First name"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-astro-500 ${
                  errors.firstName ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last name"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-astro-500 ${
                  errors.lastName ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MRN *
              </label>
              <input
                type="text"
                name="mrn"
                value={formData.mrn}
                onChange={handleChange}
                placeholder="Medical Record Number"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-astro-500 ${
                  errors.mrn ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.mrn && (
                <p className="text-red-500 text-sm mt-1">{errors.mrn}</p>
              )}
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <input
                id="dateOfBirth"
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                title="Date of birth"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-astro-500 ${
                  errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.dateOfBirth && (
                <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
              Gender *
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              title="Select gender"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-astro-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Contact Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-astro-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="patient@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-astro-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                placeholder="Street address, City, State, ZIP"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-astro-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Medical Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medical History
              </label>
              <textarea
                name="medicalHistory"
                value={formData.medicalHistory}
                onChange={handleChange}
                rows={2}
                placeholder="Diabetes, Hypertension, Heart Disease (comma separated)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-astro-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">Separate conditions with commas</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allergies
              </label>
              <textarea
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                rows={2}
                placeholder="Penicillin, Latex, Iodine (comma separated)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-astro-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">Separate allergies with commas</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-astro-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-astro-600 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {patient ? 'Update Patient' : 'Create Patient'}
            </>
          )}
        </button>
      </form>
    </div>
  );
};
