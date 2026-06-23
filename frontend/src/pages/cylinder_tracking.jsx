import { useState, useEffect } from "react";
import { fetchAllPages } from "../utils/paginated";
import { fetchCategoriesFromItemTypes } from "../utils/categories";
import { formatCustomerPurchaseLabel } from "../utils/customerLabels";
import { isCurrentUserAdmin } from "../utils/auth";
import { formatAuditTimestamp } from "../utils/audit";

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

  .ct-mode-switch {
    display: flex;
    gap: 1rem;
    padding: 2rem 2.5rem 1rem;
    flex-wrap: wrap;
  }

  .ct-mode-btn {
    flex: 1 1 240px;
    min-width: 240px;
    border: 1px solid #e4ddd2;
    background: #f7f4ee;
    color: #5a5a5a;
    border-radius: 999px;
    padding: 0.8rem 1rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .ct-mode-btn:hover {
    background: #f1ebe2;
    color: #1a1a1a;
  }

  .ct-mode-btn.active {
    background: #c0392b;
    color: #fff;
    border-color: #c0392b;
    box-shadow: 0 6px 18px rgba(192, 57, 43, 0.18);
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

  .ct-table-scroll {
    overflow-x: auto;
  }

  .ct-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    min-width: 720px;
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
    vertical-align: middle;
  }

  .ct-customer-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    background: #faf8f4;
    border: 1px solid #ece7dc;
    border-radius: 12px;
    padding: 0.9rem 1rem;
  }

  .ct-customer-summary .ct-label {
    margin-bottom: 0;
  }

  .ct-action-btn {
    // width: px;
    height: 32px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    transition: opacity 0.15s, transform 0.15s;
  }
  .ct-action-btn:hover { opacity: .8; transform: scale(1.1); }
  .ct-action-btn:disabled,
  .ct-action-btn:disabled:hover {
    opacity: .45;
    cursor: not-allowed;
    transform: none;
  }
  .ct-btn-edit { background: #fff3cd; color: #856404; }
  .ct-btn-delete { background: #fdecea; color: #c0392b; }

  .ct-audit {
    min-width: 160px;
    display: flex;
    flex-direction: column;
    gap: .2rem;
  }
  .ct-audit-user {
    font-weight: 600;
    color: #1a1a1a;
  }
  .ct-audit-time {
    font-size: .75rem;
    color: #777;
  }

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
    .ct-mode-switch {
      padding: 1rem 1.5rem 1rem;
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
  const [allTransactions, setAllTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const isAdmin = isCurrentUserAdmin();
  const [allItemTypes, setAllItemTypes] = useState([]);
  const [logMode, setLogMode] = useState("sent_for_refill");
  const [refillRows, setRefillRows] = useState({});

  // Received empty: selected customer (by name+phone) and qty/notes/date keyed by that customer's row ids
  const [selectedCustomerKey, setSelectedCustomerKey] = useState("");
  const [returnRows, setReturnRows] = useState({});
  const [customerSearch, setCustomerSearch] = useState("");

  const todayISO = () => new Date().toISOString().slice(0, 10);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const loadTransactions = async () => {
    try {
      const transactions = await fetchAllPages("/api/cylinder-transactions/");
      setAllTransactions(transactions);
    } catch (err) {
      console.error("Transactions fetch error", err);
    }
  };

  // Fetch all data
  useEffect(() => {
    fetchAllPages("/api/cylinder-transactions/")
      .then(setAllTransactions)
      .catch((err) => console.error("Transactions fetch error", err));

    fetchAllPages("/api/customers/")
      .then(setCustomers)
      .catch((err) => console.error("Customers fetch error", err));

    fetchAllPages("/api/suppliers/")
      .then(setSuppliers)
      .catch((err) => console.error("Suppliers fetch error", err));

      fetchAllPages("/api/item-types/")
      .then(setAllItemTypes)
      .catch((err)=>console.error("Item types fetch error", err));
  }, []);

  const filteredTransactions = allTransactions.filter((transactionRecord) => {
    const matchesSearch = searchQuery
      ? transactionRecord.category_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transactionRecord.item_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transactionRecord.cylinder_size.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (transactionRecord.customer_name &&
          transactionRecord.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (transactionRecord.supplier_name &&
          transactionRecord.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    const matchesStartDate = filterStartDate
      ? new Date(transactionRecord.transaction_date) >= new Date(filterStartDate)
      : true;
    const matchesEndDate = filterEndDate
      ? new Date(transactionRecord.transaction_date) <= new Date(filterEndDate)
      : true;

    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  // ---------- Sent for refill helpers ----------

  const getRefillRow = (supplierId) =>
    refillRows[supplierId] || { qty: "", notes: "", date: todayISO() };

  const updateRefillRow = (supplierId, field, value) => {
    setRefillRows((prev) => ({
      ...prev,
      [supplierId]: { ...getRefillRow(supplierId), [field]: value },
    }));
  };

  const resetRefillForm = () => setRefillRows({});

  // ---------- Received empty (customer) helpers ----------

  const customerKey = (cust) => `${cust.full_name}__${cust.phone}`;

  // Unique customers by name+phone, for the selector list
  const uniqueCustomerOptions = Object.values(
    customers.reduce((acc, cust) => {
      const key = customerKey(cust);
      if (!acc[key]) acc[key] = cust;
      return acc;
    }, {})
  );

  // Unique customers filtered by the search box
  const visibleCustomerOptions = customerSearch
    ? uniqueCustomerOptions.filter(
        (cust) =>
          cust.full_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
          cust.phone.toLowerCase().includes(customerSearch.toLowerCase())
      )
    : uniqueCustomerOptions;

  // All DB rows (item_type/size/qty) belonging to the selected customer
  const selectedCustomerRows = selectedCustomerKey
    ? customers.filter((cust) => customerKey(cust) === selectedCustomerKey)
    : [];

  const getReturnRow = (rowId) =>
    returnRows[rowId] || { qty: "", notes: "", date: todayISO() };

  const updateReturnRow = (rowId, field, value) => {
    setReturnRows((prev) => ({
      ...prev,
      [rowId]: { ...getReturnRow(rowId), [field]: value },
    }));
  };

  const resetReturnForm = () => {
    setSelectedCustomerKey("");
    setReturnRows({});
    setCustomerSearch("");
  };

  const handleModeChange = (mode) => {
    setLogMode(mode);
    setEditingId(null);
  };

  // ---------- Submit ----------
  // Resolve category id from item_type name via allItemTypes
  const getCategoryByItemTypeName = (itemTypeName) => {
    const match = allItemTypes.find(
      (it) => it.name.toLowerCase() === itemTypeName.toLowerCase()
    );
    return match ? match.category : null;
  };

  const postTransaction = async (token, payload) => {
    const res = await fetch("http://127.0.0.1:8000/api/cylinder-transactions/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
     if (!res.ok) {
      const errorData = await res.json();
      console.error("API error:", errorData);
      alert("Failed: " + JSON.stringify(errorData));
    }
    return res.ok;
  };

  const handleSubmitRefill = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access");

    const rowsToSubmit = suppliers
      .map((supplier) => ({ supplier, row: getRefillRow(supplier.id) }))
      .filter(({ row }) => Number(row.qty) > 0);

    if (rowsToSubmit.length === 0) {
      alert("Enter a quantity for at least one cylinder before logging.");
      return;
    }

    try {
      let allOk = true;
      for (const { supplier, row } of rowsToSubmit) {
        const payload = {
          category: getCategoryByItemTypeName(supplier.item_type),
          item_type: supplier.item_type,
          cylinder_size: supplier.cylinder_size,
          transaction_type: "sent_for_refill",
          quantity: Number(row.qty),
          customer: null,
          supplier: supplier.id,
          notes: row.notes || "",
          transaction_date: row.date || todayISO(),
        };
        const ok = await postTransaction(token, payload);
        if (!ok) allOk = false;
      }

      if (!allOk) {
        alert("Some transactions failed to save. Please check and retry.");
      } else {
        alert("Transaction(s) logged successfully");
      }

      resetRefillForm();
      await loadTransactions();
    } catch (err) {
      console.error("Refill transaction save error", err);
    }
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access");

    if (!selectedCustomerKey) {
      alert("Select a customer first.");
      return;
    }

    const rowsToSubmit = selectedCustomerRows
      .map((custRow, idx) => ({
        custRow,
        rowId: `${selectedCustomerKey}__${idx}`,
        row: getReturnRow(`${selectedCustomerKey}__${idx}`),
      }))
      .filter(({ row }) => Number(row.qty) > 0);

    if (rowsToSubmit.length === 0) {
      alert("Enter a returned quantity for at least one cylinder before logging.");
      return;
    }

    try {
      let allOk = true;
      for (const { custRow, row } of rowsToSubmit) {
        const payload = {
          category: getCategoryByItemTypeName(custRow.item_type),
          item_type: custRow.item_type,
          cylinder_size: custRow.cylinder_size,
          transaction_type: "received_empty",
          quantity: Number(row.qty),
          customer: custRow.id,
          supplier: null,
          notes: row.notes || "",
          transaction_date: row.date || todayISO(),
        };
        const ok = await postTransaction(token, payload);
        if (!ok) allOk = false;
      }

      if (!allOk) {
        alert("Some transactions failed to save. Please check and retry.");
      } else {
        alert("Transaction(s) logged successfully");
      }

      resetReturnForm();
      await loadTransactions();
    } catch (err) {
      console.error("Return transaction save error", err);
    }
  };

  // ---------- Display helpers ----------

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
      received_empty: "Empty Received from Customer",
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

  const handleDelete = async (id) => {
    if (!isAdmin) {
      alert("Only admins can delete cylinder transactions.");
      return;
    }
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

        {/* Log Transaction Tab */}
        {activeTab === "transactions" && (
          <div className="ct-form-card">
            <div className="ct-form-hero">
              <h3>Log Cylinder Transaction</h3>
              <p>Record cylinder movements and status changes</p>
            </div>

            {/* Mode switch */}
            <div className="ct-mode-switch">
              <button
                type="button"
                className={`ct-mode-btn ${logMode === "sent_for_refill" ? "active" : ""}`}
                onClick={() => handleModeChange("sent_for_refill")}
              >
                Record Cylinder Sent for Refill
              </button>
              <button
                type="button"
                className={`ct-mode-btn ${logMode === "received_empty" ? "active" : ""}`}
                onClick={() => handleModeChange("received_empty")}
              >
                Record Empty Received from Customer
              </button>
            </div>

            <div className="ct-form-body">
              {/* ---------- Sent for refill ---------- */}
              {logMode === "sent_for_refill" && (
                <form onSubmit={handleSubmitRefill}>
                  <div className="ct-table-card ct-table-scroll" style={{ marginBottom: "1rem" }}>
                    <table className="ct-table">
                      <thead>
                        <tr>
                          <th>Supplier</th>
                          <th>Item Type</th>
                          <th>Size</th>
                          <th>Received Date</th>
                          <th>Sent for Refill</th>
                          <th>Notes</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {suppliers.length === 0 ? (
                          <tr>
                            <td colSpan="7">
                              <div className="ct-empty">
                                <div className="ct-empty-icon">📋</div>
                                No suppliers found
                              </div>
                            </td>
                          </tr>
                        ) : (
                          suppliers.map((supplier) => {
                            const row = getRefillRow(supplier.id);
                            return (
                              <tr key={supplier.id}>
                                <td>{supplier.supplier_name}</td>
                                <td>{supplier.item_type}</td>
                                <td>{supplier.cylinder_size}</td>
                                <td>{supplier.date_received ? fmt(supplier.date_received) : "—"}</td>
                                <td>
                                  <input
                                    type="number"
                                    min="0"
                                    className="ct-input"
                                    placeholder="0"
                                    value={row.qty}
                                    onChange={(e) =>
                                      updateRefillRow(supplier.id, "qty", e.target.value)
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="ct-input"
                                    placeholder="optional"
                                    value={row.notes}
                                    onChange={(e) =>
                                      updateRefillRow(supplier.id, "notes", e.target.value)
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    type="date"
                                    className="ct-input"
                                    value={row.date}
                                    onChange={(e) =>
                                      updateRefillRow(supplier.id, "date", e.target.value)
                                    }
                                  />
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="ct-form-footer">
                    <button type="button" className="ct-btn-cancel" onClick={resetRefillForm}>
                      Clear
                    </button>
                    <button type="submit" className="ct-btn-submit">
                      Log Transaction
                    </button>
                  </div>
                </form>
              )}

              {/* ---------- Received empty from customer ---------- */}
              {logMode === "received_empty" && (
                <form onSubmit={handleSubmitReturn}>
                  {!selectedCustomerKey ? (
                    <div className="ct-field">
                      <label className="ct-label">Customer *</label>
                      <input
                        type="text"
                        className="ct-input"
                        placeholder="Search by name or phone..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        style={{ marginBottom: "0.75rem" }}
                      />
                      <div className="ct-table-card ct-table-scroll">
                        <table className="ct-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Phone</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {visibleCustomerOptions.length === 0 ? (
                              <tr>
                                <td colSpan="3">
                                  <div className="ct-empty">
                                    <div className="ct-empty-icon">📋</div>
                                    No customers found
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              visibleCustomerOptions.map((cust) => (
                                <tr key={customerKey(cust)}>
                                  <td>{cust.full_name}</td>
                                  <td>{cust.phone}</td>
                                  <td>
                                    <button
                                      type="button"
                                      className="ct-action-btn ct-btn-edit"
                                      onClick={() => {
                                        setSelectedCustomerKey(customerKey(cust));
                                        setReturnRows({});
                                      }}
                                    >
                                      Select
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="ct-field">
                      <div className="ct-customer-summary">
                        <label className="ct-label">
                          Customer: <strong>{selectedCustomerRows[0]?.full_name}</strong> — {selectedCustomerRows[0]?.phone}
                        </label>
                        <button
                          type="button"
                          className="ct-btn-cancel"
                          onClick={() => {
                            setSelectedCustomerKey("");
                            setReturnRows({});
                            setCustomerSearch("");
                          }}
                        >
                          Change Customer
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedCustomerKey && (
                    <div className="ct-table-card ct-table-scroll" style={{ margin: "1rem 0" }}>
                      <table className="ct-table">
                        <thead>
                          <tr>
                            <th>Item Type</th>
                            <th>Size</th>
                            <th>Purchased Qty</th>
                            <th>Returned (Empty)</th>
                            <th>Notes</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCustomerRows.length === 0 ? (
                            <tr>
                              <td colSpan="6">
                                <div className="ct-empty">
                                  <div className="ct-empty-icon">📋</div>
                                  No purchase records for this customer
                                </div>
                              </td>
                            </tr>
                          ) : (
                            selectedCustomerRows.map((custRow, idx) => {
                              const rowId = `${selectedCustomerKey}__${idx}`;
                              const row = getReturnRow(rowId);
                              return (
                                <tr key={rowId}>
                                  <td>{custRow.item_type}</td>
                                  <td>{custRow.cylinder_size}</td>
                                  <td>{custRow.quantity}</td>
                                  <td>
                                    <input
                                      type="number"
                                      min="0"
                                      className="ct-input"
                                      placeholder="0"
                                      value={row.qty}
                                      onChange={(e) =>
                                        updateReturnRow(rowId, "qty", e.target.value)
                                      }
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      className="ct-input"
                                      placeholder="optional"
                                      value={row.notes}
                                      onChange={(e) =>
                                        updateReturnRow(rowId, "notes", e.target.value)
                                      }
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="date"
                                      className="ct-input"
                                      value={row.date}
                                      onChange={(e) =>
                                        updateReturnRow(rowId, "date", e.target.value)
                                      }
                                    />
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="ct-form-footer">
                    <button type="button" className="ct-btn-cancel" onClick={resetReturnForm}>
                      Clear
                    </button>
                    <button type="submit" className="ct-btn-submit">
                      Log Transaction
                    </button>
                  </div>
                </form>
              )}
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
                    <th>Item Type</th>
                    <th>Cylinder Size</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Customer/Supplier</th>
                    <th>Date</th>
                    <th>Notes</th>
                    <th>Audit Trail</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="9">
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
                          <div className="ct-audit">
                            <span className="ct-audit-user">
                              {trans.created_by_name || "Not recorded"}
                            </span>
                            <span className="ct-audit-time">
                              {formatAuditTimestamp(trans.created_at)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <button
                            className="ct-action-btn ct-btn-delete"
                            onClick={() => handleDelete(trans.id)}
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
          </>
        )}
      </div>
    </>
  );
};

export default CylinderTracking;