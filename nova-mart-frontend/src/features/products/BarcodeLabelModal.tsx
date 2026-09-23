import { useState } from 'react';
import { X, Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Product } from '../../types/product';

interface Props {
  product: Product;
  onClose: () => void;
  onPrint: (quantity: number) => void;
}

export default function BarcodeLabelModal({ product, onClose, onPrint }: Props) {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{t('products.printBarcodeLabels')}</h2>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-sm text-ink-700">
            <span className="font-medium">{product.name}</span>
            <span className="text-ink-500"> · {product.barcode}</span>
          </p>

          <div>
            <label className="block text-sm font-medium mb-1">{t('products.numberOfLabels')}</label>
            <input
              type="number"
              min={1}
              max={100}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(100, Number(e.target.value))))}
              className="w-full px-3 py-2 border border-ink-500/20 rounded-lg"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-ink-700 hover:bg-surface rounded-lg">
              {t('common.cancel')}
            </button>
            <button
              onClick={() => onPrint(quantity)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium"
            >
              <Printer size={16} /> {t('common.print')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}