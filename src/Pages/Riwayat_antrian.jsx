import React, { useEffect, useState, useMemo } from "react";
import { Clock, ArrowDownAZ, Filter } from "lucide-react";
import Sidebar from "../Componnents/Sidebar";
import Header from "../Componnents/Header";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, writeBatch, doc, getDocs } from "firebase/firestore";

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

const RiwayatAntrian = ({ onLogout, pageTitle, notifications, addNotification }) => {
    const { date, time } = useCurrentTime();

    const adminName = localStorage.getItem("adminName") || "Admin";
    const [riwayatList, setRiwayatList] = useState([]);
    
    // State untuk filter dan sort
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [filterBy, setFilterBy] = useState("All"); // 'All', 'A', 'B', 'C'
    const [sortBy, setSortBy] = useState("waktuSelesai"); // 'waktuSelesai', 'nomor', 'namaNasabah'


    useEffect(() => {
        const q = query(
            collection(db, "riwayat"),
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const list = querySnapshot.docs.map(doc => ({
                ...doc.data(), // Ambil semua data asli dari dokumen
                id: doc.id, // Tambahkan ID dokumen
                // Buat properti baru untuk tampilan, jangan timpa yang asli
                waktuSelesaiFormatted: doc.data().waktuSelesai?.toDate().toLocaleString('id-ID') || 'N/A'
            }));
            setRiwayatList(list);
        });

        return () => unsubscribe();
    }, []);

    // Memoized list untuk tampilan yang sudah di-filter dan di-sort
    const displayList = useMemo(() => {
        let filtered = [...riwayatList];

        // 1. Filtering
        if (filterBy !== "All") {
            filtered = filtered.filter(item => item.nomor && item.nomor.startsWith(filterBy));
        }

        // 2. Sorting
        if (sortBy === "waktuSelesai") {
            // Tampilkan yang terbaru di atas
            filtered.sort((a, b) => b.waktuSelesai.seconds - a.waktuSelesai.seconds);
        } else if (sortBy === "nomor") {
            // Sort berdasarkan nomor antrian (A001, A002, B001, ...)
            filtered.sort((a, b) => a.nomor.localeCompare(b.nomor));
        } else if (sortBy === "namaNasabah") {
            // Sort berdasarkan nama nasabah (A-Z)
            filtered.sort((a, b) => a.namaNasabah.localeCompare(b.namaNasabah));
        }

        return filtered;

    }, [riwayatList, filterBy, sortBy]);

    const handleSimpanKeLaporan = async () => {
        if (riwayatList.length === 0) {
            alert("Tidak ada data riwayat untuk disimpan ke laporan.");
            return;
        }

        const isConfirmed = window.confirm(
            `Anda akan memindahkan ${riwayatList.length} data ke laporan. Data ini akan hilang dari halaman Riwayat Antrian. Lanjutkan?`
        );

        if (isConfirmed) {
            try {
                const batch = writeBatch(db);

                riwayatList.forEach((item) => {
                    // 1. Buat referensi untuk dokumen baru di koleksi 'laporan'
                    const laporanRef = doc(collection(db, "laporan"));
                    
                    // Buat salinan item tanpa properti 'waktuSelesaiFormatted'
                    const { waktuSelesaiFormatted, ...itemToSave } = item;
                    
                    batch.set(laporanRef, itemToSave); // Salin data bersih ke laporan
                    
                    // 2. Buat referensi untuk dokumen lama di koleksi 'riwayat' untuk dihapus
                    const riwayatRef = doc(db, "riwayat", item.id);
                    batch.delete(riwayatRef);
                });

                await batch.commit();
                addNotification(`${riwayatList.length} data riwayat berhasil dipindahkan ke laporan.`);
            } catch (error) {
                console.error("Error saat menyimpan ke laporan:", error);
                alert("Terjadi kesalahan saat menyimpan data.");
            }
        }
    };
    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar onLogout={onLogout} />

            {/* KONTEN UTAMA */}
            <div className="flex-1 flex flex-col overflow-auto p-4">

                {/* HEADER */}
                <Header adminName={adminName} notifications={notifications} date={date} time={time} />

                {/* WRAPPER HALAMAN */}
                <div className="bg-white p-6 rounded-xl shadow-md min-h-[calc(100vh-140px)]">

                    {/* Tombol Filter & Sort */}
                    <div className="relative flex items-center gap-3 mb-4">
                        {/* Filter Button & Menu */}
                        <div className="relative">
                            <button onClick={() => setShowFilterMenu(!showFilterMenu)} className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg border">
                                <Filter className="w-4 h-4" />
                                <span>Filter: {filterBy === 'All' ? 'Semua' : `Loket ${filterBy}`}</span>
                            </button>
                            {showFilterMenu && (
                                <div className="absolute top-full mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
                                    <a onClick={() => { setFilterBy('All'); setShowFilterMenu(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Semua</a>
                                    <a onClick={() => { setFilterBy('A'); setShowFilterMenu(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Teller (A)</a>
                                    <a onClick={() => { setFilterBy('B'); setShowFilterMenu(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">VIP (B)</a>
                                    <a onClick={() => { setFilterBy('C'); setShowFilterMenu(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Customer Service (C)</a>
                                </div>
                            )}
                        </div>

                        {/* Sort Button & Menu */}
                        <div className="relative">
                            <button onClick={() => setShowSortMenu(!showSortMenu)} className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg border">
                                <ArrowDownAZ className="w-4 h-4" />
                                <span>Urutkan</span>
                            </button>
                            {showSortMenu && (
                                <div className="absolute top-full mt-2 w-56 bg-white border rounded-lg shadow-lg z-10">
                                    <a onClick={() => { setSortBy('waktuSelesai'); setShowSortMenu(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Waktu Selesai (Terbaru)</a>
                                    <a onClick={() => { setSortBy('nomor'); setShowSortMenu(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Nomor Antrian (A-Z)</a>
                                    <a onClick={() => { setSortBy('namaNasabah'); setShowSortMenu(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Nama Nasabah (A-Z)</a>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="col-span-12 lg:col-span-8">
                        <div className="max-h-[60vh] overflow-y-auto rounded-xl shadow-md border border-gray-200">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-100 sticky top-0">
                                    <tr>
                                        <th className="p-3">Nomor Antrian</th>
                                        <th className="p-3">Nama Nasabah</th>
                                        <th className="p-3">Loket</th>
                                        <th className="p-3">Keterangan</th>
                                        <th className="p-3">Waktu Selesai</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayList.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center p-6 text-gray-500">
                                                Tidak ada data riwayat yang cocok dengan filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        displayList.map((item) => (
                                        <tr key={item.id} className="border-t hover:bg-gray-50">
                                            <td className="p-3 font-semibold">{item.nomor}</td>
                                            <td className="p-3">{item.namaNasabah}</td>
                                            <td className="p-3">{item.loket}</td>
                                            <td className="p-3">{item.keterangan || "-"}</td>
                                            <td className="p-3">{item.waktuSelesaiFormatted}</td>
                                        </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Tombol Simpan di Bawah Tabel */}
                    <div className="w-full flex justify-end mt-4">
                        <button
                            onClick={handleSimpanKeLaporan}
                            className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md transition disabled:bg-gray-400" disabled={riwayatList.length === 0}>
                            Simpan ke Laporan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RiwayatAntrian