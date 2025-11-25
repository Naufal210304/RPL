import React, { useEffect, useState, useCallback } from "react";
import { Clock, X } from "lucide-react";
import Sidebar from "../Componnents/Sidebar";
import Header from "../Componnents/Header";
import { db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, setDoc, addDoc, serverTimestamp, deleteDoc, limit, getDocs } from "firebase/firestore";

const useCurrentTime = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const date = currentTime
        .toLocaleDateString("id-ID", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        })
        .replace(",", " -");

    const time = currentTime.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });

    return { date, time };
};

const DaftarAntrian = ({ onLogout, pageTitle, notifications, addNotification }) => {
    const { date, time } = useCurrentTime();

    const adminName = localStorage.getItem("adminName") || "Admin";

    // State untuk menampung data antrian dari Firebase
    const [antrianList, setAntrianList] = useState([]);
    const [currentQueue, setCurrentQueue] = useState("-");
    const [currentTicketId, setCurrentTicketId] = useState(null);
    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
    const [formData, setFormData] = useState({ namaNasabah: "", keterangan: "", kategori: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Objek untuk memetakan kode loket ke nama layanan
    const serviceMap = {
        A: "Teller",
        B: "VIP",
        C: "Customer Service"
    };

    // Kategori untuk form penyelesaian, diambil dari dashboard
    const kategoriLayanan = [
        "Card",
        "Aplikasi",
        "Setor",
        "Deposito",
        "Pinjaman"
    ];

    // Helper untuk mendapatkan kode antrian berdasarkan nama admin
    const getQueueCodeForAdmin = (name) => {
        if (name.includes("Teller")) return "A";
        if (name.includes("VIP")) return "B";
        if (name.includes("Customer")) return "C";
        return null; // Jika admin tidak cocok (seharusnya tidak terjadi)
    };

    // Mengambil data antrian secara real-time
    useEffect(() => {
        const queueCode = getQueueCodeForAdmin(adminName);
        if (!queueCode) return; // Jangan fetch data jika peran admin tidak jelas

        const q = query(
            collection(db, "antrian"),
            where("status", "==", "menunggu"),
            where("loket", "==", queueCode), // Filter berdasarkan kode loket
            orderBy("timestamp", "asc")
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAntrianList(list);
        });

        // Membersihkan listener saat komponen di-unmount
        return () => unsubscribe();
    }, [adminName]);

    // === TRIGGER TOMBOL ===
    const handleCall = useCallback(async () => {        
        try {
            const queueCode = getQueueCodeForAdmin(adminName);
            if (!queueCode) {
                alert("Peran admin tidak dikenali untuk memanggil antrian.");
                return;
            }

            // 1. Ambil antrian teratas langsung dari Firestore
            const q = query(
                collection(db, "antrian"),
                where("status", "==", "menunggu"),
                where("loket", "==", queueCode), // Filter antrian yang akan dipanggil
                orderBy("timestamp", "asc"),
                limit(1)
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                alert("Tidak ada antrian lagi untuk dipanggil.");
                return;
            }

            const nextTicketDoc = querySnapshot.docs[0];
            const nextTicketId = nextTicketDoc.id;
            const nextQueueNumber = nextTicketDoc.data().nomor;

            // 2. Set antrian yang dipanggil ke state
            setCurrentQueue(nextQueueNumber);
            setCurrentTicketId(nextTicketId);

            // 1. Update status antrian yang dipanggil menjadi "dipanggil"
            const ticketRef = doc(db, "antrian", nextTicketId);
            await updateDoc(ticketRef, { status: "dipanggil" });

            // 2. Tentukan ID dokumen display berdasarkan nama admin
            const adminNameToId = (name) => {
                return name.toLowerCase().replace(/ /g, '_');
            };
            const displayDocId = adminNameToId(adminName);

            // 3. Update dokumen di koleksi 'display' untuk loket spesifik ini
            const displayRef = doc(db, "display", displayDocId);
            await setDoc(displayRef, {
                nomor: nextQueueNumber,
                loket: adminName, // Tetap simpan nama lengkap untuk tampilan
                timestamp: new Date(), // Waktu pemanggilan
            });

            // Juga update 'now_serving' untuk kompatibilitas dengan suara panggilan
            await setDoc(doc(db, "display", "now_serving"), { nomor: nextQueueNumber, loket: adminName, timestamp: new Date() });

            addNotification(`Nomor ${nextQueueNumber} telah dipanggil.`);

        } catch (error) {
            console.error("Error saat memanggil nomor:", error);
            alert("Gagal memanggil nomor. Silakan coba lagi.");
        }
    }, [adminName]); // adminName ditambahkan sebagai dependensi

    const handleRecall = useCallback(() => {
        if (currentQueue === "-") {
            alert("Belum ada nomor yang dipanggil.");
            return;
        }
        addNotification(`Nomor ${currentQueue} dipanggil ulang.`);
    }, [currentQueue]);

    const handleFinish = async () => {
        if (!currentTicketId) {
            alert("Tidak ada antrian untuk diselesaikan.");
            return;
        }
        setIsFinishModalOpen(true);
    };

    const handleFinishSubmit = async (e) => {
        e.preventDefault();
        if (!formData.namaNasabah) {
            alert("Nama nasabah tidak boleh kosong.");
            return;
        }
        if (!formData.kategori) {
            alert("Kategori layanan harus dipilih.");
            return;
        }
        setIsSubmitting(true);

        try {
            // 1. Simpan data ke koleksi 'riwayat'
            await addDoc(collection(db, "riwayat"), {
                nomor: currentQueue,
                loket: adminName, // Nama admin yang melayani
                namaNasabah: formData.namaNasabah,
                keterangan: formData.keterangan,
                kategori: formData.kategori,
                waktuSelesai: serverTimestamp()
            });

            // 2. Update status antrian di koleksi 'antrian' menjadi "selesai"
            const ticketRef = doc(db, "antrian", currentTicketId);
            await updateDoc(ticketRef, { status: "selesai" });

            // 3. Reset form dan tutup modal
            addNotification(`Antrian ${currentQueue} telah selesai.`);
            setIsFinishModalOpen(false);
            setFormData({ namaNasabah: "", keterangan: "", kategori: "" });
            
            // Kosongkan kembali kartu nomor antrian saat ini
            setCurrentQueue("-");
            setCurrentTicketId(null);

        } catch (error) {
            console.error("Error saat menyelesaikan antrian:", error);
            alert("Gagal menyelesaikan antrian.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleClose = async () => {
        if (!currentTicketId) {
            alert("Tidak ada antrian untuk ditutup.");
            return;
        }

        const isConfirmed = window.confirm(
            `Apakah Anda yakin ingin menutup/menghapus antrian nomor ${currentQueue}? Tindakan ini tidak dapat dibatalkan.`
        );

        if (isConfirmed) {
            try {
                const ticketRef = doc(db, "antrian", currentTicketId);
                await deleteDoc(ticketRef);
                addNotification(`Antrian ${currentQueue} telah ditutup.`);
                
                // Kosongkan kembali kartu nomor antrian saat ini setelah ditutup
                setCurrentQueue("-");
                setCurrentTicketId(null);
            } catch (error) {
                console.error("Error saat menutup antrian:", error);
                alert("Gagal menutup antrian. Silakan coba lagi.");
            }
        }
    };

    // Trigger Enter & F9
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Enter") handleCall();
            if (e.key === "F9") handleRecall();
        };
        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleCall, handleRecall]);

    return (
        <div className="flex h-screen bg-gray-100">
            {isFinishModalOpen && (
                <FinishModal
                    currentQueue={currentQueue}
                    formData={formData}
                    isSubmitting={isSubmitting}
                    onClose={() => setIsFinishModalOpen(false)}
                    onSubmit={handleFinishSubmit}
                    onChange={handleFormChange}
                    kategoriLayanan={kategoriLayanan}
                />
                
            )}

            {/* SIDEBAR */}
            <Sidebar onLogout={onLogout} />

            {/* KONTEN UTAMA */}
            <div className="flex-1 flex flex-col overflow-auto p-4">

                {/* HEADER */}
                <Header adminName={adminName} notifications={notifications} date={date} time={time} />

                {/* WRAPPER HALAMAN */}
                <div className="bg-white p-6 rounded-xl shadow-md min-h-[calc(100vh-140px)]">

                    {/* === GRID KONTEN === */}
                    <div className="grid grid-cols-12 gap-6">

                        {/* TABEL KIRI */}
                        <div className="col-span-12 lg:col-span-8">
                            <div className="max-h-80 overflow-y-auto overflow-auto rounded-xl shadow-md border border-gray-200">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-3">Nomor</th>
                                            <th className="p-3">Nomor Antrian</th>
                                            <th className="p-3">Tujuan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {antrianList.map((row, i) => (
                                            <tr key={i} className="border-t hover:bg-gray-50">
                                                <td className="p-3 w-16">{i + 1}</td>
                                                <td className="p-3 font-semibold">{row.nomor}</td>
                                                <td className="p-3">{serviceMap[row.loket] || row.loket}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* KARTU KANAN */}
                        <div className="col-span-12 lg:col-span-4 space-y-6 flex flex-col">
                            {/* Card kecil nomor antrian */}
                            <div className="bg-white rounded-xl shadow-md border p-6 text-center">
                                <p className="text-sm font-medium text-gray-500">Nomor Antrian Saat Ini</p>
                                <p className="text-4xl font-bold text-indigo-600 mt-2">{currentQueue}</p>
                            </div>

                            {/* Tombol */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="w-full flex justify-evenly">
                                    <button
                                        onClick={handleFinish}
                                        className="w-32 bg-green-600 hover:bg-green-700 text-white rounded-xl py-2 text-lg shadow-md transition"
                                    >
                                        Selesai
                                    </button>

                                    <button
                                        onClick={handleClose}
                                        className="w-32 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2 text-lg shadow-md transition"
                                    >
                                        Tutup
                                    </button>
                                </div>
                                <button
                                    onClick={handleCall}
                                    className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl py-2 text-lg shadow-md transition"
                                >
                                    Panggil Nomor (Enter)
                                </button>

                                <button
                                    onClick={handleRecall}
                                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl py-2 text-lg shadow-md transition"
                                >
                                    Panggil Ulang (F9)
                                </button>
                            </div>
                        </div>

                    </div>

                </div>
            </div>

        </div>
    );
};

// Komponen Modal dipindahkan ke luar DaftarAntrian
const FinishModal = ({
    currentQueue,
    formData,
    isSubmitting,
    onClose,
    onSubmit,
    onChange,
    kategoriLayanan,
}) => (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b">
                <h3 className="text-lg font-bold text-gray-800">Selesaikan Antrian Nomor {currentQueue}</h3>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            <form onSubmit={onSubmit} className="p-6 space-y-4">
                <div>
                    <label htmlFor="namaNasabah" className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Nasabah <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="namaNasabah"
                        name="namaNasabah"
                        value={formData.namaNasabah}
                        onChange={onChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="kategori" className="block text-sm font-medium text-gray-700 mb-1">
                        Kategori Layanan <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="kategori"
                        name="kategori"
                        value={formData.kategori}
                        onChange={onChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        required
                    >
                        <option value="" disabled>-- Pilih Kategori --</option>
                        {kategoriLayanan.map(kat => (
                            <option key={kat} value={kat}>{kat}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="keterangan" className="block text-sm font-medium text-gray-700 mb-1">
                        Keterangan (Opsional)
                    </label>
                    <textarea
                        id="keterangan"
                        name="keterangan"
                        value={formData.keterangan}
                        onChange={onChange}
                        rows="3"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    ></textarea>
                </div>
                <div className="flex justify-end pt-2">
                    <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition disabled:bg-gray-400">
                        {isSubmitting ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            </form>
        </div>
    </div>
);

export default DaftarAntrian;
