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
    data?.data,
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
    data?.data,
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
  nameAr: category?.categoryNameAr || '',
  descriptionEn: category?.categoryDescriptionEn || category?.categoryDescription || '',
  descriptionAr: category?.categoryDescriptionAr || '',
  icon: category?.categoryIcon || category?.imageUrl || '',
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
  if (variant?.effectivePrice !== null && variant?.effectivePrice !== undefined && variant?.effectivePrice !== '') {
    return Number(variant.effectivePrice);
  }

  const override = variant?.price ?? variant?.priceOverride;
  return override !== null && override !== undefined && override !== ''
    ? Number(override)
    : Number(basePrice || 0);
};

export const normalizeVariant = (variant, basePrice) => ({
  id: String(variant?.variantId || variant?.id || ''),
  size: String(variant?.size || variant?.sizeName || ''),
  sku: variant?.sku || '',
  stock: Number(variant?.stock || 0),
  priceOverride: variant?.price ?? variant?.priceOverride ?? null,
  effectivePrice: getEffectiveVariantPrice(variant, basePrice),
});

export const normalizeColor = (color, basePrice) => ({
  id: String(color?.productColorId || color?.colorId || color?.id || ''),
  colorCode: color?.colorCode || '#111827',
  images: (color?.images || color?.imageUrls || []).map(normalizeProductImage).filter((image) => image.imageUrl),
  variants: (color?.variants || color?.productVariants || color?.variantList || []).map((variant) => normalizeVariant(variant, basePrice)),
  variantsCount: Number(color?.variantsCount ?? color?.variantCount ?? 0),
  totalStock: Number(color?.totalStock ?? 0),
});

export const normalizeProduct = (product) => {
  const basePrice = Number(product?.basePrice ?? product?.productPrice ?? product?.price ?? 0);
  const colors = (product?.colors || product?.productColors || product?.colorOptions || []).map((color) => normalizeColor(color, basePrice));
  const categoryNameEn = product?.categoryNameEn || product?.category?.categoryNameEn || product?.category?.name || product?.categoryName || '';
  const categoryNameAr = product?.categoryNameAr || product?.category?.categoryNameAr || '';
  const colorCount = Number(product?.currentColors ?? product?.colorCount ?? colors.length ?? 0);

  return {
    id: String(product?.id || product?.productId || ''),
    productName: product?.productName || product?.productNameEn || product?.name || '',
    productNameEn: product?.productNameEn || product?.productName || product?.name || '',
    productNameAr: product?.productNameAr || '',
    description: product?.description || product?.productDescriptionEn || product?.descriptionEn || '',
    descriptionEn: product?.productDescriptionEn || product?.descriptionEn || product?.description || '',
    descriptionAr: product?.productDescriptionAr || '',
    basePrice,
    brandName: product?.brand?.name || product?.brandName || '',
    categoryName: categoryNameEn || categoryNameAr || '',
    categoryNameEn,
    categoryNameAr,
    categoryId: String(product?.category?.id || product?.categoryId || ''),
    avgRating: Number(product?.rating?.avgRating || product?.avgRating || 0),
    ratingCount: Number(product?.rating?.ratingCount || product?.ratingCount || 0),
    thumbnail: product?.thumbnail || product?.thumbnailUrl || product?.imageUrl || '',
    colorCount,
    colors,
  };
};

export const getProductMainImage = (product) => (
  product?.thumbnail || product?.colors?.[0]?.images?.[0]?.imageUrl || ''
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

export const getProductColorCount = (product) => (
  Number(product?.colorCount ?? product?.currentColors ?? product?.colors?.length ?? 0)
);

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
