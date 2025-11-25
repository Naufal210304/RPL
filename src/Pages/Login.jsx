import React, { useState } from "react";
import { X, Mail, Lock } from "lucide-react";
import backgroundImage from "../Assets/background.jpg";
import TicketModal from "../Componnents/TicketModal";

// Dummy admin
const DUMMY_ADMINS = [
  { email: "Admin_Teller1@loket.com", password: "pass123", name: "Admin Teller 1", role: "Admin" },
  { email: "Admin_Teller2@loket.com", password: "pass123", name: "Admin Teller 2", role: "Admin" },
  { email: "Admin_TellerVIP@loket.com", password: "pass123", name: "Admin VIP", role: "Admin" },
  { email: "Admin_CustomerService@loket.com", password: "pass123", name: "Admin Customere Service", role: "Admin" },
];

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(""); 
  const [loading, setLoading] = useState(false);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 2500);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("Memproses otentikasi...");
    setStatus("");

    const user = DUMMY_ADMINS.find(
      (admin) => admin.email === email && admin.password === password
    );

    setTimeout(() => {
      if (user) {
        setStatus("success");
        setMessage(`Login berhasil! Selamat datang, ${user.name} (${user.role}).`);
        showToast("Login berhasil! Selamat datang.", "success");

        setTimeout(() => setIsLoginModalOpen(false), 700);
        setTimeout(() => onLoginSuccess(user.name), 2500);

        setLoading(false);
        return;
      }

      setStatus("error");
      setMessage("Login gagal. Email atau Password tidak valid.");
      showToast("Login gagal! Email atau password salah.", "error");
      setLoading(false);

    }, 800);
  };

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-white/10"></div>

      {/* Toast */}
      {toast.show && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium
            ${toast.type === "success" ? "bg-green-600" : "bg-red-600"} animate-fadeIn`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="relative z-20 p-6 flex justify-end">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="text-blue-900 hover:text-sky-600 text-lg font-bold transition flex items-center"
          >
            Masuk
          </button>

          <button
            onClick={() => setIsTicketModalOpen(true)}
            className="flex items-center space-x-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-1 px-3 rounded-md shadow-lg transition"
          >
            Ambil Nomor
          </button>
        </div>
      </header>

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm transform transition-all duration-300 animate-fadeIn">
            <div className="relative flex justify-center items-center p-5 border-b">
              <h2 className="text-xl font-bold text-gray-800">Login</h2>
              <button
                onClick={() => {
                  setMessage("");
                  setStatus("");
                  setIsLoginModalOpen(false);
                }}
                className="absolute right-5 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogin} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Masukkan email kamu"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Masukkan password kamu"
                  />
                </div>
              </div>

              {message && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    status === "success"
                      ? "bg-green-100 text-green-700"
                      : status === "error"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-40 flex justify-center items-center py-2 px-4 rounded-lg shadow-md text-sm font-medium text-white transition
                  ${loading ? "bg-gray-400" : "bg-sky-600 hover:bg-sky-700"}`}
              >
                {loading ? "Memproses..." : "Masuk Sekarang"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      {isTicketModalOpen && (
        <TicketModal
          onClose={() => setIsTicketModalOpen(false)}
          onTicketGenerated={(nomor) => alert("Nomor Anda: " + nomor)}
        />
      )}
    </div>
  );
};

export default Login;
