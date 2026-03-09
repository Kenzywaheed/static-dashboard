
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

// Static mock products data
const MOCK_PRODUCTS = [
  { id: 1, name: 'Classic White T-Shirt', price: 29.99, description: 'Premium cotton t-shirt', category: 'T-Shirts', sizes: { S: 10, M: 15, L: 8, XL: 5, XXL: 2 }, quantity: 40, image: 'https://via.placeholder.com/150' },
  { id: 2, name: 'Denim Jeans', price: 79.99, description: 'Classic fit denim jeans', category: 'Jeans', sizes: { S: 0, M: 8, L: 12, XL: 6, XXL: 3 }, quantity: 29, image: 'https://via.placeholder.com/150' },
  { id: 3, name: 'Summer Dress', price: 59.99, description: 'Light and breezy summer dress', category: 'Dresses', sizes: { S: 5, M: 10, L: 7, XL: 0, XXL: 0 }, quantity: 22, image: 'https://via.placeholder.com/150' },
];

const ProductListPanel = ({ products: propProducts, onEdit, onDelete, className = '' }) => {
  // Use prop products if provided, otherwise use mock data
  const products = propProducts || MOCK_PRODUCTS;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        All Products ({products.length})
      </h3>

      {products.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
          No products yet
        </p>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {/* Product Image */}
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-600">
                <img
                  src={product.image || product.images?.[0] || 'https://via.placeholder.com/150'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-800 dark:text-white truncate">
                  {product.name}
                </h4>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  ${product.price?.toFixed(2)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {onEdit && (
                  <button
                    onClick={() => onEdit(product)}
                    className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(product.id)}
                    className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductListPanel;

