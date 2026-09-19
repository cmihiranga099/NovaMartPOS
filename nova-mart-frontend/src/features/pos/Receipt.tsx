import { shopInfo } from '../../config/shopInfo';
import type { SaleResult } from '../../types/sale';
import logo from '../../assets/logo.png';

const Dots = () => <div className="border-t border-dotted border-black my-1.5" />;

export default function Receipt({ sale }: { sale: SaleResult }) {
  const totalPcs = sale.items.reduce((sum, i) => sum + i.quantity, 0);
  const saleDate = new Date(sale.createdAt);

  return (
    <div id="print-receipt" className="hidden print:block font-mono text-[11px] leading-snug p-2 text-black">
      {/* Header */}
      <div className="text-center">
        <img src={logo} alt={shopInfo.name} className="mx-auto mb-1 w-16 h-16 object-contain" />
        <p className="font-bold text-sm tracking-wide uppercase">{shopInfo.name}</p>
        <p className="text-[10px]">{shopInfo.address}</p>
        <p className="text-[10px]">Tel: {shopInfo.phone}</p>
      </div>

      {/* Meta block: cashier / order no, formatted like the sample */}
      <div className="mt-2 text-[10px]">
        <div className="flex justify-between">
          <span>CASHIER :{sale.cashierName}</span>
        </div>
        <div className="flex justify-between">
          <span>ORDER NO :{sale.invoiceNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>CUSTOMER :{sale.customerName}</span>
          <span>{sale.paymentMethod.toUpperCase()}</span>
        </div>
      </div>

      <Dots />

      {/* Items, numbered like the sample */}
      {sale.items.map((item, idx) => (
        <div key={idx} className="mb-1.5">
          <div className="flex justify-between">
            <span className="pr-1">{item.productName}</span>
            <span>({idx + 1})</span>
          </div>
          <div className="flex justify-between">
            <span>
              ({item.unitPrice.toFixed(2)} * {item.quantity.toFixed(3)})
            </span>
            <span>{item.total.toFixed(2)}</span>
          </div>
        </div>
      ))}

      <Dots />

      {/* Totals block, bold like SUB TOTAL / CASH */}
      <div className="font-bold text-[12px] space-y-0.5">
        <div className="flex justify-between">
          <span>SUB TOTAL</span>
          <span>{sale.subtotal.toFixed(2)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between font-normal text-[10px]">
            <span>Discount</span>
            <span>-{sale.discount.toFixed(2)}</span>
          </div>
        )}
        {sale.promoCode && sale.promoDiscount > 0 && (
          <div className="flex justify-between font-normal text-[10px]">
            <span>Promo ({sale.promoCode})</span>
            <span>-{sale.promoDiscount.toFixed(2)}</span>
          </div>
        )}
        {sale.tax > 0 && (
          <div className="flex justify-between font-normal text-[10px]">
            <span>Tax</span>
            <span>{sale.tax.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>TOTAL</span>
          <span>{sale.grandTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>{sale.paymentMethod.toUpperCase()}</span>
          <span>{sale.amountPaid.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-black my-1.5" />

      <div className="flex justify-between font-bold text-[12px]">
        <span>BALANCE</span>
        <span>{sale.change.toFixed(2)}</span>
      </div>

      <Dots />

      {/* Item / pcs count + date-time, two-column like the sample */}
      <div className="flex justify-between text-[10px]">
        <span>No of Items: {sale.items.length}</span>
        <span>No of Pcs: {totalPcs.toFixed(3)}</span>
      </div>
      <div className="flex justify-between text-[10px]">
        <span>
          Date :{String(saleDate.getDate()).padStart(2, '0')}/
          {String(saleDate.getMonth() + 1).padStart(2, '0')}/
          {saleDate.getFullYear()}
        </span>
        <span>
          Time :{String(saleDate.getHours()).padStart(2, '0')}:
          {String(saleDate.getMinutes()).padStart(2, '0')}:
          {String(saleDate.getSeconds()).padStart(2, '0')}
        </span>
      </div>

      <div className="text-center mt-2 font-bold">{shopInfo.footer}</div>

      <div className="border-t border-dashed border-black my-1.5" />

      <p className="text-center text-[9px]">System By NovaMartPOS</p>
    </div>
  );
}