import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bars3Icon,
  ChevronDownIcon,
  EyeIcon,
  PencilSquareIcon,
  PhotoIcon,
  RectangleStackIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { categoriesAPI } from '../services/endpoints';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';

const PAGE_SIZE = 10;

const EMPTY_CATEGORY_FORM = {
  nameEn: '',
  nameAr: '',
  gender: '',
  detailsEn: '',
  detailsAr: '',
  parentId: '',
  iconFile: null,
};

const mapCategoryFromApi = (category) => ({
  id: category.id,
  nameEn: category.categoryNameEn || category.categoryName || '',
  nameAr: category.categoryNameAr || '',
  gender: category.categoryGender || '',
  detailsEn: category.categoryDescriptionEn || category.categoryDescription || '',
  detailsAr: category.categoryDescriptionAr || '',
  parentId: category.parentCategoryId || '',
  icon: category.imageUrl || category.categoryIcon || '',
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

const normalizeCategoriesResponse = (data) => {
  const content = [
    data?.content,
    data?.categories,
    data?.data?.content,
    data?.data?.categories,
    data?.items,
    data?.result,
    findFirstArrayInObject(data),
    Array.isArray(data) ? data : null,
  ].find(Array.isArray) || [];

  const totalElements = [
    data?.totalElements,
    data?.total,
    data?.count,
    data?.data?.totalElements,
    data?.data?.total,
    content.length,
  ].find((value) => typeof value === 'number') || 0;

  const totalPages = [
    data?.totalPages,
    data?.pages,
    data?.data?.totalPages,
    Math.max(Math.ceil((totalElements || content.length) / PAGE_SIZE), 1),
  ].find((value) => typeof value === 'number') || 1;

  return { content, totalElements, totalPages };
};

const getApiErrorMessage = (err, fallbackMessage) => {
  const responseData = err.response?.data;
  if (typeof responseData === 'string') return responseData;
  return responseData?.message || responseData?.error || fallbackMessage;
};

const buildCreateCategoryRequest = (form) => ({
  categoryNameEn: form.nameEn.trim(),
  categoryNameAr: form.nameAr.trim(),
  categoryGender: form.gender,
  categoryDescriptionEn: form.detailsEn.trim(),
  categoryDescriptionAr: form.detailsAr.trim(),
  parentCategoryId: form.parentId || null,
  categoryIcon: form.iconFile,
});

const buildUpdateCategoryRequest = (form) => ({
  categoryNameEn: form.nameEn.trim(),
  categoryNameAr: form.nameAr.trim(),
  categoryDescriptionEn: form.detailsEn.trim(),
  categoryDescriptionAr: form.detailsAr.trim(),
  parentCategoryId: form.parentId || null,
  imageIcon: form.iconFile || undefined,
});

const revokePreviewIfNeeded = (preview) => {
  if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
};

const CategoryManager = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const text = t.category;
  const brandId = user?.id || '';

  const [step, setStep] = useState('builder');
  const [form, setForm] = useState(EMPTY_CATEGORY_FORM);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [editingCategoryId, setEditingCategoryId] = useState('');
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [listError, setListError] = useState('');
  const [formError, setFormError] = useState('');
  const [iconPreview, setIconPreview] = useState('');
  const [uploadInputKey, setUploadInputKey] = useState(0);

  const isEditing = Boolean(editingCategoryId);

  const getCategoryName = useCallback((category) => (
    language === 'ar' ? category.nameAr || category.nameEn : category.nameEn || category.nameAr
  ), [language]);

  const getCategoryDetails = useCallback((category) => (
    language === 'ar' ? category.detailsAr || category.detailsEn : category.detailsEn || category.detailsAr
  ), [language]);

  const getDisplayGender = useCallback((gender) => {
    if (!gender) return text.noGender;
    if (gender === 'M' || gender === 'MALE') return text.male;
    if (gender === 'F' || gender === 'FEMALE') return text.female;
    return gender;
  }, [text.female, text.male, text.noGender]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) || null,
    [categories, selectedCategoryId],
  );

  const getParentCategoryName = useCallback((parentId) => {
    const parent = categories.find((category) => category.id === parentId);
    return parent ? getCategoryName(parent) : text.noParent;
  }, [categories, getCategoryName, text.noParent]);

  const stats = useMemo(() => ({
    total: totalCategories,
    root: categories.filter((category) => !category.parentId).length,
    sub: categories.filter((category) => category.parentId).length,
    male: categories.filter((category) => category.gender === 'M' || category.gender === 'MALE').length,
  }), [categories, totalCategories]);

  const resetForm = useCallback(() => {
    setForm(EMPTY_CATEGORY_FORM);
    setEditingCategoryId('');
    setFormError('');
    setIconPreview((currentPreview) => {
      revokePreviewIfNeeded(currentPreview);
      return '';
    });
    setUploadInputKey((currentKey) => currentKey + 1);
  }, []);

  const loadCategories = useCallback(async (page) => {
    if (!brandId) {
      setListError(text.brandRequired);
      return;
    }

    setLoading(true);
    setListError('');

    try {
      const { data } = await categoriesAPI.getAll({ brandId, page, size: PAGE_SIZE });
      const normalized = normalizeCategoriesResponse(data);
      const mappedCategories = normalized.content.map(mapCategoryFromApi);

      setCategories(mappedCategories);
      setCurrentPage(page);
      setTotalPages(normalized.totalPages);
      setTotalCategories(normalized.totalElements);

      if (mappedCategories.length === 0) {
        setSelectedCategoryId('');
        setExpandedCategoryId(null);
        setDetailsOpen(false);
        return;
      }

      setSelectedCategoryId((currentSelectedId) => (
        mappedCategories.some((category) => category.id === currentSelectedId)
          ? currentSelectedId
          : mappedCategories[0].id
      ));

      setExpandedCategoryId((currentExpandedId) => (
        mappedCategories.some((category) => category.id === currentExpandedId)
          ? currentExpandedId
          : mappedCategories[0].id
      ));
    } catch (err) {
      const message = getApiErrorMessage(err, text.loadFailed);
      setListError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [brandId, text.brandRequired, text.loadFailed]);

  useEffect(() => {
    loadCategories(0);
  }, [loadCategories]);

  useEffect(() => () => revokePreviewIfNeeded(iconPreview), [iconPreview]);

  const updateFormField = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const handleIconChange = (e) => {
    const file = e.target.files?.[0] || null;
    updateFormField('iconFile', file);
    setIconPreview((currentPreview) => {
      revokePreviewIfNeeded(currentPreview);
      return file ? URL.createObjectURL(file) : '';
    });
  };

  const openCategoryDetails = (category) => {
    setSelectedCategoryId(category.id);
    setDetailsOpen(true);
  };

  const startEditingCategory = (category) => {
    setEditingCategoryId(category.id);
    setForm({
      nameEn: category.nameEn || '',
      nameAr: category.nameAr || '',
      gender: category.gender || '',
      detailsEn: category.detailsEn || '',
      detailsAr: category.detailsAr || '',
      parentId: category.parentId || '',
      iconFile: null,
    });
    setIconPreview((currentPreview) => {
      revokePreviewIfNeeded(currentPreview);
      return category.icon || '';
    });
    setExpandedCategoryId(category.id);
    setSelectedCategoryId(category.id);
    setDetailsOpen(false);
    setStep('builder');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.nameEn.trim() || !form.nameAr.trim()) {
      setFormError(text.requiredNamesError);
      toast.error(text.requiredNamesError);
      return;
    }

    if (!isEditing && (!form.gender || !form.iconFile)) {
      setFormError(text.requiredCreateError);
      toast.error(text.requiredCreateError);
      return;
    }

    setSaving(true);

    try {
      if (isEditing) {
        await categoriesAPI.update(editingCategoryId, buildUpdateCategoryRequest(form));
        toast.success(text.updated);
      } else {
        await categoriesAPI.create(buildCreateCategoryRequest(form));
        toast.success(text.created);
      }

      await loadCategories(currentPage);
      resetForm();
      setStep('explorer');
    } catch (err) {
      const message = getApiErrorMessage(err, isEditing ? text.updateFailed : text.saveFailed);
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(text.deleteConfirm.replace('{name}', getCategoryName(category)))) return;

    setDeletingId(category.id);

    try {
      await categoriesAPI.remove(category.id);
      toast.success(text.deleted);
      if (editingCategoryId === category.id) resetForm();
      if (selectedCategoryId === category.id) {
        setDetailsOpen(false);
        setSelectedCategoryId('');
      }
      await loadCategories(categories.length === 1 && currentPage > 0 ? currentPage - 1 : currentPage);
    } catch (err) {
      toast.error(getApiErrorMessage(err, text.deleteFailed));
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/80 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <div className="grid gap-8 px-6 py-7 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-400">{text.workflow}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{text.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">{text.subtitle}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                {text.brandBadge}: {brandId || text.brandMissing}
              </span>
              {isEditing && (
                <span className="rounded-full border border-blue-200 bg-blue-100 px-4 py-2 font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
                  {text.editingBadge}
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-3 self-start">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setStep('builder');
              }}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              {text.newCategory}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('explorer');
                if (selectedCategory) setDetailsOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <Bars3Icon className="h-5 w-5" />
              {text.viewerTitle}
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={text.categories} value={stats.total} tone="blue" />
        <StatCard label={text.noParent} value={stats.root} tone="slate" />
        <StatCard label={text.subcategories} value={stats.sub} tone="green" />
        <StatCard label={text.male} value={stats.male} tone="amber" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          { id: 'builder', label: text.builderStep, help: text.builderHelp },
          { id: 'explorer', label: text.explorerStep, help: text.explorerHelp },
        ].map((navStep) => (
          <button
            key={navStep.id}
            type="button"
            onClick={() => setStep(navStep.id)}
            className={`rounded-3xl border p-5 text-start transition ${
              step === navStep.id
                ? 'border-blue-200 bg-blue-50 text-blue-900 shadow-sm dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <p className="font-bold">{navStep.label}</p>
            <p className="mt-2 text-sm leading-6 opacity-80">{navStep.help}</p>
          </button>
        ))}
      </div>

      {step === 'builder' && (
        <section className="grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="group relative aspect-square w-full overflow-hidden rounded-[24px] bg-slate-100 dark:bg-slate-950">
              {iconPreview ? (
                <img src={iconPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
                  <PhotoIcon className="h-12 w-12" />
                  <span className="font-semibold">{text.uploadTitle}</span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-slate-950/70 px-4 py-3 text-sm font-bold text-white opacity-0 transition group-hover:opacity-100">
                {isEditing ? text.changeImage : text.chooseImage}
              </div>
            </div>
            <label className="mt-5 inline-flex cursor-pointer items-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
              {isEditing ? text.changeImage : text.chooseImage}
              <input key={uploadInputKey} type="file" accept="image/*" onChange={handleIconChange} disabled={saving} className="hidden" required={!isEditing} />
            </label>
            <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">{isEditing ? text.uploadEditHelp : text.uploadHelp}</p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-950 dark:text-white">{isEditing ? text.editTitle : text.addTitle}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">{isEditing ? text.editSubtitle : text.addSubtitle}</p>
              </div>
              {isEditing && (
                <button type="button" onClick={resetForm} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
                  {text.cancelEdit}
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.nameEn}</span>
                <input value={form.nameEn} onChange={(e) => updateFormField('nameEn', e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" placeholder={text.nameEnPlaceholder} />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.nameAr}</span>
                <input value={form.nameAr} onChange={(e) => updateFormField('nameAr', e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" placeholder={text.nameArPlaceholder} />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.descriptionEn}</span>
                <textarea value={form.detailsEn} onChange={(e) => updateFormField('detailsEn', e.target.value)} rows={4} className="mt-2 w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" placeholder={text.descriptionEnPlaceholder} />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.descriptionAr}</span>
                <textarea value={form.detailsAr} onChange={(e) => updateFormField('detailsAr', e.target.value)} rows={4} className="mt-2 w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white" placeholder={text.descriptionArPlaceholder} />
              </label>

              <div className="block">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.gender}</span>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {[{ label: text.male, value: 'M' }, { label: text.female, value: 'F' }].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateFormField('gender', option.value)}
                      disabled={saving || isEditing}
                      className={`rounded-lg border px-4 py-3 text-sm font-bold transition ${form.gender === option.value ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-100' : 'border-gray-300 text-gray-700 hover:border-blue-300 dark:border-gray-700 dark:text-gray-200'} disabled:opacity-50`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{text.parent}</span>
                <select value={form.parentId} onChange={(e) => updateFormField('parentId', e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                  <option value="">{text.noParent}</option>
                  {categories.filter((category) => category.id !== editingCategoryId).map((category) => (
                    <option key={category.id} value={category.id}>{getCategoryName(category)}</option>
                  ))}
                </select>
              </label>

              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200 md:col-span-2">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3 md:col-span-2">
                <button type="button" onClick={resetForm} className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800">
                  {text.clear}
                </button>
                <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-7 py-3 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50">
                  {saving ? text.saving : isEditing ? text.update : text.create}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {step === 'explorer' && (
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-950 dark:text-white">{text.categoriesTitle}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{text.showing} {categories.length} {text.of} {totalCategories}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => loadCategories(currentPage)} className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                  {text.refresh}
                </button>
                <button type="button" onClick={() => selectedCategory && setDetailsOpen(true)} disabled={!selectedCategory} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                  <Bars3Icon className="h-5 w-5" />
                  {text.viewerTitle}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {listError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{listError}</div>
              ) : loading ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">{text.loadingCategories}</div>
              ) : categories.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
                  <RectangleStackIcon className="mx-auto h-14 w-14 text-slate-400" />
                  <p className="mt-4 font-bold text-slate-900 dark:text-white">{text.noCategories}</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{text.noCategoriesHelp}</p>
                </div>
              ) : categories.map((category) => {
                const isExpanded = expandedCategoryId === category.id;
                const isSelected = selectedCategoryId === category.id;

                return (
                  <article key={category.id} className={`overflow-hidden rounded-[26px] border transition ${isSelected ? 'border-blue-200 bg-blue-50/50 shadow-sm dark:border-blue-900 dark:bg-blue-950/20' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/30'}`}>
                    <div className="grid gap-4 p-4 md:grid-cols-[112px_minmax(0,1fr)_auto] md:items-center md:p-5">
                      <button type="button" onClick={() => openCategoryDetails(category)} className="h-24 w-24 overflow-hidden rounded-[22px] bg-white text-left dark:bg-slate-900">
                        {category.icon ? (
                          <img src={category.icon} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-2xl font-black text-slate-400">{getCategoryName(category)?.charAt(0)?.toUpperCase() || 'C'}</div>
                        )}
                      </button>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-xl font-bold text-slate-950 dark:text-white">{getCategoryName(category)}</h3>
                          {category.parentId && <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-950 dark:text-green-200">{text.subcategoryTag}</span>}
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{getCategoryDetails(category) || text.noDescription}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                          <span className="rounded-full bg-white px-3 py-1.5 text-slate-700 dark:bg-slate-900 dark:text-slate-200">{getDisplayGender(category.gender)}</span>
                          <span className="rounded-full bg-white px-3 py-1.5 text-slate-700 dark:bg-slate-900 dark:text-slate-200">{getParentCategoryName(category.parentId)}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button type="button" onClick={() => openCategoryDetails(category)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"><EyeIcon className="h-4 w-4" />{text.viewerTitle}</button>
                        <button type="button" onClick={() => startEditingCategory(category)} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"><PencilSquareIcon className="h-4 w-4" />{text.edit}</button>
                        <button type="button" onClick={() => handleDelete(category)} disabled={deletingId === category.id} className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:bg-slate-900 dark:hover:bg-red-950"><TrashIcon className="h-4 w-4" />{deletingId === category.id ? text.deleting : text.delete}</button>
                        <button type="button" onClick={() => { setSelectedCategoryId(category.id); setExpandedCategoryId(isExpanded ? null : category.id); }} className="rounded-2xl border border-slate-300 p-3 text-slate-500 transition hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"><ChevronDownIcon className={`h-5 w-5 transition ${isExpanded ? 'rotate-180' : ''}`} /></button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-200 px-4 pb-5 pt-4 dark:border-slate-800 md:px-5">
                        <div className="grid gap-3 lg:grid-cols-2">
                          <InfoTile label={text.nameEn} value={category.nameEn || '-'} />
                          <InfoTile label={text.nameAr} value={category.nameAr || '-'} />
                          <InfoTile label={text.descriptionEn} value={category.detailsEn || '-'} wide />
                          <InfoTile label={text.descriptionAr} value={category.detailsAr || '-'} wide />
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <button type="button" onClick={() => currentPage > 0 && loadCategories(currentPage - 1)} disabled={currentPage === 0} className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">
                  {text.previous}
                </button>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{text.page} {currentPage + 1} {text.of} {totalPages}</span>
                <button type="button" onClick={() => currentPage < totalPages - 1 && loadCategories(currentPage + 1)} disabled={currentPage >= totalPages - 1} className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">
                  {text.next}
                </button>
              </div>
            )}
        </section>
      )}

      <CategoryDetailsDrawer
        category={selectedCategory}
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        onEdit={startEditingCategory}
        onDelete={handleDelete}
        deletingId={deletingId}
        getCategoryName={getCategoryName}
        getCategoryDetails={getCategoryDetails}
        getDisplayGender={getDisplayGender}
        getParentCategoryName={getParentCategoryName}
        text={text}
      />
    </div>
  );
};

const StatCard = ({ label, value, tone }) => {
  const toneClasses = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    green: 'bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-200',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-200',
  };

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${toneClasses[tone]}`}>
        {label}
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{value}</p>
    </div>
  );
};

const InfoTile = ({ label, value, wide = false }) => (
  <div className={`rounded-2xl bg-slate-100 p-4 dark:bg-slate-950 ${wide ? 'lg:col-span-2' : ''}`}>
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
    <p className="mt-2 text-sm leading-6 text-slate-800 dark:text-slate-200">{value}</p>
  </div>
);

const CategoryDetailsDrawer = ({
  category,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  deletingId,
  getCategoryName,
  getCategoryDetails,
  getDisplayGender,
  getParentCategoryName,
  text,
}) => {
  const { isRtl } = useLanguage();

  return (
    <div className={`fixed inset-0 z-[70] transition ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div aria-hidden="true" onClick={onClose} className={`absolute inset-0 bg-slate-950/30 transition ${isOpen ? 'opacity-100' : 'opacity-0'}`} />
      <aside className={`absolute top-0 flex h-full w-full max-w-[460px] flex-col bg-white shadow-2xl transition duration-300 dark:bg-slate-950 ${isRtl ? 'left-0 border-r' : 'right-0 border-l'} border-slate-200 dark:border-slate-800 ${isOpen ? 'translate-x-0' : isRtl ? '-translate-x-full' : 'translate-x-full'}`}>
        <div className={`flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400">{text.viewerTitle}</p>
          <h2 className="mt-2 text-xl font-bold text-slate-950 dark:text-white">{category ? getCategoryName(category) : text.selectCategory}</h2>
        </div>
        <button type="button" onClick={onClose} className="rounded-2xl border border-slate-300 p-2.5 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
          <XMarkIcon className="h-5 w-5" />
        </button>
        </div>

        {!category ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-slate-500 dark:text-slate-400">{text.selectCategory}</div>
        ) : (
          <div className={`flex-1 space-y-6 overflow-y-auto px-6 py-6 ${isRtl ? 'text-right' : 'text-left'}`}>
            <div className="overflow-hidden rounded-[28px] bg-slate-100 dark:bg-slate-900">
              {category.icon ? <img src={category.icon} alt="" className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center text-5xl font-black text-slate-400">{getCategoryName(category)?.charAt(0)?.toUpperCase() || 'C'}</div>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoTile label={text.nameEn} value={category.nameEn || '-'} />
              <InfoTile label={text.nameAr} value={category.nameAr || '-'} />
              <InfoTile label={text.gender} value={getDisplayGender(category.gender)} />
              <InfoTile label={text.parent} value={getParentCategoryName(category.parentId)} />
              <InfoTile label={text.descriptionEn} value={category.detailsEn || text.noDescription} wide />
              <InfoTile label={text.descriptionAr} value={category.detailsAr || text.noDescription} wide />
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{getCategoryDetails(category) || text.noDescription}</p>
            </div>
          </div>
        )}

        {category && (
          <div className="border-t border-slate-200 px-6 py-5 dark:border-slate-800">
            <div className={`flex flex-wrap gap-3 ${isRtl ? 'justify-start' : 'justify-end'}`}>
              <button type="button" onClick={() => onEdit(category)} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"><PencilSquareIcon className="h-4 w-4" />{text.edit}</button>
              <button type="button" onClick={() => onDelete(category)} disabled={deletingId === category.id} className="inline-flex items-center gap-2 rounded-2xl border border-red-200 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950"><TrashIcon className="h-4 w-4" />{deletingId === category.id ? text.deleting : text.delete}</button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default CategoryManager;
