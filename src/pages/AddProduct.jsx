import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CubeIcon,
  PencilSquareIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { categoriesAPI, productsAPI } from '../services/endpoints';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import {
  PRODUCT_SIZES,
  createLocalProduct,
  createLocalProductItem,
  getEmptySizeMap,
  getProductColors,
  getProductItemStock,
  getProductStock,
  loadSavedProducts,
  saveProducts,
  toBackendProductItemPayload,
  toBackendProductPayload,
} from '../services/productCatalogStore';

const EMPTY_PRODUCT_FORM = {
  productNameEn: '',
  productDescriptionEn: '',
  productNameAr: '',
  productDescriptionAr: '',
  categoryId: '',
  categoryName: '',
  price: '',
  thumbnail: '',
  thumbnailFile: null,
};

const EMPTY_ITEM_FORM = {
  colorName: '',
  colorHex: '#111827',
  sku: '',
  price: '',
  images: [],
  imageFiles: [],
  sizes: getEmptySizeMap(),
};

const DEMO_CATEGORIES = [
  { id: 'demo-category-shoes', name: 'Shoes / أحذية' },
  { id: 'demo-category-hoodies', name: 'Hoodies / هوديز' },
  { id: 'demo-category-bags', name: 'Bags / شنط' },
];

const DEMO_PRODUCTS = [
  createLocalProduct({
    id: 'demo-product-hoodie',
    productNameEn: 'Oversized Cotton Hoodie',
    productDescriptionEn: 'Heavy cotton hoodie with relaxed fit and two stocked color items.',
    productNameAr: 'هودي قطن واسع',
    productDescriptionAr: 'هودي قطن تقيل بقصة واسعة، متاح بألوان ومقاسات مختلفة.',
    categoryId: 'demo-category-hoodies',
    categoryName: 'Hoodies / هوديز',
    price: 1250,
    thumbnail: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80',
    thumbnailFile: null,
    productItems: [
      createLocalProductItem({
        id: 'demo-product-hoodie-black',
        colorName: 'Black',
        colorHex: '#111827',
        sku: 'HD-BLK-001',
        price: 1250,
        stock: 17,
        sizes: { ...getEmptySizeMap(), M: 10, L: 7 },
        images: [
          { id: 'demo-product-hoodie-black-image', src: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=900&q=80' },
        ],
        imageFiles: [],
      }),
      createLocalProductItem({
        id: 'demo-product-hoodie-blue',
        colorName: 'Blue',
        colorHex: '#2563eb',
        sku: 'HD-BLU-002',
        price: 1250,
        stock: 12,
        sizes: { ...getEmptySizeMap(), S: 4, M: 8 },
        images: [
          { id: 'demo-product-hoodie-blue-image', src: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80' },
        ],
        imageFiles: [],
      }),
    ],
    status: 'demo',
    syncedWithApi: false,
  }),
  createLocalProduct({
    id: 'demo-product-sneaker',
    productNameEn: 'Everyday Leather Sneaker',
    productDescriptionEn: 'Clean sneaker example with size stock ready to mirror backend ProductItem data.',
    productNameAr: 'سنيكر جلد يومي',
    productDescriptionAr: 'مثال لسنيكر بمخزون مقاسات واضح زي داتا الباك إند.',
    categoryId: 'demo-category-shoes',
    categoryName: 'Shoes / أحذية',
    price: 2100,
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
    thumbnailFile: null,
    productItems: [
      createLocalProductItem({
        id: 'demo-product-sneaker-white',
        colorName: 'White',
        colorHex: '#f8fafc',
        sku: 'SN-WHT-110',
        price: 2100,
        stock: 19,
        sizes: { ...getEmptySizeMap(), S: 5, M: 9, L: 5 },
        images: [
          { id: 'demo-product-sneaker-white-image', src: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=80' },
        ],
        imageFiles: [],
      }),
    ],
    status: 'demo',
    syncedWithApi: false,
  }),
];

const makeFileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`;

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const normalizeCategory = (category) => ({
  id: String(category.id || category.categoryId || ''),
  name: category.categoryNameEn || category.categoryName || category.name || '',
});

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

const normalizeCategoriesResponse = (data) => (
  [
    data?.content,
    data?.categories,
    data?.data?.content,
    data?.data?.categories,
    data?.items,
    data?.result,
    findFirstArrayInObject(data),
    Array.isArray(data) ? data : null,
  ].find(Array.isArray) || []
);

const normalizeProductsResponse = normalizeCategoriesResponse;

const normalizeSizeMap = (sizeList = []) => {
  const sizes = getEmptySizeMap();
  const entries = Array.isArray(sizeList)
    ? sizeList
    : Object.entries(sizeList || {}).map(([sizeName, stock]) => ({ sizeName, stock }));

  entries.forEach((sizeEntry) => {
    const sizeName = sizeEntry?.sizeName || sizeEntry?.size || sizeEntry?.name;

    if (!sizeName) {
      return;
    }

    sizes[sizeName] = Number(sizeEntry?.stock ?? sizeEntry?.quantity ?? sizeEntry?.qty ?? 0);
  });

  return sizes;
};

const normalizeProductItem = (item) => {
  const imageSources = item?.imageUrls || item?.images || item?.imagesOfProductItem || [];

  return createLocalProductItem({
    id: String(item?.productItemId || item?.id || ''),
    colorName: item?.color || item?.colorName || '',
    colorHex: item?.colorCode || item?.colorHex || '#111827',
    sku: item?.sku || '',
    price: Number(item?.price || item?.productItemPrice || 0),
    stock: Number(item?.stock || 0),
    sizes: normalizeSizeMap(item?.sizeList || item?.sizes || item?.size || []),
    images: imageSources.map((src, index) => ({
      id: `${item?.productItemId || item?.id || 'product-item'}-${index}-${src}`,
      src,
    })),
    imageFiles: [],
  });
};

const normalizeProduct = (product) => createLocalProduct({
  id: String(product?.productId || product?.id || ''),
  productNameEn: product?.productNameEn || product?.nameEn || '',
  productDescriptionEn: product?.productDescriptionEn || product?.descriptionEn || '',
  productNameAr: product?.productNameAr || product?.nameAr || '',
  productDescriptionAr: product?.productDescriptionAr || product?.descriptionAr || '',
  categoryId: String(product?.categoryId || product?.category?.id || ''),
  categoryName: product?.categoryNameEn || product?.categoryName || product?.category?.categoryNameEn || product?.category?.name || '',
  price: Number(product?.productPrice || product?.price || 0),
  thumbnail: product?.thumbnail || product?.thumbnailUrl || product?.imageUrl || '',
  thumbnailFile: null,
  productItems: (product?.productItems || product?.items || product?.productItemList || product?.colorOptions || []).map(normalizeProductItem),
  status: 'ready',
  syncedWithApi: true,
});

const getApiErrorMessage = (err, fallbackMessage) => {
  const responseData = err?.response?.data;

  if (typeof responseData === 'string') return responseData;

  return responseData?.message || responseData?.error || fallbackMessage;
};

const AddProduct = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const text = t.product;
  const thumbnailInputRef = useRef(null);
  const itemImagesInputRef = useRef(null);

  const [step, setStep] = useState('product');
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM_FORM);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [products, setProducts] = useState(loadSavedProducts);
  const [categories, setCategories] = useState([]);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [payloadPreviewProduct, setPayloadPreviewProduct] = useState(null);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [creatingItem, setCreatingItem] = useState(false);
  const [editingProductId, setEditingProductId] = useState('');
  const [editingItemId, setEditingItemId] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState('');
  const [deletingItemId, setDeletingItemId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const isCatalogRoute = location.pathname === '/products';

  const currentStock = currentProduct ? getProductStock(currentProduct) : 0;
  const itemStock = getProductItemStock(itemForm);
  const brandId = user?.id || '';

  const getProductName = (product) => (
    language === 'ar'
      ? product.productNameAr || product.productNameEn
      : product.productNameEn || product.productNameAr
  );

  const getProductDescription = (product) => (
    language === 'ar'
      ? product.productDescriptionAr || product.productDescriptionEn
      : product.productDescriptionEn || product.productDescriptionAr
  );

  const productsWithStock = useMemo(() => (
    products.map((product) => ({
      ...product,
      totalStock: getProductStock(product),
      colors: getProductColors(product),
    }))
  ), [products]);

  const filteredProducts = useMemo(() => (
    productsWithStock.filter((product) => {
      const matchesSearch = !productSearch.trim() || [
        product.productNameEn,
        product.productNameAr,
        product.categoryName,
      ].some((value) => String(value || '').toLowerCase().includes(productSearch.trim().toLowerCase()));

      const matchesCategory = productCategoryFilter === 'all' || product.categoryId === productCategoryFilter;

      return matchesSearch && matchesCategory;
    })
  ), [productCategoryFilter, productSearch, productsWithStock]);

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  useEffect(() => {
    if (isCatalogRoute) {
      setStep('catalog');
      return;
    }

    if (!currentProduct) {
      setStep('product');
    }
  }, [currentProduct, isCatalogRoute]);

  useEffect(() => {
    const loadCategories = async () => {
      if (!brandId) {
        setCategories(DEMO_CATEGORIES);
        return;
      }

      try {
        const response = await categoriesAPI.getAll({ brandId, page: 0, size: 100 });
        const nextCategories = normalizeCategoriesResponse(response.data).map(normalizeCategory);
        setCategories(nextCategories.length ? nextCategories : DEMO_CATEGORIES);
      } catch (err) {
        console.warn('Categories unavailable for product form:', err);
        setCategories(DEMO_CATEGORIES);
      }
    };

    loadCategories();
  }, [brandId]);

  useEffect(() => {
    const loadProducts = async () => {
      if (!brandId) {
        setProducts((currentProducts) => (currentProducts.length ? currentProducts : DEMO_PRODUCTS));
        return;
      }

      setLoadingProducts(true);

      try {
        const response = await productsAPI.getAll({ brandId, page: 0, size: 100 });
        const nextProducts = normalizeProductsResponse(response.data).map(normalizeProduct);
        setProducts(nextProducts.length ? nextProducts : DEMO_PRODUCTS);
      } catch (err) {
        console.warn('Products unavailable from API, keeping local catalog:', err);
        setProducts((currentProducts) => (currentProducts.length ? currentProducts : DEMO_PRODUCTS));
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, [brandId]);

  const updateProductField = (field, value) => {
    const nextForm = { ...productForm, [field]: value };

    if (field === 'categoryId') {
      nextForm.categoryName = categories.find((category) => category.id === value)?.name || '';
    }

    setProductForm(nextForm);
  };

  const updateItemField = (field, value) => {
    setItemForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const updateItemSize = (sizeName, stock) => {
    setItemForm((currentForm) => ({
      ...currentForm,
      sizes: {
        ...currentForm.sizes,
        [sizeName]: Math.max(0, Number(stock) || 0),
      },
    }));
  };

  const handleThumbnailChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const thumbnail = await readFileAsDataUrl(file);
    setProductForm((currentForm) => ({ ...currentForm, thumbnail, thumbnailFile: file }));
  };

  const handleItemImagesChange = async (e) => {
    const files = Array.from(e.target.files || []).filter((file) => file.type.startsWith('image/'));
    if (files.length === 0) return;

    const images = await Promise.all(files.map(readFileAsDataUrl));
    const entries = files.map((file, index) => ({
      file,
      fileKey: makeFileKey(file),
      src: images[index],
    }));

    setItemForm((currentForm) => ({
      ...currentForm,
      ...(() => {
        const acceptedEntries = entries.slice(0, Math.max(0, 8 - currentForm.images.length));

        return {
          imageFiles: [...currentForm.imageFiles, ...acceptedEntries.map((entry) => entry.file)],
          images: [
            ...currentForm.images,
            ...acceptedEntries.map((entry) => ({
              id: entry.fileKey,
              fileKey: entry.fileKey,
              src: entry.src,
            })),
          ],
        };
      })(),
    }));

    e.target.value = '';
  };

  const removeItemImage = (imageId) => {
    setItemForm((currentForm) => {
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

  const validateProduct = () => {
    if (!productForm.productNameEn.trim()) return text.errors.productNameEn || 'English product name is required';
    if (!productForm.productNameAr.trim()) return text.errors.productNameAr || 'Arabic product name is required';
    if (!productForm.productDescriptionEn.trim()) return text.errors.productDescriptionEn || 'English product description is required';
    if (!productForm.productDescriptionAr.trim()) return text.errors.productDescriptionAr || 'Arabic product description is required';
    if (!productForm.price || Number(productForm.price) <= 0) return text.errors.price;
    if (!productForm.categoryId) return text.errors.category;
    if (!editingProductId && !productForm.thumbnailFile) return text.errors.thumbnail;
    return '';
  };

  const buildCreateProductRequest = () => ({
    productNameEn: productForm.productNameEn.trim(),
    productDescriptionEn: productForm.productDescriptionEn.trim(),
    productNameAr: productForm.productNameAr.trim(),
    productDescriptionAr: productForm.productDescriptionAr.trim(),
    productPrice: productForm.price,
    categoryId: productForm.categoryId,
    thumbnail: productForm.thumbnailFile,
  });

  const buildCreateProductItemRequest = () => ({
    color: itemForm.colorName.trim(),
    sku: itemForm.sku.trim(),
    colorCode: itemForm.colorHex,
    sizeAndStockList: Object.entries(itemForm.sizes || {})
      .filter(([, stock]) => Number(stock) > 0)
      .map(([sizeName, stock]) => ({
        sizeName,
        stock: Number(stock),
      })),
    productItemImages: itemForm.imageFiles,
  });

  const buildUpdateProductItemRequest = () => ({
    sku: itemForm.sku.trim(),
    size: Object.entries(itemForm.sizes || {})
      .filter(([, stock]) => Number(stock) > 0)
      .map(([sizeName, stock]) => ({
        sizeName,
        stock: Number(stock),
      })),
  });

  const buildLocalProductFromResponse = (data) => createLocalProduct({
    id: String(data?.productId || data?.id || editingProductId),
    productNameEn: data?.productNameEn || productForm.productNameEn.trim(),
    productDescriptionEn: data?.productDescriptionEn || productForm.productDescriptionEn.trim(),
    productNameAr: data?.productNameAr || productForm.productNameAr.trim(),
    productDescriptionAr: data?.productDescriptionAr || productForm.productDescriptionAr.trim(),
    categoryId: String(data?.categoryId || productForm.categoryId),
    categoryName: data?.categoryNameEn || data?.categoryName || productForm.categoryName,
    price: Number(data?.productPrice || data?.price || productForm.price),
    thumbnail: data?.thumbnail || data?.thumbnailUrl || productForm.thumbnail,
    thumbnailFile: productForm.thumbnailFile,
    productItems: currentProduct?.productItems || [],
    status: currentProduct?.status || 'draft',
    syncedWithApi: true,
  });

  const saveProductAndContinue = async () => {
    const validationError = validateProduct();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setCreatingProduct(true);

    try {
      const request = buildCreateProductRequest();
      const { data } = editingProductId
        ? await productsAPI.update(editingProductId, request)
        : await productsAPI.create(request);
      const product = buildLocalProductFromResponse(data);

      setCurrentProduct(product);
      setProducts((currentProducts) => (
        editingProductId
          ? currentProducts.map((current) => (current.id === product.id ? product : current))
          : [product, ...currentProducts]
      ));
      setEditingProductId(product.id);
      setItemForm({ ...EMPTY_ITEM_FORM, price: productForm.price });
      setStep('items');
      toast.success(editingProductId ? (text.toasts.productUpdated || 'Product updated') : (text.toasts.productSavedToApi || 'Product created in API. Add product items next.'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, text.toasts.productSaveFailed || 'Failed to create product'));
    } finally {
      setCreatingProduct(false);
    }
  };

  const validateItem = () => {
    if (!currentProduct) return text.errors.createProductFirst;
    if (!itemForm.colorName.trim()) return text.errors.colorName;
    if (!itemForm.sku.trim()) return text.errors.sku;
    if (itemStock <= 0) return text.errors.itemQuantity;
    if (!editingItemId && itemForm.imageFiles.length === 0) return text.errors.itemImages || 'Add at least one product item image';
    return '';
  };

  const addProductItem = async () => {
    const validationError = validateItem();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setCreatingItem(true);

    try {
      const request = editingItemId ? buildUpdateProductItemRequest() : buildCreateProductItemRequest();
      const { data } = editingItemId
        ? await productsAPI.updateItem(currentProduct.id, editingItemId, request)
        : await productsAPI.createItem(currentProduct.id, request);
      const responseSizes = Array.isArray(data?.sizeList)
        ? data.sizeList
        : request.sizeAndStockList || request.size || [];
      const nextSizes = getEmptySizeMap();

      responseSizes.forEach((sizeEntry) => {
        const sizeName = sizeEntry?.sizeName;

        if (!sizeName) {
          return;
        }

        nextSizes[sizeName] = Number(sizeEntry?.stock || 0);
      });

      const item = createLocalProductItem({
        id: String(data?.productItemId || data?.id || editingItemId),
        colorName: data?.color || itemForm.colorName.trim(),
        colorHex: itemForm.colorHex,
        sku: data?.sku || itemForm.sku.trim(),
        price: Number(itemForm.price),
        stock: itemStock,
        sizes: nextSizes,
        images: (data?.imageUrls || itemForm.images.map((image) => image.src)).map((src, index) => ({
          id: `${data?.productItemId || 'product-item'}-${index}-${src}`,
          src,
        })),
        imageFiles: itemForm.imageFiles,
      });

      const nextProduct = {
        ...currentProduct,
        productItems: editingItemId
          ? currentProduct.productItems.map((currentItem) => (currentItem.id === editingItemId ? item : currentItem))
          : [...currentProduct.productItems, item],
        status: 'ready',
      };

      setCurrentProduct(nextProduct);
      setProducts((currentProducts) => currentProducts.map((product) => (
        product.id === nextProduct.id ? nextProduct : product
      )));
      setItemForm({ ...EMPTY_ITEM_FORM, colorHex: itemForm.colorHex, price: currentProduct.price.toString() });
      setEditingItemId('');
      toast.success(editingItemId ? (text.toasts.itemUpdated || 'Product item updated') : text.toasts.itemAdded);
    } catch (err) {
      toast.error(getApiErrorMessage(err, text.toasts.itemAddFailed || 'Failed to create product item'));
    } finally {
      setCreatingItem(false);
    }
  };

  const startNewProduct = () => {
    setProductForm(EMPTY_PRODUCT_FORM);
    setItemForm(EMPTY_ITEM_FORM);
    setCurrentProduct(null);
    setPayloadPreviewProduct(null);
    setEditingProductId('');
    setEditingItemId('');
    setStep('product');
  };

  const editExistingProduct = async (product) => {
    if (isCatalogRoute) {
      navigate('/products/add');
    }

    let productToEdit = product;

    if (brandId && product.id) {
      try {
        const { data } = await productsAPI.getDetails(brandId, product.id);
        productToEdit = normalizeProduct(data?.data || data?.product || data);
      } catch (err) {
        console.warn('Product details unavailable, using catalog row:', err);
      }
    }

    setEditingProductId(productToEdit.id);
    setCurrentProduct(productToEdit);
    setProductForm({
      productNameEn: productToEdit.productNameEn || '',
      productDescriptionEn: productToEdit.productDescriptionEn || '',
      productNameAr: productToEdit.productNameAr || '',
      productDescriptionAr: productToEdit.productDescriptionAr || '',
      categoryId: productToEdit.categoryId,
      categoryName: productToEdit.categoryName,
      price: productToEdit.price.toString(),
      thumbnail: productToEdit.thumbnail,
      thumbnailFile: productToEdit.thumbnailFile || null,
    });
    setItemForm({ ...EMPTY_ITEM_FORM, price: productToEdit.price.toString() });
    setStep('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm(text.deleteProductConfirm || 'Delete this product?')) return;

    setDeletingProductId(productId);

    try {
      await productsAPI.remove(productId);
      setProducts((currentProducts) => currentProducts.filter((product) => product.id !== productId));

      if (currentProduct?.id === productId) {
        startNewProduct();
      }

      toast.success(text.toasts.productRemoved);
    } catch (err) {
      toast.error(getApiErrorMessage(err, text.toasts.productRemoveFailed || 'Failed to delete product'));
    } finally {
      setDeletingProductId('');
    }
  };

  const startEditingProductItem = (item) => {
    setEditingItemId(item.id);
    setItemForm({
      colorName: item.colorName || '',
      colorHex: item.colorHex || '#111827',
      sku: item.sku || '',
      price: String(item.price || currentProduct?.price || ''),
      images: item.images || [],
      imageFiles: [],
      sizes: {
        ...getEmptySizeMap(),
        ...(item.sizes || {}),
      },
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProductItem = async (itemId) => {
    if (!currentProduct) return;

    setDeletingItemId(itemId);

    try {
      await productsAPI.removeItem(currentProduct.id, itemId);

      const nextProduct = {
        ...currentProduct,
        productItems: currentProduct.productItems.filter((item) => item.id !== itemId),
      };

      setCurrentProduct(nextProduct);
      setProducts((currentProducts) => currentProducts.map((product) => (
        product.id === nextProduct.id ? nextProduct : product
      )));
      toast.success(text.toasts.itemRemoved || 'Product item deleted');
    } catch (err) {
      toast.error(getApiErrorMessage(err, text.toasts.itemRemoveFailed || 'Failed to delete product item'));
    } finally {
      setDeletingItemId('');
    }
  };

  const markReadyForApi = () => {
    if (!currentProduct?.productItems?.length) {
      toast.error(text.errors.itemBeforeApi);
      return;
    }

    setPayloadPreviewProduct(currentProduct);
    setStep('catalog');
    toast.success(text.toasts.apiReady);
  };

  const productPayloadPreview = payloadPreviewProduct ? toBackendProductPayload(payloadPreviewProduct) : null;
  const productItemsPayloadPreview = payloadPreviewProduct ? toBackendProductItemPayload(payloadPreviewProduct) : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-950 dark:text-white">{isCatalogRoute ? 'Products' : text.title}</h1>
        </div>
        <button type="button" onClick={startNewProduct} className="w-fit rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-800 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800">
          {text.newProduct}
        </button>
      </div>

      {!isCatalogRoute && (
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { id: 'product', label: text.productStep, help: text.productStepHelp },
          { id: 'items', label: text.itemsStep, help: text.itemsStepHelp },
          { id: 'catalog', label: text.catalogStep, help: text.catalogStepHelp },
        ].map((navStep) => (
          <button
            key={navStep.id}
            type="button"
            onClick={() => setStep(navStep.id)}
            disabled={navStep.id === 'items' && !currentProduct}
            className={`rounded-lg border p-4 text-start transition disabled:cursor-not-allowed disabled:opacity-50 ${
              step === navStep.id
                ? 'border-blue-600 bg-blue-50 text-blue-900 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-100'
                : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200'
            }`}
          >
            <p className="font-bold">{navStep.label}</p>
            <p className="mt-1 text-sm opacity-75">{navStep.help}</p>
          </button>
        ))}
      </div>
      )}

      {step === 'product' && (
        <ProductStep
          productForm={productForm}
          categories={categories}
          thumbnailInputRef={thumbnailInputRef}
          onThumbnailChange={handleThumbnailChange}
          onUpdateProductField={updateProductField}
          onContinue={saveProductAndContinue}
          creatingProduct={creatingProduct}
          text={text}
        />
      )}

      {step === 'items' && currentProduct && (
        <ProductItemsStep
          currentProduct={currentProduct}
          itemForm={itemForm}
          currentStock={currentStock}
          itemStock={itemStock}
          creatingItem={creatingItem}
          deletingItemId={deletingItemId}
          itemImagesInputRef={itemImagesInputRef}
          onUpdateItemField={updateItemField}
          onUpdateItemSize={updateItemSize}
          onItemImagesChange={handleItemImagesChange}
          onRemoveItemImage={removeItemImage}
          onAddProductItem={addProductItem}
          onDeleteProductItem={deleteProductItem}
          onEditProductItem={startEditingProductItem}
          onFinish={markReadyForApi}
          editingItemId={editingItemId}
          getProductName={getProductName}
          text={text}
        />
      )}

      {step === 'catalog' && (
        <CatalogManager
          products={filteredProducts}
          productSearch={productSearch}
          productCategoryFilter={productCategoryFilter}
          categories={categories}
          onSearchChange={setProductSearch}
          onCategoryFilterChange={setProductCategoryFilter}
          expandedProductId={expandedProductId}
          onToggleProduct={setExpandedProductId}
          onEdit={editExistingProduct}
          onDelete={deleteProduct}
          deletingProductId={deletingProductId}
          loadingProducts={loadingProducts}
          getProductName={getProductName}
          getProductDescription={getProductDescription}
          text={text}
        />
      )}

      {payloadPreviewProduct && step === 'catalog' && (
        <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-xl font-bold text-gray-950 dark:text-white">{text.payloadTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
            {text.payloadHelp}
          </p>

          <div className="mt-5 grid gap-6 xl:grid-cols-2">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{text.productApiPayloadTitle || 'Product creation payload'}</h3>
              <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-gray-950 p-4 text-xs leading-6 text-gray-100">
                {JSON.stringify(productPayloadPreview, (key, value) => {
                  if (key === 'thumbnail' && value instanceof File) return value.name;
                  return value;
                }, 2)}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{text.productItemsApiPayloadTitle || 'Next product-items payload draft'}</h3>
              <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-gray-950 p-4 text-xs leading-6 text-gray-100">
                {JSON.stringify(productItemsPayloadPreview, (key, value) => {
                  if (key === 'productItemImages') return value.map((file) => file.name);
                  return value;
                }, 2)}
              </pre>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

const ProductStep = ({
  productForm,
  categories,
  thumbnailInputRef,
  onThumbnailChange,
  onUpdateProductField,
  onContinue,
  creatingProduct,
  text,
}) => (
  <section className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <button type="button" onClick={() => thumbnailInputRef.current?.click()} className="group relative aspect-square w-full overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-950">
        {productForm.thumbnail ? (
          <img src={productForm.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
            <PhotoIcon className="h-12 w-12" />
            <span className="font-semibold">{text.uploadThumbnail}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gray-950/75 px-4 py-3 text-sm font-bold text-white opacity-0 transition group-hover:opacity-100">
          {text.changeThumbnail}
        </div>
      </button>
      <input ref={thumbnailInputRef} type="file" accept="image/*" onChange={onThumbnailChange} className="hidden" />
      <p className="mt-4 text-sm leading-6 text-gray-500 dark:text-gray-400">
        {text.thumbnailHelp}
      </p>
    </div>

    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.productNameEn || 'Product name EN'}</span>
          <input value={productForm.productNameEn} onChange={(e) => onUpdateProductField('productNameEn', e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" placeholder={text.productNameEnPlaceholder || text.productNamePlaceholder} />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.productNameAr || 'Product name AR'}</span>
          <input value={productForm.productNameAr} onChange={(e) => onUpdateProductField('productNameAr', e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" placeholder={text.productNameArPlaceholder || 'اكتب اسم المنتج بالعربية'} dir="rtl" />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.category}</span>
          <select value={productForm.categoryId} onChange={(e) => onUpdateProductField('categoryId', e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white">
            <option value="">{text.chooseCategory}</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.basePrice}</span>
          <input type="number" min="0" step="0.01" value={productForm.price} onChange={(e) => onUpdateProductField('price', e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" placeholder="0.00" />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.descriptionEn || 'Description EN'}</span>
          <textarea value={productForm.productDescriptionEn} onChange={(e) => onUpdateProductField('productDescriptionEn', e.target.value)} rows={4} className="mt-2 w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" placeholder={text.descriptionEnPlaceholder || text.descriptionPlaceholder} />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.descriptionAr || 'Description AR'}</span>
          <textarea value={productForm.productDescriptionAr} onChange={(e) => onUpdateProductField('productDescriptionAr', e.target.value)} rows={4} className="mt-2 w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" placeholder={text.descriptionArPlaceholder || 'اكتب وصف المنتج بالعربية'} dir="rtl" />
        </label>
      </div>

      <div className="mt-8 flex justify-end">
        <button type="button" disabled={creatingProduct} onClick={onContinue} className="rounded-lg bg-blue-600 px-7 py-3 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50">
          {creatingProduct ? (text.creatingProduct || 'Creating product...') : (text.saveAndAddItems || 'Save product and add items')}
        </button>
      </div>
    </div>
  </section>
);

const ProductItemsStep = ({
  currentProduct,
  itemForm,
  currentStock,
  itemStock,
  creatingItem,
  editingItemId,
  deletingItemId,
  itemImagesInputRef,
  onUpdateItemField,
  onUpdateItemSize,
  onItemImagesChange,
  onRemoveItemImage,
  onAddProductItem,
  onDeleteProductItem,
  onEditProductItem,
  onFinish,
  getProductName,
  text,
}) => (
  <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-950 dark:text-white">{getProductName(currentProduct)}</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{text.totalStock}: <span className="font-bold text-blue-600 dark:text-blue-400">{currentStock}</span></p>
        </div>
        <button type="button" onClick={onFinish} className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-3 font-bold text-white transition hover:bg-green-700">
          <CheckCircleIcon className="h-5 w-5" />
          {text.finishProduct}
        </button>
      </div>

        <ItemForm
          itemForm={itemForm}
          itemStock={itemStock}
          creatingItem={creatingItem}
          editingItemId={editingItemId}
          itemImagesInputRef={itemImagesInputRef}
        onUpdateItemField={onUpdateItemField}
        onUpdateItemSize={onUpdateItemSize}
        onItemImagesChange={onItemImagesChange}
        onRemoveItemImage={onRemoveItemImage}
        onAddProductItem={onAddProductItem}
        text={text}
      />
    </div>

    <ProductItemsPanel product={currentProduct} onEditItem={onEditProductItem} onDeleteItem={onDeleteProductItem} deletingItemId={deletingItemId} text={text} />
  </section>
);

const ItemForm = ({
  itemForm,
  itemStock,
  creatingItem,
  editingItemId,
  itemImagesInputRef,
  onUpdateItemField,
  onUpdateItemSize,
  onItemImagesChange,
  onRemoveItemImage,
  onAddProductItem,
  text,
}) => (
  <>
    <div className="grid gap-5 md:grid-cols-2">
      <label className="block">
        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.colorName}</span>
        <input value={itemForm.colorName} onChange={(e) => onUpdateItemField('colorName', e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" placeholder={text.colorNamePlaceholder} />
      </label>

      <label className="block">
        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.sku}</span>
        <input value={itemForm.sku} onChange={(e) => onUpdateItemField('sku', e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" placeholder={text.skuPlaceholder} />
      </label>

      <label className="block md:col-span-2">
        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.color}</span>
        <div className="mt-2 flex gap-3">
          <input type="color" value={itemForm.colorHex} onChange={(e) => onUpdateItemField('colorHex', e.target.value)} className="h-12 w-16 cursor-pointer rounded-lg border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-950" />
          <input value={itemForm.colorHex} onChange={(e) => onUpdateItemField('colorHex', e.target.value)} className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
        </div>
      </label>
    </div>

    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-gray-950 dark:text-white">{text.sizesTitle}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{text.sizesHelp}</p>
        </div>
        <span className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-200">{text.itemStock} {itemStock}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCT_SIZES.map((sizeName) => (
          <label key={sizeName} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-950">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.size} {sizeName}</span>
            <input type="number" min="0" value={itemForm.sizes[sizeName]} onChange={(e) => onUpdateItemSize(sizeName, e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-center text-lg font-bold text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </label>
        ))}
      </div>
    </div>

    <ItemImages
      images={itemForm.images}
      itemImagesInputRef={itemImagesInputRef}
      onItemImagesChange={onItemImagesChange}
      onRemoveItemImage={onRemoveItemImage}
      text={text}
    />

    <div className="mt-8 flex justify-end">
      <button type="button" disabled={creatingItem} onClick={onAddProductItem} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-7 py-3 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50">
        <PlusIcon className="h-5 w-5" />
        {creatingItem ? (text.creatingItem || 'Saving item...') : editingItemId ? (text.updateProductItem || 'Update product item') : text.addProductItem}
      </button>
    </div>
  </>
);

const ItemImages = ({ images, itemImagesInputRef, onItemImagesChange, onRemoveItemImage, text }) => (
  <div className="mt-8">
    <div className="mb-4 flex items-center justify-between gap-4">
      <h3 className="font-bold text-gray-950 dark:text-white">{text.itemImages}</h3>
      <button type="button" onClick={() => itemImagesInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-800 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800">
        <PlusIcon className="h-4 w-4" />
        {text.addImages}
      </button>
    </div>
    <input ref={itemImagesInputRef} type="file" accept="image/*" multiple onChange={onItemImagesChange} className="hidden" />

    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {images.map((image) => (
        <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-950">
          <img src={image.src} alt="" className="h-full w-full object-cover" />
          <button type="button" onClick={() => onRemoveItemImage(image.id)} className="absolute right-2 top-2 rounded-lg bg-red-600 p-2 text-white opacity-0 transition group-hover:opacity-100">
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
      {images.length === 0 && (
        <button type="button" onClick={() => itemImagesInputRef.current?.click()} className="aspect-square rounded-lg border border-dashed border-gray-300 text-gray-400 transition hover:border-blue-500 hover:text-blue-500 dark:border-gray-700">
          <PhotoIcon className="mx-auto h-9 w-9" />
        </button>
      )}
    </div>
  </div>
);

const ProductItemsPanel = ({ product, onEditItem, onDeleteItem, deletingItemId, text }) => (
  <aside className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
    <h2 className="text-xl font-bold text-gray-950 dark:text-white">{text.itemsOnProduct}</h2>
    <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
      {text.itemsOnProductHelp}
    </p>

    <div className="mt-6 space-y-4">
      {product.productItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          {text.noProductItems}
        </div>
      ) : product.productItems.map((item) => (
        <div key={item.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-11 w-11 flex-shrink-0 rounded-lg border border-gray-200 dark:border-gray-700" style={{ backgroundColor: item.colorHex }} />
              <div className="min-w-0">
                <p className="truncate font-bold text-gray-950 dark:text-white">{item.colorName}</p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{item.sku}</p>
              </div>
            </div>
            <button type="button" onClick={() => onEditItem(item)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950">
              <PencilSquareIcon className="h-5 w-5" />
            </button>
            <button type="button" disabled={deletingItemId === item.id} onClick={() => onDeleteItem(item.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950">
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(item.sizes).filter(([, qty]) => Number(qty) > 0).map(([sizeName, qty]) => (
              <span key={sizeName} className="rounded bg-gray-100 px-2.5 py-1.5 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                {sizeName}: {qty}
              </span>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 text-sm dark:border-gray-700">
            <span className="font-semibold text-gray-600 dark:text-gray-300">{text.total}</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{getProductItemStock(item)} {text.pieces}</span>
          </div>
        </div>
      ))}
    </div>
  </aside>
);

const CatalogManager = ({ products, productSearch, productCategoryFilter, categories, onSearchChange, onCategoryFilterChange, expandedProductId, onToggleProduct, onEdit, onDelete, deletingProductId, loadingProducts, getProductName, getProductDescription, text }) => (
  <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-950 dark:text-white">{text.productManagement}</h2>
      </div>
      <span className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-200">{products.length} {text.products}</span>
    </div>

    <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
      <input
        value={productSearch}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={text.searchProducts || 'Search products'}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
      />
      <select
        value={productCategoryFilter}
        onChange={(event) => onCategoryFilterChange(event.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
      >
        <option value="all">{text.allCategories || 'All categories'}</option>
        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select>
    </div>

    <div className="mt-8 space-y-5">
      {loadingProducts ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <CubeIcon className="mx-auto h-14 w-14 text-gray-400" />
          <p className="mt-4 font-bold text-gray-900 dark:text-white">{text.noProducts}</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{text.noProductsHelp}</p>
        </div>
      ) : products.map((product) => (
        <CatalogProduct
          key={product.id}
          product={product}
          isExpanded={expandedProductId === product.id}
          onToggleProduct={onToggleProduct}
          onEdit={onEdit}
          onDelete={onDelete}
          deletingProductId={deletingProductId}
          getProductName={getProductName}
          getProductDescription={getProductDescription}
          text={text}
        />
      ))}
    </div>
  </section>
);

const CatalogProduct = ({ product, isExpanded, onToggleProduct, onEdit, onDelete, deletingProductId, getProductName, getProductDescription, text }) => (
  <article className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
    <button type="button" onClick={() => onToggleProduct(isExpanded ? null : product.id)} className="grid w-full gap-4 p-4 text-start transition hover:bg-gray-50 dark:hover:bg-gray-800 md:grid-cols-[96px_minmax(0,1fr)_auto] md:items-center">
      <img src={product.thumbnail} alt="" className="h-24 w-24 rounded-lg object-cover" />
      <div className="min-w-0">
        <h3 className="truncate text-lg font-bold text-gray-950 dark:text-white">{getProductName(product)}</h3>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-gray-500 dark:text-gray-400">{getProductDescription(product)}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded bg-blue-50 px-2.5 py-1.5 text-blue-700 dark:bg-blue-950 dark:text-blue-200">{product.categoryName}</span>
          <span className="rounded bg-green-50 px-2.5 py-1.5 text-green-700 dark:bg-green-950 dark:text-green-200">{product.totalStock} {text.pieces}</span>
          <span className="rounded bg-gray-100 px-2.5 py-1.5 text-gray-700 dark:bg-gray-800 dark:text-gray-200">{product.productItems.length} {text.items}</span>
          <span className="rounded bg-gray-100 px-2.5 py-1.5 text-gray-700 dark:bg-gray-800 dark:text-gray-200">{product.colors.length} {text.colors}</span>
          {product.syncedWithApi && (
            <span className="rounded bg-emerald-50 px-2.5 py-1.5 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">{text.apiSyncedBadge || 'API created'}</span>
          )}
        </div>
      </div>
      <ChevronDownIcon className={`h-6 w-6 text-gray-400 transition ${isExpanded ? 'rotate-180' : ''}`} />
    </button>

    {isExpanded && (
      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <div className="mb-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => onEdit(product)} title={text.editProduct || text.openItems} aria-label={text.editProduct || text.openItems} className="grid h-10 w-10 place-items-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700">
            <PencilSquareIcon className="h-5 w-5" />
          </button>
          <button type="button" disabled={deletingProductId === product.id} onClick={() => onDelete(product.id)} title={deletingProductId === product.id ? (text.deletingProduct || 'Deleting...') : text.deleteProduct} aria-label={deletingProductId === product.id ? (text.deletingProduct || 'Deleting...') : text.deleteProduct} className="grid h-10 w-10 place-items-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950">
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>

        {product.productItems.length === 0 ? (
          <p className="rounded-lg bg-gray-50 p-5 text-sm text-gray-500 dark:bg-gray-950 dark:text-gray-400">{text.noColorItems}</p>
        ) : (
          <div className="space-y-4">
            {product.productItems.map((item) => (
              <div key={item.id} className="rounded-lg bg-gray-50 p-4 dark:bg-gray-950">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg border border-gray-200 dark:border-gray-700" style={{ backgroundColor: item.colorHex }} />
                    <div>
                      <p className="font-bold text-gray-950 dark:text-white">{item.colorName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.sku}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{getProductItemStock(item)} {text.pieces}</span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {Object.entries(item.sizes).map(([sizeName, qty]) => (
                    <div key={sizeName} className="rounded border border-gray-200 bg-white px-3 py-2 text-center dark:border-gray-800 dark:bg-gray-900">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{sizeName}</p>
                      <p className="mt-1 text-lg font-bold text-gray-950 dark:text-white">{qty}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </article>
);

export default AddProduct;
