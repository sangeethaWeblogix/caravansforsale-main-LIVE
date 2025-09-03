// src/types.ts

// Caravan Product
export interface Product {
  id: number;
  name: string;
  slug: string;
  length?: string;
  kg?: string;
  regular_price?: string;
  sale_price?: string;
  image?: string;
  location?: string;
  make?: string;
  model?: string;
  year?: string;
  category?: string;
}

// Categories
export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
}

// Make or Model option
export interface MakeOption {
  id: number;
  name: string;
  slug: string;
}

// State option
export interface StateOption {
  id: number;
  name: string;
  slug: string;
}
