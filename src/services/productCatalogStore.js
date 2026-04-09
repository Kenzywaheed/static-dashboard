const STORAGE_KEY = 'brandDashboardProducts';

const makeId = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `product-${Math.random().toString(16).slice(2)}`;
};

export const PRODUCT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const getEmptySizeMap = () => PRODUCT_SIZES.reduce((sizes, sizeName) => ({
  ...sizes,
  [sizeName]: 0,
}), {});

export const getProductItemStock = (item) => (
  Object.values(item.sizes || {}).reduce((total, quantity) => total + Number(quantity || 0), 0)
);

export const getProductStock = (product) => (
  (product.productItems || []).reduce((total, item) => total + getProductItemStock(item), 0)
);

export const getProductColors = (product) => (
  [...new Set((product.productItems || []).map((item) => item.colorName || item.colorHex))]
);

export const loadSavedProducts = () => {
  const storedProducts = localStorage.getItem(STORAGE_KEY);

  if (!storedProducts) {
    return [];
  }

  try {
    const products = JSON.parse(storedProducts);
    return Array.isArray(products) ? products : [];
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
};

export const saveProducts = (products) => {
  const serializableProducts = products.map((product) => ({
    ...product,
    thumbnailFile: null,
    productItems: (product.productItems || []).map((item) => ({
      ...item,
      imageFiles: [],
    })),
  }));

  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableProducts));
};

export const createLocalProduct = (product) => ({
  ...product,
  id: makeId(),
  createdAt: new Date().toISOString(),
});

export const createLocalProductItem = (item) => ({
  ...item,
  id: makeId(),
});

export const toBackendProductPayload = (product) => ({
  productDto: {
    productName: product.productName,
    productDescription: product.productDescription,
    thumbnail: product.thumbnailFile || product.thumbnail || null,
  },
  productItemList: (product.productItems || []).map((item) => ({
    color: item.colorName || item.colorHex,
    size: Object.entries(item.sizes || {})
      .filter(([, stock]) => Number(stock) > 0)
      .map(([sizeName, stock]) => ({
        sizeName,
        stock: Number(stock),
      })),
    stock: getProductItemStock(item),
    price: Number(item.price || product.price || 0),
    sku: item.sku,
    imagesOfProductItem: item.imageFiles || [],
  })),
});
