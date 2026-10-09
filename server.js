import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { registerProductionModule } from "./server/production.js";
import {
  createFfbReceiptHandler,
  registerLogisticsModule,
} from "./server/logistics.js";
import { registerPurchaseContractsModule } from "./server/purchaseContracts.js";
import {
  registerPurchasingModule,
  createDraftPurchaseInvoiceForFfbReceipt,
} from "./server/purchases.js";
import { registerSalesInvoicesModule } from "./server/salesInvoices.js";
import { registerPaymentsModule } from "./server/payments.js";
import { registerDispatchModule } from "./server/dispatch.js";
import { registerNotificationModule } from "./server/notifications.js";

const hasCompletedFfbGrading = (receipt) => {
  if (receipt.state === "GRADING_COMPLETED") return true;
  if (receipt.state === "READY_TO_POST") return false;
  if (!receipt.grading_id || !receipt.grading_parameters_json) return false;
  try {
    const parameters = JSON.parse(receipt.grading_parameters_json);
    return (
      Number.isFinite(Number(parameters.ripe)) && Number(parameters.ripe) >= 0
    );
  } catch {
    return false;
  }
};

const db = new Database(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "rockeye.sqlite"),
);
db.pragma("journal_mode = WAL");
db.exec(`CREATE TABLE IF NOT EXISTS receiving (id TEXT PRIMARY KEY, supplier TEXT NOT NULL, vehicle TEXT NOT NULL, net REAL NOT NULL, status TEXT NOT NULL, time TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS stock (id INTEGER PRIMARY KEY AUTOINCREMENT, material TEXT NOT NULL, location TEXT NOT NULL, balance REAL NOT NULL, state TEXT NOT NULL, trend TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS quality (id TEXT PRIMARY KEY, source TEXT NOT NULL, parameter TEXT NOT NULL, result TEXT NOT NULL, status TEXT NOT NULL, due TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS dispatch (id TEXT PRIMARY KEY, material TEXT NOT NULL, customer TEXT NOT NULL, quantity REAL NOT NULL, status TEXT NOT NULL, time TEXT NOT NULL);`);
db.exec(
  `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, phone TEXT NOT NULL, group_name TEXT NOT NULL, status TEXT NOT NULL, avatar TEXT, add_date TEXT NOT NULL, modify_date TEXT, language TEXT NOT NULL DEFAULT 'English');`,
);
db.exec(
  `CREATE TABLE IF NOT EXISTS sales_contracts (id INTEGER PRIMARY KEY AUTOINCREMENT, contract_number TEXT NOT NULL UNIQUE, title TEXT NOT NULL, contract_type TEXT NOT NULL, signing_date TEXT NOT NULL, valid_from TEXT NOT NULL, valid_until TEXT NOT NULL, buyer_reference TEXT, customer TEXT NOT NULL, representative TEXT, email TEXT, phone TEXT, legal_address TEXT, currency TEXT NOT NULL, incoterm TEXT NOT NULL, discharge_port TEXT, payment_mode TEXT, bank TEXT, payment_terms TEXT, products_json TEXT NOT NULL, terms TEXT, documents_json TEXT, state TEXT NOT NULL DEFAULT 'DRAFT', created_at TEXT NOT NULL);`,
);
db.exec(
  `CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_code TEXT NOT NULL UNIQUE, legal_name TEXT NOT NULL, display_name TEXT, registration_no TEXT, incorporation_date TEXT, website TEXT, email TEXT, customer_origin TEXT NOT NULL, business_classification TEXT NOT NULL, customer_group TEXT NOT NULL, business_description TEXT, contacts_json TEXT NOT NULL, addresses_json TEXT NOT NULL, commercial_json TEXT NOT NULL, products_json TEXT NOT NULL, credit_applicable INTEGER NOT NULL DEFAULT 0, documents_json TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Active', created_at TEXT NOT NULL);`,
);
db.exec(
  `CREATE TABLE IF NOT EXISTS suppliers (id INTEGER PRIMARY KEY AUTOINCREMENT, supplier_code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, category TEXT NOT NULL, supplier_group TEXT NOT NULL, contact_person TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL, location TEXT NOT NULL, payment_terms TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Active');`,
);
db.exec(
  `CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, item_code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, category TEXT NOT NULL, unit TEXT NOT NULL, reorder_level REAL, location TEXT, status TEXT NOT NULL DEFAULT 'Active', created_at TEXT NOT NULL);`,
);
db.exec(
  `CREATE TABLE IF NOT EXISTS ffb_receipts (id INTEGER PRIMARY KEY AUTOINCREMENT, ticket_no TEXT NOT NULL UNIQUE, vehicle_no TEXT NOT NULL, vehicle_type TEXT NOT NULL, driver_name TEXT, driver_phone TEXT, delivery_order TEXT, supplier TEXT NOT NULL, supplier_plant TEXT, supplier_category TEXT, transporter TEXT, product_type TEXT NOT NULL DEFAULT 'FFB', gross_weight REAL NOT NULL, tare_weight REAL, net_weight REAL, weight_uom TEXT NOT NULL DEFAULT 'MT', operator_name TEXT NOT NULL, entry_at TEXT NOT NULL, grading_id TEXT UNIQUE, ripeness TEXT, ramp TEXT, grader_name TEXT, grading_result TEXT, accepted_qty REAL, rejected_qty REAL, rejection_reason TEXT, exit_at TEXT, state TEXT NOT NULL DEFAULT 'FIRST_WEIGHT_RECORDED', created_at TEXT NOT NULL);`,
);
for (const column of [
  "item_type TEXT NOT NULL DEFAULT 'FFB'",
  "stock_unit TEXT NOT NULL DEFAULT 'MT'",
  "max_stock REAL",
  "lead_time_days INTEGER",
  "storage_condition TEXT NOT NULL DEFAULT 'Covered / Dry'",
  "tracking_method TEXT NOT NULL DEFAULT 'Batch / Lot'",
  "quality_inspection INTEGER NOT NULL DEFAULT 1",
  "specification TEXT NOT NULL DEFAULT ''",
]) {
  try {
    db.exec(`ALTER TABLE items ADD COLUMN ${column}`);
  } catch {}
}
for (const column of [
  "receipt_code TEXT",
  "remarks TEXT NOT NULL DEFAULT ''",
  "attachments_json TEXT NOT NULL DEFAULT '[]'",
  "supplier_declared_qty REAL",
  "grading_parameters_json TEXT NOT NULL DEFAULT '{}'",
  "purchase_invoice_id INTEGER",
  "exit_remarks TEXT NOT NULL DEFAULT ''",
  "exit_attachments_json TEXT NOT NULL DEFAULT '[]'",
]) {
  try {
    db.exec(`ALTER TABLE ffb_receipts ADD COLUMN ${column}`);
  } catch {}
}
db.prepare(
  "UPDATE ffb_receipts SET receipt_code = 'RC-' || replace(substr(entry_at,1,10),'-','') || '-' || printf('%06d', id) WHERE receipt_code IS NULL OR receipt_code='' ",
).run();
try {
  db.exec(
    "ALTER TABLE suppliers ADD COLUMN details_json TEXT NOT NULL DEFAULT '{}'",
  );
} catch {}
const seed = (table, rows, sql) => {
  if (!db.prepare(`SELECT COUNT(*) count FROM ${table}`).get().count) {
    const insert = db.prepare(sql);
    rows.forEach((row) => insert.run(...row));
  }
};
seed(
  "receiving",
  [
    [
      "WB-260930-018",
      "Kampung Estate",
      "JQK 4812",
      18.42,
      "Accepted",
      "08:42 AM",
    ],
    [
      "WB-260930-017",
      "Sinar Jaya Trading",
      "BPM 9021",
      21.08,
      "Grading",
      "08:15 AM",
    ],
    [
      "WB-260930-016",
      "Bukit Sawit Estate",
      "VBT 7730",
      16.75,
      "Accepted",
      "07:49 AM",
    ],
    [
      "WB-260930-015",
      "Maju Bersama",
      "JQN 1008",
      19.31,
      "Partial reject",
      "07:22 AM",
    ],
    [
      "WB-260930-014",
      "Kampung Estate",
      "JQK 4812",
      20.06,
      "Accepted",
      "06:58 AM",
    ],
  ],
  "INSERT INTO receiving VALUES (?, ?, ?, ?, ?, ?)",
);
seed(
  "stock",
  [
    ["CPO", "CPO Tank 01", 486.2, "Released", "+4.8%"],
    ["Palm Kernel", "Kernel Silo", 128.7, "Released", "+2.1%"],
    ["EFB", "EFB Storage", 214.8, "Available", "+8.4%"],
    ["Shell", "Shell Storage", 74.5, "Available", "-1.7%"],
  ],
  "INSERT INTO stock (material, location, balance, state, trend) VALUES (?, ?, ?, ?, ?)",
);
seed(
  "quality",
  [
    ["QS-260930-041", "Pure Oil Tank", "FFA", "3.42 %", "Pass", "09:00 AM"],
    ["QS-260930-040", "CPO Tank 01", "Moisture", "0.21 %", "Pass", "08:30 AM"],
    ["QS-260930-039", "Press Line 01", "Dirt", "0.09 %", "Review", "08:00 AM"],
  ],
  "INSERT INTO quality VALUES (?, ?, ?, ?, ?, ?)",
);
seed(
  "dispatch",
  [
    [
      "DSP-260930-006",
      "Palm Kernel",
      "Golden Oils Sdn Bhd",
      24,
      "Awaiting approval",
      "Today, 09:15",
    ],
    [
      "DSP-260930-005",
      "CPO",
      "Pacific Refinery",
      28.5,
      "Loading",
      "Today, 08:50",
    ],
    [
      "DSP-260929-021",
      "Shell",
      "BioFuel Partners",
      12,
      "Completed",
      "Yesterday",
    ],
  ],
  "INSERT INTO dispatch VALUES (?, ?, ?, ?, ?, ?)",
);
seed(
  "users",
  [
    [
      "Herry Roy",
      "herry.roy@yopmail.com",
      "(+1)-345678",
      "Company Admin",
      "Active",
      "A",
      "28/04/2026 07:30 AM",
      null,
      "English",
    ],
    [
      "Adam Hemsworth",
      "adam01@yopmail.com",
      "(+234)-8736743722",
      "Company Admin",
      "Active",
      null,
      "28/04/2026 07:30 AM",
      null,
      "English",
    ],
    [
      "Aldren John",
      "aldren.john@yopmail.com",
      "(+234)-123456788",
      "Sales Executive",
      "Active",
      "A",
      "28/04/2026 07:30 AM",
      null,
      "English",
    ],
    [
      "Aldren Mark",
      "aldren.mark@yopmail.com",
      "(+234)-7865457",
      "Company Admin",
      "Active",
      null,
      "28/04/2026 07:30 AM",
      null,
      "English",
    ],
    [
      "Aldren John",
      "aldren11@yopmail.com",
      "(+234)-67890097544",
      "Company Admin",
      "Active",
      "A",
      "28/04/2026 07:30 AM",
      null,
      "English",
    ],
    [
      "Allen",
      "allen01@yopmail.com",
      "(+234)-9856253514",
      "Company Admin",
      "Active",
      null,
      "28/04/2026 07:30 AM",
      null,
      "English",
    ],
    [
      "Allen Wesley",
      "allen@yopmail.com",
      "(+234)-8575965415",
      "Company Admin",
      "Active",
      null,
      "28/04/2026 07:30 AM",
      null,
      "English",
    ],
  ],
  "INSERT INTO users (name, email, phone, group_name, status, avatar, add_date, modify_date, language) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
);
db.prepare(
  "UPDATE users SET group_name = 'Mill Admin' WHERE group_name = 'Company Admin'",
).run();
db.prepare(
  "UPDATE users SET group_name = 'Production Admin' WHERE group_name = 'Sales Executive'",
).run();
db.prepare(
  "UPDATE users SET phone = REPLACE(REPLACE(phone, '(+1)-', '+60-'), '(+234)-', '+60-') WHERE phone NOT LIKE '+60-%'",
).run();
const additionalMalaysiaUsers = [
  ["Nur Aisyah Binti Rahman", "nur.aisyah@rockeye.my", "+60-12-684-2190", "Sales Manager", "Active", "N", "08/10/2026 09:10 AM", null, "English"],
  ["Farid Hakim bin Ismail", "farid.hakim@rockeye.my", "+60-17-742-5081", "Logistics Manager", "Active", "F", "08/10/2026 09:18 AM", null, "English"],
  ["Lim Wei Jian", "wei.jian@rockeye.my", "+60-16-338-7426", "Quality Manager", "Active", "L", "08/10/2026 09:25 AM", null, "English"],
  ["Kavitha Devi a/p Muthu", "kavitha.devi@rockeye.my", "+60-13-905-1174", "Sales Manager", "Active", "K", "08/10/2026 09:32 AM", null, "English"],
  ["Daniel Tan Wei Ming", "daniel.tan@rockeye.my", "+60-19-621-8840", "Logistics Manager", "Active", "D", "08/10/2026 09:40 AM", null, "English"],
];
const insertMalaysiaUser = db.prepare(
  "INSERT OR IGNORE INTO users (name, email, phone, group_name, status, avatar, add_date, modify_date, language) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
);
additionalMalaysiaUsers.forEach((user) => insertMalaysiaUser.run(...user));
seed(
  "sales_contracts",
  [
    [
      "SC-2026-0001",
      "Annual Bulk CPO Supply Master Agreement",
      "Master Agreement (Framework)",
      "2026-09-30",
      "2026-09-30",
      "2027-03-30",
      "PO-APEX-DXB-9921",
      "Apex Refineries (CUST-2026-001)",
      "Rashid Al-Falasi",
      "rashid.falasi@apexrefineries.ae",
      "+971 4 881 2900",
      "Level 14, Reef Tower, JLT Cluster O, PO Box 39281, Dubai, UAE",
      "USD - US Dollar ($)",
      "FOB Dumai Terminal",
      "Dumai Port (IDDUM) — Indonesia",
      "Letter of Credit (LC)",
      "Standard Chartered Bank",
      "LC-SIGHT: 100% Irrevocable LC at Sight from Prime International Bank (0 days credit)",
      JSON.stringify([
        {
          product: "Crude Palm Oil (CPO - FFA < 4.5%)",
          quantity: 5000,
          unitPrice: 945,
          ffa: "4.50",
          moisture: "0.25",
          dirt: "0.02",
          dobi: "2.30",
          certification: "RSPO Mass Balance",
          documents: ["Certificate of Analysis (COA) Schedule"],
        },
        {
          product: "Palm Kernel (PK - Moisture < 7%)",
          quantity: 1000,
          unitPrice: 520,
          ffa: "2.00",
          moisture: "7.00",
          dirt: "2.50",
          dobi: "",
          certification: "MSPO Certified",
          documents: [],
        },
      ]),
      "All physical deliveries under this overarching Sales Contract shall conform to standard PORAM / FOSFA contract rules. Independent surveyor certification by SGS / Intertek applies to moisture, FFA, and contracted technical specifications.",
      JSON.stringify([
        {
          title: "Signed Master Commercial Supply Framework",
          type: "Signed Contract",
          file: "SC_Master_Agreement_2026.pdf",
          size: "3.4 MB",
          date: "2026-09-30",
        },
      ]),
      "ACTIVE",
      "2026-09-30",
    ],
  ],
  "INSERT INTO sales_contracts (contract_number,title,contract_type,signing_date,valid_from,valid_until,buyer_reference,customer,representative,email,phone,legal_address,currency,incoterm,discharge_port,payment_mode,bank,payment_terms,products_json,terms,documents_json,state,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
);
seed(
  "customers",
  [
    [
      "CUST-2026-001",
      "Apex Refineries",
      "Apex Refineries (CUST-2026-001)",
      "",
      "2026-04-28",
      "https://apexrefineries.ae",
      "rashid.falasi@apexrefineries.ae",
      "Domestic",
      "Refinery",
      "External",
      "Refinery customer",
      JSON.stringify([
        {
          type: "Commercial",
          name: "Rashid Al-Falasi",
          designation: "Authorized Representative",
          email: "rashid.falasi@apexrefineries.ae",
          mobile: "+971 4 881 2900",
        },
      ]),
      JSON.stringify([
        {
          type: "Registered",
          country: "United Arab Emirates",
          state: "Dubai",
          city: "Dubai",
          line1:
            "Level 14, Reef Tower, JLT Cluster O, PO Box 39281, Dubai, UAE",
          line2: "",
        },
      ]),
      JSON.stringify({
        currency: "USD - US Dollar",
        taxCategory: "Standard",
        paymentTerms: "30 Days",
        paymentMode: "Bank Transfer / TT",
      }),
      JSON.stringify([
        {
          product: "Crude Palm Oil (CPO)",
          pricingMethod: "Fixed Price",
          price: "0.00",
          uom: "MT (Metric Tonne)",
          deliveryTerm: "Mill Gate (EXW)",
        },
      ]),
      0,
      JSON.stringify([]),
      "Active",
      "2026-09-30",
    ],
  ],
  "INSERT INTO customers (customer_code,legal_name,display_name,registration_no,incorporation_date,website,email,customer_origin,business_classification,customer_group,business_description,contacts_json,addresses_json,commercial_json,products_json,credit_applicable,documents_json,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
);
const benchmarkCustomerProducts = [
  {
    product: "Crude Palm Oil (CPO)",
    pricingMethod: "Fixed Price",
    price: "925.00",
    uom: "MT",
    deliveryTerm: "Delivered to Mill (DAP)",
  },
  {
    product: "Palm Kernel (PK)",
    pricingMethod: "Fixed Price",
    price: "545.00",
    uom: "MT",
    deliveryTerm: "Delivered to Mill (DAP)",
  },
];
db.prepare(
  "INSERT OR IGNORE INTO customers (customer_code,legal_name,display_name,registration_no,incorporation_date,website,email,customer_origin,business_classification,customer_group,business_description,contacts_json,addresses_json,commercial_json,products_json,credit_applicable,documents_json,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
).run(
  "CUST-2026-012",
  "Straits Palm Refining Sdn. Bhd.",
  "Straits Palm Refining",
  "201901045678",
  "2019-12-04",
  "https://www.straitspalmrefining.my",
  "procurement@straitspalmrefining.my",
  "International",
  "Refinery",
  "External",
  "Malaysian palm oil refinery and bulk commodity buyer.",
  JSON.stringify([
    {
      type: "Commercial",
      name: "Faridah Rahman",
      designation: "Procurement Director",
      email: "faridah.rahman@straitspalmrefining.my",
      mobile: "+60 12 778 4012",
    },
  ]),
  JSON.stringify([
    {
      type: "Delivery",
      country: "Malaysia",
      state: "Johor",
      city: "Pasir Gudang",
      line1: "Lot 27, Jalan Pelabuhan Tanjung Langsat, 81700 Pasir Gudang",
      line2: "",
    },
    {
      type: "Billing",
      country: "Malaysia",
      state: "Johor",
      city: "Johor Bahru",
      line1: "Level 18, Menara Straits, Jalan Wong Ah Fook, 80000 Johor Bahru",
      line2: "",
    },
  ]),
  JSON.stringify({
    currency: "USD - US Dollar",
    taxCategory: "Standard",
    paymentTerms: "30 Days",
    paymentMode: "Letter of Credit (LC)",
  }),
  JSON.stringify(benchmarkCustomerProducts),
  0,
  JSON.stringify([]),
  "Active",
  "2026-10-07",
);
db.prepare(
  "INSERT OR IGNORE INTO sales_contracts (contract_number,title,contract_type,signing_date,valid_from,valid_until,buyer_reference,customer,representative,email,phone,legal_address,currency,incoterm,discharge_port,payment_mode,bank,payment_terms,products_json,terms,documents_json,state,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
).run(
  "SC-2026-0012",
  "Straits Palm Refining Annual CPO & PK Supply Agreement",
  "Annual Supply Agreement",
  "2026-10-07",
  "2026-10-07",
  "2027-10-06",
  "SPR-PO-2026-1007",
  "Straits Palm Refining",
  "Faridah Rahman",
  "procurement@straitspalmrefining.my",
  "+60 12 778 4012",
  "Level 18, Menara Straits, Jalan Wong Ah Fook, 80000 Johor Bahru, Malaysia",
  "USD - US Dollar ($)",
  "DAP Pasir Gudang Refinery",
  "Pasir Gudang Terminal, Johor, Malaysia",
  "Letter of Credit (LC)",
  "Maybank Berhad",
  "LC at sight, documents against payment",
  JSON.stringify([
    {
      product: "Crude Palm Oil (CPO)",
      quantity: 100000,
      unitPrice: 925,
      ffa: "4.50",
      moisture: "0.25",
      dirt: "0.02",
      dobi: "2.30",
      certification: "MSPO / RSPO Mass Balance",
      documents: [],
    },
    {
      product: "Palm Kernel (PK)",
      quantity: 50000,
      unitPrice: 545,
      ffa: "2.00",
      moisture: "7.00",
      dirt: "2.50",
      dobi: "",
      certification: "MSPO Certified",
      documents: [],
    },
  ]),
  "Deliveries shall be scheduled against approved delivery requests. Quality, weighing, loading and acceptance remain subject to mill procedures and the agreed product specifications.",
  JSON.stringify([
    {
      title: "Signed CPO & PK Supply Agreement",
      type: "Signed Contract",
      file: "SC-2026-0012-Straits-Palm-Agreement.pdf",
      size: "2.8 MB",
      date: "2026-10-07",
    },
  ]),
  "ACTIVE",
  "2026-10-07",
);
if (db.prepare("SELECT COUNT(*) count FROM customers").get().count < 11) {
  const addCustomer = db.prepare(
    "INSERT OR IGNORE INTO customers (customer_code,legal_name,display_name,registration_no,incorporation_date,website,email,customer_origin,business_classification,customer_group,business_description,contacts_json,addresses_json,commercial_json,products_json,credit_applicable,documents_json,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
  );
  [
    [
      "CUST-2026-002",
      "ABC Palm Oils",
      "ABC Palm Oils",
      "",
      "",
      "",
      "commercial@abcpalmoils.com.my",
      "Domestic",
      "Refinery",
      "External",
      "",
      "Dato Rashid Ahmad",
      "Kuala Lumpur",
      "Malaysia",
      "+60 12 399 8822",
      "USD",
      "USD 12,000,000",
    ],
    [
      "CUST-2026-003",
      "BioGreen Nusantara",
      "BioGreen Nusantara",
      "",
      "",
      "",
      "contact@biogreen.co.id",
      "International",
      "Biofuel Producer",
      "External",
      "Biodiesel producer",
      "Budi Santoso",
      "Jakarta Selatan",
      "Indonesia",
      "+62 811 9876543",
      "IDR",
      "IDR 7,500,000,000",
    ],
    [
      "CUST-2026-004",
      "Sinarmas Agritech",
      "Sinarmas Agritech",
      "",
      "",
      "",
      "info@sinarmasagritech.com",
      "International",
      "Export Trader",
      "Internal",
      "",
      "Marcus Tan",
      "Singapore",
      "Singapore",
      "+65 9123 4567",
      "USD",
      "—",
    ],
    [
      "CUST-2026-005",
      "Kencana Agro",
      "Kencana Agro",
      "",
      "",
      "",
      "procurement@kencanaagro.com.my",
      "Domestic",
      "Refinery",
      "External",
      "",
      "Tan Sri Henry Lim",
      "Pasir Gudang",
      "Malaysia",
      "+60 17 882 1199",
      "USD",
      "—",
    ],
    [
      "CUST-2026-006",
      "Wilmar Bio-Commodities",
      "Wilmar Bio-Commodities",
      "",
      "",
      "",
      "cpo.desk@wilmar.com.sg",
      "International",
      "Export Trader",
      "External",
      "",
      "Cheng Wei Lin",
      "Singapore",
      "Singapore",
      "+65 9811 0022",
      "USD",
      "USD 25,000,000",
    ],
    [
      "CUST-2026-007",
      "IOI Edible Oils",
      "IOI Edible Oils",
      "",
      "",
      "",
      "palm.procurement@ioigroup.com",
      "Domestic",
      "Refinery",
      "External",
      "",
      "",
      "",
      "+60 3 8947 8888",
      "USD",
      "USD 10,000,000",
    ],
    [
      "CUST-2026-008",
      "Sime Darby Oils",
      "Sime Darby Oils",
      "",
      "",
      "",
      "trading@simedarbyoils.com",
      "Domestic",
      "Refinery",
      "External",
      "",
      "",
      "",
      "+60 3 7848 4000",
      "USD",
      "USD 15,000,000",
    ],
    [
      "CUST-2026-009",
      "Cargill Palm",
      "Cargill Palm",
      "",
      "",
      "",
      "procurement_my@cargill.com",
      "Domestic",
      "Refinery",
      "External",
      "",
      "",
      "",
      "+60 3 2246 3000",
      "USD",
      "USD 20,000,000",
    ],
    [
      "CUST-2026-010",
      "Mewah Oils",
      "Mewah Oils",
      "",
      "",
      "",
      "terminal.procure@mewahgroup.com",
      "Domestic",
      "Refinery",
      "External",
      "",
      "",
      "",
      "+60 7 251 2299",
      "USD",
      "USD 8,000,000",
    ],
    [
      "CUST-2026-011",
      "Musim Mas Oleo",
      "Musim Mas Oleo",
      "",
      "",
      "",
      "rawmaterials@musimmas.com",
      "International",
      "Chemical Processor",
      "External",
      "",
      "",
      "",
      "+62 61 687 1122",
      "USD",
      "USD 18,000,000",
    ],
  ].forEach(
    ([
      code,
      legal,
      display,
      _r,
      _inc,
      _web,
      email,
      origin,
      classif,
      group,
      desc,
      contact,
      city,
      country,
      phone,
      currency,
      credit,
    ]) =>
      addCustomer.run(
        code,
        legal,
        display,
        "",
        "",
        "",
        email,
        origin,
        classif,
        group,
        desc,
        JSON.stringify(
          contact ? [{ type: "Commercial", name: contact, mobile: phone }] : [],
        ),
        JSON.stringify(
          city
            ? [
                {
                  type: "Registered",
                  country,
                  state: "",
                  city,
                  line1: "",
                  line2: "",
                },
              ]
            : [],
        ),
        JSON.stringify({
          currency,
          creditLimit: credit,
          taxCategory: "Standard",
          paymentTerms: "30 Days",
          paymentMode: "Bank Transfer / TT",
        }),
        JSON.stringify([
          {
            product: "Crude Palm Oil (CPO)",
            pricingMethod: "Fixed Price",
            price: "0.00",
            uom: "MT (Metric Tonne)",
            deliveryTerm: "Mill Gate (EXW)",
          },
        ]),
        0,
        JSON.stringify([]),
        "Active",
        "2026-09-30",
      ),
  );
}
if (!db.prepare("SELECT COUNT(*) count FROM suppliers").get().count) {
  const addSupplier = db.prepare(
    "INSERT INTO suppliers (supplier_code,name,category,supplier_group,contact_person,phone,email,location,payment_terms,status) VALUES (?,?,?,?,?,?,?,?,?,?)",
  );
  [
    [
      "VND-2026-001",
      "Sawit Makmur Plantation Koperasi",
      "FFB Supplier (Estate)",
      "External",
      "Hâji Ahmad Dahlan",
      "+62 812 7788990",
      "ahmad.dahlan@sawitmakmur.co.id",
      "Dumai, Indonesia",
      "Weekly Cash",
      "Active",
    ],
    [
      "VND-2026-002",
      "Southern Agro Logistics Bhd",
      "Logistics & CPO Tanker Fleet",
      "External",
      "Lim Boon Keng",
      "+60 12 345 6789",
      "bk.lim@southernagro.com.my",
      "Pasir Gudang, Malaysia",
      "30 Days",
      "Active",
    ],
    [
      "VND-2026-003",
      "Industrial Spares & Mill Engineering FZE",
      "Mill Machinery & Spare Parts",
      "Internal",
      "Tariq Mansoor",
      "+971 50 889 1234",
      "tariq.mansoor@millspares.ae",
      "Dubai, United Arab Emirates",
      "45 Days",
      "Active",
    ],
  ].forEach((row) => addSupplier.run(...row));
}
if (!db.prepare("SELECT COUNT(*) count FROM items").get().count) {
  const addItem = db.prepare(
    "INSERT INTO items (item_code,name,category,unit,reorder_level,location,status,created_at) VALUES (?,?,?,?,?,?,?,?)",
  );
  [
    [
      "RM-CPO-001",
      "Crude Palm Oil",
      "Raw Material",
      "MT",
      100,
      "CPO Tank 01",
      "Active",
    ],
    [
      "RM-PK-001",
      "Palm Kernel",
      "Raw Material",
      "MT",
      40,
      "Kernel Silo",
      "Active",
    ],
    [
      "BY-EFB-001",
      "Empty Fruit Bunches (EFB)",
      "Raw Material",
      "MT",
      25,
      "EFB Storage",
      "Active",
    ],
    [
      "UT-SHL-001",
      "Palm Kernel Shell",
      "Fuel & Utility",
      "MT",
      20,
      "Shell Storage",
      "Active",
    ],
    [
      "CH-CAU-001",
      "Caustic Soda Flakes",
      "Chemical",
      "KG",
      500,
      "Chemical Store",
      "Active",
    ],
    [
      "SP-BRG-001",
      "Press Bearing Set",
      "Spare Part",
      "Sets",
      2,
      "Maintenance Store",
      "Active",
    ],
  ].forEach((row) =>
    addItem.run(...row, new Date().toISOString().slice(0, 10)),
  );
}
db.prepare(
  "INSERT OR IGNORE INTO items (item_code,name,category,unit,reorder_level,location,status,created_at) VALUES (?,?,?,?,?,?,?,?)",
).run(
  "RM-FFB-001",
  "Fresh Fruit Bunches",
  "Raw Material",
  "MT",
  100,
  "FFB Ramp",
  "Active",
  new Date().toISOString().slice(0, 10),
);
// Core receiving master: keep the configured FFB item available on fresh
// environments without creating duplicates in an existing tenant database.
db.prepare(
  "INSERT OR IGNORE INTO items (item_code,name,category,item_type,unit,stock_unit,reorder_level,max_stock,lead_time_days,location,storage_condition,tracking_method,quality_inspection,specification,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
).run(
  "FFB",
  "Fresh Fruit Bunch (FFB)",
  "Raw Material",
  "FFB",
  "MT",
  "MT",
  null,
  null,
  null,
  "Outdoor",
  "Outdoor",
  "Batch / Lot",
  1,
  "",
  "Active",
  new Date().toISOString().slice(0, 10),
);
db.prepare(
  "UPDATE items SET item_type = CASE WHEN name LIKE '%Palm Oil%' THEN 'CPO' WHEN name LIKE '%Kernel%' THEN 'Palm Kernel' WHEN name LIKE '%EFB%' THEN 'EFB' WHEN name LIKE '%Shell%' THEN 'PKS / Fiber' WHEN category = 'Chemical' THEN 'Chemical' WHEN category LIKE '%Spare%' THEN 'Spare Part' ELSE item_type END, stock_unit = unit WHERE item_type = 'FFB'",
).run();
const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));
registerProductionModule(app, db);
registerLogisticsModule(app, db);
registerPurchaseContractsModule(app, db);
registerPurchasingModule(app, db);
registerSalesInvoicesModule(app, db);
registerPaymentsModule(app, db);
registerDispatchModule(app, db);
registerNotificationModule(app, db);
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, database: "sqlite" }),
);
app.get("/api/dashboard", (_req, res) =>
  res.json({
    kpis: [
      {
        label: "FFB Received",
        value: db
          .prepare(
            "SELECT COALESCE(SUM(net),0) value FROM receiving WHERE status != 'Partial reject'",
          )
          .get().value,
        unit: "t",
        change: "+12.4%",
        tone: "red",
        icon: "↗",
      },
      {
        label: "CPO Produced",
        value: 64.8,
        unit: "t",
        change: "+8.2%",
        tone: "green",
        icon: "◉",
      },
      {
        label: "Mill Utilization",
        value: 82.4,
        unit: "%",
        change: "+4.1%",
        tone: "blue",
        icon: "↗",
      },
      {
        label: "Quality Samples",
        value: db
          .prepare("SELECT COUNT(*) value FROM quality WHERE status = 'Review'")
          .get().value,
        unit: "pending",
        change: "-3",
        tone: "amber",
        icon: "✓",
      },
    ],
    receiving: db
      .prepare("SELECT * FROM receiving ORDER BY rowid DESC LIMIT 5")
      .all(),
    stock: db.prepare("SELECT * FROM stock ORDER BY id").all(),
    quality: db.prepare("SELECT * FROM quality ORDER BY rowid DESC").all(),
    dispatch: db.prepare("SELECT * FROM dispatch ORDER BY rowid DESC").all(),
    users: db.prepare("SELECT * FROM users ORDER BY id").all(),
  }),
);
for (const table of ["receiving", "stock", "quality", "dispatch", "users"])
  app.get(`/api/${table}`, (_req, res) =>
    res.json(db.prepare(`SELECT * FROM ${table} ORDER BY rowid DESC`).all()),
  );
app.get("/api/sales-contracts", (_req, res) =>
  res.json(
    db
      .prepare("SELECT * FROM sales_contracts ORDER BY id DESC")
      .all()
      .map((contract) => ({
        ...contract,
        products: JSON.parse(contract.products_json),
        documents: JSON.parse(contract.documents_json || "[]"),
      })),
  ),
);
app.get("/api/customers", (_req, res) =>
  res.json(
    db
      .prepare("SELECT * FROM customers ORDER BY id DESC")
      .all()
      .map((customer) => ({
        ...customer,
        contacts: JSON.parse(customer.contacts_json),
        addresses: JSON.parse(customer.addresses_json),
        commercial: JSON.parse(customer.commercial_json),
        products: JSON.parse(customer.products_json),
        documents: JSON.parse(customer.documents_json || "[]"),
      })),
  ),
);
app.get("/api/suppliers", (req, res) => {
  const tenantId = req.get("X-Tenant-Id") || "demo-tenant";
  const millId = req.get("X-Mill-Id") || "demo-mill";
  const invoiceRows = db.prepare(
    "SELECT i.*, COALESCE(d.purchase_number, i.source_type || ' #' || i.source_id) purchase_number FROM purchase_invoices i LEFT JOIN direct_purchases d ON d.id=i.source_id AND i.source_type='DIRECT_PURCHASE' WHERE i.tenant_id=? AND i.mill_id=? AND i.supplier_id=? ORDER BY i.id DESC",
  );
  const deliveryRows = db.prepare(
    "SELECT id,ticket_no,entry_at,vehicle_no,product_type,gross_weight,tare_weight,net_weight,supplier_category,state,purchase_invoice_id FROM ffb_receipts WHERE supplier=? AND state IN ('READY_TO_POST','POSTED') ORDER BY id DESC",
  );
  res.json(
    db
      .prepare("SELECT * FROM suppliers ORDER BY id")
      .all()
      .map((supplier) => ({
        ...supplier,
        details: JSON.parse(supplier.details_json || "{}"),
        deliveries: deliveryRows.all(supplier.name),
        purchaseInvoices: invoiceRows.all(tenantId, millId, supplier.id),
      })),
  );
});
app.get("/api/items", (_req, res) =>
  res.json(db.prepare("SELECT * FROM items ORDER BY id DESC").all()),
);
app.get("/api/ffb-receiving", (_req, res) =>
  res.json(
    db
      .prepare(
        "SELECT r.*, i.invoice_number AS purchase_invoice_number, i.status AS purchase_invoice_status FROM ffb_receipts r LEFT JOIN purchase_invoices i ON i.id=r.purchase_invoice_id ORDER BY r.id DESC",
      )
      .all(),
  ),
);
app.post("/api/ffb-receiving", createFfbReceiptHandler(db));
app.post("/api/ffb-receiving/:id/grading", (req, res) => {
  const receipt = db
    .prepare("SELECT * FROM ffb_receipts WHERE id=?")
    .get(req.params.id);
  if (!receipt)
    return res
      .status(404)
      .json({
        code: "TICKET_NOT_FOUND",
        message: "Weighbridge ticket not found.",
      });
  if (receipt.state !== "FIRST_WEIGHT_RECORDED")
    return res
      .status(409)
      .json({
        code: "INVALID_STATE_TRANSITION",
        message: "This ticket is not awaiting grading.",
      });
  const keys = [
    "unripe",
    "overripe",
    "ripe",
    "underRipe",
    "rotten",
    "emptyBunch",
    "dirtyContaminated",
    "old",
    "dura",
    "longStalk",
    "wetWeight",
  ];
  const grading = Object.fromEntries(
    keys.map((key) => [
      key,
      req.body.gradingParameters?.[key] === "" ||
      req.body.gradingParameters?.[key] == null
        ? null
        : Number(req.body.gradingParameters[key]),
    ]),
  );
  if (
    !Number.isFinite(grading.ripe) ||
    grading.ripe < 0 ||
    keys.some(
      (key) =>
        grading[key] !== null &&
        (!Number.isFinite(grading[key]) || grading[key] < 0),
    )
  )
    return res
      .status(400)
      .json({
        code: "INVALID_GRADING_PARAMETERS",
        message:
          "Ripe is required and all entered grading parameters must be zero or greater.",
      });
  const gradingId = `GR-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  db.prepare(
    "UPDATE ffb_receipts SET grading_id=?,ripeness=?,ramp=?,grader_name=?,grading_result=?,grading_parameters_json=?,remarks=?,attachments_json=?,state=? WHERE id=?",
  ).run(
    gradingId,
    `${grading.ripe}% ripe`,
    req.body.ramp || null,
    "Sean Shapiro",
    req.body.gradingResult || "Pending Vehicle Exit",
    JSON.stringify(grading),
    req.body.remarks || "",
    JSON.stringify(Array.isArray(req.body.attachments) ? req.body.attachments : []),
    "GRADING_COMPLETED",
    receipt.id,
  );
  res.json(db.prepare("SELECT * FROM ffb_receipts WHERE id=?").get(receipt.id));
});
app.post("/api/ffb-receiving/:id/vehicle-exit", (req, res) => {
  const receipt = db
    .prepare("SELECT * FROM ffb_receipts WHERE id=?")
    .get(req.params.id);
  if (!receipt)
    return res
      .status(404)
      .json({
        code: "TICKET_NOT_FOUND",
        message: "Weighbridge ticket not found.",
      });
  if (!hasCompletedFfbGrading(receipt))
    return res
      .status(409)
      .json({
        code: "INVALID_STATE_TRANSITION",
        message: "Complete grading before vehicle exit.",
      });
  const tare = Number(req.body.tareWeight);
  if (!Number.isFinite(tare) || tare <= 0)
    return res
      .status(400)
      .json({
        code: "INVALID_TARE",
        message: "Tare weight must be greater than zero.",
      });
  const net = Number((receipt.gross_weight - tare).toFixed(3));
  if (receipt.gross_weight < tare || net <= 0)
    return res
      .status(400)
      .json({
        code: "INVALID_NET_WEIGHT",
        message:
          "Gross weight must be greater than tare weight and net weight must be positive.",
      });
  const exitAttachments = Array.isArray(req.body.attachments)
    ? req.body.attachments
    : [];
  try {
    const result = db.transaction(() => {
      const stamp = new Date().toISOString();
      db.prepare(
        "UPDATE ffb_receipts SET tare_weight=?,net_weight=?,exit_at=?,operator_name=?,accepted_qty=?,rejected_qty=?,exit_remarks=?,exit_attachments_json=?,state=? WHERE id=?",
      ).run(
        tare,
        net,
        stamp,
        "Sean Shapiro",
        null,
        null,
        req.body.remarks || "",
        JSON.stringify(exitAttachments),
        "READY_TO_POST",
        receipt.id,
      );
      const updated = db
        .prepare("SELECT * FROM ffb_receipts WHERE id=?")
        .get(receipt.id);
      const invoice = createDraftPurchaseInvoiceForFfbReceipt(db, updated);
      db.prepare(
        "UPDATE ffb_receipts SET purchase_invoice_id=? WHERE id=?",
      ).run(invoice.id, receipt.id);
      return {
        receipt: db
          .prepare("SELECT * FROM ffb_receipts WHERE id=?")
          .get(receipt.id),
        invoice,
      };
    })();
    res.json({
      ...result.receipt,
      purchase_invoice_id: result.invoice.id,
      purchase_invoice_number: result.invoice.invoice_number,
      purchase_invoice_status: result.invoice.status,
    });
  } catch (error) {
    res
      .status(
        error.code === "SUPPLIER_NOT_FOUND" || error.code === "ITEM_NOT_FOUND"
          ? 400
          : 409,
      )
      .json({
        code: error.code || "VEHICLE_EXIT_POSTING_FAILED",
        message: error.message || "Unable to finalize vehicle exit.",
      });
  }
});
app.post("/api/items", (req, res) => {
  const body = req.body;
  if (
    !body.itemCode ||
    !body.name ||
    !body.category ||
    !body.unit ||
    !body.itemType
  )
    return res
      .status(400)
      .json({
        message:
          "Item code, name, type, category and inventory UOM are required.",
      });
  try {
    const info = db
      .prepare(
        "INSERT INTO items (item_code,name,category,item_type,unit,stock_unit,reorder_level,max_stock,lead_time_days,location,storage_condition,tracking_method,quality_inspection,specification,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      )
      .run(
        body.itemCode.trim(),
        body.name.trim(),
        body.category,
        body.itemType,
        body.unit,
        body.stockUnit || body.unit,
        body.reorderLevel === "" ? null : Number(body.reorderLevel),
        body.maxStock === "" ? null : Number(body.maxStock),
        body.leadTimeDays === "" ? null : Number(body.leadTimeDays),
        body.location || "",
        body.storageCondition || "Covered / Dry",
        body.trackingMethod || "Batch / Lot",
        body.qualityInspection ? 1 : 0,
        body.specification || "",
        body.status || "Active",
        new Date().toISOString().slice(0, 10),
      );
    res
      .status(201)
      .json(
        db.prepare("SELECT * FROM items WHERE id=?").get(info.lastInsertRowid),
      );
  } catch (error) {
    res
      .status(400)
      .json({
        message:
          error.code === "SQLITE_CONSTRAINT_UNIQUE"
            ? "Item code must be unique."
            : "Unable to save item.",
      });
  }
});
app.patch("/api/items/:id", (req, res) => {
  const body = req.body;
  if (
    !body.itemCode ||
    !body.name ||
    !body.category ||
    !body.unit ||
    !body.itemType
  )
    return res
      .status(400)
      .json({
        message:
          "Item code, name, type, category and inventory UOM are required.",
      });
  try {
    const info = db
      .prepare(
        "UPDATE items SET item_code=?,name=?,category=?,item_type=?,unit=?,stock_unit=?,reorder_level=?,max_stock=?,lead_time_days=?,location=?,storage_condition=?,tracking_method=?,quality_inspection=?,specification=?,status=? WHERE id=?",
      )
      .run(
        body.itemCode.trim(),
        body.name.trim(),
        body.category,
        body.itemType,
        body.unit,
        body.stockUnit || body.unit,
        body.reorderLevel === "" ? null : Number(body.reorderLevel),
        body.maxStock === "" ? null : Number(body.maxStock),
        body.leadTimeDays === "" ? null : Number(body.leadTimeDays),
        body.location || "",
        body.storageCondition || "Covered / Dry",
        body.trackingMethod || "Batch / Lot",
        body.qualityInspection ? 1 : 0,
        body.specification || "",
        body.status || "Active",
        req.params.id,
      );
    if (!info.changes)
      return res.status(404).json({ message: "Item not found." });
    res.json(db.prepare("SELECT * FROM items WHERE id=?").get(req.params.id));
  } catch (error) {
    res
      .status(400)
      .json({
        message:
          error.code === "SQLITE_CONSTRAINT_UNIQUE"
            ? "Item code must be unique."
            : "Unable to update item.",
      });
  }
});
app.delete("/api/items/:id", (req, res) => {
  const info = db.prepare("DELETE FROM items WHERE id=?").run(req.params.id);
  if (!info.changes)
    return res.status(404).json({ message: "Item not found." });
  res.status(204).end();
});
app.post("/api/suppliers", (req, res) => {
  const body = req.body;
  if (!body.supplierCode || !body.name) {
    return res
      .status(400)
      .json({ message: "Supplier code and supplier name are required." });
  }
  try {
    const primary =
      (body.contacts || []).find((contact) => contact.isPrimary) ||
      (body.contacts || [])[0] ||
      {};
    const location =
      (body.addresses || []).find((address) => address.isDefault) ||
      (body.addresses || [])[0] ||
      {};
    const info = db
      .prepare(
        "INSERT INTO suppliers (supplier_code,name,category,supplier_group,contact_person,phone,email,location,payment_terms,status,details_json) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
      )
      .run(
        body.supplierCode,
        body.name,
        body.category || "General Supplier",
        body.group || "External",
        primary.name || body.displayName || body.name,
        `${primary.mobileCode || "+60"} ${primary.mobile || body.phone || ""}`.trim(),
        body.companyEmail || "",
        [location.city, location.country].filter(Boolean).join(", ") ||
          "Not provided",
        body.paymentTerms || "30 Days",
        "Active",
        JSON.stringify(body),
      );
    res
      .status(201)
      .json({
        id: info.lastInsertRowid,
        supplier_code: body.supplierCode,
        name: body.name,
        category: body.category || "General Supplier",
        supplier_group: body.group || "External",
        contact_person: primary.name || body.displayName || body.name,
        phone:
          `${primary.mobileCode || "+60"} ${primary.mobile || body.phone || ""}`.trim(),
        email: body.companyEmail,
        location:
          [location.city, location.country].filter(Boolean).join(", ") ||
          "Not provided",
        payment_terms: body.paymentTerms || "30 Days",
        status: "Active",
      });
  } catch (error) {
    res
      .status(400)
      .json({
        message:
          error.code === "SQLITE_CONSTRAINT_UNIQUE"
            ? "Supplier code must be unique."
            : "Unable to save supplier.",
      });
  }
});
app.post("/api/customers", (req, res) => {
  const body = req.body;
  if (
    !body.customerCode ||
    !body.legalName ||
    !body.customerOrigin ||
    !body.businessClassification ||
    !body.customerGroup
  )
    return res
      .status(400)
      .json({
        message:
          "Customer code, legal name, origin, business classification and customer group are required.",
      });
  try {
    const info = db
      .prepare(
        "INSERT INTO customers (customer_code,legal_name,display_name,registration_no,incorporation_date,website,email,customer_origin,business_classification,customer_group,business_description,contacts_json,addresses_json,commercial_json,products_json,credit_applicable,documents_json,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      )
      .run(
        body.customerCode,
        body.legalName,
        body.displayName || "",
        body.registrationNo || "",
        body.incorporationDate || "",
        body.website || "",
        body.email || "",
        body.customerOrigin,
        body.businessClassification,
        body.customerGroup,
        body.businessDescription || "",
        JSON.stringify(body.contacts || []),
        JSON.stringify(body.addresses || []),
        JSON.stringify(body.commercial || {}),
        JSON.stringify(body.products || []),
        body.creditApplicable ? 1 : 0,
        JSON.stringify(body.documents || []),
        "Active",
        new Date().toISOString().slice(0, 10),
      );
    res
      .status(201)
      .json({ id: info.lastInsertRowid, ...body, status: "Active" });
  } catch (error) {
    res
      .status(400)
      .json({
        message:
          error.code === "SQLITE_CONSTRAINT_UNIQUE"
            ? "Customer code must be unique."
            : "Unable to save customer.",
      });
  }
});
app.post("/api/sales-contracts", (req, res) => {
  const body = req.body;
  if (
    !body.contractNumber ||
    !body.title ||
    !body.customer ||
    !body.validFrom ||
    !body.validUntil ||
    !body.products?.length
  )
    return res
      .status(400)
      .json({
        message:
          "Contract number, title, customer, validity dates and at least one product line are required.",
      });
  try {
    const info = db
      .prepare(
        "INSERT INTO sales_contracts (contract_number,title,contract_type,signing_date,valid_from,valid_until,buyer_reference,customer,representative,email,phone,legal_address,currency,incoterm,discharge_port,payment_mode,bank,payment_terms,products_json,terms,documents_json,state,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      )
      .run(
        body.contractNumber,
        body.title,
        body.contractType,
        body.signingDate,
        body.validFrom,
        body.validUntil,
        body.buyerReference || "",
        body.customer,
        body.representative || "",
        body.email || "",
        body.phone || "",
        body.legalAddress || "",
        body.currency,
        body.incoterm,
        body.dischargePort || "",
        body.paymentMode || "",
        body.bank || "",
        body.paymentTerms || "",
        JSON.stringify(body.products),
        body.terms || "",
        JSON.stringify(body.documents || []),
        "DRAFT",
        new Date().toISOString().slice(0, 10),
      );
    const row = db
      .prepare("SELECT * FROM sales_contracts WHERE id=?")
      .get(info.lastInsertRowid);
    res
      .status(201)
      .json({
        ...row,
        products: JSON.parse(row.products_json),
        documents: JSON.parse(row.documents_json || "[]"),
      });
  } catch (error) {
    res
      .status(400)
      .json({
        message:
          error.code === "SQLITE_CONSTRAINT_UNIQUE"
            ? "Contract number must be unique."
            : "Unable to save sales contract.",
      });
  }
});
app.post("/api/receiving", (req, res) => {
  const { supplier, vehicle, net, status = "Grading" } = req.body;
  if (
    !supplier ||
    !vehicle ||
    !Number.isFinite(Number(net)) ||
    Number(net) <= 0
  )
    return res
      .status(400)
      .json({
        message: "Supplier, vehicle and a positive net weight are required.",
      });
  const id = `WB-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(db.prepare("SELECT COUNT(*) count FROM receiving").get().count + 1).padStart(3, "0")}`;
  db.prepare("INSERT INTO receiving VALUES (?, ?, ?, ?, ?, ?)").run(
    id,
    supplier.trim(),
    vehicle.trim().toUpperCase(),
    Number(net),
    status,
    "Just now",
  );
  res
    .status(201)
    .json(db.prepare("SELECT * FROM receiving WHERE id = ?").get(id));
});
app.patch("/api/receiving/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM receiving WHERE id = ?")
    .get(req.params.id);
  if (!row)
    return res.status(404).json({ message: "Receiving record not found." });
  const status = req.body.status || row.status;
  db.prepare("UPDATE receiving SET status = ? WHERE id = ?").run(
    status,
    row.id,
  );
  res.json({ ...row, status });
});
const port = Number(process.env.PORT || 4000);
app.listen(port, () =>
  console.log(`ROCKEYE API listening on http://localhost:${port}`),
);
