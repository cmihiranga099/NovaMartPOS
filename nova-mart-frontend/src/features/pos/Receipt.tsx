import { shopInfo } from '../../config/shopInfo';
import type { SaleResult } from '../../types/sale';

export default function Receipt({ sale }: { sale: SaleResult }) {
  return (
    <div id="print-receipt" className="hidden print:block font-mono text-xs p-2 text-black">
      <div className="text-center">
        <p className="font-bold text-sm">{shopInfo.name}</p>
        <p>{shopInfo.address}</p>
        <p>Tel: {shopInfo.phone}</p>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      <p>Invoice: {sale.invoiceNumber}</p>
      <p>Date: {new Date(sale.createdAt).toLocaleString('en-LK', { dateStyle: 'short', timeStyle: 'short' })}</p>
      <p>Cashier: {sale.cashierName}</p>
      <p>Customer: {sale.customerName}</p>

      <div className="border-t border-dashed border-black my-2" />

      {sale.items.map((item, idx) => (
        <div key={idx} className="mb-1">
          <p>{item.productName}</p>
          <div className="flex justify-between">
            <span>{item.quantity} x {item.unitPrice.toFixed(2)}</span>
            <span>{item.total.toFixed(2)}</span>
          </div>
        </div>
      ))}

      <div className="border-t border-dashed border-black my-2" />

      <div className="flex justify-between"><span>Subtotal</span><span>{sale.subtotal.toFixed(2)}</span></div>
      <div className="flex justify-between"><span>Discount</span><span>{sale.discount.toFixed(2)}</span></div>
      <div className="flex justify-between"><span>Tax</span><span>{sale.tax.toFixed(2)}</span></div>

      <div className="border-t border-dashed border-black my-1" />

      <div className="flex justify-between font-bold text-sm"><span>TOTAL</span><span>{sale.grandTotal.toFixed(2)}</span></div>

      <div className="border-t border-dashed border-black my-1" />

      <div className="flex justify-between"><span>{sale.paymentMethod}</span><span>{sale.amountPaid.toFixed(2)}</span></div>
      <div className="flex justify-between"><span>Change</span><span>{sale.change.toFixed(2)}</span></div>

      <div className="border-t border-dashed border-black my-2" />

      <p className="text-center font-bold">{shopInfo.footer}</p>
    </div>
  );
}