import axios from "axios";

const CATEGORIES_BASE_URL = 'https://ecommerce-app-e6303c36e118.herokuapp.com/api/v1/brands/categories';
const PRODUCTS_BASE_URL = 'API_WAITING_FOR_BACKEND_PRODUCT_ROUTE';

export const categoriesAPI = {
  // GET categories from the backend. The page uses this for the list and parent dropdown.
  getAll: (page = 0, size = 10) => axios.get(`${CATEGORIES_BASE_URL}?page=${page}&size=${size}`),

  // POST one new category as multipart form-data. The backend currently does not read JSON here.
  create: (data) => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });

    return axios.post(CATEGORIES_BASE_URL, formData);
  },
};

export const productsAPI = {
  // Placeholder until the backend exposes the brand product/product-item controller.
  create: () => Promise.reject(new Error(`Product API is not ready: ${PRODUCTS_BASE_URL}`)),
};
