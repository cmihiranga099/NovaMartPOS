import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, CheckCircle2, Tag, X, Delete } from 'lucide-react';
import { productService } from '../services/productService';
import { customerService } from '../services/customerService';
import { saleService } from '../services/saleService';
import { promotionService } from '../services/promotionService';
import { lookupService } from '../services/lookupService';
import CartItemRow, { type CartLine } from '../features/pos/CartItem';
import type { SaleResult } from '../types/sale';
import Receipt from '../features/pos/Receipt';
import { useTranslation } from 'react-i18next';

const TILE_PALETTE = [
  'bg-orange-100 text-orange-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-pink-100 text-pink-700',
  'bg-amber-100 text-amber-700',
  'bg-cyan-100 text-cyan-700',
  'bg-rose-100 text-rose-700',
];

const tileColor = (key: string) => {
  const idx = key.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % TILE_PALETTE.length;
  return TILE_PALETTE[idx];
};

const KEYPAD_KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', 'DEL'];

export default function PosPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<number | 'all' | null>('all');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<SaleResult | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: productService.getAll });
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: customerService.getAll });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: lookupService.getCategories });

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const checkoutMutation = useMutation({
    mutationFn: saleService.checkout,
    onSuccess: (result) => {
      setCompletedSale(result);
      setCart([]);
      setAmountPaid('');
      setError(null);
      setAppliedPromo(null);
      setPromoInput('');
      setPromoError(null);
      searchInputRef.current?.focus();
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || t('pos.checkoutFailed'));
    },
  });

  const activeProducts = products.filter((p) => p.isActive);

  const hasSelection = activeCategory !== null || submittedSearch.length > 0;

  const visibleProducts = hasSelection
    ? activeProducts.filter((p) => {
        const matchesCategory = activeCategory === 'all' || activeCategory === null || p.categoryId === activeCategory;
        const matchesSearch =
          submittedSearch.length === 0 ||
          p.name.toLowerCase().includes(submittedSearch.toLowerCase()) ||
          p.barcode === submittedSearch ||
          p.productCode.toLowerCase().includes(submittedSearch.toLowerCase());
        return matchesCategory && matchesSearch;
      })
    : [];

  const addToCart = (product: (typeof products)[number]) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) return prev;
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unitPrice: product.sellingPrice,
          taxRate: product.taxRate,
          quantity: 1,
          discount: 0,
          availableStock: product.stockQuantity,
        },
      ];
    });
  };

  const handleBarcodeEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const exact = activeProducts.find((p) => p.barcode === search);
      if (exact) {
        addToCart(exact);
        setSearch('');
        setSubmittedSearch('');
        return;
      }
      setSubmittedSearch(search);
    }
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const subtotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const totalDiscount = cart.reduce((sum, i) => sum + i.discount, 0);
  const totalTax = cart.reduce(
    (sum, i) => sum + (i.unitPrice * i.quantity - i.discount) * (i.taxRate / 100),
    0
  );
  const netAfterLineDiscounts = subtotal - totalDiscount;
  const promoDiscount = appliedPromo?.discount ?? 0;
  const grandTotal = netAfterLineDiscounts - promoDiscount + totalTax;
  const paidNum = Number(amountPaid) || 0;
  const change = paidNum - grandTotal;

  const validatePromoMutation = useMutation({
    mutationFn: (code: string) => promotionService.validate(code, netAfterLineDiscounts),
    onSuccess: (res, code) => {
      if (res.valid) {
        setAppliedPromo({ code: res.code ?? code.toUpperCase(), discount: res.discountAmount });
        setPromoError(null);
      } else {
        setAppliedPromo(null);
        setPromoError(res.error || 'Invalid promo code.');
      }
    },
    onError: () => {
      setAppliedPromo(null);
      setPromoError('Could not validate promo code.');
    },
  });

  // Keep the applied discount in sync as the cart changes (e.g. re-check min purchase, recompute %)
  useEffect(() => {
    if (appliedPromo) {
      validatePromoMutation.mutate(appliedPromo.code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [netAfterLineDiscounts]);

  const handleApplyPromo = () => {
    if (!promoInput.trim()) return;
    validatePromoMutation.mutate(promoInput.trim());
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError(null);
  };

  const handleKeypadPress = (key: string) => {
    if (key === 'DEL') {
      setAmountPaid((prev) => prev.slice(0, -1));
      return;
    }
    if (key === '.' && amountPaid.includes('.')) return;
    setAmountPaid((prev) => prev + key);
  };

  const setExactAmount = () => setAmountPaid(grandTotal > 0 ? grandTotal.toFixed(2) : '');

  const handleCheckout = () => {
    setError(null);
    if (cart.length === 0) {
      setError(t('pos.cartEmptyError'));
      return;
    }
    if (paidNum < grandTotal) {
      setError(t('pos.amountPaidError', { amount: grandTotal.toFixed(2) }));
      return;
    }

    checkoutMutation.mutate({
      customerId,
      items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, discount: i.discount })),
      paymentMethod,
      amountPaid: paidNum,
      promoCode: appliedPromo?.code ?? null,
    });
  };

  return (
    <div className="grid grid-cols-3 gap-6 h-full">
      {/* Left: category tabs + product grid */}
      <div className="col-span-2 flex flex-col min-h-0">
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-3 text-ink-500" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t('pos.scanOrSearch')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleBarcodeEnter}
            className="w-full pl-10 pr-3 py-3 border border-ink-500/20 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
          <button
            onClick={() => { setActiveCategory('all'); setSearch(''); setSubmittedSearch(''); }}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-brand-600 text-white'
                : 'bg-white text-ink-700 border border-line hover:bg-surface'
            }`}
          >
            {t('pos.all')}
          </button>
          {categories.filter((c) => c.isActive).map((c) => (
            <button
              key={c.id}
              onClick={() => { setActiveCategory(c.id); setSearch(''); setSubmittedSearch(''); }}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeCategory === c.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-ink-700 border border-line hover:bg-surface'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-auto">
          {!hasSelection ? (
            <div className="mt-10 text-center text-ink-500 text-sm">
              {t('pos.pickCategoryPrompt')}
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="mt-10 text-center text-ink-500 text-sm">{t('pos.noProductsMatch')}</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {visibleProducts.map((product) => {
                const outOfStock = product.stockQuantity === 0;
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={outOfStock}
                    className="group flex flex-col items-stretch rounded-2xl border border-line bg-white overflow-hidden text-left hover:shadow-md hover:border-brand-200 transition-all disabled:opacity-40 disabled:hover:shadow-none disabled:hover:border-line"
                  >
                    <div className={`h-16 flex items-center justify-center font-bold text-2xl ${tileColor(product.categoryName || product.name)}`}>
                      {product.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="p-2.5">
                      <p className="font-medium text-sm leading-tight line-clamp-2 min-h-[2.2em]">{product.name}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="font-bold text-sm">Rs. {product.sellingPrice.toFixed(2)}</span>
                        <span className={`text-[10px] ${outOfStock ? 'text-red-600 font-medium' : 'text-ink-500'}`}>
                          {outOfStock ? t('pos.outOfStock') : t('pos.stock', { count: product.stockQuantity })}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: cart + checkout */}
      <div className="bg-white rounded-lg shadow flex flex-col p-4 min-h-0">
        <h2 className="font-bold text-lg mb-3">{t('pos.cart')}</h2>

        <div className="flex-1 overflow-auto min-h-[80px]">
          {cart.length === 0 ? (
            <p className="text-ink-500 text-sm">{t('pos.cartEmpty')}</p>
          ) : (
            cart.map((item) => (
              <CartItemRow
                key={item.productId}
                item={item}
                onQuantityChange={updateQuantity}
                onRemove={removeFromCart}
              />
            ))
          )}
        </div>

        <div className="border-t border-ink-500/10 pt-3 mt-3">
          {!appliedPromo ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-500" />
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => { setPromoInput(e.target.value); setPromoError(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyPromo(); } }}
                  placeholder={t('pos.promoCode')}
                  className="w-full pl-7 pr-2 py-1.5 border border-ink-500/20 rounded-lg text-xs uppercase"
                />
              </div>
              <button
                onClick={handleApplyPromo}
                disabled={validatePromoMutation.isPending || !promoInput.trim()}
                className="px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg text-xs font-medium hover:bg-brand-100 disabled:opacity-50"
              >
                {validatePromoMutation.isPending ? '...' : t('pos.apply')}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-brand-50 px-2.5 py-1.5 rounded-lg">
              <span className="flex items-center gap-1.5 text-xs font-medium text-brand-700">
                <Tag size={13} /> {appliedPromo.code} {t('pos.applied')}
              </span>
              <button onClick={removePromo} className="text-ink-500 hover:text-red-600">
                <X size={14} />
              </button>
            </div>
          )}
          {promoError && <p className="text-red-600 text-xs mt-1">{promoError}</p>}
        </div>

        <div className="pt-3 mt-1 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-500">{t('common.subtotal')}</span>
            <span>Rs. {subtotal.toFixed(2)}</span>
          </div>
          {promoDiscount > 0 && (
            <div className="flex justify-between text-brand-600">
              <span>{t('pos.promoCode')} - {t('common.discount')}</span>
              <span>-Rs. {promoDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-ink-500">{t('common.tax')}</span>
            <span>Rs. {totalTax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-1">
            <span>{t('common.total')}</span>
            <span>Rs. {grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <select
            value={customerId}
            onChange={(e) => setCustomerId(Number(e.target.value))}
            className="px-2.5 py-2 border border-ink-500/20 rounded-lg text-sm"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="px-2.5 py-2 border border-ink-500/20 rounded-lg text-sm"
          >
            <option value="Cash">{t('pos.cash')}</option>
            <option value="Card">{t('pos.card')}</option>
            <option value="BankTransfer">{t('pos.bankTransfer')}</option>
          </select>
        </div>

        {/* Amount paid + numeric keypad, like a till terminal */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-ink-700">{t('pos.amountPaid')}</span>
            <button
              onClick={setExactAmount}
              className="text-[11px] font-medium text-brand-600 hover:text-brand-700"
            >
              {t('pos.exact')}
            </button>
          </div>
          <div className="px-3 py-2.5 border border-ink-500/20 rounded-lg text-right text-xl font-bold mb-2 bg-surface">
            {amountPaid ? `Rs. ${amountPaid}` : <span className="text-ink-500 text-base font-normal">Rs. 0.00</span>}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
          {KEYPAD_KEYS.map((key) => (
  <button
    key={key}
    onClick={() => handleKeypadPress(key)}
    className="py-2.5 rounded-lg border border-line bg-surface hover:bg-ink-500/10 font-semibold text-ink-900 flex items-center justify-center transition-colors"
  >
    {key === 'DEL' ? <Delete size={16} /> : key}
  </button>
))}
          </div>
        </div>

        {paidNum > 0 && (
          <div className="flex justify-between text-sm font-medium mt-3">
            <span className="text-ink-500">{t('pos.change')}</span>
            <span className={change < 0 ? 'text-red-600' : 'text-brand-600'}>
              Rs. {change.toFixed(2)}
            </span>
          </div>
        )}

        {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded mt-3">{error}</p>}

        <button
  onClick={handleCheckout}
  disabled={checkoutMutation.isPending}
  className="w-full py-3 mt-3 bg-brand-600 text-white font-bold rounded-none hover:bg-brand-700 disabled:opacity-50 transition-colors"
>
  {checkoutMutation.isPending ? t('pos.processing') : t('pos.completeSale')}
</button>
      </div>

      {completedSale && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6 text-center">
            <CheckCircle2 className="mx-auto text-brand-600 mb-3" size={48} />
            <h2 className="text-xl font-bold mb-1">{t('pos.saleComplete')}</h2>
            <p className="text-ink-500 text-sm mb-4">{completedSale.invoiceNumber}</p>
            <div className="text-left text-sm space-y-1 mb-4 bg-surface p-3 rounded-lg">
              <div className="flex justify-between"><span>{t('common.total')}</span><span>Rs. {completedSale.grandTotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>{t('pos.paid')}</span><span>Rs. {completedSale.amountPaid.toFixed(2)}</span></div>
              <div className="flex justify-between font-medium"><span>{t('pos.change')}</span><span>Rs. {completedSale.change.toFixed(2)}</span></div>
            </div>
            <button
              onClick={() => window.print()}
              className="w-full py-2.5 bg-accent-500 text-brand-900 rounded-lg hover:bg-accent-600 font-medium mb-2"
            >
              {t('pos.printReceipt')}
            </button>
            <button
              onClick={() => setCompletedSale(null)}
              className="w-full py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium"
            >
              {t('pos.newSale')}
            </button>
          </div>
        </div>
      )}

      {completedSale && <Receipt sale={completedSale} />}
    </div>
  );
}