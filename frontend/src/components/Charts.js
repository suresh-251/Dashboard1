import React from "react";
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

import "./chart.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Charts = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="no-data">No data available.</p>;
  }

  // --- PIE CHART ---
  const activityCounts = {};
  data.forEach((item) => {
    const act = item["Activity"] || "Unknown";
    activityCounts[act] = (activityCounts[act] || 0) + 1;
  });

  const pieData = {
    labels: Object.keys(activityCounts),
    datasets: [
      {
        label: "Enrollments by Activity",
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
    maintainAspectRatio: false, // allow chart to fill container
    plugins: {
      legend: {
        display: true,
        position: "bottom", // legend below chart
        align: "center",
      },
      title: {
        display: true,
        text: "Enrollments by Activity",
        font: { size: 16, weight: "bold" },
        padding: { bottom: 20 },
      },
    },
  };

  // --- LINE CHART ---
  const parseDate = (raw) => {
    if (!raw) return null;
    const dt = new Date(raw);
    return isNaN(dt) ? null : dt;
  };

  const dates = data.map((item) => parseDate(item["Timestamp"] || item["Date"] || ""));
  const validDates = dates.filter((d) => d);

  if (validDates.length === 0) return <p className="no-data">No valid dates to display line chart.</p>;

  const lineCounts = {};
  validDates.forEach((d) => {
    const key = `${d.getFullYear()}-${("0" + (d.getMonth() + 1)).slice(-2)}`;
    lineCounts[key] = (lineCounts[key] || 0) + 1;
  });

  const sortedKeys = Object.keys(lineCounts).sort((a, b) => a.localeCompare(b));
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
    <div className="charts-container">
      <div className="chart-card pie-chart">
        <Pie data={pieData} options={pieOptions} />
      </div>
      <div className="chart-card line-chart">
        <Line data={lineData} options={lineOptions} />
      </div>
    </div>
  );
};

export default Charts;
