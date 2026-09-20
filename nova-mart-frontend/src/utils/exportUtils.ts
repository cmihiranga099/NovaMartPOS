import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { SaleResult } from '../types/sale';

// jspdf-autotable is imported for its side effect: it attaches an .autoTable()
// method directly onto the jsPDF prototype. This is the most version-resilient
// way to use it, since it doesn't depend on guessing the module's export shape.
type JsPDFWithAutoTable = jsPDF & {
  autoTable: (options: Record<string, unknown>) => jsPDF;
  lastAutoTable: { finalY: number };
};

export function exportSalesToExcel(sales: SaleResult[], filename = 'sales-history') {
  const rows = sales.map((s) => ({
    Invoice: s.invoiceNumber,
    Date: new Date(s.createdAt).toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' }),
    Customer: s.customerName,
    Cashier: s.cashierName,
    'Payment Method': s.paymentMethod,
    Subtotal: s.subtotal,
    Discount: s.discount,
    'Promo Code': s.promoCode ?? '',
    'Promo Discount': s.promoDiscount,
    Tax: s.tax,
    Total: s.grandTotal,
    'Amount Paid': s.amountPaid,
    Change: s.change,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 16 }, { wch: 20 }, { wch: 18 }, { wch: 16 }, { wch: 14 },
    { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales History');
  XLSX.writeFile(workbook, `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export interface DailyPnLRow {
  date: string;
  transactions: number;
  revenue: number;
  cogs: number;
  profit: number;
}

export function exportDailyBreakdownToExcel(rows: DailyPnLRow[], filename = 'pnl-daily-breakdown') {
  const data = rows.map((r) => ({
    Date: r.date,
    Transactions: r.transactions,
    'Net Revenue': r.revenue,
    'Cost of Goods': r.cogs,
    Profit: r.profit,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Breakdown');
  XLSX.writeFile(workbook, `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

interface PnLSummary {
  netSales: number;
  discountsGiven: number;
  taxCollected: number;
  cogs: number;
  grossProfit: number;
  transactionCount: number;
}

interface ShopHeader {
  name: string;
  address: string;
  phone: string;
}

export function exportPnLToPdf(
  shop: ShopHeader,
  fromDate: string,
  toDate: string,
  summary: PnLSummary,
  dailyRows: DailyPnLRow[]
) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(shop.name, 14, 18);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${shop.address}  ·  Tel: ${shop.phone}`, 14, 24);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Profit & Loss Report', 14, 36);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${fromDate} to ${toDate}`, 14, 42);
  doc.text(`Generated: ${new Date().toLocaleString('en-LK')}`, 14, 47);

  (doc as JsPDFWithAutoTable).autoTable({
    startY: 54,
    head: [['Metric', 'Amount (Rs.)']],
    body: [
      ['Net Sales Revenue', summary.netSales.toFixed(2)],
      ['Discounts Given', summary.discountsGiven.toFixed(2)],
      ['Tax Collected', summary.taxCollected.toFixed(2)],
      ['Cost of Goods Sold', summary.cogs.toFixed(2)],
      ['Gross Profit', summary.grossProfit.toFixed(2)],
      ['Transactions', String(summary.transactionCount)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [254, 108, 13] },
    styles: { fontSize: 9 },
  });

  const afterSummaryY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Daily Breakdown', 14, afterSummaryY);

  (doc as JsPDFWithAutoTable).autoTable({
    startY: afterSummaryY + 4,
    head: [['Date', 'Transactions', 'Net Revenue', 'COGS', 'Profit']],
    body: dailyRows.map((r) => [
      r.date,
      String(r.transactions),
      r.revenue.toFixed(2),
      r.cogs.toFixed(2),
      r.profit.toFixed(2),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [254, 108, 13] },
    styles: { fontSize: 8 },
  });

  doc.save(`pnl-report-${fromDate}-to-${toDate}.pdf`);
}