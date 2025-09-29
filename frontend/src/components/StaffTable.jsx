import React from "react";

const StaffTable = ({ staffData, onEdit, onDelete }) => {
  if (!staffData || staffData.length === 0) {
    return <p style={{ textAlign: "center", marginTop: "10px" }}>No staff members available.</p>;
  }

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "10px",
      }}
    >
      <thead>
        <tr style={{ backgroundColor: "#f2f2f2" }}>
          <th style={thStyle}>Name</th>
          <th style={thStyle}>Role</th>
          <th style={thStyle}>Department</th>
          <th style={thStyle}>Salary</th>
          <th style={thStyle}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {staffData.map((staff, index) => (
          <tr
            key={staff._id}
            style={{
              backgroundColor: index % 2 === 0 ? "#fff" : "#fafafa",
            }}
          >
            <td style={tdStyle}>{staff.name}</td>
            <td style={tdStyle}>{staff.role}</td>
            <td style={tdStyle}>{staff.department}</td>
            <td style={tdStyle}>Rs{staff.salary}</td>
            <td style={tdStyle}>
              <button
                onClick={() => onEdit(staff)}
                style={{
                  ...buttonStyle,
                  backgroundColor: "#007bff",
                  marginRight: "8px",
                }}
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => onDelete(staff._id)}
                style={{
                  ...buttonStyle,
                  backgroundColor: "#dc3545",
                }}
              >
                🗑️ Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Styles
const thStyle = {
  padding: "10px",
  textAlign: "left",
  borderBottom: "2px solid #ddd",
};

const tdStyle = {
  padding: "10px",
  borderBottom: "1px solid #ddd",
};

const buttonStyle = {
  padding: "6px 12px",
  border: "none",
  borderRadius: "4px",
  color: "#fff",
  cursor: "pointer",
};

export default StaffTable;
