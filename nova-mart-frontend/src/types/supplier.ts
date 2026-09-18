export interface Supplier {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    isActive: boolean;
  }
  
  export interface CreateSupplierRequest {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  }
  
  export interface UpdateSupplierRequest extends CreateSupplierRequest {
    isActive: boolean;
  }