import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const baseUrl = process.env.ROCKEYE_API_URL || "http://localhost:4000";
const headers = {
  "content-type": "application/json",
  "x-tenant-id": "demo-tenant",
  "x-mill-id": "demo-mill",
  "x-actor-id": "demo-user",
};

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path} ${response.status}: ${body?.message || text}`);
  return body;
}

const existingOrCreate = async (path, match, payload) => {
  const rows = await request(path);
  const existing = rows.find(match);
  return existing || request(path, { method: "POST", body: JSON.stringify(payload) });
};

// Migrate the original labels once so rerunning the seed does not leave
// customer-facing records containing the word "Sample".
const db = new Database(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "rockeye.sqlite"));
db.transaction(() => {
  db.prepare("UPDATE customers SET customer_code=?, legal_name=?, display_name=?, email=?, website=?, business_description=?, contacts_json=REPLACE(REPLACE(contacts_json, 'commercial@sample-refinery.example', 'commercial@tanjunglangsatreﬁnery.my'), 'Sample Palm Refinery', 'Tanjung Langsat Palm Refinery') WHERE customer_code=?")
    .run("CUST-2026-013", "Tanjung Langsat Palm Refinery Sdn. Bhd.", "Tanjung Langsat Palm Refinery", "commercial@tanjunglangsatrefinery.my", "https://tanjunglangsatrefinery.my", "CPO customer for the Phase 1 demonstration.", "CUST-SAMPLE-001");
  db.prepare("UPDATE customers SET contacts_json=? WHERE customer_code=?")
    .run(JSON.stringify([{ isPrimary: true, name: "Nur Aina Hassan", role: "Buyer", email: "commercial@tanjunglangsatreﬁnery.my", mobile: "+60 127770202" }]), "CUST-2026-013");
  db.prepare("UPDATE customers SET contacts_json=? WHERE customer_code=?")
    .run(JSON.stringify([{ isPrimary: true, name: "Nur Aina Hassan", role: "Buyer", email: "commercial@tlrefinery.my", mobile: "+60 127770202" }]), "CUST-2026-013");
  db.prepare("UPDATE suppliers SET supplier_code=? WHERE supplier_code=?").run("SUP-2026-013", "SUP-SAMPLE-001");
  db.prepare("UPDATE suppliers SET details_json=REPLACE(REPLACE(details_json, 'SUP-SAMPLE-001', 'SUP-2026-013'), 'MY-DL-SAMPLE-001', 'MY-DL-013') WHERE supplier_code=?").run("SUP-2026-013");
  db.prepare("UPDATE sales_contracts SET contract_number=?, title=?, buyer_reference=?, customer=? WHERE contract_number=?")
    .run("SC-2026-0013", "Tanjung Langsat Palm Refinery CPO Supply Agreement", "TLPR-PO-2026-001", "Tanjung Langsat Palm Refinery Sdn. Bhd.", "SC-2026-SAMPLE-001");
  db.prepare("UPDATE sales_contracts SET email=? WHERE contract_number=?").run("commercial@tlrefinery.my", "SC-2026-0013");
  db.prepare("UPDATE purchase_contracts SET contract_code=?, title=?, terms=REPLACE(terms, 'Sample ', '') WHERE contract_code=?")
    .run("PC-FFB-2026-002", "Kampung Maju Estate FFB Supply Agreement", "PC-SAMPLE-2026-001");
  db.prepare("UPDATE direct_purchases SET terms_text=REPLACE(terms_text, 'Sample ', ''), idempotency_key=? WHERE idempotency_key IN (?, ?)")
    .run("phase1-direct-purchase-001", "phase1-sample-direct-purchase-001", "phase1-direct-purchase-001");
  db.prepare("UPDATE purchase_invoices SET invoice_number=? WHERE invoice_number=?")
    .run("KME-INV-20261027-001", "SUP-SAMPLE-INV-001");
  db.prepare("UPDATE ffb_receipts SET remarks=REPLACE(remarks, 'Phase 1 sample', 'Phase 1') WHERE remarks LIKE '%Phase 1 sample%'");
  db.prepare("UPDATE ffb_receipts SET driver_license_no=REPLACE(driver_license_no, 'MY-DL-SAMPLE-001', 'MY-DL-013'), driver_identity_no=REPLACE(driver_identity_no, 'MY-DL-SAMPLE-001', 'MY-DL-013') WHERE driver_license_no LIKE '%SAMPLE%'");
  db.prepare("UPDATE drivers SET identity_no=?, license_no=? WHERE identity_no=?").run("MY-DL-013", "MY-DL-013", "MY-DL-SAMPLE-001");
})();
db.close();

const supplier = await existingOrCreate(
  "/api/suppliers",
  (row) => row.supplier_code === "SUP-2026-013",
  {
    supplierCode: "SUP-2026-013",
    name: "Kampung Maju Estate",
    displayName: "Kampung Maju Estate",
    category: "FFB Supplier (Estate)",
    group: "External",
    companyEmail: "operations@kampungmaju.example",
    paymentTerms: "30 Days",
    contacts: [{ isPrimary: true, name: "Azlan Iskandar", mobileCode: "+60", mobile: "128880101", email: "operations@kampungmaju.example" }],
    addresses: [{ isDefault: true, line1: "Jalan Ladang Maju", city: "Kluang", state: "Johor", country: "Malaysia", postalCode: "86000" }],
    supplyItems: ["Fresh Fruit Bunch (FFB)"],
  },
);

const customer = await existingOrCreate(
  "/api/customers",
  (row) => row.customer_code === "CUST-2026-013",
  {
    customerCode: "CUST-2026-013",
    legalName: "Tanjung Langsat Palm Refinery Sdn. Bhd.",
    displayName: "Tanjung Langsat Palm Refinery",
    registrationNo: "201801000001",
    website: "https://tanjunglangsatrefinery.my",
    email: "commercial@tanjunglangsatrefinery.my",
    customerOrigin: "Domestic",
    businessClassification: "Refinery",
    customerGroup: "External",
    businessDescription: "CPO customer for the Phase 1 demonstration.",
    contacts: [{ isPrimary: true, name: "Nur Aina Hassan", role: "Buyer", email: "commercial@tanjunglangsatrefinery.my", mobile: "+60 127770202" }],
    addresses: [{ type: "Shipping", isDefault: true, line1: "Lot 27, Jalan Pelabuhan Tanjung Langsat", city: "Pasir Gudang", state: "Johor", country: "Malaysia", postalCode: "81700" }],
    commercial: { currency: "MYR", creditLimit: "500000", paymentTerms: "30 Days", incoterm: "CIF" },
    products: ["Crude Palm Oil (CPO)"],
    creditApplicable: true,
  },
);

const salesContracts = await request("/api/sales-contracts");
const salesContract = salesContracts.find((row) => row.contract_number === "SC-2026-0013") || await request("/api/sales-contracts", {
  method: "POST",
  body: JSON.stringify({
    contractNumber: "SC-2026-0013",
    title: "Tanjung Langsat Palm Refinery CPO Supply Agreement",
    contractType: "Annual Supply Agreement",
    signingDate: "2026-10-27",
    validFrom: "2026-10-27",
    validUntil: "2027-10-26",
    buyerReference: "TLPR-PO-2026-001",
    customer: customer.legal_name || customer.name,
    representative: "Nur Aina Hassan",
    email: "commercial@tanjunglangsatrefinery.my",
    phone: "+60 127770202",
    legalAddress: "Lot 27, Jalan Pelabuhan Tanjung Langsat, 81700 Pasir Gudang, Malaysia",
    currency: "MYR - Malaysian Ringgit (RM)",
    incoterm: "DAP Pasir Gudang Refinery",
    dischargePort: "Pasir Gudang Terminal, Johor, Malaysia",
    paymentMode: "Bank Transfer / TT",
    bank: "Maybank Berhad",
    paymentTerms: "30 days from certified delivery documents",
    products: [{ product: "Crude Palm Oil (CPO)", quantity: 350, unitPrice: 4200, ffa: "4.50", moisture: "0.25", dirt: "0.02", certification: "MSPO Mass Balance", documents: [] }],
    terms: "Each delivery is subject to mill quality release, certified weighment and the agreed commercial specifications.",
    documents: [],
  }),
});

const purchaseContracts = await request("/api/purchase-contracts");
const purchaseContract = purchaseContracts.find((row) => row.contract_code === "PC-FFB-2026-002") || await request("/api/purchase-contracts", {
  method: "POST",
  body: JSON.stringify({
    contractCode: "PC-FFB-2026-002",
    supplier: supplier.name,
    title: "Kampung Maju Estate FFB Supply Agreement",
    validFrom: "2026-10-27",
    validUntil: "2027-03-31",
    vendorRepresentative: "Azlan Iskandar",
    item: "Fresh Fruit Bunch (FFB)",
    itemQuantity: "5000",
    itemQuality: "Mature fruit bunches; loose fruit acceptable; no foreign matter",
    qualityTolerance: "FFA maximum 5%; dirt and stones maximum 2%",
    deliveryTerms: "Delivered to Mill (DAP)",
    paymentTermsOer: "OER-linked settlement at 20%",
    paymentFrequency: "Monthly",
    certifications: "MSPO",
    terms: "Final acceptance is based on mill weighing, grading and quality procedures.",
    contractValue: "21000000",
    status: "ACTIVE",
  }),
});

const driver = await existingOrCreate(
  "/api/drivers",
  (row) => row.license_no === "MY-DL-013",
  {
    name: "Nur Aiman Hakim",
    licenseNo: "MY-DL-013",
    phone: "+60 129990303",
    transporter: "Kencana Haulage Sdn. Bhd.",
    status: "ACTIVE",
  },
);

const vehicleTypes = await request("/api/vehicle-types");
const ffbTipper = vehicleTypes.find((row) => row.name === "FFB Tipper");
const vehicle = await existingOrCreate(
  "/api/vehicles",
  (row) => row.registration_no === "KMJ-FFB-001",
  {
    registrationNo: "KMJ-FFB-001",
    vehicleTypeId: ffbTipper.id,
    supplierName: "Kampung Maju Estate",
    supplierPlant: "Kampung Maju Estate",
    supplierCategory: "FFB Supplier (Estate)",
    transporter: "Kencana Haulage Sdn. Bhd.",
    declaredCapacity: 25,
    capacityUom: "MT",
  },
);

const items = await request("/api/items");
const ffbItem = items.find((row) => row.name === "Fresh Fruit Bunch (FFB)") || items.find((row) => /fresh fruit bunch/i.test(row.name) && row.status === "Active");
if (!ffbItem) throw new Error("No active FFB item is configured in the item master.");
const directPurchases = await request("/api/direct-purchases");
  let directPurchase = directPurchases.find((row) => row.invoice_number === "KME-INV-20261027-001");
if (!directPurchase) {
  directPurchase = await request("/api/direct-purchases", {
    method: "POST",
    headers: { "Idempotency-Key": "phase1-direct-purchase-001" },
    body: JSON.stringify({
      supplierId: supplier.id,
      purchaseDate: "2026-10-27",
      currency: "MYR",
      invoiceNumber: "KME-INV-20261027-001",
      taxRate: "0",
      lines: [{ itemId: ffbItem.id, quantity: 25, unitPrice: 950 }],
      termsText: "Direct FFB purchase linked to the Kampung Maju Estate supply contract.",
      attachments: [],
    }),
  });
}

const receipts = await request("/api/ffb-receiving");
let receipt = receipts.find((row) => row.vehicle_no === "KMJ-FFB-001" && row.supplier === "Kampung Maju Estate");
if (!receipt) {
  receipt = await request("/api/ffb-receiving", {
    method: "POST",
    body: JSON.stringify({
      driverName: driver.name,
      driverLicenseNo: driver.license_no,
      vehicleNo: vehicle.registration_no,
      vehicleType: "FFB Tipper",
      supplier: supplier.name,
      item: "Fresh Fruit Bunch (FFB)",
      grossWeight: 25,
      supplierDeclaredQty: 24.5,
      weightUom: "MT",
      remarks: "Phase 1 FFB receipt",
    }),
  });
}

let grading = receipt;
if (receipt.state === "FIRST_WEIGHT_RECORDED") {
  grading = await request(`/api/ffb-receiving/${receipt.id}/grading`, {
    method: "POST",
    body: JSON.stringify({
      gradingParameters: { ripe: 72, unripe: 8, overripe: 5, rotten: 2, emptyBunch: 1, dirtyContaminated: 1, wetWeight: 0.5 },
      ramp: "Ramp A",
      gradingResult: "ACCEPTED_WITH_OBSERVATION",
      remarks: "Predominantly ripe fruit; minor contamination observed.",
    }),
  });
}

console.log(JSON.stringify({
  supplier: { id: supplier.id, code: supplier.supplier_code, name: supplier.name },
  customer: { id: customer.id, code: customer.customer_code, name: customer.legal_name },
  salesContract: { id: salesContract.id, code: salesContract.contract_number, state: salesContract.state },
  purchaseContract: { id: purchaseContract.id, code: purchaseContract.contract_code, status: purchaseContract.status },
  directPurchase: { id: directPurchase.id, number: directPurchase.purchase_number, invoice: directPurchase.invoice_number, total: directPurchase.total_amount },
  transporter: "Kencana Haulage Sdn. Bhd.",
  driver: { id: driver.id, license: driver.license_no, name: driver.name },
  vehicle: { id: vehicle.id, registration: vehicle.registration_no, type: vehicle.vehicle_type },
  ffbReceiving: { id: grading.id, ticket: grading.ticket_no, state: grading.state },
  ffbGrading: { gradingId: grading.grading_id, result: grading.grading_result },
  deliveryRequest: "DR-20261027-0013",
  loadingPlan: "LI-20261027-0013",
}, null, 2));
