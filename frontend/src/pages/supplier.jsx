import { useEffect, useState } from "react";
import { fetchAllPages } from "../utils/paginated";

/* ── shared design system (mirrors Customer.jsx / DailySales.jsx) ── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');

  .sp-root {
    font-family: 'DM Sans', sans-serif;
    background: #f4f1eb;
    min-height: 100vh;
    padding: 2rem 1.5rem;
    color: #1a1a1a;
  }

  /* ── page header ── */
  .sp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .sp-header h2 {
    font-family: 'DM Serif Display', serif;
    font-size: 2rem;
    margin: 0;
    letter-spacing: -0.02em;
  }
  .sp-header h2 span { color: #c0392b; }

  /* ── add button ── */
  .sp-btn-add {
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
  .sp-btn-add:hover { background: #c0392b; transform: translateY(-1px); }

  /* ── summary strip ── */
  .sp-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  .sp-stat {
    background: #fff;
    border-radius: 14px;
    padding: 1rem 1.25rem;
    box-shadow: 0 1px 8px rgba(0,0,0,.06);
  }
  .sp-stat-label {
    font-size: .72rem;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: #999;
    font-weight: 600;
    margin-bottom: .3rem;
  }
  .sp-stat-value {
    font-family: 'DM Serif Display', serif;
    font-size: 1.5rem;
    color: #1a1a1a;
    line-height: 1.1;
  }
  .sp-stat-value.accent { color: #c0392b; }

  /* ── cylinder size checkboxes ── */
.sp-checkbox-group {
  display: flex;
  gap: .75rem;
  flex-wrap: wrap;
  padding: .5rem 0;
}
.sp-checkbox-label {
  display: flex;
  align-items: center;
  gap: .4rem;
  cursor: pointer;
  font-size: .9rem;
  color: #1a1a1a;
  background: #faf8f4;
  border: 1.5px solid #e8e3da;
  border-radius: 8px;
  padding: .45rem .85rem;
  transition: border-color .2s, background .2s;
  user-select: none;
}
.sp-checkbox-label:hover {
  border-color: #c0392b;
  background: #fff;
}
.sp-checkbox-label input[type="checkbox"] {
  accent-color: #c0392b;
  width: 15px;
  height: 15px;
  cursor: pointer;
}
.sp-checkbox-label.checked {
  border-color: #c0392b;
  background: #fdecea;
  color: #c0392b;
  font-weight: 600;
}
  /* ── table card ── */
  .sp-table-card {
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 20px rgba(0,0,0,.07);
  }
  .sp-table {
    width: 100%;
    border-collapse: collapse;
    font-size: .875rem;
  }
  .sp-table thead tr {
    background: #1a1a1a;
    color: #f4f1eb;
  }
  .sp-table thead th {
    padding: .9rem 1rem;
    font-weight: 500;
    letter-spacing: .04em;
    font-size: .78rem;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .sp-table tbody tr {
    border-bottom: 1px solid #f0ede6;
    transition: background .15s;
  }
  .sp-table tbody tr:last-child { border-bottom: none; }
  .sp-table tbody tr:hover { background: #faf8f4; }
  .sp-table tbody td {
    padding: .85rem 1rem;
    vertical-align: middle;
  }

  .sp-badge {
    display: inline-block;
    padding: .25rem .75rem;
    border-radius: 50px;
    font-size: .75rem;
    font-weight: 600;
  }
  .sp-badge-cat  { background: #fdecea; color: #c0392b; }
  .sp-badge-type { background: #eaf4fd; color: #1a6fa8; }
  .sp-badge-due  { background: #fef9e7; color: #b7770d; }
  .sp-badge-paid { background: #eafaf1; color: #1e8449; }

  .sp-empty {
    text-align: center;
    padding: 3rem 1rem;
    color: #999;
    font-size: .95rem;
  }
  .sp-empty-icon { font-size: 2.5rem; margin-bottom: .5rem; }

  /* ── action buttons ── */
  .sp-action-btn {
    width: 32px; height: 32px;
    border-radius: 8px; border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center; justify-content: center;
    font-size: .85rem;
    transition: opacity .15s, transform .15s;
  }
  .sp-action-btn:hover { opacity: .8; transform: scale(1.1); }
  .sp-btn-edit   { background: #fff3cd; color: #856404; }
  .sp-btn-delete { background: #fdecea; color: #c0392b; }

  /* ── form card ── */
  .sp-form-wrap {
    max-width: 860px;
    margin: 0 auto 2rem;
  }
  .sp-form-card {
    background: #fff;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 30px rgba(0,0,0,.1);
  }
  .sp-form-hero {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    padding: 2rem 2.5rem;
    position: relative;
    overflow: hidden;
  }
  .sp-form-hero::after {
    content: '';
    position: absolute; right: -40px; top: -40px;
    width: 180px; height: 180px; border-radius: 50%;
    background: rgba(192,57,43,.25);
  }
  .sp-form-hero::before {
    content: '';
    position: absolute; right: 60px; bottom: -60px;
    width: 120px; height: 120px; border-radius: 50%;
    background: rgba(192,57,43,.12);
  }
  .sp-form-hero h3 {
    font-family: 'DM Serif Display', serif;
    color: #fff; font-size: 1.6rem;
    margin: 0 0 .3rem;
    position: relative; z-index: 1;
  }
  .sp-form-hero p {
    color: rgba(255,255,255,.55); font-size: .85rem;
    margin: 0; position: relative; z-index: 1;
  }

  .sp-form-body { padding: 2rem 2.5rem; }

  /* ── section divider ── */
  .sp-section-label {
    display: flex; align-items: center; gap: .75rem;
    margin-bottom: 1.25rem; margin-top: .5rem;
  }
  .sp-section-label .sp-section-icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: #fdecea; color: #c0392b;
    display: flex; align-items: center; justify-content: center;
    font-size: .9rem; flex-shrink: 0;
  }
  .sp-section-label span {
    font-weight: 600; font-size: .9rem;
    letter-spacing: .05em; text-transform: uppercase; color: #555;
  }
  .sp-section-label::after {
    content: ''; flex: 1; height: 1px; background: #ece9e2;
  }

  /* ── fields ── */
  .sp-field { margin-bottom: 1.1rem; }
  .sp-label {
    display: block; font-size: .8rem; font-weight: 600;
    letter-spacing: .05em; text-transform: uppercase;
    color: #777; margin-bottom: .4rem;
  }
  .sp-input, .sp-select {
    width: 100%;
    border: 1.5px solid #e8e3da; border-radius: 10px;
    padding: .65rem .9rem;
    font-family: 'DM Sans', sans-serif;
    font-size: .9rem; color: #1a1a1a;
    background: #faf8f4;
    transition: border-color .2s, box-shadow .2s, background .2s;
    outline: none; box-sizing: border-box;
  }
  .sp-input:focus, .sp-select:focus {
    border-color: #c0392b; background: #fff;
    box-shadow: 0 0 0 3px rgba(192,57,43,.1);
  }
  .sp-select { appearance: none; cursor: pointer; }
  .sp-select:disabled { opacity: .5; cursor: not-allowed; }
  .sp-select-wrap { position: relative; }
  .sp-select-wrap::after {
    content: '▾';
    position: absolute; right: .9rem; top: 50%;
    transform: translateY(-50%);
    color: #999; pointer-events: none; font-size: .8rem;
  }

  /* ── live balance indicator ── */
  .sp-balance {
    display: flex; align-items: center; gap: .5rem;
    padding: .6rem 1rem; border-radius: 10px;
    font-size: .85rem; font-weight: 600; margin-top: .5rem;
  }
  .sp-balance.due  { background: #fef9e7; color: #b7770d; border: 1.5px solid #fdebd0; }
  .sp-balance.paid { background: #eafaf1; color: #1e8449; border: 1.5px solid #d5f5e3; }

  /* ── form footer ── */
  .sp-form-footer {
    display: flex; justify-content: flex-end; gap: .75rem;
    padding-top: 1rem; border-top: 1px solid #ece9e2; margin-top: .5rem;
  }
  .sp-btn-cancel {
    padding: .65rem 1.5rem; border-radius: 50px;
    border: 1.5px solid #ddd; background: transparent;
    font-family: 'DM Sans', sans-serif; font-size: .9rem;
    color: #555; cursor: pointer;
    transition: border-color .2s, color .2s;
  }
  .sp-btn-cancel:hover { border-color: #1a1a1a; color: #1a1a1a; }
  .sp-btn-submit {
    padding: .65rem 1.8rem; border-radius: 50px; border: none;
    background: #c0392b; color: #fff;
    font-family: 'DM Sans', sans-serif; font-size: .9rem; font-weight: 600;
    cursor: pointer; transition: background .2s, transform .15s;
  }
  .sp-btn-submit:hover { background: #a93226; transform: translateY(-1px); }

  .sp-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  @media (max-width: 640px) {
    .sp-grid-2 { grid-template-columns: 1fr; }
    .sp-form-hero, .sp-form-body { padding: 1.5rem; }
  }

  /* ── pagination ── */
  .sp-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1.5rem;
    padding: 1rem;
    flex-wrap: wrap;
  }
  .sp-pagination-btn {
    padding: 0.5rem 0.8rem;
    border-radius: 8px;
    border: 1.5px solid #e8e3da;
    background: transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.85rem;
    color: #555;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
  }
  .sp-pagination-btn:hover {
    border-color: #c0392b;
    background: #fdecea;
  }
  .sp-pagination-btn.active {
    background: #1a1a1a;
    color: #f4f1eb;
    border-color: #1a1a1a;
  }
  .sp-pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .sp-pagination-info {
    font-size: 0.85rem;
    color: #777;
    margin: 0 0.5rem;
  }
`;

const Supplier = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    supplier_name: "",
    category: "",
    item_type: "",
    cylinder_size: "",
    quantity_received: "",
    date_received: "",
    total_amount: "",
    amount_paid: "",
  });

  const [categoriesData, setCategoriesData] = useState([]);
  const [allItemTypes, setAllItemTypes] = useState([]);

  useEffect(() => {
    fetchAllPages("/api/categories/")
      .then(setCategoriesData)
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchAllPages("/api/item-types/")
      .then(setAllItemTypes)
      .catch(console.error);
  }, []);

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = () => {
    fetchAllPages("/api/suppliers/")
      .then(setSuppliers)
      .catch(console.error);
  };

  const CYLINDER_SIZES = ["Small", "Medium", "Large"];

const handleCylinderSizeChange = (size) => {
  const current = formData.cylinder_size
    ? formData.cylinder_size.split(",").map(s => s.trim()).filter(Boolean)
    : [];
  const updated = current.includes(size)
    ? current.filter(s => s !== size)
    : [...current, size];
  // preserve order: Small → Medium → Large
  const ordered = CYLINDER_SIZES.filter(s => updated.includes(s));
  setFormData(prev => ({ ...prev, cylinder_size: ordered.join(", ") }));
};
  const filteredItemTypes = formData.category
    ? allItemTypes.filter((it) => String(it.category) === String(formData.category))
    : [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "category") {
      setFormData((prev) => ({ ...prev, category: value, item_type: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      supplier_name: formData.supplier_name,
      category: Number(formData.category),
      item_type: formData.item_type,
      cylinder_size: formData.cylinder_size,
      quantity_received: Number(formData.quantity_received),
      date_received: formData.date_received,
      total_amount: Number(formData.total_amount),
      amount_paid: Number(formData.amount_paid),
    };
    try {
      const token = localStorage.getItem("access");
      const url = editingId
        ? `http://127.0.0.1:8000/api/suppliers/${editingId}/`
        : "http://127.0.0.1:8000/api/suppliers/";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        console.error("Save error:", err);
        alert("Failed to save record.");
        return;
      }
      alert(`Supplier record ${editingId ? "updated" : "saved"} successfully`);
      resetForm();
      fetchSuppliers();
    } catch (err) { console.error("SAVE ERROR", err); }
  };

  const handleEdit = (s) => {
    setEditingId(s.id);
    setFormData({
      supplier_name: s.supplier_name,
      category: s.category,
      item_type: s.item_type,
      cylinder_size: s.cylinder_size,
      quantity_received: s.quantity_received,
      date_received: s.date_received || "",
      total_amount: s.total_amount,
      amount_paid: s.amount_paid,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(`http://127.0.0.1:8000/api/suppliers/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { alert("Record deleted successfully"); fetchSuppliers(); }
      else alert("Failed to delete record");
    } catch (err) { console.error("DELETE ERROR", err); }
  };

  const resetForm = () => {
    setFormData({
      supplier_name: "", category: "", item_type: "",
      cylinder_size: "", quantity_received: "", date_received: "",
      total_amount: "", amount_paid: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getCategoryName = (id) =>
    categoriesData.find((c) => c.id === Number(id))?.name || id;

  // Pagination logic
  const totalPages = Math.ceil(suppliers.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedSuppliers = suppliers.slice(startIdx, endIdx);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // summary stats
  const totalReceived = suppliers.reduce((s, r) => s + Number(r.quantity_received || 0), 0);
  const totalPaid     = suppliers.reduce((s, r) => s + Number(r.amount_paid || 0), 0);
  const totalDue      = suppliers.reduce((s, r) => s + (Number(r.total_amount || 0) - Number(r.amount_paid || 0)), 0);

  // live balance preview in form
  const formBalance = formData.total_amount && formData.amount_paid
    ? Number(formData.total_amount) - Number(formData.amount_paid)
    : null;

  return (
    <>
      <style>{styles}</style>
      <div className="sp-root">

        {/* ── form ── */}
        {showForm && (
          <div className="sp-form-wrap">
            <div className="sp-form-card">
              <div className="sp-form-hero">
                <h3>{editingId ? "Edit Supplier Record" : "New Supplier Record"}</h3>
                <p>
                  {editingId
                    ? "Update the supplier's information below"
                    : "Fill in the details to add a new supplier record"}
                </p>
              </div>

              <div className="sp-form-body">
                <form onSubmit={handleSubmit}>

                  {/* supplier & item */}
                  <div className="sp-section-label">
                    <div className="sp-section-icon"><i className="bi bi-truck"></i></div>
                    <span>Supplier & Item</span>
                  </div>

                  <div className="sp-grid-2">
                    <div className="sp-field">
                      <label className="sp-label">Supplier Name *</label>
                      <input
                        className="sp-input"
                        name="supplier_name"
                        placeholder="e.g. Nepal Gas Company"
                        value={formData.supplier_name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                   <div className="sp-field">
  <label className="sp-label">Cylinder Size</label>
  <div className="sp-checkbox-group">
    {CYLINDER_SIZES.map(size => {
      const isChecked = formData.cylinder_size
        ? formData.cylinder_size.split(",").map(s => s.trim()).includes(size)
        : false;
      return (
        <label
          key={size}
          className={`sp-checkbox-label${isChecked ? " checked" : ""}`}
        >
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => handleCylinderSizeChange(size)}
          />
          {size}
        </label>
      );
    })}
  </div>
</div>
                  </div>

                  <div className="sp-grid-2">
                    <div className="sp-field">
                      <label className="sp-label">Category *</label>
                      <div className="sp-select-wrap">
                        <select
                          className="sp-select"
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Category</option>
                          {categoriesData.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="sp-field">
                      <label className="sp-label">Item Type *</label>
                      <div className="sp-select-wrap">
                        <select
                          className="sp-select"
                          name="item_type"
                          value={formData.item_type}
                          onChange={handleChange}
                          required
                          disabled={!formData.category}
                        >
                          <option value="">
                            {formData.category ? "Select Item Type" : "Pick category first"}
                          </option>
                          {filteredItemTypes.map((it) => (
                            <option key={it.id} value={it.name}>{it.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* quantity & date */}
                  <div className="sp-section-label" style={{ marginTop: "1.5rem" }}>
                    <div className="sp-section-icon"><i className="bi bi-boxes"></i></div>
                    <span>Quantity & Date</span>
                  </div>

                  <div className="sp-grid-2">
                    <div className="sp-field">
                      <label className="sp-label">Qty Received *</label>
                      <input
                        type="number" className="sp-input"
                        name="quantity_received" placeholder="0" min="0"
                        value={formData.quantity_received} onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="sp-field">
                      <label className="sp-label">Date Received *</label>
                      <input
                        type="date" className="sp-input"
                        name="date_received"
                        value={formData.date_received} onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* payment */}
                  <div className="sp-section-label" style={{ marginTop: "1.5rem" }}>
                    <div className="sp-section-icon"><i className="bi bi-cash-coin"></i></div>
                    <span>Payment</span>
                  </div>

                  <div className="sp-grid-2">
                    <div className="sp-field">
                      <label className="sp-label">Total Amount (NPR)</label>
                      <input
                        type="text" className="sp-input"
                        name="total_amount" placeholder="0.00" min="0"
                        value={formData.total_amount} onChange={handleChange}
                      />
                    </div>
                    <div className="sp-field">
                      <label className="sp-label">Amount Paid (NPR)</label>
                      <input
                        type="text" className="sp-input"
                        name="amount_paid" placeholder="0.00" min="0"
                        value={formData.amount_paid} onChange={handleChange}
                      />
                    </div>
                  </div>

                  {formBalance !== null && (
                    <div className={`sp-balance ${formBalance <= 0 ? "paid" : "due"}`}>
                      {formBalance <= 0
                        ? <><i className="bi bi-check-circle-fill"></i> Fully paid</>
                        : <><i className="bi bi-exclamation-circle-fill"></i> Balance due: NPR {formBalance.toLocaleString()}</>
                      }
                    </div>
                  )}

                  <div className="sp-form-footer">
                    <button type="button" className="sp-btn-cancel" onClick={resetForm}>Cancel</button>
                    <button type="submit" className="sp-btn-submit">
                      {editingId ? "Update Record" : "Save Record"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── page header ── */}
        <div className="sp-header">
          <h2>Supplier <span>Records</span></h2>
          <button className="sp-btn-add" onClick={() => setShowForm((p) => !p)}>
            <i className={`bi bi-${showForm ? "x-lg" : "plus-lg"}`}></i>
            {showForm ? "Close" : "Add Record"}
          </button>
        </div>

        {/* ── summary strip ── */}
        {suppliers.length > 0 && (
          <div className="sp-summary">
            <div className="sp-stat">
              <div className="sp-stat-label">Total Suppliers</div>
              <div className="sp-stat-value">{suppliers.length}</div>
            </div>
            <div className="sp-stat">
              <div className="sp-stat-label">Qty Received</div>
              <div className="sp-stat-value">{totalReceived}</div>
            </div>

            <div className="sp-stat">
              <div className="sp-stat-label">Total Paid</div>
              <div className="sp-stat-value">NPR {totalPaid.toLocaleString()}</div>
            </div>
            <div className="sp-stat">
              <div className="sp-stat-label">Balance Due</div>
              <div className={`sp-stat-value${totalDue > 0 ? " accent" : ""}`}>
                NPR {totalDue.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* ── table ── */}
        <div className="sp-table-card">
          <table className="sp-table">
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>Category</th>
                <th>Item Type</th>
                <th>Cyl. Size</th>
                <th>Qty Received</th>
                <th>Date Received</th>
                <th>Total Amount</th>
                <th>Amount Paid</th>
                <th>Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="10">
                    <div className="sp-empty">
                      <div className="sp-empty-icon">🚚</div>
                      No supplier records found
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSuppliers.map((s) => {
                  const balance = Number(s.total_amount) - Number(s.amount_paid);
                  return (
                    <tr key={s.id}>
                      <td><strong>{s.supplier_name}</strong></td>
                      <td>
                        <span className="sp-badge sp-badge-cat">
                          {getCategoryName(s.category)}
                        </span>
                      </td>
                      <td>
                        <span className="sp-badge sp-badge-type">
                          {s.item_type}
                        </span>
                      </td>
                      <td>{s.cylinder_size || "—"}</td>
                      <td>{s.quantity_received}</td>
                      <td>{new Date(s.date_received).toLocaleDateString()}</td>
                      <td>NPR {Number(s.total_amount).toLocaleString()}</td>
                      <td>NPR {Number(s.amount_paid).toLocaleString()}</td>
                      <td>
                        <span className={`sp-badge ${balance <= 0 ? "sp-badge-paid" : "sp-badge-due"}`}>
                          {balance <= 0 ? "Paid" : `NPR ${balance.toLocaleString()}`}
                        </span>
                      </td>
                      <td>
                        <button
                          className="sp-action-btn sp-btn-edit"
                          onClick={() => handleEdit(s)} title="Edit"
                        >
                          <i className="bi bi-pencil-fill"></i> E
                        </button>{" "}
                        <button
                          className="sp-action-btn sp-btn-delete"
                          onClick={() => handleDelete(s.id)} title="Delete"
                        >
                          <i className="bi bi-trash-fill"></i> D
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* ── pagination ── */}
          {suppliers.length > 0 && (
            <div className="sp-pagination">
              <button
                className="sp-pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
              >
                « First
              </button>
              <button
                className="sp-pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                ‹ Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`sp-pagination-btn${currentPage === page ? " active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                className="sp-pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next ›
              </button>
              <button
                className="sp-pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
              >
                Last »
              </button>

              <span className="sp-pagination-info">
                Page {currentPage} of {totalPages} ({suppliers.length} total)
              </span>
            </div>
          )}
        </div>

      </div>
    </>
  );
};

export default Supplier;
