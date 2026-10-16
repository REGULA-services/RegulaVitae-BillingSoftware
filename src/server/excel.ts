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

export async function parseMedicinesFromBuffer(buffer: Buffer): Promise<ParsedMedicineRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  
  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    throw new Error("Uploaded Excel file contains no worksheets.");
  }

  let headerRowIndex = -1;
  let colMap: Record<string, number> = {};

  worksheet.eachRow((row, rowNumber) => {
    if (headerRowIndex !== -1) return;
    const values = Array.isArray(row.values) ? row.values : Object.values(row.values || {});
    const strValues = values.map(v => String(v || '').toLowerCase().trim());

    // Search for row containing medicine name / item / product
    const nameIdx = strValues.findIndex(v => v.includes('name') || v.includes('medicine') || v.includes('item') || v.includes('product') || v.includes('drug'));
    if (nameIdx !== -1) {
      headerRowIndex = rowNumber;
      strValues.forEach((val, idx) => {
        if (!val) return;
        if (val.includes('name') || val.includes('medicine') || val.includes('item') || val.includes('drug') || val.includes('product')) {
          if (!colMap['name']) colMap['name'] = idx;
        } else if (val.includes('category') || val.includes('cat') || val.includes('group') || val.includes('type')) {
          if (!colMap['category']) colMap['category'] = idx;
        } else if (val.includes('price') || val.includes('rate') || val.includes('mrp') || val.includes('cost') || val.includes('amount')) {
          if (!colMap['price']) colMap['price'] = idx;
        } else if (val.includes('gst') || val.includes('tax')) {
          if (!colMap['tax']) colMap['tax'] = idx;
        } else if (val.includes('quantity_type') || val.includes('unit') || val.includes('pkg') || val.includes('packaging')) {
          if (!colMap['quantity_type']) colMap['quantity_type'] = idx;
        } else if (val.includes('barcode') || val.includes('bar code')) {
          if (!colMap['barcode']) colMap['barcode'] = idx;
        } else if (val.includes('sku') || val.includes('code')) {
          if (!colMap['sku']) colMap['sku'] = idx;
        }
      });
    }
  });

  if (headerRowIndex === -1 || colMap['name'] === undefined) {
    // Default fallback columns if header row wasn't automatically identified
    colMap = { name: 1, category: 2, price: 3, tax: 4, quantity_type: 5, barcode: 6, sku: 7 };
    headerRowIndex = 1;
  }

  const results: ParsedMedicineRow[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowIndex) return; // skip header or title rows

    const values = Array.isArray(row.values) ? row.values : Object.values(row.values || {});
    const getVal = (colIdx: number | undefined): any => {
      if (colIdx === undefined) return '';
      return values[colIdx];
    };

    const rawName = getVal(colMap['name']);
    const name = String(rawName || '').trim();
    if (!name || name.toLowerCase().includes('medicine name') || name.startsWith('Instructions:')) {
      return; // Skip empty rows or repeated headers
    }

    const rawCat = getVal(colMap['category']);
    const category = String(rawCat || '').trim() || 'Orthopaedic Medicines';

    const rawPrice = getVal(colMap['price']);
    const parsedPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice || '0').replace(/[^0-9.]/g, ''));
    const price = isNaN(parsedPrice) ? 0 : Math.max(0, parsedPrice);

    const rawTax = getVal(colMap['tax']);
    let tax_percent = 5;
    if (rawTax !== undefined && rawTax !== '') {
      const parsedTax = typeof rawTax === 'number' ? rawTax : parseFloat(String(rawTax).replace(/[^0-9.]/g, ''));
      if (!isNaN(parsedTax)) {
        tax_percent = [0, 5, 12, 18, 28].includes(parsedTax) ? parsedTax : parsedTax;
      }
    }

    const rawQtyType = getVal(colMap['quantity_type']);
    const cleanedQty = String(rawQtyType || '').toLowerCase().trim();
    const validQtyTypes = ['strip', 'pcs', 'pack', 'ml', 'L', 'g', 'kg'];
    const quantity_type = validQtyTypes.includes(cleanedQty) ? cleanedQty : 'strip';

    const rawBarcode = getVal(colMap['barcode']);
    const barcode = rawBarcode ? String(rawBarcode).trim() : null;

    const rawSku = getVal(colMap['sku']);
    const sku = rawSku ? String(rawSku).trim() : null;

    results.push({
      name,
      category,
      price,
      tax_percent,
      quantity_type,
      barcode: barcode || null,
      sku: sku || null,
      status: 'Available'
    });
  });

  return results;
}
