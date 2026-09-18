export interface PurchaseOrderItemRequest {
    productId: number;
    quantity: number;
    unitCost: number;
  }
  
  export interface CreatePurchaseOrderRequest {
    supplierId: number;
    items: PurchaseOrderItemRequest[];
    notes?: string | null;
  }
  
  export interface PurchaseOrderItemResult {
    productId: number;
    productName: string;
    quantity: number;
    unitCost: number;
    total: number;
  }
  
  export interface PurchaseOrderResult {
    id: number;
    poNumber: string;
    totalCost: number;
    notes: string | null;
    supplierId: number;
    supplierName: string;
    receivedById: number;
    receivedByName: string;
    createdAt: string;
    items: PurchaseOrderItemResult[];
  }