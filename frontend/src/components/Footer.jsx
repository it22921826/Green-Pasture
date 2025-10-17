import React from 'react';
import logo from '../assets/Logo.png';

const Icon = ({ type, className }) => {
  switch (type) {
    case 'instagram':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm0 2h10a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3zm11 2a1 1 0 100 2 1 1 0 000-2zM12 7a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 12a10 10 0 10-11.5 9.95v-7.04H7.9V12h2.6V9.8c0-2.57 1.53-3.99 3.87-3.99 1.12 0 2.29.2 2.29.2v2.52h-1.29c-1.27 0-1.66.79-1.66 1.6V12h2.83l-.45 2.91h-2.38v7.04A10 10 0 0022 12z" />
        </svg>
      );
    case 'twitter':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.27 4.27 0 001.88-2.36 8.53 8.53 0 01-2.71 1.04 4.26 4.26 0 00-7.26 3.88A12.1 12.1 0 013 5.15a4.25 4.25 0 001.32 5.68 4.23 4.23 0 01-1.93-.53v.05a4.26 4.26 0 003.42 4.17c-.47.13-.96.2-1.46.2-.35 0-.71-.03-1.05-.1a4.27 4.27 0 003.98 2.96A8.55 8.55 0 012 19.54a12.07 12.07 0 006.56 1.92c7.87 0 12.18-6.52 12.18-12.17 0-.18-.01-.36-.02-.54.84-.61 1.57-1.36 2.15-2.22z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0zM8 8h4.8v2.2h.06c.67-1.2 2.3-2.46 4.74-2.46C21.4 7.74 24 10 24 14.23V24h-5v-8.52c0-2.03-.04-4.64-2.83-4.64-2.83 0-3.27 2.21-3.27 4.49V24H8V8z" />
        </svg>
      );
    case 'arrow':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2l-1.41 1.41L17.17 10H2v2h15.17l-6.58 6.59L12 22l10-10L12 2z" />
        </svg>
      );
    default:
      return null;
  }
};

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-900 text-gray-300 pt-8 px-6 md:px-16 lg:px-24 xl:px-32">
      <div className="flex flex-wrap justify-between gap-12 md:gap-6">
        <div className="max-w-80">
          <img src={logo} alt="logo" className="mb-4 h-9 w-9 rounded-full object-cover bg-white p-0.5 shadow-sm" />
          <p className="text-sm text-gray-400">
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text.
          </p>
          <div className="flex items-center gap-3 mt-4 text-gray-400">
            <a href="#" aria-label="Instagram" className="hover:text-white transition-colors">
              <Icon type="instagram" className="w-5 h-5" />
            </a>
            <a href="#" aria-label="Facebook" className="hover:text-white transition-colors">
              <Icon type="facebook" className="w-5 h-5" />
            </a>
            <a href="#" aria-label="Twitter" className="hover:text-white transition-colors">
              <Icon type="twitter" className="w-5 h-5" />
            </a>
            <a href="#" aria-label="LinkedIn" className="hover:text-white transition-colors">
              <Icon type="linkedin" className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div>
          <p className="text-lg text-white font-semibold">COMPANY</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            <li><a href="#" className="hover:text-white">About</a></li>
            <li><a href="#" className="hover:text-white">Careers</a></li>
            <li><a href="#" className="hover:text-white">Press</a></li>
            <li><a href="#" className="hover:text-white">Blog</a></li>
            <li><a href="#" className="hover:text-white">Partners</a></li>
          </ul>
        </div>

        <div>
          <p className="text-lg text-white font-semibold">SUPPORT</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            <li><a href="#" className="hover:text-white">Help Center</a></li>
            <li><a href="#" className="hover:text-white">Safety Information</a></li>
            <li><a href="#" className="hover:text-white">Cancellation Options</a></li>
            <li><a href="#" className="hover:text-white">Contact Us</a></li>
            <li><a href="#" className="hover:text-white">Accessibility</a></li>
          </ul>
        </div>

        <div className="max-w-80">
          <p className="text-lg text-white font-semibold">STAY UPDATED</p>
          <p className="mt-3 text-sm text-gray-400">
            Subscribe to our newsletter for inspiration and special offers.
          </p>
          <div className="flex items-center mt-4">
            <input
              type="email"
              className="bg-gray-800 text-gray-100 placeholder-gray-400 rounded-l border border-gray-700 h-9 px-3 outline-none focus:border-gray-500"
              placeholder="Your email"
            />
            <button className="flex items-center justify-center bg-white/10 hover:bg-white/20 h-9 w-9 aspect-square rounded-r">
              <Icon type="arrow" className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>
      <hr className="border-gray-700 mt-8" />
      <div className="flex flex-col md:flex-row gap-2 items-center justify-between py-5 text-gray-400">
        <p>© {year} GreenPastures. All rights reserved.</p>
        <ul className="flex items-center gap-4">
          <li><a href="#" className="hover:text-white">Privacy</a></li>
          <li><a href="#" className="hover:text-white">Terms</a></li>
          <li><a href="#" className="hover:text-white">Sitemap</a></li>
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
