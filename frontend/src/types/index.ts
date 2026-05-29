export interface User {
  id: string;
  email: string;
  role: string;
}

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  category?: { name: string };
  brand?: { name: string };
  inventory: { quantity: number };
}

export interface CartItem {
  id: string;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  itemCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}