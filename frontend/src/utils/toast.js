// Lightweight toast utility without external deps
// Usage: showToast('Message', 'success'|'error'|'info', 3000)

const ensureContainer = () => {
  let c = document.getElementById('gp-toast-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'gp-toast-container';
    c.style.position = 'fixed';
    c.style.top = '16px';
    c.style.right = '16px';
    c.style.zIndex = '9999';
    c.style.display = 'flex';
    c.style.flexDirection = 'column';
    c.style.gap = '8px';
    document.body.appendChild(c);
  }
  return c;
};

export function showToast(message, type = 'info', duration = 3000) {
  const container = ensureContainer();
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.padding = '10px 14px';
  toast.style.borderRadius = '8px';
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  toast.style.color = '#111827';
  toast.style.background = '#E5E7EB'; // gray-200
  toast.style.fontSize = '14px';
  toast.style.border = '1px solid #E5E7EB';

  if (type === 'success') {
    toast.style.background = '#D1FAE5'; // green-100
    toast.style.border = '1px solid #A7F3D0';
    toast.style.color = '#065F46';
  } else if (type === 'error') {
    toast.style.background = '#FEE2E2'; // red-100
    toast.style.border = '1px solid #FCA5A5';
    toast.style.color = '#7F1D1D';
  } else if (type === 'info') {
    toast.style.background = '#DBEAFE'; // blue-100
    toast.style.border = '1px solid #93C5FD';
    toast.style.color = '#1E3A8A';
  }

  container.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.style.transition = 'opacity 200ms ease-out, transform 200ms ease-out';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-4px)';
    setTimeout(() => container.contains(toast) && container.removeChild(toast), 220);
  }, duration);
}

export default showToast;
