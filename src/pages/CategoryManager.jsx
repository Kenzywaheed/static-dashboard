import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { categoriesAPI } from '../services/endpoints';

const PAGE_SIZE = 10;

const EMPTY_CATEGORY_FORM = {
  name: '',
  gender: '',
  details: '',
  parentId: '',
  iconFile: null
};

const mapCategoryFromApi = (category) => ({
  id: category.id,
  name: category.categoryName,
  gender: category.categoryGender,
  details: category.categoryDescription || '',
  parentId: category.parentCategoryId || '',
  icon: category.imageUrl || category.categoryIcon || ''
});

const formatGender = (gender) => {
  if (!gender) return 'No gender';

  return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
};

const getApiErrorMessage = (err, fallbackMessage) => {
  const responseData = err.response?.data;

  if (typeof responseData === 'string') {
    return responseData;
  }

  return responseData?.message || responseData?.error || fallbackMessage;
};

const buildCreateCategoryRequest = (form) => ({
  categoryName: form.name.trim(),
  categoryGender: form.gender,
  categoryDescription: form.details.trim() || '',
  parentCategoryId: form.parentId || null,
  categoryIcon: form.iconFile
});

const getPageCount = (data, totalElements) => (
  data.totalPages || Math.max(Math.ceil(totalElements / PAGE_SIZE), 1)
);

const getDisplayPage = (page) => page + 1;

const CategoryManager = () => {
  const [form, setForm] = useState(EMPTY_CATEGORY_FORM);

  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [listError, setListError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [lastCreateRequest, setLastCreateRequest] = useState(null);
  const [iconPreview, setIconPreview] = useState('');
  const [uploadInputKey, setUploadInputKey] = useState(0);

  const firstCategoryNumber = totalCategories === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const lastCategoryNumber = Math.min((currentPage + 1) * PAGE_SIZE, totalCategories);

  // Ask the backend for categories and copy the response into the page state.
  const loadCategories = useCallback(async (page) => {
    setLoading(true);
    setListError(null);
    try {
      const response = await categoriesAPI.getAll(page, PAGE_SIZE);
      const data = response.data;
      const totalElements = data.totalElements || 0;

      setCategories((data.content || []).map(mapCategoryFromApi));
      setCurrentPage(page);
      setTotalCategories(totalElements);
      setTotalPages(getPageCount(data, totalElements));
    } catch (err) {
      console.error('Load categories error:', err);
      setListError('Failed to load categories');
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim() || !form.gender || !form.iconFile) {
      const message = 'Name, gender, and icon are required';

      setFormError(message);
      toast.error(message);
      return;
    }

    setSaving(true);

    try {
      const categoryData = buildCreateCategoryRequest(form);

      setLastCreateRequest(categoryData);
      await categoriesAPI.create(categoryData);
      toast.success('Category created!');

      await loadCategories(currentPage);
      resetForm();
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to save category');

      console.error('Submit error:', err);
      toast.error(message);
      setFormError(message);
    } finally {
      setSaving(false);
    }
  }; 

  const resetForm = () => {
    setForm(EMPTY_CATEGORY_FORM);
    setFormError(null);
    setLastCreateRequest(null);
    setIconPreview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }

      return '';
    });
    setUploadInputKey((currentKey) => currentKey + 1);
  };

  const updateFormField = (field, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  };

  const handleIconChange = (e) => {
    const file = e.target.files?.[0] || null;

    updateFormField('iconFile', file);
    setIconPreview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }

      return file ? URL.createObjectURL(file) : '';
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      loadCategories(newPage);
    }
  };

  useEffect(() => {
    loadCategories(0);
  }, [loadCategories]);

  useEffect(() => (
    () => {
      if (iconPreview) {
        URL.revokeObjectURL(iconPreview);
      }
    }
  ), [iconPreview]);

  return (
    <div className="p-6 max-w-7xl mx-auto dark:bg-gray-900">
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Category Manager</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Create categories and connect them to parent categories.</p>
          </div>
          <button
            type="button"
            onClick={() => loadCategories(currentPage)}
            disabled={loading}
            className="self-start sm:self-auto px-5 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Add Category
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category Icon *</label>
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-900/40">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
                    {iconPreview ? (
                      <img src={iconPreview} alt="Category icon preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center text-gray-400">
                        <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5V7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m3 16 4.5-4.5a2 2 0 0 1 2.8 0L13 14m0 0 1-1a2 2 0 0 1 2.8 0L21 17m-8-3 2 2" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.5 8.5h.01" />
                        </svg>
                        <span className="mt-2 text-xs font-semibold">Icon</span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">Upload category artwork</p>
                    <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                      Use a clear square image. This icon appears in the categories list.
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white">
                        Choose image
                        <input
                          key={uploadInputKey}
                          type="file"
                          accept="image/*"
                          onChange={handleIconChange}
                          disabled={saving}
                          className="sr-only"
                          required
                        />
                      </label>
                      <span className="max-w-full truncate text-sm text-gray-600 dark:text-gray-300">
                        {form.iconFile?.name || 'No image selected'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateFormField('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Category name"
                disabled={saving}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender *</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Male', value: 'M' },
                  { label: 'Female', value: 'F' }
                ].map((option) => {
                  const isSelected = form.gender === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateFormField('gender', option.value)}
                      disabled={saving}
                      className={`rounded-xl border px-4 py-3 text-left font-semibold transition-all disabled:opacity-50 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-400 dark:bg-blue-900/40 dark:text-blue-100'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50/60 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:border-blue-500'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <input className="sr-only" value={form.gender} onChange={() => {}} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Details</label>
              <textarea
                value={form.details}
                onChange={(e) => updateFormField('details', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Optional description"
                disabled={saving}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Parent Category</label>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Optional</span>
              </div>

              <div className="rounded-xl border border-gray-300 bg-white p-3 shadow-sm dark:border-gray-600 dark:bg-gray-700">
                <select
                  value={form.parentId}
                  onChange={(e) => updateFormField('parentId', e.target.value)}
                  className="w-full bg-transparent font-medium text-gray-900 outline-none dark:text-gray-100"
                  disabled={loading || saving}
                >
                  <option value="">No parent category</option>
                  {loading ? (
                    <option>Loading categories...</option>
                  ) : categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} - {formatGender(cat.gender)}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                  Leave empty for a main category. Select a parent only when this is a subcategory.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {saving ? 'Saving...' : 'Create'}
              </button>
              {(form.name || form.gender || form.details || form.parentId) && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          {formError && (
            <div className="mt-6 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-5">
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-200">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  </svg>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-red-900 dark:text-red-100">Cannot create category</p>
                  <p className="mt-1 text-sm leading-6 text-red-800 dark:text-red-200">{formError}</p>
                </div>
              </div>

              {lastCreateRequest && (
                <div className="mt-4 rounded-xl border border-red-200/80 dark:border-red-800/70 bg-white/80 dark:bg-gray-950/80 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase text-red-700 dark:text-red-200">Request sent</p>
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Name</dt>
                      <dd className="mt-1 break-words font-medium text-gray-900 dark:text-gray-100">{lastCreateRequest.categoryName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Gender</dt>
                      <dd className="mt-1 font-medium text-gray-900 dark:text-gray-100">{lastCreateRequest.categoryGender}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Icon</dt>
                      <dd className="mt-1 break-words text-gray-800 dark:text-gray-200">
                        {lastCreateRequest.categoryIcon?.name || 'No icon selected'}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Description</dt>
                      <dd className="mt-1 break-words text-gray-800 dark:text-gray-200">{lastCreateRequest.categoryDescription || 'No description'}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Parent</dt>
                      <dd className="mt-1 break-all text-gray-800 dark:text-gray-200">{lastCreateRequest.parentCategoryId || 'No parent category'}</dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          )}

          {listError && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
              <p className="text-red-800 dark:text-red-200 font-medium">{listError}</p>
            </div>
          )}
        </div>

        {/* List */}
        <div className="overflow-hidden bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 bg-gray-50 px-8 py-6 dark:border-gray-700 dark:bg-gray-800/80">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Categories</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {firstCategoryNumber}-{lastCategoryNumber} of {totalCategories}
                </p>
              </div>
              <span className="rounded-xl bg-blue-50 dark:bg-blue-900/30 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-200">
                Page {getDisplayPage(currentPage)}
              </span>
            </div>
          </div>

          <div className="p-8">
          {loading && categories.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : listError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center dark:border-red-800/50 dark:bg-red-900/20">
              <p className="text-red-600 dark:text-red-400 font-medium mb-4">{listError}</p>
              <button
                onClick={() => loadCategories(currentPage)}
                className="px-6 py-2 bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 text-white rounded-xl transition-colors shadow-lg"
              >
                Retry
              </button>
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-600">
              <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No categories</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first category above</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="hidden bg-gray-50 px-5 py-3 text-xs font-semibold uppercase text-gray-500 dark:bg-gray-900/60 dark:text-gray-400 sm:grid sm:grid-cols-[minmax(0,1fr)_120px] sm:gap-4">
                  <span>Category</span>
                  <span>Gender</span>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {categories.map((cat) => (
                    <div key={cat.id} className="grid gap-4 px-5 py-5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40 sm:grid-cols-[minmax(0,1fr)_120px] sm:items-center">
                      <div className="flex min-w-0 gap-4">
                        <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blue-50 text-base font-bold text-blue-700 ring-1 ring-gray-200 dark:bg-blue-900/40 dark:text-blue-100 dark:ring-gray-700">
                          {cat.name?.charAt(0)?.toUpperCase() || 'C'}
                          {cat.icon && (
                            <img
                              src={cat.icon}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-gray-900 dark:text-white">{cat.name}</h3>
                          <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                            {cat.details || 'No description added yet.'}
                          </p>
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <span className="inline-flex rounded bg-gray-200 dark:bg-gray-700 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200">
                          {formatGender(cat.gender)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {totalPages > 1 && (
                <div className="border-t border-gray-200 pt-6 dark:border-gray-600">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                    >
                      Previous
                    </button>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        Page <span className="text-blue-600 dark:text-blue-400">{getDisplayPage(currentPage)}</span> of {totalPages}
                      </div>
                    </div>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages - 1}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
