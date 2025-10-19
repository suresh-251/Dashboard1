import  { useState } from "react";
import Charts from "./Charts"; // Reuse your Charts component
import DataTable from "./DataTable"; // Reuse your DataTable component
import moment from "moment";

const RenewalDashboard = ({ data }) => {
  const [statusFilter, setStatusFilter] = useState("");

  // Compute status
  const dataWithStatus = data.map(item => {
    const dueDateStr = item["Due Date"];
    const feesRemaining = parseFloat(item["Fees  Remaining Amount "] || 0);

    let status = "Done";
    if (feesRemaining > 0) {
      if (dueDateStr && dueDateStr !== "NA" && moment(dueDateStr, "DD-MMM-YY").isBefore(moment(), "day")) {
        status = "Due";
      } else {
        status = "Pending";
      }
    }
    return { ...item, status };
  });

  // Metrics
  const totalRenewals = dataWithStatus.length;
  const doneCount = dataWithStatus.filter(d => d.status === "Done").length;
  const pendingCount = dataWithStatus.filter(d => d.status === "Pending").length;
  const dueCount = dataWithStatus.filter(d => d.status === "Due").length;

  // Filtered Data
  const filteredData = statusFilter ? dataWithStatus.filter(d => d.status === statusFilter) : dataWithStatus;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <h1>Renewal Dashboard</h1>

      {/* Metrics Cards */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}>
        {[
          { title: "Total Renewals", value: totalRenewals },
          { title: "Done", value: doneCount },
          { title: "Pending", value: pendingCount },
          { title: "Due", value: dueCount },
        ].map((metric, idx) => (
          <div key={idx} style={{
            flex: "1",
            minWidth: "180px",
            padding: "20px",
            backgroundColor: "#1f3c88",
            color: "#fff",
            borderRadius: "10px",
            textAlign: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
          }}>
            <h3>{metric.title}</h3>
            <p style={{ fontSize: "24px", fontWeight: "bold" }}>{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ marginBottom: "20px" }}>
        <label>Status: </label>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All</option>
          <option value="Done">Done</option>
          <option value="Pending">Pending</option>
          <option value="Due">Due</option>
        </select>
      </div>

      {/* Renewal Charts */}
      <Charts data={filteredData} />

      {/* Renewal Table */}
      <DataTable data={filteredData} />
    </div>
  );
};

export default RenewalDashboard;
