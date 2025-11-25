import React, { useState, useEffect } from "react";
import { Clock, Eye, Store, Edit, Video, Volume2, Save } from "lucide-react";
import Sidebar from "../Componnents/Sidebar";
import Header from "../Componnents/Header";
import { useNavigate } from "react-router-dom";
import { db, storage } from "../firebase"; // Import storage
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Import fungsi storage

const Pengaturan = ({ onLogout, pageTitle }) => {
    // === REALTIME CLOCK (SAMA DENGAN DAFARANTRIAN!) ===
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

    const adminName = localStorage.getItem("adminName") || "Admin";
    const navigate = useNavigate();

    const [settings, setSettings] = useState({
        outletName: "Memuat...",
        runningText: "Memuat...",
        videoUrl: "",
        audioUrl: "",
    });

    const [isEditing, setIsEditing] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [videoFile, setVideoFile] = useState(null); // State untuk menampung file video
    const [feedback, setFeedback] = useState({ message: "", type: "" });

    // Fetch settings from Firebase on component mount
    useEffect(() => {
        const settingsRef = doc(db, "settings", "main");
        const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                setSettings(docSnap.data());
            } else {
                // If doc doesn't exist, create it with some defaults
                const defaultSettings = {
                    outletName: "Bank DPR KCP Pamsky",
                    runningText: "Selamat datang di Bank Nusantara. Demi kenyamanan bersama, mohon ambil nomor antrian dan tunggu hingga nomor Anda dipanggil.",
                    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                    audioUrl: "",
                };
                setDoc(settingsRef, defaultSettings);
            }
        });

        return () => unsubscribe();
    }, []);

    const toggleEdit = (field) => {
        setIsEditing((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    // Helper function to parse YouTube URLs
    const parseYouTubeUrl = (inputUrl) => {
        if (!inputUrl) return ""; // Return empty string if input is empty

        // Regex to extract video ID from various YouTube URL formats
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([a-zA-Z0-9_-]{11})(?:\S+)?/;
        const match = inputUrl.match(youtubeRegex);

        if (match && match[1]) {
            // If a YouTube video ID is found, return the standard embed URL
            return `https://www.youtube.com/embed/${match[1]}`;
        } else {
            // If it's not a recognized YouTube URL, assume it's a direct video link (e.g., Firebase Storage)
            return inputUrl;
        }
    };

    const handleChange = (field, value) => {
        if (field === "videoUrl") {
            const processedValue = parseYouTubeUrl(value); // Process YouTube URLs
            setSettings((prev) => ({ ...prev, [field]: processedValue.trim() === "" ? "" : processedValue }));
        } else {
            setSettings((prev) => ({ ...prev, [field]: value.trim() === "" ? "" : value }));
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setVideoFile(e.target.files[0]);
        }
    };

    const saveAll = async () => {
        setIsSaving(true);
        setFeedback({ message: "Menyimpan...", type: "info" });

        let finalSettings = { ...settings };

        // Jika ada file video baru yang dipilih untuk di-upload
        if (videoFile) {
            setFeedback({ message: "Mengunggah video...", type: "info" });
            const videoStorageRef = ref(storage, `display_video/${videoFile.name}`);
            try {
                // Upload file
                const snapshot = await uploadBytes(videoStorageRef, videoFile);
                // Dapatkan URL download
                const downloadURL = await getDownloadURL(snapshot.ref);
                // Update URL di settings yang akan disimpan
                finalSettings.videoUrl = downloadURL;
                setVideoFile(null); // Reset state file setelah di-upload
            } catch (error) {
                console.error("Error uploading video: ", error);
                setFeedback({ message: "Gagal mengunggah video!", type: "error" });
                setIsSaving(false);
                return;
            }
        }

        const settingsRef = doc(db, "settings", "main");
        await setDoc(settingsRef, finalSettings, { merge: true });
        setIsSaving(false);
        setIsEditing({}); // Close all editing fields
        setFeedback({ message: "Pengaturan berhasil disimpan!", type: "success" });
        setTimeout(() => setFeedback({ message: "", type: "" }), 3000);
    };

    return (
        <div className="flex h-screen bg-gray-100">

            {/* SIDEBAR */}
            <Sidebar onLogout={onLogout} />

            {/* KONTEN UTAMA */}
            <div className="flex-1 flex flex-col overflow-auto p-4">

                {/* HEADER */}
                <Header adminName={adminName} notifications={[]} date={date} time={time} />

                {/* WRAPPER HALAMAN */}
                <div className="bg-white p-6 rounded-xl shadow-md mt-6 min-h-[calc(100vh-140px)]">

                    {/* Feedback Message */}
                    {feedback.message && (
                        <div className={`p-3 mb-4 rounded-lg text-sm transition-opacity ${
                            feedback.type === "info" ? "bg-blue-100 text-blue-700" :
                            feedback.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                            {feedback.message}
                        </div>
                    )}

                    {/* GRID */}
                    <div className="grid grid-cols-12 gap-6">

                        {/* FORM KIRI */}
                        <div className="col-span-12 lg:col-span-8 space-y-4">

                            {/* Nama Outlet */}
                            <SettingField
                                label="Nama Outlet"
                                icon={<Store className="w-5 h-5 text-gray-500" />}
                                value={settings.outletName}
                                isEditing={isEditing.outletName}
                                onEdit={() => toggleEdit("outletName")}
                                onChange={(e) => handleChange("outletName", e.target.value)}
                                placeholder="Isi nama outlet"
                            />

                            {/* Running Text */}
                            <SettingField
                                label="Running Text"
                                icon={<Edit className="w-5 h-5 text-gray-500" />}
                                value={settings.runningText}
                                isEditing={isEditing.runningText}
                                onEdit={() => toggleEdit("runningText")}
                                onChange={(e) => handleChange("runningText", e.target.value)}
                                placeholder="Isi running text"
                            />

                            {/* Video */}
                            <SettingField
                                label="Video URL"
                                icon={<Video className="w-5 h-5 text-gray-500" />}
                                value={settings.videoUrl}
                                isEditing={isEditing.videoUrl}
                                onEdit={() => toggleEdit("videoUrl")}
                                onChange={(e) => handleChange("videoUrl", e.target.value)}
                                placeholder="Tempel URL Video"
                            />

                            {/* Upload Video */}
                            <SettingField
                                label="Atau Upload Video"
                                icon={<Video className="w-5 h-5 text-gray-500" />}
                                isCustomInput={true}
                            >
                                <input type="file" accept="video/*" onChange={handleFileChange} className="text-sm w-full sm:w-64" />
                            </SettingField>

                            {/* Audio */}
                            <SettingField
                                label="Audio URL"
                                icon={<Volume2 className="w-5 h-5 text-gray-500" />}
                                isCustomInput={true}
                            >
                                <input type="text" className="border p-2 rounded-lg w-full sm:w-64" value={settings.audioUrl} onChange={(e) => handleChange("audioUrl", e.target.value)} placeholder="Tempel URL Audio" />
                            </SettingField>
                        </div>

                        {/* PANEL KANAN */}
                        <div className="col-span-12 lg:col-span-4 space-y-6 flex flex-col">
                            <button 
                                onClick={() => window.open('/display', '_blank')}
                                className="w-full bg-indigo-600 text-white rounded-xl py-6 flex flex-col justify-center items-center shadow-lg hover:bg-indigo-700 transition"
                            >
                                <Eye className="w-10 h-10" />
                                <span className="font-semibold text-lg mt-2">Mode Display</span>
                            </button>

                            {/* Tombol Simpan dipindahkan ke sini */}
                            <button
                                onClick={saveAll}
                                disabled={isSaving}
                                className="w-full px-8 py-3 bg-green-600 text-white rounded-xl font-semibold shadow-md hover:bg-green-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
                            >
                                <Save className="w-5 h-5" /> {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pengaturan;


// === SettingField Component ===

const SettingField = ({ label, icon, value, isEditing, onEdit, onChange, placeholder, isCustomInput = false, children }) => (
    <div className="p-4 bg-gray-50 rounded-xl border flex items-center justify-between">
        <div className="flex items-center space-x-3">
            {icon}
            <span className="font-semibold text-gray-700">{label}</span>
        </div>

        {isCustomInput ? (
            children
        ) : (
            <>
                {isEditing ? (
                    <input
                        type="text"
                        className="border p-2 rounded-lg w-full sm:w-64"
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                    />
                ) : (
                    <span className="text-gray-600 truncate w-full sm:w-64" title={value}>{value || "-"}</span>
                )}

                <button
                    onClick={onEdit}
                    className="ml-4 px-4 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                </button>
            </>
        )}
    </div>
);
