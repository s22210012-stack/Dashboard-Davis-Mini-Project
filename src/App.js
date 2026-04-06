import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import "./App.css";

import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie,
  XAxis, YAxis, Tooltip,
  Cell,
  ResponsiveContainer
} from "recharts";

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("/data.csv")
      .then(res => res.text())
      .then(csv => {
        const result = Papa.parse(csv, {
          header: true,
          dynamicTyping: true
        });
        setData(result.data);
      });
  }, []);

  const total = data.length;

  const avg =
    data.reduce((a, b) => a + (b.Total || 0), 0) / total || 0;

  const totalQuantity = data.reduce(
    (sum, item) => sum + (item.Ticket_Quantity || 0),
    0
  );

  // BAR
  const cityData = Object.values(
    data.reduce((acc, item) => {
      if (!item.City) return acc;
      acc[item.City] = acc[item.City] || {
        name: item.City,
        value: 0
      };
      acc[item.City].value++;
      return acc;
    }, {})
  ).sort((a, b) => b.value - a.value);

  // PIE
  const categoryData = Object.values(
    data.reduce((acc, item) => {
      if (!item.Airline) return acc;
      acc[item.Airline] = acc[item.Airline] || {
        name: item.Airline,
        value: 0
      };
      acc[item.Airline].value++;
      return acc;
    }, {})
  );

  const totalCategory = categoryData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  // LINE
  const monthlyData = Object.values(
    data.reduce((acc, item) => {
      if (!item.Date) return acc;
      acc[item.Date] = acc[item.Date] || {
        date: item.Date,
        total: 0
      };
      acc[item.Date].total += item.Total || 0;
      return acc;
    }, {})
  );

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

  return (
    <div className="container">
      <div className="title">Dashboard Penjualan Tiket Pesawat</div>

      {/* KPI */}
      <div className="kpi-container">
        <div className="kpi-card">
          <div className="kpi-title">Total Data</div>
          <div className="kpi-value">{total}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Rata-rata Transaksi</div>
          <div className="kpi-value">{avg.toFixed(0)}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Total Tiket Terjual</div>
          <div className="kpi-value">{totalQuantity}</div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="chart-container">

        {/* BAR */}
        <div className="chart-card">
          <h3>📊 Bar Chart - Distribusi Kota</h3>
          <p>Jumlah transaksi pembelian tiket pada setiap kota</p>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={cityData}>
              <XAxis dataKey="name" />
              <YAxis width={60} />

              {/* 🔥 FIX TOOLTIP */}
              <Tooltip
                formatter={(value) => [`${value}`, "Tiket"]}
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  borderRadius: "10px",
                  border: "1px solid #ddd",
                  backgroundColor: "#fff"
                }}
              />

              <Bar dataKey="value">
                {cityData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PIE */}
        <div className="chart-card">
          <h3>🥧 Pie Chart - Distribusi Maskapai</h3>
          <p>Persentase setiap maskapai penerbangan</p>

          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
                label={({ value }) =>
                  ((value / totalCategory) * 100).toFixed(1) + "%"
                }
              >
                {categoryData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>

              <Tooltip 
  formatter={(value, name, props) => [
    "",
    props.payload.name
  ]}
/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* LINE */}
        <div className="chart-card line-chart" style={{ width: "100%" }}>
          <h3>📈 Line Chart - Trend Penjualan</h3>
          <p>Total transaksi dari waktu ke waktu</p>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={monthlyData}
              margin={{ top: 10, right: 20, left: 60, bottom: 10 }}
            >
              <XAxis dataKey="date" />
              <YAxis width={80} />

              {/* 🔥 FIX TOOLTIP */}
              <Tooltip
                formatter={(value) => [`${value}`, "Total Transaksi"]}
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  borderRadius: "10px",
                  border: "1px solid #ddd",
                  backgroundColor: "#fff"
                }}
              />

              <Line dataKey="total" stroke="#007bff" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-container">
        <h3>📋 Data Transaksi</h3>
        <table>
          <thead>
            <tr>
              <th>Gender</th>
              <th>City</th>
              <th>Date</th>
              <th>Airline</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i}>
                <td>{d.Gender}</td>
                <td>{d.City}</td>
                <td>{d.Date}</td>
                <td>{d.Airline}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default App;