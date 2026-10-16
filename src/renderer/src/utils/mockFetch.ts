// Local Storage Database Emulator for Standalone Mobile Web / Android APK / PWA views
// Madras Ortho Clinic Pharmacy POS - Full Offline Capability

// Check if running inside Electron desktop container
const isElectron = typeof window !== 'undefined' && (window as any).electron !== undefined;

export const ORTHO_PHARMACY_PRODUCTS = [
  {
    "id": 1,
    "name": "Diclofenac Sodium 50mg Tablets (10s)",
    "category": "NSAIDs",
    "price": 28.5,
    "tax_percent": 5,
    "barcode": "8901050001",
    "sku": "DCF-50-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 2,
    "name": "Diclofenac Sodium 75mg SR Tablets (10s)",
    "category": "NSAIDs",
    "price": 45,
    "tax_percent": 5,
    "barcode": "8901050002",
    "sku": "DCF-75-SR",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 3,
    "name": "Diclofenac Sodium 100mg SR Tablets (10s)",
    "category": "NSAIDs",
    "price": 62,
    "tax_percent": 5,
    "barcode": "8901050003",
    "sku": "DCF-100-SR",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 4,
    "name": "Ibuprofen 200mg Tablets (10s)",
    "category": "NSAIDs",
    "price": 15,
    "tax_percent": 5,
    "barcode": "8901050004",
    "sku": "IBU-200-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 5,
    "name": "Ibuprofen 400mg Tablets (10s)",
    "category": "NSAIDs",
    "price": 22,
    "tax_percent": 5,
    "barcode": "8901050005",
    "sku": "IBU-400-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 6,
    "name": "Ibuprofen 600mg Tablets (10s)",
    "category": "NSAIDs",
    "price": 32,
    "tax_percent": 5,
    "barcode": "8901050006",
    "sku": "IBU-600-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 7,
    "name": "Ibuprofen 800mg Tablets (10s)",
    "category": "NSAIDs",
    "price": 48,
    "tax_percent": 5,
    "barcode": "8901050007",
    "sku": "IBU-800-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 8,
    "name": "Naproxen 250mg Tablets (10s)",
    "category": "NSAIDs",
    "price": 35,
    "tax_percent": 5,
    "barcode": "8901050008",
    "sku": "NAP-250-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 9,
    "name": "Naproxen 500mg Tablets (10s)",
    "category": "NSAIDs",
    "price": 55,
    "tax_percent": 5,
    "barcode": "8901050009",
    "sku": "NAP-500-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 10,
    "name": "Naproxen 375mg Tablets (10s)",
    "category": "NSAIDs",
    "price": 48,
    "tax_percent": 5,
    "barcode": "8901050010",
    "sku": "NAP-375-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 11,
    "name": "Etoricoxib 60mg Tablets (10s)",
    "category": "NSAIDs",
    "price": 95,
    "tax_percent": 5,
    "barcode": "8901050011",
    "sku": "ETO-60-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 12,
    "name": "Etoricoxib 90mg Tablets (10s)",
    "category": "NSAIDs",
    "price": 130,
    "tax_percent": 5,
    "barcode": "8901050012",
    "sku": "ETO-90-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 13,
    "name": "Etoricoxib 120mg Tablets (10s)",
    "category": "NSAIDs",
    "price": 165,
    "tax_percent": 5,
    "barcode": "8901050013",
    "sku": "ETO-120-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 14,
    "name": "Celecoxib 100mg Capsules (10s)",
    "category": "NSAIDs",
    "price": 85,
    "tax_percent": 5,
    "barcode": "8901050014",
    "sku": "CEL-100-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 15,
    "name": "Celecoxib 200mg Capsules (10s)",
    "category": "NSAIDs",
    "price": 140,
    "tax_percent": 5,
    "barcode": "8901050015",
    "sku": "CEL-200-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 16,
    "name": "Aceclofenac 100mg Tablets (10s)",
    "category": "NSAIDs",
    "price": 38,
    "tax_percent": 5,
    "barcode": "8901050016",
    "sku": "ACE-100-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 17,
    "name": "Aceclofenac 200mg SR Tablets (10s)",
    "category": "NSAIDs",
    "price": 65,
    "tax_percent": 5,
    "barcode": "8901050017",
    "sku": "ACE-200-SR",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 18,
    "name": "Aceclofenac + Paracetamol Tablets (10s)",
    "category": "NSAIDs",
    "price": 45,
    "tax_percent": 5,
    "barcode": "8901050018",
    "sku": "ACE-PCM-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 19,
    "name": "Piroxicam 20mg Tablets (10s)",
    "category": "NSAIDs",
    "price": 42,
    "tax_percent": 5,
    "barcode": "8901050019",
    "sku": "PIR-20-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 20,
    "name": "Piroxicam 10mg Capsules (10s)",
    "category": "NSAIDs",
    "price": 32,
    "tax_percent": 5,
    "barcode": "8901050020",
    "sku": "PIR-10-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 21,
    "name": "Meloxicam 7.5mg Tablets (10s)",
    "category": "NSAIDs",
    "price": 55,
    "tax_percent": 5,
    "barcode": "8901050021",
    "sku": "MEL-75-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 22,
    "name": "Meloxicam 15mg Tablets (10s)",
    "category": "NSAIDs",
    "price": 85,
    "tax_percent": 5,
    "barcode": "8901050022",
    "sku": "MEL-15-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 23,
    "name": "Tenoxicam 20mg Tablets (10s)",
    "category": "NSAIDs",
    "price": 72,
    "tax_percent": 5,
    "barcode": "8901050023",
    "sku": "TEN-20-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 24,
    "name": "Nimesulide 100mg Tablets (10s)",
    "category": "NSAIDs",
    "price": 28,
    "tax_percent": 5,
    "barcode": "8901050024",
    "sku": "NIM-100-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 25,
    "name": "Nimesulide 100mg Dispersible Tablets (10s)",
    "category": "NSAIDs",
    "price": 30,
    "tax_percent": 5,
    "barcode": "8901050025",
    "sku": "NIM-100-DT",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 26,
    "name": "Lornoxicam 4mg Tablets (10s)",
    "category": "NSAIDs",
    "price": 95,
    "tax_percent": 5,
    "barcode": "8901050026",
    "sku": "LRN-4-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 27,
    "name": "Lornoxicam 8mg Tablets (10s)",
    "category": "NSAIDs",
    "price": 145,
    "tax_percent": 5,
    "barcode": "8901050027",
    "sku": "LRN-8-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 28,
    "name": "Dexketoprofen 25mg Tablets (10s)",
    "category": "NSAIDs",
    "price": 88,
    "tax_percent": 5,
    "barcode": "8901050028",
    "sku": "DEX-25-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 29,
    "name": "Indomethacin 25mg Capsules (10s)",
    "category": "NSAIDs",
    "price": 35,
    "tax_percent": 5,
    "barcode": "8901050029",
    "sku": "IND-25-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 30,
    "name": "Indomethacin 50mg SR Capsules (10s)",
    "category": "NSAIDs",
    "price": 55,
    "tax_percent": 5,
    "barcode": "8901050030",
    "sku": "IND-50-SR",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 31,
    "name": "Flurbiprofen 100mg Tablets (10s)",
    "category": "NSAIDs",
    "price": 62,
    "tax_percent": 5,
    "barcode": "8901050031",
    "sku": "FLB-100-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 32,
    "name": "Ketoprofen 100mg SR Capsules (10s)",
    "category": "NSAIDs",
    "price": 78,
    "tax_percent": 5,
    "barcode": "8901050032",
    "sku": "KTP-100-SR",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 33,
    "name": "Sulindac 100mg Tablets (10s)",
    "category": "NSAIDs",
    "price": 68,
    "tax_percent": 5,
    "barcode": "8901050033",
    "sku": "SUL-100-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 34,
    "name": "Diclofenac + Misoprostol Tablets (10s)",
    "category": "NSAIDs",
    "price": 85,
    "tax_percent": 5,
    "barcode": "8901050034",
    "sku": "DCF-MIS-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 35,
    "name": "Paracetamol 500mg Tablets (10s)",
    "category": "Analgesics",
    "price": 12,
    "tax_percent": 5,
    "barcode": "8901050101",
    "sku": "PCM-500-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 36,
    "name": "Paracetamol 650mg Tablets (10s)",
    "category": "Analgesics",
    "price": 18,
    "tax_percent": 5,
    "barcode": "8901050102",
    "sku": "PCM-650-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 37,
    "name": "Paracetamol 1000mg Tablets (10s)",
    "category": "Analgesics",
    "price": 28,
    "tax_percent": 5,
    "barcode": "8901050103",
    "sku": "PCM-1000-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 38,
    "name": "Paracetamol 325mg + Tramadol 37.5mg Tablets (10s)",
    "category": "Analgesics",
    "price": 72,
    "tax_percent": 5,
    "barcode": "8901050104",
    "sku": "PCM-TRM-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 39,
    "name": "Tramadol 50mg Capsules (10s)",
    "category": "Analgesics",
    "price": 68,
    "tax_percent": 5,
    "barcode": "8901050105",
    "sku": "TRM-50-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 40,
    "name": "Tramadol 100mg SR Tablets (10s)",
    "category": "Analgesics",
    "price": 95,
    "tax_percent": 5,
    "barcode": "8901050106",
    "sku": "TRM-100-SR",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 41,
    "name": "Tramadol 200mg SR Tablets (10s)",
    "category": "Analgesics",
    "price": 155,
    "tax_percent": 5,
    "barcode": "8901050107",
    "sku": "TRM-200-SR",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 42,
    "name": "Ketorolac 10mg Tablets (10s)",
    "category": "Analgesics",
    "price": 55,
    "tax_percent": 5,
    "barcode": "8901050108",
    "sku": "KTR-10-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 43,
    "name": "Tapentadol 50mg Tablets (10s)",
    "category": "Analgesics",
    "price": 185,
    "tax_percent": 5,
    "barcode": "8901050109",
    "sku": "TAP-50-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 44,
    "name": "Tapentadol 100mg Tablets (10s)",
    "category": "Analgesics",
    "price": 285,
    "tax_percent": 5,
    "barcode": "8901050110",
    "sku": "TAP-100-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 45,
    "name": "Tapentadol 150mg SR Tablets (10s)",
    "category": "Analgesics",
    "price": 385,
    "tax_percent": 5,
    "barcode": "8901050111",
    "sku": "TAP-150-SR",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 46,
    "name": "Codeine Phosphate 30mg Tablets (10s)",
    "category": "Analgesics",
    "price": 75,
    "tax_percent": 5,
    "barcode": "8901050112",
    "sku": "COD-30-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 47,
    "name": "Buprenorphine 0.2mg Sublingual Tablets (10s)",
    "category": "Analgesics",
    "price": 185,
    "tax_percent": 5,
    "barcode": "8901050113",
    "sku": "BUP-02-SL",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 48,
    "name": "Fentanyl 25mcg/hr Patch (5 patches)",
    "category": "Analgesics",
    "price": 1250,
    "tax_percent": 5,
    "barcode": "8901050114",
    "sku": "FNT-25-PAT",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 49,
    "name": "Fentanyl 50mcg/hr Patch (5 patches)",
    "category": "Analgesics",
    "price": 1850,
    "tax_percent": 5,
    "barcode": "8901050115",
    "sku": "FNT-50-PAT",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 50,
    "name": "Morphine Sulfate 10mg Tablets (10s)",
    "category": "Analgesics",
    "price": 95,
    "tax_percent": 5,
    "barcode": "8901050116",
    "sku": "MOR-10-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 51,
    "name": "Nefopam 30mg Tablets (10s)",
    "category": "Analgesics",
    "price": 135,
    "tax_percent": 5,
    "barcode": "8901050117",
    "sku": "NEF-30-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 52,
    "name": "Aspirin 650mg Tablets (10s)",
    "category": "Analgesics",
    "price": 22,
    "tax_percent": 5,
    "barcode": "8901050118",
    "sku": "ASP-650-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 53,
    "name": "Thiocolchicoside 4mg Tablets (10s)",
    "category": "Muscle Relaxants",
    "price": 88,
    "tax_percent": 5,
    "barcode": "8901050201",
    "sku": "THC-4-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 54,
    "name": "Thiocolchicoside 8mg Tablets (10s)",
    "category": "Muscle Relaxants",
    "price": 145,
    "tax_percent": 5,
    "barcode": "8901050202",
    "sku": "THC-8-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 55,
    "name": "Thiocolchicoside 16mg Capsules (10s)",
    "category": "Muscle Relaxants",
    "price": 230,
    "tax_percent": 5,
    "barcode": "8901050203",
    "sku": "THC-16-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 56,
    "name": "Methocarbamol 500mg Tablets (10s)",
    "category": "Muscle Relaxants",
    "price": 72,
    "tax_percent": 5,
    "barcode": "8901050204",
    "sku": "MCR-500-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 57,
    "name": "Methocarbamol 750mg Tablets (10s)",
    "category": "Muscle Relaxants",
    "price": 95,
    "tax_percent": 5,
    "barcode": "8901050205",
    "sku": "MCR-750-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 58,
    "name": "Tizanidine 2mg Tablets (10s)",
    "category": "Muscle Relaxants",
    "price": 55,
    "tax_percent": 5,
    "barcode": "8901050206",
    "sku": "TZN-2-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 59,
    "name": "Tizanidine 4mg Tablets (10s)",
    "category": "Muscle Relaxants",
    "price": 85,
    "tax_percent": 5,
    "barcode": "8901050207",
    "sku": "TZN-4-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 60,
    "name": "Baclofen 10mg Tablets (10s)",
    "category": "Muscle Relaxants",
    "price": 48,
    "tax_percent": 5,
    "barcode": "8901050208",
    "sku": "BCL-10-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 61,
    "name": "Baclofen 25mg Tablets (10s)",
    "category": "Muscle Relaxants",
    "price": 95,
    "tax_percent": 5,
    "barcode": "8901050209",
    "sku": "BCL-25-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 62,
    "name": "Chlorzoxazone 250mg Tablets (10s)",
    "category": "Muscle Relaxants",
    "price": 38,
    "tax_percent": 5,
    "barcode": "8901050210",
    "sku": "CZX-250-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 63,
    "name": "Chlorzoxazone 500mg Tablets (10s)",
    "category": "Muscle Relaxants",
    "price": 55,
    "tax_percent": 5,
    "barcode": "8901050211",
    "sku": "CZX-500-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 64,
    "name": "Carisoprodol 350mg Tablets (10s)",
    "category": "Muscle Relaxants",
    "price": 65,
    "tax_percent": 5,
    "barcode": "8901050212",
    "sku": "CRS-350-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 65,
    "name": "Cyclobenzaprine 10mg Tablets (10s)",
    "category": "Muscle Relaxants",
    "price": 78,
    "tax_percent": 5,
    "barcode": "8901050213",
    "sku": "CYC-10-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 66,
    "name": "Orphenadrine 100mg SR Tablets (10s)",
    "category": "Muscle Relaxants",
    "price": 72,
    "tax_percent": 5,
    "barcode": "8901050214",
    "sku": "ORP-100-SR",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 67,
    "name": "Dantrolene 25mg Capsules (10s)",
    "category": "Muscle Relaxants",
    "price": 125,
    "tax_percent": 5,
    "barcode": "8901050215",
    "sku": "DAN-25-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 68,
    "name": "Metaxalone 800mg Tablets (10s)",
    "category": "Muscle Relaxants",
    "price": 88,
    "tax_percent": 5,
    "barcode": "8901050216",
    "sku": "MTX-800-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 69,
    "name": "Mephenesin 400mg Tablets (10s)",
    "category": "Muscle Relaxants",
    "price": 45,
    "tax_percent": 5,
    "barcode": "8901050217",
    "sku": "MPH-400-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 70,
    "name": "Thiocolchicoside + Diclofenac Tablets (10s)",
    "category": "Muscle Relaxants",
    "price": 145,
    "tax_percent": 5,
    "barcode": "8901050218",
    "sku": "THC-DCF-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 71,
    "name": "Calcium Carbonate 500mg + D3 250 IU Tablets (30s)",
    "category": "Bone Supplements",
    "price": 110,
    "tax_percent": 12,
    "barcode": "8901050301",
    "sku": "CAL-D3-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 72,
    "name": "Calcium + D3 + Magnesium Tablets (60s)",
    "category": "Bone Supplements",
    "price": 285,
    "tax_percent": 12,
    "barcode": "8901050302",
    "sku": "CAL-D3-MG-60",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 73,
    "name": "Cholecalciferol 60000 IU Capsules (4s)",
    "category": "Bone Supplements",
    "price": 115,
    "tax_percent": 12,
    "barcode": "8901050303",
    "sku": "VD3-60K-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 74,
    "name": "Cholecalciferol 1000 IU Tablets (30s)",
    "category": "Bone Supplements",
    "price": 75,
    "tax_percent": 12,
    "barcode": "8901050304",
    "sku": "VD3-1K-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 75,
    "name": "Cholecalciferol 2000 IU Tablets (30s)",
    "category": "Bone Supplements",
    "price": 98,
    "tax_percent": 12,
    "barcode": "8901050305",
    "sku": "VD3-2K-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 76,
    "name": "Vitamin D3 400 IU Tablets (30s)",
    "category": "Bone Supplements",
    "price": 85,
    "tax_percent": 12,
    "barcode": "8901050306",
    "sku": "VD3-400-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 77,
    "name": "Glucosamine Sulfate 500mg Tablets (30s)",
    "category": "Bone Supplements",
    "price": 250,
    "tax_percent": 12,
    "barcode": "8901050307",
    "sku": "GLC-500-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 78,
    "name": "Glucosamine Sulfate 750mg Tablets (30s)",
    "category": "Bone Supplements",
    "price": 295,
    "tax_percent": 12,
    "barcode": "8901050308",
    "sku": "GLC-750-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 79,
    "name": "Glucosamine 1500mg Sachets (30s)",
    "category": "Bone Supplements",
    "price": 420,
    "tax_percent": 12,
    "barcode": "8901050309",
    "sku": "GLC-1500-SAC",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 80,
    "name": "Glucosamine + Chondroitin Tablets (30s)",
    "category": "Bone Supplements",
    "price": 380,
    "tax_percent": 12,
    "barcode": "8901050310",
    "sku": "GLC-CHON-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 81,
    "name": "Chondroitin Sulfate 400mg Capsules (30s)",
    "category": "Bone Supplements",
    "price": 280,
    "tax_percent": 12,
    "barcode": "8901050311",
    "sku": "CHN-400-CAP",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 82,
    "name": "Collagen Type II 40mg Capsules (30s)",
    "category": "Bone Supplements",
    "price": 680,
    "tax_percent": 12,
    "barcode": "8901050312",
    "sku": "COL-2-40-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 83,
    "name": "Collagen + Vitamin C + Calcium Tablets (30s)",
    "category": "Bone Supplements",
    "price": 450,
    "tax_percent": 12,
    "barcode": "8901050313",
    "sku": "COL-VC-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 84,
    "name": "Methylcobalamin 500mcg Tablets (10s)",
    "category": "Bone Supplements",
    "price": 45,
    "tax_percent": 12,
    "barcode": "8901050314",
    "sku": "MCB-500-10",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 85,
    "name": "Methylcobalamin 1000mcg Tablets (10s)",
    "category": "Bone Supplements",
    "price": 75,
    "tax_percent": 12,
    "barcode": "8901050315",
    "sku": "MCB-1000-10",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 86,
    "name": "Methylcobalamin 1500mcg Tablets (10s)",
    "category": "Bone Supplements",
    "price": 95,
    "tax_percent": 12,
    "barcode": "8901050316",
    "sku": "MCB-1500-10",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 87,
    "name": "Alpha Lipoic Acid 100mg Capsules (10s)",
    "category": "Bone Supplements",
    "price": 125,
    "tax_percent": 12,
    "barcode": "8901050317",
    "sku": "ALA-100-10",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 88,
    "name": "Alpha Lipoic Acid 300mg Capsules (10s)",
    "category": "Bone Supplements",
    "price": 245,
    "tax_percent": 12,
    "barcode": "8901050318",
    "sku": "ALA-300-10",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 89,
    "name": "Rosehip Extract 40mg Tablets (30s)",
    "category": "Bone Supplements",
    "price": 520,
    "tax_percent": 12,
    "barcode": "8901050319",
    "sku": "RHE-40-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 90,
    "name": "Boswellia Serrata 400mg Capsules (30s)",
    "category": "Bone Supplements",
    "price": 350,
    "tax_percent": 12,
    "barcode": "8901050320",
    "sku": "BSW-400-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 91,
    "name": "Curcumin 500mg Capsules (30s)",
    "category": "Bone Supplements",
    "price": 320,
    "tax_percent": 12,
    "barcode": "8901050321",
    "sku": "CUR-500-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 92,
    "name": "MSM 500mg Tablets (30s)",
    "category": "Bone Supplements",
    "price": 245,
    "tax_percent": 12,
    "barcode": "8901050322",
    "sku": "MSM-500-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 93,
    "name": "Calcium Citrate 500mg Tablets (30s)",
    "category": "Bone Supplements",
    "price": 165,
    "tax_percent": 12,
    "barcode": "8901050323",
    "sku": "CAC-500-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 94,
    "name": "Calcium + Zinc + Magnesium Tablets (60s)",
    "category": "Bone Supplements",
    "price": 220,
    "tax_percent": 12,
    "barcode": "8901050324",
    "sku": "CAL-ZN-MG-60",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 95,
    "name": "Vitamin K2 100mcg Tablets (30s)",
    "category": "Bone Supplements",
    "price": 380,
    "tax_percent": 12,
    "barcode": "8901050325",
    "sku": "VK2-100-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 96,
    "name": "Prednisolone 5mg Tablets (10s)",
    "category": "Steroids",
    "price": 22,
    "tax_percent": 5,
    "barcode": "8901050401",
    "sku": "PRD-5-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 97,
    "name": "Prednisolone 10mg Tablets (10s)",
    "category": "Steroids",
    "price": 38,
    "tax_percent": 5,
    "barcode": "8901050402",
    "sku": "PRD-10-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 98,
    "name": "Prednisolone 20mg Tablets (10s)",
    "category": "Steroids",
    "price": 65,
    "tax_percent": 5,
    "barcode": "8901050403",
    "sku": "PRD-20-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 99,
    "name": "Prednisolone 40mg Tablets (10s)",
    "category": "Steroids",
    "price": 95,
    "tax_percent": 5,
    "barcode": "8901050404",
    "sku": "PRD-40-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 100,
    "name": "Methylprednisolone 4mg Tablets (10s)",
    "category": "Steroids",
    "price": 75,
    "tax_percent": 5,
    "barcode": "8901050405",
    "sku": "MPS-4-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 101,
    "name": "Methylprednisolone 8mg Tablets (10s)",
    "category": "Steroids",
    "price": 120,
    "tax_percent": 5,
    "barcode": "8901050406",
    "sku": "MPS-8-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 102,
    "name": "Methylprednisolone 16mg Tablets (10s)",
    "category": "Steroids",
    "price": 185,
    "tax_percent": 5,
    "barcode": "8901050407",
    "sku": "MPS-16-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 103,
    "name": "Dexamethasone 0.5mg Tablets (10s)",
    "category": "Steroids",
    "price": 18,
    "tax_percent": 5,
    "barcode": "8901050408",
    "sku": "DEX-05-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 104,
    "name": "Dexamethasone 1mg Tablets (10s)",
    "category": "Steroids",
    "price": 28,
    "tax_percent": 5,
    "barcode": "8901050409",
    "sku": "DEX-1-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 105,
    "name": "Dexamethasone 4mg Tablets (10s)",
    "category": "Steroids",
    "price": 65,
    "tax_percent": 5,
    "barcode": "8901050410",
    "sku": "DEX-4-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 106,
    "name": "Betamethasone 0.5mg Tablets (10s)",
    "category": "Steroids",
    "price": 32,
    "tax_percent": 5,
    "barcode": "8901050411",
    "sku": "BET-05-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 107,
    "name": "Hydrocortisone 10mg Tablets (10s)",
    "category": "Steroids",
    "price": 45,
    "tax_percent": 5,
    "barcode": "8901050412",
    "sku": "HYD-10-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 108,
    "name": "Alendronate 10mg Tablets (14s)",
    "category": "Osteoporosis",
    "price": 85,
    "tax_percent": 5,
    "barcode": "8901050501",
    "sku": "ALD-10-14",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 109,
    "name": "Alendronate 70mg Tablets (4s)",
    "category": "Osteoporosis",
    "price": 165,
    "tax_percent": 5,
    "barcode": "8901050502",
    "sku": "ALD-70-4",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 110,
    "name": "Risedronate 5mg Tablets (28s)",
    "category": "Osteoporosis",
    "price": 148,
    "tax_percent": 5,
    "barcode": "8901050503",
    "sku": "RIS-5-28",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 111,
    "name": "Risedronate 35mg Tablets (4s)",
    "category": "Osteoporosis",
    "price": 195,
    "tax_percent": 5,
    "barcode": "8901050504",
    "sku": "RIS-35-4",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 112,
    "name": "Risedronate 75mg Tablets (2s)",
    "category": "Osteoporosis",
    "price": 210,
    "tax_percent": 5,
    "barcode": "8901050505",
    "sku": "RIS-75-2",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 113,
    "name": "Zoledronic Acid 5mg/100mL Infusion",
    "category": "Osteoporosis",
    "price": 3800,
    "tax_percent": 5,
    "barcode": "8901050506",
    "sku": "ZOL-5-INF",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 114,
    "name": "Calcitonin Nasal Spray 200 IU",
    "category": "Osteoporosis",
    "price": 485,
    "tax_percent": 5,
    "barcode": "8901050507",
    "sku": "CLT-NSP-200",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 115,
    "name": "Teriparatide 20mcg/dose Pen (2.4mL)",
    "category": "Osteoporosis",
    "price": 8500,
    "tax_percent": 5,
    "barcode": "8901050508",
    "sku": "TPT-PEN-24",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 116,
    "name": "Strontium Ranelate 2g Granules (28 sachets)",
    "category": "Osteoporosis",
    "price": 950,
    "tax_percent": 5,
    "barcode": "8901050509",
    "sku": "STR-2G-28",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 117,
    "name": "Denosumab 60mg/mL Injection (1mL)",
    "category": "Osteoporosis",
    "price": 18500,
    "tax_percent": 5,
    "barcode": "8901050510",
    "sku": "DEN-60-INJ",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 118,
    "name": "Ibandronate 150mg Tablets (1s)",
    "category": "Osteoporosis",
    "price": 285,
    "tax_percent": 5,
    "barcode": "8901050511",
    "sku": "IBA-150-1",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 119,
    "name": "Alendronate + Cholecalciferol Tablets (4s)",
    "category": "Osteoporosis",
    "price": 220,
    "tax_percent": 5,
    "barcode": "8901050512",
    "sku": "ALD-VD3-4",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 120,
    "name": "Diclofenac Gel 1% 30g",
    "category": "Topicals",
    "price": 65,
    "tax_percent": 5,
    "barcode": "8901050601",
    "sku": "DCF-GEL-30",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 121,
    "name": "Diclofenac Gel 1% 100g",
    "category": "Topicals",
    "price": 165,
    "tax_percent": 5,
    "barcode": "8901050602",
    "sku": "DCF-GEL-100",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 122,
    "name": "Diclofenac Diethylamine 1.16% Gel 30g",
    "category": "Topicals",
    "price": 95,
    "tax_percent": 5,
    "barcode": "8901050603",
    "sku": "DCF-DE-GEL-30",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 123,
    "name": "Ketoprofen Gel 2.5% 50g",
    "category": "Topicals",
    "price": 120,
    "tax_percent": 5,
    "barcode": "8901050604",
    "sku": "KPF-GEL-50",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 124,
    "name": "Piroxicam Gel 0.5% 30g",
    "category": "Topicals",
    "price": 85,
    "tax_percent": 5,
    "barcode": "8901050605",
    "sku": "PIR-GEL-30",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 125,
    "name": "Capsaicin Cream 0.025% 30g",
    "category": "Topicals",
    "price": 145,
    "tax_percent": 5,
    "barcode": "8901050606",
    "sku": "CAP-CRM-30",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 126,
    "name": "Capsaicin Cream 0.075% 30g",
    "category": "Topicals",
    "price": 220,
    "tax_percent": 5,
    "barcode": "8901050607",
    "sku": "CAP-075-30",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 127,
    "name": "Methylsalicylate + Menthol Liniment 60mL",
    "category": "Topicals",
    "price": 75,
    "tax_percent": 5,
    "barcode": "8901050608",
    "sku": "MSL-MNT-60",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 128,
    "name": "Diclofenac + Methyl Salicylate Gel 30g",
    "category": "Topicals",
    "price": 95,
    "tax_percent": 5,
    "barcode": "8901050609",
    "sku": "DCF-MS-GEL-30",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 129,
    "name": "Voltaren Emulgel 100g",
    "category": "Topicals",
    "price": 285,
    "tax_percent": 5,
    "barcode": "8901050610",
    "sku": "VLT-GEL-100",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 130,
    "name": "Volini Pain Relief Spray 100g",
    "category": "Topicals",
    "price": 185,
    "tax_percent": 5,
    "barcode": "8901050611",
    "sku": "VOL-SPY-100",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 131,
    "name": "Moov Pain Relief Cream 50g",
    "category": "Topicals",
    "price": 98,
    "tax_percent": 5,
    "barcode": "8901050612",
    "sku": "MOV-CRM-50",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 132,
    "name": "Ibuprofen Gel 5% 30g",
    "category": "Topicals",
    "price": 85,
    "tax_percent": 5,
    "barcode": "8901050613",
    "sku": "IBU-GEL-30",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 133,
    "name": "Nimesulide Gel 1% 30g",
    "category": "Topicals",
    "price": 55,
    "tax_percent": 5,
    "barcode": "8901050614",
    "sku": "NIM-GEL-30",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 134,
    "name": "Lornoxicam Gel 30g",
    "category": "Topicals",
    "price": 120,
    "tax_percent": 5,
    "barcode": "8901050615",
    "sku": "LRN-GEL-30",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 135,
    "name": "Methyl Salicylate 15% Cream 60g",
    "category": "Topicals",
    "price": 65,
    "tax_percent": 5,
    "barcode": "8901050616",
    "sku": "MSL-CRM-60",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 136,
    "name": "Camphor + Menthol Balm 50g",
    "category": "Topicals",
    "price": 58,
    "tax_percent": 5,
    "barcode": "8901050617",
    "sku": "CAM-MNT-50",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 137,
    "name": "Omega-3 + Glucosamine Cream 75g",
    "category": "Topicals",
    "price": 165,
    "tax_percent": 5,
    "barcode": "8901050618",
    "sku": "OMG-GLC-CRM",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 138,
    "name": "Diclofenac 3% Topical Solution 60mL",
    "category": "Topicals",
    "price": 280,
    "tax_percent": 5,
    "barcode": "8901050619",
    "sku": "DCF-3-SOL",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 139,
    "name": "Knee Cap (Small)",
    "category": "Ortho Supports",
    "price": 250,
    "tax_percent": 12,
    "barcode": "8901050700",
    "sku": "KNC-CAP-S",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 140,
    "name": "Knee Cap (Medium)",
    "category": "Ortho Supports",
    "price": 280,
    "tax_percent": 12,
    "barcode": "8901050701",
    "sku": "KNC-CAP-M",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 141,
    "name": "Knee Cap (Large)",
    "category": "Ortho Supports",
    "price": 280,
    "tax_percent": 12,
    "barcode": "8901050702",
    "sku": "KNC-CAP-L",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 142,
    "name": "Knee Cap (XL)",
    "category": "Ortho Supports",
    "price": 310,
    "tax_percent": 12,
    "barcode": "8901050703",
    "sku": "KNC-CAP-XL",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 143,
    "name": "Hinged Knee Brace (Medium)",
    "category": "Ortho Supports",
    "price": 1800,
    "tax_percent": 12,
    "barcode": "8901050704",
    "sku": "HNG-KNE-M",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 144,
    "name": "Hinged Knee Brace (Large)",
    "category": "Ortho Supports",
    "price": 1800,
    "tax_percent": 12,
    "barcode": "8901050705",
    "sku": "HNG-KNE-L",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 145,
    "name": "OA Knee Unloader Brace (Medium)",
    "category": "Ortho Supports",
    "price": 4500,
    "tax_percent": 12,
    "barcode": "8901050706",
    "sku": "OAK-BRC-M",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 146,
    "name": "Lumbosacral Corset (Small)",
    "category": "Ortho Supports",
    "price": 700,
    "tax_percent": 12,
    "barcode": "8901050707",
    "sku": "LSC-SML",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 147,
    "name": "Lumbosacral Corset (Medium)",
    "category": "Ortho Supports",
    "price": 750,
    "tax_percent": 12,
    "barcode": "8901050708",
    "sku": "LSC-MED",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 148,
    "name": "Lumbosacral Corset (Large)",
    "category": "Ortho Supports",
    "price": 750,
    "tax_percent": 12,
    "barcode": "8901050709",
    "sku": "LSC-LGE",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 149,
    "name": "Lumbosacral Corset (XL)",
    "category": "Ortho Supports",
    "price": 820,
    "tax_percent": 12,
    "barcode": "8901050710",
    "sku": "LSC-XL",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 150,
    "name": "TLSO Thoracolumbar Brace",
    "category": "Ortho Supports",
    "price": 2800,
    "tax_percent": 12,
    "barcode": "8901050711",
    "sku": "TLS-BRC",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 151,
    "name": "Cervical Collar (Standard)",
    "category": "Ortho Supports",
    "price": 320,
    "tax_percent": 12,
    "barcode": "8901050712",
    "sku": "CVC-STD",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 152,
    "name": "Cervical Collar (Philadelphia Type)",
    "category": "Ortho Supports",
    "price": 850,
    "tax_percent": 12,
    "barcode": "8901050713",
    "sku": "CVC-PHI",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 153,
    "name": "Wrist Splint (Left)",
    "category": "Ortho Supports",
    "price": 380,
    "tax_percent": 12,
    "barcode": "8901050714",
    "sku": "WRS-SPL-L",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 154,
    "name": "Wrist Splint (Right)",
    "category": "Ortho Supports",
    "price": 380,
    "tax_percent": 12,
    "barcode": "8901050715",
    "sku": "WRS-SPL-R",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 155,
    "name": "Ankle Brace (Small)",
    "category": "Ortho Supports",
    "price": 390,
    "tax_percent": 12,
    "barcode": "8901050716",
    "sku": "ANK-BRC-S",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 156,
    "name": "Ankle Brace (Medium)",
    "category": "Ortho Supports",
    "price": 420,
    "tax_percent": 12,
    "barcode": "8901050717",
    "sku": "ANK-BRC-M",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 157,
    "name": "Ankle Brace (Large)",
    "category": "Ortho Supports",
    "price": 420,
    "tax_percent": 12,
    "barcode": "8901050718",
    "sku": "ANK-BRC-L",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 158,
    "name": "Elbow Support (One Size)",
    "category": "Ortho Supports",
    "price": 250,
    "tax_percent": 12,
    "barcode": "8901050719",
    "sku": "ELB-SUP",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 159,
    "name": "Tennis Elbow Brace (One Size)",
    "category": "Ortho Supports",
    "price": 350,
    "tax_percent": 12,
    "barcode": "8901050720",
    "sku": "TEN-ELB-BRC",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 160,
    "name": "Shoulder Immobilizer (Small)",
    "category": "Ortho Supports",
    "price": 580,
    "tax_percent": 12,
    "barcode": "8901050721",
    "sku": "SHD-IMM-S",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 161,
    "name": "Shoulder Immobilizer (Medium)",
    "category": "Ortho Supports",
    "price": 650,
    "tax_percent": 12,
    "barcode": "8901050722",
    "sku": "SHD-IMM-M",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 162,
    "name": "Shoulder Immobilizer (Large)",
    "category": "Ortho Supports",
    "price": 650,
    "tax_percent": 12,
    "barcode": "8901050723",
    "sku": "SHD-IMM-L",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 163,
    "name": "Thumb Spica Splint (Left)",
    "category": "Ortho Supports",
    "price": 290,
    "tax_percent": 12,
    "barcode": "8901050724",
    "sku": "THB-SPC-L",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 164,
    "name": "Thumb Spica Splint (Right)",
    "category": "Ortho Supports",
    "price": 290,
    "tax_percent": 12,
    "barcode": "8901050725",
    "sku": "THB-SPC-R",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 165,
    "name": "Heel Cup (Pair)",
    "category": "Ortho Supports",
    "price": 180,
    "tax_percent": 12,
    "barcode": "8901050726",
    "sku": "HEL-CUP-PR",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 166,
    "name": "Arch Support Insoles (Small)",
    "category": "Ortho Supports",
    "price": 320,
    "tax_percent": 12,
    "barcode": "8901050727",
    "sku": "ARC-INS-S",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 167,
    "name": "Arch Support Insoles (Large)",
    "category": "Ortho Supports",
    "price": 350,
    "tax_percent": 12,
    "barcode": "8901050728",
    "sku": "ARC-INS-L",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 168,
    "name": "Metatarsal Pad (Pair)",
    "category": "Ortho Supports",
    "price": 150,
    "tax_percent": 12,
    "barcode": "8901050729",
    "sku": "MET-PAD-PR",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 169,
    "name": "Plantar Fasciitis Night Splint",
    "category": "Ortho Supports",
    "price": 850,
    "tax_percent": 12,
    "barcode": "8901050730",
    "sku": "PLF-NSP",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 170,
    "name": "Walking Stick (Adjustable Aluminium)",
    "category": "Ortho Supports",
    "price": 350,
    "tax_percent": 12,
    "barcode": "8901050731",
    "sku": "WLK-STK-ADJ",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 171,
    "name": "Walker / Walking Frame (Foldable)",
    "category": "Ortho Supports",
    "price": 1100,
    "tax_percent": 12,
    "barcode": "8901050732",
    "sku": "WLK-FRM-FLD",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 172,
    "name": "Forearm Crutch (Pair, Adjustable)",
    "category": "Ortho Supports",
    "price": 850,
    "tax_percent": 12,
    "barcode": "8901050733",
    "sku": "CRT-FARM-PR",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 173,
    "name": "Axillary Crutch (Pair, Wooden)",
    "category": "Ortho Supports",
    "price": 480,
    "tax_percent": 12,
    "barcode": "8901050734",
    "sku": "CRT-AXL-PR",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 174,
    "name": "Knee Immobilizer 24 inch",
    "category": "Ortho Supports",
    "price": 680,
    "tax_percent": 12,
    "barcode": "8901050735",
    "sku": "KNE-IMM-24",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 175,
    "name": "Clavicle Brace (Figure-8 Type)",
    "category": "Ortho Supports",
    "price": 420,
    "tax_percent": 12,
    "barcode": "8901050736",
    "sku": "CLV-BRC-F8",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 176,
    "name": "Sacroiliac Belt (One Size)",
    "category": "Ortho Supports",
    "price": 580,
    "tax_percent": 12,
    "barcode": "8901050737",
    "sku": "SCI-BLT",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 177,
    "name": "Posture Corrector (One Size)",
    "category": "Ortho Supports",
    "price": 650,
    "tax_percent": 12,
    "barcode": "8901050738",
    "sku": "PST-COR",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 178,
    "name": "Back Cushion / Lumbar Roll",
    "category": "Ortho Supports",
    "price": 420,
    "tax_percent": 12,
    "barcode": "8901050739",
    "sku": "LMB-CUS",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 179,
    "name": "Donut Pillow / Coccyx Cushion",
    "category": "Ortho Supports",
    "price": 380,
    "tax_percent": 12,
    "barcode": "8901050740",
    "sku": "COC-CUS",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 180,
    "name": "TENS Electrode Pads (4 pads)",
    "category": "Physiotherapy",
    "price": 180,
    "tax_percent": 12,
    "barcode": "8901050801",
    "sku": "TENS-PAD-4",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 181,
    "name": "TENS Electrode Pads (8 pads)",
    "category": "Physiotherapy",
    "price": 320,
    "tax_percent": 12,
    "barcode": "8901050802",
    "sku": "TENS-PAD-8",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 182,
    "name": "Ultrasound Gel 250mL",
    "category": "Physiotherapy",
    "price": 95,
    "tax_percent": 12,
    "barcode": "8901050803",
    "sku": "USG-GEL-250",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 183,
    "name": "Ultrasound Gel 500mL",
    "category": "Physiotherapy",
    "price": 165,
    "tax_percent": 12,
    "barcode": "8901050804",
    "sku": "USG-GEL-500",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 184,
    "name": "Hot Water Bag (1.5L)",
    "category": "Physiotherapy",
    "price": 185,
    "tax_percent": 12,
    "barcode": "8901050805",
    "sku": "HWB-15L",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 185,
    "name": "Hot Water Bag (2L)",
    "category": "Physiotherapy",
    "price": 220,
    "tax_percent": 12,
    "barcode": "8901050806",
    "sku": "HWB-2L",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 186,
    "name": "Ice Gel Pack (Reusable, Small)",
    "category": "Physiotherapy",
    "price": 145,
    "tax_percent": 12,
    "barcode": "8901050807",
    "sku": "ICE-GLP-S",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 187,
    "name": "Ice Gel Pack (Reusable, Large)",
    "category": "Physiotherapy",
    "price": 220,
    "tax_percent": 12,
    "barcode": "8901050808",
    "sku": "ICE-GLP-L",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 188,
    "name": "Resistance Band (Light)",
    "category": "Physiotherapy",
    "price": 95,
    "tax_percent": 12,
    "barcode": "8901050809",
    "sku": "RES-BND-LT",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 189,
    "name": "Resistance Band (Medium)",
    "category": "Physiotherapy",
    "price": 145,
    "tax_percent": 12,
    "barcode": "8901050810",
    "sku": "RES-BND-M",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 190,
    "name": "Resistance Band (Heavy)",
    "category": "Physiotherapy",
    "price": 185,
    "tax_percent": 12,
    "barcode": "8901050811",
    "sku": "RES-BND-HV",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 191,
    "name": "Resistance Band Set (5 bands)",
    "category": "Physiotherapy",
    "price": 450,
    "tax_percent": 12,
    "barcode": "8901050812",
    "sku": "RES-BND-SET5",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 192,
    "name": "Foam Roller 30cm",
    "category": "Physiotherapy",
    "price": 380,
    "tax_percent": 12,
    "barcode": "8901050813",
    "sku": "FMR-30",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 193,
    "name": "Foam Roller 60cm",
    "category": "Physiotherapy",
    "price": 550,
    "tax_percent": 12,
    "barcode": "8901050814",
    "sku": "FMR-60",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 194,
    "name": "Crepe Bandage 5cm x 4m",
    "category": "Physiotherapy",
    "price": 28,
    "tax_percent": 12,
    "barcode": "8901050815",
    "sku": "CRP-BND-5",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 195,
    "name": "Crepe Bandage 10cm x 4m",
    "category": "Physiotherapy",
    "price": 45,
    "tax_percent": 12,
    "barcode": "8901050816",
    "sku": "CRP-BND-10",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 196,
    "name": "Crepe Bandage 15cm x 4m",
    "category": "Physiotherapy",
    "price": 65,
    "tax_percent": 12,
    "barcode": "8901050817",
    "sku": "CRP-BND-15",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 197,
    "name": "Elastic Adhesive Bandage (EAB) 5cm x 5m",
    "category": "Physiotherapy",
    "price": 85,
    "tax_percent": 12,
    "barcode": "8901050818",
    "sku": "EAB-5-5",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 198,
    "name": "Kinesiology Tape Roll 5cm x 5m",
    "category": "Physiotherapy",
    "price": 250,
    "tax_percent": 12,
    "barcode": "8901050819",
    "sku": "KIN-TAPE",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 199,
    "name": "Kinesiology Tape Roll 5cm x 32m",
    "category": "Physiotherapy",
    "price": 850,
    "tax_percent": 12,
    "barcode": "8901050820",
    "sku": "KIN-TAPE-32",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 200,
    "name": "SpraySensicool Cold Spray 400mL",
    "category": "Physiotherapy",
    "price": 280,
    "tax_percent": 12,
    "barcode": "8901050821",
    "sku": "CLD-SPY-400",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 201,
    "name": "Tens Electrode Lead Wires (2 pcs)",
    "category": "Physiotherapy",
    "price": 185,
    "tax_percent": 12,
    "barcode": "8901050822",
    "sku": "TENS-LWR-2",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 202,
    "name": "Exercise Ball 65cm",
    "category": "Physiotherapy",
    "price": 650,
    "tax_percent": 12,
    "barcode": "8901050823",
    "sku": "EXR-BLL-65",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 203,
    "name": "Balance Board / Wobble Board",
    "category": "Physiotherapy",
    "price": 950,
    "tax_percent": 12,
    "barcode": "8901050824",
    "sku": "BAL-BRD",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 204,
    "name": "Diclofenac Sodium 75mg/3mL Injection",
    "category": "Injectables",
    "price": 28,
    "tax_percent": 5,
    "barcode": "8901050901",
    "sku": "DCF-INJ-75",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 205,
    "name": "Ketorolac 30mg/mL Injection",
    "category": "Injectables",
    "price": 45,
    "tax_percent": 5,
    "barcode": "8901050902",
    "sku": "KTR-INJ-30",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 206,
    "name": "Tramadol 50mg/mL Injection (2mL)",
    "category": "Injectables",
    "price": 38,
    "tax_percent": 5,
    "barcode": "8901050903",
    "sku": "TRM-INJ-50",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 207,
    "name": "Methylprednisolone 40mg/mL Vial",
    "category": "Injectables",
    "price": 185,
    "tax_percent": 5,
    "barcode": "8901050904",
    "sku": "MPS-40-VIAL",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 208,
    "name": "Methylprednisolone 125mg/mL Vial",
    "category": "Injectables",
    "price": 280,
    "tax_percent": 5,
    "barcode": "8901050905",
    "sku": "MPS-125-VIAL",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 209,
    "name": "Triamcinolone 40mg/mL Vial 5mL",
    "category": "Injectables",
    "price": 245,
    "tax_percent": 5,
    "barcode": "8901050906",
    "sku": "TRC-40-VIAL",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 210,
    "name": "Triamcinolone Acetonide 10mg/mL Vial 5mL",
    "category": "Injectables",
    "price": 185,
    "tax_percent": 5,
    "barcode": "8901050907",
    "sku": "TRC-10-VIAL",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 211,
    "name": "Betamethasone 5mg/mL + 2mg/mL Vial 1mL",
    "category": "Injectables",
    "price": 125,
    "tax_percent": 5,
    "barcode": "8901050908",
    "sku": "BET-5-VIAL",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 212,
    "name": "Dexamethasone 4mg/mL Injection",
    "category": "Injectables",
    "price": 28,
    "tax_percent": 5,
    "barcode": "8901050909",
    "sku": "DEX-4-INJ",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 213,
    "name": "Hyaluronic Acid 2% Injection (2mL)",
    "category": "Injectables",
    "price": 2800,
    "tax_percent": 5,
    "barcode": "8901050910",
    "sku": "HYA-2PC-INJ",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 214,
    "name": "Hyaluronic Acid 1% Injection (2mL)",
    "category": "Injectables",
    "price": 1800,
    "tax_percent": 5,
    "barcode": "8901050911",
    "sku": "HYA-1PC-INJ",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 215,
    "name": "Sodium Hyaluronate 20mg Prefilled Syringe",
    "category": "Injectables",
    "price": 3500,
    "tax_percent": 5,
    "barcode": "8901050912",
    "sku": "SHA-20-SYR",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 216,
    "name": "Platelet Rich Plasma Kit",
    "category": "Injectables",
    "price": 4500,
    "tax_percent": 5,
    "barcode": "8901050913",
    "sku": "PRP-KIT",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 217,
    "name": "Paracetamol 1000mg/100mL IV Infusion",
    "category": "Injectables",
    "price": 95,
    "tax_percent": 5,
    "barcode": "8901050914",
    "sku": "PCM-IV-100",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 218,
    "name": "Morphine 10mg/mL Injection (1mL)",
    "category": "Injectables",
    "price": 45,
    "tax_percent": 5,
    "barcode": "8901050915",
    "sku": "MOR-10-INJ",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 219,
    "name": "Bupivacaine 0.5% Injection 20mL",
    "category": "Injectables",
    "price": 65,
    "tax_percent": 5,
    "barcode": "8901050916",
    "sku": "BUP-05-INJ",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 220,
    "name": "Lignocaine 2% Injection 30mL",
    "category": "Injectables",
    "price": 38,
    "tax_percent": 5,
    "barcode": "8901050917",
    "sku": "LIG-2-INJ",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 221,
    "name": "Enoxaparin 40mg/0.4mL Syringe",
    "category": "Injectables",
    "price": 225,
    "tax_percent": 5,
    "barcode": "8901050918",
    "sku": "ENX-40-SYR",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 222,
    "name": "Enoxaparin 60mg/0.6mL Syringe",
    "category": "Injectables",
    "price": 285,
    "tax_percent": 5,
    "barcode": "8901050919",
    "sku": "ENX-60-SYR",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 223,
    "name": "Methylcobalamin 500mcg Injection (1mL)",
    "category": "Injectables",
    "price": 65,
    "tax_percent": 5,
    "barcode": "8901050920",
    "sku": "MCB-INJ-500",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 224,
    "name": "Pregabalin 25mg Capsules (10s)",
    "category": "Neuropathy",
    "price": 45,
    "tax_percent": 5,
    "barcode": "8901051001",
    "sku": "PRG-25-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 225,
    "name": "Pregabalin 75mg Capsules (10s)",
    "category": "Neuropathy",
    "price": 88,
    "tax_percent": 5,
    "barcode": "8901051002",
    "sku": "PRG-75-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 226,
    "name": "Pregabalin 150mg Capsules (10s)",
    "category": "Neuropathy",
    "price": 145,
    "tax_percent": 5,
    "barcode": "8901051003",
    "sku": "PRG-150-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 227,
    "name": "Pregabalin 300mg Capsules (10s)",
    "category": "Neuropathy",
    "price": 248,
    "tax_percent": 5,
    "barcode": "8901051004",
    "sku": "PRG-300-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 228,
    "name": "Gabapentin 100mg Capsules (10s)",
    "category": "Neuropathy",
    "price": 42,
    "tax_percent": 5,
    "barcode": "8901051005",
    "sku": "GAB-100-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 229,
    "name": "Gabapentin 300mg Capsules (10s)",
    "category": "Neuropathy",
    "price": 65,
    "tax_percent": 5,
    "barcode": "8901051006",
    "sku": "GAB-300-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 230,
    "name": "Gabapentin 400mg Capsules (10s)",
    "category": "Neuropathy",
    "price": 90,
    "tax_percent": 5,
    "barcode": "8901051007",
    "sku": "GAB-400-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 231,
    "name": "Gabapentin 600mg Tablets (10s)",
    "category": "Neuropathy",
    "price": 125,
    "tax_percent": 5,
    "barcode": "8901051008",
    "sku": "GAB-600-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 232,
    "name": "Amitriptyline 10mg Tablets (10s)",
    "category": "Neuropathy",
    "price": 18,
    "tax_percent": 5,
    "barcode": "8901051009",
    "sku": "AMT-10-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 233,
    "name": "Amitriptyline 25mg Tablets (10s)",
    "category": "Neuropathy",
    "price": 28,
    "tax_percent": 5,
    "barcode": "8901051010",
    "sku": "AMT-25-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 234,
    "name": "Duloxetine 20mg Capsules (10s)",
    "category": "Neuropathy",
    "price": 125,
    "tax_percent": 5,
    "barcode": "8901051011",
    "sku": "DUL-20-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 235,
    "name": "Duloxetine 30mg Capsules (10s)",
    "category": "Neuropathy",
    "price": 185,
    "tax_percent": 5,
    "barcode": "8901051012",
    "sku": "DUL-30-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 236,
    "name": "Duloxetine 60mg Capsules (10s)",
    "category": "Neuropathy",
    "price": 285,
    "tax_percent": 5,
    "barcode": "8901051013",
    "sku": "DUL-60-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 237,
    "name": "Venlafaxine 37.5mg Capsules (10s)",
    "category": "Neuropathy",
    "price": 95,
    "tax_percent": 5,
    "barcode": "8901051014",
    "sku": "VEN-375-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 238,
    "name": "Venlafaxine 75mg SR Capsules (10s)",
    "category": "Neuropathy",
    "price": 155,
    "tax_percent": 5,
    "barcode": "8901051015",
    "sku": "VEN-75-SR",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 239,
    "name": "Carbamazepine 200mg Tablets (10s)",
    "category": "Neuropathy",
    "price": 28,
    "tax_percent": 5,
    "barcode": "8901051016",
    "sku": "CBZ-200-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 240,
    "name": "Carbamazepine 400mg CR Tablets (10s)",
    "category": "Neuropathy",
    "price": 65,
    "tax_percent": 5,
    "barcode": "8901051017",
    "sku": "CBZ-400-CR",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 241,
    "name": "Oxcarbazepine 150mg Tablets (10s)",
    "category": "Neuropathy",
    "price": 88,
    "tax_percent": 5,
    "barcode": "8901051018",
    "sku": "OXC-150-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 242,
    "name": "Oxcarbazepine 300mg Tablets (10s)",
    "category": "Neuropathy",
    "price": 145,
    "tax_percent": 5,
    "barcode": "8901051019",
    "sku": "OXC-300-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 243,
    "name": "Nortriptyline 10mg Tablets (10s)",
    "category": "Neuropathy",
    "price": 25,
    "tax_percent": 5,
    "barcode": "8901051020",
    "sku": "NRT-10-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 244,
    "name": "Nortriptyline 25mg Tablets (10s)",
    "category": "Neuropathy",
    "price": 38,
    "tax_percent": 5,
    "barcode": "8901051021",
    "sku": "NRT-25-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 245,
    "name": "Enoxaparin 40mg/0.4mL Subcutaneous (5 syringes)",
    "category": "Anticoagulants",
    "price": 1050,
    "tax_percent": 5,
    "barcode": "8901051101",
    "sku": "ENX-40-5SYR",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 246,
    "name": "Enoxaparin 60mg/0.6mL Subcutaneous (5 syringes)",
    "category": "Anticoagulants",
    "price": 1350,
    "tax_percent": 5,
    "barcode": "8901051102",
    "sku": "ENX-60-5SYR",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 247,
    "name": "Rivaroxaban 10mg Tablets (10s)",
    "category": "Anticoagulants",
    "price": 680,
    "tax_percent": 5,
    "barcode": "8901051103",
    "sku": "RVX-10-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 248,
    "name": "Rivaroxaban 15mg Tablets (10s)",
    "category": "Anticoagulants",
    "price": 820,
    "tax_percent": 5,
    "barcode": "8901051104",
    "sku": "RVX-15-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 249,
    "name": "Rivaroxaban 20mg Tablets (10s)",
    "category": "Anticoagulants",
    "price": 920,
    "tax_percent": 5,
    "barcode": "8901051105",
    "sku": "RVX-20-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 250,
    "name": "Apixaban 2.5mg Tablets (14s)",
    "category": "Anticoagulants",
    "price": 650,
    "tax_percent": 5,
    "barcode": "8901051106",
    "sku": "APX-25-14",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 251,
    "name": "Apixaban 5mg Tablets (10s)",
    "category": "Anticoagulants",
    "price": 780,
    "tax_percent": 5,
    "barcode": "8901051107",
    "sku": "APX-5-10",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 252,
    "name": "Dabigatran 75mg Capsules (10s)",
    "category": "Anticoagulants",
    "price": 550,
    "tax_percent": 5,
    "barcode": "8901051108",
    "sku": "DAB-75-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 253,
    "name": "Dabigatran 110mg Capsules (10s)",
    "category": "Anticoagulants",
    "price": 780,
    "tax_percent": 5,
    "barcode": "8901051109",
    "sku": "DAB-110-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 254,
    "name": "Aspirin 75mg Tablets (14s)",
    "category": "Anticoagulants",
    "price": 28,
    "tax_percent": 5,
    "barcode": "8901051110",
    "sku": "ASP-75-14",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 255,
    "name": "Aspirin 150mg Tablets (10s)",
    "category": "Anticoagulants",
    "price": 32,
    "tax_percent": 5,
    "barcode": "8901051111",
    "sku": "ASP-150-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 256,
    "name": "Warfarin 1mg Tablets (30s)",
    "category": "Anticoagulants",
    "price": 55,
    "tax_percent": 5,
    "barcode": "8901051112",
    "sku": "WAR-1-30",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 257,
    "name": "Warfarin 5mg Tablets (30s)",
    "category": "Anticoagulants",
    "price": 95,
    "tax_percent": 5,
    "barcode": "8901051113",
    "sku": "WAR-5-30",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 258,
    "name": "Allopurinol 100mg Tablets (10s)",
    "category": "Gout Medications",
    "price": 18,
    "tax_percent": 5,
    "barcode": "8901051201",
    "sku": "ALP-100-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 259,
    "name": "Allopurinol 200mg Tablets (10s)",
    "category": "Gout Medications",
    "price": 32,
    "tax_percent": 5,
    "barcode": "8901051202",
    "sku": "ALP-200-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 260,
    "name": "Allopurinol 300mg Tablets (10s)",
    "category": "Gout Medications",
    "price": 42,
    "tax_percent": 5,
    "barcode": "8901051203",
    "sku": "ALP-300-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 261,
    "name": "Colchicine 0.5mg Tablets (10s)",
    "category": "Gout Medications",
    "price": 65,
    "tax_percent": 5,
    "barcode": "8901051204",
    "sku": "COL-05-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 262,
    "name": "Colchicine 1mg Tablets (10s)",
    "category": "Gout Medications",
    "price": 95,
    "tax_percent": 5,
    "barcode": "8901051205",
    "sku": "COL-1-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 263,
    "name": "Febuxostat 40mg Tablets (10s)",
    "category": "Gout Medications",
    "price": 125,
    "tax_percent": 5,
    "barcode": "8901051206",
    "sku": "FEB-40-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 264,
    "name": "Febuxostat 80mg Tablets (10s)",
    "category": "Gout Medications",
    "price": 185,
    "tax_percent": 5,
    "barcode": "8901051207",
    "sku": "FEB-80-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 265,
    "name": "Febuxostat 120mg Tablets (10s)",
    "category": "Gout Medications",
    "price": 245,
    "tax_percent": 5,
    "barcode": "8901051208",
    "sku": "FEB-120-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 266,
    "name": "Benzbromarone 50mg Tablets (10s)",
    "category": "Gout Medications",
    "price": 95,
    "tax_percent": 5,
    "barcode": "8901051209",
    "sku": "BEN-50-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 267,
    "name": "Probenecid 250mg Tablets (10s)",
    "category": "Gout Medications",
    "price": 65,
    "tax_percent": 5,
    "barcode": "8901051210",
    "sku": "PRO-250-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 268,
    "name": "Pegloticase 8mg Infusion",
    "category": "Gout Medications",
    "price": 12500,
    "tax_percent": 5,
    "barcode": "8901051211",
    "sku": "PGL-8-INF",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 269,
    "name": "Pantoprazole 20mg Tablets (10s)",
    "category": "GI Protection",
    "price": 32,
    "tax_percent": 5,
    "barcode": "8901051301",
    "sku": "PNT-20-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 270,
    "name": "Pantoprazole 40mg Tablets (10s)",
    "category": "GI Protection",
    "price": 45,
    "tax_percent": 5,
    "barcode": "8901051302",
    "sku": "PNT-40-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 271,
    "name": "Omeprazole 10mg Capsules (10s)",
    "category": "GI Protection",
    "price": 22,
    "tax_percent": 5,
    "barcode": "8901051303",
    "sku": "OMP-10-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 272,
    "name": "Omeprazole 20mg Capsules (10s)",
    "category": "GI Protection",
    "price": 32,
    "tax_percent": 5,
    "barcode": "8901051304",
    "sku": "OMP-20-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 273,
    "name": "Omeprazole 40mg Capsules (10s)",
    "category": "GI Protection",
    "price": 55,
    "tax_percent": 5,
    "barcode": "8901051305",
    "sku": "OMP-40-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 274,
    "name": "Rabeprazole 10mg Tablets (10s)",
    "category": "GI Protection",
    "price": 35,
    "tax_percent": 5,
    "barcode": "8901051306",
    "sku": "RAB-10-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 275,
    "name": "Rabeprazole 20mg Tablets (10s)",
    "category": "GI Protection",
    "price": 52,
    "tax_percent": 5,
    "barcode": "8901051307",
    "sku": "RAB-20-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 276,
    "name": "Esomeprazole 20mg Tablets (10s)",
    "category": "GI Protection",
    "price": 55,
    "tax_percent": 5,
    "barcode": "8901051308",
    "sku": "ESO-20-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 277,
    "name": "Esomeprazole 40mg Tablets (10s)",
    "category": "GI Protection",
    "price": 68,
    "tax_percent": 5,
    "barcode": "8901051309",
    "sku": "ESO-40-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 278,
    "name": "Lansoprazole 15mg Capsules (10s)",
    "category": "GI Protection",
    "price": 38,
    "tax_percent": 5,
    "barcode": "8901051310",
    "sku": "LAN-15-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 279,
    "name": "Lansoprazole 30mg Capsules (10s)",
    "category": "GI Protection",
    "price": 58,
    "tax_percent": 5,
    "barcode": "8901051311",
    "sku": "LAN-30-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 280,
    "name": "Ranitidine 150mg Tablets (10s)",
    "category": "GI Protection",
    "price": 22,
    "tax_percent": 5,
    "barcode": "8901051312",
    "sku": "RAN-150-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 281,
    "name": "Famotidine 20mg Tablets (10s)",
    "category": "GI Protection",
    "price": 28,
    "tax_percent": 5,
    "barcode": "8901051313",
    "sku": "FAM-20-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 282,
    "name": "Famotidine 40mg Tablets (10s)",
    "category": "GI Protection",
    "price": 45,
    "tax_percent": 5,
    "barcode": "8901051314",
    "sku": "FAM-40-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 283,
    "name": "Misoprostol 200mcg Tablets (4s)",
    "category": "GI Protection",
    "price": 85,
    "tax_percent": 5,
    "barcode": "8901051315",
    "sku": "MIS-200-4",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 284,
    "name": "Sucralfate 500mg Tablets (10s)",
    "category": "GI Protection",
    "price": 35,
    "tax_percent": 5,
    "barcode": "8901051316",
    "sku": "SUC-500-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 285,
    "name": "Domperidone 10mg Tablets (10s)",
    "category": "GI Protection",
    "price": 22,
    "tax_percent": 5,
    "barcode": "8901051317",
    "sku": "DOM-10-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 286,
    "name": "Metoclopramide 10mg Tablets (10s)",
    "category": "GI Protection",
    "price": 18,
    "tax_percent": 5,
    "barcode": "8901051318",
    "sku": "MTC-10-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 287,
    "name": "Multivitamin + Mineral Tablets (30s)",
    "category": "Multivitamins",
    "price": 195,
    "tax_percent": 18,
    "barcode": "8901051401",
    "sku": "MVM-MIN-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 288,
    "name": "Vitamin B Complex Tablets (30s)",
    "category": "Multivitamins",
    "price": 95,
    "tax_percent": 18,
    "barcode": "8901051402",
    "sku": "VTB-CMX-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 289,
    "name": "Vitamin C 500mg Tablets (30s)",
    "category": "Multivitamins",
    "price": 125,
    "tax_percent": 18,
    "barcode": "8901051403",
    "sku": "VTC-500-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 290,
    "name": "Vitamin C 1000mg Tablets (30s)",
    "category": "Multivitamins",
    "price": 195,
    "tax_percent": 18,
    "barcode": "8901051404",
    "sku": "VTC-1K-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 291,
    "name": "Vitamin E 400 IU Capsules (30s)",
    "category": "Multivitamins",
    "price": 145,
    "tax_percent": 18,
    "barcode": "8901051405",
    "sku": "VTE-400-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 292,
    "name": "Zinc 50mg Tablets (30s)",
    "category": "Multivitamins",
    "price": 95,
    "tax_percent": 18,
    "barcode": "8901051406",
    "sku": "ZNC-50-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 293,
    "name": "Zinc + Vitamin C + D3 Effervescent (20s)",
    "category": "Multivitamins",
    "price": 280,
    "tax_percent": 18,
    "barcode": "8901051407",
    "sku": "ZNC-VC-EFF",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 294,
    "name": "Magnesium 375mg Tablets (30s)",
    "category": "Multivitamins",
    "price": 245,
    "tax_percent": 18,
    "barcode": "8901051408",
    "sku": "MAG-375-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 295,
    "name": "Omega-3 Fish Oil 1000mg Capsules (30s)",
    "category": "Multivitamins",
    "price": 350,
    "tax_percent": 18,
    "barcode": "8901051409",
    "sku": "OMG-1000-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 296,
    "name": "Omega-3 EPA+DHA 500mg Capsules (60s)",
    "category": "Multivitamins",
    "price": 480,
    "tax_percent": 18,
    "barcode": "8901051410",
    "sku": "OMG-EPA-60",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 297,
    "name": "Coenzyme Q10 100mg Capsules (30s)",
    "category": "Multivitamins",
    "price": 420,
    "tax_percent": 18,
    "barcode": "8901051411",
    "sku": "COQ-100-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 298,
    "name": "Biotin 5000mcg Tablets (30s)",
    "category": "Multivitamins",
    "price": 280,
    "tax_percent": 18,
    "barcode": "8901051412",
    "sku": "BIO-5K-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 299,
    "name": "Iron + Folic Acid Tablets (30s)",
    "category": "Multivitamins",
    "price": 85,
    "tax_percent": 18,
    "barcode": "8901051413",
    "sku": "IRN-FOL-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 300,
    "name": "Turmeric + Black Pepper Capsules (60s)",
    "category": "Multivitamins",
    "price": 320,
    "tax_percent": 18,
    "barcode": "8901051414",
    "sku": "TRM-BPP-60",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 301,
    "name": "Methotrexate 2.5mg Tablets (10s)",
    "category": "Rheumatology",
    "price": 48,
    "tax_percent": 5,
    "barcode": "8901051501",
    "sku": "MTX-25-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 302,
    "name": "Methotrexate 5mg Tablets (10s)",
    "category": "Rheumatology",
    "price": 75,
    "tax_percent": 5,
    "barcode": "8901051502",
    "sku": "MTX-5-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 303,
    "name": "Methotrexate 10mg Tablets (10s)",
    "category": "Rheumatology",
    "price": 120,
    "tax_percent": 5,
    "barcode": "8901051503",
    "sku": "MTX-10-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 304,
    "name": "Hydroxychloroquine 200mg Tablets (10s)",
    "category": "Rheumatology",
    "price": 65,
    "tax_percent": 5,
    "barcode": "8901051504",
    "sku": "HCQ-200-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 305,
    "name": "Hydroxychloroquine 400mg Tablets (10s)",
    "category": "Rheumatology",
    "price": 115,
    "tax_percent": 5,
    "barcode": "8901051505",
    "sku": "HCQ-400-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 306,
    "name": "Sulfasalazine 500mg Tablets (10s)",
    "category": "Rheumatology",
    "price": 45,
    "tax_percent": 5,
    "barcode": "8901051506",
    "sku": "SUL-500-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 307,
    "name": "Leflunomide 10mg Tablets (10s)",
    "category": "Rheumatology",
    "price": 195,
    "tax_percent": 5,
    "barcode": "8901051507",
    "sku": "LEF-10-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 308,
    "name": "Leflunomide 20mg Tablets (10s)",
    "category": "Rheumatology",
    "price": 310,
    "tax_percent": 5,
    "barcode": "8901051508",
    "sku": "LEF-20-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 309,
    "name": "D-Penicillamine 125mg Capsules (10s)",
    "category": "Rheumatology",
    "price": 145,
    "tax_percent": 5,
    "barcode": "8901051509",
    "sku": "DPC-125-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 310,
    "name": "Azathioprine 50mg Tablets (10s)",
    "category": "Rheumatology",
    "price": 165,
    "tax_percent": 5,
    "barcode": "8901051510",
    "sku": "AZA-50-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 311,
    "name": "Folic Acid 5mg Tablets (10s)",
    "category": "Rheumatology",
    "price": 12,
    "tax_percent": 5,
    "barcode": "8901051511",
    "sku": "FOL-5-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 312,
    "name": "Tofacitinib 5mg Tablets (14s)",
    "category": "Rheumatology",
    "price": 3200,
    "tax_percent": 5,
    "barcode": "8901051512",
    "sku": "TOF-5-14",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 313,
    "name": "Baricitinib 2mg Tablets (14s)",
    "category": "Rheumatology",
    "price": 4800,
    "tax_percent": 5,
    "barcode": "8901051513",
    "sku": "BAR-2-14",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 314,
    "name": "Etanercept 25mg Injection",
    "category": "Rheumatology",
    "price": 12500,
    "tax_percent": 5,
    "barcode": "8901051514",
    "sku": "ETA-25-INJ",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 315,
    "name": "Adalimumab 40mg/0.8mL Injection",
    "category": "Rheumatology",
    "price": 28000,
    "tax_percent": 5,
    "barcode": "8901051515",
    "sku": "ADA-40-INJ",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 316,
    "name": "Aceclofenac + Paracetamol + Serratiopeptidase Tablets (10s)",
    "category": "Combination Analgesics",
    "price": 65,
    "tax_percent": 5,
    "barcode": "8901051601",
    "sku": "ACE-PCM-SER",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 317,
    "name": "Diclofenac + Paracetamol + Serratiopeptidase Tablets (10s)",
    "category": "Combination Analgesics",
    "price": 68,
    "tax_percent": 5,
    "barcode": "8901051602",
    "sku": "DCF-PCM-SER",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 318,
    "name": "Ibuprofen + Paracetamol Tablets (10s)",
    "category": "Combination Analgesics",
    "price": 38,
    "tax_percent": 5,
    "barcode": "8901051603",
    "sku": "IBU-PCM-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 319,
    "name": "Ibuprofen 400mg + Paracetamol 325mg Tablets (10s)",
    "category": "Combination Analgesics",
    "price": 42,
    "tax_percent": 5,
    "barcode": "8901051604",
    "sku": "IBU-PCM-400",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 320,
    "name": "Etoricoxib + Thiocolchicoside Tablets (10s)",
    "category": "Combination Analgesics",
    "price": 165,
    "tax_percent": 5,
    "barcode": "8901051605",
    "sku": "ETO-THC-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 321,
    "name": "Diclofenac + Thiocolchicoside Tablets (10s)",
    "category": "Combination Analgesics",
    "price": 115,
    "tax_percent": 5,
    "barcode": "8901051606",
    "sku": "DCF-THC-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 322,
    "name": "Naproxen + Esomeprazole Tablets (10s)",
    "category": "Combination Analgesics",
    "price": 125,
    "tax_percent": 5,
    "barcode": "8901051607",
    "sku": "NAP-ESO-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 323,
    "name": "Serratiopeptidase 10mg Tablets (10s)",
    "category": "Combination Analgesics",
    "price": 45,
    "tax_percent": 5,
    "barcode": "8901051608",
    "sku": "SER-10-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 324,
    "name": "Serratiopeptidase 20mg Tablets (10s)",
    "category": "Combination Analgesics",
    "price": 75,
    "tax_percent": 5,
    "barcode": "8901051609",
    "sku": "SER-20-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 325,
    "name": "Trypsin + Chymotrypsin Tablets (10s)",
    "category": "Combination Analgesics",
    "price": 85,
    "tax_percent": 5,
    "barcode": "8901051610",
    "sku": "TRY-CHY-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 326,
    "name": "Bromelain 500mg Tablets (10s)",
    "category": "Combination Analgesics",
    "price": 95,
    "tax_percent": 5,
    "barcode": "8901051611",
    "sku": "BRM-500-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 327,
    "name": "Tramadol + Paracetamol 650mg + 37.5mg Tablets (10s)",
    "category": "Combination Analgesics",
    "price": 85,
    "tax_percent": 5,
    "barcode": "8901051612",
    "sku": "TRM-PCM-650",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 328,
    "name": "Clonazepam 0.25mg Tablets (10s)",
    "category": "Sleep & Anxiety",
    "price": 22,
    "tax_percent": 5,
    "barcode": "8901051701",
    "sku": "CLN-025-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 329,
    "name": "Clonazepam 0.5mg Tablets (10s)",
    "category": "Sleep & Anxiety",
    "price": 32,
    "tax_percent": 5,
    "barcode": "8901051702",
    "sku": "CLN-05-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 330,
    "name": "Alprazolam 0.25mg Tablets (10s)",
    "category": "Sleep & Anxiety",
    "price": 18,
    "tax_percent": 5,
    "barcode": "8901051703",
    "sku": "ALP-025-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 331,
    "name": "Alprazolam 0.5mg Tablets (10s)",
    "category": "Sleep & Anxiety",
    "price": 28,
    "tax_percent": 5,
    "barcode": "8901051704",
    "sku": "ALP-05-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 332,
    "name": "Zolpidem 5mg Tablets (10s)",
    "category": "Sleep & Anxiety",
    "price": 65,
    "tax_percent": 5,
    "barcode": "8901051705",
    "sku": "ZOL-5-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 333,
    "name": "Zolpidem 10mg Tablets (10s)",
    "category": "Sleep & Anxiety",
    "price": 95,
    "tax_percent": 5,
    "barcode": "8901051706",
    "sku": "ZOL-10-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 334,
    "name": "Melatonin 3mg Tablets (10s)",
    "category": "Sleep & Anxiety",
    "price": 85,
    "tax_percent": 5,
    "barcode": "8901051707",
    "sku": "MEL-3-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 335,
    "name": "Melatonin 5mg Tablets (10s)",
    "category": "Sleep & Anxiety",
    "price": 115,
    "tax_percent": 5,
    "barcode": "8901051708",
    "sku": "MEL-5-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 336,
    "name": "Diazepam 5mg Tablets (10s)",
    "category": "Sleep & Anxiety",
    "price": 18,
    "tax_percent": 5,
    "barcode": "8901051709",
    "sku": "DZP-5-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 337,
    "name": "Lorazepam 1mg Tablets (10s)",
    "category": "Sleep & Anxiety",
    "price": 25,
    "tax_percent": 5,
    "barcode": "8901051710",
    "sku": "LRZ-1-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 338,
    "name": "Sterile Gauze Pads 10x10cm (10s)",
    "category": "Wound Care",
    "price": 45,
    "tax_percent": 12,
    "barcode": "8901051801",
    "sku": "GAZ-10-10",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 339,
    "name": "Adhesive Bandage Strips (100 pcs)",
    "category": "Wound Care",
    "price": 95,
    "tax_percent": 12,
    "barcode": "8901051802",
    "sku": "ADH-BND-100",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 340,
    "name": "Povidone Iodine Solution 100mL",
    "category": "Wound Care",
    "price": 55,
    "tax_percent": 12,
    "barcode": "8901051803",
    "sku": "PVD-SOL-100",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 341,
    "name": "Povidone Iodine Ointment 15g",
    "category": "Wound Care",
    "price": 38,
    "tax_percent": 12,
    "barcode": "8901051804",
    "sku": "PVD-OIN-15",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 342,
    "name": "Hydrogen Peroxide 3% 100mL",
    "category": "Wound Care",
    "price": 25,
    "tax_percent": 12,
    "barcode": "8901051805",
    "sku": "H2O2-3-100",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 343,
    "name": "Silver Sulfadiazine Cream 1% 25g",
    "category": "Wound Care",
    "price": 85,
    "tax_percent": 12,
    "barcode": "8901051806",
    "sku": "SLV-SDF-25",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 344,
    "name": "Bacitracin + Neomycin Ointment 15g",
    "category": "Wound Care",
    "price": 55,
    "tax_percent": 12,
    "barcode": "8901051807",
    "sku": "BAC-NEO-15",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 345,
    "name": "Mupirocin 2% Ointment 5g",
    "category": "Wound Care",
    "price": 65,
    "tax_percent": 12,
    "barcode": "8901051808",
    "sku": "MUP-2-5",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 346,
    "name": "Chlorhexidine Gluconate Solution 500mL",
    "category": "Wound Care",
    "price": 75,
    "tax_percent": 12,
    "barcode": "8901051809",
    "sku": "CHX-500-SOL",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 347,
    "name": "Non-adherent Dressing 10x10cm (10s)",
    "category": "Wound Care",
    "price": 125,
    "tax_percent": 12,
    "barcode": "8901051810",
    "sku": "NAD-10-10",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 348,
    "name": "Amoxicillin 500mg Capsules (10s)",
    "category": "Antibiotics",
    "price": 48,
    "tax_percent": 5,
    "barcode": "8901051901",
    "sku": "AMX-500-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 349,
    "name": "Amoxicillin + Clavulanate 625mg Tablets (6s)",
    "category": "Antibiotics",
    "price": 125,
    "tax_percent": 5,
    "barcode": "8901051902",
    "sku": "AMX-CLV-625",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 350,
    "name": "Amoxicillin + Clavulanate 1000mg Tablets (10s)",
    "category": "Antibiotics",
    "price": 280,
    "tax_percent": 5,
    "barcode": "8901051903",
    "sku": "AMX-CLV-1K",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 351,
    "name": "Ciprofloxacin 500mg Tablets (10s)",
    "category": "Antibiotics",
    "price": 55,
    "tax_percent": 5,
    "barcode": "8901051904",
    "sku": "CIP-500-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 352,
    "name": "Levofloxacin 500mg Tablets (5s)",
    "category": "Antibiotics",
    "price": 85,
    "tax_percent": 5,
    "barcode": "8901051905",
    "sku": "LEV-500-5",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 353,
    "name": "Cefixime 200mg Tablets (10s)",
    "category": "Antibiotics",
    "price": 95,
    "tax_percent": 5,
    "barcode": "8901051906",
    "sku": "CEF-200-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 354,
    "name": "Cefuroxime 250mg Tablets (10s)",
    "category": "Antibiotics",
    "price": 145,
    "tax_percent": 5,
    "barcode": "8901051907",
    "sku": "CEF-250-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 355,
    "name": "Metronidazole 400mg Tablets (10s)",
    "category": "Antibiotics",
    "price": 22,
    "tax_percent": 5,
    "barcode": "8901051908",
    "sku": "MET-400-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 356,
    "name": "Clindamycin 150mg Capsules (10s)",
    "category": "Antibiotics",
    "price": 95,
    "tax_percent": 5,
    "barcode": "8901051909",
    "sku": "CLI-150-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 357,
    "name": "Clindamycin 300mg Capsules (10s)",
    "category": "Antibiotics",
    "price": 165,
    "tax_percent": 5,
    "barcode": "8901051910",
    "sku": "CLI-300-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 358,
    "name": "Doxycycline 100mg Tablets (10s)",
    "category": "Antibiotics",
    "price": 45,
    "tax_percent": 5,
    "barcode": "8901051911",
    "sku": "DOX-100-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 359,
    "name": "Fluconazole 150mg Tablets (1s)",
    "category": "Antibiotics",
    "price": 38,
    "tax_percent": 5,
    "barcode": "8901051912",
    "sku": "FLC-150-1",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 360,
    "name": "Rifampicin 450mg Tablets (10s)",
    "category": "Antibiotics",
    "price": 85,
    "tax_percent": 5,
    "barcode": "8901051913",
    "sku": "RIF-450-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 361,
    "name": "Linezolid 600mg Tablets (10s)",
    "category": "Antibiotics",
    "price": 1850,
    "tax_percent": 5,
    "barcode": "8901051914",
    "sku": "LIN-600-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 362,
    "name": "Fluconazole 50mg Capsules (7s)",
    "category": "Antifungals",
    "price": 65,
    "tax_percent": 5,
    "barcode": "8901052001",
    "sku": "FLC-50-7",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 363,
    "name": "Itraconazole 100mg Capsules (10s)",
    "category": "Antifungals",
    "price": 185,
    "tax_percent": 5,
    "barcode": "8901052002",
    "sku": "ITR-100-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 364,
    "name": "Clotrimazole 1% Cream 30g",
    "category": "Antifungals",
    "price": 55,
    "tax_percent": 5,
    "barcode": "8901052003",
    "sku": "CLO-CRM-30",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 365,
    "name": "Terbinafine 250mg Tablets (7s)",
    "category": "Antifungals",
    "price": 95,
    "tax_percent": 5,
    "barcode": "8901052004",
    "sku": "TER-250-7",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 366,
    "name": "Miconazole + Clotrimazole Cream 30g",
    "category": "Antifungals",
    "price": 68,
    "tax_percent": 5,
    "barcode": "8901052005",
    "sku": "MIC-CLO-30",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 367,
    "name": "Cetirizine 10mg Tablets (10s)",
    "category": "Antihistamines",
    "price": 18,
    "tax_percent": 5,
    "barcode": "8901052101",
    "sku": "CET-10-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 368,
    "name": "Levocetirizine 5mg Tablets (10s)",
    "category": "Antihistamines",
    "price": 28,
    "tax_percent": 5,
    "barcode": "8901052102",
    "sku": "LEV-5-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 369,
    "name": "Fexofenadine 120mg Tablets (10s)",
    "category": "Antihistamines",
    "price": 45,
    "tax_percent": 5,
    "barcode": "8901052103",
    "sku": "FEX-120-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 370,
    "name": "Fexofenadine 180mg Tablets (10s)",
    "category": "Antihistamines",
    "price": 65,
    "tax_percent": 5,
    "barcode": "8901052104",
    "sku": "FEX-180-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 371,
    "name": "Loratadine 10mg Tablets (10s)",
    "category": "Antihistamines",
    "price": 22,
    "tax_percent": 5,
    "barcode": "8901052105",
    "sku": "LOR-10-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 372,
    "name": "Promethazine 25mg Tablets (10s)",
    "category": "Antihistamines",
    "price": 18,
    "tax_percent": 5,
    "barcode": "8901052106",
    "sku": "PRM-25-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 373,
    "name": "Hydrocortisone 1% Cream 30g",
    "category": "Antihistamines",
    "price": 45,
    "tax_percent": 5,
    "barcode": "8901052107",
    "sku": "HYD-CRM-30",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 374,
    "name": "Metformin 500mg Tablets (10s)",
    "category": "Diabetes Adjunct",
    "price": 18,
    "tax_percent": 5,
    "barcode": "8901052201",
    "sku": "MET-500-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 375,
    "name": "Metformin 1000mg Tablets (10s)",
    "category": "Diabetes Adjunct",
    "price": 28,
    "tax_percent": 5,
    "barcode": "8901052202",
    "sku": "MET-1K-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 376,
    "name": "Glibenclamide 5mg Tablets (10s)",
    "category": "Diabetes Adjunct",
    "price": 12,
    "tax_percent": 5,
    "barcode": "8901052203",
    "sku": "GLB-5-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 377,
    "name": "Sitagliptin 50mg Tablets (7s)",
    "category": "Diabetes Adjunct",
    "price": 245,
    "tax_percent": 5,
    "barcode": "8901052204",
    "sku": "SIT-50-7",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 378,
    "name": "Sitagliptin 100mg Tablets (7s)",
    "category": "Diabetes Adjunct",
    "price": 385,
    "tax_percent": 5,
    "barcode": "8901052205",
    "sku": "SIT-100-7",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 379,
    "name": "Atorvastatin 10mg Tablets (10s)",
    "category": "Cardiovascular",
    "price": 28,
    "tax_percent": 5,
    "barcode": "8901052301",
    "sku": "ATV-10-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 380,
    "name": "Atorvastatin 20mg Tablets (10s)",
    "category": "Cardiovascular",
    "price": 42,
    "tax_percent": 5,
    "barcode": "8901052302",
    "sku": "ATV-20-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 381,
    "name": "Atorvastatin 40mg Tablets (10s)",
    "category": "Cardiovascular",
    "price": 65,
    "tax_percent": 5,
    "barcode": "8901052303",
    "sku": "ATV-40-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 382,
    "name": "Amlodipine 5mg Tablets (10s)",
    "category": "Cardiovascular",
    "price": 18,
    "tax_percent": 5,
    "barcode": "8901052304",
    "sku": "AML-5-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 383,
    "name": "Amlodipine 10mg Tablets (10s)",
    "category": "Cardiovascular",
    "price": 28,
    "tax_percent": 5,
    "barcode": "8901052305",
    "sku": "AML-10-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 384,
    "name": "Telmisartan 40mg Tablets (10s)",
    "category": "Cardiovascular",
    "price": 48,
    "tax_percent": 5,
    "barcode": "8901052306",
    "sku": "TEL-40-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 385,
    "name": "Telmisartan 80mg Tablets (10s)",
    "category": "Cardiovascular",
    "price": 72,
    "tax_percent": 5,
    "barcode": "8901052307",
    "sku": "TEL-80-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 386,
    "name": "Whey Protein 1kg (Unflavoured)",
    "category": "Protein Supplements",
    "price": 1800,
    "tax_percent": 18,
    "barcode": "8901052401",
    "sku": "WHY-1K-UNF",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 387,
    "name": "Mass Protein Powder 2kg (Chocolate)",
    "category": "Protein Supplements",
    "price": 1250,
    "tax_percent": 18,
    "barcode": "8901052402",
    "sku": "MSS-2K-CHO",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 388,
    "name": "Casein Protein 1kg (Vanilla)",
    "category": "Protein Supplements",
    "price": 2100,
    "tax_percent": 18,
    "barcode": "8901052403",
    "sku": "CAS-1K-VAN",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 389,
    "name": "Pea Protein 1kg (Plain)",
    "category": "Protein Supplements",
    "price": 1350,
    "tax_percent": 18,
    "barcode": "8901052404",
    "sku": "PEA-1K-PLN",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 390,
    "name": "Ensure Nutrition Powder 400g (Vanilla)",
    "category": "Protein Supplements",
    "price": 650,
    "tax_percent": 18,
    "barcode": "8901052405",
    "sku": "ENS-400-VAN",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 391,
    "name": "Protinex Original 500g",
    "category": "Protein Supplements",
    "price": 550,
    "tax_percent": 18,
    "barcode": "8901052406",
    "sku": "PRO-ORG-500",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 392,
    "name": "Paraffinic Oil / Orthowax (500g)",
    "category": "Miscellaneous",
    "price": 280,
    "tax_percent": 12,
    "barcode": "8901052501",
    "sku": "PRF-OIL-500",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 393,
    "name": "Plaster of Paris (POP) Bandage 15cm",
    "category": "Miscellaneous",
    "price": 65,
    "tax_percent": 12,
    "barcode": "8901052502",
    "sku": "POP-15",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 394,
    "name": "Fibre Glass Cast Roll (3 inch)",
    "category": "Miscellaneous",
    "price": 145,
    "tax_percent": 12,
    "barcode": "8901052503",
    "sku": "FBG-3IN",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 395,
    "name": "Stockinette Bandage 10cm x 10m",
    "category": "Miscellaneous",
    "price": 85,
    "tax_percent": 12,
    "barcode": "8901052504",
    "sku": "STK-10-10M",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 396,
    "name": "Skin Stapler (35 staples)",
    "category": "Miscellaneous",
    "price": 185,
    "tax_percent": 12,
    "barcode": "8901052505",
    "sku": "SKN-STP-35",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 397,
    "name": "Skin Staple Remover",
    "category": "Miscellaneous",
    "price": 65,
    "tax_percent": 12,
    "barcode": "8901052506",
    "sku": "SKN-RMVR",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 398,
    "name": "Sterile Disposable Gloves (Medium, 50 pairs)",
    "category": "Miscellaneous",
    "price": 250,
    "tax_percent": 12,
    "barcode": "8901052507",
    "sku": "GLV-M-50",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 399,
    "name": "Sterile Syringes 2mL (10s)",
    "category": "Miscellaneous",
    "price": 35,
    "tax_percent": 12,
    "barcode": "8901052508",
    "sku": "SYR-2ML-10",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 400,
    "name": "Sterile Syringes 5mL (10s)",
    "category": "Miscellaneous",
    "price": 42,
    "tax_percent": 12,
    "barcode": "8901052509",
    "sku": "SYR-5ML-10",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 401,
    "name": "IV Cannula 20G (10s)",
    "category": "Miscellaneous",
    "price": 95,
    "tax_percent": 12,
    "barcode": "8901052510",
    "sku": "CAN-20G-10",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 402,
    "name": "IV Infusion Set (10s)",
    "category": "Miscellaneous",
    "price": 120,
    "tax_percent": 12,
    "barcode": "8901052511",
    "sku": "IVS-10",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 403,
    "name": "Normal Saline 0.9% 500mL IV Bag",
    "category": "Miscellaneous",
    "price": 55,
    "tax_percent": 0,
    "barcode": "8901052512",
    "sku": "NS-09-500",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 404,
    "name": "Ringer's Lactate 500mL IV Bag",
    "category": "Miscellaneous",
    "price": 65,
    "tax_percent": 0,
    "barcode": "8901052513",
    "sku": "RL-500-IV",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 405,
    "name": "Dextrose 5% in Water 500mL IV Bag",
    "category": "Miscellaneous",
    "price": 55,
    "tax_percent": 0,
    "barcode": "8901052514",
    "sku": "D5W-500-IV",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 406,
    "name": "Micropore Tape 1.25cm x 9.1m",
    "category": "Miscellaneous",
    "price": 38,
    "tax_percent": 12,
    "barcode": "8901052515",
    "sku": "MCP-125-9",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 407,
    "name": "Cotton Roll 500g",
    "category": "Miscellaneous",
    "price": 95,
    "tax_percent": 12,
    "barcode": "8901052516",
    "sku": "CTN-500G",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 408,
    "name": "Thermometer (Digital)",
    "category": "Miscellaneous",
    "price": 185,
    "tax_percent": 12,
    "barcode": "8901052517",
    "sku": "THM-DIG",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 409,
    "name": "Pulse Oximeter (Finger Type)",
    "category": "Miscellaneous",
    "price": 650,
    "tax_percent": 12,
    "barcode": "8901052518",
    "sku": "PLX-FNG",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 410,
    "name": "Blood Pressure Monitor (Automatic)",
    "category": "Miscellaneous",
    "price": 1850,
    "tax_percent": 12,
    "barcode": "8901052519",
    "sku": "BPM-AUT",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 411,
    "name": "Ketorolac Tromethamine 10mg DT Tablets (10s)",
    "category": "NSAIDs",
    "price": 85,
    "tax_percent": 5,
    "barcode": "8901052601",
    "sku": "KTR-10-DT",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 412,
    "name": "Ketorolac 30mg/mL IM/IV Injection (1mL)",
    "category": "Injectables",
    "price": 42,
    "tax_percent": 5,
    "barcode": "8901052602",
    "sku": "KTR-30-INJ",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 413,
    "name": "Dexketoprofen 25mg Tablets (10s)",
    "category": "NSAIDs",
    "price": 95,
    "tax_percent": 5,
    "barcode": "8901052603",
    "sku": "DXK-25-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 414,
    "name": "Lornoxicam 4mg Tablets (10s)",
    "category": "NSAIDs",
    "price": 48,
    "tax_percent": 5,
    "barcode": "8901052604",
    "sku": "LRN-4-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 415,
    "name": "Lornoxicam 8mg + Thiocolchicoside 4mg Tablets (10s)",
    "category": "Combination Analgesics",
    "price": 135,
    "tax_percent": 5,
    "barcode": "8901052605",
    "sku": "LRN-THC-4",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 416,
    "name": "Lornoxicam 8mg + Thiocolchicoside 8mg Tablets (10s)",
    "category": "Combination Analgesics",
    "price": 175,
    "tax_percent": 5,
    "barcode": "8901052606",
    "sku": "LRN-THC-8",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 417,
    "name": "Etodolac 300mg Tablets (10s)",
    "category": "NSAIDs",
    "price": 88,
    "tax_percent": 5,
    "barcode": "8901052607",
    "sku": "ETD-300-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 418,
    "name": "Etodolac 400mg + Thiocolchicoside 4mg Tablets (10s)",
    "category": "Combination Analgesics",
    "price": 165,
    "tax_percent": 5,
    "barcode": "8901052608",
    "sku": "ETD-THC-4",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 419,
    "name": "Etodolac 600mg ER Tablets (10s)",
    "category": "NSAIDs",
    "price": 145,
    "tax_percent": 5,
    "barcode": "8901052609",
    "sku": "ETD-600-ER",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 420,
    "name": "Paracetamol 1000mg/100mL IV Infusion Bag",
    "category": "Analgesics",
    "price": 110,
    "tax_percent": 5,
    "barcode": "8901052610",
    "sku": "PCM-1K-IV",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 421,
    "name": "Paracetamol 150mg/mL Injection (2mL)",
    "category": "Analgesics",
    "price": 18,
    "tax_percent": 5,
    "barcode": "8901052611",
    "sku": "PCM-150-INJ",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 422,
    "name": "Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg Tablets (10s)",
    "category": "Combination Analgesics",
    "price": 85,
    "tax_percent": 5,
    "barcode": "8901052612",
    "sku": "ACE-PCM-SRT",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 423,
    "name": "Diclofenac 50mg + Paracetamol 325mg + Serratiopeptidase 10mg Tablets (10s)",
    "category": "Combination Analgesics",
    "price": 75,
    "tax_percent": 5,
    "barcode": "8901052613",
    "sku": "DCF-PCM-SRT",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 424,
    "name": "Flupirtine Maleate 100mg Capsules (10s)",
    "category": "Analgesics",
    "price": 120,
    "tax_percent": 5,
    "barcode": "8901052614",
    "sku": "FLP-100-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 425,
    "name": "Tapentadol 50mg Tablets (10s)",
    "category": "Analgesics",
    "price": 130,
    "tax_percent": 5,
    "barcode": "8901052615",
    "sku": "TAP-50-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 426,
    "name": "Tapentadol 75mg Tablets (10s)",
    "category": "Analgesics",
    "price": 185,
    "tax_percent": 5,
    "barcode": "8901052616",
    "sku": "TAP-75-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 427,
    "name": "Tapentadol 100mg Tablets (10s)",
    "category": "Analgesics",
    "price": 240,
    "tax_percent": 5,
    "barcode": "8901052617",
    "sku": "TAP-100-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 428,
    "name": "Tramadol 37.5mg + Paracetamol 325mg Tablets (10s)",
    "category": "Combination Analgesics",
    "price": 82,
    "tax_percent": 5,
    "barcode": "8901052618",
    "sku": "TRM-PCM-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 429,
    "name": "Tramadol 50mg/mL Injection (2mL ampoule)",
    "category": "Injectables",
    "price": 32,
    "tax_percent": 5,
    "barcode": "8901052619",
    "sku": "TRM-50-INJ",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 430,
    "name": "Teriparatide 750mcg/3mL Prefilled Pen",
    "category": "Osteoporosis",
    "price": 6500,
    "tax_percent": 5,
    "barcode": "8901052620",
    "sku": "TER-750-PEN",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 431,
    "name": "Denosumab 60mg/mL Prefilled Syringe",
    "category": "Osteoporosis",
    "price": 7800,
    "tax_percent": 5,
    "barcode": "8901052621",
    "sku": "DEN-60-PFS",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 432,
    "name": "Zoledronic Acid 5mg/100mL Infusion Bottle",
    "category": "Osteoporosis",
    "price": 2450,
    "tax_percent": 5,
    "barcode": "8901052622",
    "sku": "ZOL-5MG-INF",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 433,
    "name": "Zoledronic Acid 4mg/5mL Vial",
    "category": "Osteoporosis",
    "price": 1850,
    "tax_percent": 5,
    "barcode": "8901052623",
    "sku": "ZOL-4MG-VIA",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 434,
    "name": "Ibandronic Acid 150mg Tablets (1s)",
    "category": "Osteoporosis",
    "price": 380,
    "tax_percent": 5,
    "barcode": "8901052624",
    "sku": "IBN-150-TAB",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 435,
    "name": "Ibandronic Acid 3mg/3mL Injection",
    "category": "Osteoporosis",
    "price": 1150,
    "tax_percent": 5,
    "barcode": "8901052625",
    "sku": "IBN-3MG-INJ",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 436,
    "name": "Alendronate Sodium 70mg Tablets (4s)",
    "category": "Osteoporosis",
    "price": 160,
    "tax_percent": 5,
    "barcode": "8901052626",
    "sku": "ALN-70-4S",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 437,
    "name": "Alendronate 70mg + Cholecalciferol 5600IU Tablets (4s)",
    "category": "Osteoporosis",
    "price": 210,
    "tax_percent": 5,
    "barcode": "8901052627",
    "sku": "ALN-D3-4S",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 438,
    "name": "Raloxifene 60mg Tablets (10s)",
    "category": "Osteoporosis",
    "price": 195,
    "tax_percent": 5,
    "barcode": "8901052628",
    "sku": "RLX-60-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 439,
    "name": "Calcitonin Salmon Nasal Spray 200IU (2mL)",
    "category": "Osteoporosis",
    "price": 1450,
    "tax_percent": 5,
    "barcode": "8901052629",
    "sku": "CLC-200-NS",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 440,
    "name": "Calcium Citrate Malate + Vit D3 + Vit K2-7 + Magnesium Tablets (15s)",
    "category": "Bone Supplements",
    "price": 225,
    "tax_percent": 18,
    "barcode": "8901052630",
    "sku": "CCM-K2-15",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 441,
    "name": "Cissus Quadrangularis 500mg (Hadjod) Capsules (60s)",
    "category": "Bone Supplements",
    "price": 350,
    "tax_percent": 18,
    "barcode": "8901052631",
    "sku": "CSQ-500-60",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 442,
    "name": "Calcium Carbonate 1250mg + Vit D3 250IU Tablets (15s)",
    "category": "Bone Supplements",
    "price": 118,
    "tax_percent": 12,
    "barcode": "8901052632",
    "sku": "SHL-500-15",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 443,
    "name": "Cholecalciferol 60,000 IU Oral Solution Nano Shots (4 x 5mL)",
    "category": "Bone Supplements",
    "price": 290,
    "tax_percent": 12,
    "barcode": "8901052633",
    "sku": "D3-NANO-4S",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 444,
    "name": "Cholecalciferol 600,000 IU/mL IM Injection",
    "category": "Injectables",
    "price": 145,
    "tax_percent": 5,
    "barcode": "8901052634",
    "sku": "D3-6L-INJ",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 445,
    "name": "Coral Calcium 500mg Capsules (30s)",
    "category": "Bone Supplements",
    "price": 380,
    "tax_percent": 18,
    "barcode": "8901052635",
    "sku": "CRL-500-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 446,
    "name": "Undenatured Type II Collagen (UC-II) 40mg Capsules (30s)",
    "category": "Bone Supplements",
    "price": 850,
    "tax_percent": 18,
    "barcode": "8901052636",
    "sku": "UC2-40-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 447,
    "name": "Type I & III Collagen Peptide 10g Sachets (10s)",
    "category": "Bone Supplements",
    "price": 550,
    "tax_percent": 18,
    "barcode": "8901052637",
    "sku": "COL-PEP-10S",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 448,
    "name": "Sodium Hyaluronate Intra-Articular 20mg/2mL Syringe",
    "category": "Injectables",
    "price": 2800,
    "tax_percent": 12,
    "barcode": "8901052638",
    "sku": "HYA-20-2ML",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 449,
    "name": "High Molecular Weight Cross-linked Hyaluronic Acid 88mg/4mL (Single Shot Knee)",
    "category": "Injectables",
    "price": 8900,
    "tax_percent": 12,
    "barcode": "8901052639",
    "sku": "HYA-88-4ML",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 450,
    "name": "Glucosamine Sulfate 1500mg + Chondroitin 1200mg Effervescent Sachets (10s)",
    "category": "Bone Supplements",
    "price": 420,
    "tax_percent": 18,
    "barcode": "8901052640",
    "sku": "GLC-CHD-10S",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 451,
    "name": "Diacerein 50mg + Glucosamine 750mg + MSM 250mg Tablets (10s)",
    "category": "Bone Supplements",
    "price": 195,
    "tax_percent": 18,
    "barcode": "8901052641",
    "sku": "DIA-GLC-MSM",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 452,
    "name": "Rosehip Extract 550mg Capsules (30s)",
    "category": "Bone Supplements",
    "price": 450,
    "tax_percent": 18,
    "barcode": "8901052642",
    "sku": "RSH-550-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 453,
    "name": "Curcumin 95% 500mg + Piperine 5mg Anti-inflammatory Capsules (60s)",
    "category": "Bone Supplements",
    "price": 490,
    "tax_percent": 18,
    "barcode": "8901052643",
    "sku": "CUR-500-60",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 454,
    "name": "Boswellia Serrata 400mg (Shallaki) Capsules (60s)",
    "category": "Bone Supplements",
    "price": 320,
    "tax_percent": 18,
    "barcode": "8901052644",
    "sku": "BSW-400-60",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 455,
    "name": "Platelet-Rich Plasma (PRP) Ortho Separation Kit (Single Use)",
    "category": "Miscellaneous",
    "price": 1650,
    "tax_percent": 12,
    "barcode": "8901052645",
    "sku": "PRP-KIT-1S",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 456,
    "name": "Tendon Healing Peptide Complex Capsules (10s)",
    "category": "Bone Supplements",
    "price": 360,
    "tax_percent": 18,
    "barcode": "8901052646",
    "sku": "TDN-PEP-10",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 457,
    "name": "Pregabalin 50mg Capsules (10s)",
    "category": "Neuropathy",
    "price": 75,
    "tax_percent": 5,
    "barcode": "8901052647",
    "sku": "PRG-50-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 458,
    "name": "Pregabalin 75mg + Methylcobalamin 750mcg Capsules (10s)",
    "category": "Neuropathy",
    "price": 125,
    "tax_percent": 5,
    "barcode": "8901052648",
    "sku": "PRG-MCO-75",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 459,
    "name": "Pregabalin 75mg + Nortriptyline 10mg Tablets (10s)",
    "category": "Neuropathy",
    "price": 140,
    "tax_percent": 5,
    "barcode": "8901052649",
    "sku": "PRG-NOR-75",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 460,
    "name": "Pregabalin 75mg + Duloxetine 20mg Capsules (10s)",
    "category": "Neuropathy",
    "price": 165,
    "tax_percent": 5,
    "barcode": "8901052650",
    "sku": "PRG-DUL-75",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 461,
    "name": "Gabapentin 100mg Tablets (10s)",
    "category": "Neuropathy",
    "price": 68,
    "tax_percent": 5,
    "barcode": "8901052651",
    "sku": "GBP-100-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 462,
    "name": "Gabapentin 300mg Tablets (10s)",
    "category": "Neuropathy",
    "price": 120,
    "tax_percent": 5,
    "barcode": "8901052652",
    "sku": "GBP-300-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 463,
    "name": "Gabapentin 300mg + Methylcobalamin 500mcg Tablets (10s)",
    "category": "Neuropathy",
    "price": 155,
    "tax_percent": 5,
    "barcode": "8901052653",
    "sku": "GBP-MCO-300",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 464,
    "name": "Duloxetine 20mg Gastro-resistant Tablets (10s)",
    "category": "Neuropathy",
    "price": 95,
    "tax_percent": 5,
    "barcode": "8901052654",
    "sku": "DUL-20-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 465,
    "name": "Duloxetine 30mg Gastro-resistant Tablets (10s)",
    "category": "Neuropathy",
    "price": 135,
    "tax_percent": 5,
    "barcode": "8901052655",
    "sku": "DUL-30-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 466,
    "name": "Duloxetine 60mg Gastro-resistant Tablets (10s)",
    "category": "Neuropathy",
    "price": 210,
    "tax_percent": 5,
    "barcode": "8901052656",
    "sku": "DUL-60-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 467,
    "name": "Amitriptyline 10mg Tablets (10s)",
    "category": "Neuropathy",
    "price": 25,
    "tax_percent": 5,
    "barcode": "8901052657",
    "sku": "AMT-10-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 468,
    "name": "Amitriptyline 25mg Tablets (10s)",
    "category": "Neuropathy",
    "price": 42,
    "tax_percent": 5,
    "barcode": "8901052658",
    "sku": "AMT-25-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 469,
    "name": "Palmitoylethanolamide (PEA) 300mg Capsules (30s)",
    "category": "Neuropathy",
    "price": 580,
    "tax_percent": 18,
    "barcode": "8901052659",
    "sku": "PEA-300-30",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 470,
    "name": "Alpha Lipoic Acid 200mg + Benfotiamine 100mg Capsules (10s)",
    "category": "Neuropathy",
    "price": 165,
    "tax_percent": 18,
    "barcode": "8901052660",
    "sku": "ALA-BNF-10",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 471,
    "name": "Methylcobalamin 1500mcg + Vit B6 3mg + Folic Acid 1.5mg Tablets (15s)",
    "category": "Neuropathy",
    "price": 145,
    "tax_percent": 18,
    "barcode": "8901052661",
    "sku": "MCO-B6-15",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 472,
    "name": "Mecobalamin 1000mcg/2mL IM/IV Injection (5 Ampoules)",
    "category": "Injectables",
    "price": 125,
    "tax_percent": 5,
    "barcode": "8901052662",
    "sku": "MCO-1K-INJ",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 473,
    "name": "Cefuroxime Axetil 250mg Tablets (10s)",
    "category": "Antibiotics",
    "price": 185,
    "tax_percent": 5,
    "barcode": "8901052663",
    "sku": "CFR-250-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 474,
    "name": "Cefuroxime Axetil 500mg Tablets (10s)",
    "category": "Antibiotics",
    "price": 340,
    "tax_percent": 5,
    "barcode": "8901052664",
    "sku": "CFR-500-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 475,
    "name": "Cefuroxime 750mg IV/IM Injection",
    "category": "Antibiotics",
    "price": 95,
    "tax_percent": 5,
    "barcode": "8901052665",
    "sku": "CFR-750-INJ",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 476,
    "name": "Cefuroxime 1.5g IV Injection",
    "category": "Antibiotics",
    "price": 175,
    "tax_percent": 5,
    "barcode": "8901052666",
    "sku": "CFR-15G-INJ",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 477,
    "name": "Amoxicillin 500mg + Clavulanic Acid 125mg Tablets (10s)",
    "category": "Antibiotics",
    "price": 210,
    "tax_percent": 5,
    "barcode": "8901052667",
    "sku": "AMX-625-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 478,
    "name": "Amoxicillin 875mg + Clavulanic Acid 125mg Tablets (6s)",
    "category": "Antibiotics",
    "price": 185,
    "tax_percent": 5,
    "barcode": "8901052668",
    "sku": "AMX-1K-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 479,
    "name": "Amoxicillin + Clavulanate 1.2g IV Injection",
    "category": "Antibiotics",
    "price": 145,
    "tax_percent": 5,
    "barcode": "8901052669",
    "sku": "AMX-12G-INJ",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 480,
    "name": "Cefoperazone 1000mg + Sulbactam 500mg IV Injection",
    "category": "Antibiotics",
    "price": 260,
    "tax_percent": 5,
    "barcode": "8901052670",
    "sku": "CFP-SLB-15G",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 481,
    "name": "Piperacillin 4g + Tazobactam 0.5g IV Infusion",
    "category": "Antibiotics",
    "price": 380,
    "tax_percent": 5,
    "barcode": "8901052671",
    "sku": "PIP-TAZ-45G",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 482,
    "name": "Meropenem 1000mg IV Injection",
    "category": "Antibiotics",
    "price": 850,
    "tax_percent": 5,
    "barcode": "8901052672",
    "sku": "MER-1K-INJ",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 483,
    "name": "Vancomycin 500mg IV Infusion",
    "category": "Antibiotics",
    "price": 290,
    "tax_percent": 5,
    "barcode": "8901052673",
    "sku": "VAN-500-INJ",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 484,
    "name": "Vancomycin 1000mg IV Infusion",
    "category": "Antibiotics",
    "price": 520,
    "tax_percent": 5,
    "barcode": "8901052674",
    "sku": "VAN-1K-INJ",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 485,
    "name": "Teicoplanin 200mg IV/IM Injection",
    "category": "Antibiotics",
    "price": 850,
    "tax_percent": 5,
    "barcode": "8901052675",
    "sku": "TEI-200-INJ",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 486,
    "name": "Teicoplanin 400mg IV/IM Injection",
    "category": "Antibiotics",
    "price": 1450,
    "tax_percent": 5,
    "barcode": "8901052676",
    "sku": "TEI-400-INJ",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 487,
    "name": "Linezolid 600mg Tablets (10s)",
    "category": "Antibiotics",
    "price": 320,
    "tax_percent": 5,
    "barcode": "8901052677",
    "sku": "LNZ-600-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 488,
    "name": "Linezolid 600mg/300mL IV Infusion",
    "category": "Antibiotics",
    "price": 280,
    "tax_percent": 5,
    "barcode": "8901052678",
    "sku": "LNZ-600-IV",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 489,
    "name": "Clindamycin 300mg Capsules (10s)",
    "category": "Antibiotics",
    "price": 175,
    "tax_percent": 5,
    "barcode": "8901052679",
    "sku": "CLI-300-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 490,
    "name": "Clindamycin 600mg/4mL Injection",
    "category": "Antibiotics",
    "price": 165,
    "tax_percent": 5,
    "barcode": "8901052680",
    "sku": "CLI-600-INJ",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 491,
    "name": "Faropenem 200mg Tablets (6s)",
    "category": "Antibiotics",
    "price": 420,
    "tax_percent": 5,
    "barcode": "8901052681",
    "sku": "FAR-200-6S",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 492,
    "name": "Enoxaparin 40mg/0.4mL Prefilled Syringe",
    "category": "Anticoagulants",
    "price": 450,
    "tax_percent": 5,
    "barcode": "8901052682",
    "sku": "ENO-40-PFS",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 493,
    "name": "Enoxaparin 60mg/0.6mL Prefilled Syringe",
    "category": "Anticoagulants",
    "price": 590,
    "tax_percent": 5,
    "barcode": "8901052683",
    "sku": "ENO-60-PFS",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 494,
    "name": "Dalteparin Sodium 5000 IU/0.2mL Syringe",
    "category": "Anticoagulants",
    "price": 520,
    "tax_percent": 5,
    "barcode": "8901052684",
    "sku": "DAL-5K-PFS",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 495,
    "name": "Fondaparinux Sodium 2.5mg/0.5mL Syringe",
    "category": "Anticoagulants",
    "price": 680,
    "tax_percent": 5,
    "barcode": "8901052685",
    "sku": "FON-25-PFS",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 496,
    "name": "Rivaroxaban 10mg Tablets (10s)",
    "category": "Anticoagulants",
    "price": 290,
    "tax_percent": 5,
    "barcode": "8901052686",
    "sku": "RIV-10-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 497,
    "name": "Rivaroxaban 15mg Tablets (10s)",
    "category": "Anticoagulants",
    "price": 380,
    "tax_percent": 5,
    "barcode": "8901052687",
    "sku": "RIV-15-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 498,
    "name": "Rivaroxaban 20mg Tablets (10s)",
    "category": "Anticoagulants",
    "price": 440,
    "tax_percent": 5,
    "barcode": "8901052688",
    "sku": "RIV-20-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 499,
    "name": "Apixaban 2.5mg Tablets (10s)",
    "category": "Anticoagulants",
    "price": 310,
    "tax_percent": 5,
    "barcode": "8901052689",
    "sku": "API-25-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 500,
    "name": "Apixaban 5mg Tablets (10s)",
    "category": "Anticoagulants",
    "price": 460,
    "tax_percent": 5,
    "barcode": "8901052690",
    "sku": "API-5-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 501,
    "name": "Dabigatran Etexilate 110mg Capsules (10s)",
    "category": "Anticoagulants",
    "price": 380,
    "tax_percent": 5,
    "barcode": "8901052691",
    "sku": "DAB-110-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 502,
    "name": "Dabigatran Etexilate 150mg Capsules (10s)",
    "category": "Anticoagulants",
    "price": 440,
    "tax_percent": 5,
    "barcode": "8901052692",
    "sku": "DAB-150-CAP",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 503,
    "name": "Aspirin 75mg Gastro-Resistant Tablets (14s)",
    "category": "Anticoagulants",
    "price": 12,
    "tax_percent": 5,
    "barcode": "8901052693",
    "sku": "ASP-75-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 504,
    "name": "Aspirin 150mg Gastro-Resistant Tablets (14s)",
    "category": "Anticoagulants",
    "price": 18,
    "tax_percent": 5,
    "barcode": "8901052694",
    "sku": "ASP-150-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 505,
    "name": "Febuxostat 40mg Tablets (10s)",
    "category": "Gout Medications",
    "price": 95,
    "tax_percent": 5,
    "barcode": "8901052695",
    "sku": "FBX-40-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 506,
    "name": "Febuxostat 80mg Tablets (10s)",
    "category": "Gout Medications",
    "price": 165,
    "tax_percent": 5,
    "barcode": "8901052696",
    "sku": "FBX-80-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 507,
    "name": "Allopurinol 100mg Tablets (10s)",
    "category": "Gout Medications",
    "price": 25,
    "tax_percent": 5,
    "barcode": "8901052697",
    "sku": "ALP-100-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 508,
    "name": "Allopurinol 300mg Tablets (10s)",
    "category": "Gout Medications",
    "price": 55,
    "tax_percent": 5,
    "barcode": "8901052698",
    "sku": "ALP-300-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 509,
    "name": "Colchicine 0.5mg Tablets (10s)",
    "category": "Gout Medications",
    "price": 48,
    "tax_percent": 5,
    "barcode": "8901052699",
    "sku": "COL-05-TAB",
    "status": "Available",
    "quantity_type": "strip"
  },
  {
    "id": 510,
    "name": "Potassium Citrate + Citric Acid Oral Solution 200mL",
    "category": "Gout Medications",
    "price": 165,
    "tax_percent": 5,
    "barcode": "8901052700",
    "sku": "POT-CIT-200",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 511,
    "name": "Taylor's TLSO Brace (Thoracolumbosacral Orthosis) - Large",
    "category": "Ortho Supports",
    "price": 1850,
    "tax_percent": 12,
    "barcode": "8901052701",
    "sku": "TYL-BRC-L",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 512,
    "name": "Taylor's TLSO Brace (Thoracolumbosacral Orthosis) - Medium",
    "category": "Ortho Supports",
    "price": 1800,
    "tax_percent": 12,
    "barcode": "8901052702",
    "sku": "TYL-BRC-M",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 513,
    "name": "Philadelphia Cervical Collar (Rigid with Trachea opening)",
    "category": "Ortho Supports",
    "price": 650,
    "tax_percent": 12,
    "barcode": "8901052703",
    "sku": "PHL-CLR-ML",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 514,
    "name": "Hard Cervical Collar with Chin Support - Medium",
    "category": "Ortho Supports",
    "price": 380,
    "tax_percent": 12,
    "barcode": "8901052704",
    "sku": "HRD-CLR-M",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 515,
    "name": "Contoured LS Lumbar Sacro Belt with Double Pull Straps - Large",
    "category": "Ortho Supports",
    "price": 580,
    "tax_percent": 12,
    "barcode": "8901052705",
    "sku": "CNT-LSB-L",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 516,
    "name": "Contoured LS Lumbar Sacro Belt with Double Pull Straps - XL",
    "category": "Ortho Supports",
    "price": 620,
    "tax_percent": 12,
    "barcode": "8901052706",
    "sku": "CNT-LSB-XL",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 517,
    "name": "Hyperextension (ASH) Spinal Brace",
    "category": "Ortho Supports",
    "price": 2200,
    "tax_percent": 12,
    "barcode": "8901052707",
    "sku": "ASH-SPN-BRC",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 518,
    "name": "Knee Immobilizer 19 inch (Universal)",
    "category": "Ortho Supports",
    "price": 750,
    "tax_percent": 12,
    "barcode": "8901052708",
    "sku": "KNE-IMB-19",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 519,
    "name": "Functional ROM Hinged Knee Brace (Post-Op ACL/PCL)",
    "category": "Ortho Supports",
    "price": 2400,
    "tax_percent": 12,
    "barcode": "8901052709",
    "sku": "ROM-HNG-KNE",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 520,
    "name": "Neoprene Hinged Knee Support Wrap - Large",
    "category": "Ortho Supports",
    "price": 850,
    "tax_percent": 12,
    "barcode": "8901052710",
    "sku": "NPR-KNE-L",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 521,
    "name": "Patellar Tendon Knee Strap (Runner's Knee)",
    "category": "Ortho Supports",
    "price": 290,
    "tax_percent": 12,
    "barcode": "8901052711",
    "sku": "PTL-STR-KNE",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 522,
    "name": "Air-Gel Ankle Stirrup Brace",
    "category": "Ortho Supports",
    "price": 780,
    "tax_percent": 12,
    "barcode": "8901052712",
    "sku": "AIR-GEL-ANK",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 523,
    "name": "Rigid AFO Ankle Foot Orthosis (Left)",
    "category": "Ortho Supports",
    "price": 1100,
    "tax_percent": 12,
    "barcode": "8901052713",
    "sku": "AFO-LFT-UNV",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 524,
    "name": "Rigid AFO Ankle Foot Orthosis (Right)",
    "category": "Ortho Supports",
    "price": 1100,
    "tax_percent": 12,
    "barcode": "8901052714",
    "sku": "AFO-RGT-UNV",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 525,
    "name": "Cock-up Wrist Splint with Palmar Stay (Right)",
    "category": "Ortho Supports",
    "price": 340,
    "tax_percent": 12,
    "barcode": "8901052715",
    "sku": "CKP-WST-R",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 526,
    "name": "Cock-up Wrist Splint with Palmar Stay (Left)",
    "category": "Ortho Supports",
    "price": 340,
    "tax_percent": 12,
    "barcode": "8901052716",
    "sku": "CKP-WST-L",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 527,
    "name": "Thumb Spica Splint (De Quervain's Tenosynovitis)",
    "category": "Ortho Supports",
    "price": 380,
    "tax_percent": 12,
    "barcode": "8901052717",
    "sku": "THM-SPC-SPL",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 528,
    "name": "Mallet Finger Splint (Aluminium Padded)",
    "category": "Ortho Supports",
    "price": 85,
    "tax_percent": 12,
    "barcode": "8901052718",
    "sku": "MLT-FNG-SPL",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 529,
    "name": "Frog Finger Splint (Aluminium) - Large",
    "category": "Ortho Supports",
    "price": 65,
    "tax_percent": 12,
    "barcode": "8901052719",
    "sku": "FRG-FNG-L",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 530,
    "name": "Tennis Elbow Strap with Silicone Pressure Pad",
    "category": "Ortho Supports",
    "price": 280,
    "tax_percent": 12,
    "barcode": "8901052720",
    "sku": "TNS-ELB-STP",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 531,
    "name": "Clavicle Brace with Hook & Loop Fasteners - Medium",
    "category": "Ortho Supports",
    "price": 420,
    "tax_percent": 12,
    "barcode": "8901052721",
    "sku": "CLV-BRC-M",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 532,
    "name": "Clavicle Brace with Hook & Loop Fasteners - Large",
    "category": "Ortho Supports",
    "price": 440,
    "tax_percent": 12,
    "barcode": "8901052722",
    "sku": "CLV-BRC-L",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 533,
    "name": "Shoulder Immobilizer Deluxe Envelope Sling",
    "category": "Ortho Supports",
    "price": 380,
    "tax_percent": 12,
    "barcode": "8901052723",
    "sku": "SHL-IMB-SLG",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 534,
    "name": "Rib Belt for Chest Trauma / Fracture - Universal",
    "category": "Ortho Supports",
    "price": 360,
    "tax_percent": 12,
    "barcode": "8901052724",
    "sku": "RIB-BLT-UNV",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 535,
    "name": "Sacroiliac (SI) Joint Pelvic Belt",
    "category": "Ortho Supports",
    "price": 520,
    "tax_percent": 12,
    "barcode": "8901052725",
    "sku": "SI-PLV-BLT",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 536,
    "name": "Silicone Medical Arch Supports (Pair)",
    "category": "Ortho Supports",
    "price": 420,
    "tax_percent": 12,
    "barcode": "8901052726",
    "sku": "SIL-ARC-SUP",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 537,
    "name": "Silicone Heel Cups for Plantar Fasciitis (Pair)",
    "category": "Ortho Supports",
    "price": 350,
    "tax_percent": 12,
    "barcode": "8901052727",
    "sku": "SIL-HEL-CUP",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 538,
    "name": "Bunion Corrector & Night Splint (Hallux Valgus)",
    "category": "Ortho Supports",
    "price": 480,
    "tax_percent": 12,
    "barcode": "8901052728",
    "sku": "BUN-COR-SPL",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 539,
    "name": "Forearm Ergonomic Elbow Crutches (Pair, Height Adjustable)",
    "category": "Ortho Supports",
    "price": 1250,
    "tax_percent": 12,
    "barcode": "8901052729",
    "sku": "FRM-CRT-ADJ",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 540,
    "name": "Underarm Aluminium Axillary Crutches (Pair, Adult)",
    "category": "Ortho Supports",
    "price": 950,
    "tax_percent": 12,
    "barcode": "8901052730",
    "sku": "UND-AXL-CRT",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 541,
    "name": "Quadripod Walking Stick (Wide Base)",
    "category": "Ortho Supports",
    "price": 580,
    "tax_percent": 12,
    "barcode": "8901052731",
    "sku": "QDP-WLK-STK",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 542,
    "name": "Reciprocal Folding Aluminium Walker (Lightweight)",
    "category": "Ortho Supports",
    "price": 1450,
    "tax_percent": 12,
    "barcode": "8901052732",
    "sku": "REC-FLD-WLK",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 543,
    "name": "Folding Walker with 2 Front Wheels",
    "category": "Ortho Supports",
    "price": 1850,
    "tax_percent": 12,
    "barcode": "8901052733",
    "sku": "WHL-FLD-WLK",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 544,
    "name": "Dynacast Prelude Synthetic Splint 4 inch x 15 inch (1s)",
    "category": "Miscellaneous",
    "price": 280,
    "tax_percent": 12,
    "barcode": "8901052734",
    "sku": "DYN-SPL-415",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 545,
    "name": "Dynacast Prelude Synthetic Splint 3 inch x 12 inch (1s)",
    "category": "Miscellaneous",
    "price": 220,
    "tax_percent": 12,
    "barcode": "8901052735",
    "sku": "DYN-SPL-312",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 546,
    "name": "Povidone Iodine 10% Antiseptic Solution 500mL",
    "category": "Wound Care",
    "price": 195,
    "tax_percent": 5,
    "barcode": "8901052736",
    "sku": "PVD-10-500",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 547,
    "name": "Povidone Iodine 5% Antiseptic Ointment 250g",
    "category": "Wound Care",
    "price": 185,
    "tax_percent": 5,
    "barcode": "8901052737",
    "sku": "PVD-5-250G",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 548,
    "name": "Chlorhexidine 4% Surgical Hand Scrub 500mL",
    "category": "Wound Care",
    "price": 220,
    "tax_percent": 12,
    "barcode": "8901052738",
    "sku": "CHX-4-500",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 549,
    "name": "Silver Sulfadiazine 1% Cream 250g Jar",
    "category": "Wound Care",
    "price": 165,
    "tax_percent": 5,
    "barcode": "8901052739",
    "sku": "SSD-1-250G",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 550,
    "name": "Mupirocin 2% Antibacterial Ointment 15g",
    "category": "Wound Care",
    "price": 145,
    "tax_percent": 5,
    "barcode": "8901052740",
    "sku": "MUP-2-15G",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 551,
    "name": "Framycetin Sulfate 1% Skin Cream 100g",
    "category": "Wound Care",
    "price": 95,
    "tax_percent": 5,
    "barcode": "8901052741",
    "sku": "FRM-1-100G",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 552,
    "name": "Sterile Paraffin Gauze Dressing 10cm x 10cm (Box of 10)",
    "category": "Wound Care",
    "price": 290,
    "tax_percent": 12,
    "barcode": "8901052742",
    "sku": "PRF-GZ-10S",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 553,
    "name": "Transparent Polyurethane Film Dressing 10cm x 12cm (10s)",
    "category": "Wound Care",
    "price": 340,
    "tax_percent": 12,
    "barcode": "8901052743",
    "sku": "TPU-FLM-10S",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 554,
    "name": "Hydrocolloid Dressing for Bedsores / Ulcers 10x10cm (5s)",
    "category": "Wound Care",
    "price": 650,
    "tax_percent": 12,
    "barcode": "8901052744",
    "sku": "HYD-DRE-5S",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 555,
    "name": "Calcium Alginate Exudate Absorbing Dressing 10x10cm (5s)",
    "category": "Wound Care",
    "price": 780,
    "tax_percent": 12,
    "barcode": "8901052745",
    "sku": "ALG-DRE-5S",
    "status": "Available",
    "quantity_type": "pack"
  },
  {
    "id": 556,
    "name": "Suture Removal Kit (Sterile Disposable)",
    "category": "Miscellaneous",
    "price": 95,
    "tax_percent": 12,
    "barcode": "8901052746",
    "sku": "STR-RMV-KIT",
    "status": "Available",
    "quantity_type": "pcs"
  },
  {
    "id": 557,
    "name": "Surgical Paper Tape (Micropore 2.5cm x 9.1m)",
    "category": "Miscellaneous",
    "price": 65,
    "tax_percent": 12,
    "barcode": "8901052747",
    "sku": "MCP-25-9M",
    "status": "Available",
    "quantity_type": "pcs"
  }
];

export const DEFAULT_EMPLOYEES = [
  { id: 1, name: "Dr. Arjun Sharma", role: "Orthopaedic Surgeon", phone: "+91 98765 00001", email: "arjun@madrasortho.com", salary: 85000, status: "Active", joined_date: "2025-01-15" },
  { id: 2, name: "Priya Nair", role: "Pharmacist", phone: "+91 98765 00002", email: "priya@madrasortho.com", salary: 30000, status: "Active", joined_date: "2025-02-10" },
  { id: 3, name: "Ravi Kumar", role: "Billing Assistant", phone: "+91 98765 00003", email: "ravi@madrasortho.com", salary: 22000, status: "Active", joined_date: "2025-01-20" }
];

export const DEFAULT_USERS = [
  { id: 1, username: "admin", password: "admin123", role: "admin", name: "Administrator" },
  { id: 2, username: "employee", password: "employee123", role: "employee", name: "Pharmacist" }
];

// Helper to get monday and sunday of a given date
function getMondayAndSunday(dStr: string) {
  const d = new Date(dStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const toStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const dayVal = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayVal}`;
  };
  return { monday: toStr(monday), sunday: toStr(sunday) };
}

// Database state accessor helpers
const getDbData = (key: string, defaults: any) => {
  const raw = localStorage.getItem(`db_${key}`);
  if (!raw) {
    localStorage.setItem(`db_${key}`, JSON.stringify(defaults));
    return defaults;
  }
  try {
    const parsed = JSON.parse(raw);
    // If key is products, ensure all comprehensive ortho medicines are loaded
    if (key === 'products' && Array.isArray(parsed)) {
      const isOldBakery = parsed.some((p: any) => p.name && (p.name.includes("Cake") || p.name.includes("Puff") || p.name.includes("Bread")));
      if (isOldBakery || parsed.length < defaults.length) {
        const existingNames = new Set(parsed.map((p: any) => (p.name || '').trim().toLowerCase()));
        let maxId = parsed.length > 0 ? Math.max(...parsed.map((p: any) => Number(p.id) || 0)) : 0;
        const merged = isOldBakery ? [] : [...parsed];
        for (const d of defaults) {
          if (!existingNames.has((d.name || '').trim().toLowerCase())) {
            maxId++;
            merged.push({ ...d, id: maxId });
            existingNames.add((d.name || '').trim().toLowerCase());
          }
        }
        localStorage.setItem(`db_${key}`, JSON.stringify(merged));
        return merged;
      }
    }
    return parsed;
  } catch (e) {
    return defaults;
  }
};

const saveDbData = (key: string, data: any) => {
  try {
    localStorage.setItem(`db_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error("Local storage save error:", e);
  }
};

// Response factory helper
const makeResponse = (data: any, status: number = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
};

// Initialize interceptor
export function initMockFetch() {
  if (isElectron) return; // Keep Electron calling real backend server

  console.log("[MOCK DB] Non-Electron environment detected. Offline database active!");

  // Ensure clean initial seeding in localStorage
  getDbData('products', ORTHO_PHARMACY_PRODUCTS);
  getDbData('employees', DEFAULT_EMPLOYEES);
  getDbData('users', DEFAULT_USERS);

  const originalFetch = window.fetch;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlStr = typeof input === 'string' ? input : (input as any).url || input.toString();

    // Only intercept local Express API server endpoints
    if (!urlStr.includes("localhost:4848") && !urlStr.startsWith("/api/")) {
      return originalFetch.apply(this, arguments as any);
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlStr, window.location.origin || 'http://localhost:4848');
    } catch {
      parsedUrl = new URL(urlStr, 'http://localhost:4848');
    }

    const path = parsedUrl.pathname;
    const method = (init?.method || 'GET').toUpperCase();
    const params = parsedUrl.searchParams;

    try {
      // ----------------------------------------------------
      // AUTHENTICATION API
      // ----------------------------------------------------
      if (path === '/api/auth/login') {
        if (method === 'POST') {
          const body = JSON.parse(init?.body as string || '{}');
          const users = getDbData('users', DEFAULT_USERS);
          const found = users.find((u: any) => u.username === body.username && u.password === body.password);
          if (found) {
            return makeResponse({
              success: true,
              user: {
                id: found.id,
                username: found.username,
                role: found.role,
                name: found.name
              }
            });
          }
          return makeResponse({ error: "Invalid username or password." }, 401);
        }
      }

      if (path === '/api/auth/change-password') {
        if (method === 'PUT') {
          const body = JSON.parse(init?.body as string || '{}');
          const users = getDbData('users', DEFAULT_USERS);
          const idx = users.findIndex((u: any) => u.username === body.username);
          if (idx === -1) {
            return makeResponse({ error: "User not found." }, 404);
          }
          if (users[idx].password !== body.currentPassword) {
            return makeResponse({ error: "Incorrect current password." }, 401);
          }
          users[idx].password = body.newPassword;
          saveDbData('users', users);
          return makeResponse({ success: true, message: "Password updated successfully." });
        }
      }

      // ----------------------------------------------------
      // PRODUCTS API
      // ----------------------------------------------------
      if (path === '/api/products') {
        let products = getDbData('products', ORTHO_PHARMACY_PRODUCTS);

        if (method === 'GET') {
          products.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
          return makeResponse(products);
        }

        if (method === 'POST') {
          const body = JSON.parse(init?.body as string || '{}');
          if (!body.name || !body.category || body.price === undefined) {
            return makeResponse({ error: "Missing required product fields." }, 400);
          }
          const newId = products.length > 0 ? Math.max(...products.map((p: any) => Number(p.id) || 0)) + 1 : 1;
          const newProduct = {
            id: newId,
            name: body.name,
            category: body.category,
            price: Number(body.price),
            barcode: body.barcode || null,
            sku: body.sku || null,
            tax_percent: Number(body.tax_percent || 0),
            status: body.status || 'Available',
            quantity_type: body.quantity_type || 'strip'
          };
          products.push(newProduct);
          saveDbData('products', products);
          return makeResponse(newProduct, 201);
        }
      }

      if (path === '/api/products/parse-excel' && method === 'POST') {
        const body = JSON.parse(init?.body as string || '{}');
        const text = body.csvText || '';
        // Fast mock CSV parsing
        const lines = text.split(/\r?\n/).filter((l: string) => l.trim().length > 0);
        const medicines: any[] = [];
        let headerPassed = false;
        lines.forEach((line: string) => {
          if (!headerPassed) {
            if (line.toLowerCase().includes('name') || line.toLowerCase().includes('medicine') || line.toLowerCase().includes('product')) {
              headerPassed = true;
            }
            return;
          }
          const parts = line.split(',').map((p: string) => p.replace(/^"|"$/g, '').trim());
          if (parts[0] && !parts[0].toLowerCase().includes('instructions:')) {
            medicines.push({
              name: parts[0],
              category: parts[1] || 'Orthopaedic Medicines',
              price: parseFloat((parts[2] || '0').replace(/[^0-9.]/g, '')) || 0,
              tax_percent: parseFloat((parts[3] || '5').replace(/[^0-9.]/g, '')) || 5,
              quantity_type: parts[4] || 'strip',
              barcode: parts[5] || null,
              sku: parts[6] || null,
              status: 'Available'
            });
          }
        });
        return makeResponse({ success: true, count: medicines.length, filename: body.filename || 'uploaded.csv', medicines });
      }

      if (path === '/api/products/batch') {
        if (method === 'POST') {
          const body = JSON.parse(init?.body as string || '{}');
          const batchList = body.products || [];
          const updateExisting = !!body.updateExisting;
          let products = getDbData('products', ORTHO_PHARMACY_PRODUCTS);
          let added = 0;
          let updated = 0;
          let currentMaxId = products.length > 0 ? Math.max(...products.map((p: any) => Number(p.id) || 0)) : 0;

          for (const item of batchList) {
            if (!item.name) continue;
            const existingIdx = products.findIndex((p: any) => (p.name || '').trim().toLowerCase() === (item.name || '').trim().toLowerCase());
            if (existingIdx !== -1) {
              if (updateExisting) {
                products[existingIdx] = {
                  ...products[existingIdx],
                  category: item.category || products[existingIdx].category,
                  price: Number(item.price) || products[existingIdx].price,
                  tax_percent: item.tax_percent !== undefined ? Number(item.tax_percent) : products[existingIdx].tax_percent,
                  quantity_type: item.quantity_type || products[existingIdx].quantity_type,
                  barcode: item.barcode || products[existingIdx].barcode,
                  sku: item.sku || products[existingIdx].sku
                };
                updated++;
              } else {
                currentMaxId++;
                products.push({
                  id: currentMaxId,
                  name: `${item.name} (${currentMaxId})`,
                  category: item.category || 'Orthopaedic Medicines',
                  price: Number(item.price) || 0,
                  tax_percent: Number(item.tax_percent) || 5,
                  barcode: item.barcode || null,
                  sku: item.sku || null,
                  status: item.status || 'Available',
                  quantity_type: item.quantity_type || 'strip'
                });
                added++;
              }
            } else {
              currentMaxId++;
              products.push({
                id: currentMaxId,
                name: item.name.trim(),
                category: item.category || 'Orthopaedic Medicines',
                price: Number(item.price) || 0,
                tax_percent: Number(item.tax_percent) || 5,
                barcode: item.barcode || null,
                sku: item.sku || null,
                status: item.status || 'Available',
                quantity_type: item.quantity_type || 'strip'
              });
              added++;
            }
          }
          saveDbData('products', products);
          return makeResponse({ success: true, added, updated, totalProcessed: batchList.length });
        }
      }

      if (path.startsWith('/api/products/')) {
        const idStr = path.substring('/api/products/'.length);

        if (idStr.startsWith('barcode/')) {
          const barcode = idStr.substring('barcode/'.length);
          const products = getDbData('products', ORTHO_PHARMACY_PRODUCTS);
          const product = products.find((p: any) => p.barcode === barcode && p.status === 'Available');
          if (!product) {
            return makeResponse({ error: "Product not found." }, 404);
          }
          return makeResponse(product);
        }

        const id = Number(idStr);
        let products = getDbData('products', ORTHO_PHARMACY_PRODUCTS);
        const idx = products.findIndex((p: any) => p.id === id);

        if (idx === -1) {
          return makeResponse({ error: "Product not found." }, 404);
        }

        if (method === 'PUT') {
          const body = JSON.parse(init?.body as string || '{}');
          const updated = {
            ...products[idx],
            name: body.name !== undefined ? body.name : products[idx].name,
            category: body.category !== undefined ? body.category : products[idx].category,
            price: body.price !== undefined ? Number(body.price) : products[idx].price,
            barcode: body.barcode !== undefined ? body.barcode : products[idx].barcode,
            sku: body.sku !== undefined ? body.sku : products[idx].sku,
            tax_percent: body.tax_percent !== undefined ? Number(body.tax_percent) : products[idx].tax_percent,
            status: body.status !== undefined ? body.status : products[idx].status,
            quantity_type: body.quantity_type !== undefined ? body.quantity_type : products[idx].quantity_type
          };
          products[idx] = updated;
          saveDbData('products', products);
          return makeResponse(updated);
        }

        if (method === 'DELETE') {
          products.splice(idx, 1);
          saveDbData('products', products);
          return makeResponse({ message: "Product deleted successfully.", id });
        }
      }

      // ----------------------------------------------------
      // EMPLOYEES API
      // ----------------------------------------------------
      if (path === '/api/employees') {
        let employees = getDbData('employees', DEFAULT_EMPLOYEES);

        if (method === 'GET') {
          employees.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
          return makeResponse(employees);
        }

        if (method === 'POST') {
          const body = JSON.parse(init?.body as string || '{}');
          const newId = employees.length > 0 ? Math.max(...employees.map((e: any) => Number(e.id) || 0)) + 1 : 1;
          const newEmp = {
            id: newId,
            name: body.name,
            role: body.role,
            phone: body.phone || null,
            email: body.email || null,
            salary: body.salary !== undefined && body.salary !== null ? Number(body.salary) : null,
            status: body.status || 'Active',
            joined_date: body.joined_date || new Date().toISOString().split('T')[0]
          };
          employees.push(newEmp);
          saveDbData('employees', employees);
          return makeResponse(newEmp, 201);
        }
      }

      if (path.startsWith('/api/employees/')) {
        const id = Number(path.substring('/api/employees/'.length));
        let employees = getDbData('employees', DEFAULT_EMPLOYEES);
        const idx = employees.findIndex((e: any) => e.id === id);

        if (idx === -1) {
          return makeResponse({ error: "Employee not found." }, 404);
        }

        if (method === 'PUT') {
          const body = JSON.parse(init?.body as string || '{}');
          const updated = {
            ...employees[idx],
            name: body.name !== undefined ? body.name : employees[idx].name,
            role: body.role !== undefined ? body.role : employees[idx].role,
            phone: body.phone !== undefined ? body.phone : employees[idx].phone,
            email: body.email !== undefined ? body.email : employees[idx].email,
            salary: body.salary !== undefined && body.salary !== null ? Number(body.salary) : employees[idx].salary,
            status: body.status !== undefined ? body.status : employees[idx].status,
            joined_date: body.joined_date !== undefined ? body.joined_date : employees[idx].joined_date
          };
          employees[idx] = updated;
          saveDbData('employees', employees);
          return makeResponse(updated);
        }

        if (method === 'DELETE') {
          employees.splice(idx, 1);
          saveDbData('employees', employees);
          return makeResponse({ message: "Employee deleted successfully.", id });
        }
      }

      // ----------------------------------------------------
      // BILLS & INVOICES API
      // ----------------------------------------------------
      if (path === '/api/bills/next-number') {
        const bills = getDbData('bills', []);
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysBills = bills.filter((b: any) => (b.date || '').startsWith(todayStr));
        const nextVal = todaysBills.length > 0 ? Math.max(...todaysBills.map((b: any) => Number(b.bill_number) || 0)) + 1 : 1;
        return makeResponse({ nextBillNumber: nextVal });
      }

      if (path === '/api/bills') {
        let bills = getDbData('bills', []);

        if (method === 'GET') {
          const period = params.get('period') || 'day';
          const dateStr = params.get('date') || new Date().toISOString().split('T')[0];
          const year = Number(params.get('year') || new Date().getFullYear());

          let filteredBills = [];

          if (period === 'day') {
            filteredBills = bills.filter((b: any) => (b.date || '').startsWith(dateStr));
          } else if (period === 'week') {
            const { monday, sunday } = getMondayAndSunday(dateStr);
            filteredBills = bills.filter((b: any) => b.date >= monday && b.date <= sunday);
          } else if (period === 'year') {
            filteredBills = bills.filter((b: any) => (b.date || '').startsWith(`${year}-`));
          } else {
            filteredBills = bills;
          }

          filteredBills.sort((a: any, b: any) => {
            const dateDiff = (b.date || '').localeCompare(a.date || '');
            if (dateDiff !== 0) return dateDiff;
            return (b.time || '').localeCompare(a.time || '');
          });

          return makeResponse(filteredBills);
        }

        if (method === 'POST') {
          const body = JSON.parse(init?.body as string || '{}');
          const now = new Date();
          const dateStr = now.toISOString().split('T')[0];
          const timeStr = now.toTimeString().split(' ')[0];

          const newId = bills.length > 0 ? Math.max(...bills.map((b: any) => Number(b.id) || 0)) + 1 : 1;
          const newBill = {
            id: newId,
            bill_number: Number(body.bill_number || 1),
            subtotal: Number(body.subtotal || 0),
            discount: Number(body.discount || 0),
            tax: Number(body.tax || 0),
            grand_total: Number(body.grand_total || 0),
            payment_method: body.payment_method || 'Cash',
            date: dateStr,
            time: timeStr,
            cashier_name: body.cashier_name || 'Pharmacist',
            items: (body.items || []).map((it: any) => ({
              product_id: it.product_id,
              product_name: it.product_name,
              quantity: Number(it.quantity || 1),
              rate: Number(it.rate || 0),
              total: Number(it.total || 0)
            }))
          };
          bills.push(newBill);
          saveDbData('bills', bills);
          return makeResponse(newBill, 201);
        }
      }

      if (path.startsWith('/api/bills/')) {
        const subPath = path.substring('/api/bills/'.length);

        if (subPath.endsWith('/items')) {
          const id = Number(subPath.substring(0, subPath.indexOf('/items')));
          const bills = getDbData('bills', []);
          const bill = bills.find((b: any) => b.id === id);
          return makeResponse(bill ? bill.items || [] : []);
        }

        const id = Number(subPath);
        let bills = getDbData('bills', []);
        const idx = bills.findIndex((b: any) => b.id === id);
        if (idx !== -1) {
          if (method === 'DELETE') {
            bills.splice(idx, 1);
            saveDbData('bills', bills);
            return makeResponse({ message: "Bill deleted successfully.", id });
          }
          return makeResponse(bills[idx]);
        }
        return makeResponse({ error: "Bill not found." }, 404);
      }

      // ----------------------------------------------------
      // DELETED ITEMS HISTORY AUDIT
      // ----------------------------------------------------
      if (path === '/api/deleted-items') {
        let logs = getDbData('deleted_items', []);

        if (method === 'GET') {
          logs.sort((a: any, b: any) => (b.deleted_at || '').localeCompare(a.deleted_at || ''));
          return makeResponse(logs.slice(0, 100));
        }

        if (method === 'POST') {
          const body = JSON.parse(init?.body as string || '{}');
          const newLog = {
            id: logs.length > 0 ? Math.max(...logs.map((l: any) => Number(l.id) || 0)) + 1 : 1,
            bill_id: body.bill_id ? Number(body.bill_id) : null,
            product_name: body.product_name || 'Item',
            quantity: Number(body.quantity || 1),
            deleted_at: new Date().toISOString()
          };
          logs.push(newLog);
          saveDbData('deleted_items', logs);
          return makeResponse({ success: true }, 201);
        }
      }

      // ----------------------------------------------------
      // NETWORK PRINTER MOCK
      // ----------------------------------------------------
      if (path === '/api/print/network') {
        return makeResponse({ success: true, message: "Receipt dispatched to printer." });
      }

      // ----------------------------------------------------
      // REPORTS / SALES ANALYTICS
      // ----------------------------------------------------
      if (path.startsWith('/api/reports/')) {
        const reportType = path.substring('/api/reports/'.length);
        const bills = getDbData('bills', []);

        if (reportType === 'daily') {
          const dateStr = params.get('date') || new Date().toISOString().split('T')[0];
          const dayBills = bills.filter((b: any) => (b.date || '').startsWith(dateStr));

          let totalSales = 0;
          const paymentBreakdown = { Cash: 0, GooglePay: 0, BankCard: 0 };
          const productsMap: { [key: string]: { name: string; quantity: number; total: number } } = {};

          dayBills.forEach((b: any) => {
            totalSales += Number(b.grand_total || 0);
            const pm = b.payment_method;
            if (pm === "Cash") paymentBreakdown.Cash += Number(b.grand_total || 0);
            else if (pm === "Google Pay" || pm === "GooglePay") paymentBreakdown.GooglePay += Number(b.grand_total || 0);
            else if (pm === "Bank Card" || pm === "BankCard") paymentBreakdown.BankCard += Number(b.grand_total || 0);

            if (b.items) {
              b.items.forEach((it: any) => {
                if (!productsMap[it.product_name]) {
                  productsMap[it.product_name] = { name: it.product_name, quantity: 0, total: 0 };
                }
                productsMap[it.product_name].quantity += Number(it.quantity || 0);
                productsMap[it.product_name].total += Number(it.total || 0);
              });
            }
          });

          const topProducts = Object.values(productsMap).sort((a, b) => b.quantity - a.quantity);

          return makeResponse({
            date: dateStr,
            totalSales,
            billCount: dayBills.length,
            paymentBreakdown,
            topProducts,
            allBills: dayBills
          });
        }

        if (reportType === 'weekly') {
          const dateStr = params.get('date') || new Date().toISOString().split('T')[0];
          const { monday, sunday } = getMondayAndSunday(dateStr);
          const weekBills = bills.filter((b: any) => b.date >= monday && b.date <= sunday);

          let totalSales = 0;
          const paymentBreakdown = { Cash: 0, GooglePay: 0, BankCard: 0 };
          const productsMap: { [key: string]: { name: string; quantity: number; total: number } } = {};

          const dailyBreakdownMap: { [key: string]: { date: string; amount: number; bills: number } } = {};
          let runner = new Date(monday);
          for (let i = 0; i < 7; i++) {
            const dStr = runner.toISOString().split('T')[0];
            dailyBreakdownMap[dStr] = { date: dStr, amount: 0, bills: 0 };
            runner.setDate(runner.getDate() + 1);
          }

          weekBills.forEach((b: any) => {
            totalSales += Number(b.grand_total || 0);
            const pm = b.payment_method;
            if (pm === "Cash") paymentBreakdown.Cash += Number(b.grand_total || 0);
            else if (pm === "Google Pay" || pm === "GooglePay") paymentBreakdown.GooglePay += Number(b.grand_total || 0);
            else if (pm === "Bank Card" || pm === "BankCard") paymentBreakdown.BankCard += Number(b.grand_total || 0);

            if (dailyBreakdownMap[b.date]) {
              dailyBreakdownMap[b.date].amount += Number(b.grand_total || 0);
              dailyBreakdownMap[b.date].bills += 1;
            }

            if (b.items) {
              b.items.forEach((it: any) => {
                if (!productsMap[it.product_name]) {
                  productsMap[it.product_name] = { name: it.product_name, quantity: 0, total: 0 };
                }
                productsMap[it.product_name].quantity += Number(it.quantity || 0);
                productsMap[it.product_name].total += Number(it.total || 0);
              });
            }
          });

          return makeResponse({
            dateRange: `${monday} to ${sunday}`,
            totalSales,
            dailyBreakdown: Object.values(dailyBreakdownMap),
            paymentBreakdown,
            topProducts: Object.values(productsMap).sort((a, b) => b.quantity - a.quantity)
          });
        }

        if (reportType === 'yearly') {
          const year = Number(params.get('year') || new Date().getFullYear());
          const yearBills = bills.filter((b: any) => (b.date || '').startsWith(`${year}-`));

          let totalSales = 0;
          const paymentBreakdown = { Cash: 0, GooglePay: 0, BankCard: 0 };
          const productsMap: { [key: string]: { name: string; quantity: number; total: number } } = {};

          const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
          ];
          const monthlyBreakdown = months.map((name, idx) => ({
            monthIdx: idx,
            monthName: name,
            amount: 0,
            bills: 0,
            growthPercent: 0
          }));

          yearBills.forEach((b: any) => {
            totalSales += Number(b.grand_total || 0);
            const pm = b.payment_method;
            if (pm === "Cash") paymentBreakdown.Cash += Number(b.grand_total || 0);
            else if (pm === "Google Pay" || pm === "GooglePay") paymentBreakdown.GooglePay += Number(b.grand_total || 0);
            else if (pm === "Bank Card" || pm === "BankCard") paymentBreakdown.BankCard += Number(b.grand_total || 0);

            const mIdx = new Date(b.date).getMonth();
            if (mIdx >= 0 && mIdx < 12) {
              monthlyBreakdown[mIdx].amount += Number(b.grand_total || 0);
              monthlyBreakdown[mIdx].bills += 1;
            }

            if (b.items) {
              b.items.forEach((it: any) => {
                if (!productsMap[it.product_name]) {
                  productsMap[it.product_name] = { name: it.product_name, quantity: 0, total: 0 };
                }
                productsMap[it.product_name].quantity += Number(it.quantity || 0);
                productsMap[it.product_name].total += Number(it.total || 0);
              });
            }
          });

          for (let i = 1; i < 12; i++) {
            const prev = monthlyBreakdown[i - 1].amount;
            const curr = monthlyBreakdown[i].amount;
            monthlyBreakdown[i].growthPercent = prev === 0 ? (curr > 0 ? 1 : 0) : (curr - prev) / prev;
          }

          return makeResponse({
            year,
            totalSales,
            monthlyBreakdown,
            paymentBreakdown,
            topProducts: Object.values(productsMap).sort((a, b) => b.quantity - a.quantity)
          });
        }
      }

      // Safe fallback for unhandled requests: return 200 with empty object to prevent frontend crashes
      console.warn(`[MOCK DB] Unhandled offline endpoint: ${method} ${path}`);
      return makeResponse({ success: true, warning: "Offline mock: route not explicitly handled." }, 200);

    } catch (err: any) {
      console.error("[MOCK DB] Error processing request:", err);
      return makeResponse({ error: err.message }, 500);
    }
  };
}
