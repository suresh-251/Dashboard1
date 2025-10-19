import React, { useEffect, useState } from "react";
import axios from "axios";
import "./LTVPage.css";

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  if (!isNaN(parsed)) return parsed;
  const parts1 = dateStr.split("-");
  if (parts1.length === 3) return new Date(`${parts1[2]}-${parts1[1]}-${parts1[0]}`);
  const parts2 = dateStr.split("/");
  if (parts2.length === 3) return new Date(`${parts2[2]}-${parts2[0]}-${parts2[1]}`);
  return null;
};

const LTVPage = () => {
  const [enrollData, setEnrollData] = useState([]);
  const [renewData, setRenewData] = useState([]);
  const [ltvData, setLtvData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [timeRange, setTimeRange] = useState("All");
  const [courseFilter, setCourseFilter] = useState("All");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [allCourses, setAllCourses] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [enrollRes, renewRes] = await Promise.all([
          axios.get("/api/enroll"),
          axios.get("/api/renewals"),
        ]);

        const enroll = enrollRes.data || [];
        const renew = renewRes.data || [];
        setEnrollData(enroll);
        setRenewData(renew);

        const ltvDict = {};
        const coursesSet = new Set();

        const processItems = (items, type) => {
          items.forEach((item) => {
            const name = item["Student Name"] || "Unknown";
            const amt = parseFloat(item["Fees Paid Amount"] || 0);
            const course = item["Activity"] || "Unknown";
            coursesSet.add(course);
            const start = parseDate(item["Start Date"]);

            if (!ltvDict[name]) {
              ltvDict[name] = { TotalPaid: 0, Courses: {}, StartDates: [] };
            }

            ltvDict[name].TotalPaid += amt;
            if (!ltvDict[name].Courses[course]) ltvDict[name].Courses[course] = 0;
            ltvDict[name].Courses[course] += amt;

            if (start) ltvDict[name].StartDates.push({ date: start, type });
          });
        };

        processItems(enroll, "enroll");
        processItems(renew, "renew");

        setAllCourses(["All", ...Array.from(coursesSet)]);

        const ltvList = Object.keys(ltvDict).map((name) => {
          const info = ltvDict[name];
          const earliestStart =
            info.StartDates.length > 0
              ? new Date(Math.min(...info.StartDates.map((d) => d.date.getTime())))
              : null;

          return {
            "Student Name": name,
            "Total Paid": info.TotalPaid,
            Courses: Object.keys(info.Courses),
            CoursePayments: info.Courses,
            "Start Date": earliestStart
              ? earliestStart.toISOString().split("T")[0]
              : "",
          };
        });

        setLtvData(ltvList);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ------------------ Filters ------------------
  const filteredData = ltvData.filter((item) => {
    // Course filter
    if (courseFilter !== "All" && !item.Courses.includes(courseFilter)) return false;

    if (!item["Start Date"]) return false;
    const startDate = new Date(item["Start Date"]);
    const now = new Date();

    switch (timeRange) {
      case "Today":
        if (startDate.toDateString() !== now.toDateString()) return false;
        break;
      case "Yesterday":
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        if (startDate.toDateString() !== yesterday.toDateString()) return false;
        break;
      case "Last 7 Days":
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        if (startDate < weekAgo || startDate > now) return false;
        break;
      case "Last 30 Days":
        const monthAgo = new Date();
        monthAgo.setDate(now.getDate() - 30);
        if (startDate < monthAgo || startDate > now) return false;
        break;
      case "Custom":
        if (customStart && new Date(customStart) > startDate) return false;
        if (customEnd && new Date(customEnd) < startDate) return false;
        break;
      default:
        break;
    }

    return true;
  });

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="ltv-page">
      <h2>💰 Lifetime Value (LTV) Dashboard</h2>

      <div className="ltv-card" style={{ marginBottom: 20, display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div>
          <label>Course: </label>
          <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            {allCourses.map((course, idx) => (
              <option key={idx} value={course}>{course}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Time Range: </label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option>All</option>
            <option>Today</option>
            <option>Yesterday</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Custom</option>
          </select>
        </div>

        {timeRange === "Custom" && (
          <>
            <div>
              <label>Custom Start: </label>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            </div>

            <div>
              <label>Custom End: </label>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
            </div>
          </>
        )}
      </div>

      <div className="ltv-card">
        <table className="ltv-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Total Paid (₹)</th>
              <th>Courses</th>
              <th>Start Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, idx) => (
              <tr key={idx}>
                <td>{item["Student Name"]}</td>
                <td>{item["Total Paid"].toLocaleString()}</td>
                <td>{item.Courses.join(", ")}</td>
                <td>{item["Start Date"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LTVPage;
