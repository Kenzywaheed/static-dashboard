import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  CheckCircleIcon,
  CubeIcon,
  PencilSquareIcon,
  PhotoIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { categoriesAPI, productsAPI } from '../services/endpoints';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import {
  getApiErrorMessage,
  mapProductToSummary,
  normalizeCategory,
  normalizeCategoryCollectionResponse,
  normalizeCollectionResponse,
  normalizeProduct,
} from '../services/productApiUtils';

const PAGE_SIZE = 6;

const EMPTY_PRODUCT_FORM = {
  productNameEn: '',
  productDescriptionEn: '',
  productNameAr: '',
  productDescriptionAr: '',
  categoryId: '',
  price: '',
  thumbnail: '',
  thumbnailFile: null,
};

const createEmptyVariantDraft = () => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  size: '',
  sku: '',
  stock: 0,
  priceOverride: '',
});

const createEmptyColorForm = () => ({
  colorCode: '#111827',
  images: [],
  imageFiles: [],
  variants: [createEmptyVariantDraft()],
});

const money = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
}).format(Number(value || 0));

const makeFileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`;

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const AddProduct = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const text = t.product;
  const brandId = user?.id || '';
  const thumbnailInputRef = useRef(null);
  const colorImagesInputRef = useRef(null);
  const isCatalogRoute = location.pathname === '/products' || location.pathname === '/products/view';
  const builderProductIdFromRoute = location.state?.productId || '';

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);
  const [colorForm, setColorForm] = useState(createEmptyColorForm);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [creatingColor, setCreatingColor] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productPage, setProductPage] = useState(1);
  const [activeProductId, setActiveProductId] = useState('');
  const [activeProductDetails, setActiveProductDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedColorId, setSelectedColorId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [currentBuilderProductId, setCurrentBuilderProductId] = useState('');

  const filteredProducts = useMemo(() => (
    products.filter((product) => {
      const matchesSearch = !productSearch.trim() || [
        product.productName,
        product.brandName,
        product.categoryName,
      ].some((value) => String(value || '').toLowerCase().includes(productSearch.trim().toLowerCase()));

      const matchesCategory = productCategoryFilter === 'all' || product.categoryId === productCategoryFilter;

      return matchesSearch && matchesCategory;
    })
  ), [productCategoryFilter, productSearch, products]);

  const totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const pagedProducts = useMemo(() => (
    filteredProducts.slice((productPage - 1) * PAGE_SIZE, productPage * PAGE_SIZE)
  ), [filteredProducts, productPage]);

  const selectedColor = useMemo(() => (
    activeProductDetails?.colors?.find((color) => color.id === selectedColorId) || activeProductDetails?.colors?.[0] || null
  ), [activeProductDetails, selectedColorId]);

  const selectedVariant = useMemo(() => (
    selectedColor?.variants?.find((variant) => variant.id === selectedVariantId)
    || selectedColor?.variants?.find((variant) => variant.stock > 0)
    || selectedColor?.variants?.[0]
    || null
  ), [selectedColor, selectedVariantId]);

  const loadProducts = async () => {
    setLoadingProducts(true);

    try {
      const { data } = await productsAPI.getAll({ page: 0, size: 100 });
      const nextProducts = normalizeCollectionResponse(data)
        .map(normalizeProduct)
        .map(mapProductToSummary);
      setProducts(nextProducts);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load products'));
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadCategories = async () => {
    if (!brandId) {
      setCategories([]);
      return;
    }

    setLoadingCategories(true);

    try {
      const { data } = await categoriesAPI.getAll({ brandId, page: 0, size: 100 });
      setCategories(normalizeCategoryCollectionResponse(data).map(normalizeCategory));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load categories'));
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadProductDetails = async (productId) => {
    if (!productId) return;

    setDetailsLoading(true);
    setActiveProductId(productId);

    try {
      const { data } = await productsAPI.getDetails(productId);
      const product = normalizeProduct(data?.data || data?.product || data);
      setActiveProductDetails(product);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load product details'));
      setActiveProductDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadCategories();
  }, [brandId]);

  useEffect(() => {
    setProductPage(1);
  }, [productCategoryFilter, productSearch]);

  useEffect(() => {
    if (productPage > totalProductPages) {
      setProductPage(totalProductPages);
    }
  }, [productPage, totalProductPages]);

  useEffect(() => {
    if (!activeProductDetails?.colors?.length) {
      setSelectedColorId('');
      setSelectedVariantId('');
      return;
    }

    const firstColor = activeProductDetails.colors[0];
    const firstVariant = firstColor.variants.find((variant) => variant.stock > 0) || firstColor.variants[0];

    setSelectedColorId(firstColor.id);
    setSelectedVariantId(firstVariant?.id || '');
  }, [activeProductDetails]);

  useEffect(() => {
    if (!selectedColor) {
      setSelectedVariantId('');
      return;
    }

    if (selectedColor.variants.some((variant) => variant.id === selectedVariantId)) {
      return;
    }

    const nextVariant = selectedColor.variants.find((variant) => variant.stock > 0) || selectedColor.variants[0];
    setSelectedVariantId(nextVariant?.id || '');
  }, [selectedColor, selectedVariantId]);

  useEffect(() => {
    if (!isCatalogRoute && currentBuilderProductId) {
      loadProductDetails(currentBuilderProductId);
    }
  }, [currentBuilderProductId, isCatalogRoute]);

  useEffect(() => {
    if (!isCatalogRoute && builderProductIdFromRoute) {
      setCurrentBuilderProductId(builderProductIdFromRoute);
    }
  }, [builderProductIdFromRoute, isCatalogRoute]);

  const updateProductField = (field, value) => {
    setProductForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const updateColorField = (field, value) => {
    setColorForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const updateVariantDraft = (variantId, field, value) => {
    setColorForm((currentForm) => ({
      ...currentForm,
      variants: currentForm.variants.map((variant) => (
        variant.id === variantId ? { ...variant, [field]: value } : variant
      )),
    }));
  };

  const addVariantDraft = () => {
    setColorForm((currentForm) => ({
      ...currentForm,
      variants: [...currentForm.variants, createEmptyVariantDraft()],
    }));
  };

  const removeVariantDraft = (variantId) => {
    setColorForm((currentForm) => ({
      ...currentForm,
      variants: currentForm.variants.filter((variant) => variant.id !== variantId),
    }));
  };

  const handleThumbnailChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const thumbnail = await readFileAsDataUrl(file);
    setProductForm((currentForm) => ({ ...currentForm, thumbnail, thumbnailFile: file }));
  };

  const handleColorImagesChange = async (event) => {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/'));
    if (files.length === 0) return;

    const sources = await Promise.all(files.map(readFileAsDataUrl));
    const entries = files.map((file, index) => ({
      id: makeFileKey(file),
      src: sources[index],
      file,
      fileKey: makeFileKey(file),
    }));

    setColorForm((currentForm) => ({
      ...currentForm,
      imageFiles: [...currentForm.imageFiles, ...entries.map((entry) => entry.file)],
      images: [...currentForm.images, ...entries.map(({ id, src, fileKey }) => ({ id, src, fileKey }))],
    }));

    event.target.value = '';
  };

  const removeColorImage = (imageId) => {
    setColorForm((currentForm) => {
      const removedImage = currentForm.images.find((image) => image.id === imageId);

      return {
        ...currentForm,
        images: currentForm.images.filter((image) => image.id !== imageId),
        imageFiles: removedImage?.fileKey
          ? currentForm.imageFiles.filter((file) => makeFileKey(file) !== removedImage.fileKey)
          : currentForm.imageFiles,
      };
    });
  };

  const resetBuilder = () => {
    setProductForm(EMPTY_PRODUCT_FORM);
    setColorForm(createEmptyColorForm());
    setCurrentBuilderProductId('');
  };

  const validateProduct = () => {
    if (!productForm.productNameEn.trim()) return text.errors.productNameEn || 'English product name is required';
    if (!productForm.productNameAr.trim()) return text.errors.productNameAr || 'Arabic product name is required';
    if (!productForm.productDescriptionEn.trim()) return text.errors.productDescriptionEn || 'English description is required';
    if (!productForm.productDescriptionAr.trim()) return text.errors.productDescriptionAr || 'Arabic description is required';
    if (!productForm.categoryId) return text.errors.category || 'Category is required';
    if (!productForm.price || Number(productForm.price) <= 0) return text.errors.price || 'Base price is required';
    if (!productForm.thumbnailFile) return text.errors.thumbnail || 'Thumbnail is required';
    return '';
  };

  const saveProduct = async () => {
    const validationError = validateProduct();

    if (validationError) {
      toast.error(validationError);
      return;
    }

    setCreatingProduct(true);

    try {
      const request = {
        productNameEn: productForm.productNameEn.trim(),
        productDescriptionEn: productForm.productDescriptionEn.trim(),
        productNameAr: productForm.productNameAr.trim(),
        productDescriptionAr: productForm.productDescriptionAr.trim(),
        productPrice: Number(productForm.price),
        categoryId: productForm.categoryId,
        thumbnail: productForm.thumbnailFile,
      };

      const { data } = await productsAPI.create(request);
      const productId = String(data?.productId || data?.id || '');

      setCurrentBuilderProductId(productId);
      toast.success(text.toasts.productSavedToApi || 'Product created. Add colors and variants next.');
      await loadProducts();

      if (productId) {
        await loadProductDetails(productId);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, text.toasts.productSaveFailed || 'Failed to create product'));
    } finally {
      setCreatingProduct(false);
    }
  };

  const validateColorForm = () => {
    if (!currentBuilderProductId) return text.errors.createProductFirst || 'Create the product first';
    if (!colorForm.colorCode.trim()) return text.errors.colorName || 'Color is required';
    if (colorForm.imageFiles.length === 0) return text.errors.itemImages || 'Add at least one image for this color';

    const validVariants = colorForm.variants.filter((variant) => variant.size.trim() && variant.sku.trim());

    if (validVariants.length === 0) {
      return text.errors.itemQuantity || 'Add at least one variant with size and SKU';
    }

    if (validVariants.some((variant) => Number(variant.stock) < 0)) {
      return 'Variant stock cannot be negative';
    }

    return '';
  };

  const saveColorAndVariants = async () => {
    const validationError = validateColorForm();

    if (validationError) {
      toast.error(validationError);
      return;
    }

    setCreatingColor(true);

    try {
      const { data } = await productsAPI.createColor(currentBuilderProductId, {
        colorCode: colorForm.colorCode,
        images: colorForm.imageFiles,
      });

      const colorId = String(data?.productColorId || data?.colorId || data?.id || '');
      const validVariants = colorForm.variants.filter((variant) => variant.size.trim() && variant.sku.trim());

      await Promise.all(validVariants.map((variant) => (
        productsAPI.createVariant(currentBuilderProductId, colorId, {
          size: variant.size.trim(),
          sku: variant.sku.trim(),
          stock: Number(variant.stock || 0),
          priceOverride: variant.priceOverride === '' ? null : Number(variant.priceOverride),
        })
      )));

      toast.success('Color and variants saved');
      setColorForm(createEmptyColorForm());
      await loadProducts();
      await loadProductDetails(currentBuilderProductId);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create color and variants'));
    } finally {
      setCreatingColor(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm(text.deleteProductConfirm || 'Delete this product?')) return;

    setDeletingProductId(productId);

    try {
      await productsAPI.remove(productId);
      toast.success(text.toasts.productRemoved || 'Product deleted');
      setProducts((currentProducts) => currentProducts.filter((product) => product.id !== productId));

      if (activeProductId === productId) {
        setActiveProductId('');
        setActiveProductDetails(null);
      }

      if (currentBuilderProductId === productId) {
        resetBuilder();
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete product'));
    } finally {
      setDeletingProductId('');
    }
  };

  const openBuilderForProduct = (productId) => {
    navigate('/products/add', { state: { productId } });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-950 dark:text-white">{isCatalogRoute ? 'Products' : text.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500 dark:text-gray-400">
            {isCatalogRoute
              ? 'Products now load from the real backend. Color images and size options come from product details, not local mock data.'
              : 'Create the base product first, then add one color at a time with its own images and sellable variants.'}
          </p>
        </div>
        <button type="button" onClick={resetBuilder} className="w-fit rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-800 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800">
          {text.newProduct}
        </button>
      </div>

      {isCatalogRoute ? (
        <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
              <input
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder={text.searchProducts || 'Search products'}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <select
                value={productCategoryFilter}
                onChange={(event) => setProductCategoryFilter(event.target.value)}
                disabled={loadingCategories}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="all">{text.allCategories || 'All categories'}</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </div>

            <div className="mt-6 space-y-4">
              {loadingProducts ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">Loading products...</div>
              ) : pagedProducts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
                  <CubeIcon className="mx-auto h-12 w-12 text-slate-400" />
                  <p className="mt-4 font-bold text-slate-900 dark:text-white">{text.noProducts || 'No products yet'}</p>
                </div>
              ) : pagedProducts.map((product) => (
                <article key={product.id} className={`rounded-3xl border p-4 transition ${activeProductId === product.id ? 'border-blue-300 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20' : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/30'}`}>
                  <div className="grid gap-4 md:grid-cols-[110px_minmax(0,1fr)_auto] md:items-center">
                    <button type="button" onClick={() => loadProductDetails(product.id)} className="h-28 w-28 overflow-hidden rounded-2xl bg-slate-200 text-left dark:bg-slate-800">
                      {product.mainImage ? (
                        <img src={product.mainImage} alt={product.productName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400"><PhotoIcon className="h-10 w-10" /></div>
                      )}
                    </button>

                    <div className="min-w-0">
                      <button type="button" onClick={() => loadProductDetails(product.id)} className="text-left">
                        <h2 className="truncate text-lg font-bold text-slate-950 dark:text-white">{product.productName}</h2>
                      </button>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{product.brandName || 'Unbranded'}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                        <span className="rounded-full bg-white px-3 py-1.5 text-slate-700 dark:bg-slate-900 dark:text-slate-200">{product.categoryName || 'Uncategorized'}</span>
                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">{money(product.minPrice)}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{product.totalStock} {text.pieces || 'pcs'}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-amber-700 dark:bg-amber-950 dark:text-amber-200">
                          <StarIcon className="h-4 w-4" />
                          {product.avgRating.toFixed(1)} ({product.ratingCount})
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      <button type="button" onClick={() => openBuilderForProduct(product.id)} className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white transition hover:bg-blue-700">
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button type="button" disabled={deletingProductId === product.id} onClick={() => deleteProduct(product.id)} className="grid h-11 w-11 place-items-center rounded-2xl border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {filteredProducts.length > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">Page {productPage} of {totalProductPages}</p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setProductPage((currentPage) => Math.max(1, currentPage - 1))} disabled={productPage === 1} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">Previous</button>
                  <button type="button" onClick={() => setProductPage((currentPage) => Math.min(totalProductPages, currentPage + 1))} disabled={productPage === totalProductPages} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">Next</button>
                </div>
              </div>
            )}
          </div>

          <ProductDetailsPanel
            product={activeProductDetails}
            loading={detailsLoading}
            selectedColorId={selectedColorId}
            selectedVariantId={selectedVariantId}
            selectedColor={selectedColor}
            selectedVariant={selectedVariant}
            onSelectColor={setSelectedColorId}
            onSelectVariant={setSelectedVariantId}
          />
        </section>
      ) : (
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_430px]">
          <section className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950 dark:text-white">1. Product</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create the base product record first.</p>
                </div>
                {currentBuilderProductId && <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">Saved</span>}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.productNameEn || 'Product name EN'}</span>
                  <input value={productForm.productNameEn} onChange={(event) => updateProductField('productNameEn', event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.productNameAr || 'Product name AR'}</span>
                  <input value={productForm.productNameAr} onChange={(event) => updateProductField('productNameAr', event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.descriptionEn || 'Description EN'}</span>
                  <textarea value={productForm.productDescriptionEn} onChange={(event) => updateProductField('productDescriptionEn', event.target.value)} rows={4} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.descriptionAr || 'Description AR'}</span>
                  <textarea value={productForm.productDescriptionAr} onChange={(event) => updateProductField('productDescriptionAr', event.target.value)} rows={4} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.category}</span>
                  <select value={productForm.categoryId} onChange={(event) => updateProductField('categoryId', event.target.value)} disabled={loadingCategories} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                    <option value="">{text.chooseCategory || 'Choose category'}</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.basePrice || 'Base price'}</span>
                  <input type="number" min="0" value={productForm.price} onChange={(event) => updateProductField('price', event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                </label>
              </div>

              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-5 dark:border-slate-700">
                <div className="flex flex-wrap items-center gap-4">
                  <button type="button" onClick={() => thumbnailInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                    <PhotoIcon className="h-5 w-5" />
                    {text.uploadThumbnail || 'Upload product thumbnail'}
                  </button>
                  <input ref={thumbnailInputRef} type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" />
                  {productForm.thumbnail && <img src={productForm.thumbnail} alt="" className="h-16 w-16 rounded-2xl object-cover" />}
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button type="button" disabled={creatingProduct} onClick={saveProduct} className="rounded-2xl bg-blue-600 px-7 py-3 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50">
                  {creatingProduct ? (text.creatingProduct || 'Creating product...') : (text.saveAndAddItems || 'Save product and add colors')}
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950 dark:text-white">2. Color And Variants</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Every color owns its images, and every variant under it owns size, stock, SKU, and optional price override.</p>
                </div>
                {currentBuilderProductId && (
                  <button type="button" onClick={() => loadProductDetails(currentBuilderProductId)} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                    Refresh details
                  </button>
                )}
              </div>

              <div className="grid gap-5">
                <label className="block">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Color code</span>
                  <div className="mt-2 flex gap-3">
                    <input type="color" value={colorForm.colorCode} onChange={(event) => updateColorField('colorCode', event.target.value)} className="h-12 w-16 cursor-pointer rounded-lg border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-950" />
                    <input value={colorForm.colorCode} onChange={(event) => updateColorField('colorCode', event.target.value)} className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                  </div>
                </label>

                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-bold text-slate-950 dark:text-white">Color images</h3>
                    <button type="button" onClick={() => colorImagesInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                      <PlusIcon className="h-4 w-4" />
                      {text.addImages || 'Add images'}
                    </button>
                  </div>
                  <input ref={colorImagesInputRef} type="file" accept="image/*" multiple onChange={handleColorImagesChange} className="hidden" />
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {colorForm.images.map((image) => (
                      <div key={image.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-950">
                        <img src={image.src} alt="" className="h-full w-full object-cover" />
                        <button type="button" onClick={() => removeColorImage(image.id)} className="absolute right-2 top-2 rounded-xl bg-red-600 p-2 text-white opacity-0 transition group-hover:opacity-100">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {colorForm.images.length === 0 && (
                      <button type="button" onClick={() => colorImagesInputRef.current?.click()} className="aspect-square rounded-2xl border border-dashed border-slate-300 text-slate-400 transition hover:border-blue-500 hover:text-blue-500 dark:border-slate-700">
                        <PhotoIcon className="mx-auto h-9 w-9" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-950 dark:text-white">Variants</h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">No fixed size list here. Add whatever sizes the backend returns or needs.</p>
                    </div>
                    <button type="button" onClick={addVariantDraft} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                      <PlusIcon className="h-4 w-4" />
                      Add variant
                    </button>
                  </div>

                  <div className="space-y-4">
                    {colorForm.variants.map((variant, index) => (
                      <div key={variant.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                        <div className="mb-4 flex items-center justify-between">
                          <p className="font-bold text-slate-950 dark:text-white">Variant {index + 1}</p>
                          {colorForm.variants.length > 1 && (
                            <button type="button" onClick={() => removeVariantDraft(variant.id)} className="rounded-xl border border-red-200 px-3 py-1.5 text-sm font-bold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950">
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                          <label className="block">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.size || 'Size'}</span>
                            <input value={variant.size} onChange={(event) => updateVariantDraft(variant.id, 'size', event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" placeholder="S, M, 42, One Size..." />
                          </label>
                          <label className="block">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.sku}</span>
                            <input value={variant.sku} onChange={(event) => updateVariantDraft(variant.id, 'sku', event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                          </label>
                          <label className="block">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Stock</span>
                            <input type="number" min="0" value={variant.stock} onChange={(event) => updateVariantDraft(variant.id, 'stock', event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                          </label>
                          <label className="block">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Price override</span>
                            <input type="number" min="0" value={variant.priceOverride} onChange={(event) => updateVariantDraft(variant.id, 'priceOverride', event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" placeholder="Optional" />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button type="button" disabled={creatingColor || !currentBuilderProductId} onClick={saveColorAndVariants} className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-7 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-50">
                  <CheckCircleIcon className="h-5 w-5" />
                  {creatingColor ? 'Saving color...' : 'Save color and variants'}
                </button>
              </div>
            </div>
          </section>

          <ProductDetailsPanel
            product={activeProductDetails}
            loading={detailsLoading}
            selectedColorId={selectedColorId}
            selectedVariantId={selectedVariantId}
            selectedColor={selectedColor}
            selectedVariant={selectedVariant}
            onSelectColor={setSelectedColorId}
            onSelectVariant={setSelectedVariantId}
            emptyMessage={currentBuilderProductId ? 'Product saved. Load details to preview its live colors and variants.' : 'Create a product to preview its live detail response.'}
          />
        </div>
      )}
    </div>
  );
};

const ProductDetailsPanel = ({
  product,
  loading,
  selectedColorId,
  selectedVariantId,
  selectedColor,
  selectedVariant,
  onSelectColor,
  onSelectVariant,
  emptyMessage = 'Choose a product to inspect its live backend details.',
}) => {
  if (loading) {
    return <aside className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Loading product details...</aside>;
  }

  if (!product) {
    return (
      <aside className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        {emptyMessage}
      </aside>
    );
  }

  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div>
        <p className="text-sm font-medium text-[var(--brand-primary)]">Live product details</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{product.productName}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{product.description || 'No description available.'}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{product.brandName || 'Unbranded'}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{product.categoryName || 'Uncategorized'}</span>
        <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700 dark:bg-amber-950 dark:text-amber-200">{product.avgRating.toFixed(1)} rating ({product.ratingCount})</span>
      </div>

      <div className="mt-8">
        <h3 className="font-bold text-slate-950 dark:text-white">Colors</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          {product.colors.map((color) => (
            <button
              key={color.id}
              type="button"
              onClick={() => onSelectColor(color.id)}
              className={`h-11 w-11 rounded-full border-2 transition ${selectedColorId === color.id ? 'border-slate-950 shadow-lg dark:border-white' : 'border-slate-300 dark:border-slate-700'}`}
              style={{ backgroundColor: color.colorCode }}
              title={color.colorCode}
            />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="font-bold text-slate-950 dark:text-white">Images for selected color</h3>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {selectedColor?.images?.length ? selectedColor.images.map((image) => (
            <div key={image.id} className="aspect-square overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-950">
              <img src={image.imageUrl} alt="" className="h-full w-full object-cover" />
            </div>
          )) : (
            <div className="col-span-2 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No images found for this color.
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="font-bold text-slate-950 dark:text-white">Sizes</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedColor?.variants?.map((variant) => (
            <button
              key={variant.id}
              type="button"
              disabled={variant.stock === 0}
              onClick={() => onSelectVariant(variant.id)}
              className={`rounded-2xl border px-4 py-2 text-sm font-bold transition ${
                selectedVariantId === variant.id
                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-100'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
              } disabled:cursor-not-allowed disabled:opacity-45`}
            >
              {variant.size}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-slate-50 p-5 dark:bg-slate-950">
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoTile label="Variant ID" value={selectedVariant?.id || '-'} />
          <InfoTile label="SKU" value={selectedVariant?.sku || '-'} />
          <InfoTile label="Stock" value={String(selectedVariant?.stock ?? 0)} />
          <InfoTile label="Effective price" value={money(selectedVariant?.effectivePrice || product.basePrice)} />
        </div>
      </div>
    </aside>
  );
};

const InfoTile = ({ label, value }) => (
  <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
    <p className="mt-2 break-all text-sm font-medium text-slate-900 dark:text-white">{value}</p>
  </div>
);

export default AddProduct;
