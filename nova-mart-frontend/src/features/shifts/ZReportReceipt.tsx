import { shopInfo } from '../../config/shopInfo';
import type { ShiftSummary } from '../../types/shift';
import logo from '../../assets/logo.png';

const Line = () => <div className="border-t border-dashed border-black my-1.5" />;
const DoubleLine = () => <div className="border-t-2 border-black my-1.5" />;

export default function ZReportReceipt({ summary }: { summary: ShiftSummary }) {
  const startDate = new Date(summary.startTime);
  const endDate = summary.endTime ? new Date(summary.endTime) : new Date();

  const formatDate = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(
      d.getHours()
    ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;

  const varianceVal = summary.variance ?? 0;
  const varianceLabel =
    Math.abs(varianceVal) < 0.01
      ? 'BALANCED'
      : varianceVal > 0
      ? `OVER (+${varianceVal.toFixed(2)})`
      : `SHORT (${varianceVal.toFixed(2)})`;

  return (
    <div id="print-zreport" className="hidden print:block font-mono text-[11px] leading-snug p-2 text-black">
      {/* Header */}
      <div className="text-center">
        <img src={logo} alt={shopInfo.name} className="mx-auto mb-1 w-16 h-16 object-contain" />
        <p className="font-bold text-sm tracking-wide uppercase">{shopInfo.name}</p>
        <p className="text-[10px]">{shopInfo.address}</p>
        <p className="text-[10px]">Tel: {shopInfo.phone}</p>
      </div>

      <DoubleLine />

      <div className="text-center font-bold text-xs uppercase tracking-wider my-1">
        *** END OF DAY Z-REPORT ***
      </div>
      <div className="text-center text-[10px] text-ink-600 mb-1">
        SHIFT #{summary.shiftId} · {summary.status.toUpperCase()}
      </div>

      <Line />

      {/* Meta block */}
      <div className="text-[10px] space-y-0.5">
        <div className="flex justify-between">
          <span>CASHIER:</span>
          <span className="font-bold">{summary.cashierName}</span>
        </div>
        <div className="flex justify-between">
          <span>OPENED:</span>
          <span>{formatDate(startDate)}</span>
        </div>
        <div className="flex justify-between">
          <span>CLOSED:</span>
          <span>{formatDate(endDate)}</span>
        </div>
      </div>

      <Line />

      {/* Sales Summary */}
      <div className="space-y-0.5 text-[11px]">
        <div className="font-bold text-[10px] uppercase text-ink-500 mb-1">SALES REVENUE</div>
        <div className="flex justify-between">
          <span>CASH SALES</span>
          <span>Rs. {summary.cashSales.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>CARD SALES</span>
          <span>Rs. {summary.cardSales.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>BANK TRANSFER</span>
          <span>Rs. {summary.bankSales.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-[12px] pt-0.5">
          <span>TOTAL GROSS SALES</span>
          <span>Rs. {summary.totalSales.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[10px] text-ink-500">
          <span>Transactions Count</span>
          <span>{summary.totalTransactions}</span>
        </div>
      </div>

      <Line />

      {/* Cash Drawer Reconciliation */}
      <div className="space-y-0.5 text-[11px]">
        <div className="font-bold text-[10px] uppercase text-ink-500 mb-1">CASH RECONCILIATION</div>
        <div className="flex justify-between">
          <span>STARTING FLOAT</span>
          <span>Rs. {summary.startingCash.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>(+) CASH SALES</span>
          <span>Rs. {summary.cashSales.toFixed(2)}</span>
        </div>
        {summary.cashIn > 0 && (
          <div className="flex justify-between">
            <span>(+) PAID IN (CASH IN)</span>
            <span>Rs. {summary.cashIn.toFixed(2)}</span>
          </div>
        )}
        {summary.cashOut > 0 && (
          <div className="flex justify-between">
            <span>(-) PAID OUT (CASH OUT)</span>
            <span>-Rs. {summary.cashOut.toFixed(2)}</span>
          </div>
        )}
        {summary.totalRefunds > 0 && (
          <div className="flex justify-between">
            <span>(-) REFUNDS / RETURNS</span>
            <span>-Rs. {summary.totalRefunds.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between font-bold text-[12px] pt-1">
          <span>EXPECTED CASH IN DRAWER</span>
          <span>Rs. {summary.expectedCash.toFixed(2)}</span>
        </div>

        {summary.countedCash !== null && (
          <>
            <div className="flex justify-between font-bold text-[12px]">
              <span>ACTUAL COUNTED CASH</span>
              <span>Rs. {summary.countedCash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-[12px] pt-0.5">
              <span>DRAWER VARIANCE</span>
              <span>{varianceLabel}</span>
            </div>
          </>
        )}
      </div>

      {summary.notes && (
        <>
          <Line />
          <div className="text-[10px]">
            <span className="font-bold">NOTES: </span>
            <span>{summary.notes}</span>
          </div>
        </>
      )}

      {/* Cash movements breakdown */}
      {summary.cashMovements.length > 0 && (
        <>
          <Line />
          <div className="font-bold text-[10px] uppercase mb-1">CASH MOVEMENTS LOG</div>
          {summary.cashMovements.map((m) => (
            <div key={m.id} className="text-[10px] flex justify-between py-0.5">
              <span>
                {m.type === 'CashIn' ? '[+]' : '[-]'} {m.reason}
              </span>
              <span>Rs. {m.amount.toFixed(2)}</span>
            </div>
          ))}
        </>
      )}

      <DoubleLine />

      {/* Signatures */}
      <div className="mt-4 pt-2 space-y-4 text-[10px]">
        <div>
          <div className="border-b border-black w-36 mb-1" />
          <span>CASHIER SIGNATURE</span>
        </div>
        <div>
          <div className="border-b border-black w-36 mb-1" />
          <span>MANAGER APPROVAL</span>
        </div>
      </div>

      <div className="text-center mt-4 text-[9px] text-ink-500">
        NovaMartPOS Shift System · {formatDate(new Date())}
      </div>
    </div>
  );
}
