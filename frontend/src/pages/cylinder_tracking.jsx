import { useState, useEffect } from "react";
import { fetchAllPages } from "../utils/paginated";

const initialTransactionState = {
  category: "",
  item_type: "",
  cylinder_size: "",
  transaction_type: "",
  quantity: "",
  customer: "",
  supplier: "",
  notes: "",
  transaction_date: new Date().toISOString().split("T")[0],
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');

  .ct-root {
    font-family: 'DM Sans', sans-serif;
    background: #f4f1eb;
    min-height: 100vh;
    padding: 2rem 1.5rem;
    color: #1a1a1a;
  }

  .ct-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
  }

  .ct-header h2 {
    font-family: 'DM Serif Display', serif;
    font-size: 2rem;
    margin: 0;
    letter-spacing: -0.02em;
  }

  .ct-header h2 span {
    color: #c0392b;
  }

  .ct-tabs {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    border-bottom: 2px solid #e8e3da;
  }

  .ct-tab-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    background: transparent;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.95rem;
    font-weight: 500;
    color: #999;
    border-bottom: 3px solid transparent;
    transition: color 0.2s, border-color 0.2s;
    margin-bottom: -2px;
  }

  .ct-tab-btn.active {
    color: #c0392b;
    border-bottom-color: #c0392b;
  }

  .ct-tab-btn:hover {
    color: #1a1a1a;
  }

  /* Filter section */
  .ct-filter-wrap {
    background: #fff;
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 12px rgba(0,0,0,.05);
    display: flex;
    gap: 1rem;
    align-items: flex-end;
    flex-wrap: wrap;
  }

  .ct-filter-field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .ct-filter-label {
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    color: #777;
    letter-spacing: 0.05em;
  }

  .ct-filter-input {
    border: 1.5px solid #e8e3da;
    border-radius: 8px;
    padding: 0.6rem 0.9rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    color: #1a1a1a;
    background: #faf8f4;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .ct-filter-input:focus {
    border-color: #c0392b;
    box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.1);
  }

  .ct-filter-btn {
    padding: 0.6rem 1.2rem;
    background: #c0392b;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .ct-filter-btn:hover {
    background: #a93226;
  }

  /* Inventory Grid */
  .ct-inventory-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .ct-inventory-card {
    background: #fff;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.07);
    border-left: 4px solid #c0392b;
  }

  .ct-card-title {
    font-weight: 600;
    font-size: 0.9rem;
    text-transform: uppercase;
    color: #555;
    margin-bottom: 0.5rem;
    letter-spacing: 0.05em;
  }

  .ct-card-subtitle {
    font-size: 0.8rem;
    color: #999;
    margin-bottom: 1rem;
  }

  .ct-stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f0ede6;
  }

  .ct-stat:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  .ct-stat-label {
    font-size: 0.85rem;
    color: #666;
  }

  .ct-stat-value {
    font-size: 1.1rem;
    font-weight: 600;
  }

  .ct-stat-filled { color: #1e8449; }
  .ct-stat-empty { color: #b7770d; }
  .ct-stat-refill { color: #1a6fa8; }
  .ct-stat-total { color: #1a1a1a; }

  /* Form Styles */
  .ct-form-card {
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }

  .ct-form-hero {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    padding: 2rem 2.5rem;
    position: relative;
  }

  .ct-form-hero h3 {
    font-family: 'DM Serif Display', serif;
    color: #fff;
    font-size: 1.6rem;
    margin: 0 0 0.3rem;
  }

  .ct-form-hero p {
    color: rgba(255, 255, 255, 0.55);
    font-size: 0.85rem;
    margin: 0;
  }

  .ct-form-body {
    padding: 2rem 2.5rem;
  }

  .ct-field {
    margin-bottom: 1.1rem;
  }

  .ct-label {
    display: block;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    color: #777;
    margin-bottom: 0.4rem;
    letter-spacing: 0.05em;
  }

  .ct-input,
  .ct-select,
  .ct-textarea {
    width: 100%;
    border: 1.5px solid #e8e3da;
    border-radius: 10px;
    padding: 0.65rem 0.9rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    color: #1a1a1a;
    background: #faf8f4;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .ct-input:focus,
  .ct-select:focus,
  .ct-textarea:focus {
    border-color: #c0392b;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.1);
  }

  .ct-select {
    appearance: none;
    cursor: pointer;
  }

  .ct-select-wrap {
    position: relative;
  }

  .ct-select-wrap::after {
    content: "▾";
    position: absolute;
    right: 0.9rem;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
    pointer-events: none;
  }

  .ct-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .ct-grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
  }

  .ct-form-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding-top: 1rem;
    border-top: 1px solid #ece9e2;
    margin-top: 0.5rem;
  }

  .ct-btn-cancel {
    padding: 0.65rem 1.5rem;
    border-radius: 50px;
    border: 1.5px solid #ddd;
    background: transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    color: #555;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
  }

  .ct-btn-cancel:hover {
    border-color: #1a1a1a;
    color: #1a1a1a;
  }

  .ct-btn-submit {
    padding: 0.65rem 1.8rem;
    border-radius: 50px;
    border: none;
    background: #c0392b;
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s;
  }

  .ct-btn-submit:hover {
    background: #a93226;
    transform: translateY(-1px);
  }

  /* Transaction Table */
  .ct-table-card {
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.07);
  }

  .ct-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .ct-table thead tr {
    background: #1a1a1a;
    color: #f4f1eb;
  }

  .ct-table thead th {
    padding: 0.9rem 1rem;
    font-weight: 500;
    text-align: left;
    font-size: 0.78rem;
    text-transform: uppercase;
  }

  .ct-table tbody tr {
    border-bottom: 1px solid #f0ede6;
    transition: background 0.15s;
  }

  .ct-table tbody tr:hover {
    background: #faf8f4;
  }

  .ct-table tbody td {
    padding: 0.85rem 1rem;
  }
  .cr-action-btn:hover { opacity: .8; transform: scale(1.1); }
  .cr-btn-edit { background: #fff3cd; color: #856404; }
  .cr-btn-delete { background: #fdecea; color: #c0392b; }

  .ct-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 50px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .ct-badge-filled {
    background: #eafaf1;
    color: #1e8449;
  }

  .ct-badge-empty {
    background: #fef9e7;
    color: #b7770d;
  }

  .ct-badge-refill-sent {
    background: #eaf4fd;
    color: #1a6fa8;
  }

  .ct-badge-refill-received {
    background: #eafaf1;
    color: #1e8449;
  }

  .ct-badge-given {
    background: #fdecea;
    color: #c0392b;
  }

  .ct-empty {
    text-align: center;
    padding: 3rem 1rem;
    color: #999;
    font-size: 0.95rem;
  }

  .ct-empty-icon {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }

  @media (max-width: 600px) {
    .ct-grid-2,
    .ct-grid-3 {
      grid-template-columns: 1fr;
    }
    .ct-form-hero,
    .ct-form-body {
      padding: 1.5rem;
    }
    .ct-inventory-grid {
      grid-template-columns: 1fr;
    }
    .ct-filter-wrap {
      flex-direction: column;
      align-items: stretch;
    }
  }
`;

const CylinderTracking = () => {
  const [activeTab, setActiveTab] = useState("transactions");
  const inventory = [];
  const [allTransactions, setAllTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState(initialTransactionState);
  const [itemTypes, setItemTypes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const loadTransactions = async () => {
    try {
      const transactions = await fetchAllPages("/api/cylinder-transactions/");
      setAllTransactions(transactions);
      setFilteredTransactions(transactions);
    } catch (err) {
      console.error("Transactions fetch error", err);
    }
  };

  // Fetch all data
  useEffect(() => {
    loadTransactions();

    fetchAllPages("/api/categories/")
      .then((cats) =>
        setCategories(
          cats.filter((category) => category.name?.trim().toLowerCase() !== "accessory")
        )
      )
      .catch((err) => console.error("Categories fetch error", err));

    fetchAllPages("/api/customers/")
      .then(setCustomers)
      .catch((err) => console.error("Customers fetch error", err));

    fetchAllPages("/api/suppliers/")
      .then(setSuppliers)
      .catch((err) => console.error("Suppliers fetch error", err));
  }, []);

  // Fetch item types when category changes
  useEffect(() => {
    if (formData.category) {
      fetchAllPages("/api/item-types/")
        .then((types) => {
          const filtered = types.filter(
            (itemType) => String(itemType.category) === String(formData.category)
          );
          setItemTypes(filtered);
        })
        .catch((err) => console.error("Item types fetch error", err));
    } else {
      setItemTypes([]);
    }
  }, [formData.category]);

  // Apply filters to transactions
  useEffect(() => {
    let filtered = allTransactions;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.category_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.item_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.cylinder_size.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.customer_name && t.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.supplier_name && t.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Date range filter
    if (filterStartDate) {
      filtered = filtered.filter(t => new Date(t.transaction_date) >= new Date(filterStartDate));
    }
    if (filterEndDate) {
      filtered = filtered.filter(t => new Date(t.transaction_date) <= new Date(filterEndDate));
    }

    setFilteredTransactions(filtered);
  }, [searchQuery, filterStartDate, filterEndDate, allTransactions]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access");

    const payload = {
      category: Number(formData.category),
      item_type: formData.item_type,
      cylinder_size: formData.cylinder_size,
      transaction_type: formData.transaction_type,
      quantity: Number(formData.quantity),
      customer: formData.customer ? Number(formData.customer) : null,
      supplier: formData.supplier ? Number(formData.supplier) : null,
      notes: formData.notes,
      transaction_date: formData.transaction_date,
    };

    try {
      let res;
      if (editingId) {
        // Update existing transaction
        res = await fetch(`http://127.0.0.1:8000/api/cylinder-transactions/${editingId}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new transaction
        res = await fetch("http://127.0.0.1:8000/api/cylinder-transactions/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        alert("Failed to save transaction");
        return;
      }

      alert(editingId ? "Transaction updated successfully" : "Transaction logged successfully");
      setFormData(initialTransactionState);
      setEditingId(null);
      setShowForm(false);

      await loadTransactions();
    } catch (err) {
      console.error("Transaction save error", err);
    }
  };

  const getTransactionBadgeClass = (type) => {
    switch (type) {
      case "received_filled":
        return "ct-badge-filled";
      case "given_to_customer":
        return "ct-badge-given";
      case "received_empty":
        return "ct-badge-empty";
      case "sent_for_refill":
        return "ct-badge-refill-sent";
      case "received_refilled":
        return "ct-badge-refill-received";
      default:
        return "";
    }
  };

  const getTransactionLabel = (type) => {
    const labels = {
      received_filled: "Received (Filled)",
      given_to_customer: "Given to Customer",
      received_empty: "Received (Empty)",
      sent_for_refill: "Sent for Refill",
      received_refilled: "Received (Refilled)",
      stock_adjustment: "Stock Adjustment",
    };
    return labels[type] || type;
  };

  const fmt = (d) => {
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return d;
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterStartDate("");
    setFilterEndDate("");
  };


  const handleEdit = (tracking) => {
    setEditingId(tracking.id);
    setFormData({
      category: tracking.category,
      item_type: tracking.item_type,
      cylinder_size: tracking.cylinder_size,
      transaction_type: tracking.transaction_type,
      quantity: tracking.quantity,
      customer: tracking.customer || "",
      supplier: tracking.supplier || "",
      transaction_date: tracking.transaction_date,
      notes: tracking.notes,
    });
    setActiveTab("transactions");
    setShowForm(true);
    // Scroll to form
    setTimeout(() => {
      document.querySelector(".ct-form-card")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?"))
      return;
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(
        `http://127.0.0.1:8000/api/cylinder-transactions/${id}/`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        alert("Record deleted successfully");
        loadTransactions();
      } else {
        alert("Failed to delete record");
      }
    } catch (err) {
      console.error("DELETE ERROR", err);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="ct-root">
        <div className="ct-header">
          <h2>
            Cylinder <span>Tracking</span>
          </h2>
        </div>

        {/* Tabs */}
        <div className="ct-tabs">
          <button
            className={`ct-tab-btn ${activeTab === "transactions" ? "active" : ""}`}
            onClick={() => setActiveTab("transactions")}
          >
            Log Transaction
          </button>
          <button
            className={`ct-tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            Transaction History
          </button>
        </div>

        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <div>
            {inventory.length === 0 ? (
              <div className="ct-table-card">
                <div className="ct-empty">
                  <div className="ct-empty-icon">📦</div>
                  No cylinder inventory found. Log transactions to populate inventory.
                </div>
              </div>
            ) : (
              <div className="ct-inventory-grid">
                {inventory.map((inv) => (
                  <div key={inv.id} className="ct-inventory-card">
                    <div className="ct-card-title">{inv.category_name}</div>
                    <div className="ct-card-subtitle">
                      {inv.item_type} • {inv.cylinder_size}
                    </div>
                    <div className="ct-stat">
                      <span className="ct-stat-label">Filled:</span>
                      <span className="ct-stat-value ct-stat-filled">
                        {inv.filled_quantity}
                      </span>
                    </div>
                    <div className="ct-stat">
                      <span className="ct-stat-label">Empty:</span>
                      <span className="ct-stat-value ct-stat-empty">
                        {inv.empty_quantity}
                      </span>
                    </div>
                    <div className="ct-stat">
                      <span className="ct-stat-label">In Refill:</span>
                      <span className="ct-stat-value ct-stat-refill">
                        {inv.in_refill_quantity}
                      </span>
                    </div>
                    <div className="ct-stat">
                      <span className="ct-stat-label">Total:</span>
                      <span className="ct-stat-value ct-stat-total">
                        {inv.total_quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Log Transaction Tab */}
        {activeTab === "transactions" && (
          <div className="ct-form-card">
            <div className="ct-form-hero">
              <h3>{editingId ? "Edit Cylinder Transaction" : "Log Cylinder Transaction"}</h3>
              <p>{editingId ? "Update transaction details" : "Record cylinder movements and status changes"}</p>
            </div>
            <div className="ct-form-body">
              <form onSubmit={handleSubmit}>
                <div className="ct-grid-3">
                  <div className="ct-field">
                    <label className="ct-label">Category *</label>
                    <div className="ct-select-wrap">
                      <select
                        className="ct-select"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="ct-field">
                    <label className="ct-label">Item Type *</label>
                    <div className="ct-select-wrap">
                      <select
                        className="ct-select"
                        name="item_type"
                        value={formData.item_type}
                        onChange={handleChange}
                        required
                        disabled={!formData.category}
                      >
                        <option value="">Select type</option>
                        {itemTypes.map((it) => (
                          <option key={it.id} value={it.name}>
                            {it.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="ct-field">
                    <label className="ct-label">Cylinder Size *</label>
                    <input
                      type="text"
                      className="ct-input"
                      name="cylinder_size"
                      placeholder="e.g. 47L, Small, Medium"
                      value={formData.cylinder_size}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="ct-grid-2">
                  <div className="ct-field">
                    <label className="ct-label">Transaction Type *</label>
                    <div className="ct-select-wrap">
                      <select
                        className="ct-select"
                        name="transaction_type"
                        value={formData.transaction_type}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select transaction</option>
                        <option value="received_empty">Received Empty from Customer</option>
                        <option value="sent_for_refill">Sent to Supplier for refill </option>
                        <option value="received_filled">Received Filled from Supplier</option>
                        {/* <option value="given_to_customer">Given Filled to Customer</option> */}
                        {/* <option value="received_refilled">Received Refilled from Company</option>
                        <option value="stock_adjustment">Stock Adjustment</option> */}
                      </select>
                    </div>
                  </div>

                  <div className="ct-field">
                    <label className="ct-label">Quantity *</label>
                    <input
                      type="number"
                      className="ct-input"
                      name="quantity"
                      placeholder="0"
                      min="1"
                      value={formData.quantity}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="ct-grid-2">
                  <div className="ct-field">
                    <label className="ct-label">Customer</label>
                    <div className="ct-select-wrap">
                      <select
                        className="ct-select"
                        name="customer"
                        value={formData.customer}
                        onChange={handleChange}
                      >
                        <option value="">Select customer (optional)</option>
                        {customers.map((cust) => (
                          <option key={cust.id} value={cust.id}>
                            {cust.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="ct-field">
                    <label className="ct-label">Supplier</label>
                    <div className="ct-select-wrap">
                      <select
                        className="ct-select"
                        name="supplier"
                        value={formData.supplier}
                        onChange={handleChange}
                      >
                        <option value="">Select supplier (optional)</option>
                        {suppliers.map((supp) => (
                          <option key={supp.id} value={supp.id}>
                            {supp.supplier_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="ct-field">
                  <label className="ct-label">Transaction Date *</label>
                  <input
                    type="date"
                    className="ct-input"
                    name="transaction_date"
                    value={formData.transaction_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="ct-field">
                  <label className="ct-label">Notes</label>
                  <textarea
                    className="ct-input"
                    name="notes"
                    placeholder="Add any notes..."
                    value={formData.notes}
                    onChange={handleChange}
                    style={{ minHeight: "80px" }}
                  />
                </div>

                <div className="ct-form-footer">
                  <button
                    type="button"
                    className="ct-btn-cancel"
                    onClick={() => {
                      setFormData(initialTransactionState);
                      setEditingId(null);
                      setShowForm(false);
                    }}
                  >
                    {editingId ? "Cancel" : "Clear"}
                  </button>
                  <button type="submit" className="ct-btn-submit">
                    {editingId ? "Update Transaction" : "Log Transaction"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <>
            {/* Filter Controls */}
            <div className="ct-filter-wrap">
              <div className="ct-filter-field">
                <label className="ct-filter-label">Search</label>
                <input
                  type="text"
                  className="ct-filter-input"
                  placeholder="Category, Item, Size, Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="ct-filter-field">
                <label className="ct-filter-label">From Date</label>
                <input
                  type="date"
                  className="ct-filter-input"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
              </div>

              <div className="ct-filter-field">
                <label className="ct-filter-label">To Date</label>
                <input
                  type="date"
                  className="ct-filter-input"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </div>

              <button type="button" className="ct-filter-btn" onClick={handleClearFilters}>
                Clear Filters
              </button>
            </div>

            {/* Results count */}
            <div style={{ marginBottom: "1rem", color: "#666", fontSize: "0.9rem" }}>
              Showing {filteredTransactions.length} of {allTransactions.length} transactions
            </div>

            <div className="ct-table-card">
              <table className="ct-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Item Type</th>
                    <th>Cylinder Size</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Customer/Supplier</th>
                    <th>Date</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="8">
                        <div className="ct-empty">
                          <div className="ct-empty-icon">📋</div>
                          {searchQuery || filterStartDate || filterEndDate
                            ? "No transactions match your filters"
                            : "No transactions found"}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((trans) => (
                      <tr key={trans.id}>
                        <td>{trans.category_name}</td>
                        <td>{trans.item_type}</td>
                        <td>{trans.cylinder_size}</td>
                        <td>
                          <span
                            className={`ct-badge ${getTransactionBadgeClass(
                              trans.transaction_type
                            )}`}
                          >
                            {getTransactionLabel(trans.transaction_type)}
                          </span>
                        </td>
                        <td>
                          <strong>{trans.quantity}</strong>
                        </td>
                        <td>
                          {trans.customer_name ||
                            trans.supplier_name ||
                            "—"}
                        </td>
                        <td>{fmt(trans.transaction_date)}</td>
                        <td style={{ fontSize: "0.8rem", color: "#999" }}>
                          {trans.notes || "—"}
                        </td>
                        <td>
                          <button
                            className="cr-action-btn cr-btn-edit"
                            onClick={() => handleEdit(trans)}
                            title="Edit"
                          >
                            <i className="bi bi-pencil-fill"></i> E
                          </button>{" "}
                          <button
                            className="cr-action-btn cr-btn-delete"
                            onClick={() => handleDelete(trans.id)}
                            title="Delete"
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
          </>
        )}
      </div>
    </>
  );
};

export default CylinderTracking;
