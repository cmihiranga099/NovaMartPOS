export interface Customer {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    loyaltyPoints: number;
    isActive: boolean;
  }
  
  export interface CreateCustomerRequest {
    name: string;
    phone?: string | null;
    email?: string | null;
  }
  
  export interface UpdateCustomerRequest extends CreateCustomerRequest {
    isActive: boolean;
  }