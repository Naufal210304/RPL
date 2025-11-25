import React, { useEffect, useState, useMemo } from "react";
import { Clock, ArrowDownAZ, Filter } from "lucide-react";
import Sidebar from "../Componnents/Sidebar";
import Header from "../Componnents/Header";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import * as XLSX from 'xlsx'; // Import library xlsx

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

const Laporan = ({ onLogout, pageTitle, notifications, addNotification }) => {
    const { date, time } = useCurrentTime();
    const adminName = localStorage.getItem("adminName") || "Admin";
    const [laporanList, setLaporanList] = useState([]);

    // State untuk filter dan sort
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [sortBy, setSortBy] = useState("waktuSelesai"); // 'waktuSelesai', 'nomor', 'namaNasabah', 'kategori'
    const [activeFilters, setActiveFilters] = useState({ month: "", year: "" });


    useEffect(() => {
        const q = query(
            collection(db, "laporan"),
            orderBy("waktuSelesai", "desc")
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const list = querySnapshot.docs.map(doc => ({
                ...doc.data(), // Ambil semua data asli
                id: doc.id,
                waktuSelesaiFormatted: doc.data().waktuSelesai?.toDate().toLocaleString('id-ID') || 'N/A' // Buat properti baru untuk tampilan
            }));
            setLaporanList(list);
        });

        return () => unsubscribe();
    }, []);

    // Memoized list untuk tampilan yang sudah di-filter dan di-sort
    const displayList = useMemo(() => {
        let filtered = [...laporanList];

        // 1. Filtering berdasarkan bulan dan tahun
        if (activeFilters.year) {
            filtered = filtered.filter(item => {
                const itemYear = item.waktuSelesai?.toDate().getFullYear();
                return itemYear === parseInt(activeFilters.year);
            });
        }
        if (activeFilters.month) {
            filtered = filtered.filter(item => {
                const itemMonth = item.waktuSelesai?.toDate().getMonth() + 1; // getMonth() is 0-indexed
                return itemMonth === parseInt(activeFilters.month);
            });
        }

        // 2. Sorting
        if (sortBy === "waktuSelesai") {
            filtered.sort((a, b) => (b.waktuSelesai?.seconds || 0) - (a.waktuSelesai?.seconds || 0));
        } else if (sortBy === "nomor") {
            filtered.sort((a, b) => (a.nomor || "").localeCompare(b.nomor || ""));
        } else if (sortBy === "namaNasabah") {
            filtered.sort((a, b) => (a.namaNasabah || "").localeCompare(b.namaNasabah || ""));
        } else if (sortBy === "kategori") {
            filtered.sort((a, b) => (a.kategori || "").localeCompare(b.kategori || ""));
        }

        return filtered;

    }, [laporanList, activeFilters, sortBy]);


    // STATE MODAL FILTER
    const [showFilter, setShowFilter] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(activeFilters.month);
    const [selectedYear, setSelectedYear] = useState(activeFilters.year);

    // Generate tahun (5 tahun ke belakang)
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
        years.push(currentYear - i);
    }

    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const applyFilter = () => {
        setActiveFilters({ month: selectedMonth, year: selectedYear });
        setShowFilter(false);
    };

    const resetFilter = () => {
        setSelectedMonth("");
        setSelectedYear("");
        setActiveFilters({ month: "", year: "" });
        setShowFilter(false);
    };

    const handleCetakLaporan = () => {
        if (displayList.length === 0) {
            addNotification("Tidak ada data untuk dicetak.");
            alert("Tidak ada data untuk dicetak.");
            return;
        }

        // Siapkan data untuk Excel (hanya kolom yang relevan)
        const dataToExport = displayList.map(item => ({
            "Nomor Antrian": item.nomor,
            "Nama Nasabah": item.namaNasabah,
            "Loket": item.loket,
            "Kategori": item.kategori,
            "Keterangan": item.keterangan || "-",
            "Waktu Selesai": item.waktuSelesaiFormatted,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Antrian");
        XLSX.writeFile(workbook, "Laporan_Antrian.xlsx");
        addNotification("Laporan berhasil diekspor ke Excel.");
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar onLogout={onLogout} />

            <div className="flex-1 flex flex-col overflow-auto p-4">
                <Header adminName={adminName} notifications={notifications} date={date} time={time} />

                <div className="bg-white p-6 rounded-xl shadow-md mt-6 min-h-[calc(100vh-140px)]">

                    {/* SORT & FILTER */}
                    <div className="flex gap-3 mb-4">
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
                                    <a onClick={() => { setSortBy('kategori'); setShowSortMenu(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Kategori (A-Z)</a>
                                </div>
                            )}
                        </div>

                        {/* Filter Button */}
                        <button 
                            onClick={() => setShowFilter(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg border"
                        >
                            <Filter className="w-4 h-4" />
                            <span>Filter</span>
                        </button>
                    </div>

                    {/* TABLE */}
                    <div className="col-span-12 lg:col-span-8">
                        <div className="max-h-[60vh] overflow-y-auto rounded-xl shadow-md border border-gray-200">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-100 sticky top-0">
                                    <tr>
                                        <th className="p-3">Nomor Antrian</th>
                                        <th className="p-3">Nama Nasabah</th>
                                        <th className="p-3">Loket</th>
                                        <th className="p-3">Kategori</th>
                                        <th className="p-3">Keterangan</th>
                                        <th className="p-3">Waktu Selesai</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayList.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center p-6 text-gray-500">
                                                {laporanList.length > 0 ? "Tidak ada data laporan yang cocok dengan filter." : "Tidak ada data laporan."}
                                            </td>
                                        </tr>
                                    ) : (
                                        displayList.map((item) => (
                                            <tr key={item.id} className="border-t hover:bg-gray-50">
                                                <td className="p-3 font-semibold">{item.nomor}</td>
                                                <td className="p-3">{item.namaNasabah}</td>
                                                <td className="p-3">{item.loket}</td>
                                                <td className="p-3 font-semibold text-blue-600">{item.kategori}</td>
                                                <td className="p-3">{item.keterangan || "-"}</td>
                                                <td className="p-3">{item.waktuSelesaiFormatted}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="w-full flex justify-end mt-3">
                        <button onClick={handleCetakLaporan} className="p-2 px-4 rounded-lg bg-lime-600 text-white hover:bg-lime-700 transition font-semibold">
                            Cetak
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL FILTER */}
            {showFilter && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white w-96 p-6 rounded-xl shadow-lg">
                        <h3 className="text-lg font-bold mb-4">Filter Laporan</h3>

                        {/* PILIH BULAN */}
                        <label className="block mb-2 text-sm font-medium">Bulan</label>
                        <select
                            className="w-full border p-2 rounded-lg mb-4"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                            <option value="">Pilih Bulan</option>
                            {months.map((month, index) => (
                                <option value={index + 1} key={index}>{month}</option>
                            ))}
                        </select>

                        {/* PILIH TAHUN */}
                        <label className="block mb-2 text-sm font-medium">Tahun</label>
                        <select
                            className="w-full border p-2 rounded-lg mb-4"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                        >
                            <option value="">Pilih Tahun</option>
                            {years.map((year) => (
                                <option value={year} key={year}>{year}</option>
                            ))}
                        </select>

                        {/* BUTTON ACTION */}
                        <div className="flex justify-end gap-3">
                            <button
                                className="px-4 py-2 bg-gray-200 rounded-lg"
                                onClick={() => setShowFilter(false)}
                            >
                                Batal
                            </button>
                            <button
                                className="px-4 py-2 bg-red-500 text-white rounded-lg"
                                onClick={resetFilter}
                            >
                                Hapus Filter
                            </button>

                            <button
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                                onClick={applyFilter}
                            >
                                Terapkan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Laporan;
