import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import ColorVariantManager from '../components/Common/ColorVariantManager';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const ProductVariants = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [colors, setColors] = useState([]);
  const [totalStock, setTotalStock] = useState(0);

  useEffect(() => {
    const total = colors.reduce((sum, c) => {
      return sum + Object.values(c.sizes || {}).reduce((s, q) => s + q, 0);
    }, 0);
    setTotalStock(total);
  }, [colors]);

  const handleColorsChange = (newColors) => {
    setColors(newColors);
  };

  const handleSave = () => {
    toast.success('Product variants saved!');
    navigate('/add-product');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/add-product')}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Product Variants
          </h1>
        </div>

        <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Stock: </span>
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{totalStock}</span>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <ColorVariantManager
            colors={colors}
            onChange={handleColorsChange}
          />

          <div className="flex justify-end gap-4 pt-8 border-t border-gray-200 dark:border-gray-600 mt-8">
            <button
              onClick={() => navigate('/add-product')}
              className="px-8 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl font-semibold"
            >
              Save Variants
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductVariants;

