export interface Product {
  id: number;
  productCode: string;
  barcode: string;
  name: string;
  imageUrl?: string | null;
  purchasePrice: number;
  sellingPrice: number;
  taxRate: number;
  stockQuantity: number;
  minimumStockLevel: number;
  isWeighable?: boolean;
  unitOfMeasure?: string;
  isActive: boolean;
  categoryId: number;
  categoryName: string;
  brandId: number;
  brandName: string;
  supplierId: number | null;
  expiryDate: string | null;
}

export interface CreateProductRequest {
  productCode: string;
  barcode: string;
  name: string;
  imageUrl?: string | null;
  purchasePrice: number;
  sellingPrice: number;
  taxRate: number;
  stockQuantity: number;
  minimumStockLevel: number;
  isWeighable?: boolean;
  unitOfMeasure?: string;
  categoryId: number;
  brandId: number;
  supplierId?: number | null;
  expiryDate?: string | null;
}

export interface UpdateProductRequest extends CreateProductRequest {
  isActive: boolean;
}
