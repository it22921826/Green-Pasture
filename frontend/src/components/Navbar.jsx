import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { decodeToken } from "../utils/authHelper";
import {
  Globe,
  Calendar,
  Menu,
  BedDouble,
  Building2,
  ClipboardList,
  Settings,
  LayoutDashboard,
  Users,
} from "lucide-react";
import logoImg from "../assets/Logo.png";

export default function Navbar() {
  const [openUser, setOpenUser] = useState(false);
  const userRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const decoded = token ? decodeToken(token) : null;
  const role = decoded?.role || decoded?.user?.role || null;

  // close profile menu when clicking outside
  useEffect(() => {
    function onDocClick(e) {
      if (userRef.current && !userRef.current.contains(e.target)) {
        setOpenUser(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <header className="w-full text-white font-sans">
      {/* Top Bar */}
      <div className="bg-gray-900 text-sm px-6 py-2 flex justify-between items-center">
       
        <div className="flex items-center gap-3">
          <button className="bg-yellow-500 text-black px-3 py-1 rounded-full font-semibold text-xs">
            VR
          </button>
          <div className="flex items-center gap-1 text-gray-300 cursor-pointer">
            <Globe size={16} />
            <span>ENG</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="bg-gray-800 px-4 md:px-10 py-4 flex justify-between items-center">
        {/* Logo (clickable → Home) */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-90" title="Home">
          <img
            src={logoImg}
            alt="GreenPasture"
            className="w-10 h-10 object-contain"
          />
          <span className="text-xl font-bold">GreenPasture</span>
        </Link>

        {/* Center Nav Links */}
        

        {/* Right-side app buttons + settings + profile */}
        <div className="hidden md:flex items-center gap-3">
          {(
            (role === 'Staff')
              ? [
                  { to: '/rooms', label: 'Rooms', icon: <BedDouble size={18} /> },
                  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
                  { to: '/staff-management', label: 'Staff', icon: <Users size={18} /> },
                ]
              : [
                  { to: '/rooms', label: 'Rooms', icon: <BedDouble size={18} /> },
                  { to: '/my-bookings', label: 'Bookings', icon: <ClipboardList size={18} /> },
                  { to: '/facility-booking?view=public', label: 'Facilities', icon: <Building2 size={18} /> },
                ]
          ).map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl border border-white/10 transition"
            >
              {link.icon}
              <span className="font-medium">{link.label}</span>
            </Link>
          ))}

          {/* Settings (hidden when logged in) */}
          {!token && (
            <button
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition"
              title="Settings"
              onClick={() => navigate('/settings')}
            >
              <Settings size={18} />
            </button>
          )}

          {/* Profile + dropdown (only when logged in) */}
          {token && (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setOpenUser((v) => !v)}
                className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/20 hover:ring-white/40 transition"
                title="Profile"
              >
                {/* replace with your user image */}
                <img
                  src="https://i.pravatar.cc/100?img=12"
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </button>

              {openUser && (
                <div className="absolute right-0 mt-3 w-56 bg-white text-gray-900 rounded-xl shadow-2xl p-2">
                  <Link to="/profile" className="block px-3 py-2 rounded-lg text-sm hover:bg-gray-100 text-gray-800">
                    Profile
                  </Link>
                  <Link to="/settings" className="block px-3 py-2 rounded-lg text-sm text-blue-600 hover:bg-gray-100">
                    Settings
                  </Link>
                  <button
                    onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Icon (kept for small screens) */}
          <button className="md:hidden">
            <Menu size={24} />
          </button>
        </div>

        {/* Mobile Menu Icon (visible when md:hidden group above is hidden) */}
        <button className="md:hidden">
          <Menu size={24} />
        </button>
      </div>

      {/* Right Vertical Icons Bar (hidden for Staff) */}
      {role !== 'Staff' && (
        <div className="fixed top-1/3 right-0 flex flex-col items-center gap-4 bg-gray-900 py-4 px-2 rounded-l-2xl shadow-lg">
          <Link to="/rooms" className="flex flex-col items-center text-xs hover:text-yellow-400" title="Go to Rooms">
            <Calendar size={20} />
            Reservation
          </Link>
          <Link to="/" className="flex flex-col items-center text-xs hover:text-yellow-400" title="Go to Home">
            <Globe size={20} />
            Info
          </Link>
        </div>
      )}
    </header>
  );
}
