import { useState, useEffect } from 'react';
import { Scale, Package, RotateCcw, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Product } from '../../types/product';

interface Props {
  product: Product;
  initialWeight?: number;
  onConfirm: (product: Product, weightKg: number) => void;
  onClose: () => void;
}

export default function WeighModal({
  product,
  initialWeight = 0,
  onConfirm,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [weightStr, setWeightStr] = useState<string>(
    initialWeight > 0 ? initialWeight.toFixed(3) : ''
  );
  const [tareKg, setTareKg] = useState<number>(0);

  const unit = product.unitOfMeasure || 'kg';
  const unitPrice = product.sellingPrice;

  const grossWeight = Math.max(0, parseFloat(weightStr) || 0);
  const netWeight = Math.max(0, Number((grossWeight - tareKg).toFixed(3)));
  const lineTotal = netWeight * unitPrice;

  // Handle touch keypad input
  const handleKeyClick = (val: string) => {
    if (val === 'backspace') {
      setWeightStr((prev) => prev.slice(0, -1));
      return;
    }

    if (val === '.') {
      if (weightStr.includes('.')) return;
      setWeightStr((prev) => (prev === '' ? '0.' : prev + '.'));
      return;
    }

    // Limit decimal precision to 3 places
    if (weightStr.includes('.')) {
      const parts = weightStr.split('.');
      if (parts[1] && parts[1].length >= 3) return;
    }

    // Max 99.999 kg per line
    const nextVal = weightStr + val;
    if (parseFloat(nextVal) > 99.999) return;

    setWeightStr(nextVal);
  };

  const setPresetWeight = (kg: number) => {
    setWeightStr(kg.toFixed(3));
  };

  const addWeight = (delta: number) => {
    const current = parseFloat(weightStr) || 0;
    const next = Math.max(0, Math.min(99.999, current + delta));
    setWeightStr(next.toFixed(3));
  };

  // Keyboard shortcut support
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
      } else if (e.key === '.') {
        e.preventDefault();
        handleKeyClick('.');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleKeyClick('backspace');
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setTareKg((prev) => (prev > 0 ? 0 : 0.02));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [netWeight, product, onConfirm, onClose, weightStr, tareKg]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg w-full max-h-[92vh] overflow-y-auto bg-card rounded-2xl border border-line shadow-2xl flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-surface border-b border-line flex items-center justify-between">
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
                {t('weigh.scaleStable', 'SCALE STABLE')}
              </span>
              {tareKg > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 rounded text-[10px] font-bold">
                  {t('weigh.tareActive', { grams: (tareKg * 1000).toFixed(0), defaultValue: `TARE ACTIVE (-${(tareKg * 1000).toFixed(0)}g)` })}
                </span>
              )}
            </div>
            <span className="text-ink-400">
              {t('weigh.unit', { unit: unit.toUpperCase(), defaultValue: `UNIT: ${unit.toUpperCase()}` })}
            </span>
          </div>

          {/* Main Weight Readout */}
          <div className="grid grid-cols-2 gap-3 py-1">
            <div className="bg-black/60 rounded-xl p-3 border border-ink-800">
              <span className="text-[11px] text-ink-400 block mb-0.5">
                {t('weigh.netWeight', 'NET WEIGHT')}
              </span>
              <div className="text-3xl font-extrabold text-emerald-400 tracking-tight flex items-baseline justify-between">
                <span>{netWeight.toFixed(3)}</span>
                <span className="text-sm font-normal text-emerald-600">{unit}</span>
              </div>
              <div className="text-[11px] text-ink-500 mt-1">
                {t('weigh.gross', 'Gross')}: {grossWeight.toFixed(3)} {unit} · {t('weigh.tare', 'Tare')}: {tareKg.toFixed(3)} {unit}
              </div>
            </div>

            <div className="bg-black/60 rounded-xl p-3 border border-ink-800">
              <span className="text-[11px] text-ink-400 block mb-0.5">
                {t('weigh.lineAmount', 'LINE AMOUNT')}
              </span>
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
            <span className="text-xs font-semibold text-ink-600 w-16">
              {t('weigh.tareZero', 'Tare / Zero:')}
            </span>
            <button
              type="button"
              onClick={() => setTareKg(0.02)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
                tareKg === 0.02
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-2xs'
                  : 'bg-card border-line text-ink-700 hover:bg-card/80'
              }`}
            >
              <Package size={13} />
              {t('weigh.bagTare', 'Bag Tare (-20g)')}
            </button>
            <button
              type="button"
              onClick={() => setTareKg(0.05)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
                tareKg === 0.05
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-2xs'
                  : 'bg-card border-line text-ink-700 hover:bg-card/80'
              }`}
            >
              <Package size={13} />
              {t('weigh.trayTare', 'Tray Tare (-50g)')}
            </button>
            <button
              type="button"
              onClick={() => {
                setTareKg(0);
                setWeightStr('');
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-card border border-line text-ink-700 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all flex items-center gap-1 ml-auto"
            >
              <RotateCcw size={13} />
              {t('weigh.zeroReset', 'Zero / Reset')}
            </button>
          </div>

          {/* Quick Weight Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-ink-600 w-16">
              {t('weigh.quick', 'Quick:')}
            </span>
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
                className="px-2.5 py-1 bg-card hover:bg-brand-500/15 border border-line hover:border-brand-500/30 rounded-md text-xs font-medium text-ink-800 transition-colors"
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
                className="px-2 py-1 bg-card hover:bg-emerald-500/15 border border-line hover:border-emerald-500/30 rounded-md text-xs font-medium text-ink-800 transition-colors"
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
              className="h-12 bg-surface hover:bg-card border border-line rounded-xl text-xl font-bold text-ink-800 active:scale-95 transition-all shadow-2xs cursor-pointer"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleKeyClick('.')}
            className="h-12 bg-surface hover:bg-card border border-line rounded-xl text-xl font-bold text-ink-800 active:scale-95 transition-all shadow-2xs cursor-pointer"
          >
            .
          </button>
          <button
            type="button"
            onClick={() => handleKeyClick('0')}
            className="h-12 bg-surface hover:bg-card border border-line rounded-xl text-xl font-bold text-ink-800 active:scale-95 transition-all shadow-2xs cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleKeyClick('backspace')}
            className="h-12 bg-surface hover:bg-card border border-line rounded-xl text-sm font-semibold text-ink-600 active:scale-95 transition-all shadow-2xs flex items-center justify-center cursor-pointer"
          >
            ⌫
          </button>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-surface border-t border-line flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-ink-600 hover:text-ink-900 hover:bg-card rounded-xl transition-colors cursor-pointer"
          >
            {t('common.cancel')} (Esc)
          </button>

          <button
            type="button"
            disabled={netWeight <= 0}
            onClick={() => onConfirm(product, netWeight)}
            className="px-6 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-40 disabled:pointer-events-none active:scale-95 cursor-pointer"
          >
            <Check size={18} />
            <span>
              {initialWeight > 0 ? t('pos.resumeCart', 'Update') : t('common.confirm', 'Add')} (Rs. {lineTotal.toFixed(2)})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
