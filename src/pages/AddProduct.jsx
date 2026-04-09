import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CubeIcon,
  EyeIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { categoriesAPI } from "../services/endpoints";
import { useLanguage } from "../hooks/useLanguage";
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
  toBackendProductPayload,
} from "../services/productCatalogStore";

const EMPTY_PRODUCT_FORM = {
  productName: '',
  productDescription: '',
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

const fallbackCategories = [
  { id: 'waiting-men', name: 'Men' },
  { id: 'waiting-women', name: 'Women' },
];

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const normalizeCategory = (category) => ({
  id: category.id,
  name: category.categoryName || category.name,
});

const AddProduct = () => {
  const { t } = useLanguage();
  const text = t.product;
  const thumbnailInputRef = useRef(null);
  const itemImagesInputRef = useRef(null);
  const [step, setStep] = useState('product');
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM_FORM);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [products, setProducts] = useState(loadSavedProducts);
  const [categories, setCategories] = useState(fallbackCategories);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [payloadPreviewProduct, setPayloadPreviewProduct] = useState(null);

  const currentStock = currentProduct ? getProductStock(currentProduct) : 0;
  const itemStock = getProductItemStock(itemForm);

  const productsWithStock = useMemo(() => (
    products.map((product) => ({
      ...product,
      totalStock: getProductStock(product),
      colors: getProductColors(product),
    }))
  ), [products]);

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoriesAPI.getAll(0, 100);
        const nextCategories = (response.data?.content || []).map(normalizeCategory);

        if (nextCategories.length > 0) {
          setCategories(nextCategories);
        }
      } catch (err) {
        console.warn('Categories unavailable for product form:', err);
      }
    };

    loadCategories();
  }, []);

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

    setItemForm((currentForm) => ({
      ...currentForm,
      imageFiles: [...currentForm.imageFiles, ...files],
      images: [
        ...currentForm.images,
        ...images.map((src) => ({
          id: window.crypto?.randomUUID?.() || src,
          src,
        })),
      ].slice(0, 8),
    }));

    e.target.value = '';
  };

  const removeItemImage = (imageId) => {
    setItemForm((currentForm) => ({
      ...currentForm,
      images: currentForm.images.filter((image) => image.id !== imageId),
    }));
  };

  const validateProduct = () => {
    if (!productForm.productName.trim()) return text.errors.productName;
    if (!productForm.productDescription.trim()) return text.errors.productDescription;
    if (!productForm.price || Number(productForm.price) <= 0) return text.errors.price;
    if (!productForm.categoryId) return text.errors.category;
    if (!productForm.thumbnail) return text.errors.thumbnail;
    return '';
  };

  const saveProductAndContinue = () => {
    const validationError = validateProduct();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const product = createLocalProduct({
      ...productForm,
      price: Number(productForm.price),
      productItems: [],
      status: 'draft',
    });

    setCurrentProduct(product);
    setProducts((currentProducts) => [product, ...currentProducts]);
    setItemForm({ ...EMPTY_ITEM_FORM, price: productForm.price });
    setStep('items');
    toast.success(text.toasts.productSaved);
  };

  const validateItem = () => {
    if (!currentProduct) return text.errors.createProductFirst;
    if (!itemForm.colorName.trim()) return text.errors.colorName;
    if (!itemForm.sku.trim()) return text.errors.sku;
    if (!itemForm.price || Number(itemForm.price) <= 0) return text.errors.itemPrice;
    if (itemStock <= 0) return text.errors.itemQuantity;
    return '';
  };

  const addProductItem = () => {
    const validationError = validateItem();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const item = createLocalProductItem({
      ...itemForm,
      price: Number(itemForm.price),
      stock: itemStock,
    });

    const nextProduct = {
      ...currentProduct,
      productItems: [...currentProduct.productItems, item],
      status: 'ready',
    };

    setCurrentProduct(nextProduct);
    setProducts((currentProducts) => currentProducts.map((product) => (
      product.id === nextProduct.id ? nextProduct : product
    )));
    setItemForm({ ...EMPTY_ITEM_FORM, colorHex: itemForm.colorHex, price: currentProduct.price.toString() });
    toast.success(text.toasts.itemAdded);
  };

  const startNewProduct = () => {
    setProductForm(EMPTY_PRODUCT_FORM);
    setItemForm(EMPTY_ITEM_FORM);
    setCurrentProduct(null);
    setStep('product');
  };

  const editExistingProduct = (product) => {
    setCurrentProduct(product);
    setProductForm({
      productName: product.productName,
      productDescription: product.productDescription,
      categoryId: product.categoryId,
      categoryName: product.categoryName,
      price: product.price.toString(),
      thumbnail: product.thumbnail,
      thumbnailFile: product.thumbnailFile || null,
    });
    setItemForm({ ...EMPTY_ITEM_FORM, price: product.price.toString() });
    setStep('items');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProduct = (productId) => {
    setProducts((currentProducts) => currentProducts.filter((product) => product.id !== productId));

    if (currentProduct?.id === productId) {
      startNewProduct();
    }

    toast.success(text.toasts.productRemoved);
  };

  const deleteProductItem = (itemId) => {
    if (!currentProduct) return;

    const nextProduct = {
      ...currentProduct,
      productItems: currentProduct.productItems.filter((item) => item.id !== itemId),
    };

    setCurrentProduct(nextProduct);
    setProducts((currentProducts) => currentProducts.map((product) => (
      product.id === nextProduct.id ? nextProduct : product
    )));
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

  const payloadPreview = payloadPreviewProduct ? toBackendProductPayload(payloadPreviewProduct) : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase text-blue-600 dark:text-blue-400">{text.workflow}</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-950 dark:text-white">{text.title}</h1>
          <p className="mt-2 max-w-3xl leading-7 text-gray-600 dark:text-gray-400">
            {text.intro}
          </p>
        </div>
        <button type="button" onClick={startNewProduct} className="w-fit rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-800 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800">
          {text.newProduct}
        </button>
      </div>

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

      {step === 'product' && (
        <ProductStep
          productForm={productForm}
          categories={categories}
          thumbnailInputRef={thumbnailInputRef}
          onThumbnailChange={handleThumbnailChange}
          onUpdateProductField={updateProductField}
          onContinue={saveProductAndContinue}
          text={text}
        />
      )}

      {step === 'items' && currentProduct && (
        <ProductItemsStep
          currentProduct={currentProduct}
          itemForm={itemForm}
          currentStock={currentStock}
          itemStock={itemStock}
          itemImagesInputRef={itemImagesInputRef}
          onUpdateItemField={updateItemField}
          onUpdateItemSize={updateItemSize}
          onItemImagesChange={handleItemImagesChange}
          onRemoveItemImage={removeItemImage}
          onAddProductItem={addProductItem}
          onDeleteProductItem={deleteProductItem}
          onFinish={markReadyForApi}
          text={text}
        />
      )}

      {step === 'catalog' && (
        <CatalogManager
          products={productsWithStock}
          expandedProductId={expandedProductId}
          onToggleProduct={setExpandedProductId}
          onEdit={editExistingProduct}
          onDelete={deleteProduct}
          text={text}
        />
      )}

      {payloadPreview && step === 'catalog' && (
        <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-xl font-bold text-gray-950 dark:text-white">{text.payloadTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
            {text.payloadHelp}
          </p>
          <pre className="mt-5 max-h-96 overflow-auto rounded-lg bg-gray-950 p-4 text-xs leading-6 text-gray-100">
            {JSON.stringify(payloadPreview, (key, value) => {
              if (key === 'thumbnail' && value instanceof File) return value.name;
              if (key === 'imagesOfProductItem') return value.map((file) => file.name);
              return value;
            }, 2)}
          </pre>
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
        <label className="block md:col-span-2">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.productName}</span>
          <input value={productForm.productName} onChange={(e) => onUpdateProductField('productName', e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" placeholder={text.productNamePlaceholder} />
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
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.description}</span>
          <textarea value={productForm.productDescription} onChange={(e) => onUpdateProductField('productDescription', e.target.value)} rows={6} className="mt-2 w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" placeholder={text.descriptionPlaceholder} />
        </label>
      </div>

      <div className="mt-8 flex justify-end">
        <button type="button" onClick={onContinue} className="rounded-lg bg-blue-600 px-7 py-3 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
          {text.saveAndAddItems}
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
  itemImagesInputRef,
  onUpdateItemField,
  onUpdateItemSize,
  onItemImagesChange,
  onRemoveItemImage,
  onAddProductItem,
  onDeleteProductItem,
  onFinish,
  text,
}) => (
  <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-950 dark:text-white">{currentProduct.productName}</h2>
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
        itemImagesInputRef={itemImagesInputRef}
        onUpdateItemField={onUpdateItemField}
        onUpdateItemSize={onUpdateItemSize}
        onItemImagesChange={onItemImagesChange}
        onRemoveItemImage={onRemoveItemImage}
        onAddProductItem={onAddProductItem}
        text={text}
      />
    </div>

    <ProductItemsPanel product={currentProduct} onDeleteItem={onDeleteProductItem} text={text} />
  </section>
);

const ItemForm = ({
  itemForm,
  itemStock,
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

      <label className="block">
        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.color}</span>
        <div className="mt-2 flex gap-3">
          <input type="color" value={itemForm.colorHex} onChange={(e) => onUpdateItemField('colorHex', e.target.value)} className="h-12 w-16 cursor-pointer rounded-lg border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-950" />
          <input value={itemForm.colorHex} onChange={(e) => onUpdateItemField('colorHex', e.target.value)} className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
        </div>
      </label>

      <label className="block">
        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.itemPrice}</span>
        <input type="number" min="0" step="0.01" value={itemForm.price} onChange={(e) => onUpdateItemField('price', e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
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
      <button type="button" onClick={onAddProductItem} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-7 py-3 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
        <PlusIcon className="h-5 w-5" />
        {text.addProductItem}
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

const ProductItemsPanel = ({ product, onDeleteItem, text }) => (
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
            <button type="button" onClick={() => onDeleteItem(item.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950">
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

const CatalogManager = ({ products, expandedProductId, onToggleProduct, onEdit, onDelete, text }) => (
  <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-950 dark:text-white">{text.productManagement}</h2>
        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
          {text.productManagementHelp}
        </p>
      </div>
      <span className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-200">{products.length} {text.products}</span>
    </div>

    <div className="mt-8 space-y-5">
      {products.length === 0 ? (
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
          text={text}
        />
      ))}
    </div>
  </section>
);

const CatalogProduct = ({ product, isExpanded, onToggleProduct, onEdit, onDelete, text }) => (
  <article className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
    <button type="button" onClick={() => onToggleProduct(isExpanded ? null : product.id)} className="grid w-full gap-4 p-4 text-start transition hover:bg-gray-50 dark:hover:bg-gray-800 md:grid-cols-[96px_minmax(0,1fr)_auto] md:items-center">
      <img src={product.thumbnail} alt="" className="h-24 w-24 rounded-lg object-cover" />
      <div className="min-w-0">
        <h3 className="truncate text-lg font-bold text-gray-950 dark:text-white">{product.productName}</h3>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-gray-500 dark:text-gray-400">{product.productDescription}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded bg-blue-50 px-2.5 py-1.5 text-blue-700 dark:bg-blue-950 dark:text-blue-200">{product.categoryName}</span>
          <span className="rounded bg-green-50 px-2.5 py-1.5 text-green-700 dark:bg-green-950 dark:text-green-200">{product.totalStock} {text.pieces}</span>
          <span className="rounded bg-gray-100 px-2.5 py-1.5 text-gray-700 dark:bg-gray-800 dark:text-gray-200">{product.productItems.length} {text.items}</span>
          <span className="rounded bg-gray-100 px-2.5 py-1.5 text-gray-700 dark:bg-gray-800 dark:text-gray-200">{product.colors.length} {text.colors}</span>
        </div>
      </div>
      <ChevronDownIcon className={`h-6 w-6 text-gray-400 transition ${isExpanded ? 'rotate-180' : ''}`} />
    </button>

    {isExpanded && (
      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <div className="mb-5 flex flex-wrap gap-3">
          <button type="button" onClick={() => onEdit(product)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">
            <EyeIcon className="h-4 w-4" />
            {text.openItems}
          </button>
          <button type="button" onClick={() => onDelete(product.id)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950">
            <TrashIcon className="h-4 w-4" />
            {text.deleteProduct}
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
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.sku} / ${Number(item.price).toFixed(2)}</p>
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
