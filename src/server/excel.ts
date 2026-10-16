import ExcelJS from 'exceljs';

export async function generateDailyExcel(reportData: {
  date: string;
  totalSales: number;
  billCount: number;
  paymentBreakdown: { Cash: number; GooglePay: number; BankCard: number };
  topProducts: { name: string; quantity: number; total: number }[];
  allBills: any[];
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MADRAS ORTHO CLINIC SOFTWARE";
  
  // Sheet 1: Summary Dashboard
  const dashSheet = workbook.addWorksheet("Sales Summary");
  dashSheet.views = [{ showGridLines: true }];

  // Title Banner
  dashSheet.mergeCells("A1:E2");
  const titleCell = dashSheet.getCell("A1");
  titleCell.value = `DAILY SALES REPORT - ${reportData.date}`;
  titleCell.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FFFFFF" } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "8E4D22" } // Beautiful Bakery Bronze/Brown
  };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };

  dashSheet.addRow([]); // Blank row

  // Key KPI Cards
  dashSheet.addRow(["Metric", "Value", "", "Payment Method", "Revenue"]);
  const headerRow = dashSheet.getRow(4);
  headerRow.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFF" } };
  headerRow.getCell(1).fill = headerRow.getCell(2).fill = headerRow.getCell(4).fill = headerRow.getCell(5).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "ca923f" } // Secondary Gold Accent
  };

  dashSheet.addRow(["Total Revenue", reportData.totalSales, "", "Cash", reportData.paymentBreakdown.Cash]);
  dashSheet.addRow(["Total Invoices", reportData.billCount, "", "Google Pay", reportData.paymentBreakdown.GooglePay]);
  dashSheet.addRow(["Average Bill Value", reportData.billCount > 0 ? reportData.totalSales / reportData.billCount : 0, "", "Bank Card", reportData.paymentBreakdown.BankCard]);

  // Format currency cells
  dashSheet.getCell("B5").numFmt = "₹#,##0.00";
  dashSheet.getCell("B6").numFmt = "#,##0";
  dashSheet.getCell("B7").numFmt = "₹#,##0.00";
  dashSheet.getCell("E5").numFmt = "₹#,##0.00";
  dashSheet.getCell("E6").numFmt = "₹#,##0.00";
  dashSheet.getCell("E7").numFmt = "₹#,##0.00";

  // Table styling
  for (let r = 5; r <= 7; r++) {
    const row = dashSheet.getRow(r);
    row.font = { name: "Segoe UI", size: 10 };
    row.getCell(1).border = row.getCell(2).border = row.getCell(4).border = row.getCell(5).border = {
      bottom: { style: "thin", color: { argb: "E2E8F0" } }
    };
  }

  dashSheet.addRow([]); // Blank
  dashSheet.addRow([]);

  // Top Products Table
  dashSheet.mergeCells("A10:C10");
  const prodTitle = dashSheet.getCell("A10");
  prodTitle.value = "Top Selling Products";
  prodTitle.font = { name: "Segoe UI", size: 12, bold: true, color: { argb: "FFFFFF" } };
  prodTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "8E4D22" } };
  prodTitle.alignment = { horizontal: "center" };

  dashSheet.addRow(["Product Name", "Quantity Sold", "Revenue Generated"]);
  const prodHeader = dashSheet.getRow(11);
  prodHeader.font = { name: "Segoe UI", size: 10, bold: true };
  prodHeader.getCell(1).fill = prodHeader.getCell(2).fill = prodHeader.getCell(3).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "F1F5F9" }
  };

  reportData.topProducts.forEach(p => {
    dashSheet.addRow([p.name, p.quantity, p.total]);
  });

  const lastProdRow = 11 + reportData.topProducts.length;
  for (let r = 12; r <= lastProdRow; r++) {
    const row = dashSheet.getRow(r);
    row.getCell(3).numFmt = "₹#,##0.00";
    row.getCell(1).border = row.getCell(2).border = row.getCell(3).border = {
      bottom: { style: "thin", color: { argb: "E2E8F0" } }
    };
  }

  // Adjust column widths
  dashSheet.getColumn("A").width = 25;
  dashSheet.getColumn("B").width = 18;
  dashSheet.getColumn("C").width = 22;
  dashSheet.getColumn("D").width = 18;
  dashSheet.getColumn("E").width = 18;

  // Sheet 2: All Bills
  const billsSheet = workbook.addWorksheet("Transaction Details");
  billsSheet.views = [{ showGridLines: true }];
  
  billsSheet.addRow(["Bill No", "Time", "Cashier", "Payment Method", "Subtotal", "Discount", "Tax", "Grand Total"]);
  const billHeader = billsSheet.getRow(1);
  billHeader.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFF" } };
  for (let col = 1; col <= 8; col++) {
    billHeader.getCell(col).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "8E4D22" }
    };
  }

  reportData.allBills.forEach(b => {
    billsSheet.addRow([
      b.bill_number,
      b.time,
      b.cashier_name,
      b.payment_method,
      b.subtotal,
      b.discount,
      b.tax,
      b.grand_total
    ]);
  });

  // Formatting and totals
  const totalBillsRow = reportData.allBills.length + 2;
  billsSheet.addRow([
    "TOTALS", "", "", "",
    { formula: `SUM(E2:E${totalBillsRow - 1})` },
    { formula: `SUM(F2:F${totalBillsRow - 1})` },
    { formula: `SUM(G2:G${totalBillsRow - 1})` },
    { formula: `SUM(H2:H${totalBillsRow - 1})` }
  ]);

  const footerRow = billsSheet.getRow(totalBillsRow);
  footerRow.font = { name: "Segoe UI", size: 11, bold: true };
  
  for (let r = 2; r <= totalBillsRow; r++) {
    const row = billsSheet.getRow(r);
    row.getCell(5).numFmt = "₹#,##0.00";
    row.getCell(6).numFmt = "₹#,##0.00";
    row.getCell(7).numFmt = "₹#,##0.00";
    row.getCell(8).numFmt = "₹#,##0.00";
    for (let c = 1; c <= 8; c++) {
      row.getCell(c).border = {
        bottom: { style: "thin", color: { argb: "CBD5E1" } }
      };
    }
  }

  billsSheet.getColumn("A").width = 12;
  billsSheet.getColumn("B").width = 12;
  billsSheet.getColumn("C").width = 15;
  billsSheet.getColumn("D").width = 18;
  billsSheet.getColumn("E").width = 15;
  billsSheet.getColumn("F").width = 12;
  billsSheet.getColumn("G").width = 12;
  billsSheet.getColumn("H").width = 18;

  const buffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;
  return buffer;
}

export async function generateWeeklyExcel(reportData: {
  dateRange: string;
  totalSales: number;
  dailyBreakdown: { date: string; amount: number; bills: number }[];
  paymentBreakdown: { Cash: number; GooglePay: number; BankCard: number };
  topProducts: { name: string; quantity: number; total: number }[];
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MADRAS ORTHO CLINIC SOFTWARE";

  const sheet = workbook.addWorksheet("Weekly Report");
  sheet.views = [{ showGridLines: true }];

  // Title Banner
  sheet.mergeCells("A1:F2");
  const titleCell = sheet.getCell("A1");
  titleCell.value = `WEEKLY SALES REPORT (${reportData.dateRange})`;
  titleCell.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "8E4D22" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };

  sheet.addRow([]); // Blank

  // Summary Metrics Table
  sheet.addRow(["Weekly Earnings Summary", "", "", "Payment Splits", ""]);
  sheet.mergeCells("A4:B4");
  sheet.mergeCells("D4:E4");
  sheet.getCell("A4").font = sheet.getCell("D4").font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFF" } };
  sheet.getCell("A4").fill = sheet.getCell("D4").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "ca923f" } };

  sheet.addRow(["Total Revenue", reportData.totalSales, "", "Cash Revenue", reportData.paymentBreakdown.Cash]);
  sheet.addRow(["Avg Daily Revenue", reportData.totalSales / 7, "", "G-Pay Revenue", reportData.paymentBreakdown.GooglePay]);
  sheet.addRow(["Weeks Covered", "Monday → Sunday", "", "Card Revenue", reportData.paymentBreakdown.BankCard]);

  // Format currency cells
  sheet.getCell("B5").numFmt = "₹#,##0.00";
  sheet.getCell("B6").numFmt = "₹#,##0.00";
  sheet.getCell("E5").numFmt = "₹#,##0.00";
  sheet.getCell("E6").numFmt = "₹#,##0.00";
  sheet.getCell("E7").numFmt = "₹#,##0.00";

  for (let r = 5; r <= 7; r++) {
    const row = sheet.getRow(r);
    row.getCell(1).border = row.getCell(2).border = row.getCell(4).border = row.getCell(5).border = {
      bottom: { style: "thin", color: { argb: "E2E8F0" } }
    };
  }

  sheet.addRow([]); // Blank
  sheet.addRow([]);

  // Daily Breakdown Table
  sheet.addRow(["Daily Sales Breakdown"]);
  sheet.mergeCells("A10:C10");
  sheet.getCell("A10").font = { name: "Segoe UI", size: 12, bold: true, color: { argb: "FFFFFF" } };
  sheet.getCell("A10").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "8E4D22" } };
  sheet.getCell("A10").alignment = { horizontal: "center" };

  sheet.addRow(["Day / Date", "Number of Bills", "Daily Sales Amount"]);
  const dailyHeader = sheet.getRow(11);
  dailyHeader.font = { name: "Segoe UI", size: 10, bold: true };
  dailyHeader.getCell(1).fill = dailyHeader.getCell(2).fill = dailyHeader.getCell(3).fill = {
    type: "pattern", pattern: "solid", fgColor: { argb: "F1F5F9" }
  };

  reportData.dailyBreakdown.forEach(d => {
    sheet.addRow([d.date, d.bills, d.amount]);
  });

  const lastDailyRow = 11 + reportData.dailyBreakdown.length;
  for (let r = 12; r <= lastDailyRow; r++) {
    const row = sheet.getRow(r);
    row.getCell(3).numFmt = "₹#,##0.00";
    row.getCell(1).border = row.getCell(2).border = row.getCell(3).border = {
      bottom: { style: "thin", color: { argb: "CBD5E1" } }
    };
  }

  sheet.addRow([]); // Blank
  sheet.addRow([]);

  // Top Products Table
  const topProdStartRow = lastDailyRow + 3;
  sheet.addRow(["Top-Selling Items of the Week"]);
  sheet.mergeCells(`A${topProdStartRow}:C${topProdStartRow}`);
  sheet.getCell(`A${topProdStartRow}`).font = { name: "Segoe UI", size: 12, bold: true, color: { argb: "FFFFFF" } };
  sheet.getCell(`A${topProdStartRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "8E4D22" } };
  sheet.getCell(`A${topProdStartRow}`).alignment = { horizontal: "center" };

  sheet.addRow(["Product Name", "Total Quantity Sold", "Total Revenue"]);
  const topHeader = sheet.getRow(topProdStartRow + 1);
  topHeader.font = { name: "Segoe UI", size: 10, bold: true };
  topHeader.getCell(1).fill = topHeader.getCell(2).fill = topHeader.getCell(3).fill = {
    type: "pattern", pattern: "solid", fgColor: { argb: "F1F5F9" }
  };

  reportData.topProducts.forEach(p => {
    sheet.addRow([p.name, p.quantity, p.total]);
  });

  const lastTopRow = topProdStartRow + 1 + reportData.topProducts.length;
  for (let r = topProdStartRow + 2; r <= lastTopRow; r++) {
    const row = sheet.getRow(r);
    row.getCell(3).numFmt = "₹#,##0.00";
    row.getCell(1).border = row.getCell(2).border = row.getCell(3).border = {
      bottom: { style: "thin", color: { argb: "CBD5E1" } }
    };
  }

  sheet.getColumn("A").width = 28;
  sheet.getColumn("B").width = 18;
  sheet.getColumn("C").width = 22;
  sheet.getColumn("D").width = 18;
  sheet.getColumn("E").width = 18;

  const buffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;
  return buffer;
}

export async function generateYearlyExcel(reportData: {
  year: number;
  totalSales: number;
  monthlyBreakdown: { monthName: string; amount: number; bills: number; growthPercent: number }[];
  paymentBreakdown: { Cash: number; GooglePay: number; BankCard: number };
  topProducts: { name: string; quantity: number; total: number }[];
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MADRAS ORTHO CLINIC SOFTWARE";

  const sheet = workbook.addWorksheet(`Year ${reportData.year} Report`);
  sheet.views = [{ showGridLines: true }];

  // Title Banner
  sheet.mergeCells("A1:G2");
  const titleCell = sheet.getCell("A1");
  titleCell.value = `ANNUAL SALES PERFORMANCE REPORT - YEAR ${reportData.year}`;
  titleCell.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "8E4D22" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };

  sheet.addRow([]); // Blank

  // Summary Metrics Table
  sheet.addRow(["Annual Financial Summary", "", "", "Payment Split Metrics", ""]);
  sheet.mergeCells("A4:B4");
  sheet.mergeCells("D4:E4");
  sheet.getCell("A4").font = sheet.getCell("D4").font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFF" } };
  sheet.getCell("A4").fill = sheet.getCell("D4").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "ca923f" } };

  sheet.addRow(["Total Revenue", reportData.totalSales, "", "Total Cash", reportData.paymentBreakdown.Cash]);
  sheet.addRow(["Avg Monthly Revenue", reportData.totalSales / 12, "", "Total Google Pay", reportData.paymentBreakdown.GooglePay]);
  sheet.addRow(["Reporting Cycle", "Jan 01 → Dec 31", "", "Total Bank Card", reportData.paymentBreakdown.BankCard]);

  // Format currency cells
  sheet.getCell("B5").numFmt = "₹#,##0.00";
  sheet.getCell("B6").numFmt = "₹#,##0.00";
  sheet.getCell("E5").numFmt = "₹#,##0.00";
  sheet.getCell("E6").numFmt = "₹#,##0.00";
  sheet.getCell("E7").numFmt = "₹#,##0.00";

  for (let r = 5; r <= 7; r++) {
    const row = sheet.getRow(r);
    row.getCell(1).border = row.getCell(2).border = row.getCell(4).border = row.getCell(5).border = {
      bottom: { style: "thin", color: { argb: "E2E8F0" } }
    };
  }

  sheet.addRow([]); // Blank
  sheet.addRow([]);

  // Monthly Breakdown Table
  sheet.addRow(["Monthly Sales Performance"]);
  sheet.mergeCells("A10:D10");
  sheet.getCell("A10").font = { name: "Segoe UI", size: 12, bold: true, color: { argb: "FFFFFF" } };
  sheet.getCell("A10").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "8E4D22" } };
  sheet.getCell("A10").alignment = { horizontal: "center" };

  sheet.addRow(["Month", "Number of Bills", "Monthly Revenue", "Month-on-Month Growth %"]);
  const monthlyHeader = sheet.getRow(11);
  monthlyHeader.font = { name: "Segoe UI", size: 10, bold: true };
  monthlyHeader.getCell(1).fill = monthlyHeader.getCell(2).fill = monthlyHeader.getCell(3).fill = monthlyHeader.getCell(4).fill = {
    type: "pattern", pattern: "solid", fgColor: { argb: "F1F5F9" }
  };

  reportData.monthlyBreakdown.forEach(m => {
    sheet.addRow([m.monthName, m.bills, m.amount, m.growthPercent]);
  });

  const lastMonthlyRow = 11 + reportData.monthlyBreakdown.length;
  for (let r = 12; r <= lastMonthlyRow; r++) {
    const row = sheet.getRow(r);
    row.getCell(3).numFmt = "₹#,##0.00";
    row.getCell(4).numFmt = "0.00%";
    row.getCell(1).border = row.getCell(2).border = row.getCell(3).border = row.getCell(4).border = {
      bottom: { style: "thin", color: { argb: "CBD5E1" } }
    };
  }

  sheet.addRow([]); // Blank
  sheet.addRow([]);

  // Top Products Table
  const topProdStartRow = lastMonthlyRow + 3;
  sheet.addRow(["Annual Best-Selling Items"]);
  sheet.mergeCells(`A${topProdStartRow}:C${topProdStartRow}`);
  sheet.getCell(`A${topProdStartRow}`).font = { name: "Segoe UI", size: 12, bold: true, color: { argb: "FFFFFF" } };
  sheet.getCell(`A${topProdStartRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "8E4D22" } };
  sheet.getCell(`A${topProdStartRow}`).alignment = { horizontal: "center" };

  sheet.addRow(["Product Name", "Total Quantity Sold", "Total Revenue"]);
  const topHeader = sheet.getRow(topProdStartRow + 1);
  topHeader.font = { name: "Segoe UI", size: 10, bold: true };
  topHeader.getCell(1).fill = topHeader.getCell(2).fill = topHeader.getCell(3).fill = {
    type: "pattern", pattern: "solid", fgColor: { argb: "F1F5F9" }
  };

  reportData.topProducts.forEach(p => {
    sheet.addRow([p.name, p.quantity, p.total]);
  });

  const lastTopRow = topProdStartRow + 1 + reportData.topProducts.length;
  for (let r = topProdStartRow + 2; r <= lastTopRow; r++) {
    const row = sheet.getRow(r);
    row.getCell(3).numFmt = "₹#,##0.00";
    row.getCell(1).border = row.getCell(2).border = row.getCell(3).border = {
      bottom: { style: "thin", color: { argb: "CBD5E1" } }
    };
  }

  sheet.getColumn("A").width = 28;
  sheet.getColumn("B").width = 18;
  sheet.getColumn("C").width = 22;
  sheet.getColumn("D").width = 24;
  sheet.getColumn("E").width = 18;

  const buffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;
  return buffer;
}

// ----------------------------------------------------
// MEDICINES IMPORT EXCEL TEMPLATE & PARSER
// ----------------------------------------------------

export async function generateMedicineImportTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MADRAS ORTHO CLINIC SOFTWARE";

  const sheet = workbook.addWorksheet("Medicines Template");
  sheet.views = [{ showGridLines: true }];

  // Title Banner
  sheet.mergeCells("A1:G1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = "MADRAS ORTHO CLINIC - MEDICINE IMPORT TEMPLATE";
  titleCell.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0284C7" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  sheet.getRow(1).height = 28;

  // Guidance Row
  sheet.mergeCells("A2:G2");
  const noteCell = sheet.getCell("A2");
  noteCell.value = "Instructions: Fill your medicine details below. Mandatory columns: Medicine Name, Category, Price. GST Rates: 0%, 5%, 12%, 18%.";
  noteCell.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "475569" } };
  noteCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F0F9FF" } };
  noteCell.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(2).height = 20;

  // Header Row
  const headerRow = sheet.getRow(3);
  headerRow.height = 24;
  const headers = [
    "Medicine Name *",
    "Category *",
    "Price (₹) *",
    "GST Rate (%)",
    "Quantity Type",
    "Barcode",
    "SKU Code"
  ];
  headerRow.values = headers;

  headers.forEach((_, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0369A1" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin", color: { argb: "0284C7" } },
      bottom: { style: "medium", color: { argb: "0C4A6E" } },
      left: { style: "thin", color: { argb: "0284C7" } },
      right: { style: "thin", color: { argb: "0284C7" } }
    };
  });

  // Sample Demo Data Rows
  const sampleData = [
    ["Diclofenac Sodium 50mg Tablets (10s)", "NSAIDs", 28.50, 5, "strip", "8901050001", "DCF-50-TAB"],
    ["Thiocolchicoside 4mg Capsules (10s)", "Muscle Relaxants", 145.00, 5, "strip", "8901050030", "THC-4-CAP"],
    ["Calcium Citrate Malate + Vit D3 Tablets (15s)", "Bone Supplements", 185.00, 12, "strip", "8901050050", "CCM-D3-15"],
    ["Knee Immobilizer 19 inch (Universal)", "Ortho Supports", 750.00, 12, "pcs", "8901050100", "KNE-IMB-19"],
    ["Normal Saline 0.9% 500mL IV Infusion", "Miscellaneous", 55.00, 0, "pcs", "8901050200", "NS-500-IV"]
  ];

  sampleData.forEach((rowValues, idx) => {
    const row = sheet.addRow(rowValues);
    row.height = 20;
    const isAlt = idx % 2 === 1;
    for (let c = 1; c <= 7; c++) {
      const cell = row.getCell(c);
      cell.font = { name: "Segoe UI", size: 9.5 };
      if (isAlt) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F8FAFC" } };
      }
      cell.border = {
        bottom: { style: "thin", color: { argb: "E2E8F0" } },
        left: { style: "thin", color: { argb: "E2E8F0" } },
        right: { style: "thin", color: { argb: "E2E8F0" } }
      };
      if (c === 3) {
        cell.numFmt = "₹#,##0.00";
        cell.alignment = { horizontal: "right" };
      } else if (c === 4) {
        cell.alignment = { horizontal: "center" };
      }
    }
  });

  sheet.getColumn("A").width = 38;
  sheet.getColumn("B").width = 24;
  sheet.getColumn("C").width = 16;
  sheet.getColumn("D").width = 15;
  sheet.getColumn("E").width = 16;
  sheet.getColumn("F").width = 18;
  sheet.getColumn("G").width = 18;

  const raw = await workbook.xlsx.writeBuffer();
  return Buffer.from(raw as any);
}

export interface ParsedMedicineRow {
  name: string;
  category: string;
  price: number;
  tax_percent: number;
  quantity_type: string;
  barcode: string | null;
  sku: string | null;
  status: string;
}

/**
 * Safely extracts textual content from any ExcelJS cell or primitive value,
 * properly handling richText, formulas, hyperlinks, booleans, dates, nulls, etc.
 */
function extractCellValue(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number') return isNaN(val) ? '' : String(val);
  if (typeof val === 'boolean') return String(val);
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'object') {
    if (val.result !== undefined && val.result !== null) {
      return extractCellValue(val.result);
    }
    if (Array.isArray(val.richText)) {
      return val.richText.map((t: any) => (t && t.text) ? String(t.text) : '').join('').trim();
    }
    if (val.text !== undefined && val.text !== null) {
      return extractCellValue(val.text);
    }
    if (val.error) return '';
  }
  return String(val).trim();
}

/**
 * Normalizes quantity packaging types to standard clinic units.
 */
function normalizeQuantityType(raw: string): string {
  const q = (raw || '').toLowerCase().trim();
  if (!q) return 'strip';
  if (q.includes('tab') || q.includes('cap') || q.includes('strip')) return 'strip';
  if (q.includes('inj') || q.includes('vial') || q.includes('amp') || q.includes('syr') || q.includes('bot') || q.includes('tube') || q.includes('pc') || q.includes('unit')) return 'pcs';
  if (q.includes('box') || q.includes('pack') || q.includes('kit') || q.includes('carton')) return 'pack';
  if (q.includes('ml') || q.includes('ltr') || q.includes('liter') || q.includes('litre')) return 'ml';
  if (q.includes('gm') || q.includes('gram') || q.includes('kg')) return 'g';
  const valid = ['strip', 'pcs', 'pack', 'ml', 'L', 'g', 'kg'];
  return valid.includes(q) ? q : 'strip';
}

/**
 * Cleans and parses price string or numeric value into a valid float.
 */
function parsePrice(raw: any): number {
  if (typeof raw === 'number') return isNaN(raw) ? 0 : Math.max(0, raw);
  const s = String(raw || '').replace(/₹|rs\.?|inr|\$/gi, '').replace(/,/g, '').trim();
  const num = parseFloat(s.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : Math.max(0, num);
}

/**
 * Normalizes GST percentage from integer, percentage string, or decimal fraction.
 */
function parseTax(raw: any): number {
  if (typeof raw === 'number') {
    if (raw > 0 && raw <= 0.5) return Math.round(raw * 100);
    return raw;
  }
  const s = String(raw || '').replace(/%/g, '').trim();
  const num = parseFloat(s.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return 5;
  if (num > 0 && num <= 0.5) return Math.round(num * 100);
  return num;
}

/**
 * Parses raw CSV or TSV text into 2D string grid.
 */
function parseCsvGrid(text: string): string[][] {
  const firstLine = text.split(/\r?\n/)[0] || '';
  let delimiter = ',';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

  const rows: string[][] = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    const values: string[] = [];
    let insideQuotes = false;
    let current = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === delimiter && !insideQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    rows.push(values);
  }
  return rows;
}

export async function parseMedicinesFromBuffer(buffer: Buffer): Promise<ParsedMedicineRow[]> {
  let grid: string[][] = [];

  // Check if buffer starts with PK\x03\x04 (ZIP header for XLSX)
  const isZip = buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;

  if (isZip) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const worksheet = workbook.getWorksheet(1);
      if (worksheet) {
        worksheet.eachRow({ includeEmpty: false }, (row) => {
          const rowValues: string[] = [];
          const maxCols = Math.max(row.cellCount || 0, 15);
          for (let c = 1; c <= maxCols; c++) {
            const cell = row.getCell(c);
            rowValues.push(extractCellValue(cell ? cell.value : ''));
          }
          if (rowValues.some(v => v.length > 0)) {
            grid.push(rowValues);
          }
        });
      }
    } catch (zipErr) {
      console.warn("XLSX parsing failed, falling back to CSV text parsing:", zipErr);
      grid = parseCsvGrid(buffer.toString('utf8'));
    }
  } else {
    // Plain CSV, TSV, or text spreadsheet
    grid = parseCsvGrid(buffer.toString('utf8'));
  }

  if (grid.length === 0) {
    throw new Error("Uploaded spreadsheet contains no readable rows.");
  }

  // Scan rows 0 to 25 to intelligently locate the header row
  let headerRowIdx = -1;
  let colMap: Record<string, number> = {};

  for (let r = 0; r < Math.min(grid.length, 25); r++) {
    const row = grid[r];
    const candidateMap: Record<string, number> = {};

    for (let c = 0; c < row.length; c++) {
      const cellText = (row[c] || '').toLowerCase().trim();
      if (!cellText) continue;
      // Skip title banners and instruction notes
      if (cellText.includes('template') || cellText.includes('instruction') || cellText.includes('bulk import')) {
        continue;
      }

      if ((cellText.includes('name') || cellText.includes('medicine') || cellText.includes('drug') || cellText.includes('product') || cellText.includes('item') || cellText.includes('description') || cellText.includes('particulars') || cellText.includes('brand') || cellText.includes('formulation')) && candidateMap.name === undefined) {
        candidateMap.name = c;
      } else if ((cellText.includes('category') || cellText.includes('cat') || cellText.includes('group') || cellText.includes('class') || cellText.includes('type') || cellText.includes('dept') || cellText.includes('section')) && candidateMap.category === undefined) {
        candidateMap.category = c;
      } else if ((cellText.includes('price') || cellText.includes('mrp') || cellText.includes('rate') || cellText.includes('cost') || cellText.includes('amount') || cellText.includes('₹') || cellText.includes('rs') || cellText.includes('selling')) && candidateMap.price === undefined) {
        candidateMap.price = c;
      } else if ((cellText.includes('gst') || cellText.includes('tax') || cellText.includes('vat') || cellText.includes('igst')) && candidateMap.tax === undefined) {
        candidateMap.tax = c;
      } else if ((cellText.includes('unit') || cellText.includes('pack') || cellText.includes('pkg') || cellText.includes('quantity') || cellText.includes('uom') || cellText.includes('packing')) && candidateMap.quantity_type === undefined) {
        candidateMap.quantity_type = c;
      } else if ((cellText.includes('barcode') || cellText.includes('bar code') || cellText.includes('upc') || cellText.includes('ean')) && candidateMap.barcode === undefined) {
        candidateMap.barcode = c;
      } else if ((cellText.includes('sku') || cellText.includes('item code') || cellText.includes('product code') || cellText.includes('code')) && candidateMap.sku === undefined) {
        candidateMap.sku = c;
      }
    }

    const recognizedCount = Object.keys(candidateMap).length;
    if (candidateMap.name !== undefined && (recognizedCount >= 2 || candidateMap.price !== undefined || candidateMap.category !== undefined)) {
      headerRowIdx = r;
      colMap = candidateMap;
      break;
    }
  }

  // Fallback defaults if no header row could be identified
  if (headerRowIdx === -1 || colMap.name === undefined) {
    colMap = { name: 0, category: 1, price: 2, tax: 3, quantity_type: 4, barcode: 5, sku: 6 };
    headerRowIdx = -1;
  }

  const results: ParsedMedicineRow[] = [];
  const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;

  for (let r = startRow; r < grid.length; r++) {
    const row = grid[r];
    const name = (row[colMap.name !== undefined ? colMap.name : 0] || '').trim();

    // Skip empty rows, header repeats, or instructions
    if (!name || name.toLowerCase().includes('medicine name') || name.toLowerCase().includes('instructions:') || name.toLowerCase().includes('bulk import')) {
      continue;
    }
    // Skip summary footer rows (e.g. Total, Grand Total, Summary)
    const lowerName = name.toLowerCase();
    if (lowerName === 'total' || lowerName === 'grand total' || lowerName === 'subtotal' || lowerName.startsWith('page ')) {
      continue;
    }

    const category = (colMap.category !== undefined && row[colMap.category]) ? row[colMap.category].trim() : 'Orthopaedic Medicines';
    const price = colMap.price !== undefined ? parsePrice(row[colMap.price]) : 0;
    const tax_percent = colMap.tax !== undefined ? parseTax(row[colMap.tax]) : 5;
    const quantity_type = colMap.quantity_type !== undefined ? normalizeQuantityType(row[colMap.quantity_type]) : 'strip';
    const barcode = (colMap.barcode !== undefined && row[colMap.barcode]) ? row[colMap.barcode].trim() : null;
    const sku = (colMap.sku !== undefined && row[colMap.sku]) ? row[colMap.sku].trim() : null;

    results.push({
      name,
      category: category || 'Orthopaedic Medicines',
      price,
      tax_percent,
      quantity_type,
      barcode: barcode || null,
      sku: sku || null,
      status: 'Available'
    });
  }

  return results;
}
