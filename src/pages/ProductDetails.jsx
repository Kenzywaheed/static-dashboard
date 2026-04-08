import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ColorVariantManager from '../components/Common/ColorVariantManager';

const ProductDetails = () => {
  const navigate = useNavigate();
const [colors, setColors] = useState([{ id: Date.now(), color: '#000000', image: null, sizes: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 }}]);

  const handleBack = () => {
    navigate('/add-product');
  };

  const handleSave = () => {
    // Save variants data
    navigate('/add-product');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex-1 text-center">
            Product Details
          </h1>
          <button
            onClick={handleSave}
            className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold"
          >
            Save & Return
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <ColorVariantManager
            colors={colors}
            onChange={setColors}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
