import React from "react";
import { X, Ticket } from "lucide-react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import jsPDF from "jspdf";
import QRCode from "qrcode";
const TicketModal = ({ onClose, onTicketGenerated }) => {
  const services = [
    { name: "Teller", code: "A" },
    { name: "VIP", code: "B" },
    { name: "Customer Service", code: "C" }
  ];

  // ===============================
  //  FUNGSI UNTUK MEMBUAT PDF TIKET
  // ===============================
  const generatePDF = async (nomor, serviceName, ticketId) => {
    const doc = new jsPDF();

    // URL unik untuk QR Code, mengarah ke halaman Barcode dengan ID tiket
    const url = `${window.location.origin}/barcode?id=${ticketId}`;
    const qrImage = await QRCode.toDataURL(url);

    // Header
    doc.setFontSize(20);
    doc.text("Nomor Antrian Anda", 20, 20);

    // Nomor antrian besar
    doc.setFontSize(50);
    doc.text(nomor, 20, 60);

    // Nama layanan
    doc.setFontSize(16);
    doc.text(`Layanan: ${serviceName}`, 20, 75);

    // Tanggal & waktu
    const now = new Date().toLocaleString("id-ID");
    doc.setFontSize(12);
    doc.text(`Dicetak pada: ${now}`, 20, 90);
    doc.text("Silakan scan QR Code untuk melihat status antrian Anda.", 20, 100);

    // QR Code
    doc.addImage(qrImage, "PNG", 20, 110, 70, 70);

    // Simpan PDF (otomatis download)
    doc.save(`Tiket-${nomor}.pdf`);
  };

  // =====================================
  //  HANDLE GENERATE NOMOR ANTRIAN
  // =====================================
  const handleAmbilNomor = async (loket) => {
    // Tampilkan notifikasi loading (opsional, tapi pengalaman pengguna lebih baik)
    onTicketGenerated("loading");

    // 1. Buat query untuk mencari nomor terakhir berdasarkan loket dan timestamp
    const q = query(
      collection(db, "antrian"),
      where("loket", "==", loket),
      orderBy("timestamp", "desc"),
      limit(1)
    );
    
    // 2. Eksekusi query
    const snapshot = await getDocs(q);

    // 3. Tentukan nomor terakhir, defaultnya 0 jika tidak ada data
    let lastNumber = 0;
    if (!snapshot.empty) {
      const lastDoc = snapshot.docs[0].data();
      // Ambil angka dari nomor (misal: dari "A001" menjadi 1)
      lastNumber = parseInt(lastDoc.nomor.slice(1), 10);
    }

    // 4. Hitung nomor berikutnya dan format (misal: 1 -> "A001")
    const nextNumber = lastNumber + 1;
    const nomor = loket + String(nextNumber).padStart(3, "0");

    // 5. Simpan dokumen baru ke Firestore dan DAPATKAN REFERENSINYA
    const docRef = await addDoc(collection(db, "antrian"), {
      loket,
      nomor,
      status: "menunggu", // Status awal saat tiket dibuat
      timestamp: serverTimestamp()
    });

    // 6. Dapatkan nama layanan untuk PDF
    const serviceName = services.find(s => s.code === loket)?.name || "Layanan";

    // 7. Generate PDF dengan nomor antrian dan ID DOKUMEN unik
    await generatePDF(nomor, serviceName, docRef.id);

    // 8. Beri tahu komponen induk bahwa tiket telah dibuat
    onTicketGenerated(nomor);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transition-all duration-300">
        <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-sky-50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
            <Ticket className="w-6 h-6 text-sky-600" />
            <span>Ambil Nomor Antrian</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-gray-600">
            Silakan pilih layanan yang Anda butuhkan untuk mendapatkan nomor antrian.
          </p>

          <ul className="space-y-3">
            {services.map((service, index) => (
              <li
                key={index}
                className="flex justify-between items-center p-3 border border-sky-200 rounded-lg hover:bg-sky-50 transition"
              >
                <span className="font-medium text-gray-700">{service.name}</span>
                <button
                  onClick={() => handleAmbilNomor(service.code)}
                  className="text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 py-1 px-3 rounded-full transition"
                >
                  Dapatkan Nomor
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TicketModal;
