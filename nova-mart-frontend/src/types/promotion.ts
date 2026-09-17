export type PromotionType = 'Percentage' | 'FixedAmount';

export interface Promotion {
  id: number;
  code: string;
  description: string | null;
  type: PromotionType;
  value: number;
  minPurchaseAmount: number;
  maxDiscountAmount: number | null;
  expiresAt: string | null;
  isActive: boolean;
}

export interface CreatePromotionRequest {
  code: string;
  description?: string | null;
  type: PromotionType;
  value: number;
  minPurchaseAmount: number;
  maxDiscountAmount?: number | null;
  expiresAt?: string | null;
}

export interface UpdatePromotionRequest extends CreatePromotionRequest {
  isActive: boolean;
}

export interface PromoValidationResult {
  valid: boolean;
  code: string | null;
  discountAmount: number;
  error: string | null;
}