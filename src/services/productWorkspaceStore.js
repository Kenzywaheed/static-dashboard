const STORAGE_KEY = 'brandDashboardProductWorkspace';

const readStore = () => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeStore = (value) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

export const getWorkspaceStore = () => readStore();

export const getWorkspaceProduct = (productId) => {
  const store = readStore();
  return store[productId] || { colors: [] };
};

export const saveWorkspaceColor = (productId, color) => {
  const store = readStore();
  const currentProduct = store[productId] || { colors: [] };
  const existingColors = currentProduct.colors || [];
  const colorExists = existingColors.some((entry) => entry.id === color.id);
  const nextColors = colorExists
    ? existingColors.map((entry) => (entry.id === color.id ? { ...entry, ...color } : entry))
    : [...existingColors, color];

  writeStore({
    ...store,
    [productId]: {
      ...currentProduct,
      colors: nextColors,
    },
  });
};

export const saveWorkspaceVariants = (productId, colorId, variants) => {
  const store = readStore();
  const currentProduct = store[productId] || { colors: [] };

  writeStore({
    ...store,
    [productId]: {
      ...currentProduct,
      colors: (currentProduct.colors || []).map((color) => (
        color.id === colorId
          ? {
            ...color,
            variants: [...(color.variants || []), ...variants],
          }
          : color
      )),
    },
  });
};

export const deleteWorkspaceColor = (productId, colorId) => {
  const store = readStore();
  const currentProduct = store[productId] || { colors: [] };

  writeStore({
    ...store,
    [productId]: {
      ...currentProduct,
      colors: (currentProduct.colors || []).filter((color) => color.id !== colorId),
    },
  });
};

export const deleteWorkspaceProduct = (productId) => {
  const store = readStore();
  const nextStore = { ...store };
  delete nextStore[productId];
  writeStore(nextStore);
};
