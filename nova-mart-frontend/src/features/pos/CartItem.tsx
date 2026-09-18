import { Minus, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface CartLine {
  productId: number;
  name: string;
  unitPrice: number;
  taxRate: number;
  quantity: number;
  discount: number;
  availableStock: number;
}

interface Props {
  item: CartLine;
  onQuantityChange: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
}

export default function CartItemRow({ item, onQuantityChange, onRemove }: Props) {
  const { t } = useTranslation();
  const lineTotal = item.unitPrice * item.quantity - item.discount;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-ink-500/10">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.name}</p>
        <p className="text-xs text-ink-500">Rs. {item.unitPrice.toFixed(2)}</p>
      </div>

      <div className="flex items-center gap-1">
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
      </div>

      <p className="w-20 text-right font-medium text-sm">Rs. {lineTotal.toFixed(2)}</p>

      <button onClick={() => onRemove(item.productId)} className="text-ink-500 hover:text-red-600">
        <X size={16} />
      </button>
    </div>
  );
}