/**
 * ESC/POS Command Encoder for Thermal Receipt Printers (58mm / 80mm)
 * Compatible with WiFi/Network (TCP Socket: 9100) and Bluetooth Wireless Printers
 */

export function encodeReceiptToEscPos(receiptData: any): Uint8Array {
  const {
    bakeryName = "MADRAS ORTHO CLINIC SOFTWARE",
    description = "Mission for Cure",
    address = "Chennai, Tamil Nadu",
    phone = "+91 98765 43210",
    gstin = "",
    dlNo = "",
    billNumber = 1,
    date = new Date().toISOString().split('T')[0],
    time = new Date().toLocaleTimeString(),
    cashierName = "Pharmacist",
    items = [],
    subtotal = 0,
    discount = 0,
    tax = 0,
    grandTotal = 0,
    paymentMethod = "Cash",
    width = "80mm"
  } = receiptData;

  const is58mm = width === "58mm";
  const colWidth = is58mm ? 32 : 48;
  const divider = "-".repeat(colWidth);
  const doubleDivider = "=".repeat(colWidth);

  const bytes: number[] = [];

  // Helper push string as ASCII / UTF-8 bytes
  const pushText = (text: string) => {
    // Replace Rupee symbol with 'Rs.' for thermal printers without Unicode Rupee glyph
    const sanitized = text.replace(/₹/g, "Rs.");
    for (let i = 0; i < sanitized.length; i++) {
      const code = sanitized.charCodeAt(i);
      if (code < 128) {
        bytes.push(code);
      } else {
        // Fallback for non-ASCII
        bytes.push(0x3F); // '?'
      }
    }
  };

  const pushLine = (text: string = "") => {
    pushText(text + "\n");
  };

  // Format two columns (left-aligned and right-aligned)
  const formatTwoCol = (left: string, right: string, totalWidth: number = colWidth) => {
    const leftTrim = left.replace(/₹/g, "Rs.");
    const rightTrim = right.replace(/₹/g, "Rs.");
    const spacesNeeded = Math.max(1, totalWidth - leftTrim.length - rightTrim.length);
    return leftTrim + " ".repeat(spacesNeeded) + rightTrim;
  };

  // --- ESC/POS Commands ---
  // ESC @: Initialize printer
  bytes.push(0x1B, 0x40);

  // Set line spacing default
  bytes.push(0x1B, 0x32);

  // Center alignment: ESC a 1
  bytes.push(0x1B, 0x61, 0x01);

  // Double Height & Bold: ESC ! 0x18
  bytes.push(0x1B, 0x21, 0x18);
  pushLine(bakeryName);

  // Normal text, bold: ESC ! 0x08
  bytes.push(0x1B, 0x21, 0x08);
  pushLine(description);

  // Normal font: ESC ! 0x00
  bytes.push(0x1B, 0x21, 0x00);
  if (address) pushLine(address);
  if (phone) pushLine(`Ph: ${phone}`);
  if (gstin) pushLine(`GSTIN: ${gstin}`);
  if (dlNo) pushLine(`Drug Lic: ${dlNo}`);

  // Left alignment: ESC a 0
  bytes.push(0x1B, 0x61, 0x00);
  pushLine(divider);

  // Bill Meta
  pushLine(formatTwoCol(`Bill No: #${billNumber}`, `Date: ${date}`));
  pushLine(formatTwoCol(`Pharmacist: ${cashierName}`, `Time: ${time}`));
  pushLine(divider);

  // Table Headers
  if (is58mm) {
    pushLine(formatTwoCol("Item", "Qty   Total"));
  } else {
    // 80mm table: Item (26), Qty (6), Rate (8), Total (8)
    const itemCol = "Item".padEnd(24);
    const qtyCol = "Qty".padStart(6);
    const rateCol = "Rate".padStart(8);
    const totCol = "Total".padStart(10);
    pushLine(`${itemCol}${qtyCol}${rateCol}${totCol}`);
  }
  pushLine(divider);

  // Items
  for (const item of items) {
    const itemName = String(item.product_name || "Item");
    const qty = String(item.quantity || 1);
    const rate = Number(item.rate || 0).toFixed(2);
    const total = Number(item.total || 0).toFixed(2);

    if (is58mm) {
      // 58mm: First line name, second line details
      pushLine(itemName.length > 30 ? itemName.substring(0, 30) : itemName);
      pushLine(formatTwoCol(`  ${qty} x Rs.${rate}`, `Rs.${total}`));
    } else {
      // 80mm: Single row or wrapped
      let nameTrim = itemName;
      if (nameTrim.length > 23) {
        nameTrim = nameTrim.substring(0, 21) + "..";
      }
      const c1 = nameTrim.padEnd(24);
      const c2 = qty.padStart(6);
      const c3 = (`Rs.${rate}`).padStart(8);
      const c4 = (`Rs.${total}`).padStart(10);
      pushLine(`${c1}${c2}${c3}${c4}`);
    }
  }

  pushLine(divider);

  // Totals Section (Right-Aligned / Formatted Two-Col)
  const cgst = tax > 0 ? (tax / 2).toFixed(2) : "0.00";
  const sgst = tax > 0 ? (tax / 2).toFixed(2) : "0.00";

  pushLine(formatTwoCol("Subtotal (excl. GST):", `Rs.${Number(subtotal).toFixed(2)}`));
  if (discount > 0) {
    pushLine(formatTwoCol("Discount:", `-Rs.${Number(discount).toFixed(2)}`));
  }
  if (tax > 0) {
    pushLine(formatTwoCol("CGST (Half):", `+Rs.${cgst}`));
    pushLine(formatTwoCol("SGST (Half):", `+Rs.${sgst}`));
    pushLine(formatTwoCol("Total GST Added:", `+Rs.${Number(tax).toFixed(2)}`));
  }

  pushLine(doubleDivider);

  // Grand Total Bold Double Height
  bytes.push(0x1B, 0x21, 0x18);
  pushLine(formatTwoCol("Grand Total (incl. GST):", `Rs.${Number(grandTotal).toFixed(2)}`, is58mm ? 16 : 24));
  bytes.push(0x1B, 0x21, 0x00);

  pushLine(doubleDivider);

  // Payment Mode & Footer
  bytes.push(0x1B, 0x61, 0x01); // Center
  pushLine(`Payment Mode: ${paymentMethod}`);
  pushLine();
  pushLine("Thank You. Stay Healthy!");
  pushLine("MADRAS ORTHO CLINIC SOFTWARE");
  pushLine("Mission for Cure");
  pushLine();

  // Paper feed: 4 lines
  bytes.push(0x1B, 0x64, 0x04);

  // Paper cut command: GS V 66 0 (Full/Partial Cut)
  bytes.push(0x1D, 0x56, 0x42, 0x00);

  return new Uint8Array(bytes);
}
