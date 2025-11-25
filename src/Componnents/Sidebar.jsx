import React, { useState, useEffect } from 'react';
import {
  Menu as MenuIcon,
  X as CloseIcon,
  LayoutDashboard,
  Users,
  BarChart2,
  Settings,
  LogOut,
  ListOrdered,
  History,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import { Link, useLocation } from "react-router-dom";
import Logo from '../Assets/logo.png';

// Konfigurasi menu
const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, link: '/dashboard' },

  {
    name: 'Antrian',
    icon: Users,
    isDropdown: true,
    subMenus: [
      { name: 'Daftar Antrian', icon: ListOrdered, link: '/daftar-antrian' },
      { name: 'Riwayat Antrian', icon: History, link: '/riwayat-antrian' },
    ]
  },

  { name: 'Laporan', icon: BarChart2, link: '/laporan' },
  { name: 'Pengaturan', icon: Settings, link: '/pengaturan' },
];


// ==================== NAV ITEM =====================
const NavItem = ({
  item,
  isSidebarOpen,
  activeMenu,
  activeSubMenu,
  setActiveMenu,
  setActiveSubMenu
}) => {

  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);

  // Buka dropdown otomatis jika submenu aktif
  useEffect(() => {
    if (item.subMenus && item.subMenus.some(s => s.name === activeSubMenu)) {
      setIsSubMenuOpen(true);
      setActiveMenu(item.name);
    }
  }, [activeSubMenu]);

  const isActive = activeMenu === item.name;

  return (
    <div>

      {/* ===== MENU BIASA (Link langsung) ===== */}
      {!item.isDropdown ? (
        <Link
          to={item.link}
          onClick={() => {
            setActiveMenu(item.name);
            setActiveSubMenu('');
          }}
          className={`
            flex items-center space-x-3 p-3 my-1 rounded-lg transition-colors
            ${isActive ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:bg-indigo-600 hover:text-white'}
          `}
        >
          <item.icon className="w-6 h-6" />
          {isSidebarOpen && <span className="text-sm">{item.name}</span>}
        </Link>
      ) : (

        /* ===== MENU DROPDOWN ===== */
        <div
          onClick={() => {
            setIsSubMenuOpen(!isSubMenuOpen);
            setActiveMenu(item.name);
          }}
          className={`
            flex items-center space-x-3 p-3 my-1 rounded-lg cursor-pointer transition
            ${isActive ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:bg-indigo-600 hover:text-white'}
          `}
        >
          <item.icon className="w-6 h-6" />

          {isSidebarOpen && <span className="text-sm">{item.name}</span>}

          {isSidebarOpen && (
            <div className="ml-auto">
              {isSubMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          )}
        </div>
      )}

      {/* ===== SUB MENU ===== */}
      {item.isDropdown && isSubMenuOpen && isSidebarOpen && (
        <div className="ml-5 mt-1 border-l border-indigo-500">
          {item.subMenus.map((sub, index) => (
            <Link
              key={index}
              to={sub.link}
              onClick={() => {
                setActiveSubMenu(sub.name);
                setActiveMenu(item.name);
              }}
              className={`
                flex items-center space-x-3 p-3 pl-6 my-1 rounded-lg text-sm transition
                ${activeSubMenu === sub.name ? 'bg-indigo-700 text-white' : 'text-indigo-300 hover:bg-indigo-600 hover:text-white'}
              `}
            >
              <sub.icon className="w-5 h-5" />
              <span>{sub.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};


// ==================== SIDEBAR UTAMA =====================
const Sidebar = ({ onLogout }) => {
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [activeSubMenu, setActiveSubMenu] = useState("");

  // Deteksi menu berdasarkan URL
  useEffect(() => {
    menuItems.forEach(menu => {
      if (!menu.isDropdown && menu.link === location.pathname) {
        setActiveMenu(menu.name);
        setActiveSubMenu("");
      }

      if (menu.isDropdown) {
        menu.subMenus.forEach(sub => {
          if (sub.link === location.pathname) {
            setActiveMenu(menu.name);
            setActiveSubMenu(sub.name);
          }
        });
      }
    });
  }, [location.pathname]);

  return (
    <nav
      className={`
        ${isSidebarOpen ? 'w-64' : 'w-20'}
        transition-all duration-300 bg-indigo-800 flex flex-col shadow-xl h-screen
      `}
    >

      {/* ========= LOGO & TOGGLE ========= */}
      <div className="flex items-center p-4 border-b border-indigo-700 h-32">
        <div
          className={`
            flex flex-col items-center justify-center w-full
            ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}
            transition-opacity duration-200
          `}
        >
          <img src={Logo} alt="Logo" className="w-40 h-40 object-contain mb-2" />
        </div>

        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`
            p-2 rounded-full bg-indigo-800 hover:bg-indigo-600 text-white
            ${isSidebarOpen ? 'ml-auto' : 'mx-auto'}
          `}
        >
          {isSidebarOpen ? <CloseIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
        </button>
      </div>

      {/* ========= MENU ========= */}
      <div className="flex-grow p-4 overflow-y-auto">
        {menuItems.map((item, index) => (
          <NavItem
            key={index}
            item={item}
            isSidebarOpen={isSidebarOpen}
            activeMenu={activeMenu}
            activeSubMenu={activeSubMenu}
            setActiveMenu={setActiveMenu}
            setActiveSubMenu={setActiveSubMenu}
          />
        ))}
      </div>

      {/* ========= LOGOUT ========= */}
      <div className="p-4 border-t border-indigo-700 mt-auto">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 p-3 rounded-lg text-red-300 hover:bg-red-700 hover:text-white"
        >
          <LogOut className="w-6 h-6" />
          {isSidebarOpen && <span className="text-sm">Logout</span>}
        </button>
      </div>

    </nav>
  );
};

export default Sidebar;
