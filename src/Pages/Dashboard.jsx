import React, { useState, useEffect } from "react";
import Sidebar from "../Componnents/Sidebar";
import Header from "../Componnents/Header";
import {
  Clock,
  List,
  History,
  Grid,
  CheckCircle,
  RotateCcw,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, getDocs, writeBatch } from "firebase/firestore";

const useCurrentTime = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const date = currentTime.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).replace(",", " -");
  const time = currentTime.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return { date, time };
};

const StatCard = ({ title, value, icon: Icon, bgColor, iconColor }) => (
  <div className="bg-white p-4 rounded-xl shadow-md flex items-center space-x-4">
    <div className={`p-3 rounded-full ${bgColor}`}>
      <Icon className={`w-8 h-8 ${iconColor}`} />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const CustomBarChart = ({ data }) => (
  <div className="bg-white p-6 rounded-xl shadow-md h-full">
    <h3 className="text-lg font-semibold mb-4 border-b pb-2">Statistik Antrian</h3>
    <div style={{ width: "100%", height: "calc(100% - 40px)" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" stroke="#555" tick={{ fontSize: 10 }} />
          <YAxis stroke="#555" tick={{ fontSize: 10 }} />
          <Tooltip
            contentStyle={{ backgroundColor: "rgba(255,255,255,0.9)", border: "1px solid #ccc", borderRadius: "5px" }}
            labelStyle={{ fontWeight: "bold" }}
            formatter={(value) => [`${value} Antrian`, "Total"]}
          />
          <Bar dataKey="value" fill="#1f4b89" barSize={30} radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const Dashboard = ({ adminName, onLogout, pageTitle }) => {
  const { date, time } = useCurrentTime();
  const [totalAntrian, setTotalAntrian] = useState(0);
  const [antrianSelesai, setAntrianSelesai] = useState(0);
  const [chartData, setChartData] = useState([]);
  
  const navigate = useNavigate();
  // Jika admin bisa melihat halaman ini, berarti ada 1 loket yang aktif (yaitu dirinya sendiri).
  const totalLoket = 1; 

  useEffect(() => {
    // Listener untuk antrian yang sedang menunggu
    const qMenunggu = query(
      collection(db, "antrian"),
      where("status", "==", "menunggu")
    );
    const unsubscribeMenunggu = onSnapshot(qMenunggu, (snapshot) => {
      setTotalAntrian(snapshot.size);
    });

    // Listener untuk antrian yang sudah selesai
    const qSelesai = query(
      collection(db, "antrian"),
      where("status", "==", "selesai")
    );
    const unsubscribeSelesai = onSnapshot(qSelesai, (snapshot) => {
      setAntrianSelesai(snapshot.size);
    });

    // Listener untuk data chart bulan ini
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const qChart = query(
      collection(db, "riwayat"),
      where("waktuSelesai", ">=", startOfMonth),
      where("waktuSelesai", "<", endOfMonth)
    );

    const unsubscribeChart = onSnapshot(qChart, (snapshot) => {
      const counts = {};
      snapshot.forEach((doc) => {
        const kategori = doc.data().kategori;
        if (kategori) {
          counts[kategori] = (counts[kategori] || 0) + 1;
        }
      });

      const formattedData = Object.keys(counts).map(name => ({
        name,
        value: counts[name]
      }));

      setChartData(formattedData);
    });

    // Cleanup function untuk membersihkan listener saat komponen tidak lagi digunakan
    return () => {
      unsubscribeMenunggu();
      unsubscribeSelesai();
      unsubscribeChart();
    };
  }, []);

  const handleResetAntrian = async () => {
    const isConfirmed = window.confirm(
      "Apakah Anda yakin ingin mereset semua data antrian? Tindakan ini tidak dapat dibatalkan."
    );

    if (isConfirmed) {
      try {
        const antrianCollectionRef = collection(db, "antrian");
        const querySnapshot = await getDocs(antrianCollectionRef);
        
        const batch = writeBatch(db);
        querySnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        alert("Semua data antrian telah berhasil direset.");
      } catch (error) {
        console.error("Error saat mereset antrian: ", error);
        alert("Terjadi kesalahan saat mereset antrian.");
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1 flex flex-col overflow-auto p-4">
        <Header adminName={adminName} />

        <main className="p-1 pt-6">
          <div className="bg-white p-6 rounded-xl shadow-md h-full min-h-[calc(100vh-140px)]">
            
            {/* Bagian Atas: Nama Halaman kiri, Tanggal & Waktu kanan */}
            <div className="flex justify-between mb-6 items-center">
              {/* Nama halaman */}
              <h2 className="text-2xl font-bold text-gray-800">{pageTitle}</h2>

              {/* Card tanggal & waktu */}
              <div className="p-3 rounded-xl text-center border border-gray-200">
                <p className="text-sm font-medium text-gray-600 flex items-center justify-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{date}</span>
                </p>
                <p className="text-xl font-bold text-indigo-600 mt-1">{time}</p>
              </div>
            </div>

            {/* Grid konten */}
            <div className="grid grid-cols-12 gap-6">
              
              <div className="col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                <StatCard title="Total Antrian" value={totalAntrian} icon={History} bgColor="bg-yellow-100" iconColor="text-yellow-500" />
                <StatCard title="Total Loket" value={totalLoket} icon={Grid} bgColor="bg-blue-100" iconColor="text-blue-500" />
                <StatCard title="Antrian Selesai" value={antrianSelesai} icon={CheckCircle} bgColor="bg-green-100" iconColor="text-green-500" />
              </div>

              <div className="col-span-12 lg:col-span-7 h-[400px]">
                <CustomBarChart data={chartData} />
              </div>

              <div className="col-span-12 lg:col-span-5 space-y-6 flex flex-col h-[400px]">
                <button onClick={handleResetAntrian} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg flex flex-col items-center justify-center p-4 transition duration-200">
                  <RotateCcw className="w-10 h-10 mb-2" />
                  <span className="text-lg font-semibold">Reset Antrian</span>
                </button>
                <button onClick={() => navigate("/Display")} className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-lg flex flex-col items-center justify-center p-4 transition duration-200">
                  <List className="w-10 h-10 mb-2" />
                  <span className="text-lg font-semibold">Display Antrian</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
