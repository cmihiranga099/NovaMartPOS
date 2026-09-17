export interface DailySalesReport {
    date: string;
    transactionCount: number;
    totalSales: number;
    totalDiscount: number;
    totalTax: number;
    totalProfit: number;
  }
  
  export interface TopProduct {
    productId: number;
    productName: string;
    quantitySold: number;
    totalRevenue: number;
  }