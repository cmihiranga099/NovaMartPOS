export interface Category {
    id: number;
    name: string;
    description: string | null;
    isActive: boolean;
  }
  
  export interface Brand {
    id: number;
    name: string;
    description: string | null;
    isActive: boolean;
  }

  export interface CreateLookupRequest {
    name: string;
    description?: string | null;
  }
  
  export interface UpdateLookupRequest extends CreateLookupRequest {
    isActive: boolean;
  }