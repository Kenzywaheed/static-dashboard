import { createContext, useEffect, useMemo, useState } from 'react';

const brandPalettes = [
  {
    id: 'teal',
    name: 'Calm Teal',
    description: 'Soft storefront teal.',
    primary: '#527c76',
    primaryDark: '#466863',
    primarySoft: '#e2ece9',
    sidebar: '#f1ece4',
  },
  {
    id: 'stone-blue',
    name: 'Stone Blue',
    description: 'Quiet blue-grey.',
    primary: '#5f7890',
    primaryDark: '#4f657a',
    primarySoft: '#e6edf3',
    sidebar: '#f1ece4',
  },
  {
    id: 'olive',
    name: 'Olive',
    description: 'Muted boutique olive.',
    primary: '#78825d',
    primaryDark: '#656d4f',
    primarySoft: '#eaedde',
    sidebar: '#f1ece4',
  },
  {
    id: 'dusty-rose',
    name: 'Dusty Rose',
    description: 'Balanced fashion rose.',
    primary: '#aa7270',
    primaryDark: '#8d5d5b',
    primarySoft: '#f3e6e5',
    sidebar: '#f1ece4',
  },
  {
    id: 'sand',
    name: 'Sand',
    description: 'Warm neutral storefront.',
    primary: '#a88257',
    primaryDark: '#8d6d48',
    primarySoft: '#f2e8dc',
    sidebar: '#f1ece4',
  },
  {
    id: 'graphite',
    name: 'Graphite',
    description: 'Quiet modern neutral.',
    primary: '#5b6772',
    primaryDark: '#4b5560',
    primarySoft: '#e7eaee',
    sidebar: '#f1ece4',
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
