export interface DisplayCartItem {
  productId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  total: number;
}

export interface DisplayCartState {
  registerId?: string;
  cashierName?: string;
  items: DisplayCartItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  lastScannedItem?: DisplayCartItem | null;
}

export interface DisplayPaymentState {
  registerId?: string;
  grandTotal: number;
  amountPaid: number;
  change: number;
  paymentMethod: string;
}

export interface DisplaySaleComplete {
  registerId?: string;
  invoiceNumber: string;
  grandTotal: number;
  amountPaid: number;
  change: number;
  itemsCount: number;
}

export type CustomerDisplayMessage =
  | { type: 'CART_UPDATE'; payload: DisplayCartState }
  | { type: 'PAYMENT_UPDATE'; payload: DisplayPaymentState }
  | { type: 'SALE_COMPLETE'; payload: DisplaySaleComplete }
  | { type: 'IDLE'; payload: { registerId?: string } };
