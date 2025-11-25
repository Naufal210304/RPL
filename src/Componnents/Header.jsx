import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, Edit } from 'lucide-react';

const Header = ({ adminName, isSidebarOpen, toggleSidebar, notifications, date, time }) => {
  const safeAdminName = adminName || 'Admin';
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);

  // Efek ini akan berjalan setiap kali nama admin berubah (misalnya setelah login)
  useEffect(() => {
    const profileImageKey = `profileImage_${safeAdminName}`;
    setProfileImage(localStorage.getItem(profileImageKey) || null);
  }, [safeAdminName]);

  const getInitials = (name) => {
    if (!name) return "?";
    const words = name.split(' ');
    if (words.length > 1 && words[0] && words[1]) {
      return words[0][0].toUpperCase() + words[1][0].toUpperCase();
    }
    return name.substring(0, 1).toUpperCase();
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        const profileImageKey = `profileImage_${safeAdminName}`;
        localStorage.setItem(profileImageKey, base64String);
        setProfileImage(base64String);
        setShowProfileMenu(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <header className="bg-white shadow-md p-4 flex items-center justify-between h-20 rounded-lg">
      
      {/* Bagian Kiri: Salam & Toggle Sidebar */}
      <div className="flex items-center space-x-4">
        {!isSidebarOpen && (
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-full text-gray-600 hover:bg-gray-100 lg:hidden"
            title="Buka Sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}

        <h2 className="text-xl font-semibold text-gray-800 whitespace-nowrap">
          Selamat datang, <span className="text-indigo-600">{safeAdminName}</span>
        </h2>
      </div>

      {/* Bagian Tengah: Kolom Pencarian */}
      <div className="flex-grow max-w-sm mx-8 hidden sm:block">
        <div className="relative">
          <input
            type="text"
            placeholder="Cari di sini..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Bagian Kanan: Notifikasi dan Profil */}
      <div className="flex items-center space-x-6">
        
        {/* Ikon Notifikasi */}
        <div className="relative">
          <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 transition duration-150" title="Notifikasi">
            <Bell className="w-6 h-6" />
            {notifications && notifications.length > 0 && (
              <span className="absolute top-1 right-1 block h-3 w-3 rounded-full ring-2 ring-white bg-red-500"></span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white border rounded-lg shadow-xl z-20">
              <div className="p-3 font-bold border-b">Notifikasi</div>
              <ul className="max-h-96 overflow-y-auto">
                {notifications && notifications.length > 0 ? (
                  notifications.map(notif => (
                    <li key={notif.id} className="p-3 border-b hover:bg-gray-50 text-sm">
                      <p>{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{notif.time.toLocaleTimeString('id-ID')}</p>
                    </li>
                  ))
                ) : (
                  <li className="p-4 text-center text-gray-500">Tidak ada notifikasi baru.</li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Profil: NAMA → BULATAN PROFIL */}
        <div className="relative flex items-center space-x-3 cursor-pointer group" onClick={() => setShowProfileMenu(!showProfileMenu)}>
          <input type="file" ref={fileInputRef} onChange={handleProfileImageChange} className="hidden" accept="image/*" />
          {/* Nama dulu */}
          <span className="hidden lg:block text-gray-700 font-medium group-hover:text-indigo-600 transition duration-150">
            {safeAdminName}
          </span>

          {/* Bulatan Profil */}
          <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm ring-2 ring-indigo-300 overflow-hidden">
            {profileImage ? (
              <img src={profileImage} alt="Profil" className="w-full h-full object-cover" />
            ) : (
              getInitials(safeAdminName)
            )}
          </div>

          {showProfileMenu && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white border rounded-lg shadow-xl z-20" onClick={(e) => e.stopPropagation()}>
              <div className="p-3 border-b">
                <p className="font-bold">{safeAdminName}</p>
                <p className="text-sm text-gray-500">Admin</p>
              </div>
              <a onClick={() => fileInputRef.current.click()} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                <Edit className="w-4 h-4" /> Ubah Gambar Profil
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
