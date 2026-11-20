/**
 * Clinical Decision Support (CDS) & Patient Safety Rules Engine
 * Madras Ortho Clinic & Pharmacy
 *
 * Implements clinical checks mandated by:
 * - Pharmacy Practice Regulations, 2015 (Regulation 9 - Patient Counselling & Prescription Review)
 * - National Medical Commission (NMC) Professional Conduct Regulations
 * - Pharmacovigilance Programme of India (PvPI) Safety Guidelines
 */

export interface ClinicalAlert {
  id: string;
  type: 'DUPLICATE_THERAPY' | 'DRUG_INTERACTION' | 'DOSE_LIMIT' | 'CONTRAINDICATION' | 'ANTIBIOTIC_STEWARDSHIP';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  drugsInvolved: string[];
  recommendation: string;
}

export interface ClinicalCheckResult {
  hasCritical: boolean;
  hasWarning: boolean;
  alerts: ClinicalAlert[];
}

// Systemic NSAID generic identifiers
const SYSTEMIC_NSAIDS = [
  'diclofenac',
  'aceclofenac',
  'ibuprofen',
  'naproxen',
  'ketorolac',
  'piroxicam',
  'indomethacin',
  'etoricoxib',
  'celecoxib',
  'mefenamic acid',
  'meloxicam',
  'nabumetone',
  'etodolac',
  'lornoxicam'
];

// Serotonergic agents
const SEROTONERGIC_DRUGS = [
  'duloxetine',
  'sertraline',
  'fluoxetine',
  'escitalopram',
  'paroxetine',
  'venlafaxine',
  'amitriptyline'
];

// Fluoroquinolones
const FLUOROQUINOLONES = [
  'ciprofloxacin',
  'levofloxacin',
  'moxifloxacin',
  'ofloxacin',
  'norfloxacin'
];

// Anticoagulants
const ANTICOAGULANTS = [
  'warfarin',
  'enoxaparin',
  'rivaroxaban',
  'apixaban',
  'dabigatran',
  'heparin',
  'fondaparinux'
];

// Systemic Corticosteroids
const CORTICOSTEROIDS = [
  'prednisolone',
  'methylprednisolone',
  'dexamethasone',
  'betamethasone',
  'deflazacort',
  'triamcinolone',
  'hydrocortisone'
];

/**
 * Normalizes drug text to detect generic molecules
 */
function normalizeText(text: string): string {
  return String(text || '').toLowerCase().trim();
}

/**
 * Evaluates prescription items for drug-drug interactions, duplicate therapies,
 * and high-risk clinical orthopaedic contraindications.
 */
export function checkClinicalInteractions(items: any[], patientInfo?: any): ClinicalCheckResult {
  const alerts: ClinicalAlert[] = [];

  if (!items || !Array.isArray(items) || items.length === 0) {
    return { hasCritical: false, hasWarning: false, alerts: [] };
  }

  const normalizedItems = items.map(it => {
    const prodName = it.product_name || it.name || '';
    const genName = it.generic_name || '';
    const combined = `${normalizeText(prodName)} ${normalizeText(genName)}`;
    return {
      raw: it,
      name: prodName,
      text: combined,
      quantity: Number(it.quantity || 1)
    };
  });

  // 1. CHECK FOR DUPLICATE SYSTEMIC NSAID THERAPY
  const detectedNsaids = normalizedItems.filter(item => {
    // Avoid classifying purely topical formulations as systemic
    if (item.text.includes('gel') || item.text.includes('spray') || item.text.includes('ointment') || item.text.includes('patch')) {
      return false;
    }
    const cat = String(item.raw?.category || '').toLowerCase();
    const isNsaidCategory = cat === 'nsaids';
    return isNsaidCategory || SYSTEMIC_NSAIDS.some(nsaid => item.text.includes(nsaid));
  });

  if (detectedNsaids.length >= 2) {
    const names = detectedNsaids.map(n => n.name);
    alerts.push({
      id: 'DDI_DUPLICATE_NSAID',
      type: 'DUPLICATE_THERAPY',
      severity: 'WARNING',
      title: 'Duplicate Systemic NSAID Therapy Alert',
      message: `Multiple systemic NSAIDs detected simultaneously: ${names.join(', ')}.`,
      drugsInvolved: names,
      recommendation: 'Concomitant administration of multiple systemic NSAIDs does not provide additional pain relief but exponentially escalates gastrointestinal bleeding, peptic ulceration, and acute kidney injury risks. Select a single optimal NSAID agent.'
    });
  }

  // 2. CHECK FOR METHOTREXATE + NSAID INTERACTION
  const hasMethotrexate = normalizedItems.some(i => i.text.includes('methotrexate'));
  if (hasMethotrexate && detectedNsaids.length > 0) {
    const nsaidNames = detectedNsaids.map(n => n.name);
    alerts.push({
      id: 'DDI_MTX_NSAID',
      type: 'DRUG_INTERACTION',
      severity: 'CRITICAL',
      title: 'Severe Drug Interaction: Methotrexate + NSAID',
      message: `Methotrexate prescribed concurrently with NSAID (${nsaidNames.join(', ')}).`,
      drugsInvolved: ['Methotrexate', ...nsaidNames],
      recommendation: 'NSAIDs significantly decrease renal elimination of Methotrexate, causing toxic blood levels. Risk of life-threatening bone marrow suppression, severe cytopenia, and acute renal failure. Requires stringent hematological monitoring or substitution with non-NSAID analgesia.'
    });
  }

  // 3. CHECK FOR TRAMADOL / TAPENTADOL + SEROTONERGIC AGENTS
  const hasCentrallyActingOpioid = normalizedItems.filter(i => i.text.includes('tramadol') || i.text.includes('tapentadol'));
  const hasSerotonergic = normalizedItems.filter(i => SEROTONERGIC_DRUGS.some(s => i.text.includes(s)));

  if (hasCentrallyActingOpioid.length > 0 && hasSerotonergic.length > 0) {
    const opioidNames = hasCentrallyActingOpioid.map(o => o.name);
    const seroNames = hasSerotonergic.map(s => s.name);
    alerts.push({
      id: 'DDI_SEROTONIN_SYNDROME',
      type: 'DRUG_INTERACTION',
      severity: 'CRITICAL',
      title: 'Serotonin Syndrome & Seizure Risk Alert',
      message: `Combination of Centrally Acting Opioid (${opioidNames.join(', ')}) with Serotonergic Agent (${seroNames.join(', ')}).`,
      drugsInvolved: [...opioidNames, ...seroNames],
      recommendation: 'Concurrent use increases risk of Serotonin Syndrome (hyperthermia, autonomic instability, neuromuscular hyperreactivity) and lowers the seizure threshold. Monitor patient closely for tremors, myoclonus, and agitation.'
    });
  }

  // 4. CHECK FOR FLUOROQUINOLONES + NSAIDS (TENDON & CNS TOXICITY)
  const hasQuinolone = normalizedItems.filter(i => FLUOROQUINOLONES.some(q => i.text.includes(q)));
  if (hasQuinolone.length > 0 && detectedNsaids.length > 0) {
    const qNames = hasQuinolone.map(q => q.name);
    const nNames = detectedNsaids.map(n => n.name);
    alerts.push({
      id: 'DDI_QUINOLONE_NSAID',
      type: 'DRUG_INTERACTION',
      severity: 'WARNING',
      title: 'Fluoroquinolone + NSAID Interaction Alert',
      message: `Fluoroquinolone (${qNames.join(', ')}) combined with NSAID (${nNames.join(', ')}).`,
      drugsInvolved: [...qNames, ...nNames],
      recommendation: 'Concomitant administration can enhance central nervous system stimulation and convulsion risk. In orthopaedic populations, fluoroquinolones heighten risk of tendinitis and Achilles tendon rupture, especially in elderly patients.'
    });
  }

  // 5. CHECK FOR ANTICOAGULANTS + NSAIDS (HEMORRHAGE RISK)
  const hasAnticoagulant = normalizedItems.filter(i => ANTICOAGULANTS.some(a => i.text.includes(a)));
  if (hasAnticoagulant.length > 0 && detectedNsaids.length > 0) {
    const acNames = hasAnticoagulant.map(a => a.name);
    const nNames = detectedNsaids.map(n => n.name);
    alerts.push({
      id: 'DDI_ANTICOAG_NSAID',
      type: 'DRUG_INTERACTION',
      severity: 'CRITICAL',
      title: 'Major Hemorrhagic Bleeding Alert',
      message: `Anticoagulant (${acNames.join(', ')}) prescribed with NSAID (${nNames.join(', ')}).`,
      drugsInvolved: [...acNames, ...nNames],
      recommendation: 'NSAID-induced platelet dysfunction combined with therapeutic anticoagulation markedly exacerbates major gastrointestinal and systemic bleeding risks. Consider paracetamol or topical therapy.'
    });
  }

  // 6. CHECK FOR CORTICOSTEROID + NSAID (GI PEPTIC ULCERATION)
  const hasSteroid = normalizedItems.filter(i => CORTICOSTEROIDS.some(c => i.text.includes(c)));
  if (hasSteroid.length > 0 && detectedNsaids.length > 0) {
    const sNames = hasSteroid.map(s => s.name);
    const nNames = detectedNsaids.map(n => n.name);
    alerts.push({
      id: 'DDI_STEROID_NSAID',
      type: 'DRUG_INTERACTION',
      severity: 'WARNING',
      title: 'Synergistic Gastrointestinal Ulceration Alert',
      message: `Systemic Corticosteroid (${sNames.join(', ')}) co-prescribed with NSAID (${nNames.join(', ')}).`,
      drugsInvolved: [...sNames, ...nNames],
      recommendation: 'The synergistic ulcerogenic effect increases peptic ulceration and GI bleeding incidence by over 4-fold. Co-prescription of a proton pump inhibitor (e.g. Pantoprazole 40mg) is strongly recommended.'
    });
  }

  // 7. CHECK FOR BISPHOSPHONATE + ORAL CALCIUM ABSORPTION INTERACTION
  const hasBisphosphonate = normalizedItems.filter(i => i.text.includes('alendronate') || i.text.includes('risedronate') || i.text.includes('ibandronate'));
  const hasCalcium = normalizedItems.filter(i => i.text.includes('calcium'));
  if (hasBisphosphonate.length > 0 && hasCalcium.length > 0) {
    alerts.push({
      id: 'DDI_BISPHOSPHONATE_CALCIUM',
      type: 'DRUG_INTERACTION',
      severity: 'INFO',
      title: 'Bisphosphonate & Calcium Administration Timing Notice',
      message: 'Oral Calcium and Bisphosphonates prescribed together.',
      drugsInvolved: [...hasBisphosphonate.map(b => b.name), ...hasCalcium.map(c => c.name)],
      recommendation: 'Dietary calcium and calcium carbonate supplements bind bisphosphonates and completely nullify intestinal absorption. Instruct patient to take Bisphosphonate upon waking with plain water, and ingest Calcium at least 2 hours later.'
    });
  }

  // 8. CHECK MAXIMUM DAILY DOSE WARNINGS (Paracetamol & Tramadol)
  const paracetamolItems = normalizedItems.filter(i => i.text.includes('paracetamol'));
  if (paracetamolItems.length > 0) {
    // Check if combined Paracetamol products exceed standard single dispensing
    const totalPcmQty = paracetamolItems.reduce((acc, it) => acc + it.quantity, 0);
    if (totalPcmQty >= 40) {
      alerts.push({
        id: 'DOSE_PARACETAMOL_HIGH',
        type: 'DOSE_LIMIT',
        severity: 'INFO',
        title: 'Paracetamol Dosage Review Notice',
        message: 'High quantity of Paracetamol containing formulations.',
        drugsInvolved: paracetamolItems.map(p => p.name),
        recommendation: 'Ensure patient is educated that cumulative daily Paracetamol intake from all prescription and OTC sources must not exceed 4,000 mg (4g) per day to prevent hepatotoxicity.'
      });
    }
  }

  // 9. GERIATRIC PRECAUTION (Age > 65)
  if (patientInfo && patientInfo.age && Number(patientInfo.age) >= 65) {
    const hasIndomethacin = normalizedItems.some(i => i.text.includes('indomethacin'));
    if (hasIndomethacin) {
      alerts.push({
        id: 'GERIATRIC_INDOMETHACIN',
        type: 'CONTRAINDICATION',
        severity: 'WARNING',
        title: 'Geriatric High-Risk Medication Alert (Beers Criteria)',
        message: 'Indomethacin prescribed in a patient aged 65 years or older.',
        drugsInvolved: ['Indomethacin'],
        recommendation: 'Indomethacin produces the highest incidence of adverse CNS effects (confusion, dizziness, psychosis) and nephrotoxicity among NSAIDs in the elderly. Consider a safer alternative such as Paracetamol or low-dose Ibuprofen.'
      });
    }
  }

  const hasCritical = alerts.some(a => a.severity === 'CRITICAL');
  const hasWarning = alerts.some(a => a.severity === 'WARNING');

  return { hasCritical, hasWarning, alerts };
}

