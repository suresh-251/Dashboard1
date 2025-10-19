import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import moment from "moment"; 
import "./DataTable.css";

const DataTable = ({ data }) => {
  const [filteredData, setFilteredData] = useState([]);
  const [filter, setFilter] = useState("All");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    setFilteredData(data || []);
  }, [data]);

  // Safe date parser
  const parseDate = (raw) => {
    if (!raw) return null;
    const m = moment(raw, ["M/D/YYYY", "DD-MMM-YY", "DD-MMM-YYYY", "YYYY-MM-DD"], true);
    return m.isValid() ? m.toDate() : null;
  };

  // Safe number parser
  const parseNumber = (val) => {
    if (!val) return 0;
    const num = Number(val.toString().replace(/,/g, "").trim());
    return isNaN(num) ? 0 : num;
  };

  // Sorting logic
  const sortData = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";

    const sorted = [...filteredData].sort((a, b) => {
      const valA = a[key];
      const valB = b[key];

      // Handle dates
      const dateA = parseDate(valA);
      const dateB = parseDate(valB);
      if (dateA && dateB) return direction === "asc" ? dateA - dateB : dateB - dateA;

      // Handle numbers
      const numA = parseNumber(valA);
      const numB = parseNumber(valB);
      if (!isNaN(numA) && !isNaN(numB)) return direction === "asc" ? numA - numB : numB - numA;

      // Strings
      return direction === "asc"
        ? String(valA || "").localeCompare(String(valB || ""))
        : String(valB || "").localeCompare(String(valA || ""));
    });

    setFilteredData(sorted);
    setSortConfig({ key, direction });
  };

  // Excel export
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, "data.xlsx");
  };

  const getStatusClass = (status) => {
    switch ((status || "").toLowerCase()) {
      case "due":
        return "status-due";
      case "pending":
        return "status-pending";
      case "done":
        return "status-done";
      default:
        return "";
    }
  };

  if (!data || data.length === 0)
    return <p style={{ textAlign: "center", color: "#777" }}>No data available.</p>;

  return (
    <div className="data-table-container">
      <div className="filter-buttons">
        {["All", "Today", "Yesterday"].map((f) => (
          <button
            key={f}
            className={filter === f ? "active" : ""}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
        <button className="export-btn" onClick={exportToExcel}>
          Export to Excel
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            {Object.keys(filteredData[0] || {}).map((key, idx) => (
              <th
                key={idx}
                onClick={() => sortData(key)}
                style={{ cursor: "pointer" }}
              >
                {key}
                {sortConfig.key === key && (
                  <span style={{ marginLeft: "5px" }}>
                    {sortConfig.direction === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, idx) => (
            <tr key={idx} className={getStatusClass(row.Status || row.status)}>
              {Object.values(row).map((val, i) => (
                <td key={i}>{val !== null && val !== undefined ? val : "N/A"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
