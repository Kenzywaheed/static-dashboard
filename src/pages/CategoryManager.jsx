import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PencilIcon, TrashIcon, FolderIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import toast from 'react-hot-toast';

const CategoryManager = () => {
  const [form, setForm] = useState({
    name: '',
    gender: '',
    details: '',
    parentId: ''
  });

  const [editingId, setEditingId] = useState(null);
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const res = await api.get('/categories');
        return res.data || [];
      } catch (e) {
        return [];
      }
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created!');
      setForm({ name: '', gender: '', details: '', parentId: '' });
    },
    onError: () => toast.error('Failed to create')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated!');
      setEditingId(null);
      setForm({ name: '', gender: '', details: '', parentId: '' });
    },
    onError: () => toast.error('Failed to update')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted!');
    },
    onError: () => toast.error('Failed to delete')
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name || !form.gender) {
      toast.error('Name and Gender are required');
      return;
    }

    const data = {
      ...form,
      parentId: form.parentId ? parseInt(form.parentId) : null
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      gender: cat.gender,
      details: cat.details || '',
      parentId: cat.parentId || ''
    });
  };

  const handleDelete = (id) => {
    if (confirm('Delete this category?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ name: '', gender: '', details: '', parentId: '' });
  };

  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Categories
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage product categories
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* FORM */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">

          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            {editingId ? 'Edit Category' : 'Create Category'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Gender *
              </label>

              <select
                value={form.gender}
                onChange={(e) =>
                  setForm({ ...form, gender: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Name *
              </label>

              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                placeholder="Category name"
              />
            </div>

            {/* Details */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Details
              </label>

              <textarea
                rows={3}
                value={form.details}
                onChange={(e) =>
                  setForm({ ...form, details: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                placeholder="Category details"
              />
            </div>

            {/* Parent */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Parent Category
              </label>

              <select
                value={form.parentId}
                onChange={(e) =>
                  setForm({ ...form, parentId: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:text-white"
              >
                <option value="">None</option>

                {categories
                  .filter((c) => c.id !== editingId)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.gender})
                    </option>
                  ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">

              <button
                type="submit"
                disabled={
                  createMutation.isPending || updateMutation.isPending
                }
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {editingId ? 'Update' : 'Create'}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
              )}
            </div>

          </form>
        </div>

        {/* LIST */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">

          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            All Categories ({categories.length})
          </h2>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-200 rounded animate-pulse"
                />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No categories yet
            </p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">

              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >

                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <FolderIcon className="h-5 w-5 text-blue-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 dark:text-white">
                      {cat.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {cat.gender}
                    </p>
                  </div>

                  <div className="flex gap-1">

                    <button
                      onClick={() => handleEdit(cat)}
                      className="p-2 text-blue-500 hover:bg-blue-100 rounded"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-2 text-red-500 hover:bg-red-100 rounded"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>

                  </div>

                </div>
              ))}

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CategoryManager;