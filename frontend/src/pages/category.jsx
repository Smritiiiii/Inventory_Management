import { useEffect, useState } from "react";
import api from "../api/axios";
import { fetchAllPages } from "../utils/paginated";
import { isCurrentUserAdmin } from "../utils/auth";
import { formatAuditTimestamp } from "../utils/audit";

const STATIC_CATEGORY_NAMES = ["cylinder", "accessory"];

/* ── shared design system (mirrors Supplier.jsx) ── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');

  .ct-root {
    font-family: 'DM Sans', sans-serif;
    background: #f4f1eb;
    min-height: 100vh;
    padding: 2rem 1.5rem;
    color: #1a1a1a;
  }

  /* ── page header ── */
  .ct-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .ct-header h2 {
    font-family: 'DM Serif Display', serif;
    font-size: 2rem;
    margin: 0;
    letter-spacing: -0.02em;
  }
  .ct-header h2 span { color: #c0392b; }

  /* ── add button ── */
  .ct-btn-add {
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
  .ct-btn-add:hover { background: #c0392b; transform: translateY(-1px); }

  /* ── summary strip ── */
  .ct-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  .ct-stat {
    background: #fff;
    border-radius: 14px;
    padding: 1rem 1.25rem;
    box-shadow: 0 1px 8px rgba(0,0,0,.06);
  }
  .ct-stat-label {
    font-size: .72rem;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: #999;
    font-weight: 600;
    margin-bottom: .3rem;
  }
  .ct-stat-value {
    font-family: 'DM Serif Display', serif;
    font-size: 1.5rem;
    color: #1a1a1a;
    line-height: 1.1;
  }

  /* recent badges strip */
  .ct-recent-badges {
    display: flex;
    flex-wrap: wrap;
    gap: .5rem;
    margin-top: .4rem;
  }

  /* ── table card ── */
  .ct-table-card {
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 20px rgba(0,0,0,.07);
  }
  .ct-table {
    width: 100%;
    border-collapse: collapse;
    font-size: .875rem;
  }
  .ct-table thead tr {
    background: #1a1a1a;
    color: #f4f1eb;
  }
  .ct-table thead th {
    padding: .9rem 1rem;
    font-weight: 500;
    letter-spacing: .04em;
    font-size: .78rem;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .ct-table tbody tr {
    border-bottom: 1px solid #f0ede6;
    transition: background .15s;
  }
  .ct-table tbody tr:last-child { border-bottom: none; }
  .ct-table tbody tr:hover { background: #faf8f4; }
  .ct-table tbody td {
    padding: .85rem 1rem;
    vertical-align: middle;
  }

  .ct-badge {
    display: inline-block;
    padding: .25rem .75rem;
    border-radius: 50px;
    font-size: .75rem;
    font-weight: 600;
  }
  .ct-badge-cat  { background: #fdecea; color: #c0392b; }
  .ct-badge-type { background: #eaf4fd; color: #1a6fa8; }

  .ct-empty {
    text-align: center;
    padding: 3rem 1rem;
    color: #999;
    font-size: .95rem;
  }
  .ct-empty-icon { font-size: 2.5rem; margin-bottom: .5rem; }

  /* ── action buttons ── */
  .ct-action-btn {
    width: 32px; height: 32px;
    border-radius: 8px; border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center; justify-content: center;
    font-size: .85rem;
    transition: opacity .15s, transform .15s;
  }
  .ct-action-btn:hover { opacity: .8; transform: scale(1.1); }
  .ct-action-btn:disabled,
  .ct-action-btn:disabled:hover {
    opacity: .45;
    cursor: not-allowed;
    transform: none;
  }
  .ct-btn-edit   { background: #fff3cd; color: #856404; }
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

  /* ── form card ── */
  .ct-form-wrap {
    max-width: 860px;
    margin: 0 auto 2rem;
  }
  .ct-form-card {
    background: #fff;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 30px rgba(0,0,0,.1);
  }
  .ct-form-hero {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    padding: 2rem 2.5rem;
    position: relative;
    overflow: hidden;
  }
  .ct-form-hero::after {
    content: '';
    position: absolute; right: -40px; top: -40px;
    width: 180px; height: 180px; border-radius: 50%;
    background: rgba(192,57,43,.25);
  }
  .ct-form-hero::before {
    content: '';
    position: absolute; right: 60px; bottom: -60px;
    width: 120px; height: 120px; border-radius: 50%;
    background: rgba(192,57,43,.12);
  }
  .ct-form-hero h3 {
    font-family: 'DM Serif Display', serif;
    color: #fff; font-size: 1.6rem;
    margin: 0 0 .3rem;
    position: relative; z-index: 1;
  }
  .ct-form-hero p {
    color: rgba(255,255,255,.55); font-size: .85rem;
    margin: 0; position: relative; z-index: 1;
  }

  .ct-form-body { padding: 2rem 2.5rem; }

  /* ── section divider ── */
  .ct-section-label {
    display: flex; align-items: center; gap: .75rem;
    margin-bottom: 1.25rem; margin-top: .5rem;
  }
  .ct-section-label .ct-section-icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: #fdecea; color: #c0392b;
    display: flex; align-items: center; justify-content: center;
    font-size: .9rem; flex-shrink: 0;
  }
  .ct-section-label span {
    font-weight: 600; font-size: .9rem;
    letter-spacing: .05em; text-transform: uppercase; color: #555;
  }
  .ct-section-label::after {
    content: ''; flex: 1; height: 1px; background: #ece9e2;
  }

  /* ── fields ── */
  .ct-field { margin-bottom: 1.1rem; }
  .ct-label {
    display: block; font-size: .8rem; font-weight: 600;
    letter-spacing: .05em; text-transform: uppercase;
    color: #777; margin-bottom: .4rem;
  }
  .ct-input, .ct-select {
    width: 100%;
    border: 1.5px solid #e8e3da; border-radius: 10px;
    padding: .65rem .9rem;
    font-family: 'DM Sans', sans-serif;
    font-size: .9rem; color: #1a1a1a;
    background: #faf8f4;
    transition: border-color .2s, box-shadow .2s, background .2s;
    outline: none; box-sizing: border-box;
  }
  .ct-input:focus, .ct-select:focus {
    border-color: #c0392b; background: #fff;
    box-shadow: 0 0 0 3px rgba(192,57,43,.1);
  }
  .ct-select { appearance: none; cursor: pointer; }
  .ct-select-wrap { position: relative; }
  .ct-select-wrap::after {
    content: '▾';
    position: absolute; right: .9rem; top: 50%;
    transform: translateY(-50%);
    color: #999; pointer-events: none; font-size: .8rem;
  }

  /* ── form footer ── */
  .ct-form-footer {
    display: flex; justify-content: flex-end; gap: .75rem;
    padding-top: 1rem; border-top: 1px solid #ece9e2; margin-top: .5rem;
  }
  .ct-btn-cancel {
    padding: .65rem 1.5rem; border-radius: 50px;
    border: 1.5px solid #ddd; background: transparent;
    font-family: 'DM Sans', sans-serif; font-size: .9rem;
    color: #555; cursor: pointer;
    transition: border-color .2s, color .2s;
  }
  .ct-btn-cancel:hover { border-color: #1a1a1a; color: #1a1a1a; }
  .ct-btn-submit {
    padding: .65rem 1.8rem; border-radius: 50px; border: none;
    background: #c0392b; color: #fff;
    font-family: 'DM Sans', sans-serif; font-size: .9rem; font-weight: 600;
    cursor: pointer; transition: background .2s, transform .15s;
  }
  .ct-btn-submit:hover { background: #a93226; transform: translateY(-1px); }

  .ct-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  @media (max-width: 640px) {
    .ct-grid-2 { grid-template-columns: 1fr; }
    .ct-form-hero, .ct-form-body { padding: 1.5rem; }
  }

  /* ── pagination ── */
  .ct-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1.5rem;
    padding: 1rem;
    flex-wrap: wrap;
  }
  .ct-pagination-btn {
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
  .ct-pagination-btn:hover {
    border-color: #c0392b;
    background: #fdecea;
  }
  .ct-pagination-btn.active {
    background: #1a1a1a;
    color: #f4f1eb;
    border-color: #1a1a1a;
  }
  .ct-pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .ct-pagination-info {
    font-size: 0.85rem;
    color: #777;
    margin: 0 0.5rem;
  }
`;

export default function Category() {
  const [formData, setFormData] = useState({ category: "", name: "", quantity: "" });
  const [categories, setCategories] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const isAdmin = isCurrentUserAdmin();

  const loadCategories = async () => {
    try {
      setCategories(await fetchAllPages("/api/categories/"));
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadItemTypes = async () => {
    setLoading(true);
    try {
      setItemTypes(await fetchAllPages("/api/item-types/"));
    } catch (error) {
      console.error("Error loading item types:", error);
      alert("Failed to load item types");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId && !isAdmin) {
      alert("Only admins can edit item types.");
      return;
    }
    if (!formData.category || !formData.name.trim()) {
      alert("Please fill in both fields");
      return;
    }
    const selectedCategory = categories.find(
      (category) => String(category.id) === String(formData.category)
    );
    const isAccessoryCategory =
      selectedCategory?.name?.trim().toLowerCase() === "accessory";
    try {
      const payload = {
        category: Number(formData.category),
        name: formData.name,
        quantity: isAccessoryCategory ? Number(formData.quantity || 0) : 0,
      };
      if (editingId) {
        await api.put(`/api/item-types/${editingId}/`, payload);
        alert("Item type updated successfully!");
      } else {
        await api.post("/api/item-types/", payload);
        alert("Item type added successfully!");
      }
      resetForm();
      loadItemTypes();
    } catch (error) {
      console.error("Error saving item type:", error);
      const firstFieldError = Object.values(error?.response?.data || {})[0];
      const detail =
        error?.response?.data?.non_field_errors?.[0] ||
        (Array.isArray(firstFieldError) ? firstFieldError[0] : firstFieldError) ||
        error?.response?.data?.detail ||
        "Failed to save item type";
      alert(detail);
    }
  };

  const handleEdit = (itemType) => {
    if (!isAdmin) {
      alert("Only admins can edit item types.");
      return;
    }
    setFormData({
      category: itemType.category,
      name: itemType.name,
      quantity: itemType.quantity ?? "",
    });
    setEditingId(itemType.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      alert("Only admins can delete item types.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this item type?")) return;
    try {
      await api.delete(`/api/item-types/${id}/`);
      alert("Item type deleted successfully!");
      loadItemTypes();
    } catch (error) {
      console.error("Error deleting item type:", error);
      alert("Failed to delete item type");
    }
  };

  const resetForm = () => {
    setFormData({ category: "", name: "", quantity: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    loadCategories();
    loadItemTypes();
  }, []);

  const getCategoryName = (categoryId) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.name : categoryId;
  };

  const selectedCategory = categories.find(
    (category) => String(category.id) === String(formData.category)
  );
  const staticCategoryOptions = STATIC_CATEGORY_NAMES.map((categoryName) =>
    categories.find(
      (category) => category.name?.trim().toLowerCase() === categoryName
    )
  ).filter(Boolean);
  const categoryOptions = staticCategoryOptions.length > 0 ? staticCategoryOptions : categories;
  const isAccessoryCategory =
    selectedCategory?.name?.trim().toLowerCase() === "accessory";

  // Pagination logic
  const totalPages = Math.ceil(itemTypes.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedItemTypes = itemTypes.slice(startIdx, endIdx);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <>
      <style>{styles}</style>
      <div className="ct-root">

        {/* ── form ── */}
        {showForm && (
          <div className="ct-form-wrap">
            <div className="ct-form-card">
              <div className="ct-form-hero">
                <h3>{editingId ? "Edit Item Type" : "New Item Type"}</h3>
                <p>
                  {editingId
                    ? "Update the item type information below"
                    : "Fill in the details to add a new item type"}
                </p>
              </div>

              <div className="ct-form-body">
                <form onSubmit={handleSubmit}>

                  <div className="ct-section-label">
                    <div className="ct-section-icon"><i className="bi bi-tags"></i></div>
                    <span>Item Type Details</span>
                  </div>

                  <div className="ct-grid-2">
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
                          <option value="">Select Category</option>
                          {categoryOptions.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="ct-field">
                      <label className="ct-label">
                        {isAccessoryCategory ? "Item Name *" : "Item Type Name *"}
                      </label>
                      <input
                        className="ct-input"
                        name="name"
                        placeholder={
                          isAccessoryCategory
                            ? "e.g. Regulator, Mask"
                            : "e.g. Nitrogen, Oxygen"
                        }
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Show quantity field only for Accessory category */}
                  {isAccessoryCategory && (
                    <div className="ct-field">
                      <label className="ct-label">Quantity *</label>
                      <input
                        type="number"
                        className="ct-input"
                        name="quantity"
                        placeholder="0"
                        min="0"
                        value={formData.quantity}
                        onChange={handleChange}
                        required={isAccessoryCategory}
                      />
                    </div>
                  )}

                  <div className="ct-form-footer">
                    <button type="button" className="ct-btn-cancel" onClick={resetForm}>
                      Cancel
                    </button>
                    <button type="submit" className="ct-btn-submit">
                      {editingId ? "Update Item Type" : "Add Item Type"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── page header ── */}
        <div className="ct-header">
          <h2>Item Type <span>Management</span></h2>
          <button className="ct-btn-add" onClick={() => setShowForm((p) => !p)}>
            <i className={`bi bi-${showForm ? "x-lg" : "plus-lg"}`}></i>
            {showForm ? "Close" : "Add Item Type"}
          </button>
        </div>


        {/* ── table ── */}
        <div className="ct-table-card">
          {loading ? (
            <div className="ct-spinner-wrap">
              <div className="spinner-border text-danger" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <table className="ct-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Item Type Name</th>
                  <th>Quantity</th>
                  <th>Audit Trail</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItemTypes.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      <div className="ct-empty">
                        <div className="ct-empty-icon">🏷️</div>
                        No item types found. Add your first item type!
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedItemTypes.map((itemType) => (
                    <tr key={itemType.id}>
                      <td>
                        <span className="ct-badge ct-badge-cat">
                          {getCategoryName(itemType.category)}
                        </span>
                      </td>
                      <td>
                        <span className="ct-badge ct-badge-type">
                          {itemType.name}
                        </span>
                      </td>
                      <td>{itemType.quantity || "—"}</td>
                      <td>
                        <div className="ct-audit">
                          <span className="ct-audit-user">
                            {itemType.created_by_name || "Not recorded"}
                          </span>
                          <span className="ct-audit-time">
                            {formatAuditTimestamp(itemType.created_at)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <button
                          className="ct-action-btn ct-btn-edit"
                          onClick={() => handleEdit(itemType)}
                          title={isAdmin ? "Edit" : "Admin only"}
                          disabled={!isAdmin}
                        >
                          <i className="bi bi-pencil-fill"></i> E
                        </button>{" "}
                        <button
                          className="ct-action-btn ct-btn-delete"
                          onClick={() => handleDelete(itemType.id)}
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
          )}
            {itemTypes.length > 0 && (
              <div className="ct-pagination">
                <button
                  className="ct-pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                >
                  « First
                </button>
                <button
                  className="ct-pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  ‹ Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`ct-pagination-btn${currentPage === page ? " active" : ""}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  className="ct-pagination-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next ›
                </button>
                <button
                  className="ct-pagination-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                >
                  Last »
                </button>

                <span className="ct-pagination-info">
                  Page {currentPage} of {totalPages} ({itemTypes.length} total)
                </span>
              </div>
            )}
        </div>

      </div>
    </>
  );
}
