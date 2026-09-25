export interface Product {
  id: number
  name: string
  category: string
  price: number
  description: string
  image_url: string | null
  is_active: boolean
}

export interface ProductCreate {
  name: string
  category: string
  price: number
  description: string
  image_url: string | null
}

export interface ProductListResponse {
  items: Product[]
  total: number
  page: number
  limit: number
  total_pages: number
}