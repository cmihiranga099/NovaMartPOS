import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, CheckCircle2 } from 'lucide-react';
import { productService } from '../services/productService';
import { customerService } from '../services/customerService';
import { saleService } from '../services/saleService';
import CartItemRow, { type CartLine } from '../features/pos/CartItem';
import type { SaleResult } from '../types/sale';
import Receipt from '../features/pos/Receipt';

export default function PosPage() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<SaleResult | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: productService.getAll });
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: customerService.getAll });

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
      searchInputRef.current?.focus();
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || 'Checkout failed.');
    },
  });

  const filteredProducts = search.length > 0
    ? products.filter(
        (p) =>
          p.isActive &&
          (p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.barcode === search ||
            p.productCode.toLowerCase().includes(search.toLowerCase()))
      ).slice(0, 8)
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
    setSearch('');
    searchInputRef.current?.focus();
  };

  const handleBarcodeEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const exact = products.find((p) => p.barcode === search && p.isActive);
      if (exact) {
        addToCart(exact);
      } else if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
      }
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
  const grandTotal = subtotal - totalDiscount + totalTax;
  const paidNum = Number(amountPaid) || 0;
  const change = paidNum - grandTotal;

  const handleCheckout = () => {
    setError(null);
    if (cart.length === 0) {
      setError('Cart is empty.');
      return;
    }
    if (paidNum < grandTotal) {
      setError(`Amount paid must be at least Rs. ${grandTotal.toFixed(2)}.`);
      return;
    }

    checkoutMutation.mutate({
      customerId,
      items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, discount: i.discount })),
      paymentMethod,
      amountPaid: paidNum,
    });
  };

  return (
    <div className="grid grid-cols-3 gap-6 h-full">
      {/* Left: search + results */}
      <div className="col-span-2">
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-3 text-ink-500" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Scan barcode or search product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleBarcodeEnter}
            className="w-full pl-10 pr-3 py-3 border border-ink-500/20 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {filteredProducts.length > 0 && (
          <div className="bg-white rounded-lg shadow divide-y">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stockQuantity === 0}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface text-left disabled:opacity-40"
              >
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-xs text-ink-500">{product.barcode} · Stock: {product.stockQuantity}</p>
                </div>
                <p className="font-medium">Rs. {product.sellingPrice.toFixed(2)}</p>
              </button>
            ))}
          </div>
        )}

        {search.length === 0 && (
          <div className="mt-6 text-ink-500 text-sm">
            Start typing a product name, code, or scan a barcode to add items.
          </div>
        )}
      </div>

      {/* Right: cart + checkout */}
      <div className="bg-white rounded-lg shadow flex flex-col p-4">
        <h2 className="font-bold text-lg mb-3">Cart</h2>

        <div className="flex-1 overflow-auto">
          {cart.length === 0 ? (
            <p className="text-ink-500 text-sm">Cart is empty.</p>
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

        <div className="border-t border-ink-500/10 pt-3 mt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-500">Subtotal</span>
            <span>Rs. {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">Tax</span>
            <span>Rs. {totalTax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-1">
            <span>Total</span>
            <span>Rs. {grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Customer</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-ink-500/20 rounded-lg text-sm"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-ink-500/20 rounded-lg text-sm"
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="BankTransfer">Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Amount Paid</label>
            <input
              type="number"
              step="0.01"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full px-3 py-2 border border-ink-500/20 rounded-lg text-sm"
              placeholder="0.00"
            />
          </div>

          {paidNum > 0 && (
            <div className="flex justify-between text-sm font-medium">
              <span className="text-ink-500">Change</span>
              <span className={change < 0 ? 'text-red-600' : 'text-brand-600'}>
                Rs. {change.toFixed(2)}
              </span>
            </div>
          )}

          {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>}

          <button
            onClick={handleCheckout}
            disabled={checkoutMutation.isPending}
            className="w-full py-3 bg-accent-500 text-brand-900 font-bold rounded-lg hover:bg-accent-600 disabled:opacity-50 transition-colors"
          >
            {checkoutMutation.isPending ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </div>

      {completedSale && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6 text-center">
            <CheckCircle2 className="mx-auto text-brand-600 mb-3" size={48} />
            <h2 className="text-xl font-bold mb-1">Sale Complete</h2>
            <p className="text-ink-500 text-sm mb-4">{completedSale.invoiceNumber}</p>
            <div className="text-left text-sm space-y-1 mb-4 bg-surface p-3 rounded-lg">
              <div className="flex justify-between"><span>Total</span><span>Rs. {completedSale.grandTotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Paid</span><span>Rs. {completedSale.amountPaid.toFixed(2)}</span></div>
              <div className="flex justify-between font-medium"><span>Change</span><span>Rs. {completedSale.change.toFixed(2)}</span></div>
            </div>
            <button
              onClick={() => window.print()}
              className="w-full py-2.5 bg-accent-500 text-brand-900 rounded-lg hover:bg-accent-600 font-medium mb-2"
            >
              Print Receipt
            </button>
            <button
              onClick={() => setCompletedSale(null)}
              className="w-full py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium"
            >
              New Sale
            </button>
          </div>
        </div>
      )}

      {completedSale && <Receipt sale={completedSale} />}
    </div>
  );
}