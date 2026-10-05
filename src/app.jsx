import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import "./react-app.css";
import {
  SalesContractsPage,
  SalesContractForm,
  ContractDetails,
} from "./commercial/SalesContracts.jsx";
import {
  CustomersPage,
  CustomerForm,
  CustomerDetails,
  CustomerDetailsReference,
} from "./commercial/Customers.jsx";
import { SupplierDetails, SupplierForm, SuppliersPage } from "./commercial/Suppliers.jsx";
import { PurchaseContractWorkspace as PurchaseContractsPage } from "./commercial/PurchaseContractWorkspace.jsx";
import { ItemsPage } from "./inventory/Items.jsx";
import { StorageAreaPage } from "./inventory/StorageAreas.jsx";
import { DispatchPage } from "./inventory/Dispatch.jsx";
import { FFBReceivingPage } from "./receiving/FFBReceiving.jsx";
import { FFBGradingPage } from "./receiving/FFBGrading.jsx";
import { ProductionSystem } from "./production/ProductionSystem.jsx";
import { MasterDataCenter } from "./masters/MasterDataCenter.jsx";
import "./masters/master-navigation.css";
import { LogisticsMaster } from "./masters/LogisticsMasters.jsx";
import { ListingActions } from "./components/ListingActions.jsx";
import { DirectPurchasePage, PurchaseInvoicesPage } from "./commercial/Purchasing.jsx";
import { SalesInvoiceForm } from "./finance/FinanceForms.jsx";
import { PaymentForm, PaymentsPage } from "./finance/Payments.jsx";
import { SalesInvoicesPage } from "./finance/SalesInvoices.jsx";

const nav = [
  ["dashboard", "Home", "⌂"],
  ["users", "Users", "♙"],
  ["customers", "Customers", "♧"],
  ["vendors", "Suppliers", "▣"],
  ["finance", "Finance", "$"],
  ["production", "Production", "◫"],
  ["stock", "Stock", "◇"],
  ["configuration", "Configuration", "⚙"],
];
nav.splice(
  nav.findIndex(([id]) => id === "configuration"),
  0,
  ["masters", "Masters", "▦"],
);
const tone = (value) =>
  /reject|review/i.test(value)
    ? "danger"
    : /grading|pending|awaiting|loading/i.test(value)
      ? "warning"
      : /accepted|pass|released|available|completed/i.test(value)
        ? "success"
        : "neutral";
const displayUom = (unit = "t") => /^(t|mt)$/i.test(String(unit).trim()) ? "MT" : unit;
const qty = (value, unit = "t") =>
  `${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${displayUom(unit)}`;
function Badge({ children }) {
  return (
    <span className={`badge ${tone(children)}`}>
      <span className="badge-dot" />
      {children}
    </span>
  );
}
function Header({ active, setActive, search, setSearch }) {
  return (
    <header className="topbar">
      <div className="demo-rail">DEMO</div>
      <div className="brand-block">
        <img
          className="brand-mark-image"
          src="/rockeye-mark.png"
          alt="ROCKEYE company logo"
        />
        <div className="brand-copy">
          <strong>ROCKEYE</strong>
          <span>Milling Operations</span>
        </div>
      </div>
      <div className="global-search">
        <span className="search-icon">⌕</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
        />
        <button className="search-scope">
          ALL <span>⌄</span>
        </button>
      </div>
      <nav className="topnav">
        {nav.map(([id, label, icon]) =>
          id === "users" ? (
            <div
              key={id}
              className={`nav-group ${active === "users" ? "active-group" : ""}`}
            >
              <button
                className={`nav-item ${active === id ? "active" : ""}`}
                onClick={() => setActive(id)}
              >
                <span className="nav-icon">{icon}</span>
                <span>{id === "vendors" ? "Suppliers" : label}</span>
              </button>
              <div className="header-submenu">
                <button onClick={() => setActive("users")}>Users</button>
              </div>
            </div>
          ) : id === "customers" ? (
            <div
              key={id}
              className={`nav-group ${active === "customers" || active === "salesContracts" ? "active-group" : ""}`}
            >
              <button
                className={`nav-item ${active === "customers" || active === "salesContracts" ? "active" : ""}`}
                onClick={() => setActive("customers")}
              >
                <span className="nav-icon">{icon}</span>
                <span>{id === "vendors" ? "Suppliers" : label}</span>
              </button>
              <div className="header-submenu">
                <button onClick={() => setActive("customers")}>
                  Customers
                </button>
                <button onClick={() => setActive("salesContracts")}>
                  Sales Contracts
                </button>
              </div>
            </div>
          ) : id === "vendors" ? (
            <div
              key={id}
              className={`nav-group ${active === "vendors" || active === "purchaseContracts" || active === "directPurchase" ? "active-group" : ""}`}
            >
              <button
                className={`nav-item ${active === "vendors" || active === "purchaseContracts" || active === "directPurchase" ? "active" : ""}`}
                onClick={() => setActive("vendors")}
              >
                <span className="nav-icon">{icon}</span>
                <span>Suppliers</span>
              </button>
              <div className="header-submenu">
                <button onClick={() => setActive("vendors")}>Suppliers</button>
                <button onClick={() => setActive("purchaseContracts")}>
                  Purchase Contracts
                </button>
                <button onClick={() => setActive("directPurchase")}>Direct Purchase</button>
              </div>
            </div>
          ) : id === "finance" ? (
            <div key={id} className={`nav-group ${active === "finance" || active === "purchaseInvoices" || active === "salesInvoice" || active === "salesInvoiceAdd" || active === "payments" || active === "paymentsAdd" ? "active-group" : ""}`}>
              <button className={`nav-item ${active === "finance" || active === "purchaseInvoices" || active === "salesInvoice" || active === "salesInvoiceAdd" || active === "payments" || active === "paymentsAdd" ? "active" : ""}`} onClick={() => setActive("finance")}><span className="nav-icon">{icon}</span><span>Finance</span></button>
              <div className="header-submenu"><button onClick={() => setActive("finance")}>Finance Overview</button><button onClick={() => setActive("purchaseInvoices")}>Purchase Invoice</button><button onClick={() => setActive("salesInvoice")}>Sales Invoice</button><button onClick={() => setActive("payments")}>Payments</button></div>
            </div>
          ) : id === "masters" ? (
            <div
              key={id}
              className={`nav-group ${active === "masters" || active === "items" || active === "masterStations" || active === "masterMachines" || active.startsWith("master:") ? "active-group" : ""}`}
            >
              <button
                className={`nav-item ${active === "masters" || active === "items" || active === "masterStations" || active === "masterMachines" || active.startsWith("master:") ? "active" : ""}`}
                onClick={() => setActive("masters")}
              >
                <span className="nav-icon">{icon}</span>
                <span>Masters</span>
              </button>
              <div className="header-submenu master-submenu">
                <button onClick={() => setActive("masters")}>Master Data Overview</button>
                <button onClick={() => setActive("masterStations")}>Station Master</button>
                <button onClick={() => setActive("masterMachines")}>Machine Master</button>
                <button onClick={() => setActive("master:uoms")}>Units of Measure</button>
                <button onClick={() => setActive("master:transporters")}>Transporter Master</button>
                <button onClick={() => setActive("master:vehicleTypes")}>Vehicle Type Master</button>
                <button onClick={() => setActive("master:vehicles")}>Vehicle Master</button>
                <button onClick={() => setActive("master:storageLocations")}>Storage Location Master</button>
                <button onClick={() => setActive("master:tanks")}>Tank & Storage Unit Master</button>
                <button onClick={() => setActive("master:processDefinitions")}>Process Definition Master</button>
                <button onClick={() => setActive("master:qualityParameters")}>Quality Parameter Master</button>
                <button onClick={() => setActive("master:samplingPlans")}>Sampling Plan Master</button>
                <button onClick={() => setActive("master:gradingParameters")}>Grading Parameter Master</button>
                <button onClick={() => setActive("master:gradingRules")}>Grading Rule Master</button>
                <button onClick={() => setActive("master:rejectionReasons")}>Rejection Reason Master</button>
                <button onClick={() => setActive("master:numberingSequences")}>Numbering Sequence Master</button>
              </div>
            </div>
          ) : id === "production" ? (
            <div
              key={id}
              className={`nav-group ${active === "production" || active === "productionRouting" || active === "masterProductionLines" ? "active-group" : ""}`}
            >
              <button
                className={`nav-item ${active === "production" || active === "productionRouting" || active === "masterProductionLines" ? "active" : ""}`}
                onClick={() => setActive("production")}
              >
                <span className="nav-icon">{icon}</span>
                <span>Production</span>
              </button>
              <div className="header-submenu">
                <button onClick={() => setActive("production")}>Production Runs</button>
                <button onClick={() => setActive("productionRouting")}>Routing</button>
                <button onClick={() => setActive("masterProductionLines")}>Production Line</button>
              </div>
            </div>
          ) : id === "stock" ? (
            <div
              key={id}
              className={`nav-group ${active === "stock" || active === "items" || active === "receiving" || active === "grading" || active === "tankFarm" || active === "kernelWarehouse" || active === "efbStorage" || active === "dispatch" ? "active-group" : ""}`}
            >
              <button
                className={`nav-item ${active === "stock" || active === "items" || active === "receiving" || active === "grading" || active === "tankFarm" || active === "kernelWarehouse" || active === "efbStorage" || active === "dispatch" ? "active" : ""}`}
                onClick={() => setActive("stock")}
              >
                <span className="nav-icon">{icon}</span>
                <span>Stock</span>
              </button>
              <div className="header-submenu">
                <button onClick={() => setActive("stock")}>Stock</button>
                <button onClick={() => setActive("items")}>Items</button>
                <button onClick={() => setActive("tankFarm")}>Tank Farm</button>
                <button onClick={() => setActive("kernelWarehouse")}>Kernel Warehouse</button>
                <button onClick={() => setActive("efbStorage")}>EFB Storage</button>
                <button onClick={() => setActive("dispatch")}>Dispatch</button>
                <button onClick={() => setActive("receiving")}>FFB Receiving</button>
                <button onClick={() => setActive("grading")}>FFB Grading</button>
              </div>
            </div>
          ) : (
            <button
              key={id}
              className={`nav-item ${active === id ? "active" : ""}`}
              onClick={() => setActive(id)}
            >
              <span className="nav-icon">{icon}</span>
              <span>{id === "vendors" ? "Suppliers" : label}</span>
            </button>
          ),
        )}
      </nav>
      <div className="profile">
        <div className="avatar">S</div>
        <div className="profile-copy">
          <strong>Sean Shapiro</strong>
          <span>mill.admin@youmail.com</span>
        </div>
      </div>
    </header>
  );
}
function Heading({ title, subtitle, action, eyebrow = "OPERATIONS" }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
function Table({ rows, type }) {
  const columns =
    type === "receiving"
      ? ["Ticket", "Supplier", "Vehicle", "Net weight", "Status", "Time"]
      : type === "stock"
        ? ["Material", "Location", "Balance", "Status", "Trend"]
        : type === "quality"
          ? ["Sample", "Source", "Parameter", "Result", "Status", "Due"]
        : type === "purchaseContracts"
          ? ["Contract Code", "Supplier Name", "Period", "Item", "Status"]
        : ["Dispatch", "Material", "Customer", "Quantity", "Status", "Time"];
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
            {type !== "purchaseContracts" && <th />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const values =
              type === "receiving"
                ? [
                    row.id,
                    row.supplier,
                    row.vehicle,
                    qty(row.net),
                    <Badge key="s">{row.status}</Badge>,
                    row.time,
                  ]
                : type === "stock"
                  ? [
                      row.material,
                      row.location,
                      qty(row.balance),
                      <Badge key="s">{row.state}</Badge>,
                      <span
                        className={
                          row.trend.startsWith("-") ? "trend down" : "trend"
                        }
                      >
                        {row.trend}
                      </span>,
                    ]
                  : type === "quality"
                    ? [
                        row.id,
                        row.source,
                        row.parameter,
                        row.result,
                        <Badge key="s">{row.status}</Badge>,
                        row.due,
                      ]
                    : type === "purchaseContracts"
                      ? [
                          row.contract_code || row.contractCode || row.business_no || row.id,
                          row.supplier_name || row.supplier || "—",
                          row.period || [row.valid_from, row.valid_until].filter(Boolean).join(" – ") || "—",
                          row.item || row.material || row.product || row.item_name || "—",
                          <Badge key="s">{row.status || row.state || "Draft"}</Badge>,
                        ]
                    : [
                        row.id,
                        row.material,
                        row.customer,
                        qty(row.quantity),
                        <Badge key="s">{row.status}</Badge>,
                        row.time,
                      ];
            return (
              <tr key={row.id || row.material}>
                {values.map((v, i) => (
                  <td key={i}>{i === 0 ? <strong>{v}</strong> : v}</td>
                ))}
                {type !== "purchaseContracts" && <td><button className="row-more">⋯</button></td>}
              </tr>
            );
          })}
        </tbody>
      </table>
      {!rows.length && (
        <div className="empty-state">
          <strong>No records found</strong>
          <span>Try another search term.</span>
        </div>
      )}
    </div>
  );
}
function Dashboard({ data, setActive, onNew }) {
  return (
    <main className="page">
      <Heading
        title="Welcome, Sean"
        subtitle="Here is what's happening at your mill today."
        eyebrow=""
        action={
          <button className="btn btn-primary" onClick={onNew}>
            ＋ New Receiving
          </button>
        }
      />
      <section className="kpi-grid">
        {data.kpis.map((k) => (
          <article className="kpi-card" key={k.label}>
            <div className="kpi-top">
              <div className="kpi-label">{k.label}</div>
              <div className={`kpi-icon ${k.tone}`}>{k.icon}</div>
            </div>
            <div className="kpi-value">{qty(k.value, k.unit)}</div>
            <div className="kpi-foot">
              <span
                className={k.change.startsWith("-") ? "trend down" : "trend"}
              >
                {k.change}
              </span>
              <span>vs yesterday</span>
            </div>
          </article>
        ))}
      </section>
      <section className="content-grid">
        <article className="panel table-panel">
          <div className="panel-header">
            <div>
              <h2>Recent FFB receiving</h2>
              <p>Live weighbridge activity from SQLite</p>
            </div>
            <button
              className="text-button"
              onClick={() => setActive("receiving")}
            >
              View all →
            </button>
          </div>
          <Table rows={data.receiving} type="receiving" />
        </article>
        <article className="panel stock-panel">
          <div className="panel-header">
            <div>
              <h2>Stock snapshot</h2>
              <p>Available material balance</p>
            </div>
            <button className="text-button" onClick={() => setActive("stock")}>
              View stock →
            </button>
          </div>
          <div className="stock-list">
            {data.stock.map((item) => (
              <button
                className="stock-row"
                key={item.material}
                onClick={() => setActive("stock")}
              >
                <span className="material-symbol">◇</span>
                <span className="stock-name">
                  <strong>{item.material}</strong>
                  <small>{item.location}</small>
                </span>
                <span className="stock-amount">
                  <strong>{qty(item.balance)}</strong>
                  <small
                    className={item.trend.startsWith("-") ? "negative" : ""}
                  >
                    {item.trend}
                  </small>
                </span>
              </button>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
function Listing({ type, rows, search, setSearch, onNew }) {
  const config = {
    receiving: [
      "FFB Receiving",
      "Weighbridge tickets, grading and inbound lots",
      "New Receiving",
    ],
    stock: [
      "Stock & Storage",
      "Material balances across tanks, silos and storage locations",
      "Transfer stock",
    ],
    quality: [
      "Quality Control",
      "Sampling schedule, results and quality exceptions",
      "Record sample",
    ],
    dispatch: [
      "Dispatch",
      "Outbound loads, approvals and dispatch documents",
      "New Dispatch",
    ],
    users: ["Users", "Manage mill users and access permissions", "New User"],
    masters: [
      "Masters",
      "Manage master data used across mill operations",
      "Open Master Data",
    ],
    customers: [
      "Customers",
      "Manage customer records and commercial relationships",
      "New Customer",
    ],
    vendors: [
      "Suppliers",
      "Manage suppliers and purchasing relationships",
      "New Supplier",
    ],
    purchaseContracts: [
      "Purchase Contracts",
      "Supplier agreements, purchasing terms and contracted materials",
      "New Purchase Contract",
    ],
    finance: [
      "Finance",
      "Financial controls and transaction overview",
      "New Entry",
    ],
    production: [
      "Production",
      "Production batches and mill process status",
      "New Batch",
    ],
    configuration: [
      "Configuration",
      "System settings and master data",
      "Open settings",
    ],
  }[type] || ["Operations", "Operational workspace", "New record"];
  const tableType = ["receiving", "stock", "quality", "purchaseContracts", "dispatch"].includes(type)
    ? type
    : "dispatch";
  const filtered = rows.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(search.toLowerCase()),
    ),
  );
  return (
    <main className="page">
      <Heading
        title={config[0]}
        subtitle={config[1]}
        action={
          <button className="btn btn-primary" onClick={onNew}>
            ＋ {config[2]}
          </button>
        }
      />
      <div className="toolbar">
        <div className="local-search">
          <span>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${type}...`}
          />
        </div>
        <div className="toolbar-right">
          <ListingActions search={search} setSearch={setSearch} rows={filtered} columns={Object.keys(rows[0] || {})} />
        </div>
      </div>
      <article className="panel full-table">
        <Table rows={filtered} type={tableType} />
      </article>
    </main>
  );
}
function UsersPage({ rows, search, setSearch, onSelect }) {
  const filtered = rows.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(search.toLowerCase()),
    ),
  );
  const activeCount = rows.filter((row) => row.status === "Active").length;
  return (
    <main className="users-page">
      <div className="users-breadcrumb">
        <span>User</span>
        <b>›</b>
        <strong>Admin</strong>
      </div>
      <div className="users-title-row">
        <div>
          <h1>Listing</h1>
          <p>Manage users and access groups</p>
        </div>
      </div>
      <section className="user-stat-grid">
        <article>
          <span>Total</span>
          <strong>{rows.length}</strong>
        </article>
        <article>
          <span>Active</span>
          <strong>{activeCount}</strong>
        </article>
        <article>
          <span>Inactive</span>
          <strong>{rows.length - activeCount}</strong>
        </article>
      </section>
      <article className="panel users-table-panel">
        <div className="users-toolbar">
          <div className="local-search">
            <span>⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
            />
          </div>
        </div>
        <div className="table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" aria-label="Select all users" />
                </th>
                <th>Profile Image</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th>Group Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, index) => (
                <tr key={user.id} onClick={() => onSelect(user)}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select ${user.name}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td>
                    <span className={`user-avatar theme-${index % 4}`}>
                      {user.avatar || user.name.charAt(0).toUpperCase()}
                    </span>
                  </td>
                  <td className="user-name">{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td>{user.group_name}</td>
                  <td>
                    <span className="user-status">{user.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </main>
  );
}
function UserDrawer({ user, onClose }) {
  if (!user) return null;
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="drawer user-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="user-drawer-head">
          <span className="user-avatar theme-0">
            {user.avatar || user.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <h2>{user.name}</h2>
            <span className="user-status">{user.status}</span>
          </div>
          <button className="icon-button" onClick={onClose}>
            ×
          </button>
        </div>
        <button className="btn btn-secondary details-button">
          More Details
        </button>
        <div className="user-detail-grid">
          <div>
            <span>Display Name</span>
            <strong>{user.name}</strong>
          </div>
          <div>
            <span>Role</span>
            <strong>{user.group_name}</strong>
          </div>
          <div>
            <span>Add Date</span>
            <strong>{user.add_date}</strong>
          </div>
          <div>
            <span>Modify Date</span>
            <strong>{user.modify_date || "—"}</strong>
          </div>
          <div>
            <span>Preferred Language</span>
            <strong>{user.language}</strong>
          </div>
        </div>
      </aside>
    </div>
  );
}
function Modal({ onClose, onSaved }) {
  const [form, setForm] = useState({ supplier: "", vehicle: "", net: "" });
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    const response = await fetch("/api/receiving", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.message);
      return;
    }
    onSaved(payload);
  };
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <form
        className="drawer"
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-head">
          <div>
            <div className="eyebrow">NEW RECORD</div>
            <h2>New FFB receiving</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            ×
          </button>
        </div>
        <p className="modal-copy">
          Create a weighbridge record saved directly to SQLite.
        </p>
        {error && <div className="form-error">{error}</div>}
        <label>
          Supplier
          <input
            required
            value={form.supplier}
            onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            placeholder="Supplier name"
          />
        </label>
        <label>
          Vehicle
          <input
            required
            value={form.vehicle}
            onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
            placeholder="JQK 4812"
          />
        </label>
        <label>
          Net weight (t)
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={form.net}
            onChange={(e) => setForm({ ...form, net: e.target.value })}
            placeholder="20.27"
          />
        </label>
        <div className="drawer-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary">Save receiving</button>
        </div>
      </form>
    </div>
  );
}
function App() {
  const [active, setActive] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [gradingFocusId, setGradingFocusId] = useState(null);
  const [showContractForm, setShowContractForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [data, setData] = useState({
    kpis: [],
    receiving: [],
    stock: [],
    quality: [],
    dispatch: [],
    users: [],
    salesContracts: [],
    customers: [],
    suppliers: [],
    items: [],
    ffbReceiving: [],
    purchaseContracts: [],
    purchaseInvoices: [],
    directPurchases: [],
    salesInvoices: [],
    payments: [],
    dispatchOrders: [],
  });
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [loadError, setLoadError] = useState("");
  const load = async () => {
    setLoading(true);
    setLoadError("");
    const safeFetch = async (url, fallback) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try { const response = await fetch(url, { signal: controller.signal }); if (!response.ok) return fallback; return await response.json(); }
      catch { return fallback; }
      finally { clearTimeout(timeout); }
    };
    try {
      const [dashboard, contracts, customers, suppliers, items, ffbReceiving, purchaseContracts, purchaseInvoices, directPurchases, salesInvoices, payments, dispatchOrders] = await Promise.all([
        safeFetch("/api/dashboard", { kpis: [], receiving: [], stock: [], quality: [], dispatch: [], users: [] }),
        safeFetch("/api/sales-contracts", []), safeFetch("/api/customers", []), safeFetch("/api/suppliers", []), safeFetch("/api/items", []),
        safeFetch("/api/ffb-receiving", []), safeFetch("/api/purchase-contracts", []), safeFetch("/api/purchase-invoices", []),
        safeFetch("/api/direct-purchases", []), safeFetch("/api/sales-invoices", []), safeFetch("/api/payments", []), safeFetch("/api/dispatch-orders", []),
      ]);
      setData({ ...dashboard, salesContracts: contracts, customers, suppliers, items, ffbReceiving, purchaseContracts, purchaseInvoices, directPurchases, salesInvoices, payments, dispatchOrders });
    } catch (error) { setLoadError(error.message || "Live mill data is temporarily unavailable."); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    setSelectedUser(null);
    setSelectedContract(null);
    setSelectedCustomer(null);
    setShowSupplierForm(false);
    setSelectedSupplier(null);
    setShowContractForm(false);
    setShowCustomerForm(false);
  }, [active]);
  const content = useMemo(
    () =>
      active === "dashboard" ? (
        <Dashboard
          data={data}
          setActive={setActive}
          onNew={() => setActive("receiving")}
        />
      ) : active === "users" ? (
        <UsersPage
          rows={data.users}
          search={search}
          setSearch={setSearch}
          onSelect={setSelectedUser}
        />
      ) : active === "salesContracts" ? (
        <SalesContractsPage
          rows={data.salesContracts}
          onNew={() => setShowContractForm(true)}
          onSelect={setSelectedContract}
        />
      ) : active === "customers" ? (
        <CustomersPage
          rows={data.customers}
          onNew={() => {
            setSelectedCustomer(null);
            setShowCustomerForm(true);
          }}
          onSelect={setSelectedCustomer}
        />
      ) : active === "supplierAdd" ? (
        <SupplierForm
          items={data.items}
          onClose={() => setActive("vendors")}
          onSaved={async () => {
            setActive("vendors");
            setToast("Supplier saved successfully");
            await load();
            setTimeout(() => setToast(""), 2500);
          }}
        />
      ) : active === "vendors" ? (
        selectedSupplier ? (
          <SupplierDetails
            supplier={selectedSupplier}
            onBack={() => setSelectedSupplier(null)}
            onEdit={() => setShowSupplierForm(true)}
          />
        ) : (
          <SuppliersPage
            rows={data.suppliers}
            onSelect={setSelectedSupplier}
            onNew={() => setActive("supplierAdd")}
          />
        )
      ) : active === "purchaseContracts" ? (
        <PurchaseContractsPage rows={data.purchaseContracts} suppliers={data.suppliers} items={data.items} onSaved={load} />
      ) : active === "directPurchase" ? (
        <DirectPurchasePage rows={data.directPurchases} suppliers={data.suppliers} items={data.items} onSaved={async () => { setToast("Direct purchase saved and invoice created"); await load(); setTimeout(() => setToast(""), 2500); }} />
      ) : active === "purchaseInvoices" ? (
        <PurchaseInvoicesPage rows={data.purchaseInvoices} onRefresh={load} />
      ) : active === "salesInvoice" ? (
        <SalesInvoicesPage rows={data.salesInvoices} onRefresh={load} onNew={() => setActive("salesInvoiceAdd")} />
      ) : active === "salesInvoiceAdd" ? (
        <SalesInvoiceForm onSaved={() => setToast("Sales invoice saved as draft")} />
      ) : active === "payments" ? (
        <PaymentsPage rows={data.payments} onRefresh={load} onNew={() => setActive("paymentsAdd")} />
      ) : active === "paymentsAdd" ? (
        <PaymentForm onSaved={async () => { setActive("payments"); setToast("Payment saved as draft"); await load(); }} />
      ) : active === "masters" ? (
        <MasterDataCenter onNavigate={setActive} />
      ) : active === "masterProductionLines" ? (
        <ProductionSystem mode="lineMaster" />
      ) : active === "masterStations" ? (
        <ProductionSystem mode="stationMaster" />
      ) : active === "masterMachines" ? (
        <ProductionSystem mode="machineMaster" />
      ) : active === "master:vehicleTypes" ? (
        <LogisticsMaster mode="vehicleTypes" />
      ) : active === "master:vehicles" ? (
        <LogisticsMaster mode="vehicles" />
      ) : active.startsWith("master:") ? (
        <MasterDataCenter masterKey={active.split(":")[1]} onNavigate={setActive} />
      ) : active === "production" ? (
        <ProductionSystem mode="runs" onApplicationRefresh={load} />
      ) : active === "productionRouting" ? (
        <ProductionSystem mode="routing" />
      ) : active === "items" ? (
        <ItemsPage rows={data.items} onSaved={load} />
      ) : ["tankFarm", "kernelWarehouse", "efbStorage"].includes(active) ? (
        <StorageAreaPage area={active} rows={data.stock} quality={data.quality} dispatch={data.dispatch} />
      ) : active === "dispatch" ? (
        <DispatchPage rows={data.dispatchOrders} items={data.items} onSaved={load} />
      ) : active === "receiving" ? (
        <FFBReceivingPage rows={data.ffbReceiving} suppliers={data.suppliers} onSaved={load} onOpenGrading={(id) => { setGradingFocusId(id); setActive("grading"); }} />
      ) : active === "grading" ? (
        <FFBGradingPage rows={data.ffbReceiving} onSaved={load} focusId={gradingFocusId} />
      ) : (
        <Listing
          type={active}
          rows={data[active] || []}
          search={search}
          setSearch={setSearch}
          onNew={() => active === "receiving" && setModal(true)}
        />
      ),
    [active, data, search, selectedSupplier],
  );
  return (
    <>
      <Header
        active={active}
        setActive={(id) => {
          setActive(id);
          setSearch("");
        }}
        search={search}
        setSearch={setSearch}
      />
      {loadError && <div style={{ margin: "12px 32px", padding: "10px 14px", border: "1px solid #f2b8b5", borderRadius: 6, color: "#b42318", background: "#fff5f5", fontSize: 12 }}>{loadError} <button className="btn btn-secondary" style={{ marginLeft: 10 }} onClick={load}>Retry</button></div>}
      {loading ? (
        <div className="loading">Loading live mill data…</div>
      ) : (
        content
      )}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          onSaved={async () => {
            setModal(false);
            setToast("Receiving saved successfully");
            await load();
            setTimeout(() => setToast(""), 2500);
          }}
        />
      )}
      {showContractForm && active === "salesContracts" && (
        <SalesContractForm
          onClose={() => setShowContractForm(false)}
          onSaved={async () => {
            setShowContractForm(false);
            setToast("Sales contract saved successfully");
            await load();
            setTimeout(() => setToast(""), 2500);
          }}
        />
      )}
      {showCustomerForm && active === "customers" && (
        <CustomerForm
          onClose={() => {
            setShowCustomerForm(false);
            setSelectedCustomer(null);
          }}
          onSaved={async () => {
            setShowCustomerForm(false);
            setSelectedCustomer(null);
            setToast("Customer saved successfully");
            await load();
            setTimeout(() => setToast(""), 2500);
          }}
        />
      )}
      {showSupplierForm && active === "vendors" && (
        <SupplierForm
          items={data.items}
          onClose={() => setShowSupplierForm(false)}
          onSaved={async () => {
            setShowSupplierForm(false);
            setToast("Supplier saved successfully");
            await load();
            setTimeout(() => setToast(""), 2500);
          }}
        />
      )}
      {selectedContract && active === "salesContracts" && (
        <ContractDetails
          contract={selectedContract}
          onClose={() => setSelectedContract(null)}
        />
      )}
      {selectedCustomer && active === "customers" && (
        <CustomerDetailsReference
          customer={selectedCustomer}
          onBack={() => setSelectedCustomer(null)}
          onEdit={() => setShowCustomerForm(true)}
        />
      )}
      {selectedUser && active === "users" && (
        <UserDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
      {toast && (
        <div className="toast">
          <span className="toast-check">✓</span>
          {toast}
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById("app")).render(<App />);
