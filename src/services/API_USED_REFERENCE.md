# API Used Reference

This file documents the APIs currently used by the dashboard product and category flows.
It is meant to be a quick reference before editing frontend requests.

## Categories

### List categories
- Method: `GET`
- URL: `/api/v1/categories/brands`
- Query params:
  - `page`
  - `size`
- Purpose:
  - Load brand categories for category management
  - Load category options inside product creation

### Create category
- Method: `POST`
- URL: `/api/v1/brands/categories`
- Content type: `multipart/form-data`
- Fields:
  - `categoryNameEn`
  - `categoryNameAr`
  - `categoryDescriptionEn`
  - `categoryDescriptionAr`
  - `categoryGender`
  - `categoryIcon`
  - `parentCategoryId` optional
- Purpose:
  - Create a new category from the category form

### Update category
- Method: `PATCH`
- URL: `/api/v1/brands/categories/{categoryId}`
- Content type: `multipart/form-data`
- Fields:
  - `categoryNameEn`
  - `categoryNameAr`
  - `categoryDescriptionEn`
  - `categoryDescriptionAr`
  - `imageIcon`
  - `parentCategoryId`
- Purpose:
  - Edit an existing category

### Delete category
- Method: `DELETE`
- URL: `/api/v1/brands/categories/{categoryId}`
- Purpose:
  - Remove a category

## Products

### List products for brand owner
- Method: `GET`
- URL: `/api/v1/brands/product`
- Query params:
  - `page`
  - `size`
- Current response summary fields used by the frontend:
  - `productNameAr`
  - `productNameEn`
  - `id`
  - `thumbnail`
  - `categoryNameEn`
  - `categoryNameAr`
  - `currentColors`
  - `basePrice`
- Purpose:
  - Load all products in the product management screens
  - Load product stats in dashboard widgets
  - Note:
    - This response is currently treated as a summary list response.
    - It gives the total number of colors with `currentColors`, but not the full color details list.

### Create product
- Method: `POST`
- URL: `/api/v1/brands/product`
- Content type: `multipart/form-data`
- Fields:
  - `productNameEn`
  - `productDescriptionEn`
  - `productNameAr`
  - `productDescriptionAr`
  - `productPrice`
  - `categoryId`
  - `thumbnail`
- Purpose:
  - Create a base product before adding colors

### Update product
- Method: `PATCH`
- URL: `/api/v1/brands/product/{productId}`
- Content type: `multipart/form-data`
- Fields:
  - `productNameEn`
  - `productNameAr`
  - `productDescriptionEn`
  - `productDescriptionAr`
  - `productPrice`
  - `categoryId`
  - `thumbnail`
- Purpose:
  - Reserved for product editing flow

### Delete product
- Method: `DELETE`
- URL: `/api/v1/brands/product/{productId}`
- Purpose:
  - Remove a product from the brand catalog

## Product Colors

### Create product color
- Method: `POST`
- URL: `/api/v1/brands/product/{productId}/colors`
- Content type: `multipart/form-data`
- Fields:
  - `colorCode`
  - `colorImages`
- Purpose:
  - Add one color with images to a selected product

### Delete product color
- Method: `DELETE`
- URL: `/api/v1/brands/product/{productId}/colors/{colorId}`
- Purpose:
  - Remove a color from a product

## Product Variants

### Create product variant
- Method: `POST`
- URL: `/api/v1/brands/product/{productId}/colors/{colorId}/variants`
- Content type: `multipart/form-data`
- Fields:
  - `size`
  - `sku`
  - `price`
  - `stock`
- Purpose:
  - Add one sellable size row under a selected color

### Update variant stock
- Method: `PATCH`
- URL: `/api/v1/brands/product/{productId}/colors/{colorId}/variants/{variantId}/stock`
- Content type: `application/json`
- Body:
  - `stock`
- Purpose:
  - Update stock only for an existing variant

## Auth

### Generate OTP
- Method: `POST`
- URL: `/api/v1/public/otp/generate`
- Purpose:
  - Request OTP for login

### Verify OTP
- Method: `POST`
- URL: `/api/v1/public/otp/verify`
- Purpose:
  - Verify OTP and receive access token and refresh token

### Refresh token
- Method: `POST`
- URL: `/api/v1/public/otp/refresh`
- Purpose:
  - Renew access token when it expires
