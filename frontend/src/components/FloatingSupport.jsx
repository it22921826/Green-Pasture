import React from 'react';
import SupportModal from './SupportModal';

const FloatingSupport = () => {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Support"
        aria-label="Open support"
        className="fixed bottom-6 right-6 z-[1000] flex items-center gap-2 rounded-full bg-[#000B58] px-5 py-3 text-white shadow-lg transition hover:scale-[1.05]"
      >
        <span className="text-xl">💬</span>
        <span className="hidden sm:block font-semibold">Support</span>
      </button>
      <SupportModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default FloatingSupport;
