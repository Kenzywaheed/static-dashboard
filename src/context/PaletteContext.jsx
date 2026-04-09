import { createContext, useEffect, useMemo, useState } from 'react';

const brandPalettes = [
  {
    id: 'comfort',
    name: 'Comfort',
    description: 'Warm, friendly, and easy for daily work.',
    primary: '#0f766e',
    primaryDark: '#115e59',
    primarySoft: '#ccfbf1',
    sidebar: '#111827',
  },
  {
    id: 'atelier',
    name: 'Atelier',
    description: 'Sharp fashion studio energy with clean contrast.',
    primary: '#4f46e5',
    primaryDark: '#3730a3',
    primarySoft: '#e0e7ff',
    sidebar: '#18181b',
  },
  {
    id: 'fresh',
    name: 'Fresh',
    description: 'Bright store-front feeling for a growing local brand.',
    primary: '#0284c7',
    primaryDark: '#075985',
    primarySoft: '#e0f2fe',
    sidebar: '#0f172a',
  },
];

const PALETTE_STORAGE_KEY = 'brandDashboardPalette';
const defaultPalette = brandPalettes[0];

const PaletteContext = createContext(null);

const getSavedPalette = () => {
  const savedId = localStorage.getItem(PALETTE_STORAGE_KEY);

  return brandPalettes.find((palette) => palette.id === savedId) || defaultPalette;
};

export const PaletteProvider = ({ children }) => {
  const [palette, setPaletteState] = useState(getSavedPalette);

  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty('--brand-primary', palette.primary);
    root.style.setProperty('--brand-primary-dark', palette.primaryDark);
    root.style.setProperty('--brand-primary-soft', palette.primarySoft);
    root.style.setProperty('--sidebar-bg', palette.sidebar);
    localStorage.setItem(PALETTE_STORAGE_KEY, palette.id);
  }, [palette]);

  const value = useMemo(() => ({
    palette,
    palettes: brandPalettes,
    setPalette: (paletteId) => {
      setPaletteState(brandPalettes.find((nextPalette) => nextPalette.id === paletteId) || defaultPalette);
    },
  }), [palette]);

  return (
    <PaletteContext.Provider value={value}>
      {children}
    </PaletteContext.Provider>
  );
};

export default PaletteContext;
