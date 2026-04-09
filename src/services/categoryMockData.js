export const mockCategories = [
  {
    id: 1,
    name: 'Men Clothing',
    gender: 'Male',
    details: 'All men apparel',
    parentId: null
  },
  {
    id: 2,
    name: 'T-Shirts',
    gender: 'Male',
    details: 'Men t-shirts collection',
    parentId: 1
  },
  {
    id: 3,
    name: 'Women Clothing',
    gender: 'Female',
    details: 'All women apparel',
    parentId: null
  },
  {
    id: 4,
    name: 'Dresses',
    gender: 'Female',
    details: 'Elegant dresses',
    parentId: 3
  },
  {
    id: 5,
    name: 'Unisex Accessories',
    gender: 'Unisex',
    details: 'Bags and accessories',
    parentId: null
  }
];

export const mockTotalCategories = 25;
export const mockTotalPages = 3;
