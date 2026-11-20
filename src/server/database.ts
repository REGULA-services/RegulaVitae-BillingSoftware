import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getSeedProducts, OrthoProduct } from './orthoCatalog';

// Export product interface
export { OrthoProduct, getSeedProducts };

export interface BatchRecord {
  id: number;
  product_id: number;
  batch_number: string;
  mfg_date: string;
  expiry_date: string;
  mrp: number;
  purchase_price: number;
  available_stock: number;
  rack_location: string;
  status?: 'Active' | 'Quarantined' | 'Recalled';
  quarantine_reason?: string;
  quarantined_at?: string;
  created_at?: string;
}

export interface InwardStockRecord {
  id: number;
  product_id: number;
  product_name: string;
  batch_number: string;
  quantity: number;
  expiry_date: string;
  mfg_date?: string;
  purchase_price: number;
  mrp: number;
  supplier_name?: string;
  invoice_number?: string;
  received_date: string;
  received_by?: string;
  notes?: string;
  created_at?: string;
}

export interface CategoryRecord {
  id: number;
  name: string;
  description?: string;
  created_by?: string;
  created_at?: string;
}


export interface PatientRecord {
  id: number;
  patient_id: string; // Unique Medical Record Number (MRN) e.g. MOC-2026-0001
  name: string;
  age: number | null;
  gender: 'Male' | 'Female' | 'Other';
  guardian_name?: string; // Father's / Spouse's name (S/o, D/o, W/o) - Critical for Indian identity disambiguation
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
  created_at: string;
  updated_at?: string;
  is_example?: number | boolean;
}

export interface AdrRecord {
  id: number;
  report_date: string;
  patient_name: string;
  patient_age: number | null;
  patient_gender: string | null;
  suspected_drug: string;
  generic_name: string;
  batch_number: string;
  reaction_description: string;
  reaction_date: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING';
  outcome: 'RECOVERED' | 'RECOVERING' | 'NOT_RECOVERED' | 'FATAL' | 'UNKNOWN';
  reported_by: string;
  reporter_qualification: string;
  created_at: string;
}

export interface ScheduleH1Record {
  id: number;
  bill_id: number;
  bill_number: number;
  supply_date: string;
  patient_name: string;
  patient_address: string;
  patient_phone: string;
  doctor_name: string;
  doctor_address: string;
  doctor_reg_no: string;
  drug_name: string;
  generic_name: string;
  batch_number: string;
  quantity: number;
  dispensing_pharmacist: string;
  created_at: string;
}

export interface NdpsRecord {
  id: number;
  bill_id: number;
  bill_number: number;
  supply_date: string;
  patient_name: string;
  patient_address: string;
  doctor_name: string;
  doctor_reg_no: string;
  drug_name: string;
  batch_number: string;
  quantity: number;
  opening_balance: number;
  closing_balance: number;
  pharmacist_name: string;
  created_at: string;
}

export interface ColdChainLog {
  id: number;
  log_date: string;
  log_time: string;
  equipment_name: string;
  recorded_temp_c: number;
  min_temp_c: number;
  max_temp_c: number;
  status: 'Normal' | 'Excursion' | 'Warning';
  checked_by: string;
  remarks: string;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  username: string;
  action: string;
  entity_type: string;
  entity_id: string | number | null;
  previous_state: string | null;
  new_state: string | null;
  ip_address: string;
  timestamp: string;
}

// Password hashing utility with PBKDF2
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, actualSalt, 10000, 32, 'sha256').toString('hex');
  return { hash, salt: actualSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  if (!hash || !salt) return false;
  const computed = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256').toString('hex');
  return computed === hash;
}

// DB Interface
export interface DatabaseEngine {
  all<T>(query: string, params?: any[]): Promise<T[]>;
  get<T>(query: string, params?: any[]): Promise<T | undefined>;
  run(query: string, params?: any[]): Promise<{ lastID?: number; changes?: number }>;
  close(): Promise<void>;
  isFallback: boolean;
}

let dbInstance: DatabaseEngine | null = null;

// Storage paths
const userAppData = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config');
const dbDir = path.join(userAppData, "MadrasOrthoClinicPOS");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const sqlitePath = path.join(dbDir, "pharmacy_pos.db");
const jsonDbPath = path.join(dbDir, "pharmacy_pos.json");

// Pure JS Database Engine
export class JSONDatabaseEngine implements DatabaseEngine {
  isFallback = true;
  public data: {
    products: any[];
    batches: BatchRecord[];
    bills: any[];
    bill_items: any[];
    deleted_items_history: any[];
    employees: any[];
    users: any[];
    schedule_h1_register: ScheduleH1Record[];
    ndps_register: NdpsRecord[];
    cold_chain_logs: ColdChainLog[];
    audit_logs: AuditLog[];
    prescriptions: any[];
    pharmacy_licences: any[];
    adr_reports: AdrRecord[];
    patients: PatientRecord[];
    inward_stock: InwardStockRecord[];
    categories: CategoryRecord[];
  } = {
    products: [],
    batches: [],
    bills: [],
    bill_items: [],
    deleted_items_history: [],
    employees: [],
    users: [],
    schedule_h1_register: [],
    ndps_register: [],
    cold_chain_logs: [],
    audit_logs: [],
    prescriptions: [],
    pharmacy_licences: [],
    adr_reports: [],
    patients: [],
    inward_stock: [],
    categories: []
  };

  constructor() {
    this.load();
    this.seedIfNeeded();
  }

  private load() {
    if (fs.existsSync(jsonDbPath)) {
      try {
        const raw = fs.readFileSync(jsonDbPath, 'utf8');
        const parsed = JSON.parse(raw);
        this.data = {
          products: parsed.products || [],
          batches: parsed.batches || [],
          bills: parsed.bills || [],
          bill_items: parsed.bill_items || [],
          deleted_items_history: parsed.deleted_items_history || [],
          employees: parsed.employees || [],
          users: parsed.users || [],
          schedule_h1_register: parsed.schedule_h1_register || [],
          ndps_register: parsed.ndps_register || [],
          cold_chain_logs: parsed.cold_chain_logs || [],
          audit_logs: parsed.audit_logs || [],
          prescriptions: parsed.prescriptions || [],
          pharmacy_licences: parsed.pharmacy_licences || [],
          adr_reports: parsed.adr_reports || [],
          patients: parsed.patients || [],
          inward_stock: parsed.inward_stock || [],
          categories: parsed.categories || []
        };
      } catch (err) {
        console.error("Failed to parse JSON DB, starting fresh", err);
      }
    } else {
      this.save();
    }
  }

  public save() {
    fs.writeFileSync(jsonDbPath, JSON.stringify(this.data, null, 2), 'utf8');
  }

  private seedIfNeeded() {
    const defaultProducts = getSeedProducts();
    const existingByName = new Map((this.data.products || []).map(p => [(p.name || '').trim().toLowerCase(), p]));
    let maxId = (this.data.products && this.data.products.length > 0) ? Math.max(...this.data.products.map(p => p.id)) : 0;
    let addedCount = 0;
    let updatedCount = 0;

    if (!this.data.products) this.data.products = [];

    for (const dp of defaultProducts) {
      const key = (dp.name || '').trim().toLowerCase();
      const existing = existingByName.get(key);
      if (!existing) {
        maxId++;
        this.data.products.push({
          id: maxId,
          ...dp,
          is_example: 1
        });
        addedCount++;
      } else {
        // Tag pre-seeded default items as example if unset
        if (existing.is_example === undefined) {
          existing.is_example = 1;
        }
        // Enrich existing item with new regulatory metadata if missing
        if (!existing.generic_name || !existing.hsn_code || !existing.schedule) {
          existing.generic_name = dp.generic_name;
          existing.mrp = dp.mrp || existing.price * 1.15;
          existing.hsn_code = dp.hsn_code;
          existing.schedule = dp.schedule;
          existing.dosage_form = dp.dosage_form;
          existing.strength = dp.strength;
          existing.pack_size = dp.pack_size;
          existing.storage_condition = dp.storage_condition;
          existing.is_prescription_required = dp.is_prescription_required;
          existing.is_cold_chain = dp.is_cold_chain;
          updatedCount++;
        }
      }
    }

    // Seed default batches for FEFO and stock inventory if none exist
    if (!this.data.batches || this.data.batches.length < this.data.products.length) {
      if (!this.data.batches) this.data.batches = [];
      const existingBatchProdIds = new Set(this.data.batches.map(b => b.product_id));
      let batchId = this.data.batches.length > 0 ? Math.max(...this.data.batches.map(b => b.id)) : 0;
      
      const futureDate = (months: number) => {
        const d = new Date();
        d.setMonth(d.getMonth() + months);
        return d.toISOString().split('T')[0];
      };

      for (const p of this.data.products) {
        if (!existingBatchProdIds.has(p.id)) {
          batchId++;
          this.data.batches.push({
            id: batchId,
            product_id: p.id,
            batch_number: `B-${2026}-${String(p.id).padStart(4, '0')}`,
            mfg_date: '2026-01-15',
            expiry_date: futureDate(18 + (p.id % 12)), // 18 to 30 months validity
            mrp: Number(p.mrp || (p.price * 1.15).toFixed(2)),
            purchase_price: Number((p.price * 0.75).toFixed(2)),
            available_stock: 100,
            rack_location: p.is_cold_chain ? 'REFRIGERATOR-01 (Shelf A)' : `RACK-${String.fromCharCode(65 + (p.id % 6))}-${(p.id % 10) + 1}`,
            created_at: new Date().toISOString()
          });
        }
      }
    }

    // Seed compliant user roles if not present
    if (!this.data.users) this.data.users = [];
    const existingUsernames = new Set(this.data.users.map(u => u.username));
    let nextUserId = this.data.users.length > 0 ? Math.max(...this.data.users.map(u => u.id)) + 1 : 1;

    const defaultUsers = [
      {
        username: "admin",
        password_plain: "admin123",
        role: "admin",
        name: "Dr. Arjun Sharma, MS (Ortho)",
        pharmacist_reg_no: null,
        doctor_reg_no: "TNMC/2012/94821",
        phone: "+91 98400 11223"
      },
      {
        username: "employee",
        password_plain: "employee123",
        role: "employee",
        name: "Priya Nair, B.Pharm (Staff Pharmacist)",
        pharmacist_reg_no: "TNSPC/2018/48912",
        state_council: "Tamil Nadu State Pharmacy Council",
        phone: "+91 98401 22334"
      },
      {
        username: "pharmacist",
        password_plain: "pharm123",
        role: "registered_pharmacist",
        name: "Priya Nair, B.Pharm",
        pharmacist_reg_no: "TNSPC/2018/48912",
        state_council: "Tamil Nadu State Pharmacy Council",
        phone: "+91 98401 22334"
      },
      {
        username: "doctor",
        password_plain: "doc123",
        role: "doctor",
        name: "Dr. Arjun Sharma, MS (Ortho)",
        doctor_reg_no: "TNMC/2012/94821",
        council_name: "Tamil Nadu Medical Council",
        phone: "+91 98402 33445"
      },
      {
        username: "billing",
        password_plain: "bill123",
        role: "billing_operator",
        name: "Ravi Kumar (Billing Clerk)",
        pharmacist_reg_no: null,
        phone: "+91 98403 44556"
      }
    ];

    for (const du of defaultUsers) {
      if (!existingUsernames.has(du.username)) {
        const creds = hashPassword(du.password_plain);
        this.data.users.push({
          id: nextUserId++,
          username: du.username,
          password_hash: creds.hash,
          salt: creds.salt,
          role: du.role,
          name: du.name,
          pharmacist_reg_no: (du as any).pharmacist_reg_no || null,
          doctor_reg_no: (du as any).doctor_reg_no || null,
          state_council: (du as any).state_council || null,
          phone: du.phone,
          status: "Active"
        });
      }
    }

    // Upgrade any legacy users with plaintext passwords to salted PBKDF2 hashes
    for (const u of this.data.users) {
      if (u.password && (!u.password_hash || !u.salt)) {
        const creds = hashPassword(u.password);
        u.password_hash = creds.hash;
        u.salt = creds.salt;
        delete u.password;
      }
      if (u.username === 'employee') {
        u.role = 'employee';
        u.pharmacist_reg_no = 'TNSPC/2018/48912';
        u.name = 'Priya Nair, B.Pharm (Staff Pharmacist)';
        u.role_migrated = true;
      }
    }


    // Seed employees (tagged as example records)
    if (!this.data.employees || this.data.employees.length === 0) {
      this.data.employees = [
        { id: 1, name: "Dr. Arjun Sharma", role: "Orthopaedic Surgeon", phone: "+91 98402 33445", email: "arjun@madrasortho.com", salary: 85000, status: "Active", joined_date: "2025-01-15", is_example: 1 },
        { id: 2, name: "Priya Nair, B.Pharm", role: "Registered Pharmacist", phone: "+91 98401 22334", email: "priya@madrasortho.com", salary: 35000, status: "Active", joined_date: "2025-02-10", is_example: 1 },
        { id: 3, name: "Ravi Kumar", role: "Billing Clerk", phone: "+91 98403 44556", email: "ravi@madrasortho.com", salary: 22000, status: "Active", joined_date: "2025-01-20", is_example: 1 }
      ];
    } else {
      this.data.employees.forEach((emp: any) => {
        if (emp.id <= 3 && emp.is_example === undefined) {
          emp.is_example = 1;
        }
      });
    }

    // Seed Pharmacy Licences
    if (!this.data.pharmacy_licences || this.data.pharmacy_licences.length === 0) {
      this.data.pharmacy_licences = [
        {
          id: 1,
          licence_type: "Form 20 (Retail Allopathic Drugs)",
          licence_number: "20B/TN/CHE/00482",
          issuing_authority: "Drugs Control Department, Govt. of Tamil Nadu",
          valid_from: "2024-01-01",
          valid_to: "2028-12-31",
          registered_pharmacist: "Priya Nair (TNSPC/2018/48912)",
          premises_address: "Madras Ortho Clinic, 42 Anna Salai, Chennai - 600002, Tamil Nadu",
          status: "Valid"
        },
        {
          id: 2,
          licence_type: "Form 21 (Specified Schedule C & C1 Drugs)",
          licence_number: "21B/TN/CHE/00482",
          issuing_authority: "Drugs Control Department, Govt. of Tamil Nadu",
          valid_from: "2024-01-01",
          valid_to: "2028-12-31",
          registered_pharmacist: "Priya Nair (TNSPC/2018/48912)",
          premises_address: "Madras Ortho Clinic, 42 Anna Salai, Chennai - 600002, Tamil Nadu",
          status: "Valid"
        }
      ];
    }


    // Seed Patients baseline (Tamil Nadu Clinical Establishments Act & D&C Rule 65 - Demo / Example records)
    if (!this.data.patients || this.data.patients.length === 0) {
      this.data.patients = [
        {
          id: 1,
          patient_id: "MOC-2026-0001",
          name: "Ramesh K",
          age: 54,
          gender: "Male",
          guardian_name: "S/o Krishnan V",
          phone: "+91 98401 22334",
          email: "ramesh.k54@gmail.com",
          address: "No. 14, 2nd Main Road, Anna Nagar",
          city: "Chennai",
          pincode: "600040",
          blood_group: "B+",
          known_allergies: "Aspirin, Ibuprofen (Severe Gastritis)",
          chronic_conditions: "Osteoarthritis of Knees (Grade 3), Hypertension, Type 2 DM",
          attending_doctor: "Dr. Arjun Sharma, MS (Ortho)",
          notes: "Advised knee joint aspiration & visco-supplementation.",
          created_at: "2026-01-10T10:30:00.000Z",
          is_example: 1
        },
        {
          id: 2,
          patient_id: "MOC-2026-0002",
          name: "Ramesh K",
          age: 32,
          gender: "Male",
          guardian_name: "S/o Ramanathan S",
          phone: "+91 98409 88776",
          email: "ramesh.ram32@yahoo.com",
          address: "Flat 4B, Ceebros Towers, T. Nagar",
          city: "Chennai",
          pincode: "600017",
          blood_group: "O+",
          known_allergies: "None reported",
          chronic_conditions: "Acute Lumbar Sprain (Post-gym injury), L4-L5 disc protrusion",
          attending_doctor: "Dr. Arjun Sharma, MS (Ortho)",
          notes: "Lumbar support belt & muscle relaxant prescribed.",
          created_at: "2026-01-15T11:15:00.000Z",
          is_example: 1
        },
        {
          id: 3,
          patient_id: "MOC-2026-0003",
          name: "Lakshmi Narayanan",
          age: 68,
          gender: "Female",
          guardian_name: "W/o Narayanan S",
          phone: "+91 94440 55667",
          email: "lakshmi.n68@outlook.com",
          address: "28/4, North Mada Street, Mylapore",
          city: "Chennai",
          pincode: "600004",
          blood_group: "A+",
          known_allergies: "Sulfa drugs",
          chronic_conditions: "Severe Osteoporosis (T-Score -3.2), Post-Colles Fracture right wrist",
          attending_doctor: "Dr. Arjun Sharma, MS (Ortho)",
          notes: "Teriparatide daily sc injections; cold-chain biologics.",
          created_at: "2026-01-20T09:45:00.000Z",
          is_example: 1
        },
        {
          id: 4,
          patient_id: "MOC-2026-0004",
          name: "Anand Kumar S",
          age: 41,
          gender: "Male",
          guardian_name: "S/o Sundaram K",
          phone: "+91 98840 12345",
          email: "anand.kumar@gmail.com",
          address: "71, Gandhi Road, Tambaram",
          city: "Chennai",
          pincode: "600045",
          blood_group: "O+",
          known_allergies: "Penicillin",
          chronic_conditions: "Cervical Spondylosis with Radiculopathy, Gout (Hyperuricemia)",
          attending_doctor: "Dr. Arjun Sharma, MS (Ortho)",
          notes: "Febuxostat & cervical collar advised.",
          created_at: "2026-02-01T14:20:00.000Z",
          is_example: 1
        },
        {
          id: 5,
          patient_id: "MOC-2026-0005",
          name: "Priya V",
          age: 29,
          gender: "Female",
          guardian_name: "D/o Varadarajan M",
          phone: "+91 98410 99881",
          email: "priya.v29@gmail.com",
          address: "12, 1st Cross Street, Besant Nagar",
          city: "Chennai",
          pincode: "600090",
          blood_group: "B+",
          known_allergies: "None reported",
          chronic_conditions: "Right Ankle Lateral Ligament Sprain (ATFL Grade 2 tear)",
          attending_doctor: "Dr. Arjun Sharma, MS (Ortho)",
          notes: "Ankle brace application & RICE therapy.",
          created_at: "2026-02-05T16:00:00.000Z",
          is_example: 1
        }
      ];
    } else {
      this.data.patients.forEach((p: any) => {
        if (p.patient_id && ['MOC-2026-0001', 'MOC-2026-0002', 'MOC-2026-0003', 'MOC-2026-0004', 'MOC-2026-0005'].includes(p.patient_id)) {
          if (p.is_example === undefined) p.is_example = 1;
        }
      });
    }

    // Seed Cold Chain Logs baseline
    if (!this.data.cold_chain_logs || this.data.cold_chain_logs.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      this.data.cold_chain_logs = [
        {
          id: 1,
          log_date: today,
          log_time: "09:00:00",
          equipment_name: "Biologics Refrigerator R-01",
          recorded_temp_c: 4.2,
          min_temp_c: 2.0,
          max_temp_c: 8.0,
          status: "Normal",
          checked_by: "Priya Nair, B.Pharm",
          remarks: "Morning check - Temperature within standard 2°C-8°C range"
        },
        {
          id: 2,
          log_date: today,
          log_time: "17:00:00",
          equipment_name: "Biologics Refrigerator R-01",
          recorded_temp_c: 4.8,
          min_temp_c: 2.0,
          max_temp_c: 8.0,
          status: "Normal",
          checked_by: "Priya Nair, B.Pharm",
          remarks: "Evening check - Stock verified (Teriparatide, Enoxaparin, Hyaluronic Acid)"
        }
      ];
    }

    this.save();
    console.log(`[JSON DB] Seed sync completed: ${addedCount} added, ${updatedCount} enriched. Total products: ${this.data.products.length}`);
  }

  async all<T>(query: string, params: any[] = []): Promise<T[]> {
    const q = query.trim().toUpperCase().replace(/\s+/g, ' ');

    if (q.includes("GROUP BY BI.PRODUCT_NAME") || q.includes("SUM(BI.QUANTITY)")) {
      const map: Record<string, { name: string; quantity: number; total: number }> = {};
      const validBillIds = new Set(
        params.length === 1
          ? this.data.bills.filter(b => b.date === params[0] && b.status !== 'Cancelled').map(b => b.id)
          : params.length === 2
            ? this.data.bills.filter(b => b.date >= params[0] && b.date <= params[1] && b.status !== 'Cancelled').map(b => b.id)
            : this.data.bills.filter(b => b.status !== 'Cancelled').map(b => b.id)
      );

      this.data.bill_items
        .filter(bi => validBillIds.has(bi.bill_id))
        .forEach(bi => {
          if (!map[bi.product_name]) {
            map[bi.product_name] = { name: bi.product_name, quantity: 0, total: 0 };
          }
          map[bi.product_name].quantity += Number(bi.quantity);
          map[bi.product_name].total += Number(bi.total);
        });

      const results = Object.values(map).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
      return results as any[];
    }

    if (q.includes("FROM PRODUCTS")) {
      let results = [...this.data.products];
      if (q.includes("WHERE CATEGORY = ?") && params.length > 0) {
        results = results.filter(p => p.category === params[0]);
      }
      if (q.includes("WHERE SCHEDULE = ?") && params.length > 0) {
        results = results.filter(p => p.schedule === params[0]);
      }
      results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      return results as any[];
    }

    if (q.includes("FROM BATCHES")) {
      if (q.includes("WHERE PRODUCT_ID = ?") && params.length > 0) {
        const prodId = Number(params[0]);
        const batches = this.data.batches
          .filter(b => b.product_id === prodId && b.available_stock > 0)
          .sort((a, b) => (a.expiry_date || '').localeCompare(b.expiry_date || '')); // FEFO order
        return batches as any[];
      }
            if (q.includes("STATUS IN ('QUARANTINED', 'RECALLED')") || q.includes("QUARANTINED")) {
        const quarantined = this.data.batches.filter(b => b.status === 'Quarantined' || b.status === 'Recalled');
        return quarantined.map(b => {
          const p = this.data.products.find(prod => prod.id === b.product_id);
          return {
            ...b,
            product_name: p ? p.name : 'Unknown Product',
            generic_name: p ? p.generic_name : ''
          };
        }) as any[];
      }
      return [...this.data.batches] as any[];
    }

    if (q.includes("FROM SCHEDULE_H1_REGISTER")) {
      let list = [...this.data.schedule_h1_register];
      if (params.length === 1) {
        list = list.filter(r => r.supply_date === params[0]);
      } else if (params.length === 2) {
        list = list.filter(r => r.supply_date >= params[0] && r.supply_date <= params[1]);
      }
      list.sort((a, b) => (b.supply_date || '').localeCompare(a.supply_date || ''));
      return list as any[];
    }

    if (q.includes("FROM NDPS_REGISTER")) {
      let list = [...this.data.ndps_register];
      list.sort((a, b) => (b.supply_date || '').localeCompare(a.supply_date || ''));
      return list as any[];
    }

    if (q.includes("FROM COLD_CHAIN_LOGS")) {
      let list = [...this.data.cold_chain_logs];
      list.sort((a, b) => {
        const d = (b.log_date || '').localeCompare(a.log_date || '');
        return d !== 0 ? d : (b.log_time || '').localeCompare(a.log_time || '');
      });
      return list as any[];
    }

    if (q.includes("FROM AUDIT_LOGS")) {
      let list = [...this.data.audit_logs];
      list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      return list.slice(0, 200) as any[];
    }

    if (q.includes("FROM PHARMACY_LICENCES")) {
      return [...this.data.pharmacy_licences] as any[];
    }


    if (q.includes("FROM PATIENTS")) {
      let results = [...(this.data.patients || [])];
      if (q.includes("WHERE PATIENT_ID = ?") && params.length > 0) {
        results = results.filter(p => (p.patient_id || '').toLowerCase() === String(params[0]).toLowerCase());
      } else if (q.includes("WHERE ID = ?") && params.length > 0) {
        results = results.filter(p => p.id === Number(params[0]));
      }
      results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      return results as any[];
    }

    if (q.includes("FROM INWARD_STOCK")) {
      let list = [...(this.data.inward_stock || [])];
      if (params.length === 2 && q.includes("BETWEEN ? AND ?")) {
        list = list.filter(r => (r.received_date >= params[0] && r.received_date <= params[1]));
      } else if (params.length === 1 && q.includes("RECEIVED_DATE = ?")) {
        list = list.filter(r => r.received_date === params[0]);
      }
      list.sort((a, b) => (b.received_date || '').localeCompare(a.received_date || '') || (b.id - a.id));
      return list as any[];
    }

    if (q.includes("FROM CATEGORIES")) {
      return [...(this.data.categories || [])] as any[];
    }


    if (q.includes("FROM PATIENTS")) {
      if (q.includes("PATIENT_ID = ?") && params.length > 0) {
        return (this.data.patients || []).find(p => (p.patient_id || '').toLowerCase() === String(params[0]).toLowerCase()) as any;
      }
      if (q.includes("ID = ?") && params.length > 0) {
        return (this.data.patients || []).find(p => p.id === Number(params[0])) as any;
      }
      return (this.data.patients || [])[0] as any;
    }

    if (q.includes("FROM ADR_REPORTS")) {
      return [...(this.data.adr_reports || [])] as any[];
    }

    if (q.startsWith("SELECT * FROM EMPLOYEES")) {
      let results = [...this.data.employees];
      results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      return results as any[];
    }

    if (q.startsWith("SELECT * FROM USERS")) {
      return this.data.users as any[];
    }

    if (q.includes("FROM BILLS") || q.includes("FROM BILLS B")) {
      let bills = [...this.data.bills];

      if (params.length === 1) {
        bills = bills.filter(b => b.date === params[0]);
      } else if (params.length === 2) {
        bills = bills.filter(b => b.date >= params[0] && b.date <= params[1]);
      } else if (params.length > 2) {
        const yearStr = String(params[0]);
        bills = bills.filter(b => (b.date || '').startsWith(yearStr));
      }

      bills.sort((a, b) => {
        const dateDiff = (b.date || '').localeCompare(a.date || '');
        return dateDiff !== 0 ? dateDiff : (b.time || '').localeCompare(a.time || '');
      });
      return bills as any[];
    }

        if ((q.includes("FROM BILL_ITEMS BI") || q.includes("FROM BILL_ITEMS")) && q.includes("JOIN BILLS") && params.length > 0) {
      const targetBatch = String(params[0]);
      const matchedItems = this.data.bill_items.filter(bi => bi.batch_number === targetBatch);
      const results: any[] = [];
      for (const it of matchedItems) {
        const b = this.data.bills.find(bill => bill.id === it.bill_id && bill.status !== 'Cancelled');
        if (b) {
          results.push({
            bill_id: b.id,
            bill_number: b.bill_number,
            dispense_date: b.date,
            dispense_time: b.time,
            operating_mode: (b as any).operating_mode || 'RETAIL_PHARMACY',
            patient_name: b.patient_name,
            patient_phone: b.patient_phone,
            patient_address: b.patient_address,
            doctor_name: b.doctor_name,
            doctor_reg_no: b.doctor_reg_no,
            pharmacist_name: b.pharmacist_name,
            product_name: it.product_name,
            quantity: it.quantity,
            batch_number: it.batch_number,
            expiry_date: it.expiry_date
          });
        }
      }
      return results as any[];
    }

    if (q.includes("FROM BILL_ITEMS") && params.length > 0) {
      return this.data.bill_items.filter(bi => bi.bill_id === params[0]) as any[];
    }

    if (q.includes("FROM DELETED_ITEMS_HISTORY")) {
      const results = [...this.data.deleted_items_history]
        .sort((a, b) => (b.deleted_at || '').localeCompare(a.deleted_at || ''))
        .slice(0, 100);
      return results as any[];
    }

    return [] as any[];
  }

  async get<T>(query: string, params: any[] = []): Promise<T | undefined> {
    const q = query.trim().toUpperCase().replace(/\s+/g, ' ');

    if (q.includes("SELECT COUNT(*)") && q.includes("FROM PRODUCTS")) {
      return { 'count(*)': this.data.products.length } as any;
    }
    if (q.includes("SELECT COUNT(*)") && q.includes("FROM EMPLOYEES")) {
      return { 'count(*)': this.data.employees ? this.data.employees.length : 0 } as any;
    }
    if (q.includes("SELECT COUNT(*)") && q.includes("FROM USERS")) {
      return { 'count(*)': this.data.users ? this.data.users.length : 0 } as any;
    }
    if (q.includes("SELECT COUNT(*)") && q.includes("FROM SCHEDULE_H1_REGISTER")) {
      return { 'count(*)': this.data.schedule_h1_register.length } as any;
    }

    if (q.includes("FROM PRODUCTS") && q.includes("WHERE")) {
      if (params.length > 0) {
        const val = params[0];
        const found = this.data.products.find(p => p.id === val || p.name === val || p.barcode === val || p.sku === val);
        return found as any;
      }
    }

    if (q.includes("FROM USERS") && params.length > 0) {
      const found = this.data.users ? this.data.users.find((u: any) => u.username === params[0] || u.id === params[0]) : undefined;
      return found as any;
    }

    if (q.includes("FROM EMPLOYEES") && params.length > 0) {
      const val = params[0];
      const found = (this.data.employees || []).find(e => e.id === Number(val) || e.name === val);
      return found as any;
    }

    if (q.includes("FROM BILLS") && params.length > 0) {
      const found = this.data.bills.find(b => b.id === params[0]);
      return found as any;
    }

    if (q.includes("FROM BATCHES") && q.includes("WHERE ID = ?") && params.length > 0) {
      const found = this.data.batches.find(b => b.id === Number(params[0]));
      return found as any;
    }

    if (q.includes("FROM PATIENTS") && params.length > 0) {
      const val = params[0];
      const found = (this.data.patients || []).find(p => p.id === Number(val) || (p.id && String(p.id) === String(val)) || p.patient_id === String(val) || p.phone === String(val));
      return found as any;
    }

    if (q.includes("FROM CLINIC_SETTINGS")) {
      const key = params.length > 0 ? params[0] : 'clinic_details';
      const val = (this.data as any).clinic_settings ? (this.data as any).clinic_settings[key] : undefined;
      return val ? { key, value: val } as any : undefined;
    }

    if (q.includes("NEXTBILLNUMBER") || q.includes("MAX(BILL_NUMBER)")) {
      const todayStr = new Date().toISOString().split('T')[0];
      const todaysBills = this.data.bills.filter(b => (b.date || '').startsWith(todayStr));
      const maxNum = todaysBills.length > 0 ? Math.max(...todaysBills.map(b => Number(b.bill_number) || 0)) : 0;
      return { nextBillNumber: maxNum + 1 } as any;
    }

    return undefined;
  }

  async run(query: string, params: any[] = []): Promise<{ lastID?: number; changes?: number }> {
    const q = query.trim().toUpperCase().replace(/\s+/g, ' ');

    // Insert Product
    if (q.startsWith("INSERT INTO PRODUCTS")) {
      const id = this.data.products.length > 0 ? Math.max(...this.data.products.map(p => p.id)) + 1 : 1;
      const [name, category, price, barcode, sku, tax_percent, status, quantity_type, generic_name, mrp, hsn_code, schedule, dosage_form, strength, pack_size, storage_condition, is_prescription_required, is_cold_chain] = params;
      this.data.products.push({
        id,
        name,
        category,
        price: Number(price),
        barcode: barcode || null,
        sku: sku || null,
        tax_percent: Number(tax_percent || 0),
        status: status || 'Available',
        quantity_type: quantity_type || 'strip',
        generic_name: generic_name || name,
        mrp: Number(mrp || price * 1.15),
        hsn_code: hsn_code || "30049099",
        schedule: schedule || "Schedule H",
        dosage_form: dosage_form || "Tablet",
        strength: strength || "",
        pack_size: pack_size || "10 Tablets",
        storage_condition: storage_condition || "Store below 25°C in a dry place",
        is_prescription_required: is_prescription_required !== undefined ? Number(is_prescription_required) : 1,
        is_cold_chain: Number(is_cold_chain || 0),
        is_example: 0
      });
      this.save();
      return { lastID: id, changes: 1 };
    }

    // Update Product
    if (q.startsWith("UPDATE PRODUCTS SET")) {
      const idParam = params[params.length - 1];
      const idx = this.data.products.findIndex(p => p.id === Number(idParam));
      if (idx !== -1) {
        const [name, category, price, barcode, sku, tax_percent, status, quantity_type, generic_name, mrp, hsn_code, schedule, dosage_form, strength, pack_size, storage_condition, is_prescription_required, is_cold_chain] = params;
        this.data.products[idx] = {
          ...this.data.products[idx],
          name,
          category,
          price: Number(price),
          barcode,
          sku,
          tax_percent: Number(tax_percent || 0),
          status,
          quantity_type,
          generic_name: generic_name || this.data.products[idx].generic_name,
          mrp: mrp ? Number(mrp) : this.data.products[idx].mrp,
          hsn_code: hsn_code || this.data.products[idx].hsn_code,
          schedule: schedule || this.data.products[idx].schedule,
          dosage_form: dosage_form || this.data.products[idx].dosage_form,
          strength: strength !== undefined ? strength : this.data.products[idx].strength,
          pack_size: pack_size || this.data.products[idx].pack_size,
          storage_condition: storage_condition || this.data.products[idx].storage_condition,
          is_prescription_required: is_prescription_required !== undefined ? Number(is_prescription_required) : this.data.products[idx].is_prescription_required,
          is_cold_chain: is_cold_chain !== undefined ? Number(is_cold_chain) : this.data.products[idx].is_cold_chain
        };
        this.save();
        return { changes: 1 };
      }
      return { changes: 0 };
    }

    // Delete Product
    if (q.startsWith("DELETE FROM PRODUCTS WHERE ID = ?")) {
      const id = Number(params[0]);
      const before = this.data.products.length;
      this.data.products = this.data.products.filter(p => p.id !== id);
      this.save();
      return { changes: before - this.data.products.length };
    }

    // Clinic Settings Persistence
    if (q.includes("INTO CLINIC_SETTINGS")) {
      if (!(this.data as any).clinic_settings) (this.data as any).clinic_settings = {};
      const key = params.length === 2 ? params[0] : 'clinic_details';
      const val = params.length === 2 ? params[1] : params[0];
      (this.data as any).clinic_settings[key] = val;
      this.save();
      return { changes: 1 };
    }

    // Insert Employee
    if (q.startsWith("INSERT INTO EMPLOYEES")) {
      if (!this.data.employees) this.data.employees = [];
      const id = this.data.employees.length > 0 ? Math.max(...this.data.employees.map(e => e.id)) + 1 : 1;
      const [name, role, phone, email, salary, status, joined_date, qualification, reg_no] = params;
      this.data.employees.push({
        id,
        name,
        role,
        phone: phone || null,
        email: email || null,
        salary: salary !== undefined && salary !== null ? Number(salary) : null,
        status: status || 'Active',
        joined_date: joined_date || new Date().toISOString().split('T')[0],
        qualification: qualification || null,
        reg_no: reg_no || null,
        is_example: 0
      });
      this.save();
      return { lastID: id, changes: 1 };
    }

    // Update Employee
    if (q.startsWith("UPDATE EMPLOYEES SET")) {
      if (!this.data.employees) this.data.employees = [];
      const idParam = params[params.length - 1];
      const idx = this.data.employees.findIndex(e => e.id === Number(idParam));
      if (idx !== -1) {
        const [name, role, phone, email, salary, status, joined_date, qualification, reg_no] = params;
        this.data.employees[idx] = {
          ...this.data.employees[idx],
          name: name !== undefined ? name : this.data.employees[idx].name,
          role: role !== undefined ? role : this.data.employees[idx].role,
          phone: phone !== undefined ? phone : this.data.employees[idx].phone,
          email: email !== undefined ? email : this.data.employees[idx].email,
          salary: salary !== undefined && salary !== null ? Number(salary) : this.data.employees[idx].salary,
          status: status !== undefined ? status : this.data.employees[idx].status,
          joined_date: joined_date !== undefined ? joined_date : this.data.employees[idx].joined_date,
          qualification: qualification !== undefined ? qualification : this.data.employees[idx].qualification,
          reg_no: reg_no !== undefined ? reg_no : this.data.employees[idx].reg_no
        };
        this.save();
        return { changes: 1 };
      }
      return { changes: 0 };
    }

    // Delete Employee
    if (q.startsWith("DELETE FROM EMPLOYEES WHERE ID = ?")) {
      const id = Number(params[0]);
      if (!this.data.employees) this.data.employees = [];
      const before = this.data.employees.length;
      this.data.employees = this.data.employees.filter(e => e.id !== id);
      this.save();
      return { changes: before - this.data.employees.length };
    }

    // Bulk Delete Example Employees
    if (q.startsWith("DELETE FROM EMPLOYEES WHERE IS_EXAMPLE = 1")) {
      if (!this.data.employees) this.data.employees = [];
      const before = this.data.employees.length;
      this.data.employees = this.data.employees.filter((e: any) => !e.is_example);
      this.save();
      return { changes: before - this.data.employees.length };
    }

    // Delete Patient Record
    if (q.startsWith("DELETE FROM PATIENTS WHERE ID = ? OR PATIENT_ID = ?") || q.startsWith("DELETE FROM PATIENTS WHERE ID = ?")) {
      const idOrMrn = params[0];
      const mrn = params[1] || idOrMrn;
      if (!this.data.patients) this.data.patients = [];
      const before = this.data.patients.length;
      this.data.patients = this.data.patients.filter(p => p.id !== Number(idOrMrn) && p.patient_id !== String(mrn));
      this.save();
      return { changes: before - this.data.patients.length };
    }

    // Bulk Delete Example Patients
    if (q.startsWith("DELETE FROM PATIENTS WHERE IS_EXAMPLE = 1")) {
      if (!this.data.patients) this.data.patients = [];
      const before = this.data.patients.length;
      this.data.patients = this.data.patients.filter((p: any) => !p.is_example);
      this.save();
      return { changes: before - this.data.patients.length };
    }

    // Delete Bill
    if (q.startsWith("DELETE FROM BILLS WHERE ID = ?")) {
      const id = Number(params[0]);
      if (!this.data.bills) this.data.bills = [];
      const before = this.data.bills.length;
      this.data.bills = this.data.bills.filter(b => b.id !== id);
      this.save();
      return { changes: before - this.data.bills.length };
    }

    // Bulk Delete Example Bills
    if (q.startsWith("DELETE FROM BILLS WHERE IS_EXAMPLE = 1")) {
      if (!this.data.bills) this.data.bills = [];
      const before = this.data.bills.length;
      this.data.bills = this.data.bills.filter((b: any) => !b.is_example);
      this.save();
      return { changes: before - this.data.bills.length };
    }

    // Delete Bill Items
    if (q.startsWith("DELETE FROM BILL_ITEMS WHERE BILL_ID = ?")) {
      const billId = Number(params[0]);
      if (!this.data.bill_items) this.data.bill_items = [];
      const before = this.data.bill_items.length;
      this.data.bill_items = this.data.bill_items.filter(bi => bi.bill_id !== billId);
      this.save();
      return { changes: before - this.data.bill_items.length };
    }

    // Delete Batches by product ID
    if (q.startsWith("DELETE FROM BATCHES WHERE PRODUCT_ID = ?")) {
      const prodId = Number(params[0]);
      if (!this.data.batches) this.data.batches = [];
      const before = this.data.batches.length;
      this.data.batches = this.data.batches.filter(b => b.product_id !== prodId);
      this.save();
      return { changes: before - this.data.batches.length };
    }

    // Insert Bill
    if (q.startsWith("INSERT INTO BILLS")) {
      const id = this.data.bills.length > 0 ? Math.max(...this.data.bills.map(b => b.id)) + 1 : 1;
      const [
        bill_number, subtotal, discount, tax, grand_total, payment_method, date, time, cashier_name,
        patient_name, patient_age, patient_gender, patient_phone, patient_address,
        doctor_name, doctor_reg_no, doctor_clinic, pharmacist_name, pharmacist_reg_no,
        prescription_id, prescription_date, operating_mode, clinic_patient_id, dispensing_mode,
        is_complimentary, complimentary_recipient, complimentary_reason
      ] = params;

      const newBill = {
        id,
        bill_number: Number(bill_number),
        subtotal: Number(subtotal),
        discount: Number(discount),
        tax: Number(tax),
        grand_total: Number(grand_total),
        payment_method,
        date,
        time,
        cashier_name,
        patient_name: patient_name || 'Walk-in Patient',
        patient_age: patient_age || null,
        patient_gender: patient_gender || null,
        patient_phone: patient_phone || null,
        patient_address: patient_address || null,
        doctor_name: doctor_name || null,
        doctor_reg_no: doctor_reg_no || null,
        doctor_clinic: doctor_clinic || null,
        pharmacist_name: pharmacist_name || cashier_name,
        pharmacist_reg_no: pharmacist_reg_no || null,
        prescription_id: prescription_id || null,
        prescription_date: prescription_date || date,
        operating_mode: operating_mode || 'CLINIC_DISPENSING',
        clinic_patient_id: clinic_patient_id || null,
        dispensing_mode: dispensing_mode || 'DOCTOR_DIRECT',
        is_complimentary: is_complimentary !== undefined ? Number(is_complimentary) : (payment_method === 'Complimentary' ? 1 : 0),
        complimentary_recipient: complimentary_recipient || null,
        complimentary_reason: complimentary_reason || null,
        status: 'Active',
        created_at: new Date().toISOString()
      };
      this.data.bills.push(newBill);
      this.save();
      return { lastID: id, changes: 1 };
    }

    // Cancel Bill (Replaces Delete Bill for Legal Compliance)
    if (q.startsWith("UPDATE BILLS SET STATUS = 'CANCELLED'") || q.includes("STATUS = 'CANCELLED'")) {
      const id = Number(params[params.length - 1]);
      const bill = this.data.bills.find(b => b.id === id);
      if (bill) {
        bill.status = 'Cancelled';
        bill.cancellation_reason = params[0] || 'Cancelled by Pharmacist';
        bill.cancelled_by = params[1] || 'Pharmacist';
        bill.cancelled_at = new Date().toISOString();
        this.save();
        return { changes: 1 };
      }
      return { changes: 0 };
    }

    // Insert Bill Item
    if (q.startsWith("INSERT INTO BILL_ITEMS")) {
      const id = this.data.bill_items.length > 0 ? Math.max(...this.data.bill_items.map(bi => bi.id)) + 1 : 1;
      const [
        bill_id, product_id, product_name, quantity, rate, total,
        batch_number, expiry_date, hsn_code, tax_percent, cgst, sgst, dosage_instructions, schedule
      ] = params;

      const newItem = {
        id,
        bill_id: Number(bill_id),
        product_id: Number(product_id),
        product_name,
        quantity: Number(quantity),
        rate: Number(rate),
        total: Number(total),
        batch_number: batch_number || 'B-STD',
        expiry_date: expiry_date || '2028-12-31',
        hsn_code: hsn_code || '30049099',
        tax_percent: Number(tax_percent || 0),
        cgst: Number(cgst || 0),
        sgst: Number(sgst || 0),
        dosage_instructions: dosage_instructions || null,
        schedule: schedule || 'Schedule H'
      };
      this.data.bill_items.push(newItem);
      this.save();
      return { lastID: id, changes: 1 };
    }

    // Insert Schedule H1 Register
    if (q.startsWith("INSERT INTO SCHEDULE_H1_REGISTER")) {
      const id = this.data.schedule_h1_register.length > 0 ? Math.max(...this.data.schedule_h1_register.map(r => r.id)) + 1 : 1;
      const [bill_id, bill_number, supply_date, patient_name, patient_address, patient_phone, doctor_name, doctor_address, doctor_reg_no, drug_name, generic_name, batch_number, quantity, dispensing_pharmacist] = params;
      const record: ScheduleH1Record = {
        id,
        bill_id: Number(bill_id),
        bill_number: Number(bill_number),
        supply_date,
        patient_name,
        patient_address: patient_address || 'Chennai',
        patient_phone: patient_phone || 'N/A',
        doctor_name,
        doctor_address: doctor_address || 'Madras Ortho Clinic',
        doctor_reg_no,
        drug_name,
        generic_name,
        batch_number,
        quantity: Number(quantity),
        dispensing_pharmacist,
        created_at: new Date().toISOString()
      };
      this.data.schedule_h1_register.push(record);
      this.save();
      return { lastID: id, changes: 1 };
    }

    // Insert Cold Chain Log
    if (q.startsWith("INSERT INTO COLD_CHAIN_LOGS")) {
      const id = this.data.cold_chain_logs.length > 0 ? Math.max(...this.data.cold_chain_logs.map(c => c.id)) + 1 : 1;
      const [log_date, log_time, equipment_name, recorded_temp_c, min_temp_c, max_temp_c, status, checked_by, remarks] = params;
      const log: ColdChainLog = {
        id,
        log_date,
        log_time,
        equipment_name: equipment_name || 'Biologics Refrigerator R-01',
        recorded_temp_c: Number(recorded_temp_c),
        min_temp_c: Number(min_temp_c || 2.0),
        max_temp_c: Number(max_temp_c || 8.0),
        status: status || 'Normal',
        checked_by: checked_by || 'Pharmacist',
        remarks: remarks || 'Normal verification'
      };
      this.data.cold_chain_logs.push(log);
      this.save();
      return { lastID: id, changes: 1 };
    }

        // Insert Patient Record (Unique MRN & Identifiers)
    if (q.startsWith("INSERT INTO PATIENTS")) {
      if (!this.data.patients) this.data.patients = [];
      const id = this.data.patients.length > 0 ? Math.max(...this.data.patients.map(p => p.id)) : 0;
      const nextId = id + 1;
      const [
        patient_id, name, age, gender, guardian_name, phone, email, address, city, pincode, blood_group, known_allergies, chronic_conditions, attending_doctor, notes
      ] = params;

      const newPatient: PatientRecord = {
        id: nextId,
        patient_id: patient_id || `MOC-${new Date().getFullYear()}-${String(nextId).padStart(4, '0')}`,
        name: name || 'Unnamed Patient',
        age: age ? Number(age) : null,
        gender: gender || 'Other',
        guardian_name: guardian_name || '',
        phone: phone || '',
        email: email || '',
        address: address || '',
        city: city || 'Chennai',
        pincode: pincode || '',
        blood_group: blood_group || '',
        known_allergies: known_allergies || '',
        chronic_conditions: chronic_conditions || '',
        attending_doctor: attending_doctor || 'Dr. Arjun Sharma, MS (Ortho)',
        notes: notes || '',
        is_example: 0,
        created_at: new Date().toISOString()
      };
      this.data.patients.push(newPatient);
      this.save();
      return { lastID: nextId, changes: 1 };
    }

    // Update Patient Record
    if (q.startsWith("UPDATE PATIENTS")) {
      if (!this.data.patients) this.data.patients = [];
      const targetParam = params[params.length - 1];
      const p = this.data.patients.find(pt => pt.id === Number(targetParam) || pt.patient_id === String(targetParam));
      if (p) {
        const [
          name, age, gender, guardian_name, phone, email, address, city, pincode, blood_group, known_allergies, chronic_conditions, attending_doctor, notes
        ] = params;
        if (name !== undefined) p.name = name;
        if (age !== undefined) p.age = age ? Number(age) : null;
        if (gender !== undefined) p.gender = gender;
        if (guardian_name !== undefined) p.guardian_name = guardian_name;
        if (phone !== undefined) p.phone = phone;
        if (email !== undefined) p.email = email;
        if (address !== undefined) p.address = address;
        if (city !== undefined) p.city = city;
        if (pincode !== undefined) p.pincode = pincode;
        if (blood_group !== undefined) p.blood_group = blood_group;
        if (known_allergies !== undefined) p.known_allergies = known_allergies;
        if (chronic_conditions !== undefined) p.chronic_conditions = chronic_conditions;
        if (attending_doctor !== undefined) p.attending_doctor = attending_doctor;
        if (notes !== undefined) p.notes = notes;
        p.updated_at = new Date().toISOString();
        this.save();
        return { changes: 1 };
      }
      return { changes: 0 };
    }

    // Insert Batch
    if (q.startsWith("INSERT INTO BATCHES")) {
      if (!this.data.batches) this.data.batches = [];
      const id = this.data.batches.length > 0 ? Math.max(...this.data.batches.map(b => b.id)) + 1 : 1;
      const [product_id, batch_number, mfg_date, expiry_date, mrp, purchase_price, available_stock, status, quarantine_reason, quarantined_at] = params;
      const batch: BatchRecord = {
        id,
        product_id: Number(product_id),
        batch_number,
        mfg_date,
        expiry_date,
        mrp: Number(mrp),
        purchase_price: Number(purchase_price),
        available_stock: Number(available_stock),
        status: (status as any) || 'Active',
        quarantine_reason: quarantine_reason || null,
        quarantined_at: quarantined_at || null,
        rack_location: 'QUARANTINE-AREA-01',
        created_at: new Date().toISOString()
      };
      this.data.batches.push(batch);
      this.save();
      return { lastID: id, changes: 1 };
    }

    // Update Batch Status (Quarantine / Recall / Release)
    if (q.includes("UPDATE BATCHES SET STATUS =")) {
      const [status, reason, time, idOrBatch] = params;
      const b = this.data.batches.find(batch => batch.id === Number(idOrBatch) || batch.batch_number === String(idOrBatch));
      if (b) {
        b.status = status as any;
        b.quarantine_reason = reason || null;
        b.quarantined_at = time || new Date().toISOString();
        this.save();
        return { changes: 1 };
      }
      return { changes: 0 };
    }

    // Insert ADR Report (PvPI)
    if (q.startsWith("INSERT INTO ADR_REPORTS")) {
      if (!this.data.adr_reports) this.data.adr_reports = [];
      const id = this.data.adr_reports.length > 0 ? Math.max(...this.data.adr_reports.map(r => r.id)) + 1 : 1;
      const [report_date, patient_name, patient_age, patient_gender, suspected_drug, generic_name, batch_number, reaction_description, reaction_date, severity, outcome, reported_by, reporter_qualification] = params;
      const adr: AdrRecord = {
        id,
        report_date,
        patient_name,
        patient_age: patient_age ? Number(patient_age) : null,
        patient_gender: patient_gender || null,
        suspected_drug,
        generic_name,
        batch_number,
        reaction_description,
        reaction_date,
        severity: severity || 'MODERATE',
        outcome: outcome || 'RECOVERING',
        reported_by: reported_by || 'Pharmacist',
        reporter_qualification: reporter_qualification || 'B.Pharm',
        created_at: new Date().toISOString()
      };
      this.data.adr_reports.push(adr);
      this.save();
      return { lastID: id, changes: 1 };
    }

    // Insert Audit Log
    if (q.startsWith("INSERT INTO AUDIT_LOGS")) {
      const id = this.data.audit_logs.length > 0 ? Math.max(...this.data.audit_logs.map(a => a.id)) + 1 : 1;
      const [user_id, username, action, entity_type, entity_id, previous_state, new_state, ip_address] = params;
      const log: AuditLog = {
        id,
        user_id: user_id ? Number(user_id) : null,
        username: username || 'system',
        action,
        entity_type,
        entity_id: entity_id || null,
        previous_state: previous_state ? String(previous_state) : null,
        new_state: new_state ? String(new_state) : null,
        ip_address: ip_address || '127.0.0.1',
        timestamp: new Date().toISOString()
      };
      this.data.audit_logs.push(log);
      this.save();
      return { lastID: id, changes: 1 };
    }

    // Update User Password Hash
    if (q.includes("UPDATE USERS SET PASSWORD_HASH")) {
      const [hash, salt, username] = params;
      const user = this.data.users ? this.data.users.find((u: any) => u.username === username) : null;
      if (user) {
        user.password_hash = hash;
        user.salt = salt;
        delete user.password;
        this.save();
        return { changes: 1 };
      }
      return { changes: 0 };
    }

    // Insert Inward Stock (Monthly Stock Intake)
    if (q.startsWith("INSERT INTO INWARD_STOCK")) {
      if (!this.data.inward_stock) this.data.inward_stock = [];
      const id = this.data.inward_stock.length > 0 ? Math.max(...this.data.inward_stock.map(r => r.id)) + 1 : 1;
      const [
        product_id, product_name, batch_number, quantity, expiry_date, mfg_date,
        purchase_price, mrp, supplier_name, invoice_number, received_date, received_by, notes
      ] = params;

      const record: InwardStockRecord = {
        id,
        product_id: Number(product_id),
        product_name: String(product_name),
        batch_number: String(batch_number),
        quantity: Number(quantity),
        expiry_date: String(expiry_date),
        mfg_date: mfg_date ? String(mfg_date) : undefined,
        purchase_price: Number(purchase_price),
        mrp: Number(mrp),
        supplier_name: supplier_name ? String(supplier_name) : undefined,
        invoice_number: invoice_number ? String(invoice_number) : undefined,
        received_date: String(received_date || new Date().toISOString().split('T')[0]),
        received_by: received_by ? String(received_by) : 'Admin',
        notes: notes ? String(notes) : undefined,
        created_at: new Date().toISOString()
      };
      this.data.inward_stock.push(record);

      // Automatically sync and add batch inventory in FEFO batches table
      if (!this.data.batches) this.data.batches = [];
      const existingBatch = this.data.batches.find(b => b.product_id === Number(product_id) && b.batch_number === String(batch_number));
      if (existingBatch) {
        existingBatch.available_stock += Number(quantity);
        existingBatch.expiry_date = String(expiry_date);
        existingBatch.purchase_price = Number(purchase_price);
        existingBatch.mrp = Number(mrp);
      } else {
        const nextBatchId = this.data.batches.length > 0 ? Math.max(...this.data.batches.map(b => b.id)) + 1 : 1;
        this.data.batches.push({
          id: nextBatchId,
          product_id: Number(product_id),
          batch_number: String(batch_number),
          mfg_date: mfg_date || '2026-01-01',
          expiry_date: String(expiry_date),
          mrp: Number(mrp),
          purchase_price: Number(purchase_price),
          available_stock: Number(quantity),
          rack_location: 'MAIN-PHARMACY-DISPENSARY',
          status: 'Active',
          created_at: new Date().toISOString()
        });
      }
      this.save();
      return { lastID: id, changes: 1 };
    }

    // Insert Category
    if (q.startsWith("INSERT INTO CATEGORIES")) {
      if (!this.data.categories) this.data.categories = [];
      const id = this.data.categories.length > 0 ? Math.max(...this.data.categories.map(c => c.id)) + 1 : 1;
      const [name, description, created_by] = params;
      const trimmedName = String(name).trim();
      const existing = this.data.categories.find(c => c.name.toLowerCase() === trimmedName.toLowerCase());
      if (existing) {
        return { lastID: existing.id, changes: 0 };
      }
      const record: CategoryRecord = {
        id,
        name: trimmedName,
        description: description || '',
        created_by: created_by || 'admin',
        created_at: new Date().toISOString()
      };
      this.data.categories.push(record);
      this.save();
      return { lastID: id, changes: 1 };
    }

    // Delete Category
    if (q.startsWith("DELETE FROM CATEGORIES")) {
      if (!this.data.categories) this.data.categories = [];
      const target = params[0];
      const before = this.data.categories.length;
      this.data.categories = this.data.categories.filter(c => c.id !== Number(target) && c.name.toLowerCase() !== String(target).toLowerCase());
      this.save();
      return { changes: before - this.data.categories.length };
    }

    // Decrement Batch Stock (Sales / Complimentary Dispense)
    if (q.includes("UPDATE BATCHES SET AVAILABLE_STOCK = MAX(0, AVAILABLE_STOCK - ?)") || q.includes("UPDATE BATCHES SET AVAILABLE_STOCK =")) {
      if (!this.data.batches) this.data.batches = [];
      const qty = Number(params[0]);
      const target = params[1];
      let b = this.data.batches.find(bat => bat.batch_number === String(target));
      if (!b) {
        b = this.data.batches.find(bat => bat.product_id === Number(target) && bat.available_stock > 0);
      }
      if (b) {
        b.available_stock = Math.max(0, b.available_stock - qty);
        this.save();
        return { changes: 1 };
      }
      return { changes: 0 };
    }

    return { changes: 0 };
  }

  async close(): Promise<void> {
    this.save();
  }
}

// Native SQLite Database Engine
export class SQLiteDatabaseEngine implements DatabaseEngine {
  isFallback = false;
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  all<T>(query: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err: any, rows: T[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  get<T>(query: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err: any, row: T) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  run(query: string, params: any[] = []): Promise<{ lastID?: number; changes?: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function (this: any, err: any) {
        if (err) reject(err);
        else resolve({ lastID: this ? this.lastID : undefined, changes: this ? this.changes : 0 });
      });
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

// Database initialization loader
export async function getDatabase(): Promise<DatabaseEngine> {
  if (dbInstance) return dbInstance;

  try {
    console.log("Attempting to initialize SQLite database at", sqlitePath);
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database(sqlitePath);
    const nativeEngine = new SQLiteDatabaseEngine(db);

    // Create / Upgrade products table
    await nativeEngine.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        category TEXT,
        price REAL,
        barcode TEXT UNIQUE,
        sku TEXT UNIQUE,
        tax_percent REAL DEFAULT 0,
        status TEXT DEFAULT 'Available',
        quantity_type TEXT DEFAULT 'strip',
        generic_name TEXT,
        mrp REAL,
        hsn_code TEXT DEFAULT '30049099',
        schedule TEXT DEFAULT 'Schedule H',
        dosage_form TEXT DEFAULT 'Tablet',
        strength TEXT,
        pack_size TEXT,
        storage_condition TEXT DEFAULT 'Store below 25°C in a dry place',
        is_prescription_required INTEGER DEFAULT 1,
        is_cold_chain INTEGER DEFAULT 0
      )
    `);

    // Create batches table
    await nativeEngine.run(`
      CREATE TABLE IF NOT EXISTS batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        batch_number TEXT,
        mfg_date TEXT,
        expiry_date TEXT,
        mrp REAL,
        purchase_price REAL,
        available_stock REAL DEFAULT 100,
        rack_location TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Create users table
    await nativeEngine.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password_hash TEXT,
        salt TEXT,
        role TEXT,
        name TEXT,
        pharmacist_reg_no TEXT,
        doctor_reg_no TEXT,
        phone TEXT,
        status TEXT DEFAULT 'Active'
      )
    `);

    // Create bills table
    await nativeEngine.run(`
      CREATE TABLE IF NOT EXISTS bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bill_number INTEGER,
        subtotal REAL,
        discount REAL,
        tax REAL,
        grand_total REAL,
        payment_method TEXT,
        date TEXT,
        time TEXT,
        cashier_name TEXT,
        patient_name TEXT DEFAULT 'Walk-in Patient',
        patient_age INTEGER,
        patient_gender TEXT,
        patient_phone TEXT,
        patient_address TEXT,
        doctor_name TEXT,
        doctor_reg_no TEXT,
        doctor_clinic TEXT,
        pharmacist_name TEXT,
        pharmacist_reg_no TEXT,
        prescription_id TEXT,
        prescription_date TEXT,
        status TEXT DEFAULT 'Active',
        cancellation_reason TEXT,
        cancelled_by TEXT,
        cancelled_at TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create bill_items table
    await nativeEngine.run(`
      CREATE TABLE IF NOT EXISTS bill_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bill_id INTEGER,
        product_id INTEGER,
        product_name TEXT,
        quantity REAL,
        rate REAL,
        total REAL,
        batch_number TEXT,
        expiry_date TEXT,
        hsn_code TEXT,
        tax_percent REAL DEFAULT 0,
        cgst REAL DEFAULT 0,
        sgst REAL DEFAULT 0,
        dosage_instructions TEXT,
        schedule TEXT,
        FOREIGN KEY(bill_id) REFERENCES bills(id) ON DELETE CASCADE
      )
    `);

    // Create Schedule H1 Register (Mandatory Rule 65(4)(4-A))
    await nativeEngine.run(`
      CREATE TABLE IF NOT EXISTS schedule_h1_register (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bill_id INTEGER,
        bill_number INTEGER,
        supply_date TEXT,
        patient_name TEXT,
        patient_address TEXT,
        patient_phone TEXT,
        doctor_name TEXT,
        doctor_address TEXT,
        doctor_reg_no TEXT,
        drug_name TEXT,
        generic_name TEXT,
        batch_number TEXT,
        quantity REAL,
        dispensing_pharmacist TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create NDPS Register
    await nativeEngine.run(`
      CREATE TABLE IF NOT EXISTS ndps_register (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bill_id INTEGER,
        bill_number INTEGER,
        supply_date TEXT,
        patient_name TEXT,
        patient_address TEXT,
        doctor_name TEXT,
        doctor_reg_no TEXT,
        drug_name TEXT,
        batch_number TEXT,
        quantity REAL,
        opening_balance REAL,
        closing_balance REAL,
        pharmacist_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Cold Chain Temperature Log Table
    await nativeEngine.run(`
      CREATE TABLE IF NOT EXISTS cold_chain_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_date TEXT,
        log_time TEXT,
        equipment_name TEXT,
        recorded_temp_c REAL,
        min_temp_c REAL DEFAULT 2.0,
        max_temp_c REAL DEFAULT 8.0,
        status TEXT DEFAULT 'Normal',
        checked_by TEXT,
        remarks TEXT
      )
    `);

    // Create Tamper-Evident Audit Logs Table
    await nativeEngine.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NULL,
        username TEXT,
        action TEXT,
        entity_type TEXT,
        entity_id TEXT NULL,
        previous_state TEXT NULL,
        new_state TEXT NULL,
        ip_address TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);


    // Create Patients Table (TN Clinical Establishments Act & D&C Rule 65)
    await nativeEngine.run(`
      CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id TEXT UNIQUE,
        name TEXT,
        age INTEGER,
        gender TEXT,
        guardian_name TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        city TEXT DEFAULT 'Chennai',
        pincode TEXT,
        blood_group TEXT,
        known_allergies TEXT,
        chronic_conditions TEXT,
        attending_doctor TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Monthly Inward Stock Register Table
    await nativeEngine.run(`
      CREATE TABLE IF NOT EXISTS inward_stock (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        product_name TEXT,
        batch_number TEXT,
        quantity REAL,
        expiry_date TEXT,
        mfg_date TEXT,
        purchase_price REAL,
        mrp REAL,
        supplier_name TEXT,
        invoice_number TEXT,
        received_date TEXT,
        received_by TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Create Custom Categories Table
    await nativeEngine.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        description TEXT,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create ADR Reports Table (PvPI Compliance)
    await nativeEngine.run(`
      CREATE TABLE IF NOT EXISTS adr_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_date TEXT,
        patient_name TEXT,
        patient_age INTEGER,
        patient_gender TEXT,
        suspected_drug TEXT,
        generic_name TEXT,
        batch_number TEXT,
        reaction_description TEXT,
        reaction_date TEXT,
        severity TEXT DEFAULT 'MODERATE',
        outcome TEXT DEFAULT 'RECOVERING',
        reported_by TEXT,
        reporter_qualification TEXT DEFAULT 'B.Pharm',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Safe Column Migrations for Dual Operating Mode, Batch Quarantine & Example Records
    try { await nativeEngine.run("ALTER TABLE bills ADD COLUMN operating_mode TEXT DEFAULT 'CLINIC_DISPENSING'"); } catch (e) {}
    try { await nativeEngine.run("ALTER TABLE bills ADD COLUMN clinic_patient_id TEXT"); } catch (e) {}
    try { await nativeEngine.run("ALTER TABLE bills ADD COLUMN dispensing_mode TEXT DEFAULT 'DOCTOR_DIRECT'"); } catch (e) {}
    try { await nativeEngine.run("ALTER TABLE bills ADD COLUMN is_example INTEGER DEFAULT 0"); } catch (e) {}
    try { await nativeEngine.run("ALTER TABLE bills ADD COLUMN is_complimentary INTEGER DEFAULT 0"); } catch (e) {}
    try { await nativeEngine.run("ALTER TABLE bills ADD COLUMN complimentary_recipient TEXT"); } catch (e) {}
    try { await nativeEngine.run("ALTER TABLE bills ADD COLUMN complimentary_reason TEXT"); } catch (e) {}
    try { await nativeEngine.run("ALTER TABLE batches ADD COLUMN status TEXT DEFAULT 'Active'"); } catch (e) {}
    try { await nativeEngine.run("ALTER TABLE batches ADD COLUMN quarantine_reason TEXT"); } catch (e) {}
    try { await nativeEngine.run("ALTER TABLE batches ADD COLUMN quarantined_at TEXT"); } catch (e) {}
    try { await nativeEngine.run("ALTER TABLE products ADD COLUMN is_example INTEGER DEFAULT 0"); } catch (e) {}
    try { await nativeEngine.run("ALTER TABLE employees ADD COLUMN is_example INTEGER DEFAULT 0"); } catch (e) {}
    try { await nativeEngine.run("ALTER TABLE employees ADD COLUMN qualification TEXT"); } catch (e) {}
    try { await nativeEngine.run("ALTER TABLE employees ADD COLUMN reg_no TEXT"); } catch (e) {}
    try { await nativeEngine.run("ALTER TABLE patients ADD COLUMN is_example INTEGER DEFAULT 0"); } catch (e) {}

    // Tag seeded demo items as example
    try {
      await nativeEngine.run("UPDATE patients SET is_example = 1 WHERE patient_id IN ('MOC-2026-0001', 'MOC-2026-0002', 'MOC-2026-0003', 'MOC-2026-0004', 'MOC-2026-0005')");
      await nativeEngine.run("UPDATE employees SET is_example = 1 WHERE id IN (1, 2, 3)");
    } catch (e) {}

    // Create Clinic Settings Table
    await nativeEngine.run(`
      CREATE TABLE IF NOT EXISTS clinic_settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    // Create Pharmacy Licences Table
    await nativeEngine.run(`
      CREATE TABLE IF NOT EXISTS pharmacy_licences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        licence_type TEXT,
        licence_number TEXT,
        issuing_authority TEXT,
        valid_from TEXT,
        valid_to TEXT,
        registered_pharmacist TEXT,
        premises_address TEXT,
        status TEXT DEFAULT 'Valid'
      )
    `);

    await nativeEngine.run(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        role TEXT,
        phone TEXT,
        email TEXT,
        salary REAL,
        status TEXT DEFAULT 'Active',
        joined_date TEXT,
        qualification TEXT,
        reg_no TEXT
      )
    `);

    // Seed compliant default users with PBKDF2 hashes
    const usrCount = await nativeEngine.get<{ 'count(*)': number }>("SELECT count(*) FROM users");
    if (usrCount && usrCount['count(*)'] === 0) {
      const adminH = hashPassword('admin123');
      const empH = hashPassword('employee123');
      const pharmH = hashPassword('pharm123');
      const docH = hashPassword('doc123');
      const billH = hashPassword('bill123');

      await nativeEngine.run(
        `INSERT INTO users (username, password_hash, salt, role, name, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ["admin", adminH.hash, adminH.salt, "admin", "Dr. Arjun Sharma, MS (Ortho)", "+91 98400 11223", "Active"]
      );
      await nativeEngine.run(
        `INSERT INTO users (username, password_hash, salt, role, name, pharmacist_reg_no, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ["employee", empH.hash, empH.salt, "employee", "Priya Nair, B.Pharm (Pharmacist)", "TNSPC/2018/48912", "+91 98401 22334", "Active"]
      );
      await nativeEngine.run(
        `INSERT INTO users (username, password_hash, salt, role, name, pharmacist_reg_no, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ["pharmacist", pharmH.hash, pharmH.salt, "registered_pharmacist", "Priya Nair, B.Pharm", "TNSPC/2018/48912", "+91 98401 22334", "Active"]
      );
      await nativeEngine.run(
        `INSERT INTO users (username, password_hash, salt, role, name, doctor_reg_no, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ["doctor", docH.hash, docH.salt, "doctor", "Dr. Arjun Sharma, MS (Ortho)", "TNMC/2012/94821", "+91 98402 33445", "Active"]
      );
      await nativeEngine.run(
        `INSERT INTO users (username, password_hash, salt, role, name, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ["billing", billH.hash, billH.salt, "billing_operator", "Ravi Kumar (Billing Clerk)", "+91 98403 44556", "Active"]
      );
    } else {
      // Ensure 'employee' account exists in SQLite database
      try {
        const empCheck = await nativeEngine.get<any>("SELECT * FROM users WHERE username = 'employee'");
        if (!empCheck) {
          const empH = hashPassword('employee123');
          await nativeEngine.run(
            `INSERT INTO users (username, password_hash, salt, role, name, pharmacist_reg_no, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            ["employee", empH.hash, empH.salt, "employee", "Priya Nair, B.Pharm (Pharmacist)", "TNSPC/2018/48912", "+91 98401 22334", "Active"]
          );
        }
      } catch (e) {}
    }

    // Seed master catalog products
    const seeds = getSeedProducts();
    const prodCount = await nativeEngine.get<{ 'count(*)': number }>("SELECT count(*) FROM products");
    if (prodCount && prodCount['count(*)'] < seeds.length) {
      console.log(`Synchronizing comprehensive ortho pharmacy medicines database (${seeds.length} target items)...`);
      for (const p of seeds) {
        try {
          await nativeEngine.run(
            `INSERT OR IGNORE INTO products (name, category, price, barcode, sku, tax_percent, status, quantity_type, generic_name, mrp, hsn_code, schedule, dosage_form, strength, pack_size, storage_condition, is_prescription_required, is_cold_chain)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              p.name, p.category, p.price, p.barcode, p.sku, p.tax_percent, p.status, p.quantity_type,
              p.generic_name, p.mrp, p.hsn_code, p.schedule, p.dosage_form, p.strength, p.pack_size,
              p.storage_condition, p.is_prescription_required, p.is_cold_chain
            ]
          );
        } catch (e) {}
      }
    }

    console.log("SQLite Engine successfully loaded and migrated.");
    dbInstance = nativeEngine;
    return dbInstance;
  } catch (err) {
    console.warn("SQLite database driver initialization failed. Using JSON-File DB Engine fallback.", err);
    dbInstance = new JSONDatabaseEngine();
    return dbInstance;
  }
}

/**
 * Permanently wipe and reset all clinic databases, bills, items, and records from this device.
 * Restricted to administrative master authorization.
 */
export async function wipeAllData(): Promise<void> {
  const db = await getDatabase();
  try {
    await db.run("DELETE FROM bill_items");
    await db.run("DELETE FROM bills");
    await db.run("DELETE FROM deleted_items_history");
    await db.run("DELETE FROM schedule_h1_register");
    await db.run("DELETE FROM ndps_register");
    await db.run("DELETE FROM cold_chain_logs");
    await db.run("DELETE FROM audit_logs");
    await db.run("DELETE FROM batches");
    await db.run("DELETE FROM employees");
    await db.run("DELETE FROM products");
    if (fs.existsSync(jsonDbPath)) {
      try { fs.unlinkSync(jsonDbPath); } catch (e) {}
    }
    // Re-initialize database with compliant seeds
    dbInstance = null;
    await getDatabase();
    console.log("[DB] All clinic data successfully wiped and re-initialized with compliant master seeds.");
  } catch (err) {
    console.error("[DB] Failed to wipe all data:", err);
    throw err;
  }
}

