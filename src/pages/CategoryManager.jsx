import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { categoriesAPI } from '../services/endpoints';

const CategoryManager = () => {
  const [form, setForm] = useState({
    name: '',
    gender: '',
    details: '',
    parentId: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [parentLoading, setParentLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load paginated categories
  const loadCategories = useCallback(async (page) => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoriesAPI.getAll(page, 10);
      const data = response.data;
      setCategories(data.data || []);
      setCurrentPage(page);
      setTotalCategories(data.totalCount || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Load categories error:', err);
      setError('Failed to load categories');
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []); 

  // Load ALL categories for parent dropdown
  const loadAllCategories = useCallback(async () => {
    setParentLoading(true);
    try {
      const response = await categoriesAPI.getAllFlat();
      setAllCategories(response.data.data || response.data || []);
    } catch (err) {
      console.error('Load all categories error:', err);
      toast.error('Failed to load parent categories');
      setAllCategories([]);
    } finally {
      setParentLoading(false);
    }
  }, []); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!form.name.trim() || !form.gender) {
      toast.error('Name and Gender required');
      setLoading(false);
      return;
    }

    try {
      const categoryData = {
        name: form.name.trim(),
        gender: form.gender,
        details: form.details.trim() || '',
        parentId: form.parentId ? parseInt(form.parentId) : null
      };

      if (editingId) {
        await categoriesAPI.update(editingId, categoryData);
        toast.success('Category updated!');
      } else {
        await categoriesAPI.create(categoryData);
        toast.success('Category created!');
      }

      await Promise.all([
        loadCategories(currentPage),
        loadAllCategories()
      ]);
      handleCancel();
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err.response?.data?.message || 'Failed to save category');
      setError('Failed to save category');
    } finally {
      setLoading(false);
    }
  }; 

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      gender: cat.gender,
      details: cat.details || '',
      parentId: cat.parentId?.toString() || ''
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await categoriesAPI.delete(id);
      toast.success('Category deleted!');
      await Promise.all([
        loadCategories(currentPage), 
        loadAllCategories()
      ]);
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Delete failed');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ name: '', gender: '', details: '', parentId: '' });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      loadCategories(newPage);
    }
  };

  useEffect(() => {
    loadCategories(1);
    loadAllCategories();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto dark:bg-gray-900">
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Category Manager</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage categories with parent-child relationships</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            {editingId ? 'Edit Category' : 'Add Category'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Category name"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender *</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({...form, gender: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                disabled={loading}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Details</label>
              <textarea
                value={form.details}
                onChange={(e) => setForm({...form, details: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Optional description"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Parent Category</label>
              <select
                value={form.parentId}
                onChange={(e) => setForm({...form, parentId: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                disabled={parentLoading || loading}
              >
                <option value="">-- No Parent --</option>
                {parentLoading ? (
                  <option>Loading...</option>
                ) : allCategories.map(cat => (
                  <option key={cat.id} value={cat.id} disabled={editingId === cat.id}>
                    {cat.name} ({cat.gender})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
              <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* List */}
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Categories ({totalCategories})</h2>

          {loading && categories.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 font-medium mb-4">{error}</p>
              <button
                onClick={() => loadCategories(currentPage)}
                className="px-6 py-2 bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 text-white rounded-xl transition-colors shadow-lg"
              >
                Retry
              </button>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No categories</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first category above</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                {categories.map((cat) => (
                  <div key={cat.id} className="group flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg rounded-2xl transition-all border border-gray-200 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-500">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">{cat.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">{cat.gender}</p>
                      {cat.details && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{cat.details}</p>
                      )}
                      {cat.parentId && (
                        <p className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-2 py-1 rounded mt-1 inline-block">Has parent</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex-shrink-0">
                      <button
                        onClick={() => handleEdit(cat)}
                        disabled={loading}
                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl transition-all hover:scale-105 shadow-sm"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        disabled={loading}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl transition-all hover:scale-105 shadow-sm"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pt-6 border-t border-gray-200 dark:border-gray-600 mt-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all disabled:opacity-50 min-w-[120px]"
                    >
                      Previous
                    </button>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      Page <span className="text-blue-600 dark:text-blue-400">{currentPage}</span> of {totalPages}
                    </div>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all disabled:opacity-50 min-w-[120px]"
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
  );
};

export default CategoryManager;
