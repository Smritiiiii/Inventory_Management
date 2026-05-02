const SupplierForm = ({ editData, onSuccess }) => {
  const [formData, setFormData] = useState(
    editData || { name: "", phone: "", address: "" }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editData) {
      await axios.put(`/suppliers/${editData.id}/`, formData);
    } else {
      await axios.post("/suppliers/", formData);
    }

    onSuccess();
  };

  return (
    <div className="card p-4">
      <h4>{editData ? "Edit Supplier" : "Add Supplier"}</h4>

      <form onSubmit={handleSubmit}>
        <input
          className="form-control mb-2"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        <input
          className="form-control mb-2"
          placeholder="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />

        <input
          className="form-control mb-3"
          placeholder="Address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />

        <button className="btn btn-primary">
          {editData ? "Update" : "Save"}
        </button>

        <button
          type="button"
          className="btn btn-secondary ms-2"
          onClick={onSuccess}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};
