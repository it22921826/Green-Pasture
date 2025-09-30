import React, { useState, useEffect } from "react";

const StaffForm = ({ onSubmit, onCancel, initialData = {} }) => {
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    department: "",
    salary: "",
  });

  // Load initial data when editing
  useEffect(() => {
    setFormData({
      name: initialData.name || "",
      role: initialData.role || "",
      department: initialData.department || "",
      salary: initialData.salary || "",
    });
  }, [initialData]);

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name') {
      // Allow only letters and spaces
      if (/^[A-Za-z ]*$/.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, name: '' }));
      } else {
        setErrors((prev) => ({ ...prev, name: 'Letters and spaces only' }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || errors.name) {
      setErrors((prev) => ({ ...prev, name: prev.name || 'Name is required' }));
      return;
    }
    onSubmit(formData);
    setFormData({ name: "", role: "", department: "", salary: "" });
    setErrors({});
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "15px",
      }}
    >
      <div style={formGroup}>
        <label style={labelStyle}>Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          style={{ ...inputStyle, borderColor: errors.name ? '#dc2626' : '#ccc' }}
          placeholder="Enter staff name"
        />
        {errors.name && (
          <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.name}</span>
        )}
      </div>

      <div style={formGroup}>
        <label style={labelStyle}>Role</label>
        <input
          type="text"
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
          style={inputStyle}
          placeholder="e.g. Manager, Receptionist"
        />
      </div>

      <div style={formGroup}>
        <label style={labelStyle}>Department</label>
        <input
          type="text"
          name="department"
          value={formData.department}
          onChange={handleChange}
          required
          style={inputStyle}
          placeholder="e.g. Front Office, Housekeeping"
        />
      </div>

      <div style={formGroup}>
        <label style={labelStyle}>Salary (Rs)</label>
        <input
          type="number"
          name="salary"
          value={formData.salary}
          onChange={handleChange}
          required
          style={inputStyle}
          placeholder="Enter salary amount"
        />
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
        <button type="submit" style={{ ...buttonStyle, backgroundColor: "#28a745" }}>
          ✅ {initialData._id ? "Update Staff" : "Add Staff"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{ ...buttonStyle, backgroundColor: "#6c757d" }}
          >
            ❌ Cancel
          </button>
        )}
      </div>
    </form>
  );
};

// Styles
const formGroup = {
  display: "flex",
  flexDirection: "column",
};

const labelStyle = {
  marginBottom: "5px",
  fontWeight: "bold",
};

const inputStyle = {
  padding: "8px",
  borderRadius: "4px",
  border: "1px solid #ccc",
  fontSize: "14px",
};

const buttonStyle = {
  padding: "8px 16px",
  border: "none",
  borderRadius: "4px",
  color: "#fff",
  cursor: "pointer",
  fontSize: "14px",
};

export default StaffForm;
