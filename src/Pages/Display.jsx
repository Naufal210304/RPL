import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, onSnapshot, collection, query } from "firebase/firestore";

// Komponen Kartu Loket yang bisa digunakan kembali
const LoketCard = ({ title, number, className = "" }) => (
  <div className={`bg-[#6b8c74] rounded-xl shadow-xl text-white flex flex-col ${className}`}>
    <div className="text-center py-3 text-xl font-semibold border-b border-white/20">
      {title}
    </div>
    <div className="flex-1 flex items-center justify-center">
      <p className="text-8xl font-bold tracking-wider">{number}</p>
    </div>
  </div>
);

const Display = () => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  
  const [settings, setSettings] = useState({
    outletName: "Bank DPR",
    runningText: "Selamat datang...",
    videoUrl: "",
  });

  // State untuk menampung data panggilan dari semua loket
  const [servingData, setServingData] = useState({
    admin_teller_1: { nomor: "-", loket: "Admin Teller 1" },
    admin_teller_2: { nomor: "-", loket: "Admin Teller 2" },
    admin_vip: { nomor: "-", loket: "Admin VIP" },
    admin_customer_service: { nomor: "-", loket: "Admin Customere Service" },
  });
  // ====== Update Real-time Clock ======
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      const d = now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).replace(",", " -");

      const t = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      setDate(d);
      setTime(t);
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // ====== Listener untuk data panggilan dari Firebase ======
  useEffect(() => {
    // Listener untuk suara (tetap menggunakan now_serving)
    const soundUnsubscribe = onSnapshot(doc(db, "display", "now_serving"), (docSnap) => {
      if (docSnap.exists()) {
        const newData = docSnap.data();
        const utterance = new SpeechSynthesisUtterance(`Nomor antrian, ${newData.nomor}, menuju ke, ${newData.loket}`);
        utterance.lang = 'id-ID';
        window.speechSynthesis.speak(utterance);
      }
    });

    // Listener untuk data tampilan per loket
    const q = query(collection(db, "display"));
    const displayUnsubscribe = onSnapshot(q, (querySnapshot) => {
      querySnapshot.forEach((doc) => {
        // Jangan proses 'now_serving' di sini
        if (doc.id === "now_serving" || doc.id === "main") return;

        setServingData(prevData => ({
          ...prevData,
          [doc.id]: doc.data()
        }));
      });
    });
    return () => {
      soundUnsubscribe();
      displayUnsubscribe();
    };
  }, []);

  // ====== Listener untuk data pengaturan dari Firebase ======
  useEffect(() => {
    const settingsRef = doc(db, "settings", "main");
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, []);


  return (
    <div className="w-full h-screen bg-[#dfe7e0] flex flex-col">

      {/* ================= HEADER ================= */}
      <div className="w-full flex justify-between items-center px-12 py-3 bg-[#607c6e] text-white">
        <div>
          <h1 className="text-2xl font-extrabold">{settings.outletName}</h1>
          <p className="text-lg -mt-1">KCP Pamsky</p>
        </div>

        <div className="text-right">
          <p className="text-xl font-semibold">{date}</p>
          <p className="text-2xl font-bold mt-1">{time}</p>
        </div>
      </div>

      {/* ================= KONTEN UTAMA ================= */}
      {/* Wrapper ini akan menangani scroll di layar kecil dan fit di layar besar */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="w-full h-full grid grid-cols-3 grid-rows-2 gap-6">

          {/* BARIS ATAS */}
          <LoketCard title="Teller 1" number={servingData.admin_teller_1.nomor} />

          {/* Video Card (lebih besar) */}
          <div className="col-span-2 rounded-xl overflow-hidden shadow-xl bg-black">
            {!settings.videoUrl ? (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white">Tidak ada video yang disetel.</div>
            ) : settings.videoUrl.includes("youtube.com/embed") ? (
              <iframe
                className="w-full h-full"
                src={`${settings.videoUrl}?autoplay=1&mute=1&loop=1&playlist=${settings.videoUrl.split('/').pop()}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <video className="w-full h-full object-cover" src={settings.videoUrl} autoPlay loop muted></video>
            )}
          </div>

          {/* BARIS BAWAH */}
          <LoketCard title="Teller 2" number={servingData.admin_teller_2.nomor} />
          <LoketCard title="VIP" number={servingData.admin_vip.nomor} />
          <LoketCard title="Customer Service" number={servingData.admin_customer_service.nomor} />
        </div>
      </div>

      {/* ================= RUNNING TEXT ================= */}
      <div className="w-full bg-[#607c6e] py-3 relative overflow-x-hidden">
        <div className="absolute whitespace-nowrap animate-marquee flex">
          <p className="text-white font-medium text-lg tracking-wide inline-block">{settings.runningText}</p>
          <p className="text-white font-medium text-lg tracking-wide inline-block pl-16">{settings.runningText}</p> {/* Duplikat untuk loop mulus */}
        </div>
      </div>
    </div>
  );
};

export default Display;
