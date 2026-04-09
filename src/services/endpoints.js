import axios from "axios";

const CATEGORIES_BASE_URL = 'https://ecommerce-app-e6303c36e118.herokuapp.com/api/v1/brands/categories';

export const categoriesAPI = {
  getAll: (page = 1, limit = 10) => axios.get(`${CATEGORIES_BASE_URL}?page=${page}&limit=${limit}`),
  getAllFlat: () => axios.get(`${CATEGORIES_BASE_URL}?page=1&limit=1000`),
  create: (data) => axios.post(`${CATEGORIES_BASE_URL}/`, data),
  update: (id, data) => axios.put(`${CATEGORIES_BASE_URL}/${id}`, data),
  delete: (id) => axios.delete(`${CATEGORIES_BASE_URL}/${id}`),
};
