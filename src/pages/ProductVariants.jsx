import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, CheckCircleIcon, PlusIcon } from '@heroicons/react/24/outline';
import { productsAPI } from '../services/endpoints';
import { useLanguage } from '../hooks/useLanguage';
import { getApiErrorMessage, normalizeVariant } from '../services/productApiUtils';
import { getWorkspaceProduct, saveWorkspaceVariants } from '../services/productWorkspaceStore';

const createEmptyVariantDraft = () => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  size: '',
  sku: '',
  stock: 0,
  price: '',
});

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const ProductVariants = () => {
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();
  const text = t.product;
  const navigate = useNavigate();
  const location = useLocation();
  const { productId, colorId } = useParams();
  const [creatingVariants, setCreatingVariants] = useState(false);
  const [variantDrafts, setVariantDrafts] = useState([createEmptyVariantDraft()]);
  const [stockDrafts, setStockDrafts] = useState({});

  const workspace = useMemo(() => getWorkspaceProduct(productId), [productId]);
  const workspaceColor = useMemo(() => (
    (workspace.colors || []).find((color) => color.id === colorId) || null
  ), [colorId, workspace.colors]);

  const currentColor = workspaceColor || {
    id: colorId,
    colorCode: location.state?.colorCode || '#000000',
    variants: [],
  };

  const {
    data: apiVariants = [],
    isLoading: loadingVariants,
  } = useQuery({
    queryKey: ['brand-product-variants', productId, colorId],
    enabled: Boolean(productId && colorId),
    queryFn: async () => {
      const response = await productsAPI.getVariants(productId, colorId);
      return (response.data || []).map((variant) => normalizeVariant(variant));
    },
  });

  const ui = language === 'ar'
    ? {
      title: 'Manage Color Variants',
      subtitle: 'Add the sellable sizes and stock for this color. After saving, you return to the color page of the product.',
      back: 'Back to colors',
      addRow: 'Add row',
      save: 'Save variants',
      saving: 'Saving variants...',
      stock: 'Stock',
      noColor: 'This color is not available in the current workspace.',
      remove: 'Remove',
      chooseSize: 'Choose size',
      sizesQuickHelp: 'Select from the standard store sizes instead of typing free text.',
      existingVariants: 'Existing variants',
      updateStock: 'Update stock',
      updatingStock: 'Updating...',
      noVariantsYet: 'No variants returned for this color yet.',
    }
    : {
      title: 'Manage Color Variants',
      subtitle: 'Add the sellable sizes and stock for this color. After saving, you return to the color page of the product.',
      back: 'Back to colors',
      addRow: 'Add row',
      save: 'Save variants',
      saving: 'Saving variants...',
      stock: 'Stock',
      noColor: 'This color is not available in the current workspace.',
      remove: 'Remove',
      chooseSize: 'Choose size',
      sizesQuickHelp: 'Select from the standard store sizes instead of typing free text.',
      existingVariants: 'Existing variants',
      updateStock: 'Update stock',
      updatingStock: 'Updating...',
      noVariantsYet: 'No variants returned for this color yet.',
    };

  const updateVariantDraft = (variantId, field, value) => {
    setVariantDrafts((current) => current.map((draft) => (
      draft.id === variantId ? { ...draft, [field]: value } : draft
    )));
  };

  const addVariantDraft = () => {
    setVariantDrafts((current) => [...current, createEmptyVariantDraft()]);
  };

  const removeVariantDraft = (variantId) => {
    setVariantDrafts((current) => (
      current.length === 1 ? current : current.filter((draft) => draft.id !== variantId)
    ));
  };

  const getTakenSizes = (variantId) => new Set(
    variantDrafts
      .filter((entry) => entry.id !== variantId)
      .map((entry) => entry.size)
      .filter(Boolean),
  );

  const existingVariants = useMemo(() => {
    const variantMap = new Map();

    [...apiVariants, ...(currentColor?.variants || [])].forEach((variant) => {
      const key = String(variant?.id || variant?.variantId || `${variant?.size}-${variant?.sku}`);
      if (!variantMap.has(key)) {
        variantMap.set(key, {
          ...variant,
          id: key,
        });
      }
    });

    return Array.from(variantMap.values());
  }, [apiVariants, currentColor?.variants]);

  const refreshVariantQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['brand-product-variants', productId, colorId] }),
      queryClient.invalidateQueries({ queryKey: ['brand-product-colors', productId] }),
      queryClient.invalidateQueries({ queryKey: ['brand-products'] }),
      queryClient.invalidateQueries({ queryKey: ['brand-products-color-step'] }),
    ]);
  };

  const updateStockMutation = useMutation({
    mutationFn: ({ variantId, stock }) => productsAPI.updateVariantStock(productId, colorId, variantId, stock),
    onSuccess: async () => {
      await refreshVariantQueries();
      toast.success('Stock updated');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to update stock'));
    },
  });

  const saveVariants = async () => {
    const validDrafts = variantDrafts.filter((draft) => draft.size.trim() && draft.sku.trim());

    if (!validDrafts.length) {
      toast.error(text.errors.itemQuantity || 'Add at least one variant');
      return;
    }

    if (validDrafts.some((draft) => draft.price === '' || Number(draft.price) <= 0)) {
      toast.error(text.errors.variantPrice || 'Enter a valid price for each variant');
      return;
    }

    setCreatingVariants(true);

    try {
      const responses = await Promise.all(validDrafts.map((draft) => (
        productsAPI.createVariant(productId, colorId, {
          size: draft.size.trim(),
          sku: draft.sku.trim(),
          price: Number(draft.price),
          stock: Number(draft.stock || 0),
        })
      )));

      saveWorkspaceVariants(
        productId,
        colorId,
        validDrafts.map((draft, index) => ({
          id: responses[index]?.data?.productVariantId || draft.id,
          size: draft.size.trim(),
          sku: draft.sku.trim(),
          stock: Number(draft.stock || 0),
          effectivePrice: Number(draft.price),
        })),
      );

      await refreshVariantQueries();
      toast.success(text.saveVariantsAndContinue || 'Variants saved');
      navigate(`/products/${productId}/colors`, {
        state: {
          productName: location.state?.productName,
        },
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create variants'));
    } finally {
      setCreatingVariants(false);
    }
  };

  if (!currentColor?.id) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">{ui.noColor}</p>
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
            <div className="mt-4 inline-flex items-center gap-3 rounded-full bg-[var(--brand-primary-soft)] px-4 py-2 text-sm font-semibold text-slate-800">
              <span className="h-4 w-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: currentColor.colorCode }} />
              {location.state?.productName || 'Product'} / {location.state?.colorCode || currentColor.colorCode}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-white px-3 py-1.5 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">1. Product</span>
              <span className="rounded-full bg-white px-3 py-1.5 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">2. Colors</span>
              <span className="rounded-full bg-[var(--brand-primary)] px-3 py-1.5 text-white">3. Variants</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/products/${productId}/colors`, { state: { productName: location.state?.productName } })}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            {ui.back}
          </button>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#faf7f2_100%)] p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">{text.sizesTitle || 'Variants'}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{ui.sizesQuickHelp}</p>
          </div>
          <button
            type="button"
            onClick={addVariantDraft}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <PlusIcon className="h-4 w-4" />
            {ui.addRow}
          </button>
        </div>

        <div className="space-y-4">
          {variantDrafts.map((draft, index) => {
            const takenSizes = getTakenSizes(draft.id);

            return (
              <div key={draft.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-semibold text-slate-950 dark:text-white">Variant {index + 1}</p>
                  {variantDrafts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariantDraft(draft.id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                    >
                      {ui.remove}
                    </button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Field label={text.size || 'Size'}>
                    <select value={draft.size} onChange={(event) => updateVariantDraft(draft.id, 'size', event.target.value)} className={inputClassName}>
                      <option value="">{ui.chooseSize}</option>
                      {SIZE_OPTIONS.map((sizeOption) => (
                        <option key={sizeOption} value={sizeOption} disabled={takenSizes.has(sizeOption)}>
                          {sizeOption}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={text.sku}>
                    <input value={draft.sku} onChange={(event) => updateVariantDraft(draft.id, 'sku', event.target.value)} className={inputClassName} />
                  </Field>
                  <Field label={ui.stock}>
                    <input type="number" min="0" value={draft.stock} onChange={(event) => updateVariantDraft(draft.id, 'stock', event.target.value)} className={inputClassName} />
                  </Field>
                  <Field label={text.variantPrice || 'Price'}>
                    <input type="number" min="0" value={draft.price} onChange={(event) => updateVariantDraft(draft.id, 'price', event.target.value)} className={inputClassName} />
                  </Field>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={creatingVariants}
            onClick={saveVariants}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-dark)] disabled:opacity-50"
          >
            <CheckCircleIcon className="h-5 w-5" />
            {creatingVariants ? ui.saving : ui.save}
          </button>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">{ui.existingVariants}</h2>
        <div className="mt-4 space-y-3">
          {loadingVariants ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Loading variants...
            </div>
          ) : existingVariants.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              {ui.noVariantsYet}
            </div>
          ) : existingVariants.map((variant) => {
            const draftValue = stockDrafts[variant.id] ?? variant.stock ?? 0;

            return (
              <div key={variant.id} className="grid gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800 md:grid-cols-[minmax(0,1fr)_140px_auto] md:items-end">
                <div className="grid gap-2 sm:grid-cols-3">
                  <InfoTile label={text.size || 'Size'} value={variant.size || '-'} />
                  <InfoTile label={text.sku || 'SKU'} value={variant.sku || '-'} />
                  <InfoTile label={text.variantPrice || 'Price'} value={String(variant.effectivePrice ?? variant.priceOverride ?? '-')} />
                </div>
                <Field label={ui.stock}>
                  <input
                    type="number"
                    min="0"
                    value={draftValue}
                    onChange={(event) => setStockDrafts((current) => ({
                      ...current,
                      [variant.id]: event.target.value,
                    }))}
                    className={inputClassName}
                  />
                </Field>
                <button
                  type="button"
                  disabled={updateStockMutation.isPending}
                  onClick={() => updateStockMutation.mutate({
                    variantId: variant.id,
                    stock: Number(draftValue || 0),
                  })}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
                >
                  {updateStockMutation.isPending ? ui.updatingStock : ui.updateStock}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

const Field = ({ label, children }) => (
  <label className="block">
    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
    <div className="mt-2">{children}</div>
  </label>
);

const InfoTile = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">{value}</p>
  </div>
);

const inputClassName = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary-soft)] dark:border-slate-700 dark:bg-slate-950 dark:text-white';

export default ProductVariants;
