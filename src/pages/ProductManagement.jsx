import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CubeIcon,
  PhotoIcon,
  PlusIcon,
  SwatchIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { productsAPI } from '../services/endpoints';
import { useLanguage } from '../hooks/useLanguage';
import { normalizePaginatedResponse } from '../services/apiResponseUtils';
import {
  getApiErrorMessage,
  mapProductToSummary,
  normalizeProduct,
} from '../services/productApiUtils';
import { deleteWorkspaceProduct, getWorkspaceProduct } from '../services/productWorkspaceStore';

const PAGE_SIZE = 8;

const formatCurrency = (value, language) => {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return language === 'ar' ? 'غير متوفر بعد' : 'Not returned yet';
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

const getDisplayName = (product, language) => {
  if (language === 'ar') {
    return product.productNameAr || product.productNameEn || product.productName || '';
  }

  return product.productNameEn || product.productName || product.productNameAr || '';
};

const getSecondaryName = (product, language) => {
  if (language === 'ar') {
    return product.productNameEn || '';
  }

  return product.productNameAr || '';
};

const getCategoryName = (product, language) => {
  if (language === 'ar') {
    return product.categoryNameAr || product.categoryNameEn || product.categoryName || '';
  }

  return product.categoryNameEn || product.categoryName || product.categoryNameAr || '';
};

const ProductManagement = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState('');
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    totalElements: 0,
    totalPages: 1,
    currentPage: 0,
  });

  const ui = language === 'ar'
    ? {
      title: 'كل المنتجات',
      subtitle: 'دي صفحة عرض المنتجات. اختر أي منتج لإدارة ألوانه ومقاساته، أو أضف منتجًا جديدًا من الزر العلوي.',
      addProduct: 'إضافة منتج جديد',
      search: 'ابحث داخل الصفحة الحالية',
      noProducts: 'لا توجد منتجات بعد',
      noProductsHelp: 'أضف أول منتج، وبعدها ستظهر هنا كل المنتجات مع إمكانية الدخول لإدارة الألوان.',
      manageColors: 'إدارة الألوان',
      delete: 'حذف',
      deleting: 'جارٍ الحذف...',
      category: 'التصنيف',
      basePrice: 'السعر الأساسي',
      colors: 'ألوان',
      stock: 'المخزون',
      page: 'الصفحة',
      of: 'من',
      previous: 'السابق',
      next: 'التالي',
      showing: 'عرض',
      product: 'منتج',
      products: 'منتج',
      notReturned: 'غير متوفر بعد',
      deleteConfirm: 'هل تريد حذف هذا المنتج؟',
      emptySearch: 'لا توجد نتائج في هذه الصفحة الحالية.',
    }
    : {
      title: 'All Products',
      subtitle: 'This page shows your products list. Open any product to manage its colors and sizes, or add a new product from the top action.',
      addProduct: 'Add new product',
      search: 'Search this page',
      noProducts: 'No products yet',
      noProductsHelp: 'Create your first product, and it will appear here for color and size management.',
      manageColors: 'Manage colors',
      delete: 'Delete',
      deleting: 'Deleting...',
      category: 'Category',
      basePrice: 'Base price',
      colors: 'Colors',
      stock: 'Stock',
      page: 'Page',
      of: 'of',
      previous: 'Previous',
      next: 'Next',
      showing: 'Showing',
      product: 'product',
      products: 'products',
      notReturned: 'Not returned yet',
      deleteConfirm: 'Delete this product?',
      emptySearch: 'No matching products on this page.',
    };

  const loadProducts = useCallback(async (targetPage = page) => {
    setLoadingProducts(true);

    try {
      const { data } = await productsAPI.getAll({
        page: targetPage,
        size: PAGE_SIZE,
        search: search.trim(),
      });
      const pageData = normalizePaginatedResponse(data, { fallbackPage: targetPage, fallbackSize: PAGE_SIZE });
      const normalized = pageData.items
        .map(normalizeProduct)
        .map(mapProductToSummary);

      setProducts(normalized);
      setPagination({
        totalElements: pageData.totalElements,
        totalPages: Math.max(pageData.totalPages, 1),
        currentPage: pageData.page,
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load products'));
      setProducts([]);
      setPagination({
        totalElements: 0,
        totalPages: 1,
        currentPage: targetPage,
      });
    } finally {
      setLoadingProducts(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadProducts(page);
  }, [loadProducts, page]);

  const visibleProducts = useMemo(() => products, [products]);

  const goToColors = (product) => {
    navigate(`/products/${product.id}/colors`, {
      state: {
        productName: getDisplayName(product, language),
        productNameEn: product.productNameEn,
        productNameAr: product.productNameAr,
        thumbnail: product.mainImage,
        categoryName: getCategoryName(product, language),
        categoryNameEn: product.categoryNameEn,
        categoryNameAr: product.categoryNameAr,
        basePrice: product.basePrice,
      },
    });
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm(ui.deleteConfirm)) {
      return;
    }

    setDeletingProductId(productId);

    try {
      await productsAPI.remove(productId);
      deleteWorkspaceProduct(productId);

      const shouldGoBackPage = products.length === 1 && page > 0;
      if (shouldGoBackPage) {
        setPage((current) => Math.max(current - 1, 0));
      } else {
        await loadProducts(page);
      }

      toast.success(language === 'ar' ? 'تم حذف المنتج' : 'Product deleted');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete product'));
    } finally {
      setDeletingProductId('');
    }
  };

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
            onClick={() => navigate('/products/add')}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-dark)]"
          >
            <PlusIcon className="h-5 w-5" />
            {ui.addProduct}
          </button>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950 lg:min-w-[320px]">
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
                placeholder={ui.search}
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
              />
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
            {ui.showing} {products.length} {products.length === 1 ? ui.product : ui.products}
          </div>
        </div>

        <div className="mt-6">
          {loadingProducts ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Loading products...
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
              <CubeIcon className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-3 font-semibold text-slate-900 dark:text-white">{products.length === 0 ? ui.noProducts : ui.emptySearch}</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{ui.noProductsHelp}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((product) => {
                const workspace = getWorkspaceProduct(product.id);
                const workspaceColors = workspace.colors || [];
                const colorCount = Math.max(product.colorCount || 0, workspaceColors.length);
                const productPrice = formatCurrency(product.basePrice, language);
                const categoryLabel = getCategoryName(product, language) || ui.notReturned;

                return (
                  <article key={product.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950">
                    <div className="aspect-[4/3] overflow-hidden bg-slate-200 dark:bg-slate-800">
                      {product.mainImage ? (
                        <img src={product.mainImage} alt={getDisplayName(product, language)} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400">
                          <PhotoIcon className="h-8 w-8" />
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <p className="truncate text-lg font-semibold text-slate-950 dark:text-white">{getDisplayName(product, language)}</p>
                      {getSecondaryName(product, language) && (
                        <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{getSecondaryName(product, language)}</p>
                      )}

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <MetricCard label={ui.category} value={categoryLabel} />
                        <MetricCard label={ui.basePrice} value={productPrice} />
                        <MetricCard label={ui.colors} value={String(colorCount)} icon={<SwatchIcon className="h-4 w-4" />} />
                        <MetricCard label={ui.stock} value={String(product.totalStock || 0)} />
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => goToColors(product)}
                          className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-dark)]"
                        >
                          <SwatchIcon className="h-4 w-4" />
                          {ui.manageColors}
                        </button>
                        <button
                          type="button"
                          disabled={deletingProductId === product.id}
                          onClick={() => deleteProduct(product.id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950"
                        >
                          <TrashIcon className="h-4 w-4" />
                          {deletingProductId === product.id ? ui.deleting : ui.delete}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {ui.page} {pagination.currentPage + 1} {ui.of} {Math.max(pagination.totalPages, 1)}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 0 || loadingProducts}
              onClick={() => setPage((current) => Math.max(current - 1, 0))}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              {ui.previous}
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages - 1 || loadingProducts}
              onClick={() => setPage((current) => current + 1)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {ui.next}
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

const MetricCard = ({ label, value, icon = null }) => (
  <div className="rounded-2xl bg-white px-3 py-3 dark:bg-slate-900">
    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-slate-400">
      {icon}
      <span>{label}</span>
    </div>
    <p className="mt-1 truncate font-semibold text-slate-900 dark:text-white">{value}</p>
  </div>
);

export default ProductManagement;
