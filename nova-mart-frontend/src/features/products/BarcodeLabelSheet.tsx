import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import type { Product } from '../../types/product';

interface Props {
  product: Product;
  quantity: number;
}

function LabelSvg({ product }: { product: Product }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      JsBarcode(svgRef.current, product.barcode, {
        format: 'CODE128',
        width: 1.4,
        height: 32,
        fontSize: 10,
        margin: 2,
        displayValue: true,
      });
    }
  }, [product.barcode]);

  return (
    <div className="border border-black flex flex-col items-center justify-center p-1 w-[45mm] h-[25mm] box-border">
      <p className="text-[9px] font-bold leading-tight text-center truncate w-full">{product.name}</p>
      <svg ref={svgRef} />
      <p className="text-[10px] font-bold">Rs. {product.sellingPrice.toFixed(2)}</p>
    </div>
  );
}

export default function BarcodeLabelSheet({ product, quantity }: Props) {
  return (
    <div id="print-barcode-labels" className="hidden print:flex print:flex-wrap print:gap-4 p-4 text-black">
      {Array.from({ length: quantity }).map((_, idx) => (
        <LabelSvg key={idx} product={product} />
      ))}
    </div>
  );
}