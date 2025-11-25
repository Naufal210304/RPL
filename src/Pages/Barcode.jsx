import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, onSnapshot, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Loader2, Clock, Ticket, Users } from "lucide-react";

const BarcodePage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ambil parameter 'id' dari URL (misal: /barcode?id=xxxxx)
  const params = new URLSearchParams(window.location.search);
  const ticketId = params.get("id");

  useEffect(() => {
    if (!ticketId) {
      setError("ID tiket tidak ditemukan.");
      setLoading(false);
      return;
    }

    // Listener untuk data tiket spesifik ini
    const unsub = onSnapshot(doc(db, "antrian", ticketId), async (snap) => {
      if (snap.exists()) {
        const ticketData = snap.data();

        // Hitung sisa antrian yang statusnya "menunggu" dan dibuat sebelum tiket ini
        const q = query(
          collection(db, "antrian"),
          where("loket", "==", ticketData.loket),
          where("status", "==", "menunggu"),
          where("timestamp", "<", ticketData.timestamp)
        );

        const querySnapshot = await getDocs(q);
        const sisaAntrian = querySnapshot.size;

        setData({
          ...ticketData,
          id: snap.id,
          sisa: sisaAntrian
        });

        setError(null);
      } else {
        setError("Data tiket tidak ditemukan.");
        setData(null);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError("Terjadi kesalahan saat mengambil data.");
      setLoading(false);
    });

    return () => unsub();
  }, [ticketId]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        <Loader2 className="animate-spin mr-2" /> Loading...
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-screen text-red-600 text-center px-4">
        {error}
      </div>
    );

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen text-red-600 text-center px-4">
        Data tidak tersedia.
      </div>
    );
  }

  // Estimasi waktu panggilan (misal 1 antrian = 3 menit)
  const minutesPerTicket = 3;
  const estimasiDipanggil = data.sisa * minutesPerTicket;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-blue-900 text-white p-4 flex flex-col items-center">
      {/* Header */}
      <h1 className="text-xl font-semibold mb-4">Status Antrian Anda</h1>

      {/* Nomor Antrian */}
      <div className="bg-mint-200 p-6 rounded-2xl shadow mb-4 text-center">
        <Ticket className="mx-auto mb-2" />
        <p className="text-gray-700 text-sm">Nomor Anda</p>
        <h2 className="text-5xl font-bold text-gray-900">{data.nomor || "---"}</h2>
        <p className="mt-1 text-gray-600">Loket Tujuan: {data.loket}</p>
      </div>

      {/* Sisa antrian */}
      <div className="bg-gray-100 p-4 rounded-2xl shadow mb-4 text-center">
        <Users className="mx-auto mb-1" />
        <p className="text-gray-700 text-sm">Sisa Antrian</p>
        <h3 className="text-3xl font-bold text-red-600">{data.sisa}</h3>
      </div>

      {/* Estimasi waktu */}
      <div className="bg-gray-100 p-4 rounded-2xl shadow mb-4 text-center">
        <Clock className="mx-auto mb-1" />
        <p className="text-gray-700 text-sm">Estimasi Dipanggil</p>
        <h3 className="text-2xl font-semibold text-gray-900">
          {estimasiDipanggil} menit lagi
        </h3>
      </div>
    </div>
  );
};

export default BarcodePage;
