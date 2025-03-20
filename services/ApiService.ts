import axios from 'axios';
import { Product } from '../models/Product';

const API_URL = 'http://192.168.1.3:5000'; 

// Chuyển đổi dữ liệu từ backend sang frontend
const mapProductFromApi = (data: any): Product => {
  return {
    id: data._id,
    idsanpham: data.idsanpham || '',
    loaisp: data.loaisp || '',
    gia: data.gia || 0,
    hinhanh: data.hinhanh || 'https://via.placeholder.com/150'
  };
};

// Chuyển đổi dữ liệu từ frontend sang backend
const mapProductToApi = (product: Product) => {
  const { id, ...productData } = product;
  return productData;
};

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const response = await axios.get(`${API_URL}/products`);
    return response.data.map(mapProductFromApi);
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

export const createProduct = async (product: Product): Promise<Product> => {
  try {
    const productData = mapProductToApi(product);
    const response = await axios.post(`${API_URL}/products`, productData);
    return mapProductFromApi(response.data);
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const updateProduct = async (product: Product): Promise<Product> => {
  try {
    const productData = mapProductToApi(product);
    const response = await axios.put(`${API_URL}/products/${product.id}`, productData);
    return mapProductFromApi(response.data);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/products/${productId}`);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};