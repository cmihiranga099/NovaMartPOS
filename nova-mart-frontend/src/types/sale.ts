export interface SaleItemRequest {
  productId: number;
  quantity: number;
  discount: number;
}

export interface PaymentSplitRequest {
  method: string;
  amount: number;
}

export interface CreateSaleRequest {
  customerId: number;
  items: SaleItemRequest[];
  paymentMethod: string;
  amountPaid: number;
  splits?: PaymentSplitRequest[];
  promoCode: string | null;
  managerOverridePin?: string | null;
}

export interface SaleItemResult {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  unitOfMeasure?: string;
  isWeighable?: boolean;
}

export interface PaymentDetailResult {
  method: string;
  amountPaid: number;
  change: number;
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
  loyaltyPointsEarned?: number;
  customerLoyaltyBalance?: number;
  cashierId: number;
  cashierName: string;
  createdAt: string;
  items: SaleItemResult[];
  payments?: PaymentDetailResult[];
}
