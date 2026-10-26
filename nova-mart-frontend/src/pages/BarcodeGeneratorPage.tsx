import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Printer,
  Search,
  CheckSquare,
  Square,
  Plus,
  Minus,
  Trash2,
  Tag,
  Layers,
  Sparkles,
  Eye,
  Sliders,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { productService } from '../services/productService';
import { lookupService } from '../services/lookupService';
import type { Product } from '../types/product';
import ShelfTagLabel, { type LabelFormat } from '../features/barcode/ShelfTagLabel';

interface QueuedItem {
  product: Product;
  copies: number;
}

export default function BarcodeGeneratorPage() {
  const { t } = useTranslation();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [format, setFormat] = useState<LabelFormat>('shelf-edge');
  const [showStoreName, setShowStoreName] = useState(true);
  const [queue, setQueue] = useState<Record<number, QueuedItem>>({});

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productService.getAll,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: lookupService.getCategories,
  });

  // Filtered active products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false;
      const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const term = search.toLowerCase().trim();
      const matchesSearch =
        term.length === 0 ||
        p.name.toLowerCase().includes(term) ||
        p.barcode.toLowerCase().includes(term) ||
        p.productCode.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, search]);

  const queueList = useMemo(() => Object.values(queue), [queue]);
  const totalLabelsCount = useMemo(
    () => queueList.reduce((sum, item) => sum + item.copies, 0),
    [queueList]
  );

  const toggleProductInQueue = (product: Product) => {
    setQueue((prev) => {
      const copy = { ...prev };
      if (copy[product.id]) {
        delete copy[product.id];
      } else {
        copy[product.id] = { product, copies: format === 'shelf-edge' ? 1 : 2 };
      }
      return copy;
    });
  };

  const updateCopies = (productId: number, delta: number) => {
    setQueue((prev) => {
      const item = prev[productId];
      if (!item) return prev;
      const newCopies = item.copies + delta;
      if (newCopies <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: { ...item, copies: newCopies } };
    });
  };

  const setAllCopies = (copies: number) => {
    setQueue((prev) => {
      const updated: Record<number, QueuedItem> = {};
      for (const id in prev) {
        updated[id] = { ...prev[id], copies };
      }
      return updated;
    });
  };

  const selectAllFiltered = () => {
    setQueue((prev) => {
      const updated = { ...prev };
      for (const p of filteredProducts) {
        if (!updated[p.id]) {
          updated[p.id] = { product: p, copies: format === 'shelf-edge' ? 1 : 2 };
        }
      }
      return updated;
    });
  };

  const clearQueue = () => {
    setQueue({});
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2.5">
            <Tag className="text-brand-600" size={26} />
            <span>{t('barcode.title', 'Shelf-Edge Price Tag & Barcode Generator')}</span>
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            {t(
              'barcode.subtitle',
              'Design, preview and batch-print scannable retail shelf talkers and product barcode stickers'
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            disabled={totalLabelsCount === 0}
            className="px-5 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:opacity-40 transition-all shadow-xs flex items-center gap-2"
          >
            <Printer size={18} />
            <span>{t('barcode.printNow', 'Print Labels')}</span>
            {totalLabelsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-mono">
                {totalLabelsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Left Filter & Selection (5 cols) | Right Configuration & Preview (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Selector (5 cols) */}
        <div className="lg:col-span-5 bg-card rounded-2xl border border-line p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-700 flex items-center gap-2">
              <Layers size={16} className="text-brand-600" />
              <span>{t('barcode.selectProducts', 'Select Products')}</span>
            </h2>
            <span className="text-xs font-semibold text-ink-500 font-mono">
              {t('barcode.itemsFound', { count: filteredProducts.length, defaultValue: `${filteredProducts.length} items found` })}
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder={t('barcode.searchPlaceholder', 'Search by name, code, barcode...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface border border-line rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Category tabs/filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-brand-600 text-white shadow-2xs'
                  : 'bg-surface text-ink-700 border border-line hover:bg-card'
              }`}
            >
              {t('barcode.allCategories', 'All Categories')}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === c.id
                    ? 'bg-brand-600 text-white shadow-2xs'
                    : 'bg-surface text-ink-700 border border-line hover:bg-card'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Batch action buttons */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              onClick={selectAllFiltered}
              className="text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <CheckSquare size={14} />
              <span>{t('barcode.selectAll', 'Select All in Filter')}</span>
            </button>
            <button
              onClick={clearQueue}
              className="text-ink-500 hover:text-rose-600 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={14} />
              <span>{t('barcode.clearSelection', 'Clear Selection')}</span>
            </button>
          </div>

          {/* Product checklist */}
          <div className="border border-line rounded-xl divide-y divide-line/70 max-h-[460px] overflow-y-auto bg-surface">
            {productsLoading ? (
              <div className="p-8 text-center text-xs text-ink-400">
                {t('barcode.loadingProducts', 'Loading products...')}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-500">
                {t('barcode.noMatchingProducts', 'No matching active products found.')}
              </div>
            ) : (
              filteredProducts.map((p) => {
                const inQueue = !!queue[p.id];
                const count = queue[p.id]?.copies || 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProductInQueue(p)}
                    className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      inQueue ? 'bg-brand-500/15' : 'hover:bg-surface'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {inQueue ? (
                        <CheckSquare size={18} className="text-brand-600 shrink-0" />
                      ) : (
                        <Square size={18} className="text-ink-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-ink-900 truncate">{p.name}</p>
                        <p className="text-[11px] text-ink-500 font-mono">
                          {p.productCode} · {p.barcode}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-xs font-bold text-ink-900">
                        Rs. {p.sellingPrice.toFixed(2)}
                      </span>
                      {inQueue && (
                        <span className="px-1.5 py-0.5 rounded bg-brand-600 text-white font-mono text-[10px] font-bold">
                          {count}x
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Configuration & Live Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Format Settings Card */}
          <div className="bg-card rounded-2xl border border-line p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-700 flex items-center gap-2">
              <Sliders size={16} className="text-brand-600" />
              <span>{t('barcode.formatSettings', 'Label Format & Options')}</span>
            </h2>

            {/* Format choice cards */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormat('shelf-edge')}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  format === 'shelf-edge'
                    ? 'border-brand-600 bg-brand-50/50 ring-1 ring-brand-500/20 shadow-2xs'
                    : 'border-line bg-surface hover:bg-card'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-ink-900 block">Shelf-Edge Tag</span>
                  <span className="text-[11px] text-ink-500 mt-0.5 block">60×40mm</span>
                </div>
                <span className="text-[10px] text-brand-700 font-medium mt-2">
                  Supermarket shelf talker with large price
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('compact-sticker')}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  format === 'compact-sticker'
                    ? 'border-brand-600 bg-brand-50/50 ring-1 ring-brand-500/20 shadow-2xs'
                    : 'border-line bg-surface hover:bg-card'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-ink-900 block">Item Sticker</span>
                  <span className="text-[11px] text-ink-500 mt-0.5 block">38×25mm</span>
                </div>
                <span className="text-[10px] text-brand-700 font-medium mt-2">
                  Compact barcode sticker for packaging
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('a4-sheet')}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  format === 'a4-sheet'
                    ? 'border-brand-600 bg-brand-50/50 ring-1 ring-brand-500/20 shadow-2xs'
                    : 'border-line bg-surface hover:bg-card'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-ink-900 block">A4 Sheet Grid</span>
                  <span className="text-[11px] text-ink-500 mt-0.5 block">3×8 (24 labels)</span>
                </div>
                <span className="text-[10px] text-brand-700 font-medium mt-2">
                  Avery/A4 multi-label sticker paper
                </span>
              </button>
            </div>

            {/* Toggles & bulk copy buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line/60">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink-700">
                <input
                  type="checkbox"
                  checked={showStoreName}
                  onChange={(e) => setShowStoreName(e.target.checked)}
                  className="rounded border-line text-brand-600 focus:ring-brand-500"
                />
                <span>{t('barcode.includeStoreHeader', 'Include store name in label header')}</span>
              </label>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-ink-500">Set all to:</span>
                {[1, 2, 5].map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => setAllCopies(cnt)}
                    className="px-2 py-0.5 rounded border border-line bg-surface hover:bg-ink-500/10 font-bold text-ink-700 transition-colors"
                  >
                    {cnt}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Queued Items List Card */}
          <div className="bg-card rounded-2xl border border-line p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink-700 flex items-center gap-2">
                <Eye size={16} className="text-brand-600" />
                <span>{t('barcode.printQueue', 'Selected Print Queue')}</span>
              </h2>
              <span className="text-xs font-bold text-brand-600">
                {queueList.length} products · {totalLabelsCount} total labels
              </span>
            </div>

            {queueList.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-400 border border-dashed border-line rounded-xl">
                {t('barcode.noLabelsDesc', 'Click on products from the catalog on the left to add them to your print batch.')}
              </div>
            ) : (
              <div className="border border-line rounded-xl divide-y divide-line/70 max-h-[220px] overflow-y-auto bg-surface">
                {queueList.map(({ product, copies }) => (
                  <div key={product.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink-900 truncate">{product.name}</p>
                      <p className="text-[11px] text-ink-500 font-mono">
                        Rs. {product.sellingPrice.toFixed(2)} · {product.barcode}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-line rounded-lg bg-card overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateCopies(product.id, -1)}
                          className="px-2 py-1 hover:bg-surface text-ink-600"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="px-2 text-xs font-bold font-mono text-ink-900">
                          {copies}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCopies(product.id, 1)}
                          className="px-2 py-1 hover:bg-surface text-ink-600"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleProductInQueue(product)}
                        className="p-1 rounded text-ink-400 hover:text-rose-600 hover:bg-rose-500/15 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Real-Time Live Preview Grid */}
          <div className="bg-card rounded-2xl border border-line p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink-700 flex items-center gap-2">
                <Sparkles size={16} className="text-brand-600" />
                <span>Live Label Preview ({format})</span>
              </h2>
              <span className="text-xs text-ink-500">What you see is what prints</span>
            </div>

            <div className="p-6 bg-surface border border-line rounded-xl max-h-[500px] overflow-y-auto">
              {queueList.length === 0 ? (
                <div className="text-center py-12 text-ink-400 text-xs">
                  No labels in preview. Select products above.
                </div>
              ) : (
                <div className="flex flex-wrap gap-4 justify-start">
                  {queueList.flatMap(({ product, copies }) =>
                    Array.from({ length: copies }).map((_, idx) => (
                      <ShelfTagLabel
                        key={`${product.id}-${idx}`}
                        product={product}
                        format={format}
                        showStoreName={showStoreName}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden container specifically for thermal/A4 printing */}
      <div id="print-barcode-sheet" className="hidden print:block text-black">
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #print-barcode-sheet, #print-barcode-sheet * {
              visibility: visible;
            }
            #print-barcode-sheet {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 4mm;
              display: flex;
              flex-wrap: wrap;
              gap: 4mm;
              background: white;
            }
            @page {
              margin: 3mm;
              size: auto;
            }
          }
        `}</style>
        {queueList.flatMap(({ product, copies }) =>
          Array.from({ length: copies }).map((_, idx) => (
            <ShelfTagLabel
              key={`print-${product.id}-${idx}`}
              product={product}
              format={format}
              showStoreName={showStoreName}
            />
          ))
        )}
      </div>
    </div>
  );
}
