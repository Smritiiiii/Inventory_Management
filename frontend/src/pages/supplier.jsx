import { useEffect, useState } from "react";
import { fetchAllPages } from "../utils/paginated";
import { fetchCategoriesFromItemTypes } from "../utils/categories";
import { isCurrentUserAdmin } from "../utils/auth";
import { formatAuditTimestamp } from "../utils/audit";

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
  width: auto;
  min-width: 40px;
  max-width: 140px;
  height: 40px;

  border-radius: 10px;
  border: none;

  cursor: pointer;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  font-size: .95rem;

  padding: 0 12px;

  transition: opacity .15s, transform .15s;
  white-space: nowrap;
}

.sp-action-cell {
  white-space: nowrap;
  text-align: right;
}

.sp-action-wrap {
  display: inline-flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .sp-action-cell {
    white-space: normal;
  }
}

.sp-details-table {
  width: auto;
  border-collapse: collapse;
  table-layout: auto;
}

.sp-details-table td,
.sp-details-table th {
  padding: 8px;
}

.sp-details-table th:last-child,
.sp-details-table td:last-child {
  width: 110px;
  white-space: nowrap;
}
  .sp-action-btn:hover { opacity: .8; transform: scale(1.1); }
  .sp-action-btn:disabled,
  .sp-action-btn:disabled:hover {
    opacity: .45;
    cursor: not-allowed;
    transform: none;
  }
  .sp-btn-edit   { background: #fff3cd; color: #856404; }
  .sp-btn-delete { background: #fdecea; color: #c0392b; }

  .sp-audit {
    min-width: 160px;
    display: flex;
    flex-direction: column;
    gap: .2rem;
  }
  .sp-audit-user {
    font-weight: 600;
    color: #1a1a1a;
  }
  .sp-audit-time {
    font-size: .75rem;
    color: #777;
  }

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

  .sp-helper-text {
    margin-top: .5rem;
    font-size: .78rem;
    color: #777;
    line-height: 1.4;
  }

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

const getTodayDate = () => new Date().toISOString().split("T")[0];

const createInitialFormData = () => ({
  supplier_name: "",
  category: "",
  item_type: "",
  cylinder_size: "",
  quantity_received: "",
  size_quantities: {},
  size_amounts: {},
  date_received: getTodayDate(),
  total_amount: "",
  amount_paid: "",
});

const parseSelectedSizes = (value) =>
  value ? value.split(",").map((size) => size.trim()).filter(Boolean) : [];

const toSafeNumber = (value) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundCurrency = (value) => {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
};

const getGroupTotalAmount = (entries) =>
  roundCurrency(entries.reduce((sum, entry) => sum + toSafeNumber(entry.total_amount), 0));

const getGroupAmountPaid = (entries) => {
  if (entries.length === 0) return 0;
  // amount_paid is stored on individual entries without duplication — always sum
  return roundCurrency(
    entries.reduce((sum, entry) => sum + toSafeNumber(entry.amount_paid), 0)
  );
};

const Supplier = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const isAdmin = isCurrentUserAdmin();

  const [formData, setFormData] = useState(createInitialFormData());

  const [categoriesData, setCategoriesData] = useState([]);
  const [allItemTypes, setAllItemTypes] = useState([]);

  useEffect(() => {
    fetchCategoriesFromItemTypes()
      .then(setCategoriesData)
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchAllPages("/api/item-types/")
      .then(setAllItemTypes)
      .catch(console.error);
  }, []);

  function fetchSuppliers() {
    fetchAllPages("/api/suppliers/")
      .then(setSuppliers)
      .catch(console.error);
  }

  useEffect(() => { fetchSuppliers(); }, []);

  const CYLINDER_SIZES = ["Small", "Medium", "Large"];
  const supplierGroupKey = (supplier) =>
    `${supplier.supplier_name}||${supplier.category}||${supplier.item_type}`;

const handleCylinderSizeChange = (size) => {
  const current = parseSelectedSizes(formData.cylinder_size);
  const updated = current.includes(size)
    ? current.filter(s => s !== size)
    : [...current, size];
  // preserve order: Small → Medium → Large
  const ordered = CYLINDER_SIZES.filter(s => updated.includes(s));

  setFormData((prev) => {
    const nextQuantities = { ...prev.size_quantities };
    const nextAmounts = { ...prev.size_amounts };
    if (!ordered.includes(size)) {
      delete nextQuantities[size];
      delete nextAmounts[size];
    }
    return {
      ...prev,
      cylinder_size: ordered.join(", "),
      size_quantities: nextQuantities,
      size_amounts: nextAmounts,
    };
  });
};

const handleSizeQuantityChange = (size, value) => {
  setFormData((prev) => ({
    ...prev,
    size_quantities: {
      ...prev.size_quantities,
      [size]: value,
    },
  }));
};

const handleSizeAmountChange = (size, value) => {
  setFormData((prev) => ({
    ...prev,
    size_amounts: {
      ...prev.size_amounts,
      [size]: value,
    },
  }));
};

const selectedSizes = parseSelectedSizes(formData.cylinder_size);

  const filteredItemTypes = formData.category
    ? allItemTypes.filter((it) => String(it.category) === String(formData.category))
    : [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "category") {
      setFormData((prev) => ({
        ...prev,
        category: value,
        item_type: "",
        cylinder_size: "",
        size_quantities: {},
        size_amounts: {},
      }));
    } else {
      setFormData((prev) => {
        const nextState = { ...prev, [name]: value };
        const singleSelectedSize = parseSelectedSizes(prev.cylinder_size);

        if (singleSelectedSize.length === 1) {
          const [size] = singleSelectedSize;

          if (name === "quantity_received") {
            nextState.size_quantities = {
              ...prev.size_quantities,
              [size]: value,
            };
          }

          if (name === "total_amount") {
            nextState.size_amounts = {
              ...prev.size_amounts,
              [size]: value,
            };
          }
        }

        return nextState;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId && !isAdmin) {
      alert("Only admins can edit supplier records.");
      return;
    }

    const selectedSizes = parseSelectedSizes(formData.cylinder_size);

    if (!editingId && selectedSizes.length === 0) {
      alert("Please select at least one cylinder size before saving.");
      return;
    }

    if (editingId && selectedSizes.length !== 1) {
      alert("Please edit one cylinder size record at a time.");
      return;
    }

    const totalAmountValue = selectedSizes.length > 1
      ? roundCurrency(
          selectedSizes.reduce(
            (sum, size) => sum + toSafeNumber(formData.size_amounts?.[size]),
            0
          )
        )
      : roundCurrency(toSafeNumber(formData.total_amount));

    const amountPaidValue = formData.amount_paid === "" ? null : roundCurrency(toSafeNumber(formData.amount_paid));

    const payload = {
      supplier_name: formData.supplier_name,
      category: formData.category,
      item_type: formData.item_type,
      date_received: formData.date_received,
      total_amount: totalAmountValue,
      amount_paid: amountPaidValue,
    };

    if (editingId) {
      payload.cylinder_size = selectedSizes[0] || formData.cylinder_size;
      payload.quantity_received = Number(formData.quantity_received || 0);
      payload.total_amount = roundCurrency(toSafeNumber(formData.total_amount));
    } else {
      const sizeEntries = [];
      for (const size of selectedSizes) {
        const quantity = Number(
          (formData.size_quantities?.[size] ?? formData.quantity_received) || 0
        );
        if (!quantity || quantity <= 0) {
          alert(`Enter a valid quantity for ${size}`);
          return;
        }

        const rawAmount = selectedSizes.length > 1
          ? formData.size_amounts?.[size]
          : formData.total_amount;

        if (selectedSizes.length > 1 && (rawAmount === "" || rawAmount === undefined)) {
          alert(`Enter an amount for ${size}`);
          return;
        }

        const totalAmount = roundCurrency(toSafeNumber(rawAmount));
        if (totalAmount < 0) {
          alert(`Enter a valid amount for ${size}`);
          return;
        }

        sizeEntries.push({
          cylinder_size: size,
          quantity,
          total_amount: totalAmount,
        });
      }

      payload.size_quantities = sizeEntries;
    }
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

      if (editingId) {
        const originalRecord = suppliers.find((entry) => entry.id === editingId);
        const editedGroupKey = supplierGroupKey({
          supplier_name: formData.supplier_name,
          category: formData.category,
          item_type: formData.item_type,
        });

        if (originalRecord && supplierGroupKey(originalRecord) === editedGroupKey) {
          const siblingEntries = suppliers.filter(
            (entry) =>
              entry.id !== editingId &&
              supplierGroupKey(entry) === supplierGroupKey(originalRecord)
          );

          if (siblingEntries.length > 0) {
            const syncResponses = await Promise.all(
              siblingEntries.map((entry) =>
                fetch(`http://127.0.0.1:8000/api/suppliers/${entry.id}/`, {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ amount_paid: 0 }),
                })
              )
            );

            if (syncResponses.some((response) => !response.ok)) {
              console.error("Supplier amount sync error:", syncResponses);
              alert("Record updated, but the paid amount could not be synced to the other sizes.");
              fetchSuppliers();
              return;
            }
          }
        }
      }

      alert(`Supplier record ${editingId ? "updated" : "saved"} successfully`);
      resetForm();
      fetchSuppliers();
    } catch (err) { console.error("SAVE ERROR", err); }
  };

  const handleEdit = (s) => {
    if (!isAdmin) {
      alert("Only admins can edit supplier records.");
      return;
    }

    const relatedEntries = suppliers.filter(
      (entry) => supplierGroupKey(entry) === supplierGroupKey(s)
    );

    setEditingId(s.id);
    setFormData({
      supplier_name: s.supplier_name,
      category: s.category,
      item_type: s.item_type,
      cylinder_size: s.cylinder_size,
      quantity_received: s.quantity_received,
      size_quantities: {
        [s.cylinder_size]: s.quantity_received,
      },
      size_amounts: {
        [s.cylinder_size]: s.total_amount,
      },
      date_received: s.date_received || "",
      total_amount: s.total_amount,
      amount_paid: getGroupAmountPaid(relatedEntries),
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      alert("Only admins can delete supplier records.");
      return;
    }
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

  const handleDeleteAllSupplier = async (group) => {
    if (!isAdmin) {
      alert("Only admins can delete supplier records.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete all records for ${group.supplier_name}? This will delete all ${group.entries.length} record(s) of this supplier.`)) return;
    try {
      const token = localStorage.getItem("access");
      const deletePromises = group.entries.map((entry) =>
        fetch(`http://127.0.0.1:8000/api/suppliers/${entry.id}/`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      const responses = await Promise.all(deletePromises);
      if (responses.every((res) => res.ok)) {
        alert(`All records for ${group.supplier_name} deleted successfully`);
        fetchSuppliers();
      } else {
        alert("Failed to delete some records");
      }
    } catch (err) { console.error("DELETE ALL ERROR", err); }
  };

  const handleMarkGroupAllPaid = async (group) => {
    if (!isAdmin) {
      alert("Only admins can mark supplier records as paid.");
      return;
    }
    if (!window.confirm(`Mark all records for ${group.supplier_name} as fully paid? This will set each entry's paid amount equal to its total amount.`)) return;

    try {
      const token = localStorage.getItem("access");
      const patchPromises = group.entries.map((entry) =>
        fetch(`http://127.0.0.1:8000/api/suppliers/${entry.id}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount_paid: entry.total_amount }),
        })
      );
      const responses = await Promise.all(patchPromises);
      if (responses.every((res) => res.ok)) {
        alert(`All records for ${group.supplier_name} are now fully paid.`);
        fetchSuppliers();
      } else {
        alert("Failed to mark some records as fully paid.");
      }
    } catch (err) {
      console.error("MARK ALL PAID ERROR", err);
    }
  };

  const resetForm = () => {
    setFormData(createInitialFormData());
    setEditingId(null);
    setShowForm(false);
  };

  const getCategoryName = (id) =>
    categoriesData.find((c) => String(c.id) === String(id))?.name || id;

  // Pagination logic
  // Group suppliers with same supplier_name/category/item_type
  const groupedSuppliers = (() => {
    const map = new Map();
    for (const s of suppliers) {
      const k = supplierGroupKey(s);
      if (!map.has(k)) {
        map.set(k, {
          key: k,
          supplier_name: s.supplier_name,
          category: s.category,
          item_type: s.item_type,
          created_by_name: s.created_by_name,
          created_at: s.created_at,
          entries: [],
        });
      }
      map.get(k).entries.push({
        id: s.id,
        cylinder_size: s.cylinder_size,
        quantity_received: s.quantity_received,
        date_received: s.date_received,
        total_amount: s.total_amount,
        amount_paid: s.amount_paid,
      });
    }
    return Array.from(map.values());
  })();

  // Pagination logic on grouped suppliers
  const totalPages = Math.ceil(groupedSuppliers.length / itemsPerPage);
  const activePage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;
  const startIdx = (activePage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedSuppliers = groupedSuppliers.slice(startIdx, endIdx);

  const [expandedGroups, setExpandedGroups] = useState({});
  const toggleGroup = (key) => setExpandedGroups((p) => ({ ...p, [key]: !p[key] }));

  // summary stats
  const totalPaid = groupedSuppliers.reduce(
    (sum, group) => sum + getGroupAmountPaid(group.entries),
    0
  );
  const totalDue = groupedSuppliers.reduce(
    (sum, group) => sum + (getGroupTotalAmount(group.entries) - getGroupAmountPaid(group.entries)),
    0
  );

  // live balance preview in form
  const resolvedFormTotalAmount = selectedSizes.length > 1
    ? roundCurrency(
        selectedSizes.reduce(
          (sum, size) => sum + toSafeNumber(formData.size_amounts?.[size]),
          0
        )
      )
    : roundCurrency(toSafeNumber(formData.total_amount));

  const hasAmountInput = selectedSizes.length > 1
    ? selectedSizes.some((size) => formData.size_amounts?.[size] !== "" && formData.size_amounts?.[size] !== undefined)
    : formData.total_amount !== "";

  const formBalance = hasAmountInput || formData.amount_paid !== ""
    ? roundCurrency(resolvedFormTotalAmount - toSafeNumber(formData.amount_paid))
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
                      {selectedSizes.length <= 1 ? (
                        <input
                          type="text"
                          className="sp-input"
                          name="quantity_received"
                          placeholder="0"
                          min="0"
                          value={formData.quantity_received}
                          onChange={handleChange}
                          required
                          disabled={!formData.cylinder_size}
                        />
                      ) : (
                        <div style={{ display: "grid", gap: "0.75rem" }}>
                          {selectedSizes.map((size) => (
                            <div key={size} className="sp-field">
                              <label className="sp-label">{size} Qty *</label>
                              <input
                                type="text"
                                className="sp-input"
                                min="0"
                                value={formData.size_quantities?.[size] || ""}
                                onChange={(e) => handleSizeQuantityChange(size, e.target.value)}
                                required
                              />
                            </div>
                          ))}
                        </div>
                      )}
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
                      {selectedSizes.length > 1 ? (
                        <div style={{ display: "grid", gap: "0.75rem" }}>
                          {selectedSizes.map((size) => (
                            <div key={size} className="sp-field">
                              <label className="sp-label">{size} Amount *</label>
                              <input
                                type="text"
                                className="sp-input"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.size_amounts?.[size] || ""}
                                onChange={(e) => handleSizeAmountChange(size, e.target.value)}
                                required
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <input
                          type="text" className="sp-input"
                          name="total_amount" placeholder="0.00" min="0"
                          value={formData.total_amount} onChange={handleChange}
                          disabled={!formData.cylinder_size}
                        />
                      )}
                    </div>
                    <div className="sp-field">
                      {selectedSizes.length > 1 && (
                        <>
                          <label className="sp-label">Combined Total (NPR)</label>
                          <input
                            type="text"
                            className="sp-input"
                            value={resolvedFormTotalAmount}
                            readOnly
                          />
                        </>
                      )}
                      <label className="sp-label">Amount Paid (NPR)</label>
                      <input
                        type="text" className="sp-input"
                        name="amount_paid" placeholder="0.00" min="0" step="0.01"
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
                <th>Total Amount</th>
                <th>Amount Paid</th>
                <th>Audit Trail</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="11">
                    <div className="sp-empty">
                      <div className="sp-empty-icon">🚚</div>
                      No supplier records found
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSuppliers.map((group) => {
                  const totalAmount = getGroupTotalAmount(group.entries);
                  const amountPaid = getGroupAmountPaid(group.entries);
                  const findSupplierById = (id) => suppliers.find((ss) => ss.id === id);
                  return (
                    <>
                      <tr key={group.key}>
                        <td>
                          <button className="sp-action-btn" onClick={() => toggleGroup(group.key)} style={{ marginRight: 8 }}>
                            {expandedGroups[group.key] ? 'v' : '<'}
                          </button>
                          <strong>{group.supplier_name}</strong>
                        </td>
                        <td>
                          <span className="sp-badge sp-badge-cat">
                            {getCategoryName(group.category)}
                          </span>
                        </td>
                        <td>
                          <span className="sp-badge sp-badge-type">
                            {group.item_type}
                          </span>
                        </td>
                        
                        <td>NPR {Number(totalAmount).toLocaleString()}</td>
                        <td>NPR {Number(amountPaid).toLocaleString()}</td>
                        <td>
                          <div className="sp-audit">
                            <span className="sp-audit-user">
                              {group.created_by_name || "Not recorded"}
                            </span>
                            <span className="sp-audit-time">
                              {formatAuditTimestamp(group.created_at)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="sp-action-wrap">
                            <button
                              className="sp-action-btn sp-btn-delete"
                              onClick={() => handleDeleteAllSupplier(group)}
                              disabled={!isAdmin}
                              title="Delete all records for this supplier"
                            >
                              <i className="bi bi-trash-fill"></i> Delete
                            </button>
                            <button
                              className="sp-action-btn sp-btn-edit"
                              onClick={() => handleMarkGroupAllPaid(group)}
                              disabled={!isAdmin}
                              title="Set all records to fully paid"
                            >
                              <i className="bi bi-check-circle-fill"></i> All paid
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedGroups[group.key] && (
                        <tr key={`${group.key}-details`}>
                          <td colSpan="11" style={{ padding: 12 }}>
                            <div style={{ background: '#fff', borderRadius: 8, padding: 8 }}>
                              <table className="sp-details-table" style={{width: '100%', tableLayout: 'auto' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <th style={{ textAlign: 'left', padding: 6 }}>Size</th>
                                    <th style={{ textAlign: 'left', padding: 6 }}>Qty</th>
                                    <th style={{ textAlign: 'left', padding: 6 }}>Date Received</th>
                                    <th style={{ textAlign: 'left', padding: 6 }}>Total Amount</th>
                                    <th style={{ textAlign: 'right', padding: 6 }}>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.entries.map((e) => (
                                    <tr key={e.id} style={{ borderBottom: '1px solid #fafafa' }}>
                                      <td style={{ padding: 6 }}>{e.cylinder_size || '—'}</td>
                                      <td style={{ padding: 6 }}>{e.quantity_received}</td>
                                      <td style={{ padding: 6 }}>{e.date_received ? new Date(e.date_received).toLocaleDateString() : '—'}</td>
                                      <td style={{ padding: 6 }}>NPR {Number(e.total_amount || 0).toLocaleString()}</td>
                                     
                                  <td className="sp-action-cell">
                                    <div className="sp-action-wrap">

                                      <button
                                        className="sp-action-btn sp-btn-edit"
                                        onClick={() => handleEdit(findSupplierById(e.id))}
                                        disabled={!isAdmin}
                                      >
                                        <i className="bi bi-pencil-fill"></i> E
                                      </button>

                                      <button
                                        className="sp-action-btn sp-btn-delete"
                                        onClick={() => handleDelete(e.id)}
                                        disabled={!isAdmin}
                                      >
                                        <i className="bi bi-trash-fill"></i>D
                                      </button>

                                    </div>
                                  </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
                  disabled={activePage === 1}
                  onClick={() => setCurrentPage(1)}
                >
                  « First
                </button>
                <button
                  className="sp-pagination-btn"
                  disabled={activePage === 1}
                  onClick={() => setCurrentPage(activePage - 1)}
                >
                  ‹ Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`sp-pagination-btn${activePage === page ? " active" : ""}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                </button>
              ))}

                <button
                  className="sp-pagination-btn"
                  disabled={activePage === totalPages}
                  onClick={() => setCurrentPage(activePage + 1)}
                >
                  Next ›
                </button>
                <button
                  className="sp-pagination-btn"
                  disabled={activePage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                >
                  Last »
                </button>

                <span className="sp-pagination-info">
                  Page {activePage} of {totalPages} ({suppliers.length} total)
                </span>
              </div>
            )}
        </div>

      </div>
    </>
  );
};

export default Supplier;
