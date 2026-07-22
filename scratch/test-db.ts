import { getDatabase } from '../src/server/database';

async function testDatabase() {
  console.log("==========================================");
  console.log("STARTING BACKEND DB & CALENDAR VERIFICATION");
  console.log("==========================================");

  try {
    const db = await getDatabase();
    console.log(`[PASS] DB connection successfully loaded. Engine fallbacks: ${db.isFallback ? 'JSON-File DB' : 'Native SQLite'}`);

    // Verify Product Seed
    const products = await db.all("SELECT * FROM products");
    if (products.length > 0) {
      console.log(`[PASS] Products table successfully formed and seeded with ${products.length} products.`);
    } else {
      throw new Error("Products table is empty!");
    }

    // Verify Monday-to-Sunday logic
    console.log("\nTesting Calendar Week Logic:");
    const testDates = [
      { date: "2026-05-29", expectedMon: "2026-05-25", expectedSun: "2026-05-31", note: "Friday (within week)" },
      { date: "2026-05-25", expectedMon: "2026-05-25", expectedSun: "2026-05-31", note: "Monday (start of week)" },
      { date: "2026-05-31", expectedMon: "2026-05-25", expectedSun: "2026-05-31", note: "Sunday (end of week)" }
    ];

    testDates.forEach(({ date, expectedMon, expectedSun, note }) => {
      const d = new Date(date);
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

      const monStr = toStr(monday);
      const sunStr = toStr(sunday);

      if (monStr === expectedMon && sunStr === expectedSun) {
        console.log(`[PASS] Date: ${date} (${note}) -> Mon: ${monStr}, Sun: ${sunStr} (Correct)`);
      } else {
        throw new Error(`Calendar failure for ${date}: Got Mon=${monStr}, Sun=${sunStr}; Expected Mon=${expectedMon}, Sun=${expectedSun}`);
      }
    });

    console.log("\n==========================================");
    console.log("VERIFICATION SUCCESSFUL: ALL CHECKS PASSED!");
    console.log("==========================================");
    
    // Close engine
    await db.close();
  } catch (err: any) {
    console.error("\n[FAIL] Verification encountered an error:", err.message);
    process.exit(1);
  }
}

testDatabase();
