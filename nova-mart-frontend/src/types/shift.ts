export interface CashMovement {
  id: number;
  type: 'CashIn' | 'CashOut';
  amount: number;
  reason: string;
  userId: number;
  userName: string;
  createdAt: string;
}

export interface ShiftSummary {
  shiftId: number;
  cashierId: number;
  cashierName: string;
  startTime: string;
  endTime: string | null;
  status: 'Open' | 'Closed';

  startingCash: number;
  cashSales: number;
  cardSales: number;
  bankSales: number;
  totalSales: number;
  totalTransactions: number;

  cashIn: number;
  cashOut: number;
  totalRefunds: number;
  totalRefundTransactions: number;

  expectedCash: number;
  countedCash: number | null;
  variance: number | null;

  notes: string | null;
  cashMovements: CashMovement[];
}

export interface OpenShiftRequest {
  startingCash: number;
  notes?: string;
}

export interface CloseShiftRequest {
  countedCash: number;
  notes?: string;
}

export interface CashMovementRequest {
  type: 'CashIn' | 'CashOut';
  amount: number;
  reason: string;
}
