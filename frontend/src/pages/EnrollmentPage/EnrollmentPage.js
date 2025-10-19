import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";

import { Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import DataTable from "../../components/DataTable"; 
import "./Enrollment.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

export default function EnrollmentPage() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [dateFilter, setDateFilter] = useState("all");
  const [category, setCategory] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    axios
      .get("/api/enroll")
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : [];
        setData(rows);
        setFilteredData(rows);
        const acts = [...new Set(rows.map((r) => r.Activity || "Unknown"))];
        setCategories(acts);
      })
      .catch((err) => console.error(err));
  }, []);

  const applyFilters = () => {
    let filtered = [...data];
    const today = moment();
    let start, end = today.clone();

    switch (dateFilter) {
      case "today":
        start = today.clone().startOf("day");
        end = today.clone().endOf("day");
        break;
      case "yesterday":
        start = today.clone().subtract(1, "days").startOf("day");
        end = today.clone().subtract(1, "days").endOf("day");
        break;
      case "last7":
        start = today.clone().subtract(7, "days").startOf("day");
        break;
      case "thisMonth":
        start = today.clone().startOf("month");
        break;
      case "lastMonth":
        start = today.clone().subtract(1, "month").startOf("month");
        end = today.clone().subtract(1, "month").endOf("month");
        break;
      case "custom":
        start = startDate ? moment(startDate).startOf("day") : today.clone().startOf("month");
        end = endDate ? moment(endDate).endOf("day") : today.clone().endOf("month");
        break;
      default:
        start = null;
    }

    if (start) {
      filtered = filtered.filter((item) => {
        const date = moment(item.Timestamp || item.Date || item.timestamp, [
          "M/D/YYYY H:mm:ss",
          "DD/MM/YYYY",
          "YYYY-MM-DD",
        ]);
        return date.isValid() && date.isBetween(start, end, null, "[]");
      });
    }

    if (category !== "All") {
      filtered = filtered.filter((d) => d.Activity === category);
    }

    setFilteredData(filtered);
  };

  const totalRevenue = filteredData.reduce(
    (sum, d) => sum + parseFloat(d["Fees Paid Amount"] || 0),
    0
  );
  const totalEnrollments = filteredData.length;
  const activeCategories = [...new Set(filteredData.map((d) => d.Activity || "Unknown"))];

  // --- Pie Chart ---
  const activityCounts = {};
  filteredData.forEach((item) => {
    const act = item.Activity || "Unknown";
    activityCounts[act] = (activityCounts[act] || 0) + 1;
  });

  const pieData = {
    labels: Object.keys(activityCounts),
    datasets: [
      {
        data: Object.values(activityCounts),
        backgroundColor: [
          "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0",
          "#9966FF", "#F7464A", "#46BFBD", "#FDB45C",
        ],
      },
    ],
  };

  const pieOptions = {
  responsive: true,
  maintainAspectRatio: false, // allow chart to expand
  plugins: {
    legend: {
      display: false, // hide legend
    },
    title: {
      display: true,
      text: "Enrollments by Activity",
      font: { size: 18, weight: "bold" },
      padding: { bottom: 20 },
    },
  },
};


  // --- Line Chart ---
  const lineCounts = {};
  filteredData.forEach((item) => {
    const d = moment(item.Timestamp || item.Date || item.timestamp);
    if (d.isValid()) {
      const key = `${d.year()}-${("0" + (d.month() + 1)).slice(-2)}`;
      lineCounts[key] = (lineCounts[key] || 0) + 1;
    }
  });

  const sortedKeys = Object.keys(lineCounts).sort();
  const lineData = {
    labels: sortedKeys,
    datasets: [
      {
        label: "Enrollments Over Time",
        data: sortedKeys.map((k) => lineCounts[k]),
        borderColor: "#1f3c88",
        backgroundColor: "rgba(31, 60, 136, 0.1)",
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: "#1f3c88",
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Enrollment Trend (Monthly)", font: { size: 16, weight: "bold" } },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: { title: { display: true, text: "Month", color: "#555" } },
      y: { title: { display: true, text: "Enrollments", color: "#555" } },
    },
  };

  return (
    <div className="enrollment-container">
      <h1 className="enrollment-title">Enrollment Dashboard</h1>

      {/* Filters */}
      <div className="filters-container">
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="last7">Last 7 Days</option>
          <option value="thisMonth">This Month</option>
          <option value="lastMonth">Last Month</option>
          <option value="custom">Custom Range</option>
        </select>

        {dateFilter === "custom" && (
          <>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </>
        )}

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="All">All Categories</option>
          {categories.map((c, idx) => (
            <option key={idx} value={c}>{c}</option>
          ))}
        </select>

        <button className="filter-btn" onClick={applyFilters}>Apply Filters</button>
      </div>

      {/* Metrics */}
      <div className="metrics-container">
        <div className="metric-card">
          <h3>Total Enrollments</h3>
          <p className="metric-value">{totalEnrollments}</p>
        </div>
        <div className="metric-card">
          <h3>Total Revenue</h3>
          <p className="metric-value">₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <h3>Active Activities</h3>
          <p className="metric-value">{activeCategories.length}</p>
        </div>
      </div>

      {/* Charts side by side */}
      <div className="charts-section">
        <div className="chart-box pie-chart">
          <Pie data={pieData} options={pieOptions} />
        </div>
        <div className="chart-box line-chart">
          <Line data={lineData} options={lineOptions} />
        </div>
      </div>

      {/* Data Table */}
      <div className="table-container">
        <DataTable data={filteredData} />
      </div>
    </div>
  );
}
