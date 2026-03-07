import { useRef } from 'react';
import { PlusIcon, TrashIcon, PhotoIcon } from '@heroicons/react/24/outline';
import QuantityCounter from './QuantityCounter';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const ColorVariantManager = ({ 
  colors = [], 
  onChange,
  className = '' 
}) => {
  const fileInputRefs = useRef({});

  const addColor = () => {
    const newColor = {
      id: Date.now(),
      color: '#000000',
      image: null,
      sizes: {
        S: 0,
        M: 0,
        L: 0,
        XL: 0,
        XXL: 0
      }
    };
    onChange([...colors, newColor]);
  };

  const removeColor = (id) => {
    onChange(colors.filter(c => c.id !== id));
  };

  const updateColor = (id, field, value) => {
    onChange(colors.map(c => {
      if (c.id === id) {
        return { ...c, [field]: value };
      }
      return c;
    }));
  };

  const updateSizeQuantity = (colorId, size, quantity) => {
    onChange(colors.map(c => {
      if (c.id === colorId) {
        return {
          ...c,
          sizes: {
            ...c.sizes,
            [size]: quantity
          }
        };
      }
      return c;
    }));
  };

  const handleImageSelect = (colorId) => {
    fileInputRefs.current[colorId]?.click();
  };

  const handleImageChange = (colorId, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateColor(colorId, 'image', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getTotalQuantity = (color) => {
    return Object.values(color.sizes).reduce((sum, qty) => sum + qty, 0);
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Color Variants
        </h3>
        <button
          type="button"
          onClick={addColor}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md hover:shadow-lg"
        >
          <PlusIcon className="h-4 w-4" />
          Add Color
        </button>
      </div>

      {colors.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <PhotoIcon className="h-10 w-10 text-gray-400" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">
                No color variants added
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Click "Add Color" to create your first color variant
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {colors.map((color) => (
            <div 
              key={color.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Color Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Color Variant
                  </span>
                  <button
                    type="button"
                    onClick={() => removeColor(color.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-sm"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Select Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Select Color
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={color.color}
                      onChange={(e) => updateColor(color.id, 'color', e.target.value)}
                      className="w-16 h-16 rounded-xl cursor-pointer border-3 border-gray-200 dark:border-gray-600 shadow-inner hover:scale-105 transition-transform"
                    />
                    <input
                      type="text"
                      value={color.color}
                      onChange={(e) => updateColor(color.id, 'color', e.target.value)}
                      className="flex-1 px-4 py-3 text-base border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="#000000"
                    />
                    <div 
                      className="w-16 h-16 rounded-xl border-3 border-gray-200 dark:border-gray-600 shadow-inner"
                      style={{ backgroundColor: color.color }}
                    />
                  </div>
                </div>

                {/* Color Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Color Image
                  </label>
                  <div 
                    onClick={() => handleImageSelect(color.id)}
                    className="w-full h-40 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 flex items-center justify-center cursor-pointer overflow-hidden hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                  >
                    {color.image ? (
                      <div className="relative w-full h-full">
                        <img 
                          src={color.image} 
                          alt="Color variant" 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white font-medium">Change Image</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <PhotoIcon className="h-10 w-10" />
                        <span className="text-sm font-medium">Click to upload image</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={(el) => (fileInputRefs.current[color.id] = el)}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(color.id, e)}
                    className="hidden"
                  />
                </div>

                {/* Size Quantities - Vertical Stack */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Size Quantities
                  </label>
                  <div className="space-y-3">
                    {SIZES.map((size) => (
                      <div key={size} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <span className="text-base font-semibold text-gray-700 dark:text-gray-300 w-16">
                          Size {size}
                        </span>
                        <div className="flex-1 max-w-xs">
                          <QuantityCounter
                            value={color.sizes[size] || 0}
                            onChange={(qty) => updateSizeQuantity(color.id, size, qty)}
                            min={0}
                            max={999}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Stock */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                    <span className="text-base font-semibold text-gray-700 dark:text-gray-300">
                      Total Stock for this Color
                    </span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {getTotalQuantity(color)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorVariantManager;

