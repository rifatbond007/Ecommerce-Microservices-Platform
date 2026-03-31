// Mock data for e-commerce platform

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  image?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
  attributes: Record<string, string>; // e.g., { size: "M", color: "Blue" }
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  categoryId: string;
  brandId: string;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  isFeatured: boolean;
  isActive: boolean;
  variants?: ProductVariant[];
  tags: string[];
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'seller' | 'admin';
  sellerStatus?: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Address {
  id: string;
  userId: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  type: 'shipping' | 'billing' | 'both';
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  variantId?: string;
  variantDetails?: string;
}

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: Address;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wishlist {
  id: string;
  userId: string;
  name: string;
  productIds: string[];
  isDefault: boolean;
}

// Categories
export const categories: Category[] = [
  { id: '1', name: 'Electronics', slug: 'electronics', image: 'https://images.unsplash.com/photo-1764053430604-d585d1f1dad6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBlbGVjdHJvbmljcyUyMGxhcHRvcCUyMHNtYXJ0cGhvbmV8ZW58MXx8fHwxNzc0OTYwODYzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
  { id: '2', name: 'Fashion', slug: 'fashion', image: 'https://images.unsplash.com/photo-1774691799598-71e688b1bf7f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmclMjBhcHBhcmVsfGVufDF8fHx8MTc3NDkzMTYwNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
  { id: '3', name: 'Home & Furniture', slug: 'home-furniture', image: 'https://images.unsplash.com/photo-1630224049701-c1e2c7c671c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdXJuaXR1cmUlMjBob21lJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzc0OTYwODY0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
  { id: '4', name: 'Sports & Fitness', slug: 'sports-fitness', image: 'https://images.unsplash.com/photo-1758875568468-194dfe762ba9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBmaXRuZXNzJTIwZXF1aXBtZW50fGVufDF8fHx8MTc3NDkwMjI1N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
  { id: '5', name: 'Books', slug: 'books', image: 'https://images.unsplash.com/photo-1716654716572-7b13ad56ba63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rcyUyMHJlYWRpbmclMjBsaWJyYXJ5fGVufDF8fHx8MTc3NDkxMzY4NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
  { id: '6', name: 'Kitchen', slug: 'kitchen', image: 'https://images.unsplash.com/photo-1740803292374-1b167c1558b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwYXBwbGlhbmNlcyUyMGNvb2tpbmd8ZW58MXx8fHwxNzc0OTMxNjA3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
  { id: '7', name: 'Beauty', slug: 'beauty', image: 'https://images.unsplash.com/photo-1595051665600-afd01ea7c446?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWF1dHklMjBjb3NtZXRpY3MlMjBza2luY2FyZXxlbnwxfHx8fDE3NzQ5MjIwMzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
  { id: '8', name: 'Toys', slug: 'toys', image: 'https://images.unsplash.com/photo-1517242810446-cc8951b2be40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b3lzJTIwY2hpbGRyZW4lMjBnYW1lc3xlbnwxfHx8fDE3NzQ4NTc5MDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
];

// Brands
export const brands: Brand[] = [
  { id: '1', name: 'TechPro', slug: 'techpro' },
  { id: '2', name: 'StyleHub', slug: 'stylehub' },
  { id: '3', name: 'HomeLux', slug: 'homelux' },
  { id: '4', name: 'FitLife', slug: 'fitlife' },
  { id: '5', name: 'ReadMore', slug: 'readmore' },
  { id: '6', name: 'ChefMate', slug: 'chefmate' },
  { id: '7', name: 'GlowUp', slug: 'glowup' },
  { id: '8', name: 'PlayTime', slug: 'playtime' },
];

// Products
export const products: Product[] = [
  {
    id: '1',
    name: 'Wireless Headphones Pro',
    slug: 'wireless-headphones-pro',
    description: 'Premium wireless headphones with active noise cancellation and 30-hour battery life.',
    price: 299.99,
    originalPrice: 399.99,
    categoryId: '1',
    brandId: '1',
    images: [
      'https://images.unsplash.com/photo-1764053430604-d585d1f1dad6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBlbGVjdHJvbmljcyUyMGxhcHRvcCUyMHNtYXJ0cGhvbmV8ZW58MXx8fHwxNzc0OTYwODYzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    ],
    rating: 4.5,
    reviewCount: 128,
    stock: 45,
    isFeatured: true,
    isActive: true,
    tags: ['electronics', 'audio', 'wireless'],
  },
  {
    id: '2',
    name: 'Classic Denim Jacket',
    slug: 'classic-denim-jacket',
    description: 'Timeless denim jacket perfect for any season. Made from premium quality cotton.',
    price: 89.99,
    categoryId: '2',
    brandId: '2',
    images: [
      'https://images.unsplash.com/photo-1774691799598-71e688b1bf7f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmclMjBhcHBhcmVsfGVufDF8fHx8MTc3NDkzMTYwNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    ],
    rating: 4.7,
    reviewCount: 89,
    stock: 32,
    isFeatured: true,
    isActive: true,
    variants: [
      { id: 'v1', name: 'Small Blue', price: 89.99, stock: 10, attributes: { size: 'S', color: 'Blue' } },
      { id: 'v2', name: 'Medium Blue', price: 89.99, stock: 12, attributes: { size: 'M', color: 'Blue' } },
      { id: 'v3', name: 'Large Blue', price: 89.99, stock: 10, attributes: { size: 'L', color: 'Blue' } },
    ],
    tags: ['fashion', 'jacket', 'denim'],
  },
  {
    id: '3',
    name: 'Modern Accent Chair',
    slug: 'modern-accent-chair',
    description: 'Elegant accent chair with velvet upholstery and solid wood legs.',
    price: 349.99,
    originalPrice: 449.99,
    categoryId: '3',
    brandId: '3',
    images: [
      'https://images.unsplash.com/photo-1630224049701-c1e2c7c671c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdXJuaXR1cmUlMjBob21lJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzc0OTYwODY0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    ],
    rating: 4.8,
    reviewCount: 56,
    stock: 18,
    isFeatured: true,
    isActive: true,
    tags: ['furniture', 'chair', 'home'],
  },
  {
    id: '4',
    name: 'Yoga Mat Premium',
    slug: 'yoga-mat-premium',
    description: 'Extra thick yoga mat with non-slip surface and carrying strap.',
    price: 49.99,
    categoryId: '4',
    brandId: '4',
    images: [
      'https://images.unsplash.com/photo-1758875568468-194dfe762ba9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBmaXRuZXNzJTIwZXF1aXBtZW50fGVufDF8fHx8MTc3NDkwMjI1N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    ],
    rating: 4.6,
    reviewCount: 203,
    stock: 76,
    isFeatured: false,
    isActive: true,
    tags: ['sports', 'fitness', 'yoga'],
  },
  {
    id: '5',
    name: 'The Art of Design',
    slug: 'the-art-of-design',
    description: 'A comprehensive guide to modern design principles and practices.',
    price: 29.99,
    categoryId: '5',
    brandId: '5',
    images: [
      'https://images.unsplash.com/photo-1716654716572-7b13ad56ba63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rcyUyMHJlYWRpbmclMjBsaWJyYXJ5fGVufDF8fHx8MTc3NDkxMzY4NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    ],
    rating: 4.9,
    reviewCount: 412,
    stock: 95,
    isFeatured: true,
    isActive: true,
    tags: ['books', 'design', 'education'],
  },
  {
    id: '6',
    name: 'Stainless Steel Blender',
    slug: 'stainless-steel-blender',
    description: 'Powerful 1000W blender with multiple speed settings and dishwasher-safe parts.',
    price: 79.99,
    categoryId: '6',
    brandId: '6',
    images: [
      'https://images.unsplash.com/photo-1740803292374-1b167c1558b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwYXBwbGlhbmNlcyUyMGNvb2tpbmd8ZW58MXx8fHwxNzc0OTMxNjA3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    ],
    rating: 4.4,
    reviewCount: 67,
    stock: 28,
    isFeatured: false,
    isActive: true,
    tags: ['kitchen', 'appliances', 'cooking'],
  },
  {
    id: '7',
    name: 'Natural Skincare Set',
    slug: 'natural-skincare-set',
    description: 'Complete skincare routine with natural ingredients. Includes cleanser, toner, and moisturizer.',
    price: 129.99,
    originalPrice: 159.99,
    categoryId: '7',
    brandId: '7',
    images: [
      'https://images.unsplash.com/photo-1595051665600-afd01ea7c446?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWF1dHklMjBjb3NtZXRpY3MlMjBza2luY2FyZXxlbnwxfHx8fDE3NzQ5MjIwMzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    ],
    rating: 4.7,
    reviewCount: 145,
    stock: 52,
    isFeatured: true,
    isActive: true,
    tags: ['beauty', 'skincare', 'natural'],
  },
  {
    id: '8',
    name: 'Building Blocks Set',
    slug: 'building-blocks-set',
    description: 'Educational building blocks set with 500 pieces. Perfect for ages 4 and up.',
    price: 39.99,
    categoryId: '8',
    brandId: '8',
    images: [
      'https://images.unsplash.com/photo-1517242810446-cc8951b2be40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b3lzJTIwY2hpbGRyZW4lMjBnYW1lc3xlbnwxfHx8fDE3NzQ4NTc5MDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    ],
    rating: 4.8,
    reviewCount: 89,
    stock: 64,
    isFeatured: false,
    isActive: true,
    tags: ['toys', 'educational', 'kids'],
  },
];

// Users (password is 'password123' for all)
export const users: User[] = [
  {
    id: '1',
    email: 'admin@shop.com',
    password: 'password123',
    name: 'Admin User',
    phone: '+1234567890',
    role: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'seller@shop.com',
    password: 'password123',
    name: 'Seller User',
    phone: '+1234567891',
    role: 'seller',
    sellerStatus: 'approved',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '3',
    email: 'user@shop.com',
    password: 'password123',
    name: 'Regular User',
    phone: '+1234567892',
    role: 'user',
    createdAt: '2024-02-01T00:00:00Z',
  },
];

// Reviews
export const reviews: Review[] = [
  {
    id: '1',
    productId: '1',
    userId: '3',
    userName: 'Regular User',
    rating: 5,
    comment: 'Amazing headphones! The sound quality is outstanding and the battery life is incredible.',
    createdAt: '2024-03-15T10:30:00Z',
  },
  {
    id: '2',
    productId: '2',
    userId: '3',
    userName: 'Regular User',
    rating: 5,
    comment: 'Perfect fit and great quality. This jacket will last for years!',
    createdAt: '2024-03-20T14:20:00Z',
  },
];

// Addresses
export const addresses: Address[] = [
  {
    id: '1',
    userId: '3',
    name: 'Regular User',
    phone: '+1234567892',
    addressLine1: '123 Main Street',
    addressLine2: 'Apt 4B',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    country: 'USA',
    isDefault: true,
    type: 'both',
  },
];

// Orders
export const orders: Order[] = [
  {
    id: '1',
    userId: '3',
    orderNumber: 'ORD-2024-001',
    items: [
      {
        id: '1',
        productId: '1',
        productName: 'Wireless Headphones Pro',
        productImage: products[0].images[0],
        quantity: 1,
        price: 299.99,
      },
    ],
    subtotal: 299.99,
    tax: 27.00,
    shipping: 10.00,
    discount: 0,
    total: 336.99,
    status: 'delivered',
    shippingAddress: addresses[0],
    paymentMethod: 'Credit Card',
    createdAt: '2024-03-10T00:00:00Z',
    updatedAt: '2024-03-15T00:00:00Z',
  },
];

// Wishlists
export const wishlists: Wishlist[] = [
  {
    id: '1',
    userId: '3',
    name: 'My Wishlist',
    productIds: ['3', '5', '7'],
    isDefault: true,
  },
];
