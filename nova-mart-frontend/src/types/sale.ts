export interface SaleItemRequest {
    productId: number;
    quantity: number;
    discount: number;
  }
  
  export interface CreateSaleRequest {
    customerId: number;
    items: SaleItemRequest[];
    paymentMethod: string;
    amountPaid: number;
    promoCode: string | null;
  }
  
  export interface SaleItemResult {
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
  }
  
  export interface SaleResult {
    id: number;
    invoiceNumber: string;
    subtotal: number;
    discount: number;
    tax: number;
    grandTotal: number;
    promoCode: string | null;
    promoDiscount: number;
    amountPaid: number;
    change: number;
    paymentMethod: string;
    customerId: number;
    customerName: string;
    cashierId: number;
    cashierName: string;
    createdAt: string;
    items: SaleItemResult[];
  }