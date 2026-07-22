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
  workbook.creator = "Billing Software";
  
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
  workbook.creator = "Billing Software";

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
  workbook.creator = "Billing Software";

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
