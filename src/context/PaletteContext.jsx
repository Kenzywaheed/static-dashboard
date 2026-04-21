import { createContext, useEffect, useMemo, useState } from 'react';

const brandPalettes = [
  {
    id: 'teal',
    name: 'Teal',
    description: 'Structured storefront teal.',
    primary: '#0f766e',
    primaryDark: '#134e4a',
    primarySoft: '#ccfbf1',
    sidebar: '#0f172a',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Deep blue storefront.',
    primary: '#0369a1',
    primaryDark: '#0c4a6e',
    primarySoft: '#e0f2fe',
    sidebar: '#082f49',
  },
  {
    id: 'indigo',
    name: 'Indigo',
    description: 'Sharper studio indigo.',
    primary: '#4f46e5',
    primaryDark: '#312e81',
    primarySoft: '#e0e7ff',
    sidebar: '#1e1b4b',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    description: 'Fresh commerce green.',
    primary: '#059669',
    primaryDark: '#065f46',
    primarySoft: '#d1fae5',
    sidebar: '#022c22',
  },
  {
    id: 'amber',
    name: 'Amber',
    description: 'Warm boutique amber.',
    primary: '#d97706',
    primaryDark: '#92400e',
    primarySoft: '#fef3c7',
    sidebar: '#451a03',
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Bold fashion rose.',
    primary: '#e11d48',
    primaryDark: '#9f1239',
    primarySoft: '#ffe4e6',
    sidebar: '#4c0519',
  },
  {
    id: 'violet',
    name: 'Violet',
    description: 'Luxe violet tone.',
    primary: '#7c3aed',
    primaryDark: '#5b21b6',
    primarySoft: '#ede9fe',
    sidebar: '#2e1065',
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Minimal graphite look.',
    primary: '#475569',
    primaryDark: '#1e293b',
    primarySoft: '#e2e8f0',
    sidebar: '#020617',
  },
  {
    id: 'coral',
    name: 'Coral',
    description: 'Bright coral energy.',
    primary: '#ea580c',
    primaryDark: '#9a3412',
    primarySoft: '#ffedd5',
    sidebar: '#431407',
  },
  {
    id: 'mint',
    name: 'Mint',
    description: 'Light modern mint.',
    primary: '#10b981',
    primaryDark: '#047857',
    primarySoft: '#d1fae5',
    sidebar: '#052e2b',
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
