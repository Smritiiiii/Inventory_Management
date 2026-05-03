import { useState, useEffect } from "react";
import { fetchAllPages } from "../utils/paginated";
import { isCurrentUserAdmin } from "../utils/auth";
import { formatAuditTimestamp } from "../utils/audit";

const initialFormState = {
  full_name: "",
  phone: "",
  address: "",
  category: "",
  item_type: "",
  cylinder_size: "",
  quantity: "",
  deposit_amount: "",
  deposit_date: new Date().toISOString().split("T")[0],
  returned_date: "",
};

/* ── inline styles ───────────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');

  .cr-root {
    font-family: 'DM Sans', sans-serif;
    background: #f4f1eb;
    min-height: 100vh;
    padding: 2rem 1.5rem;
    color: #1a1a1a;
  }

  /* ── page header ── */
  .cr-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
  }
  .cr-header h2 {
    font-family: 'DM Serif Display', serif;
    font-size: 2rem;
    margin: 0;
    letter-spacing: -0.02em;
  }
  .cr-header h2 span { color: #c0392b; }

  /* ── add button ── */
  .cr-btn-add {
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
  .cr-btn-add:hover { background: #c0392b; transform: translateY(-1px); }

  /* ── table card ── */
  .cr-table-card {
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 20px rgba(0,0,0,.07);
  }
  .cr-table {
    width: 100%;
    border-collapse: collapse;
    font-size: .875rem;
  }
  .cr-table thead tr {
    background: #1a1a1a;
    color: #f4f1eb;
  }
  .cr-table thead th {
    padding: .9rem 1rem;
    font-weight: 500;
    letter-spacing: .04em;
    font-size: .78rem;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .cr-table tbody tr {
    border-bottom: 1px solid #f0ede6;
    transition: background .15s;
  }
  .cr-table tbody tr:last-child { border-bottom: none; }
  .cr-table tbody tr:hover { background: #faf8f4; }
  .cr-table tbody td {
    padding: .85rem 1rem;
    vertical-align: middle;
  }

  .cr-badge {
    display: inline-block;
    padding: .25rem .75rem;
    border-radius: 50px;
    font-size: .75rem;
    font-weight: 600;
  }
  .cr-badge-cat { background: #fdecea; color: #c0392b; }
  .cr-badge-type { background: #eaf4fd; color: #1a6fa8; }
  .cr-badge-returned { background: #eafaf1; color: #1e8449; }
  .cr-badge-pending { background: #fef9e7; color: #b7770d; }

  .cr-empty {
    text-align: center;
    padding: 3rem 1rem;
    color: #999;
    font-size: .95rem;
  }
  .cr-empty-icon { font-size: 2.5rem; margin-bottom: .5rem; }

  /* ── action buttons ── */
  .cr-action-btn {
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
  .cr-action-btn:hover { opacity: .8; transform: scale(1.1); }
  .cr-action-btn:disabled,
  .cr-action-btn:disabled:hover {
    opacity: .45;
    cursor: not-allowed;
    transform: none;
  }
  .cr-btn-edit { background: #fff3cd; color: #856404; }
  .cr-btn-delete { background: #fdecea; color: #c0392b; }

  .cr-audit {
    min-width: 160px;
    display: flex;
    flex-direction: column;
    gap: .2rem;
  }
  .cr-audit-user {
    font-weight: 600;
    color: #1a1a1a;
  }
  .cr-audit-time {
    font-size: .75rem;
    color: #777;
  }

  /* ── form card ── */
  .cr-form-wrap {
    max-width: 860px;
    margin: 0 auto;
  }
  .cr-form-card {
    background: #fff;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 30px rgba(0,0,0,.1);
  }
  .cr-form-hero {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    padding: 2rem 2.5rem;
    position: relative;
    overflow: hidden;
  }
  .cr-form-hero::after {
    content: '';
    position: absolute;
    right: -40px;
    top: -40px;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: rgba(192,57,43,.25);
  }
  .cr-form-hero::before {
    content: '';
    position: absolute;
    right: 60px;
    bottom: -60px;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: rgba(192,57,43,.12);
  }
  .cr-form-hero h3 {
    font-family: 'DM Serif Display', serif;
    color: #fff;
    font-size: 1.6rem;
    margin: 0 0 .3rem;
    position: relative;
    z-index: 1;
  }
  .cr-form-hero p {
    color: rgba(255,255,255,.55);
    font-size: .85rem;
    margin: 0;
    position: relative;
    z-index: 1;
  }

  .cr-form-body { padding: 2rem 2.5rem; }

  /* ── section divider ── */
  .cr-section-label {
    display: flex;
    align-items: center;
    gap: .75rem;
    margin-bottom: 1.25rem;
    margin-top: .5rem;
  }
  .cr-section-label .cr-section-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #fdecea;
    color: #c0392b;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: .9rem;
    flex-shrink: 0;
  }
  .cr-section-label span {
    font-weight: 600;
    font-size: .9rem;
    letter-spacing: .05em;
    text-transform: uppercase;
    color: #555;
  }
  .cr-section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #ece9e2;
  }
    /* ── search bar ── */
.cr-search-wrap {
  position: relative;
  width: 260px;
}
.cr-search-wrap i {
  position: absolute;
  left: .85rem;
  top: 50%;
  transform: translateY(-50%);
  color: #aaa;
  font-size: .85rem;
  pointer-events: none;
}
.cr-search-input {
  width: 100%;
  border: 1.5px solid #e8e3da;
  border-radius: 50px;
  padding: .6rem .9rem .6rem 2.2rem;
  font-family: 'DM Sans', sans-serif;
  font-size: .875rem;
  background: #fff;
  color: #1a1a1a;
  outline: none;
  box-sizing: border-box;
  transition: border-color .2s, box-shadow .2s;
}
.cr-search-input:focus {
  border-color: #c0392b;
  box-shadow: 0 0 0 3px rgba(192,57,43,.1);
}

  /* ── fields ── */
  .cr-field { margin-bottom: 1.1rem; }
  .cr-label {
    display: block;
    font-size: .8rem;
    font-weight: 600;
    letter-spacing: .05em;
    text-transform: uppercase;
    color: #777;
    margin-bottom: .4rem;
  }
  .cr-input, .cr-select, .cr-textarea {
    width: 100%;
    border: 1.5px solid #e8e3da;
    border-radius: 10px;
    padding: .65rem .9rem;
    font-family: 'DM Sans', sans-serif;
    font-size: .9rem;
    color: #1a1a1a;
    background: #faf8f4;
    transition: border-color .2s, box-shadow .2s, background .2s;
    outline: none;
    box-sizing: border-box;
  }
  .cr-input:focus, .cr-select:focus, .cr-textarea:focus {
    border-color: #c0392b;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(192,57,43,.1);
  }
  .cr-select { appearance: none; cursor: pointer; }
  .cr-select:disabled { opacity: .5; cursor: not-allowed; }
  .cr-textarea { resize: vertical; min-height: 80px; }
  .cr-select-wrap { position: relative; }
  .cr-select-wrap::after {
    content: '▾';
    position: absolute;
    right: .9rem;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
    pointer-events: none;
    font-size: .8rem;
  }

  /* ── form footer ── */
  .cr-form-footer {
    display: flex;
    justify-content: flex-end;
    gap: .75rem;
    padding-top: 1rem;
    border-top: 1px solid #ece9e2;
    margin-top: .5rem;
  }
  .cr-btn-cancel {
    padding: .65rem 1.5rem;
    border-radius: 50px;
    border: 1.5px solid #ddd;
    background: transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: .9rem;
    color: #555;
    cursor: pointer;
    transition: border-color .2s, color .2s;
  }
  .cr-btn-cancel:hover { border-color: #1a1a1a; color: #1a1a1a; }
  .cr-btn-submit {
    padding: .65rem 1.8rem;
    border-radius: 50px;
    border: none;
    background: #c0392b;
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: .9rem;
    font-weight: 600;
    cursor: pointer;
    transition: background .2s, transform .15s;
  }
  .cr-btn-submit:hover { background: #a93226; transform: translateY(-1px); }

  .cr-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .cr-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
  @media (max-width: 600px) {
    .cr-grid-2, .cr-grid-3 { grid-template-columns: 1fr; }
    .cr-form-hero, .cr-form-body { padding: 1.5rem; }
  }

  /* ── pagination ── */
  .cr-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1.5rem;
    padding: 1rem;
    flex-wrap: wrap;
  }
  .cr-pagination-btn {
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
  .cr-pagination-btn:hover {
    border-color: #c0392b;
    background: #fdecea;
  }
  .cr-pagination-btn.active {
    background: #1a1a1a;
    color: #f4f1eb;
    border-color: #1a1a1a;
  }
  .cr-pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .cr-pagination-info {
    font-size: 0.85rem;
    color: #777;
    margin: 0 0.5rem;
  }
`;

/* ── component ───────────────────────────────────────────────────── */
const Customer = () => {
  const [customers, setCustomers] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  const [allItemTypes, setAllItemTypes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const isAdmin = isCurrentUserAdmin();

  // Fetch categories
  useEffect(() => {
    fetchAllPages("/api/categories/")
      .then(setCategoriesData)
      .catch((err) => console.error("Category fetch error", err));
  }, []);

  // Fetch all item types
  useEffect(() => {
    fetchAllPages("/api/item-types/")
      .then(setAllItemTypes)
      .catch((err) => console.error("Item types fetch error", err));
  }, []);

  function fetchCustomers() {
    fetchAllPages("/api/customers/")
      .then(setCustomers)
      .catch((err) => console.error(err));
  }

  // Fetch customers
  useEffect(() => { fetchCustomers(); }, []);

  const filteredCustomers = customers.filter((c) =>
  c.full_name.toLowerCase().includes(searchQuery.toLowerCase())
);

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const activePage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;
  const startIdx = (activePage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIdx, endIdx);
  // Filter item types by selected category
  const filteredItemTypes = formData.category
    ? allItemTypes.filter(
        (it) => String(it.category) === String(formData.category)
      )
    : [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "category") {
      setFormData((prev) => ({ ...prev, category: value, item_type: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId && !isAdmin) {
      alert("Only admins can edit customer records.");
      return;
    }
    const token = localStorage.getItem("access");
    const payload = {
      ...formData,
      returned_date: formData.returned_date || null,
      quantity: Number(formData.quantity),
      deposit_amount: Number(formData.deposit_amount),
      category: Number(formData.category),
    };

    try {
      const url = editingId
        ? `http://127.0.0.1:8000/api/customers/${editingId}/`
        : "http://127.0.0.1:8000/api/customers/";
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
        alert(`Failed to ${editingId ? "update" : "add"} customer`);
        return;
      }

      alert(`Customer ${editingId ? "updated" : "added"} successfully`);
      handleReset();
      fetchCustomers();
    } catch (err) {
      console.error("Customer save error", err);
    }
  };

  const handleEdit = (customer) => {
    if (!isAdmin) {
      alert("Only admins can edit customer records.");
      return;
    }
    setEditingId(customer.id);
    setFormData({
      full_name: customer.full_name,
      phone: customer.phone,
      address: customer.address,
      category: customer.category,
      item_type: customer.item_type,
      cylinder_size: customer.cylinder_size,
      quantity: customer.quantity,
      deposit_amount: customer.deposit_amount,
      deposit_date: customer.deposit_date,
      returned_date: customer.returned_date || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      alert("Only admins can delete customer records.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this customer?"))
      return;
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(
        `http://127.0.0.1:8000/api/customers/${id}/`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        alert("Customer deleted successfully");
        fetchCustomers();
      } else {
        alert("Failed to delete customer");
      }
    } catch (err) {
      console.error("DELETE ERROR", err);
    }
  };

  const getCategoryName = (id) =>
    categoriesData.find((c) => c.id === Number(id))?.name || id;

  const fmt = (d) => {
    try { return new Date(d).toLocaleDateString(); }
    catch { return d; }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="cr-root">

        {!showForm ? (
          <>
            {/* ── header ── */}
           <div className="cr-header">
  <h2>Customer <span>Records</span></h2>
  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
    <div className="cr-search-wrap">
      <i className="bi bi-search"></i>
      <input
        className="cr-search-input"
        type="text"
        placeholder="Search by name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
    <button className="cr-btn-add" onClick={() => setShowForm(true)}>
      <i className="bi bi-plus-lg"></i> Add Customer
    </button>
  </div>
</div>
            
            {/* ── table ── */}
            <div className="cr-table-card">
              <table className="cr-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Category</th>
                    <th>Item Type</th>
                    <th>Cyl. Size</th>
                    <th>Qty</th>
                    <th>Deposit</th>
                    <th>Deposit Date</th>
                    <th>Return Date</th>
                    <th>Audit Trail</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                 {paginatedCustomers.length === 0 ? (
  <tr>
    <td colSpan="12">
      <div className="cr-empty">
        <div className="cr-empty-icon">📋</div>
        {searchQuery ? "No customers match your search" : "No customer records found"}
      </div>
    </td>
  </tr>
) : (
  paginatedCustomers.map((c) => ( 
                      <tr key={c.id}>
                        <td><strong>{c.full_name}</strong></td>
                        <td>{c.phone}</td>
                        <td style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.address}</td>
                        <td>
                          <span className="cr-badge cr-badge-cat">
                            {getCategoryName(c.category)}
                          </span>
                        </td>
                        <td>
                          <span className="cr-badge cr-badge-type">
                            {c.item_type}
                          </span>
                        </td>
                        <td>{c.cylinder_size}</td>
                        <td>{c.quantity}</td>
                        <td><strong>{c.deposit_amount}</strong></td>
                        <td>{fmt(c.deposit_date)}</td>
                        <td>
                          {c.returned_date ? (
                            <span className="cr-badge cr-badge-returned">{fmt(c.returned_date)}</span>
                          ) : (
                            <span className="cr-badge cr-badge-pending">Pending</span>
                          )}
                        </td>
                        <td>
                          <div className="cr-audit">
                            <span className="cr-audit-user">
                              {c.created_by_name || "Not recorded"}
                            </span>
                            <span className="cr-audit-time">
                              {formatAuditTimestamp(c.created_at)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <button
                            className="cr-action-btn cr-btn-edit"
                            onClick={() => handleEdit(c)}
                            title={isAdmin ? "Edit" : "Admin only"}
                            disabled={!isAdmin}
                          >
                            <i className="bi bi-pencil-fill"></i> E
                          </button>{" "}
                          <button
                            className="cr-action-btn cr-btn-delete"
                            onClick={() => handleDelete(c.id)}
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

              {/* ── pagination ── */}
              {filteredCustomers.length > 0 && (
                <div className="cr-pagination">
                  <button
                    className="cr-pagination-btn"
                    disabled={activePage === 1}
                    onClick={() => setCurrentPage(1)}
                  >
                    « First
                  </button>
                  <button
                    className="cr-pagination-btn"
                    disabled={activePage === 1}
                    onClick={() => setCurrentPage(activePage - 1)}
                  >
                    ‹ Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      className={`cr-pagination-btn${activePage === page ? " active" : ""}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    className="cr-pagination-btn"
                    disabled={activePage === totalPages}
                    onClick={() => setCurrentPage(activePage + 1)}
                  >
                    Next ›
                  </button>
                  <button
                    className="cr-pagination-btn"
                    disabled={activePage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    Last »
                  </button>

                  <span className="cr-pagination-info">
                    Page {activePage} of {totalPages} ({filteredCustomers.length} total)
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          /* ── form ── */
          <div className="cr-form-wrap">
            <div className="cr-form-card">
              {/* hero banner */}
              <div className="cr-form-hero">
                <h3>{editingId ? "Edit Customer" : "New Customer"}</h3>
                <p>
                  {editingId
                    ? "Update the customer's information below"
                    : "Fill in the details to register a new customer"}
                </p>
              </div>

              <div className="cr-form-body">
                <form onSubmit={handleSubmit}>

                  {/* ── section 1: customer details ── */}
                  <div className="cr-section-label">
                    <div className="cr-section-icon">
                      <i className="bi bi-person-fill"></i>
                    </div>
                    <span>Customer Details</span>
                  </div>

                  <div className="cr-grid-2">
                    <div className="cr-field">
                      <label className="cr-label">Full Name *</label>
                      <input
                        className="cr-input"
                        name="full_name"
                        placeholder="e.g. Ram Bahadur Thapa"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="cr-field">
                      <label className="cr-label">Phone *</label>
                      <input
                        className="cr-input"
                        name="phone"
                        placeholder="98XXXXXXXX"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="cr-field">
                    <label className="cr-label">Address</label>
                    <textarea
                      className="cr-textarea"
                      name="address"
                      placeholder="Street, City"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>

                  {/* ── section 2: item details ── */}
                  <div className="cr-section-label" style={{ marginTop: "1.5rem" }}>
                    <div className="cr-section-icon">
                      <i className="bi bi-box-seam-fill"></i>
                    </div>
                    <span>Item Details</span>
                  </div>

                  <div className="cr-grid-3">
                    <div className="cr-field">
                      <label className="cr-label">Category *</label>
                      <div className="cr-select-wrap">
                        <select
                          className="cr-select"
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select category</option>
                          {categoriesData.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="cr-field">
                      <label className="cr-label">Item Type *</label>
                      <div className="cr-select-wrap">
                        <select
                          className="cr-select"
                          name="item_type"
                          value={formData.item_type}
                          onChange={handleChange}
                          required
                          disabled={!formData.category}
                        >
                          <option value="">
                            {formData.category ? "Select type" : "Pick category first"}
                          </option>
                          {filteredItemTypes.map((it) => (
                            <option key={it.id} value={it.name}>
                              {it.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="cr-field">
                      <label className="cr-label">Cylinder Size *</label>
                      <input
                        className="cr-input"
                        name="cylinder_size"
                        placeholder="e.g. 47L"
                        value={formData.cylinder_size}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="cr-grid-2">
                    <div className="cr-field">
                      <label className="cr-label">Quantity *</label>
                      <input
                        type="number"
                        className="cr-input"
                        name="quantity"
                        placeholder="0"
                        min="1"
                        value={formData.quantity}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* ── section 3: transaction details ── */}
                  <div className="cr-section-label" style={{ marginTop: "1.5rem" }}>
                    <div className="cr-section-icon">
                      <i className="bi bi-cash-coin"></i>
                    </div>
                    <span>Transaction Details</span>
                  </div>

                  <div className="cr-grid-3">
                    <div className="cr-field">
                      <label className="cr-label">Deposit Amount *</label>
                      <input
                        type="text"
                        className="cr-input"
                        name="deposit_amount"
                        placeholder="NPR 0"
                        value={formData.deposit_amount}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="cr-field">
                      <label className="cr-label">Deposit Date *</label>
                      <input
                        type="date"
                        className="cr-input"
                        name="deposit_date"
                        value={formData.deposit_date}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="cr-field">
                      <label className="cr-label">Return Date</label>
                      <input
                        type="date"
                        className="cr-input"
                        name="returned_date"
                        value={formData.returned_date}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* ── footer ── */}
                  <div className="cr-form-footer">
                    <button
                      type="button"
                      className="cr-btn-cancel"
                      onClick={handleReset}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="cr-btn-submit">
                      {editingId ? "Update Customer" : "Add Customer"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Customer;
