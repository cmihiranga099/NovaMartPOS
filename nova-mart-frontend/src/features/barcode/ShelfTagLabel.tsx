import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import type { Product } from '../../types/product';
import { shopInfo } from '../../config/shopInfo';

export type LabelFormat = 'shelf-edge' | 'compact-sticker' | 'a4-sheet';

interface ShelfTagLabelProps {
  product: Product;
  format: LabelFormat;
  showStoreName?: boolean;
}

export default function ShelfTagLabel({
  product,
  format,
  showStoreName = true,
}: ShelfTagLabelProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && product.barcode) {
      try {
        const isCompact = format === 'compact-sticker';
        JsBarcode(svgRef.current, product.barcode, {
          format: 'CODE128',
          width: isCompact ? 1.2 : 1.4,
          height: isCompact ? 22 : 28,
          fontSize: isCompact ? 9 : 10,
          margin: 1,
          displayValue: true,
        });
      } catch {
        // Fall back gracefully if barcode format is unusual
      }
    }
  }, [product.barcode, format]);

  const todayStr = new Date().toLocaleDateString();

  if (format === 'compact-sticker') {
    // Compact Item Sticker (Approx 38mm x 25mm)
    return (
      <div className="w-[42mm] h-[26mm] p-1.5 bg-white border border-slate-300 rounded-sm text-black flex flex-col justify-between items-center text-center box-border overflow-hidden print:border-black print:m-0 break-inside-avoid">
        {showStoreName && (
          <p className="text-[8px] font-bold tracking-wider uppercase truncate w-full text-slate-700">
            {shopInfo.name}
          </p>
        )}
        <p className="text-[10px] font-bold leading-tight truncate w-full text-black">
          {product.name}
        </p>
        <div className="flex justify-center items-center my-0.5 max-h-[16mm] overflow-hidden">
          <svg ref={svgRef} />
        </div>
        <p className="text-xs font-black tracking-tight text-black font-mono">
          Rs. {product.sellingPrice.toFixed(2)}
        </p>
      </div>
    );
  }

  if (format === 'a4-sheet') {
    // A4 Sheet Cell Label (Approx 65mm x 35mm, fits standard 3x8 A4 label grid)
    return (
      <div className="w-[64mm] h-[36mm] p-2 bg-white border border-slate-300 rounded-sm text-black flex flex-col justify-between box-border overflow-hidden print:border-black print:m-0 break-inside-avoid">
        <div className="flex justify-between items-start border-b border-black/20 pb-0.5">
          {showStoreName && (
            <span className="text-[9px] font-black uppercase tracking-wider text-black">
              {shopInfo.name}
            </span>
          )}
          <span className="text-[8px] font-mono text-slate-600 ml-auto">
            {product.productCode}
          </span>
        </div>

        <p className="text-xs font-bold leading-tight line-clamp-1 text-black my-0.5">
          {product.name}
        </p>

        <div className="flex items-center justify-between gap-1">
          <div className="shrink-0 flex items-center justify-center max-h-[18mm]">
            <svg ref={svgRef} />
          </div>

          <div className="text-right shrink-0">
            <span className="text-[8px] font-bold text-slate-500 uppercase block">PRICE</span>
            <span className="text-base font-black text-black font-mono tracking-tight block">
              Rs. {product.sellingPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Format: Shelf-Edge Price Tag (60mm x 40mm) - Classic Supermarket Shelf Talker
  return (
    <div className="w-[62mm] h-[40mm] p-2 bg-white border-2 border-black rounded-md text-black flex flex-col justify-between box-border overflow-hidden print:border-black print:m-0 break-inside-avoid shadow-xs">
      {/* Top Header: Store Branding & Product Code */}
      <div className="flex items-center justify-between border-b-2 border-black pb-1">
        {showStoreName ? (
          <span className="text-[10px] font-black tracking-wider uppercase text-black">
            {shopInfo.name}
          </span>
        ) : (
          <span className="text-[9px] font-bold text-slate-600">SHELF PRICE TAG</span>
        )}
        <span className="text-[9px] font-mono font-bold text-black px-1 py-0.2 bg-slate-100 rounded border border-black/40">
          {product.productCode}
        </span>
      </div>

      {/* Product Name */}
      <div className="my-1">
        <h4 className="text-xs font-black leading-tight line-clamp-1 text-black uppercase">
          {product.name}
        </h4>
      </div>

      {/* Middle & Bottom: Barcode and Big Bold Price */}
      <div className="flex items-end justify-between gap-1 border-t border-dashed border-black/40 pt-1">
        {/* Scannable Barcode SVG */}
        <div className="shrink-0 flex flex-col items-start justify-center max-h-[22mm]">
          <svg ref={svgRef} />
        </div>

        {/* Massive Shelf Price */}
        <div className="text-right shrink-0 pl-1">
          <span className="text-[8px] font-black text-slate-600 uppercase tracking-wider block">
            RETAIL PRICE
          </span>
          <span className="text-lg font-black text-black font-mono tracking-tight leading-none block">
            Rs. {product.sellingPrice.toFixed(2)}
          </span>
          <span className="text-[8px] text-slate-500 font-mono block mt-0.5">
            {todayStr}
          </span>
        </div>
      </div>
    </div>
  );
}
