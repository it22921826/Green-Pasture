import React from "react";
import SupportModal from "../components/SupportModal";
import { Link } from "react-router-dom";
import Hotel from "../assets/Hotel.jpg";
import H1 from "../assets/H1.jpg";
import H2 from "../assets/H2.jpg";
import H3 from "../assets/H3.jpg";
import H4 from "../assets/H4.jpg";

const features = [
  {
    title: "Easy Booking",
    desc: "Book rooms quickly and securely with just a few clicks.",
    icon: "🛏️",
  },
];

const testimonials = [
  {
    name: "Ayesha Perera",
    text: "This system made managing our hotel so much easier! Highly recommended.",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "Kasun Silva",
    text: "Booking and staff management is now a breeze. Great support too!",
    avatar: "https://randomuser.me/api/portraits/men/46.jpg",
  },
];

const Home = () => {
  const gallery = [H1, H2, H3, H4];
  const hotel = Hotel;

  const [supportOpen, setSupportOpen] = React.useState(false);

  return (
    <div
      className="relative min-h-screen w-full pb-14"
      style={{
        backgroundImage: `url(${hotel})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative mx-auto mt-16 max-w-3xl rounded-3xl border border-white/30 bg-white/70 p-11 text-center shadow-2xl backdrop-blur-xl">
        <h1 className="mb-6 text-4xl font-extrabold tracking-wide text-[#000B58]">
          Welcome to Hotel Management System
        </h1>
        <p className="mb-8 text-lg font-medium text-neutral-600">
          Manage bookings, staff, and guests with ease.
          <br />
          Login or register to get started, or explore your dashboard and
          bookings if you are already signed in.
        </p>

        <div className="mb-8 flex justify-center gap-6">
          {[
            { to: "/login", label: "Login", variant: "primary" },
            { to: "/register", label: "Register", variant: "success" },
            { to: "/dashboard", label: "Dashboard", variant: "primary" },
          ].map((btn) => (
            <Link
              key={btn.to}
              to={btn.to}
              className={
                btn.variant === "success"
                  ? "rounded-xl bg-green-600 px-9 py-3 text-lg font-bold text-white shadow-lg transition hover:scale-[1.03] hover:bg-green-700"
                  : "rounded-xl bg-[#000B58] px-9 py-3 text-lg font-bold text-white shadow-lg transition hover:scale-[1.03]"
              }
            >
              {btn.label}
            </Link>
          ))}
        </div>

        {/* Hero image removed (background now fills page) */}

        {/* Gallery */}
        <div className="mt-8">
          <h2 className="mb-4 text-2xl font-bold text-[#000B58]">
            Gallery: Five Star Hotel Experience
          </h2>
          <div className="flex flex-wrap justify-center gap-5">
            {gallery.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Gallery ${i + 1}`}
                className="h-[120px] w-[180px] rounded-xl object-cover shadow-md transition-transform duration-300 hover:scale-[1.05]"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
  <div className="relative mx-auto mt-14 flex max-w-5xl flex-wrap justify-center gap-9">
        {features.map((f, i) => (
          <Link key={i} to="/book" className="block">
            <div className="flex min-w-[240px] cursor-pointer flex-col items-center rounded-2xl border border-blue-100 bg-white/90 p-8 text-center shadow-xl transition-transform duration-300 hover:-translate-y-1">
              <div className="mb-3 text-5xl">{f.icon}</div>
              <div className="mb-2 text-xl font-bold text-[#000B58]">{f.title}</div>
              <div className="text-[17px] text-neutral-600">{f.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Testimonials */}
  <div className="relative mx-auto mt-16 max-w-3xl rounded-2xl border border-white/30 bg-white/75 p-9 shadow-xl backdrop-blur-xl">
        <h2 className="mb-7 text-center text-2xl font-bold text-[#000B58]">
          What Our Users Say
        </h2>
        <div className="flex flex-wrap justify-center gap-9">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="min-w-[240px] rounded-xl bg-gray-50 p-6 text-center shadow-md transition-transform duration-300 hover:-translate-y-1"
            >
              <img
                src={t.avatar}
                alt={t.name}
                className="mx-auto mb-3 h-16 w-16 rounded-full shadow"
              />
              <div className="mb-2 text-lg font-bold text-[#000B58]">{t.name}</div>
              <div className="text-base italic text-neutral-600">&quot;{t.text}&quot;</div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Section */}
  <div className="relative mx-auto mt-16 max-w-3xl rounded-2xl border border-white/30 bg-white/75 p-9 text-center shadow-xl backdrop-blur-xl">
        <h2 className="mb-4 text-2xl font-bold text-[#000B58]">Contact & Support</h2>
        <p className="mb-3 text-[17px] text-neutral-600">
          Need help or have questions? Reach out to our support team:
        </p>
        <div className="text-lg font-bold">
          Email: <a href="mailto:support@hotelms.com" className="text-[#000B58] hover:underline">support@hotelms.com</a>
        </div>
        <div className="text-lg font-bold">
          Phone: <span className="text-[#000B58]">+94 77 123 4567</span>
        </div>
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setSupportOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#000B58] px-6 py-3 text-white shadow transition hover:scale-[1.03]"
            >
              <span className="text-2xl">💬</span>
              <span>Open Support</span>
            </button>
            <Link
              to="/feedback"
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-white shadow transition hover:scale-[1.03]"
            >
              <span className="text-2xl">⭐</span>
              <span>Feedback</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Support Modal */}
      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  );
};

export default Home;
