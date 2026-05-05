const findFirstArrayInObject = (value, seen = new Set()) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object' || seen.has(value)) return null;

  seen.add(value);

  for (const nestedValue of Object.values(value)) {
    const match = findFirstArrayInObject(nestedValue, seen);
    if (match) return match;
  }

  return null;
};

export const normalizeCollectionResponse = (data) => (
  [
    data?.content,
    data?.products,
    data?.items,
    data?.result,
    data?.data?.content,
    data?.data?.products,
    data?.data?.items,
    findFirstArrayInObject(data),
    Array.isArray(data) ? data : null,
  ].find(Array.isArray) || []
);

export const normalizeCategoryCollectionResponse = (data) => (
  [
    data?.content,
    data?.categories,
    data?.items,
    data?.result,
    data?.data?.content,
    data?.data?.categories,
    findFirstArrayInObject(data),
    Array.isArray(data) ? data : null,
  ].find(Array.isArray) || []
);

export const normalizeCategory = (category) => ({
  id: String(category?.id || category?.categoryId || ''),
  name: category?.categoryNameEn || category?.categoryName || category?.name || '',
});

export const normalizeProductImage = (image, index = 0) => {
  if (typeof image === 'string') {
    return {
      id: `img-${index}-${image}`,
      imageUrl: image,
    };
  }

  return {
    id: String(image?.id || image?.imageId || `img-${index}`),
    imageUrl: image?.imageUrl || image?.url || image?.src || '',
  };
};

export const getEffectiveVariantPrice = (variant, basePrice) => {
  const override = variant?.priceOverride;
  return override !== null && override !== undefined && override !== ''
    ? Number(override)
    : Number(basePrice || 0);
};

export const normalizeVariant = (variant, basePrice) => ({
  id: String(variant?.variantId || variant?.id || ''),
  size: String(variant?.size || variant?.sizeName || ''),
  sku: variant?.sku || '',
  stock: Number(variant?.stock || 0),
  priceOverride: variant?.priceOverride ?? null,
  effectivePrice: getEffectiveVariantPrice(variant, basePrice),
});

export const normalizeColor = (color, basePrice) => ({
  id: String(color?.productColorId || color?.colorId || color?.id || ''),
  colorCode: color?.colorCode || '#111827',
  images: (color?.images || color?.imageUrls || []).map(normalizeProductImage).filter((image) => image.imageUrl),
  variants: (color?.variants || color?.productVariants || color?.variantList || []).map((variant) => normalizeVariant(variant, basePrice)),
});

export const normalizeProduct = (product) => {
  const basePrice = Number(product?.basePrice ?? product?.productPrice ?? product?.price ?? 0);
  const colors = (product?.colors || product?.productColors || product?.colorOptions || []).map((color) => normalizeColor(color, basePrice));

  return {
    id: String(product?.id || product?.productId || ''),
    productName: product?.productName || product?.productNameEn || product?.name || '',
    description: product?.description || product?.productDescriptionEn || product?.descriptionEn || '',
    basePrice,
    brandName: product?.brand?.name || product?.brandName || '',
    categoryName: product?.category?.name || product?.categoryName || product?.categoryNameEn || '',
    categoryId: String(product?.category?.id || product?.categoryId || ''),
    avgRating: Number(product?.rating?.avgRating || product?.avgRating || 0),
    ratingCount: Number(product?.rating?.ratingCount || product?.ratingCount || 0),
    colors,
  };
};

export const getProductMainImage = (product) => (
  product?.colors?.[0]?.images?.[0]?.imageUrl || ''
);

export const getProductMinPrice = (product) => {
  const prices = (product?.colors || []).flatMap((color) => (
    (color?.variants || []).map((variant) => variant.effectivePrice)
  )).filter((price) => Number.isFinite(price));

  if (prices.length === 0) {
    return Number(product?.basePrice || 0);
  }

  return Math.min(...prices);
};

export const getProductTotalStock = (product) => (
  (product?.colors || []).reduce((total, color) => (
    total + (color?.variants || []).reduce((variantTotal, variant) => variantTotal + Number(variant?.stock || 0), 0)
  ), 0)
);

export const getProductColorCount = (product) => product?.colors?.length || 0;

export const getProductAvailableSizes = (color) => (
  (color?.variants || []).map((variant) => variant.size).filter(Boolean)
);

export const mapProductToSummary = (product) => ({
  ...product,
  mainImage: product?.mainImage || product?.imageUrl || getProductMainImage(product),
  minPrice: Number(product?.minPrice ?? getProductMinPrice(product)),
  totalStock: getProductTotalStock(product),
  colorCount: getProductColorCount(product),
});

export const getApiErrorMessage = (err, fallbackMessage) => {
  const responseData = err?.response?.data;

  if (typeof responseData === 'string') return responseData;

  return responseData?.message || responseData?.error || fallbackMessage;
};
