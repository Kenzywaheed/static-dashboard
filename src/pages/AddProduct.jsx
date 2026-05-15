import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PhotoIcon, QueueListIcon } from '@heroicons/react/24/outline';
import { categoriesAPI, productsAPI } from '../services/endpoints';
import { useLanguage } from '../hooks/useLanguage';
import {
  getApiErrorMessage,
  normalizeCategory,
  normalizeCategoryCollectionResponse,
} from '../services/productApiUtils';

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

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const AddProduct = () => {
  const { t, language } = useLanguage();
  const text = t.product;
  const navigate = useNavigate();
  const thumbnailInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);

  const ui = language === 'ar'
    ? {
      title: 'إضافة منتج جديد',
      subtitle: 'اكتب بيانات المنتج الأساسية هنا. بعد الحفظ ستنتقل مباشرة إلى صفحة الألوان الخاصة به.',
      backToProducts: 'الرجوع إلى كل المنتجات',
      save: 'حفظ المنتج والانتقال للألوان',
      saving: 'جارٍ حفظ المنتج...',
      flowTitle: 'خطوة 1 من 3',
      flowBody: 'ابدأ بالاسم والوصف والتصنيف والسعر والصورة الرئيسية. بعد ذلك ستضيف الألوان، ثم المقاسات داخل كل لون.',
    }
    : {
      title: 'Create Product',
      subtitle: 'Enter the main product details here. After save, you move directly to this product color page.',
      backToProducts: 'Back to all products',
      save: 'Save product and continue to colors',
      saving: 'Saving product...',
      flowTitle: 'Step 1 of 3',
      flowBody: 'Start with the name, descriptions, category, price, and main image. The next step is colors, then sizes inside each color.',
    };

  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);

      try {
        const { data } = await categoriesAPI.getAll({ page: 0, size: 100 });
        setCategories(normalizeCategoryCollectionResponse(data).map(normalizeCategory));
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Failed to load categories'));
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  const updateProductField = (field, value) => {
    setProductForm((current) => ({ ...current, [field]: value }));
  };

  const handleThumbnailChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const preview = await readFileAsDataUrl(file);

    setProductForm((current) => ({
      ...current,
      thumbnail: preview,
      thumbnailFile: file,
    }));
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
      const { data } = await productsAPI.create({
        productNameEn: productForm.productNameEn.trim(),
        productDescriptionEn: productForm.productDescriptionEn.trim(),
        productNameAr: productForm.productNameAr.trim(),
        productDescriptionAr: productForm.productDescriptionAr.trim(),
        productPrice: Number(productForm.price),
        categoryId: productForm.categoryId,
        thumbnail: productForm.thumbnailFile,
      });

      const productId = String(data?.productId || data?.id || '');
      const selectedCategory = categories.find((category) => category.id === productForm.categoryId);

      toast.success(text.toasts.productSavedToApi || 'Product created');
      navigate(`/products/${productId}/colors`, {
        state: {
          productName: data?.productNameEn || productForm.productNameEn.trim(),
          productNameEn: data?.productNameEn || productForm.productNameEn.trim(),
          productNameAr: data?.productNameAr || productForm.productNameAr.trim(),
          categoryName: selectedCategory?.nameAr || selectedCategory?.name || '',
          categoryNameEn: selectedCategory?.name || '',
          categoryNameAr: selectedCategory?.nameAr || '',
          basePrice: Number(productForm.price),
          categoryId: productForm.categoryId,
          thumbnail: productForm.thumbnail,
        },
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, text.toasts.productSaveFailed || 'Failed to create product'));
    } finally {
      setCreatingProduct(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#faf7f2_100%)] p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950 dark:text-white">{ui.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">{ui.subtitle}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-[var(--brand-primary)] px-3 py-1.5 text-white">1. Product</span>
              <span className="rounded-full bg-white px-3 py-1.5 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">2. Colors</span>
              <span className="rounded-full bg-white px-3 py-1.5 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">3. Variants</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/products/view')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <QueueListIcon className="h-5 w-5" />
            {ui.backToProducts}
          </button>
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{ui.flowTitle}</p>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {ui.flowBody}
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
          <Field label={text.productNameEn || 'Product name EN'}>
            <input value={productForm.productNameEn} onChange={(event) => updateProductField('productNameEn', event.target.value)} className={inputClassName} />
          </Field>
          <Field label={text.productNameAr || 'Product name AR'}>
            <input value={productForm.productNameAr} onChange={(event) => updateProductField('productNameAr', event.target.value)} className={inputClassName} />
          </Field>
          <Field label={text.descriptionEn || 'Description EN'} wide>
            <textarea value={productForm.productDescriptionEn} onChange={(event) => updateProductField('productDescriptionEn', event.target.value)} rows={4} className={textareaClassName} />
          </Field>
          <Field label={text.descriptionAr || 'Description AR'} wide>
            <textarea value={productForm.productDescriptionAr} onChange={(event) => updateProductField('productDescriptionAr', event.target.value)} rows={4} className={textareaClassName} />
          </Field>
          <Field label={text.category}>
            <select value={productForm.categoryId} onChange={(event) => updateProductField('categoryId', event.target.value)} disabled={loadingCategories} className={inputClassName}>
              <option value="">{text.chooseCategory || 'Choose category'}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </Field>
          <Field label={text.basePrice || 'Base price'}>
            <input type="number" min="0" value={productForm.price} onChange={(event) => updateProductField('price', event.target.value)} className={inputClassName} />
          </Field>
        </div>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-5 dark:border-slate-700">
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => thumbnailInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <PhotoIcon className="h-5 w-5" />
              {text.uploadThumbnail || 'Upload product thumbnail'}
            </button>
            <input ref={thumbnailInputRef} type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" />
            {productForm.thumbnail && <img src={productForm.thumbnail} alt="" className="h-16 w-16 rounded-2xl object-cover" />}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={creatingProduct}
            onClick={saveProduct}
            className="rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-dark)] disabled:opacity-50"
          >
            {creatingProduct ? ui.saving : ui.save}
          </button>
        </div>
      </section>
    </div>
  );
};

const Field = ({ label, children, wide = false }) => (
  <label className={`block ${wide ? 'md:col-span-2' : ''}`}>
    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
    <div className="mt-2">{children}</div>
  </label>
);

const inputClassName = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary-soft)] dark:border-slate-700 dark:bg-slate-950 dark:text-white';
const textareaClassName = 'w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary-soft)] dark:border-slate-700 dark:bg-slate-950 dark:text-white';

export default AddProduct;
