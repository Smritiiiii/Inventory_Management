import { useState, useEffect } from "react";
import { fetchAllPages } from "../utils/paginated";
import { formatCustomerPurchaseLabel } from "../utils/customerLabels";
import { isCurrentUserAdmin } from "../utils/auth";
import { formatAuditTimestamp } from "../utils/audit";

const initialFormState = {
  sale_type: "cylinder",
  customer: "",
  phone: "",
  address: "",
  item_type: "",
  cylinder_size: "",
  refill: false,
  quantity: "1",
  amount: "",
};


const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');

  .ds-root {
    font-family: 'DM Sans', sans-serif;
    background: #f4f1eb;
    min-height: 100vh;
    padding: 2rem 1.5rem;
    color: #1a1a1a;
  }

  /* ── page header ── */
  .ds-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .ds-header h2 {
    font-family: 'DM Serif Display', serif;
    font-size: 2rem;
    margin: 0;
    letter-spacing: -0.02em;
  }
  .ds-header h2 span { color: #c0392b; }

  .ds-header-right {
    display: flex;
    align-items: center;
    gap: .75rem;
    flex-wrap: wrap;
  }

  /* ── search bar ── */
  .ds-search-wrap {
    position: relative;
  }
  .ds-search-icon {
    position: absolute;
    left: .85rem;
    top: 50%;
    transform: translateY(-50%);
    color: #aaa;
    font-size: .85rem;
    pointer-events: none;
  }
  .ds-search-input {
    padding: .55rem .9rem .55rem 2.2rem;
    border-radius: 50px;
    border: 1.5px solid #e8e3da;
    background: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: .85rem;
    color: #1a1a1a;
    outline: none;
    width: 200px;
    transition: border-color .2s, box-shadow .2s, width .3s;
    box-shadow: 0 1px 6px rgba(0,0,0,.06);
  }
  .ds-search-input:focus {
    border-color: #c0392b;
    box-shadow: 0 0 0 3px rgba(192,57,43,.1);
    width: 240px;
  }
  .ds-search-input::placeholder { color: #bbb; }

  /* ── time filter pill group ── */
  .ds-filter-group {
    display: flex;
    background: #fff;
    border-radius: 50px;
    padding: 4px;
    box-shadow: 0 1px 6px rgba(0,0,0,.08);
    gap: 2px;
  }
  .ds-filter-btn {
    padding: .4rem 1.1rem;
    border-radius: 50px;
    border: none;
    background: transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: .82rem;
    font-weight: 500;
    color: #777;
    cursor: pointer;
    transition: background .2s, color .2s;
  }
  .ds-filter-btn.active {
    background: #1a1a1a;
    color: #f4f1eb;
  }

  /* ── month picker ── */
  .ds-month-picker {
    padding: .4rem .85rem;
    border-radius: 50px;
    border: 1.5px solid #e8e3da;
    background: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: .82rem;
    font-weight: 500;
    color: #555;
    cursor: pointer;
    outline: none;
    box-shadow: 0 1px 6px rgba(0,0,0,.06);
    transition: border-color .2s;
  }
  .ds-month-picker:focus { border-color: #c0392b; }
  .ds-month-picker.active {
    border-color: #1a1a1a;
    background: #fff;
    color: #1a1a1a;
    font-weight: 600;
  }

  /* ── add button ── */
  .ds-btn-add {
    display: flex;
    align-items: center;
    gap: .5rem;
    background: #1a1a1a;
    color: #f4f1eb;
    border: none;
    padding: .65rem 1.4rem;
    border-radius: 50px;
    font-family: 'DM Sans', sans-serif;
    font-size: .9rem;
    font-weight: 500;
    cursor: pointer;
    transition: background .2s, transform .15s;
  }
  .ds-btn-add:hover { background: #c0392b; transform: translateY(-1px); }

  /* ── summary strip ── */
  .ds-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  .ds-stat {
    background: #fff;
    border-radius: 14px;
    padding: 1rem 1.25rem;
    box-shadow: 0 1px 8px rgba(0,0,0,.06);
  }
  .ds-stat-label {
    font-size: .72rem;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: #999;
    font-weight: 600;
    margin-bottom: .3rem;
  }
  .ds-stat-value {
    font-family: 'DM Serif Display', serif;
    font-size: 1.6rem;
    color: #1a1a1a;
    line-height: 1;
  }
  .ds-stat-value.accent { color: #c0392b; }

  /* ── table card ── */
  .ds-table-card {
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 20px rgba(0,0,0,.07);
  }
  .ds-table {
    width: 100%;
    border-collapse: collapse;
    font-size: .875rem;
  }
  .ds-table thead tr {
    background: #1a1a1a;
    color: #f4f1eb;
  }
  .ds-table thead th {
    padding: .9rem 1rem;
    font-weight: 500;
    letter-spacing: .04em;
    font-size: .78rem;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .ds-table tbody tr {
    border-bottom: 1px solid #f0ede6;
    transition: background .15s;
  }
  .ds-table tbody tr:last-child { border-bottom: none; }
  .ds-table tbody tr:hover { background: #faf8f4; }
  .ds-table tbody td {
    padding: .85rem 1rem;
    vertical-align: middle;
  }

  .ds-badge {
    display: inline-block;
    padding: .25rem .75rem;
    border-radius: 50px;
    font-size: .75rem;
    font-weight: 600;
  }
  .ds-badge-cylinder  { background: #eaf4fd; color: #1a6fa8; }
  .ds-badge-accessory { background: #eafaf1; color: #1e8449; }
  .ds-badge-refill    { background: #fef3e2; color: #b7770d; }
  .ds-badge-count     { background: #f0e6fd; color: #7d3c98; }

  .ds-empty {
    text-align: center;
    padding: 3rem 1rem;
    color: #999;
    font-size: .95rem;
  }
  .ds-empty-icon { font-size: 2.5rem; margin-bottom: .5rem; }

  /* ── action buttons ── */
  .ds-action-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: .85rem;
    transition: opacity .15s, transform .15s;
  }
  .ds-action-btn:hover { opacity: .8; transform: scale(1.1); }
  .ds-action-btn:disabled,
  .ds-action-btn:disabled:hover {
    opacity: .45;
    cursor: not-allowed;
    transform: none;
  }
  .ds-btn-edit   { background: #fff3cd; color: #856404; }
  .ds-btn-delete { background: #fdecea; color: #c0392b; }

  .ds-audit {
    min-width: 160px;
    display: flex;
    flex-direction: column;
    gap: .2rem;
  }
  .ds-audit-user {
    font-weight: 600;
    color: #1a1a1a;
  }
  .ds-audit-time {
    font-size: .75rem;
    color: #777;
  }

  /* ── sale type toggle ── */
  .ds-type-toggle {
    display: flex;
    background: #f4f1eb;
    border-radius: 12px;
    padding: 4px;
    gap: 4px;
    width: fit-content;
  }
  .ds-type-opt {
    padding: .55rem 1.5rem;
    border-radius: 10px;
    border: none;
    background: transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: .875rem;
    font-weight: 500;
    color: #777;
    cursor: pointer;
    transition: background .2s, color .2s, box-shadow .2s;
  }
  .ds-type-opt.active {
    background: #fff;
    color: #1a1a1a;
    box-shadow: 0 2px 8px rgba(0,0,0,.1);
  }
  .ds-type-opt.active.cylinder { color: #1a6fa8; }
  .ds-type-opt.active.accessory { color: #1e8449; }

  /* ── form card ── */
  .ds-form-wrap {
    max-width: 860px;
    margin: 0 auto 2rem;
  }
  .ds-form-card {
    background: #fff;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 30px rgba(0,0,0,.1);
  }
  .ds-form-hero {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    padding: 2rem 2.5rem;
    position: relative;
    overflow: hidden;
  }
  .ds-form-hero::after {
    content: '';
    position: absolute;
    right: -40px; top: -40px;
    width: 180px; height: 180px;
    border-radius: 50%;
    background: rgba(192,57,43,.25);
  }
  .ds-form-hero::before {
    content: '';
    position: absolute;
    right: 60px; bottom: -60px;
    width: 120px; height: 120px;
    border-radius: 50%;
    background: rgba(192,57,43,.12);
  }
  .ds-form-hero h3 {
    font-family: 'DM Serif Display', serif;
    color: #fff;
    font-size: 1.6rem;
    margin: 0 0 .3rem;
    position: relative; z-index: 1;
  }
  .ds-form-hero p {
    color: rgba(255,255,255,.55);
    font-size: .85rem;
    margin: 0;
    position: relative; z-index: 1;
  }

  .ds-form-body { padding: 2rem 2.5rem; }

  /* ── section divider ── */
  .ds-section-label {
    display: flex;
    align-items: center;
    gap: .75rem;
    margin-bottom: 1.25rem;
    margin-top: .5rem;
  }
  .ds-section-label .ds-section-icon {
    width: 32px; height: 32px;
    border-radius: 8px;
    background: #fdecea;
    color: #c0392b;
    display: flex; align-items: center; justify-content: center;
    font-size: .9rem; flex-shrink: 0;
  }
  .ds-section-label span {
    font-weight: 600;
    font-size: .9rem;
    letter-spacing: .05em;
    text-transform: uppercase;
    color: #555;
  }
  .ds-section-label::after {
    content: ''; flex: 1;
    height: 1px; background: #ece9e2;
  }

  /* ── fields ── */
  .ds-field { margin-bottom: 1.1rem; }
  .ds-label {
    display: block;
    font-size: .8rem; font-weight: 600;
    letter-spacing: .05em; text-transform: uppercase;
    color: #777; margin-bottom: .4rem;
  }
  .ds-input, .ds-select, .ds-textarea {
    width: 100%;
    border: 1.5px solid #e8e3da;
    border-radius: 10px;
    padding: .65rem .9rem;
    font-family: 'DM Sans', sans-serif;
    font-size: .9rem; color: #1a1a1a;
    background: #faf8f4;
    transition: border-color .2s, box-shadow .2s, background .2s;
    outline: none; box-sizing: border-box;
  }
  .ds-input:focus, .ds-select:focus {
    border-color: #c0392b;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(192,57,43,.1);
  }
  .ds-input:disabled, .ds-select:disabled {
    background: #f0ede6;
    color: #999;
    cursor: not-allowed;
    border-color: #e8e3da;
  }
  .ds-select { appearance: none; cursor: pointer; }
  .ds-select-wrap { position: relative; }
  .ds-select-wrap::after {
    content: '▾';
    position: absolute; right: .9rem; top: 50%;
    transform: translateY(-50%);
    color: #999; pointer-events: none; font-size: .8rem;
  }

  /* ── refill checkbox ── */
  .ds-checkbox-row {
    display: flex; align-items: center; gap: .6rem;
    background: #faf8f4;
    border: 1.5px solid #e8e3da;
    border-radius: 10px;
    padding: .65rem .9rem;
    cursor: pointer;
    transition: border-color .2s;
    width: fit-content;
  }
  .ds-checkbox-row:hover { border-color: #c0392b; }
  .ds-checkbox-row input[type="checkbox"] {
    width: 16px; height: 16px;
    accent-color: #c0392b;
    cursor: pointer;
  }
  .ds-checkbox-row span {
    font-size: .9rem; font-weight: 500; color: #1a1a1a;
  }

  /* ── read-only info tiles ── */
  .ds-info-tile {
    background: #f4f1eb;
    border: 1.5px solid #e8e3da;
    border-radius: 10px;
    padding: .65rem .9rem;
    font-size: .9rem; color: #555;
    min-height: 42px;
  }
  .ds-info-tile.empty { color: #bbb; font-style: italic; }

  /* ── form footer ── */
  .ds-form-footer {
    display: flex; justify-content: flex-end; gap: .75rem;
    padding-top: 1rem;
    border-top: 1px solid #ece9e2;
    margin-top: .5rem;
  }
  .ds-btn-cancel {
    padding: .65rem 1.5rem; border-radius: 50px;
    border: 1.5px solid #ddd; background: transparent;
    font-family: 'DM Sans', sans-serif; font-size: .9rem;
    color: #555; cursor: pointer;
    transition: border-color .2s, color .2s;
  }
  .ds-btn-cancel:hover { border-color: #1a1a1a; color: #1a1a1a; }
  .ds-btn-submit {
    padding: .65rem 1.8rem; border-radius: 50px; border: none;
    background: #c0392b; color: #fff;
    font-family: 'DM Sans', sans-serif; font-size: .9rem; font-weight: 600;
    cursor: pointer; transition: background .2s, transform .15s;
  }
  .ds-btn-submit:hover { background: #a93226; transform: translateY(-1px); }

  .ds-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .ds-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
  .ds-grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 1rem; }
  @media (max-width: 640px) {
    .ds-grid-2, .ds-grid-3, .ds-grid-4 { grid-template-columns: 1fr; }
    .ds-form-hero, .ds-form-body { padding: 1.5rem; }
    .ds-header { flex-direction: column; align-items: flex-start; }
    .ds-search-input { width: 100%; }
  }
`;

/* ── helpers ── */
// Build "YYYY-MM" string from a Date in LOCAL time (avoids UTC-shift issues)
const toYearMonth = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

// Parse sale_date safely (handles "YYYY-MM-DD" strings without UTC shift)
const parseSaleDate = (dateStr) => {
  if (!dateStr) return null;
  // "YYYY-MM-DD" → treat as local midnight
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }
  return new Date(dateStr);
};

const getErrorMessage = (errorData) => {
  if (typeof errorData?.detail === "string") {
    return errorData.detail;
  }

  const firstValue = Object.values(errorData || {})[0];
  if (Array.isArray(firstValue) && firstValue.length > 0) {
    return firstValue[0];
  }
  if (typeof firstValue === "string") {
    return firstValue;
  }

  return "Unknown error";
};

/* ── component ───────────────────────────────────────────────────── */
const DailySales = () => {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [allItemTypes, setAllItemTypes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  // Filter state
  const [timeRange, setTimeRange] = useState("today");
  // selectedMonth: "YYYY-MM" string, defaults to current month
  const [selectedMonth, setSelectedMonth] = useState(toYearMonth(new Date()));
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = isCurrentUserAdmin();
  
  useEffect(() => {
    fetchAllPages("/api/item-types/")
      .then(setAllItemTypes)
      .catch((err) => console.error("Item types fetch error", err));
  }, []);

  function fetchCustomers() {
    fetchAllPages("/api/customers/")
      .then(setCustomers)
      .catch((e) => console.error(e));
  }

  function fetchSales() {
    fetchAllPages("/api/daily-sales/")
      .then(setSales)
      .catch((e) => console.error(e));
  }

  useEffect(() => { fetchCustomers(); }, []);
  useEffect(() => { fetchSales(); }, []);

  const filteredSales = (() => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    let filtered = [...sales];
    const getCustomerLabel = (customerId) =>
      customers.find((customer) => customer.id === customerId)?.full_name || "—";

    // ── time filter ──
    if (timeRange === "today") {
      filtered = filtered.filter((s) => {
        const d = parseSaleDate(s.sale_date);
        if (!d) return false;
        d.setHours(0, 0, 0, 0);
        return d.getTime() === todayDate.getTime();
      });
    } else if (timeRange === "this_month") {
      const currentYM = toYearMonth(new Date());
      filtered = filtered.filter((s) => {
        const d = parseSaleDate(s.sale_date);
        if (!d) return false;
        return toYearMonth(d) === currentYM;
      });
    } else if (timeRange === "pick_month") {
      filtered = filtered.filter((s) => {
        const d = parseSaleDate(s.sale_date);
        if (!d) return false;
        return toYearMonth(d) === selectedMonth;
      });
    }
    // "all" → no date filter

    // ── search by customer name ──
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((s) => {
        const name = getCustomerLabel(s.customer).toLowerCase();
        return name.includes(q);
      });
    }

    filtered.sort((a, b) => {
      const da = parseSaleDate(a.sale_date);
      const db = parseSaleDate(b.sale_date);
      return (da || 0) - (db || 0);
    });

    return filtered;
  })();

  // Accessory item types only — filter by category "accessory" (case-insensitive)
  const accessoryItemTypes = allItemTypes.filter(
    (it) => it.category?.toLowerCase() === "accessory"
  );
  const selectedAccessory = accessoryItemTypes.find(
    (item) => item.name === formData.item_type
  );

  const handleSaleTypeChange = (type) => {
    setFormData({ ...initialFormState, sale_type: type });
  };

  const handleCustomerChange = (e) => {
    const id = e.target.value;
    const sel = customers.find((c) => c.id === parseInt(id));
    if (sel) {
      setFormData((prev) => ({
        ...prev,
        customer: id,
        phone: sel.phone,
        address: sel.address,
        item_type: sel.item_type,
        cylinder_size: sel.cylinder_size,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        customer: "",
        phone: "",
        address: "",
        item_type: "",
        cylinder_size: "",
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId && !isAdmin) {
      alert("Only admins can edit sales records.");
      return;
    }
    if (formData.sale_type === "cylinder" && !formData.customer) {
      alert("Please select a customer for cylinder sales");
      return;
    }
    if (!formData.amount) { alert("Please enter amount"); return; }

    const token = localStorage.getItem("access");
    const payload = {
      sale_type: formData.sale_type,
      customer: formData.sale_type === "cylinder" ? parseInt(formData.customer) : null,
      phone: formData.phone || null,
      address: formData.address || null,
      category: formData.sale_type === "cylinder" ? "cylinder" : "accessory",
      item_type: formData.item_type || null,
      cylinder_size: formData.cylinder_size || null,
      refill: formData.refill,
      quantity: parseInt(formData.quantity) || 1,
      amount: parseFloat(formData.amount),
    };

    try {
      const url = editingId
        ? `http://127.0.0.1:8000/api/daily-sales/${editingId}/`
        : "http://127.0.0.1:8000/api/daily-sales/";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Failed: ${getErrorMessage(err)}`);
        return;
      }

      alert(`Sale ${editingId ? "updated" : "added"} successfully`);
      handleReset();
      fetchSales();
    } catch (err) {
      console.error(err);
      alert("Error saving sale");
    }
  };

  const handleEdit = (sale) => {
    if (!isAdmin) {
      alert("Only admins can edit sales records.");
      return;
    }
    setEditingId(sale.id);
    setFormData({
      sale_type: sale.sale_type,
      customer: sale.customer || "",
      phone: sale.phone || "",
      address: sale.address || "",
      item_type: sale.item_type || "",
      cylinder_size: sale.cylinder_size || "",
      refill: sale.refill || false,
      quantity: sale.quantity.toString(),
      amount: sale.amount.toString(),
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      alert("Only admins can delete sales records.");
      return;
    }
    if (!window.confirm("Delete this sale?")) return;
    const token = localStorage.getItem("access");
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/daily-sales/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { alert("Sale deleted"); fetchSales(); }
      else alert("Failed to delete sale");
    } catch (err) { console.error(err); }
  };

  const getRefillCount = (customerId) =>
    sales.filter(
      (s) => s.customer === customerId && s.sale_type === "cylinder" && s.refill
    ).length;

  const getCustomerName = (id) =>
    customers.find((c) => c.id === id)?.full_name || "—";

  // summary stats
  const totalRevenue = filteredSales.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
  const cylinderCount = filteredSales.filter((s) => s.sale_type === "cylinder").length;
  const accessoryCount = filteredSales.filter((s) => s.sale_type === "accessory").length;
  const refillCount = filteredSales.filter((s) => s.refill).length;

  const fmt = (d) => {
    try {
      const parsed = parseSaleDate(d);
      return parsed ? parsed.toLocaleDateString() : d;
    } catch { return d; }
  };

  // Build max month string for the month picker (current month)
  const maxMonth = toYearMonth(new Date());

  return (
    <>
      <style>{styles}</style>
      <div className="ds-root">

        {/* ── form ── */}
        {showForm && (
          <div className="ds-form-wrap">
            <div className="ds-form-card">
              <div className="ds-form-hero">
                <h3>{editingId ? "Edit Sale" : "Record New Sale"}</h3>
                <p>
                  {editingId
                    ? "Update the sale information below"
                    : "Fill in the details to record a new sale"}
                </p>
              </div>

              <div className="ds-form-body">
                <form onSubmit={handleSubmit}>

                  {/* ── sale type toggle ── */}
                  <div className="ds-section-label">
                    <div className="ds-section-icon">
                      <i className="bi bi-tag-fill"></i>
                    </div>
                    <span>Sale Type</span>
                  </div>

                  <div className="ds-field">
                    <div className="ds-type-toggle">
                      <button
                        type="button"
                        className={`ds-type-opt${formData.sale_type === "cylinder" ? " active cylinder" : ""}`}
                        onClick={() => handleSaleTypeChange("cylinder")}
                      >
                        🧴 Cylinder
                      </button>
                      <button
                        type="button"
                        className={`ds-type-opt${formData.sale_type === "accessory" ? " active accessory" : ""}`}
                        onClick={() => handleSaleTypeChange("accessory")}
                      >
                        🔧 Accessory
                      </button>
                    </div>
                  </div>

                  {/* ── cylinder: customer info ── */}
                  {formData.sale_type === "cylinder" && (
                    <>
                      <div className="ds-section-label" style={{ marginTop: "1.5rem" }}>
                        <div className="ds-section-icon">
                          <i className="bi bi-person-fill"></i>
                        </div>
                        <span>Customer Information</span>
                      </div>

                      <div className="ds-field">
                        <label className="ds-label">Customer *</label>
                        <div className="ds-select-wrap">
                          <select
                            className="ds-select"
                            name="customer"
                            value={formData.customer}
                            onChange={handleCustomerChange}
                            required
                          >
                            <option value="">— Select Customer —</option>
                            {customers.map((c) => (
                              <option key={c.id} value={c.id}>
                                {formatCustomerPurchaseLabel(c)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="ds-grid-2">
                        <div className="ds-field">
                          <label className="ds-label">Phone</label>
                          <div className={`ds-info-tile${!formData.phone ? " empty" : ""}`}>
                            {formData.phone || "Auto-filled on selection"}
                          </div>
                        </div>
                        <div className="ds-field">
                          <label className="ds-label">Address</label>
                          <div className={`ds-info-tile${!formData.address ? " empty" : ""}`}>
                            {formData.address || "Auto-filled on selection"}
                          </div>
                        </div>
                      </div>

                      <div className="ds-grid-2">
                        <div className="ds-field">
                          <label className="ds-label">Item Type</label>
                          <div className={`ds-info-tile${!formData.item_type ? " empty" : ""}`}>
                            {formData.item_type || "Auto-filled on selection"}
                          </div>
                        </div>
                        <div className="ds-field">
                          <label className="ds-label">Cylinder Size</label>
                          <div className={`ds-info-tile${!formData.cylinder_size ? " empty" : ""}`}>
                            {formData.cylinder_size || "Auto-filled on selection"}
                          </div>
                        </div>
                      </div>

                      <div className="ds-field">
                        <label className="ds-checkbox-row">
                          <input
                            type="checkbox"
                            name="refill"
                            checked={formData.refill}
                            onChange={handleChange}
                          />
                          <span>Mark as Refill</span>
                        </label>
                      </div>
                    </>
                  )}

                  {/* ── accessory: item type dropdown ── */}
                  {formData.sale_type === "accessory" && (
                    <>
                      <div className="ds-section-label" style={{ marginTop: "1.5rem" }}>
                        <div className="ds-section-icon">
                          <i className="bi bi-box-seam"></i>
                        </div>
                        <span>Accessory Details</span>
                      </div>

                      <div className="ds-field">
                        <label className="ds-label">Item Type *</label>
                        <div className="ds-select-wrap">
                          <select
                            className="ds-select"
                            name="item_type"
                            value={formData.item_type}
                            onChange={handleChange}
                            required
                          >
                            <option value="">— Select Item Type —</option>
                            {accessoryItemTypes.length > 0 ? (
                              accessoryItemTypes.map((it) => (
                                <option key={it.id} value={it.name}>
                                  {it.name} ({it.quantity} in stock)
                                </option>
                              ))
                            ) : (
                              <option disabled>No accessory item types found</option>
                            )}
                          </select>
                        </div>
                      </div>

                      <div className="ds-field">
                        <label className="ds-label">Available Stock</label>
                        <div className={`ds-info-tile${!selectedAccessory ? " empty" : ""}`}>
                          {selectedAccessory
                            ? `${selectedAccessory.quantity} item(s) currently available`
                            : "Select an accessory to view stock"}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── sale details ── */}
                  <div className="ds-section-label" style={{ marginTop: "1.5rem" }}>
                    <div className="ds-section-icon">
                      <i className="bi bi-cash-coin"></i>
                    </div>
                    <span>Sale Details</span>
                  </div>

                  <div className="ds-grid-2">
                    <div className="ds-field">
                      <label className="ds-label">Quantity *</label>
                      <input
                        type="text"
                        className="ds-input"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        min="1"
                        required
                      />
                    </div>
                    <div className="ds-field">
                      <label className="ds-label">Amount (NPR) *</label>
                      <input
                        type="text"
                        className="ds-input"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  {/* ── footer ── */}
                  <div className="ds-form-footer">
                    <button type="button" className="ds-btn-cancel" onClick={handleReset}>
                      Cancel
                    </button>
                    <button type="submit" className="ds-btn-submit">
                      {editingId ? "Update Sale" : "Add Sale"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── page header ── */}
        <div className="ds-header">
          <h2>Daily <span>Sales</span></h2>
          <div className="ds-header-right">

            {/* search by customer name */}
            <div className="ds-search-wrap">
              <i className="bi bi-search ds-search-icon"></i>
              <input
                type="text"
                className="ds-search-input"
                placeholder="Search customer…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* time filter pill */}
            <div className="ds-filter-group">
              {[
                { key: "today", label: "Today" },
                { key: "this_month", label: "This Month" },
                { key: "pick_month", label: "By Month" },
                { key: "all", label: "All" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`ds-filter-btn${timeRange === key ? " active" : ""}`}
                  onClick={() => setTimeRange(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* month picker — visible only when "By Month" is selected */}
            {timeRange === "pick_month" && (
              <input
                type="month"
                className={`ds-month-picker${timeRange === "pick_month" ? " active" : ""}`}
                value={selectedMonth}
                max={maxMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            )}

            <button className="ds-btn-add" onClick={() => setShowForm((p) => !p)}>
              <i className={`bi bi-${showForm ? "x-lg" : "plus-lg"}`}></i>
              {showForm ? "Close" : "Add Sale"}
            </button>
          </div>
        </div>

        {/* ── summary strip ── */}
        <div className="ds-summary">
          <div className="ds-stat">
            <div className="ds-stat-label">Total Revenue</div>
            <div className="ds-stat-value accent">
              NPR {totalRevenue.toLocaleString("en-NP", { minimumFractionDigits: 0 })}
            </div>
          </div>
          <div className="ds-stat">
            <div className="ds-stat-label">Total Sales</div>
            <div className="ds-stat-value">{filteredSales.length}</div>
          </div>
          <div className="ds-stat">
            <div className="ds-stat-label">Cylinders</div>
            <div className="ds-stat-value">{cylinderCount}</div>
          </div>
          <div className="ds-stat">
            <div className="ds-stat-label">Accessories</div>
            <div className="ds-stat-value">{accessoryCount}</div>
          </div>
          <div className="ds-stat">
            <div className="ds-stat-label">Refills</div>
            <div className="ds-stat-value">{refillCount}</div>
          </div>
        </div>

        {/* ── table ── */}
        <div className="ds-table-card">
          <table className="ds-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Item Type</th>
                <th>Size</th>
                <th>Refill #</th>
                <th>Qty</th>
                <th>Amount</th>
                <th>Audit Trail</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="11">
                    <div className="ds-empty">
                      <div className="ds-empty-icon">📊</div>
                      No sales recorded for this period
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{fmt(sale.sale_date)}</td>
                    <td>
                      <span className={`ds-badge ds-badge-${sale.sale_type}`}>
                        {sale.sale_type === "cylinder" ? "Cylinder" : "Accessory"}
                      </span>
                    </td>
                    <td>
                      {sale.customer
                        ? <strong>{getCustomerName(sale.customer)}</strong>
                        : <span style={{ color: "#bbb" }}>—</span>}
                    </td>
                    <td>{sale.phone || "—"}</td>
                    <td>{sale.item_type || "—"}</td>
                    <td>{sale.cylinder_size || "—"}</td>
                    <td>
                      {sale.sale_type === "cylinder" && sale.customer ? (
                        <span className="ds-badge ds-badge-count">
                          {getRefillCount(sale.customer)}
                        </span>
                      ) : "—"}
                    </td>
                    <td>{sale.quantity}</td>
                    <td><strong>NPR {parseFloat(sale.amount).toLocaleString()}</strong></td>
                    <td>
                      <div className="ds-audit">
                        <span className="ds-audit-user">
                          {sale.created_by_name || "Not recorded"}
                        </span>
                        <span className="ds-audit-time">
                          {formatAuditTimestamp(sale.created_at)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <button
                        className="ds-action-btn ds-btn-edit"
                        onClick={() => handleEdit(sale)}
                        title={isAdmin ? "Edit" : "Admin only"}
                        disabled={!isAdmin}
                      >
                        <i className="bi bi-pencil-fill"></i> E
                      </button>{" "}
                      <button
                        className="ds-action-btn ds-btn-delete"
                        onClick={() => handleDelete(sale.id)}
                        title={isAdmin ? "Delete" : "Admin only"}
                        disabled={!isAdmin}
                      >
                        <i className="bi bi-trash-fill"></i> D
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </>
  );
};

export default DailySales;
