import logo from '../assets/Logo.png';

// Load image and convert to data URL
export const loadImageDataUrl = async (src) => {
  try {
    const resp = await fetch(src);
    const blob = await resp.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

// Adds a branded header: logo, title, rule. Returns the y-coordinate to start content.
export const addBrandedHeader = async (doc, title) => {
  const top = 10;
  const logoData = await loadImageDataUrl(logo);
  if (logoData) {
    doc.addImage(logoData, 'PNG', 14, top, 16, 16);
  }
  doc.setFontSize(18);
  doc.setTextColor(0, 11, 88);
  doc.text(title, logoData ? 34 : 14, top + 10);
  doc.setDrawColor(0, 11, 88);
  doc.setLineWidth(0.5);
  doc.line(14, top + 16, 196, top + 16);
  return top + 24;
};

// Utility to format a standard generated timestamp line below the header.
export const addGeneratedLine = (doc, startY, label = 'Generated') => {
  doc.setFontSize(10);
  doc.setTextColor(33, 33, 33);
  doc.text(`${label}: ${new Date().toLocaleString()}`, 14, startY - 4);
};