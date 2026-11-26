import React, { useState, useEffect } from 'react';
import {
  Users, Search, Plus, Edit, UserCheck, Phone, MapPin, AlertCircle,
  X, HeartPulse, History, Trash2, Lock
} from 'lucide-react';
import { apiUrl } from '../utils/apiConfig';

export interface Patient {
  id: number;
  patient_id: string; // Unique MRN (e.g. MOC-2026-0001)
  name: string;
  age: number | null;
  gender: 'Male' | 'Female' | 'Other';
  guardian_name?: string; // Father's / Spouse's name (S/o, D/o, W/o)
  phone: string;
  email?: string;
  address: string;
  city: string;
  pincode?: string;
  blood_group?: string;
  known_allergies?: string;
  chronic_conditions?: string;
  attending_doctor?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  is_example?: boolean | number;
}

interface PatientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPatient?: (patient: Patient) => void;
  onSelectPatientForBilling?: (patient: Patient) => void;
}

export const PatientsModal: React.FC<PatientsModalProps> = ({
  isOpen,
  onClose,
  onSelectPatient,
  onSelectPatientForBilling
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form Drawer state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<Partial<Patient>>({
    patient_id: '',
    name: '',
    age: null,
    gender: 'Male',
    guardian_name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Chennai',
    pincode: '',
    blood_group: 'B+',
    known_allergies: '',
    chronic_conditions: '',
    attending_doctor: 'Dr. Arjun Sharma, MS (Ortho)',
    notes: ''
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Load patients from API
  const loadPatients = async (query = '') => {
    try {
      setLoading(true);
      const url = query ? apiUrl(`/api/patients?search=${encodeURIComponent(query)}`) : apiUrl('/api/patients');
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPatients(Array.isArray(data) ? data : []);
        if (data.length > 0 && !selectedPatient) {
          setSelectedPatient(data[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load patients:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPatients();
    }
  }, [isOpen]);

  // Load history when selectedPatient changes
  useEffect(() => {
    if (selectedPatient) {
      loadPatientHistory(selectedPatient);
    } else {
      setPatientHistory([]);
    }
  }, [selectedPatient]);

  const loadPatientHistory = async (patient: Patient) => {
    try {
      setLoadingHistory(true);
      const res = await fetch(apiUrl(`/api/patients/${patient.id}/history`));
      if (res.ok) {
        const data = await res.json();
        setPatientHistory(data.history || []);
      }
    } catch (e) {
      console.error("Failed to load patient history:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    loadPatients(val);
  };

  const handleDeleteExamplePatient = async (p: Patient) => {
    const confirmed = window.confirm(`Delete Patient Record:\n\nAre you sure you want to remove patient ${p.name} (${p.patient_id}) from the clinic database?`);
    if (!confirmed) return;

    try {
      const res = await fetch(apiUrl(`/api/patients/${p.id}`), {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete patient.");
        return;
      }
      await loadPatients(searchQuery);
      setSelectedPatient(null);
    } catch (e: any) {
      alert(e.message || "Failed to delete patient.");
    }
  };

  const openCreateForm = async () => {
    setFormError('');
    setFormMode('create');
    try {
      const res = await fetch(apiUrl('/api/patients/next-mrn'));
      const data = await res.json();
      setFormData({
        patient_id: data.nextMrn || `MOC-${new Date().getFullYear()}-0001`,
        name: '',
        age: 35,
        gender: 'Male',
        guardian_name: '',
        phone: '+91 ',
        email: '',
        address: '',
        city: 'Chennai',
        pincode: '600002',
        blood_group: 'B+',
        known_allergies: '',
        chronic_conditions: '',
        attending_doctor: 'Dr. Arjun Sharma, MS (Ortho)',
        notes: ''
      });
    } catch {
      setFormData({
        patient_id: `MOC-${new Date().getFullYear()}-0001`,
        name: '',
        age: 35,
        gender: 'Male',
        guardian_name: '',
        phone: '+91 ',
        email: '',
        address: '',
        city: 'Chennai',
        pincode: '600002',
        blood_group: 'B+',
        known_allergies: '',
        chronic_conditions: '',
        attending_doctor: 'Dr. Arjun Sharma, MS (Ortho)',
        notes: ''
      });
    }
    setIsFormOpen(true);
  };

  const openEditForm = (patient: Patient) => {
    setFormError('');
    setFormMode('edit');
    setFormData({ ...patient });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setFormError("Patient name is mandatory.");
      return;
    }
    if (!formData.patient_id?.trim()) {
      setFormError("Unique Patient ID / MRN is mandatory.");
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      const isCreate = formMode === 'create';
      const url = isCreate ? apiUrl('/api/patients') : apiUrl(`/api/patients/${formData.id}`);
      const method = isCreate ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to save patient profile.");
        return;
      }

      setIsFormOpen(false);
      await loadPatients(searchQuery);
      setSelectedPatient(data);
    } catch (err: any) {
      setFormError(err.message || "Network error while saving patient.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white border-2 border-orange-200 rounded-2xl w-full max-w-6xl shadow-2xl shadow-orange-950/15 h-[92vh] max-h-[760px] flex flex-col overflow-hidden">

        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-white via-orange-50/70 to-teal-50/40 border-b border-orange-200 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#C25222]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 leading-tight">Patient Profiles & Medical Records</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  {patients.length} Registered Patients
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Tamil Nadu Clinical Establishments Act 1997 & Rule 65 Statutory Registry
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={openCreateForm}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#C25222] to-orange-600 hover:from-[#a8441b] hover:to-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Register New Patient</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 bg-slate-100 hover:bg-rose-50 rounded-xl text-slate-600 hover:text-rose-600 border border-slate-200 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-orange-200">

          {/* LEFT COLUMN (5 COLS): Search & Patient Cards List */}
          <div className="lg:col-span-5 flex flex-col h-full bg-[#FFFBF7] overflow-hidden">
            
            {/* Search Input Bar */}
            <div className="p-3 border-b border-orange-200/80 bg-white flex-shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Name, MRN, Phone, S/o / W/o, or Area..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-9 pr-4 py-2 bg-orange-50/40 border border-orange-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 font-medium"
                />
                <Search className="w-4 h-4 text-orange-400 absolute left-3 top-2.5" />
              </div>
              <span className="text-[10px] text-slate-500 block mt-1.5 pl-1">
                Tip: Multiple patients with identical names are disambiguated by MRN, Guardian name & Locality.
              </span>
            </div>

            {/* Patients List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {loading ? (
                <div className="text-center py-10 text-xs text-slate-500">Loading patients database...</div>
              ) : patients.length === 0 ? (
                <div className="text-center py-12 px-4 text-slate-500 space-y-2">
                  <Users className="w-10 h-10 mx-auto text-orange-300" />
                  <span className="text-xs font-bold text-slate-600 block">No patients matched "{searchQuery}"</span>
                  <button
                    onClick={openCreateForm}
                    className="text-xs text-[#C25222] underline font-semibold"
                  >
                    Register new patient profile
                  </button>
                </div>
              ) : (
                patients.map(p => {
                  const isSelected = selectedPatient?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPatient(p)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-orange-50 border-orange-500 shadow-sm ring-1 ring-orange-400/40'
                          : 'bg-white border-slate-200 hover:border-orange-300 hover:bg-orange-50/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div>
                          <div className="flex items-center space-x-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">{p.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-bold bg-teal-50 text-teal-700 border border-teal-200">
                              {p.patient_id}
                            </span>
                            {p.is_example ? (
                              <span className="text-[8px] font-bold uppercase px-1 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                Example
                              </span>
                            ) : (
                              <span className="text-[8px] font-bold uppercase px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Clinical
                              </span>
                            )}
                          </div>
                          {p.guardian_name && (
                            <span className="text-[10px] text-slate-600 block font-medium">
                              {p.guardian_name}
                            </span>
                          )}
                        </div>

                        <span className="text-[9px] uppercase font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {p.gender} · {p.age ? `${p.age}y` : 'Adult'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-orange-100 text-[10px]">
                        <span className="text-slate-600 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-orange-500" />
                          {p.phone || 'N/A'}
                        </span>
                        <span className="text-slate-600 truncate max-w-[140px] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-teal-600" />
                          {p.address || p.city || 'Chennai'}
                        </span>
                      </div>

                      {p.known_allergies && (
                        <div className="mt-1.5 pt-1 border-t border-rose-200 text-[9px] text-rose-700 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-rose-600 flex-shrink-0" />
                          <span className="truncate font-semibold">Allergies: {p.known_allergies}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* RIGHT COLUMN (7 COLS): Selected Patient Comprehensive Dossier & History */}
          <div className="lg:col-span-7 flex flex-col h-full bg-white overflow-y-auto p-4 sm:p-5 gap-4">
            {selectedPatient ? (
              <>
                {/* Patient Summary Header Card */}
                <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C25222] to-orange-500 text-white flex items-center justify-center font-bold text-base flex-shrink-0 shadow-sm">
                      {selectedPatient.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h4 className="text-base font-bold text-slate-900">{selectedPatient.name}</h4>
                        <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {selectedPatient.patient_id}
                        </span>
                        {selectedPatient.blood_group && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            {selectedPatient.blood_group}
                          </span>
                        )}
                        {selectedPatient.is_example ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wide">
                            Demo / Example Record (Deletable)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            Clinical Record (Protected)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        {selectedPatient.guardian_name ? `${selectedPatient.guardian_name} · ` : ''}
                        {selectedPatient.age ? `${selectedPatient.age} yrs` : 'Adult'} · {selectedPatient.gender}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-2 font-mono">
                        <span>📞 {selectedPatient.phone || 'No phone recorded'}</span>
                        <span>📍 {selectedPatient.address}, {selectedPatient.city} {selectedPatient.pincode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center flex-wrap">
                    {(onSelectPatient || onSelectPatientForBilling) && (
                      <button
                        type="button"
                        onClick={() => (onSelectPatient || onSelectPatientForBilling)?.(selectedPatient)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center space-x-1"
                        title="Autofill this patient in the billing checkout screen"
                      >
                        <UserCheck className="w-3.5 h-3.5 mr-1" />
                        <span>Select for Bill</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openEditForm(selectedPatient)}
                      className="px-3 py-2 bg-white hover:bg-orange-50 text-slate-800 rounded-xl text-xs font-semibold border border-orange-200 transition-all flex items-center space-x-1"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1 text-orange-600" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteExamplePatient(selectedPatient)}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 rounded-xl text-xs font-semibold border border-rose-200 transition-all flex items-center space-x-1"
                      title="Delete patient record"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* Clinical Warnings & Ortho Context Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Allergies Card */}
                  <div className={`p-3.5 rounded-xl border ${
                    selectedPatient.known_allergies
                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 flex items-center gap-1.5 text-rose-700">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Known Drug Allergies
                    </span>
                    <p className="text-xs leading-relaxed font-medium">
                      {selectedPatient.known_allergies || 'No known drug allergies recorded.'}
                    </p>
                  </div>

                  {/* Chronic Conditions & Comorbidities */}
                  <div className="p-3.5 bg-teal-50/70 rounded-xl border border-teal-200 text-teal-950">
                    <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 flex items-center gap-1.5 text-teal-700">
                      <HeartPulse className="w-3.5 h-3.5" />
                      Chronic Orthopaedic Conditions
                    </span>
                    <p className="text-xs leading-relaxed font-medium text-slate-700">
                      {selectedPatient.chronic_conditions || 'No chronic orthopaedic conditions recorded.'}
                    </p>
                  </div>

                  <div className="p-3 bg-orange-50/40 rounded-xl border border-orange-200/80 col-span-1 sm:col-span-2 text-[11px] flex justify-between items-center text-slate-600">
                    <span>Attending Surgeon: <strong className="text-slate-900">{selectedPatient.attending_doctor || 'Dr. Arjun Sharma, MS (Ortho)'}</strong></span>
                    {selectedPatient.notes && <span>Notes: <em className="text-slate-700">{selectedPatient.notes}</em></span>}
                  </div>
                </div>

                {/* Dispensing & Prescription History */}
                <div className="flex-1 flex flex-col gap-2.5 mt-1">
                  <div className="flex items-center justify-between border-b border-orange-200 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-[#C25222]" />
                      Prescription & Dispensing History ({patientHistory.length} Encounters)
                    </span>
                    <span className="text-[10px] text-slate-500">Tamil Nadu Clinical Establishments Audit trail</span>
                  </div>

                  {loadingHistory ? (
                    <div className="text-center py-6 text-xs text-slate-500">Loading clinical history...</div>
                  ) : patientHistory.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500 border border-orange-200 rounded-xl bg-orange-50/30">
                      No previous bills or medicine dispensing history found for this patient.
                    </div>
                  ) : (
                    <div className="space-y-2.5 overflow-y-auto max-h-64 pr-1">
                      {patientHistory.map((bill, idx) => (
                        <div key={idx} className="p-3 bg-white rounded-xl border border-orange-200/80 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-slate-900">Bill #{bill.bill_number}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                bill.operating_mode === 'CLINIC_DISPENSING'
                                  ? 'bg-orange-50 text-[#C25222] border border-orange-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {bill.operating_mode === 'CLINIC_DISPENSING' ? 'Mode A: Clinic OP' : 'Mode B: Retail Rx'}
                              </span>
                              {bill.status === 'Cancelled' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  Cancelled
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-emerald-700">₹{Number(bill.grand_total).toFixed(2)}</span>
                              <span className="text-[10px] text-slate-500 block">{bill.date} {bill.time}</span>
                            </div>
                          </div>

                          {/* Line items dispensed */}
                          {bill.items && bill.items.length > 0 && (
                            <div className="pt-2 border-t border-slate-100">
                              <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Medicines Dispensed:</div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {bill.items.map((it: any, iIdx: number) => (
                                  <div key={iIdx} className="p-1.5 bg-orange-50/40 rounded border border-orange-100 text-[11px] flex justify-between items-center">
                                    <div className="truncate mr-2">
                                      <span className="font-semibold text-slate-800">{it.product_name}</span>
                                      {it.batch_number && <span className="text-[9px] text-amber-700 font-mono block">Batch: {it.batch_number}</span>}
                                    </div>
                                    <span className="font-mono text-slate-700 font-bold flex-shrink-0">x{it.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-100 font-mono">
                            <span>Doctor: {bill.doctor_name || 'Dr. Arjun Sharma'} ({bill.doctor_reg_no || 'TNMC/2012/94821'})</span>
                            <span>Pharmacist: {bill.pharmacist_name || 'Priya Nair, B.Pharm'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500">
                <Users className="w-12 h-12 text-orange-300 mb-2" />
                <span className="text-xs font-bold text-slate-600">Select a patient on the left to view profile and dispensing history.</span>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ----------------- PATIENT REGISTRATION & EDIT DRAWER / MODAL ----------------- */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white border-2 border-orange-300 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="p-4 bg-gradient-to-r from-white via-orange-50 to-amber-50/50 border-b border-orange-200 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {formMode === 'create' ? 'Register New Patient Profile' : `Edit Profile: ${formData.name}`}
                </h4>
                <p className="text-[11px] text-slate-600">
                  Compliant with Tamil Nadu Clinical Establishments Rules 2018 & EHR Standards
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-500 hover:text-rose-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs bg-white">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Unique MRN & Identification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-orange-50/70 rounded-xl border border-orange-200">
                <div>
                  <label className="text-[10px] font-bold text-[#C25222] uppercase block mb-1">Unique Patient ID / MRN *</label>
                  <input
                    type="text"
                    value={formData.patient_id}
                    onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                    disabled={formMode === 'edit'}
                    className="w-full px-3 py-1.5 bg-white border border-orange-300 rounded-lg text-[#C25222] font-mono text-xs font-bold"
                  />
                  <span className="text-[9px] text-slate-600 mt-0.5 block">Unique permanent clinical identifier</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Blood Group</label>
                  <select
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                  >
                    <option value="O+">O Positive (O+)</option>
                    <option value="A+">A Positive (A+)</option>
                    <option value="B+">B Positive (B+)</option>
                    <option value="AB+">AB Positive (AB+)</option>
                    <option value="O-">O Negative (O-)</option>
                    <option value="A-">A Negative (A-)</option>
                    <option value="B-">B Negative (B-)</option>
                    <option value="AB-">AB Negative (AB-)</option>
                  </select>
                </div>
              </div>

              {/* Name, Guardian & Demographics */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Patient Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh K"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-medium"
                    required
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Father's / Spouse's Name (S/o, W/o, D/o) *</label>
                  <input
                    type="text"
                    placeholder="e.g. S/o Krishnan V"
                    value={formData.guardian_name}
                    onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                  />
                  <span className="text-[9px] text-slate-500 mt-0.5 block">Used to disambiguate patients with identical names</span>
                </div>

                <div className="sm:col-span-4">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Age (Years)</label>
                  <input
                    type="number"
                    value={formData.age || ''}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) || null })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e: any) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    placeholder="+91 98401 XXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono"
                  />
                </div>

                <div className="sm:col-span-8">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Address / Street / Locality</label>
                  <input
                    type="text"
                    placeholder="e.g. 14, 2nd Main Road, Anna Nagar"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">City & Pincode</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Chennai"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-2/3 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="600040"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-1/3 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Clinical & Safety Notes */}
              <div className="space-y-3 pt-2 border-t border-orange-200">
                <div>
                  <label className="text-[10px] font-bold text-rose-700 uppercase block mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Known Drug Allergies (Triggers Safety Alerts at Checkout)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aspirin, Diclofenac, Penicillin, Sulfa"
                    value={formData.known_allergies}
                    onChange={(e) => setFormData({ ...formData, known_allergies: e.target.value })}
                    className="w-full px-3 py-1.5 bg-rose-50/40 border border-rose-300 rounded-lg text-rose-900 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-teal-700 uppercase block mb-1 flex items-center gap-1">
                    <HeartPulse className="w-3.5 h-3.5" />
                    Chronic Orthopaedic Conditions & Comorbidities
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Osteoarthritis of knees, Peptic ulcer disease, Type 2 DM, Hypertension"
                    value={formData.chronic_conditions}
                    onChange={(e) => setFormData({ ...formData, chronic_conditions: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Attending Orthopaedic Surgeon</label>
                    <input
                      type="text"
                      value={formData.attending_doctor}
                      onChange={(e) => setFormData({ ...formData, attending_doctor: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Clinical Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Follow-up 3 weeks for suture removal"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-orange-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-gradient-to-r from-[#C25222] to-orange-600 hover:from-[#a8441b] hover:to-orange-700 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : formMode === 'create' ? 'Save Patient Profile' : 'Update Patient Profile'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
