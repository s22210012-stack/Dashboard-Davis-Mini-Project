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

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // 🔥 FILTER DATE
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 🔥 FILTER MASKAPAI
  const [selectedAirline, setSelectedAirline] = useState("ALL");

  useEffect(() => {
    fetch("/data.csv")
      .then(res => res.text())
      .then(csv => {
        const result = Papa.parse(csv, {
          header: true,
          dynamicTyping: true
        });

        setData(result.data.filter(item => item.Date));
      });
  }, []);

  // 🔥 PARSE DATE
  const parseDate = (dateString) => {
    if (!dateString) return null;
    const parts = dateString.split("/");
    return new Date(parts[2], parts[0] - 1, parts[1]);
  };

  // 🔥 FILTER LOGIC (DATE + MASKAPAI)
  const filteredData = data.filter(item => {
    const itemDate = parseDate(item.Date);

    let dateMatch = true;
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      dateMatch = itemDate >= start && itemDate <= end;
    }

    const airlineMatch =
      selectedAirline === "ALL" || item.Airline === selectedAirline;

    return dateMatch && airlineMatch;
  });

  const total = filteredData.length;

  const avg =
    filteredData.reduce((a, b) => a + (b.Total || 0), 0) / total || 0;

  const totalQuantity = filteredData.reduce(
    (sum, item) => sum + (item.Ticket_Quantity || 0),
    0
  );

  const handleClearChat = () => {
    setMessages([]);
  };

  const cityData = Object.values(
    filteredData.reduce((acc, item) => {
      if (!item.City) return acc;
      acc[item.City] = acc[item.City] || {
        name: item.City,
        value: 0
      };
      acc[item.City].value++;
      return acc;
    }, {})
  ).sort((a, b) => b.value - a.value);

  const categoryData = Object.values(
    filteredData.reduce((acc, item) => {
      if (!item.Airline) return acc;
      acc[item.Airline] = acc[item.Airline] || {
        name: item.Airline,
        value: 0
      };
      acc[item.Airline].value++;
      return acc;
    }, {})
  ).sort((a, b) => b.value - a.value);

  const monthlyData = Object.values(
    filteredData.reduce((acc, item) => {
      if (!item.Date) return acc;
      acc[item.Date] = acc[item.Date] || {
        date: item.Date,
        total: 0
      };
      acc[item.Date].total += item.Total || 0;
      return acc;
    }, {})
  ).sort((a, b) => parseDate(a.date) - parseDate(b.date));

  // 🔥 LIST MASKAPAI
  const airlineList = [...new Set(data.map(d => d.Airline))];

  const COLORS = ["#b60707", "#cb3c39", "#db0a0a"];

  const handleSend = () => {
  if (!input) return;

  const userMessage = { sender: "user", text: input };

  let response = "Maaf, saya belum mengerti pertanyaan yang kamu berikan.";

  const text = input.toLowerCase();
// 🔥 GREETING / SAPAAN
if (
  text.includes("hai") ||
  text.includes("halo") ||
  text.includes("hello") ||
  text.includes("pagi") ||
  text.includes("siang") ||
  text.includes("sore") ||
  text.includes("malam")
) {
  response = `Halo! 👋

Saya adalah AI Assistant pada dashboard ini.

Saya bisa membantu kamu untuk menjawab:
- Menjelaskan isi dashboard
- Memberikan insight data
- Menjelaskan tren penjualan
- Menganalisis tiap chart

Silakan tanyakan apa saja terkait data 😊`;
}

  // 🔥 1. PENJELASAN DASHBOARD
  if (text.includes("dashboard") || text.includes("ini tentang apa")) {
    response = `Dashboard ini menampilkan analisis data penjualan tiket pesawat.

Terdapat beberapa visualisasi utama:
- Distribusi kota (Bar Chart)
- Distribusi maskapai (Pie Chart)
- Tren penjualan berdasarkan waktu (Line Chart)
- Dan data penerbangan (Tabel)

Dashboard ini membantu memahami pola penjualan, preferensi maskapai, dan tren transaksi.`;
  }

  // 🔥 TOTAL DATA
else if (text.includes("total data")) {
  response = `Total data saat ini adalah ${total} transaksi.`;
}

// 🔥 TOTAL TRANSAKSI PER AIRLINE
else if (text.includes("transaksi airline") || text.includes("maskapai terbanyak")) {
  const topAirline = categoryData[0];

  response = `Maskapai dengan transaksi terbanyak adalah ${topAirline?.name} dengan total ${topAirline?.value} transaksi.`;
}

// 🔥 TREND TERTINGGI
else if (text.includes("tertinggi") || text.includes("penjualan tertinggi")) {
  const maxData = monthlyData.reduce((a, b) =>
    a.total > b.total ? a : b
  );

  response = `Penjualan tertinggi terjadi pada tanggal ${maxData.date} dengan total Rp${maxData.total}.`;
}

// 🔥 TREND TERENDAH
else if (text.includes("terendah") || text.includes("penjualan terendah")) {
  const minData = monthlyData.reduce((a, b) =>
    a.total < b.total ? a : b
  );

  response = `Penjualan terendah terjadi pada tanggal ${minData.date} dengan total Rp${minData.total}.`;
}

// 🔥 KESIMPULAN DASHBOARD
else if (text.includes("kesimpulan") || text.includes("ringkasan")) {

  const topCity = cityData[0];
  const topAirline = categoryData[0];

  const maxData = monthlyData.reduce((a, b) =>
    a.total > b.total ? a : b
  );

  const minData = monthlyData.reduce((a, b) =>
    a.total < b.total ? a : b
  );

  response = `Kesimpulan dari dashboard penjualan tiket pesawat:

Berdasarkan hasil analisis data, dapat disimpulkan bahwa aktivitas penjualan menunjukkan pola yang dinamis dan fluktuatif dari waktu ke waktu.

Kota dengan kontribusi transaksi tertinggi adalah ${topCity?.name}, yang menunjukkan bahwa wilayah ini memiliki tingkat permintaan tiket yang paling signifikan.

Dari sisi maskapai, ${topAirline?.name} menjadi maskapai yang paling dominan digunakan oleh pelanggan, sehingga dapat dianggap sebagai pilihan utama dalam perjalanan udara.

Penjualan tertinggi tercatat pada tanggal ${maxData.date}, sedangkan penjualan terendah terjadi pada tanggal ${minData.date}. Hal ini mengindikasikan adanya pengaruh waktu tertentu terhadap tingkat pembelian tiket.

Secara keseluruhan, data menunjukkan bahwa preferensi pelanggan cenderung terfokus pada maskapai dan kota tertentu, serta dipengaruhi oleh faktor waktu, sehingga strategi pemasaran dan operasional dapat diarahkan berdasarkan pola tersebut.`;
}

  // 🔥 2. PENJELASAN MASING-MASING CHART
  else if (text.includes("visualisasi chart") || text.includes("isi chart")) {
    response = `Penjelasan visualisasi chart:

1. Bar Chart (Distribusi Kota)
Menunjukkan jumlah tiket yang terjual di setiap kota.

2. Pie Chart (Distribusi Maskapai)
Menampilkan proporsi penggunaan maskapai oleh pelanggan.

3. Line Chart (Tren Penjualan)
Menunjukkan perubahan total penjualan dari waktu ke waktu.

4. Table (Data Penerbangan)
Menunjukkan data terkait penerbangan seperti gender, city, date, airline`;
  }

  // 🔥 3. INSIGHT UTAMA
  else if (text.includes("insight utama")) {
    const topCity = cityData[0];
    const topAirline = categoryData[0];

    response = `Insight utama dari dashboard:

- Kota dengan penjualan tertinggi: ${topCity?.name}
- Maskapai paling populer: ${topAirline?.name}
- Total tiket terjual: ${totalQuantity}

Hal ini menunjukkan bahwa permintaan tertinggi berasal dari kota tersebut dan maskapai tersebut paling diminati pelanggan.`;
  }

  // 🔥 4. INSIGHT PER CHART
  else if (text.includes("insight chart") || text.includes("insight setiap chart")) {
    const topCity = cityData[0];
    const topAirline = categoryData[0];

    response = `Insight per chart:

1. Bar Chart (Kota)
${topCity?.name} memiliki jumlah transaksi tertinggi.

2. Pie Chart (Maskapai)
${topAirline?.name} adalah maskapai yang paling sering digunakan.

3. Line Chart (Tren)
Data menunjukkan adanya fluktuasi penjualan dari waktu ke waktu.`;
  }

  // 🔥 5. TREND ANALYSIS
  else if (text.includes("tren") || text.includes("trend utama")) {
    const maxData = monthlyData.reduce((a, b) =>
      a.total > b.total ? a : b
    );
    const minData = monthlyData.reduce((a, b) =>
      a.total < b.total ? a : b
    );

    response = `Analisis tren penjualan:

- Penjualan tertinggi terjadi pada: ${maxData.date}
- Penjualan terendah terjadi pada: ${minData.date}

Tren menunjukkan pola fluktuatif, yang berarti tidak stabil dan kemungkinan dipengaruhi oleh faktor waktu tertentu.`;
  }

  // 🔥 6. INSIGHT UMUM (SMART)
  else if (text.includes("insight") || text.includes("analisis")) {
    const topCity = cityData[0];
    const topAirline = categoryData[0];

    response = `Insight data:

- Kota penjualan terbanyak: ${topCity?.name}
- Maskapai Populer: ${topAirline?.name}
- Total tiket: ${totalQuantity}

Data menunjukkan adanya preferensi pengguna terhadap kota dan maskapai tertentu.`;
  }

  const botMessage = { sender: "bot", text: response };

  setMessages([...messages, userMessage, botMessage]);
  setInput("");
};

  return (
    <div className="container">
      <div className="title">Laporan Dashboard Penjualan Tiket Pesawat</div>

<div className="print-header">
  <h2>Deskripsi Hasil </h2>
  <p>
    Laporan ini merupakan hasil visualisasi data penjualan tiket pesawat yang 
ditampilkan dalam bentuk dashboard interaktif. Visualisasi mencakup distribusi 
penjualan berdasarkan kota, distribusi penggunaan maskapai, serta tren penjualan 
dari waktu ke waktu. Informasi ini digunakan untuk mendukung analisis bisnis dan 
pengambilan keputusan berbasis data.
  </p>
</div>

      <div className="kpi-container">
        <div className="kpi-card">
          <div className="kpi-title">Total Data</div>
          <div className="kpi-value">{total}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Rata-rata Transaksi</div>
          <div className="kpi-value">Rp{avg.toFixed(0)}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Total Tiket Terjual</div>
          <div className="kpi-value">{totalQuantity}</div>
        </div>
      </div>

      <div style={{ marginBottom: "15px", textAlign: "right" }}>
  <button onClick={() => window.print()}>
    🖨️ Print Dashboard
  </button>
</div>

      <div className="chart-container">
        <div className="chart-card">
          <h3>📊 Distribusi Kota - Bar Chart</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={cityData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip cursor={{ fill: "transparent"}}/>
              <Bar dataKey="value">
                {cityData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 🔥 PIE + FILTER */}
        <div className="chart-card">
          <h3>🥧 Distribusi Maskapai - Pie Chart</h3>

          {/* FILTER MASKAPAI */}
          <div style={{ marginBottom: "10px", textAlign: "center" }}>
            <label>Pilih Maskapai: </label>
            <select
              value={selectedAirline}
              onChange={(e) => setSelectedAirline(e.target.value)}
            >
              <option value="ALL">Semua</option>
              {airlineList.map((airline, i) => (
                <option key={i} value={airline}>
                  {airline}
                </option>
              ))}
            </select>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
                label={({ name, value }) => {
                  const total = categoryData.reduce((sum, item) => sum + item.value, 0);
                  const percent = total ? ((value / total) * 100).toFixed(0) : 0;
                  return `${name} ${percent}%`;
                }}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>

              <Tooltip
                formatter={(value, name, props) => [
                  `${value} transaksi`,
                  props.payload.name
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card line-chart" style={{marginTop: "20px" }}>
          <h3>📈 Trend Penjualan - Line Chart</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart 
              data={monthlyData}
              margin={{ top: 10, right: 30, left: 50, bottom: 20}}
            >
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line dataKey="total" stroke="#b60707" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="table-container">
        <h3>📋 Data Penerbangan - Tabel</h3>

        <div style={{ marginBottom: "15px" }}>
          <label>Dari: </label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

          <label style={{ marginLeft: "10px" }}>Sampai: </label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

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
            {filteredData.map((d, i) => (
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

      <div className="chat-toggle" onClick={() => setIsOpen(!isOpen)}>
        💬
      </div>

      {isOpen && (
  <div className="chat-popup">

    {/* 🔥 HEADER + CLEAR BUTTON */}
    <div className="chat-header">
      <h3>🤖 AI Assistant</h3>
      <button onClick={handleClearChat} className="clear-btn">
        🗑 Clear
      </button>
    </div>

    <div className="chat-box">
      {messages.map((msg, index) => (
        <div key={index} className={msg.sender}>
          {msg.text}
        </div>
      ))}
    </div>

          <div className="chat-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter"){
                  handleSend();
                }
              }}
              placeholder="Tanya sesuatu..."
            />
            <button onClick={handleSend}>Kirim</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
