import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import DaftarAntrian from "./Pages/Daftar_antrian";
import RiwayatAntrian from "./Pages/Riwayat_antrian";
import Pengaturan from "./Pages/Pengaturan";
import Laporan from "./Pages/Laporan";
import Loader from "./Componnents/Loader";
import Display from "./Pages/Display";

// Import untuk tes Firebase
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

// ==============================
// WRAPPER LOADER PER PINDAH HALAMAN
// ==============================
const PageWrapper = ({ children }) => {
  const location = useLocation();
  const [firstLoad, setFirstLoad] = useState(true);
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    if (firstLoad) {
      setFirstLoad(false);
      return;
    }

    setShowLoader(true);
    const timer = setTimeout(() => setShowLoader(false), 400);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      {showLoader && (
        <div className="fixed inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-[99999]">
          <Loader />
        </div>
      )}

      {children}
    </>
  );
};

// ==============================
// MAIN APP
// ==============================
const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("loggedIn") === "true"
  );
  const [adminName, setAdminName] = useState(
    localStorage.getItem("adminName") || ""
  );
  const [notifications, setNotifications] = useState([]);

  // Fungsi untuk menambah notifikasi baru
  const addNotification = (message) => {
    const newNotification = { id: Date.now(), message, time: new Date() };
    setNotifications(prev => [newNotification, ...prev].slice(0, 10)); // Simpan 10 notifikasi terakhir
  };

  const handleLoginSuccess = (name) => {
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("adminName", name);

    setAdminName(name);
    setIsLoggedIn(true);
    addNotification(`Admin ${name} telah login.`);
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("adminName");

    setIsLoggedIn(false);
    setAdminName("");
  };

  // ==============================
  // TES KONEKSI FIREBASE (Hanya berjalan sekali saat aplikasi dimuat)
  // ==============================
  useEffect(() => {
    const testFirebaseConnection = async () => {
      try {
        // Ganti "nama_koleksi_anda" dengan nama koleksi yang sudah ada di Firestore Anda
        const querySnapshot = await getDocs(collection(db, "nama_koleksi_anda"));
        console.log("✅ Koneksi Firebase Berhasil! Data yang ditemukan:", querySnapshot.docs.length, "dokumen.");
        querySnapshot.forEach((doc) => {
          console.log(`${doc.id} =>`, doc.data());
        });
      } catch (error) {
        console.error("❌ Gagal terhubung ke Firebase:", error);
      }
    };
    testFirebaseConnection();
  }, []);

  return (
    <Router>
      {/* PageWrapper HARUS di dalam Router */}
      <PageWrapper>
        <Routes>
          {/* Login */}
          <Route
            path="/"
            element={
              isLoggedIn ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login onLoginSuccess={handleLoginSuccess} />
              )
            }
          />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              isLoggedIn ? (
                <Dashboard
                  adminName={adminName}
                  onLogout={handleLogout}
                  pageTitle="Dashboard"
                  notifications={notifications}
                  addNotification={addNotification}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* Daftar Antrian */}
          <Route
            path="/daftar-antrian"
            element={
              isLoggedIn ? (
                <DaftarAntrian
                  adminName={adminName}
                  onLogout={handleLogout}
                  pageTitle="Daftar Antrian"
                  notifications={notifications}
                  addNotification={addNotification}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* RIWAYAT */}
          <Route
            path="/riwayat-antrian"
            element={
              isLoggedIn ? (
                <RiwayatAntrian
                  adminName={adminName}
                  onLogout={handleLogout}
                  pageTitle="Riwayat Antrian"
                  notifications={notifications}
                  addNotification={addNotification}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* LAPORAN */}
          <Route
            path="/laporan"
            element={
              isLoggedIn ? (
                <Laporan
                  adminName={adminName}
                  onLogout={handleLogout}
                  pageTitle="Laporan"
                  notifications={notifications}
                  addNotification={addNotification}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* PENGATURAN */}
          <Route
            path="/pengaturan"
            element={
              isLoggedIn ? (
                <Pengaturan
                  adminName={adminName}
                  onLogout={handleLogout}
                  pageTitle="Pengaturan"
                  notifications={notifications}
                  addNotification={addNotification}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          {/* DISPLAY */}
          <Route
            path="/Display"
            element={
              isLoggedIn ? (
                <Display
                  onLogout={handleLogout}
                  pageTitle="Pengaturan"
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Routes>
      </PageWrapper>
    </Router>
  );
};

export default App;
