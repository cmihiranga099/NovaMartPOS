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
    if (svgRef.current) {
      try {
        const rawCode = (product.barcode || product.productCode || product.id.toString()).trim();

        let barWidth = 0.95;
        let barHeight = 22;
        let fontSize = 8.5;

        if (format === 'compact-sticker') {
          barWidth = 0.85;
          barHeight = 16;
          fontSize = 7.5;
        } else if (format === 'a4-sheet') {
          barWidth = 0.92;
          barHeight = 20;
          fontSize = 8;
        } else {
          // shelf-edge
          barWidth = 0.95;
          barHeight = 22;
          fontSize = 8.5;
        }

        JsBarcode(svgRef.current, rawCode, {
          format: 'CODE128',
          width: barWidth,
          height: barHeight,
          fontSize: fontSize,
          margin: 0,
          textMargin: 1,
          displayValue: true,
          font: 'monospace',
          fontOptions: 'bold',
        });

        // Ensure SVG never overflows its parent container
        svgRef.current.style.maxWidth = '100%';
        svgRef.current.style.height = 'auto';
        svgRef.current.style.display = 'block';
      } catch (err) {
        console.warn('Barcode render error for product:', product.name, err);
      }
    }
  }, [product.barcode, product.productCode, product.id, format]);

  const todayStr = new Date().toLocaleDateString('en-GB');

  // Format 1: Compact Item Sticker (42mm x 26mm)
  if (format === 'compact-sticker') {
    return (
      <div className="w-[42mm] h-[26mm] p-1.5 bg-white border border-slate-300 rounded-xs text-black flex flex-col justify-between items-center text-center box-border overflow-hidden print:border-black print:m-0 break-inside-avoid shadow-2xs">
        <div className="w-full flex items-center justify-between border-b border-black/20 pb-0.5 text-[7.5px] leading-tight">
          {showStoreName && (
            <span className="font-extrabold tracking-wider uppercase truncate max-w-[85px] text-slate-700">
              {shopInfo.name}
            </span>
          )}
          <span className="font-mono font-bold text-slate-600 ml-auto shrink-0">
            {product.productCode}
          </span>
        </div>

        <p className="text-[9px] font-extrabold leading-tight line-clamp-1 w-full text-black my-0.5" title={product.name}>
          {product.name}
        </p>

        <div className="w-full flex items-center justify-center my-0.5 overflow-hidden max-h-[14mm]">
          <svg ref={svgRef} className="max-w-full h-auto block" />
        </div>

        <div className="w-full flex items-center justify-center font-mono font-black text-black leading-none whitespace-nowrap pt-0.5 border-t border-black/10">
          <span className="text-[8.5px] font-bold mr-0.5">Rs.</span>
          <span className="text-[11px] font-black">{product.sellingPrice.toFixed(2)}</span>
          {product.unitOfMeasure && product.unitOfMeasure !== 'pcs' && (
            <span className="text-[7.5px] text-slate-600 font-normal ml-0.5">/{product.unitOfMeasure}</span>
          )}
        </div>
      </div>
    );
  }

  // Format 2: A4 Sheet Cell Label (64mm x 36mm, fits standard 3x8 A4 label grid)
  if (format === 'a4-sheet') {
    return (
      <div className="w-[64mm] h-[36mm] p-2 bg-white border border-slate-300 rounded-xs text-black flex flex-col justify-between box-border overflow-hidden print:border-black print:m-0 break-inside-avoid shadow-2xs">
        <div className="flex justify-between items-center border-b border-black/20 pb-0.5">
          {showStoreName && (
            <span className="text-[8.5px] font-black uppercase tracking-wider text-black truncate max-w-[140px]">
              {shopInfo.name}
            </span>
          )}
          <span className="text-[8px] font-mono font-bold text-slate-700 ml-auto shrink-0">
            {product.productCode}
          </span>
        </div>

        <p className="text-[10.5px] font-black leading-tight line-clamp-1 text-black my-0.5" title={product.name}>
          {product.name}
        </p>

        <div className="flex items-end justify-between gap-1.5 border-t border-dashed border-black/30 pt-1">
          <div className="flex-1 min-w-0 flex items-end justify-start overflow-hidden">
            <svg ref={svgRef} className="max-w-full h-auto block" />
          </div>

          <div className="w-[90px] shrink-0 text-right flex flex-col justify-end items-end">
            <span className="text-[7.5px] font-bold text-slate-500 uppercase block leading-none mb-0.5">PRICE</span>
            <div className="flex items-baseline justify-end leading-none whitespace-nowrap">
              <span className="text-[10px] font-extrabold text-black mr-0.5">Rs.</span>
              <span className={`${product.sellingPrice >= 10000 ? 'text-sm' : 'text-base'} font-black text-black font-mono tracking-tight`}>
                {product.sellingPrice.toFixed(2)}
              </span>
            </div>
            {product.unitOfMeasure && product.unitOfMeasure !== 'pcs' && (
              <span className="text-[7px] font-bold text-slate-600 uppercase mt-0.5 block leading-none">
                PER {product.unitOfMeasure}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Format 3: Shelf-Edge Price Tag (62mm x 40mm) - Classic Supermarket Shelf Talker
  return (
    <div className="w-[62mm] h-[40mm] p-2 bg-white border-2 border-black rounded-md text-black flex flex-col justify-between box-border overflow-hidden print:border-black print:m-0 break-inside-avoid shadow-xs">
      {/* Top Header: Store Branding & Product Code */}
      <div className="flex items-center justify-between border-b-2 border-black pb-0.5">
        {showStoreName ? (
          <span className="text-[9.5px] font-black tracking-wider uppercase text-black truncate max-w-[135px]">
            {shopInfo.name}
          </span>
        ) : (
          <span className="text-[8.5px] font-bold text-slate-600">SHELF PRICE TAG</span>
        )}
        <span className="text-[8.5px] font-mono font-bold text-black px-1 py-0.2 bg-slate-100 rounded border border-black/40 shrink-0">
          {product.productCode}
        </span>
      </div>

      {/* Product Name */}
      <div className="my-0.5">
        <h4 className="text-[11px] font-black leading-tight line-clamp-1 text-black uppercase tracking-tight" title={product.name}>
          {product.name}
        </h4>
      </div>

      {/* Middle & Bottom: Barcode and Big Bold Price */}
      <div className="flex items-end justify-between gap-1.5 border-t border-dashed border-black/40 pt-1">
        {/* Scannable Barcode SVG */}
        <div className="flex-1 min-w-0 flex flex-col items-start justify-end overflow-hidden">
          <svg ref={svgRef} className="max-w-full h-auto block" />
        </div>

        {/* Massive Shelf Price */}
        <div className="w-[92px] shrink-0 text-right flex flex-col justify-end items-end">
          <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-wider block leading-none mb-0.5">
            RETAIL PRICE
          </span>
          <div className="flex items-baseline justify-end leading-none whitespace-nowrap">
            <span className="text-[10px] font-extrabold text-black mr-0.5">Rs.</span>
            <span className={`${product.sellingPrice >= 10000 ? 'text-[15px]' : 'text-[17px]'} font-black text-black font-mono tracking-tight`}>
              {product.sellingPrice.toFixed(2)}
            </span>
          </div>
          <div className="text-[7.5px] text-slate-500 font-mono flex items-center justify-end gap-1 mt-0.5 leading-none">
            {product.unitOfMeasure && product.unitOfMeasure !== 'pcs' && (
              <span className="font-bold text-slate-700 uppercase">/{product.unitOfMeasure}</span>
            )}
            <span>{todayStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
