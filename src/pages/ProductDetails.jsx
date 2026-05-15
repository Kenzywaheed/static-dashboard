import { useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { productsAPI } from '../services/endpoints';
import { useLanguage } from '../hooks/useLanguage';
import {
  getApiErrorMessage,
  mapProductToSummary,
  normalizeCollectionResponse,
  normalizeColor,
  normalizeProduct,
} from '../services/productApiUtils';
import {
  deleteWorkspaceColor,
  getWorkspaceProduct,
  saveWorkspaceColor,
} from '../services/productWorkspaceStore';

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const makeFileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`;

const softenColor = (hex, ratio = 0.84) => {
  const normalized = String(hex || '').replace('#', '').trim();
  const full = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized;

  if (!/^[\da-fA-F]{6}$/.test(full)) {
    return '#f3f4f6';
  }

  const channels = [0, 2, 4].map((index) => parseInt(full.slice(index, index + 2), 16));
  const blended = channels.map((channel) => Math.round(channel * (1 - ratio) + 255 * ratio));
  return `rgb(${blended.join(', ')})`;
};

const formatCurrency = (value, language) => {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return language === 'ar' ? 'Not returned yet' : 'Not returned yet';
  }

  try {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(0)}`;
  }
};

const mergeColorCollections = (apiColors = [], workspaceColors = []) => {
  const colorMap = new Map();

  [...apiColors, ...workspaceColors].forEach((color, index) => {
    const key = String(color?.id || `${color?.colorCode || 'color'}-${index}`);
    const existing = colorMap.get(key);

    if (!existing) {
      colorMap.set(key, {
        ...color,
        id: key,
        images: color?.images || [],
        variants: color?.variants || [],
        variantsCount: Number(color?.variantsCount ?? color?.variants?.length ?? 0),
        totalStock: Number(color?.totalStock ?? 0),
      });
      return;
    }

    colorMap.set(key, {
      ...existing,
      ...color,
      images: (color?.images && color.images.length) ? color.images : existing.images || [],
      variants: (color?.variants && color.variants.length) ? color.variants : existing.variants || [],
      variantsCount: Number(color?.variantsCount ?? existing.variantsCount ?? color?.variants?.length ?? existing.variants?.length ?? 0),
      totalStock: Number(color?.totalStock ?? existing.totalStock ?? 0),
    });
  });

  return Array.from(colorMap.values());
};

const getDisplayName = (product, language) => {
  if (!product) return '';

  if (language === 'ar') {
    return product.productNameAr || product.productNameEn || product.productName || '';
  }

  return product.productNameEn || product.productName || product.productNameAr || '';
};

const getCategoryName = (product, language) => {
  if (!product) return '';

  if (language === 'ar') {
    return product.categoryNameAr || product.categoryNameEn || product.categoryName || '';
  }

  return product.categoryNameEn || product.categoryName || product.categoryNameAr || '';
};

const ProductDetails = () => {
  const queryClient = useQueryClient();
  const { language, t } = useLanguage();
  const text = t.product;
  const navigate = useNavigate();
  const location = useLocation();
  const { productId } = useParams();
  const colorImagesInputRef = useRef(null);

  const [creatingColor, setCreatingColor] = useState(false);
  const [deletingColorId, setDeletingColorId] = useState('');
  const [colorForm, setColorForm] = useState({
    colorCode: '#8a7967',
    images: [],
    imageFiles: [],
  });

  const ui = language === 'ar'
    ? {
      title: 'Manage Product Colors',
      subtitle: 'Add a new color to this product, upload its images, then move directly into the size and stock step for that color.',
      back: 'Back to all products',
      productLabel: 'Product',
      categoryLabel: 'Category',
      priceLabel: 'Base price',
      colorsLabel: 'Current colors',
      noProduct: 'This product could not be loaded. Go back to All Products and open it again.',
      addColorTitle: 'Add New Color',
      addColorHelp: 'Choose the color code, upload its images, and after save you will move to the variant page for that color.',
      colorCode: 'Color code',
      colorCodeHelp: 'Pick the color clearly. The preview stays soft even when the chosen color is strong.',
      colorPreview: 'Color preview',
      colorPreviewHelp: 'This preview is here only to make the workspace easier to scan.',
      colorImages: 'Color images',
      colorImagesHelp: 'Upload one or more images for the same color.',
      addImages: 'Add images',
      noImages: 'No images added for this color yet.',
      imageCount: 'Image count',
      saveColor: 'Save color and continue to sizes',
      savingColor: 'Saving color...',
      deleting: 'Deleting...',
      currentColors: 'Colors on this product',
      noColors: 'No colors saved on this product yet.',
      openVariants: 'Open sizes',
      deleteColor: 'Delete color',
      deleteColorConfirm: 'Delete this color?',
      notReturned: 'Not returned yet',
      nextStep: 'After saving this color, you go directly to its size page.',
      apiColorCountOnly: 'This list API returns the total color count only, not full color details. Color cards will appear here after you manage them in this workspace or when a detailed endpoint is available.',
    }
    : {
      title: 'Manage Product Colors',
      subtitle: 'Add a new color to this product, upload its images, then move directly into the size and stock step for that color.',
      back: 'Back to all products',
      productLabel: 'Product',
      categoryLabel: 'Category',
      priceLabel: 'Base price',
      colorsLabel: 'Current colors',
      noProduct: 'This product could not be loaded. Go back to All Products and open it again.',
      addColorTitle: 'Add New Color',
      addColorHelp: 'Choose the color code, upload its images, and after save you will move to the variant page for that color.',
      colorCode: 'Color code',
      colorCodeHelp: 'Pick the color clearly. The preview stays soft even when the chosen color is strong.',
      colorPreview: 'Color preview',
      colorPreviewHelp: 'This preview is here only to make the workspace easier to scan.',
      colorImages: 'Color images',
      colorImagesHelp: 'Upload one or more images for the same color.',
      addImages: 'Add images',
      noImages: 'No images added for this color yet.',
      imageCount: 'Image count',
      saveColor: 'Save color and continue to sizes',
      savingColor: 'Saving color...',
      deleting: 'Deleting...',
      currentColors: 'Colors on this product',
      noColors: 'No colors saved on this product yet.',
      openVariants: 'Open sizes',
      deleteColor: 'Delete color',
      deleteColorConfirm: 'Delete this color?',
      notReturned: 'Not returned yet',
      nextStep: 'After saving this color, you go directly to its size page.',
      apiColorCountOnly: 'This list API returns the total color count only, not full color details. Color cards will appear here after you manage them in this workspace or when a detailed endpoint is available.',
    };

  const {
    data: products = [],
    isLoading: loadingProduct,
  } = useQuery({
    queryKey: ['brand-products-color-step'],
    queryFn: async () => {
      const response = await productsAPI.getAll({ page: 0, size: 100 });
      return normalizeCollectionResponse(response.data)
        .map(normalizeProduct)
        .map(mapProductToSummary);
    },
  });

  const currentProduct = useMemo(() => {
    const foundProduct = products.find((product) => product.id === productId);

    if (foundProduct) {
      return foundProduct;
    }

    if (!productId) {
      return null;
    }

    return {
      id: productId,
      productName: location.state?.productName || '',
      productNameEn: location.state?.productNameEn || location.state?.productName || '',
      productNameAr: location.state?.productNameAr || '',
      categoryName: location.state?.categoryName || '',
      categoryNameEn: location.state?.categoryNameEn || location.state?.categoryName || '',
      categoryNameAr: location.state?.categoryNameAr || '',
      basePrice: Number(location.state?.basePrice || 0),
      mainImage: location.state?.thumbnail || '',
      colorCount: Number(location.state?.currentColors || 0),
      colors: [],
    };
  }, [location.state, productId, products]);

  const {
    data: apiColors = [],
    isLoading: loadingColors,
  } = useQuery({
    queryKey: ['brand-product-colors', productId, currentProduct?.basePrice || 0],
    enabled: Boolean(productId),
    queryFn: async () => {
      const response = await productsAPI.getColors(productId);
      return (response.data || []).map((color) => normalizeColor(color, currentProduct?.basePrice || 0));
    },
  });

  const workspace = useMemo(() => (
    currentProduct ? getWorkspaceProduct(currentProduct.id) : { colors: [] }
  ), [currentProduct]);

  const currentColors = useMemo(() => (
    mergeColorCollections(apiColors, workspace.colors || [])
  ), [apiColors, workspace.colors]);

  const handleColorImagesChange = async (event) => {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/'));

    if (!files.length) {
      return;
    }

    const sources = await Promise.all(files.map(readFileAsDataUrl));
    const mappedFiles = files.map((file, index) => ({
      id: makeFileKey(file),
      src: sources[index],
      file,
      fileKey: makeFileKey(file),
    }));

    setColorForm((current) => ({
      ...current,
      imageFiles: [...current.imageFiles, ...mappedFiles.map((entry) => entry.file)],
      images: [...current.images, ...mappedFiles.map(({ id, src, fileKey }) => ({ id, src, fileKey }))],
    }));

    event.target.value = '';
  };

  const removeColorImage = (imageId) => {
    setColorForm((current) => {
      const removedImage = current.images.find((image) => image.id === imageId);

      return {
        ...current,
        images: current.images.filter((image) => image.id !== imageId),
        imageFiles: removedImage?.fileKey
          ? current.imageFiles.filter((file) => makeFileKey(file) !== removedImage.fileKey)
          : current.imageFiles,
      };
    });
  };

  const refreshProductQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['brand-product-colors', productId] }),
      queryClient.invalidateQueries({ queryKey: ['brand-products'] }),
      queryClient.invalidateQueries({ queryKey: ['brand-products-color-step'] }),
      queryClient.invalidateQueries({ queryKey: ['brand-dashboard-home'] }),
    ]);
  };

  const saveColor = async () => {
    if (!currentProduct?.id) {
      toast.error(text.errors.createProductFirst || 'Choose a product first');
      return;
    }

    if (!colorForm.colorCode.trim()) {
      toast.error(text.errors.colorName || 'Color is required');
      return;
    }

    if (!colorForm.imageFiles.length) {
      toast.error(text.errors.itemImages || 'Add images for the color');
      return;
    }

    setCreatingColor(true);

    try {
      const { data } = await productsAPI.createColor(currentProduct.id, {
        colorCode: colorForm.colorCode,
        colorImages: colorForm.imageFiles,
      });

      const colorId = String(data?.productColorId || data?.colorId || data?.id || `${Date.now()}`);

      saveWorkspaceColor(currentProduct.id, {
        id: colorId,
        colorCode: colorForm.colorCode,
        images: colorForm.images.map((image, index) => ({
          id: `${colorId}-img-${index}`,
          imageUrl: image.src,
        })),
        variants: [],
      });

      await refreshProductQueries();
      toast.success(text.toasts.itemAdded || 'Color added');
      navigate(`/products/${currentProduct.id}/colors/${colorId}/variants`, {
        state: {
          productName: getDisplayName(currentProduct, language),
          colorCode: colorForm.colorCode,
        },
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create color'));
    } finally {
      setCreatingColor(false);
    }
  };

  const deleteColor = async (colorId) => {
    if (!currentProduct?.id || !colorId) {
      return;
    }

    if (!window.confirm(ui.deleteColorConfirm)) {
      return;
    }

    setDeletingColorId(colorId);

    try {
      await productsAPI.removeColor(currentProduct.id, colorId);
      deleteWorkspaceColor(currentProduct.id, colorId);
      await refreshProductQueries();
      toast.success(ui.deleteColor);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete color'));
    } finally {
      setDeletingColorId('');
    }
  };

  const previewBackground = softenColor(colorForm.colorCode);
  const productName = getDisplayName(currentProduct, language);
  const productCategory = getCategoryName(currentProduct, language) || ui.notReturned;
  const productPrice = formatCurrency(currentProduct?.basePrice, language);
  const visibleColorCount = Math.max(Number(currentProduct?.colorCount || 0), apiColors.length, currentColors.length);

  if (!loadingProduct && !currentProduct?.id) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">{ui.noProduct}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950 dark:text-white">{ui.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">{ui.subtitle}</p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/products/view')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            {ui.back}
          </button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-[var(--brand-primary)]">{ui.productLabel}</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{productName || (loadingProduct ? '...' : ui.notReturned)}</h2>

          {currentProduct?.mainImage ? (
            <div className="mt-4 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-950">
              <img src={currentProduct.mainImage} alt={productName} className="aspect-[4/3] w-full object-cover" />
            </div>
          ) : (
            <div className="mt-4 flex aspect-[4/3] items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-950">
              <PhotoIcon className="h-8 w-8" />
            </div>
          )}

          <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
            <InfoRow label={ui.categoryLabel} value={productCategory} />
            <InfoRow label={ui.priceLabel} value={productPrice} />
            <InfoRow label={ui.colorsLabel} value={String(visibleColorCount)} />
          </div>

          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            {ui.nextStep}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xl font-bold text-slate-950 dark:text-white">{ui.addColorTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{ui.addColorHelp}</p>

            <div className="mt-5 grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
              <div className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                <Field label={ui.colorCode} help={ui.colorCodeHelp}>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={colorForm.colorCode}
                      onChange={(event) => setColorForm((current) => ({ ...current, colorCode: event.target.value }))}
                      className="h-12 w-16 rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
                    />
                    <input
                      value={colorForm.colorCode}
                      onChange={(event) => setColorForm((current) => ({ ...current, colorCode: event.target.value }))}
                      className={inputClassName}
                    />
                  </div>
                </Field>

                <div
                  className="rounded-3xl border p-4"
                  style={{
                    backgroundColor: previewBackground,
                    borderColor: softenColor(colorForm.colorCode, 0.72),
                  }}
                >
                  <p className="text-sm font-semibold text-slate-800">{ui.colorPreview}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{ui.colorPreviewHelp}</p>
                  <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3">
                    <span
                      className="h-8 w-8 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: colorForm.colorCode }}
                    />
                    <span className="text-sm font-semibold text-slate-900">{colorForm.colorCode}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-slate-950 dark:text-white">{ui.colorImages}</h4>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{ui.colorImagesHelp}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => colorImagesInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <PlusIcon className="h-4 w-4" />
                    {ui.addImages}
                  </button>
                </div>

                <input
                  ref={colorImagesInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleColorImagesChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => colorImagesInputRef.current?.click()}
                  className="mt-4 flex min-h-[190px] w-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center transition hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)]/20 dark:border-slate-700 dark:bg-slate-900"
                >
                  <PhotoIcon className="h-10 w-10 text-slate-400" />
                  <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">{ui.addImages}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{ui.noImages}</p>
                </button>

                {colorForm.images.length > 0 && (
                  <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-3">
                    {colorForm.images.map((image) => (
                      <div key={image.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                        <div className="relative">
                          <img src={image.src} alt="" className="aspect-[4/3] w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeColorImage(image.id)}
                            className="absolute right-3 top-3 rounded-xl bg-white/95 p-2 text-red-600 opacity-0 shadow-sm transition group-hover:opacity-100"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                          <span>{ui.imageCount}</span>
                          <span>{colorForm.images.length}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    disabled={creatingColor}
                    onClick={saveColor}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-dark)] disabled:opacity-50"
                  >
                    {creatingColor ? ui.savingColor : ui.saveColor}
                    <ArrowRightIcon className={`h-4 w-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-bold text-slate-950 dark:text-white">{ui.currentColors}</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {visibleColorCount}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {loadingColors ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Loading colors...
                </div>
              ) : currentColors.length === 0 && visibleColorCount > 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm leading-6 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  {ui.apiColorCountOnly}
                </div>
              ) : currentColors.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  {ui.noColors}
                </div>
              ) : currentColors.map((color) => (
                <div key={color.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="inline-flex items-center gap-3">
                        <span className="h-6 w-6 rounded-full border border-white shadow-sm" style={{ backgroundColor: color.colorCode }} />
                        <div>
                          <p className="font-semibold text-slate-950 dark:text-white">{color.colorCode}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {Number(color.variantsCount ?? color.variants?.length ?? 0)} {language === 'ar' ? 'saved sizes' : 'saved sizes'}
                          </p>
                        </div>
                      </div>

                      {color.images?.[0]?.imageUrl && (
                        <div className="mt-3 overflow-hidden rounded-2xl" style={{ backgroundColor: softenColor(color.colorCode, 0.9) }}>
                          <img src={color.images[0].imageUrl} alt={color.colorCode} className="aspect-[4/3] w-full object-cover" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/products/${currentProduct.id}/colors/${color.id}/variants`, {
                          state: {
                            productName,
                            colorCode: color.colorCode,
                          },
                        })}
                        className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-dark)]"
                      >
                        {ui.openVariants}
                      </button>
                      <button
                        type="button"
                        disabled={deletingColorId === color.id}
                        onClick={() => deleteColor(color.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950"
                      >
                        {deletingColorId === color.id ? ui.deleting : ui.deleteColor}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
};

const Field = ({ label, help, children }) => (
  <label className="block">
    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
    {help && <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{help}</p>}
    <div className="mt-2">{children}</div>
  </label>
);

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 text-sm">
    <span className="text-slate-500 dark:text-slate-400">{label}</span>
    <span className="font-semibold text-slate-900 dark:text-white">{value}</span>
  </div>
);

const inputClassName = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary-soft)] dark:border-slate-700 dark:bg-slate-950 dark:text-white';

export default ProductDetails;
