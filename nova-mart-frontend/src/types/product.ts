export interface Product {
    id: number;
    productCode: string;
    barcode: string;
    name: string;
    purchasePrice: number;
    sellingPrice: number;
    taxRate: number;
    stockQuantity: number;
    minimumStockLevel: number;
    isActive: boolean;
    categoryId: number;
    categoryName: string;
    brandId: number;
    brandName: string;
    supplierId: number | null;
  }
  
  export interface CreateProductRequest {
    productCode: string;
    barcode: string;
    name: string;
    purchasePrice: number;
    sellingPrice: number;
    taxRate: number;
    stockQuantity: number;
    minimumStockLevel: number;
    categoryId: number;
    brandId: number;
    supplierId?: number | null;
  }
  
  export interface UpdateProductRequest extends CreateProductRequest {
    isActive: boolean;
  }