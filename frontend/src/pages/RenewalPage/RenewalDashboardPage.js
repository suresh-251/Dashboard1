import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import DataTable from "../../components/DataTable";
import "./RenewalDashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function RenewalDashboardPage() {
  const [data, setData] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateRange, setDateRange] = useState("All");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [trendType, setTrendType] = useState("Daily");
  const [sortOrder] = useState("asc");

  useEffect(() => {
    axios
      .get("/api/renewals")
      .then((res) => setData(res.data || []))
      .catch((err) => console.error(err));
  }, []);

  // Preprocess & classify
  const processedData = (data || []).map((d) => {
    const feesRemaining = parseFloat(d["Fees  Remaining Amount "] || 0);
    const start = moment(d["Start Date"], ["M/D/YYYY", "DD-MMM-YY", "YYYY-MM-DD"]);
    const end = moment(d["End Date"], ["M/D/YYYY", "DD-MMM-YY", "YYYY-MM-DD"]);

    let status = "Done";
    if (feesRemaining > 0) {
      if (end.isValid() && end.isBefore(moment(), "day")) status = "Overdue";
      else status = "Pending";
    }

    return { ...d, status, category: d.Activity, start, end };
  });

  // Filtered data
  const filteredData = processedData.filter((d) => {
    const statusMatch = statusFilter ? d.status === statusFilter : true;
    const categoryMatch = categoryFilter ? d.category === categoryFilter : true;

    let dateMatch = true;
    if (dateRange === "Last 7 Days") dateMatch = d.start.isAfter(moment().subtract(7, "days"));
    else if (dateRange === "Last 30 Days") dateMatch = d.start.isAfter(moment().subtract(30, "days"));
    else if (dateRange === "Custom" && customStart && customEnd) {
      const startCustom = moment(customStart);
      const endCustom = moment(customEnd);
      dateMatch = d.start.isBetween(startCustom.clone().subtract(1, "day"), endCustom.clone().add(1, "day"));
    }

    return statusMatch && categoryMatch && dateMatch;
  });

  const sortedData = [...filteredData].sort((a, b) => (sortOrder === "asc" ? a.start - b.start : b.start - a.start));

  // Metrics
  const doneCount = filteredData.filter((d) => d.status === "Done").length;
  const pendingCount = filteredData.filter((d) => d.status === "Pending").length;
  const overdueCount = filteredData.filter((d) => d.status === "Overdue").length;

  // === Renewals Trend Chart ===
  const trendCounts = { Done: {}, Pending: {}, Overdue: {} };
  filteredData.forEach((d) => {
    if (d.start.isValid()) {
      let key;
      if (trendType === "Daily") key = d.start.format("YYYY-MM-DD");
      else if (trendType === "Weekly") key = d.start.startOf("isoWeek").format("YYYY-MM-DD");
      else key = d.start.startOf("month").format("YYYY-MM");

      trendCounts[d.status][key] = (trendCounts[d.status][key] || 0) + 1;
    }
  });

  const allKeysTrend = Array.from(
    new Set([
      ...Object.keys(trendCounts.Done),
      ...Object.keys(trendCounts.Pending),
      ...Object.keys(trendCounts.Overdue),
    ])
  ).sort();

  const renewalsLineData = {
    labels: allKeysTrend,
    datasets: [
      {
        label: "Done",
        data: allKeysTrend.map((k) => trendCounts.Done[k] || 0),
        borderColor: "#4BC0C0",
        backgroundColor: "rgba(75,192,192,0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 4,
      },
      {
        label: "Pending",
        data: allKeysTrend.map((k) => trendCounts.Pending[k] || 0),
        borderColor: "#FFCE56",
        backgroundColor: "rgba(255,206,86,0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 4,
      },
      {
        label: "Overdue",
        data: allKeysTrend.map((k) => trendCounts.Overdue[k] || 0),
        borderColor: "#F7464A",
        backgroundColor: "rgba(247,70,74,0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 4,
      },
    ],
  };

  const renewalsLineOptions = {
    responsive: true,
    plugins: { legend: { display: true }, title: { display: true, text: `Renewals Trend (${trendType})` } },
    scales: { x: { title: { display: true, text: "Period" } }, y: { title: { display: true, text: "Count" }, beginAtZero: true } },
  };

  // === Churn & Retention Trend Chart ===
  const churnRetentionCounts = { Churn: {}, Retention: {} };
  filteredData.forEach((d) => {
    if (d.start.isValid()) {
      let key;
      if (trendType === "Daily") key = d.start.format("YYYY-MM-DD");
      else if (trendType === "Weekly") key = d.start.startOf("isoWeek").format("YYYY-MM-DD");
      else key = d.start.startOf("month").format("YYYY-MM");

      churnRetentionCounts.Churn[key] = churnRetentionCounts.Churn[key] || 0;
      churnRetentionCounts.Retention[key] = churnRetentionCounts.Retention[key] || 0;

      if (d.status !== "Done") churnRetentionCounts.Churn[key] += 1;
      else churnRetentionCounts.Retention[key] += 1;
    }
  });

  const allKeysChurn = Array.from(new Set([...Object.keys(churnRetentionCounts.Churn), ...Object.keys(churnRetentionCounts.Retention)])).sort();

  const churnLineData = {
    labels: allKeysChurn,
    datasets: [
      {
        label: "Churn",
        data: allKeysChurn.map((k) => churnRetentionCounts.Churn[k] || 0),
        borderColor: "#F7464A",
        backgroundColor: "rgba(247,70,74,0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 4,
      },
      {
        label: "Retention",
        data: allKeysChurn.map((k) => churnRetentionCounts.Retention[k] || 0),
        borderColor: "#4BC0C0",
        backgroundColor: "rgba(75,192,192,0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 4,
      },
    ],
  };

  const churnLineOptions = {
    responsive: true,
    plugins: { legend: { display: true }, title: { display: true, text: `Churn & Retention Trend (${trendType})` } },
    scales: { x: { title: { display: true, text: "Period" } }, y: { title: { display: true, text: "Count" }, beginAtZero: true } },
  };

  // Customer Table columns
  const categories = [...new Set(processedData.map((d) => d.category))];
  const columns = [
    { name: "Name", selector: (row) => row.name, sortable: true },
    { name: "Course", selector: (row) => row.course, sortable: true },
    { name: "Start Date", selector: (row) => row.startDate, sortable: true },
    { name: "End Date", selector: (row) => row.endDate, sortable: true },
    { name: "Amount", selector: (row) => row.amount, sortable: true },
    { name: "Status", selector: (row) => row.status, sortable: true },
  ];

  return (
    <div className="renewal-container">
      <h1 className="renewal-title">Renewal Dashboard</h1>

      {/* Metrics */}
      <div className="metrics-container">
        {[{ title: "Done", value: doneCount }, { title: "Pending", value: pendingCount }, { title: "Overdue", value: overdueCount }].map(
          (m, i) => (
            <div key={i} className="metric-card">
              <h3>{m.title}</h3>
              <p className="metric-value">{m.value}</p>
            </div>
          )
        )}
      </div>

      {/* Filters */}
      <div className="filters-container">
        <label>Status:</label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All</option>
          <option value="Done">Done</option>
          <option value="Pending">Pending</option>
          <option value="Overdue">Overdue</option>
        </select>

        <label>Category:</label>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All</option>
          {categories.map((cat, i) => (
            <option key={i} value={cat}>{cat}</option>
          ))}
        </select>

        <label>Date Range:</label>
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
          <option value="All">All</option>
          <option value="Last 7 Days">Last 7 Days</option>
          <option value="Last 30 Days">Last 30 Days</option>
          <option value="Custom">Custom Range</option>
        </select>

        {dateRange === "Custom" && (
          <>
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
          </>
        )}

        <label>Trend Type:</label>
        <select value={trendType} onChange={(e) => setTrendType(e.target.value)}>
          <option value="Daily">Daily</option>
          <option value="Weekly">Weekly</option>
          <option value="Monthly">Monthly</option>
        </select>
      </div>

      {/* Charts */}
      <div className="charts-section">
        <div className="chart-box">
          <Line data={renewalsLineData} options={renewalsLineOptions} />
        </div>
        <div className="chart-box">
          <Line data={churnLineData} options={churnLineOptions} />
        </div>
      </div>

      {/* Customer DataTable */}
      <h3>Customer Renewals</h3>
      <DataTable
        data={sortedData.map((d) => ({
          name: d["Student Name"],
          course: d.category,
          startDate: d.start.format("YYYY-MM-DD"),
          endDate: d.end.format("YYYY-MM-DD"),
          amount: d["Fees Paid Amount"],
          status: d.status,
        }))}
        columns={columns}
        pagination
      />
    </div>
  );
}
