import { Minus, Plus, X, Scale } from 'lucide-react';

export interface CartLine {
  productId: number;
  name: string;
  imageUrl?: string | null;
  unitPrice: number;
  taxRate: number;
  quantity: number;
  discount: number;
  availableStock: number;
  isWeighable?: boolean;
  unitOfMeasure?: string;
}

interface Props {
  item: CartLine;
  onQuantityChange: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
  onWeighClick?: (productId: number) => void;
}

export default function CartItemRow({
  item,
  onQuantityChange,
  onRemove,
  onWeighClick,
}: Props) {
  const lineTotal = item.unitPrice * item.quantity - item.discount;
  const isWeighed = item.isWeighable;
  const unit = item.unitOfMeasure || (isWeighed ? 'kg' : 'pcs');

  return (
    <div className="flex items-center gap-2.5 py-2.5 border-b border-ink-500/10">
      <div className="w-9 h-9 rounded-lg bg-surface border border-line flex items-center justify-center overflow-hidden shrink-0">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <span className="text-xs font-bold text-ink-500">
            {item.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-sm truncate">{item.name}</p>
          {isWeighed && (
            <button
              type="button"
              onClick={() => onWeighClick?.(item.productId)}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
              title="Click to adjust weight on scale"
            >
              <Scale size={11} />
              {unit}
            </button>
          )}
        </div>
        <p className="text-xs text-ink-500">
          Rs. {item.unitPrice.toFixed(2)} / {unit}
        </p>
      </div>

      <div className="flex items-center gap-1">
        {isWeighed ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onWeighClick?.(item.productId)}
              className="flex items-center gap-1 px-2 py-1 bg-surface hover:bg-emerald-500/15 border border-line hover:border-emerald-500/30 rounded-lg text-xs font-semibold text-ink-800 transition-colors"
              title="Open scale modal"
            >
              <Scale size={13} className="text-emerald-600" />
              <span>{item.quantity.toFixed(3)}</span>
              <span className="text-[10px] text-ink-500">{unit}</span>
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => onQuantityChange(item.productId, Math.max(1, item.quantity - 1))}
              className="w-7 h-7 flex items-center justify-center rounded-md border border-ink-500/20 hover:bg-surface"
            >
              <Minus size={14} />
            </button>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => onQuantityChange(item.productId, Math.max(1, Number(e.target.value)))}
              className="w-12 text-center border border-ink-500/20 rounded-md py-1 text-sm"
            />
            <button
              onClick={() => onQuantityChange(item.productId, Math.min(item.availableStock, item.quantity + 1))}
              className="w-7 h-7 flex items-center justify-center rounded-md border border-ink-500/20 hover:bg-surface"
            >
              <Plus size={14} />
            </button>
          </>
        )}
      </div>

      <p className="w-20 text-right font-medium text-sm">Rs. {lineTotal.toFixed(2)}</p>

      <button onClick={() => onRemove(item.productId)} className="text-ink-500 hover:text-red-600">
        <X size={16} />
      </button>
    </div>
  );
}
