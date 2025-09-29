import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { decodeToken } from '../utils/authHelper';
import logo from '../assets/Logo.png'; // ✅ import your logo
// import SupportModal from './SupportModal';

const Navbar = () => {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const location = useLocation();
  const user = token ? decodeToken(token) : null;
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [listening, setListening] = useState(false);
  const avatar = user?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg';
  const searchRef = useRef(null);
  // const [supportOpen, setSupportOpen] = useState(false);

  // Dummy suggestions
  const allSuggestions = [
    'Room 101', 'Room 202', 'John Doe', 'Jane Smith',
    'Suite Deluxe', 'Conference Hall', 'Breakfast',
    'Spa', 'Swimming Pool', 'Check-in', 'Check-out',
    'Payment', 'Reservation', 'Guest Profile', 'Staff Dashboard'
  ];

  // Theme toggle
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
    document.body.style.background = theme === 'light' ? '#181c24' : '#f7f8fa';
  };

  // Close the More dropdown on any route change
  React.useEffect(() => {
    if (dropdownOpen) setDropdownOpen(false);
  }, [location.pathname]);

  // Smart search
  React.useEffect(() => {
    if (search.length > 0) {
      setSuggestions(allSuggestions.filter(s =>
        s.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 6));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [search]);

  // Voice search
  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice search not supported in this browser.');
      return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      setSearch(event.results[0][0].transcript);
      setListening(false);
      searchRef.current && searchRef.current.focus();
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  // Search submit
  const handleSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    alert(`Searching for: ${search}`);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Menu items based on user role
  const getMenuItems = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'Admin':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: '�' },
          { to: '/facility-booking', label: 'Facilities', icon: '🏨' },
          { to: '/staff-management', label: 'Staff', icon: '👥' },
        ];
      case 'Staff':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: '📊' },
          // Facilities link removed for Staff per request
          { to: '/staff-management', label: 'Staff', icon: '👥' },
        ];
          case 'User': // Normalize 'User' as regular guest
            return [
              { to: '/my-bookings', label: 'Bookings', icon: '📄' },
              { to: '/facility-booking', label: 'Facilities', icon: '🏨' },
            ];
      case 'Guest':
      default:
        return [
          { to: '/my-bookings', label: 'Bookings', icon: '📄' },
          { to: '/facility-booking', label: 'Facilities', icon: '🏨' },
        ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <nav
      id="navbar-glass"
      style={{
        background: 'linear-gradient(90deg, #0A2540 0%, #00FF55 100%)',
        color: '#fff',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-2">
        {/* ✅ Square Logo */}
        <div className="flex items-center gap-5">
          <Link
            to="/"
            className="flex items-center gap-3 font-extrabold text-2xl tracking-wide px-4 py-2 rounded-xl shadow text-white"
            style={{
              textDecoration: 'none',
              textShadow: '0 0 12px #00eaff',
              background: 'rgba(0,123,255,0.10)',
              minHeight: '48px',
            }}
          >
            <img
              src={logo}
              alt="Hotel Logo"
              className="w-10 h-10 rounded-md shadow"
              style={{ objectFit: 'cover', flex: '0 0 auto' }}
            />
            GreenPastures
          </Link>
        </div>

        <div className="flex-1" />

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className={`relative flex items-center rounded-2xl shadow-lg px-4 py-1 mr-8 min-w-[240px] border transition-all 
          ${theme === 'light' ? 'bg-white/90 border-blue-100' : 'bg-neutral-800/90 border-blue-100'}`}
        >
          <input
            ref={searchRef}
            type="text"
            placeholder="Search rooms, guests, features..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`border-none outline-none px-2 py-2 rounded-lg text-base min-w-[120px] bg-transparent 
            ${theme === 'light' ? 'text-neutral-800' : 'text-gray-200'}`}
          />
          <button
            type="button"
            onClick={handleVoiceSearch}
            className={`ml-1 font-bold text-xl cursor-pointer transition-transform hover:scale-110 
            ${listening ? 'text-cyan-400' : 'text-blue-600'}`}
          >
            {listening ? '🎤' : '🔊'}
          </button>
          <button
            type="submit"
            className="ml-1 font-bold text-xl text-blue-600 cursor-pointer transition-transform hover:scale-110"
          >
            🔍
          </button>
          {showSuggestions && suggestions.length > 0 && (
            <ul
              className={`absolute top-11 left-0 w-full rounded-xl shadow-lg list-none m-0 p-2 z-[1002] 
              ${theme === 'light' ? 'bg-white text-neutral-800' : 'bg-neutral-800 text-gray-200'}`}
            >
              {suggestions.map((s, idx) => (
                <li
                  key={idx}
                  className="px-4 py-2 cursor-pointer text-[15px] rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => {
                    setSearch(s);
                    setShowSuggestions(false);
                  }}
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
        </form>

        {/* Actions */}
        <div className="navbar-menu flex items-center gap-5">
          <div className={`navbar-links ${menuOpen ? 'block' : 'flex'} gap-5`}>
            {/* Public All Rooms link */}
            <Link
              to="/rooms"
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl shadow text-lg font-semibold transition-transform hover:-translate-y-0.5 
              ${theme === 'light' ? 'text-white' : 'text-gray-200'}`}
              style={{
                textDecoration: 'none',
                background:
                  theme === 'light' ? 'rgba(0,123,255,0.10)' : 'rgba(24,28,36,0.18)',
              }}
            >
              <span className="text-2xl">🛏️</span>
              <span>Rooms</span>
            </Link>
            {/* Feedback link removed as per request */}
            {menuItems.map((item, idx) => (
              <Link
                key={idx}
                to={item.to}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl shadow text-lg font-semibold transition-transform hover:-translate-y-0.5 
                ${theme === 'light' ? 'text-white' : 'text-gray-200'}`}
                style={{
                  textDecoration: 'none',
                  background:
                    theme === 'light' ? 'rgba(0,123,255,0.10)' : 'rgba(24,28,36,0.18)',
                }}
              >
                <span className="text-2xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            {/* Support button removed as per request */}
          </div>
          {/* Settings Dropdown (show only when logged in) */}
          {token && (
            <div className="relative inline-block">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`transition-colors text-[18px] hover:text-cyan-400 ${theme === 'light' ? 'text-white' : 'text-gray-200'}`}
                >
                  ⚙️ More
                </button>
                {dropdownOpen && (
                  <div className={`absolute right-0 top-9 min-w-[160px] rounded-xl shadow-lg z-[1002] 
                  ${theme === 'light' ? 'bg-white text-neutral-800' : 'bg-neutral-800 text-gray-200'}`}>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-3 text-neutral-700 hover:bg-blue-50 rounded-t-xl"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-3 text-blue-600 hover:bg-blue-50"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        localStorage.removeItem('token');
                        navigate('/login');
                      }}
                      className="block w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-b-xl"
                    >
                      Logout
                    </button>
                  </div>
                )}
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={`text-2xl cursor-pointer p-2 rounded-xl shadow transition-transform hover:scale-110 
            ${theme === 'light' ? 'text-white' : 'text-gray-200'}`}
            style={{
              background:
                theme === 'light' ? 'rgba(0,123,255,0.10)' : 'rgba(24,28,36,0.18)',
            }}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {/* Avatar (no direct navigation; profile in More menu) */}
          {token && (
            <img
              src={avatar}
              alt="avatar"
              className="w-[42px] h-[42px] rounded-full border-2 border-white cursor-pointer shadow transition-transform hover:scale-110 hover:shadow-cyan-400/50"
              onClick={() => setDropdownOpen((o) => !o)}
            />
          )}
        </div>
      </div>
  {/* Support modal moved to Home */}
    </nav>
  );
};

export default Navbar;