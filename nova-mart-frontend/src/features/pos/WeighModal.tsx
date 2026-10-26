import { useState, useEffect } from 'react';
import { Scale, X, Check, RotateCcw, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Product } from '../../types/product';

interface Props {
  product: Product;
  initialWeight?: number;
  onConfirm: (product: Product, weight: number) => void;
  onClose: () => void;
}

export default function WeighModal({
  product,
  initialWeight = 0,
  onConfirm,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const unit = product.unitOfMeasure || 'kg';

  // State for weight in kg (or unit) as a string for keypad editing
  const [weightStr, setWeightStr] = useState<string>(
    initialWeight > 0 ? initialWeight.toFixed(3) : ''
  );
  const [tareKg, setTareKg] = useState<number>(0);

  const grossWeight = Math.max(0, parseFloat(weightStr) || 0);
  const netWeight = Math.max(0, Number((grossWeight - tareKg).toFixed(3)));
  const unitPrice = product.sellingPrice;
  const lineTotal = Number((netWeight * unitPrice).toFixed(2));

  // Handle keypad clicks
  const handleKeyClick = (key: string) => {
    if (key === 'clear') {
      setWeightStr('');
    } else if (key === 'backspace') {
      setWeightStr((prev) => prev.slice(0, -1));
    } else if (key === '.') {
      if (!weightStr.includes('.')) {
        setWeightStr((prev) => (prev === '' ? '0.' : prev + '.'));
      }
    } else {
      // digit
      if (weightStr === '0') {
        setWeightStr(key);
      } else {
        // limit to 3 decimal places
        const parts = weightStr.split('.');
        if (parts.length === 2 && parts[1].length >= 3) {
          return;
        }
        setWeightStr((prev) => prev + key);
      }
    }
  };

  // Preset weight buttons
  const setPresetWeight = (kg: number) => {
    setWeightStr(kg.toFixed(3));
  };

  // Quick addition buttons
  const addWeight = (deltaKg: number) => {
    const current = parseFloat(weightStr) || 0;
    const next = Math.max(0, current + deltaKg);
    setWeightStr(next.toFixed(3));
  };

  // Keyboard support (Enter, Esc, 0-9, dot, backspace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (netWeight > 0) {
          onConfirm(product, netWeight);
        }
      } else if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleKeyClick(e.key);
      } else if (e.key === '.' || e.key === ',') {
        e.preventDefault();
        handleKeyClick('.');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleKeyClick('backspace');
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        // Toggle 20g tare
        setTareKg((prev) => (prev > 0 ? 0 : 0.02));
      } else if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        setWeightStr('');
        setTareKg(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [weightStr, netWeight, product, onClose, onConfirm, tareKg]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg border border-line overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-surface border-b border-line">
          <div className="flex items-center gap-3">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-10 h-10 rounded-lg object-cover border border-line shadow-2xs"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Scale size={18} />
              </div>
            )}
            <div>
              <h2 className="text-base font-bold text-ink-900 leading-tight">
                {product.name}
              </h2>
              <p className="text-xs text-ink-500">
                {product.productCode} · Rs. {product.sellingPrice.toFixed(2)} / {unit}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-card border border-transparent hover:border-line flex items-center justify-center text-ink-500 hover:text-ink-900 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Digital Scale LCD Screen */}
        <div className="p-4 bg-ink-950 text-white font-mono space-y-2">
          {/* Status Indicators */}
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-emerald-400 border-b border-ink-800 pb-1.5">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-semibold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                SCALE STABLE
              </span>
              {tareKg > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 rounded text-[10px] font-bold">
                  TARE ACTIVE (-{(tareKg * 1000).toFixed(0)}g)
                </span>
              )}
            </div>
            <span className="text-ink-400">UNIT: {unit.toUpperCase()}</span>
          </div>

          {/* Main Weight Readout */}
          <div className="grid grid-cols-2 gap-3 py-1">
            <div className="bg-black/60 rounded-xl p-3 border border-ink-800">
              <span className="text-[11px] text-ink-400 block mb-0.5">NET WEIGHT</span>
              <div className="text-3xl font-extrabold text-emerald-400 tracking-tight flex items-baseline justify-between">
                <span>{netWeight.toFixed(3)}</span>
                <span className="text-sm font-normal text-emerald-600">{unit}</span>
              </div>
              <div className="text-[11px] text-ink-500 mt-1">
                Gross: {grossWeight.toFixed(3)} {unit} · Tare: {tareKg.toFixed(3)} {unit}
              </div>
            </div>

            <div className="bg-black/60 rounded-xl p-3 border border-ink-800">
              <span className="text-[11px] text-ink-400 block mb-0.5">LINE AMOUNT</span>
              <div className="text-3xl font-extrabold text-amber-400 tracking-tight flex items-baseline justify-between">
                <span>Rs. {lineTotal.toFixed(2)}</span>
              </div>
              <div className="text-[11px] text-ink-500 mt-1">
                @ Rs. {unitPrice.toFixed(2)}/{unit}
              </div>
            </div>
          </div>
        </div>

        {/* Scale Controls & Quick Buttons */}
        <div className="p-4 space-y-3 bg-surface border-b border-line">
          {/* Tare Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink-600 w-16">Tare / Zero:</span>
            <button
              type="button"
              onClick={() => setTareKg(0.02)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
                tareKg === 0.02
                  ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-2xs'
                  : 'bg-card border-line text-ink-700 hover:bg-card/80'
              }`}
            >
              <Package size={13} />
              Bag Tare (-20g)
            </button>
            <button
              type="button"
              onClick={() => setTareKg(0.05)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
                tareKg === 0.05
                  ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-2xs'
                  : 'bg-card border-line text-ink-700 hover:bg-card/80'
              }`}
            >
              Tray Tare (-50g)
            </button>
            <button
              type="button"
              onClick={() => {
                setTareKg(0);
                setWeightStr('');
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-card border border-line text-ink-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all flex items-center gap-1 ml-auto"
            >
              <RotateCcw size={13} />
              Zero / Reset
            </button>
          </div>

          {/* Quick Weight Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-ink-600 w-16">Quick:</span>
            {[
              { label: '250g', kg: 0.25 },
              { label: '500g', kg: 0.5 },
              { label: '1 kg', kg: 1.0 },
              { label: '1.5 kg', kg: 1.5 },
              { label: '2 kg', kg: 2.0 },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setPresetWeight(p.kg)}
                className="px-2.5 py-1 bg-card hover:bg-brand-50 border border-line hover:border-brand-300 rounded-md text-xs font-medium text-ink-800 transition-colors"
              >
                {p.label}
              </button>
            ))}

            <div className="h-4 w-[1px] bg-line mx-1" />

            {[
              { label: '+100g', delta: 0.1 },
              { label: '+250g', delta: 0.25 },
              { label: '+500g', delta: 0.5 },
            ].map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => addWeight(a.delta)}
                className="px-2 py-1 bg-card hover:bg-emerald-50 border border-line hover:border-emerald-300 rounded-md text-xs font-medium text-ink-800 transition-colors"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Touch Numeric Keypad */}
        <div className="p-4 grid grid-cols-3 gap-2 bg-card">
          {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyClick(digit)}
              className="h-12 bg-surface hover:bg-card border border-line rounded-xl text-xl font-bold text-ink-800 active:scale-95 transition-all shadow-2xs"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleKeyClick('.')}
            className="h-12 bg-surface hover:bg-card border border-line rounded-xl text-xl font-bold text-ink-800 active:scale-95 transition-all shadow-2xs"
          >
            .
          </button>
          <button
            type="button"
            onClick={() => handleKeyClick('0')}
            className="h-12 bg-surface hover:bg-card border border-line rounded-xl text-xl font-bold text-ink-800 active:scale-95 transition-all shadow-2xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleKeyClick('backspace')}
            className="h-12 bg-surface hover:bg-card border border-line rounded-xl text-sm font-semibold text-ink-600 active:scale-95 transition-all shadow-2xs flex items-center justify-center"
          >
            ⌫ Back
          </button>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-surface border-t border-line flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-ink-600 hover:text-ink-900 hover:bg-card rounded-xl transition-colors"
          >
            {t('common.cancel')} (Esc)
          </button>

          <button
            type="button"
            disabled={netWeight <= 0}
            onClick={() => onConfirm(product, netWeight)}
            className="px-6 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-40 disabled:pointer-events-none active:scale-95"
          >
            <Check size={18} />
            <span>
              {initialWeight > 0 ? 'Update Cart Line' : 'Add to Cart'} (Rs. {lineTotal.toFixed(2)})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
