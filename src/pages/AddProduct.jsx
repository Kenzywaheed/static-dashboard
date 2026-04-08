import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ColorVariantManager from "../components/Common/ColorVariantManager";
import ProductListPanel from "../components/Common/ProductListPanel";

const MOCK_CATEGORIES = [
  { id: 1, name: 'T-Shirts', gender: 'Unisex' },
  { id: 2, name: 'Jeans', gender: 'Male' },
  { id: 3, name: 'Dresses', gender: 'Female' },
  { id: 4, name: 'Casual Wear', gender: 'Unisex' },
  { id: 5, name: 'Formal Wear', gender: 'Unisex' },
];

const MOCK_PRODUCTS = [
  { id: 1, name: 'Classic White T-Shirt', price: 29.99, description: 'Premium cotton t-shirt', category: 'T-Shirts', quantity: 40, images: ['https://via.placeholder.com/150'] },
  { id: 2, name: 'Denim Jeans', price: 79.99, description: 'Classic fit denim jeans', category: 'Jeans', quantity: 29, images: ['https://via.placeholder.com/150'] },
  { id: 3, name: 'Summer Dress', price: 59.99, description: 'Light and breezy summer dress', category: 'Dresses', quantity: 22, images: ['https://via.placeholder.com/150'] },
];

const AddProduct = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
  });
  
  const [images, setImages] = useState([]);
  const [colors, setColors] = useState([]);
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [dragOver, setDragOver] = useState(false);

  const categories = MOCK_CATEGORIES;

  const getTotalStock = () => {
    return colors.reduce((sum, c) => sum + Object.values(c.sizes || {}).reduce((s, q) => s + q, 0), 0);
  };

  const handleEditClick = (product) => {
    setEditId(product.id);
    setForm({
      name: product.name || "",
      price: product.price?.toString() || "",
      description: product.description || "",
      category: product.category || "",
    });
    if (product.images) {
      setImages(product.images.map((src, i) => ({ id: i, src })));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [...prev, { id: Date.now() + Math.random(), src: reader.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [...prev, { id: Date.now() + Math.random(), src: reader.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleColorsChange = (newColors) => {
    setColors(newColors);
  };

  const validate = () => {
    if (!form.name.trim()) return toast.error("Product name is required");
    if (!form.price || parseFloat(form.price) <= 0) return toast.error("Please enter a valid price");
    if (!form.category) return toast.error("Please select a category");
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const totalQty = getTotalStock();
    const productData = {
      name: form.name,
      price: parseFloat(form.price),
      description: form.description,
      category: form.category,
      images: images.length > 0 ? images.map((i) => i.src) : ['https://via.placeholder.com/150'],
      colors,
      quantity: totalQty,
    };
    if (editId) {
      setProducts(products.map(p => p.id === editId ? { ...p, ...productData, id: editId } : p));
      toast.success("Product updated successfully!");
    } else {
      const newProduct = { ...productData, id: Date.now() };
      setProducts([...products, newProduct]);
      toast.success("Product created successfully!");
    }
    resetForm();
  };

  const resetForm = () => {
    setForm({ name: "", price: "", description: "", category: "" });
    setImages([]);
    setColors([]);
    setEditId(null);
  };

  const handleDelete = (id) => {
    if (!confirm("Are you sure?")) return;
    setProducts(products.filter(p => p.id !== id));
    toast.success("Product deleted successfully");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {editId ? "Edit Product" : "Add Product"}
          </h1>
         
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white text-center">
              Product Images
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              Upload multiple product images
            </p>
            <div 
              className="grid grid-cols-4 gap-4 max-w-md mx-auto"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {images.map((img) => (
                <div key={img.id} className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden group cursor-pointer">
                  <img src={img.src} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => removeImage(img.id)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              {images.length < 10 && (
                <label 
                  onClick={openFilePicker}
                  className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                >
                  <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-blue-100 group-hover:scale-110 transition-all">
                    <svg className="h-7 w-7 text-gray-400 group-hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">Add</span>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
            {images.length === 0 && (
              <div 
                onClick={openFilePicker}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`mt-6 max-w-md mx-auto border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}
              >
                <svg className="h-14 w-14 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-base text-gray-600 dark:text-gray-400 font-medium">
                  Drag and drop images here or click to browse
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  PNG, JPG up to 10MB (max 10 images)
                </p>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white text-center">
              Basic Information
            </h2>
            <div className="max-w-lg mx-auto space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  placeholder="Enter product name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400 resize-none"
                  placeholder="Enter product description..."
                />
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => navigate('/product-details')}
                className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold"
              >
                Add Product Details
              </button>
              {editId && (
                <button
                  onClick={resetForm}
                  className="px-8 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSubmit}
                className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold"
              >
                {editId ? "Update Product" : "Save Product"}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <ProductListPanel
            products={products}
            onEdit={handleEditClick}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
};

export default AddProduct;

