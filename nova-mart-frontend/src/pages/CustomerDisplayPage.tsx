import { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Clock,
  CreditCard,
  Banknote,
  Receipt,
  Heart,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { shopInfo } from '../config/shopInfo';
import logo from '../assets/logo.png';
import { customerDisplayService } from '../services/customerDisplayService';
import type {
  DisplayCartState,
  DisplayPaymentState,
  DisplaySaleComplete,
  CustomerDisplayMessage,
} from '../types/customerDisplay';

const IDLE_PROMOS = [
  {
    title: 'Welcome to Nova Mart',
    subtitle: 'Your neighborhood destination for fresh groceries, dairy & daily household essentials.',
    badge: 'Fresh Daily',
    accent: 'bg-brand-50 border-brand-200 text-brand-900',
    badgeColor: 'bg-brand-600 text-white',
  },
  {
    title: 'Super Saver Deals This Week',
    subtitle: 'Exclusive discounts on fresh vegetables, imported fruits, and dairy products across all aisles.',
    badge: 'Special Offers',
    accent: 'bg-emerald-50 border-emerald-200 text-emerald-950',
    badgeColor: 'bg-emerald-600 text-white',
  },
  {
    title: 'Multiple Payment Options',
    subtitle: 'We gladly accept Cash, Visa, Mastercard, and Instant Bank Transfers for your convenience.',
    badge: 'Fast Checkout',
    accent: 'bg-amber-50 border-amber-200 text-amber-950',
    badgeColor: 'bg-amber-600 text-white',
  },
  {
    title: 'Loyalty Rewards Program',
    subtitle: 'Ask our cashier to earn loyalty reward points on today’s shopping invoice.',
    badge: 'Save More',
    accent: 'bg-violet-50 border-violet-200 text-violet-950',
    badgeColor: 'bg-violet-600 text-white',
  },
];

export default function CustomerDisplayPage() {
  const initialSaved = customerDisplayService.getSavedState();

  const [cartState, setCartState] = useState<DisplayCartState | null>(() => {
    if (initialSaved?.type === 'CART_UPDATE' && initialSaved.payload?.items?.length > 0) {
      return initialSaved.payload;
    }
    return null;
  });

  const [paymentState, setPaymentState] = useState<DisplayPaymentState | null>(() => {
    if (initialSaved?.type === 'PAYMENT_UPDATE') {
      return initialSaved.payload;
    }
    return null;
  });

  const [completedSale, setCompletedSale] = useState<DisplaySaleComplete | null>(() => {
    if (initialSaved?.type === 'SALE_COMPLETE') {
      return initialSaved.payload;
    }
    return null;
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [promoIndex, setPromoIndex] = useState(0);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Idle promo carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % IDLE_PROMOS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Multi-window sync (localStorage, BroadcastChannel, SignalR)
  useEffect(() => {
    const handleDisplayMessage = (msg: CustomerDisplayMessage) => {
      switch (msg.type) {
        case 'CART_UPDATE':
          setCartState(msg.payload);
          setCompletedSale(null);
          break;
        case 'PAYMENT_UPDATE':
          setPaymentState(msg.payload);
          break;
        case 'SALE_COMPLETE':
          setCompletedSale(msg.payload);
          setCartState(null);
          setPaymentState(null);
          setTimeout(() => {
            setCompletedSale((curr) => (curr?.invoiceNumber === msg.payload.invoiceNumber ? null : curr));
          }, 8000);
          break;
        case 'IDLE':
          setCartState(null);
          setPaymentState(null);
          setCompletedSale(null);
          break;
      }
    };

    // 1. Cross-tab storage listener
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'novamart_cfd_state') {
        if (e.newValue) {
          try {
            handleDisplayMessage(JSON.parse(e.newValue));
          } catch {}
        } else {
          setCartState(null);
          setPaymentState(null);
          setCompletedSale(null);
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    // 2. BroadcastChannel + SignalR subscription
    const unsubscribe = customerDisplayService.subscribe('default-register', handleDisplayMessage);

    // 3. Handshake request to active POS
    customerDisplayService.requestCurrentState('default-register');

    return () => {
      window.removeEventListener('storage', handleStorage);
      unsubscribe();
    };
  }, []);

  const hasItems = cartState && cartState.items.length > 0;
  const activePromo = IDLE_PROMOS[promoIndex];
  const totalItemCount = cartState ? cartState.items.reduce((sum, i) => sum + i.quantity, 0) : 0;

  return (
    <div className="h-screen w-screen bg-surface text-ink-900 font-sans flex flex-col overflow-hidden select-none">
      {/* Top Header Bar — Matches NovaMart POS Navbar styling */}
      <header className="h-20 px-8 bg-card border-b border-line flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3.5">
          <img src={logo} alt={shopInfo.name} className="w-12 h-12 rounded-xl object-contain border border-line p-1 bg-white" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-ink-900">{shopInfo.name}</h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                Customer View
              </span>
            </div>
            <p className="text-xs text-ink-500 mt-0.5">
              {cartState?.cashierName ? `Cashier: ${cartState.cashierName} · Express Checkout` : shopInfo.address}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Register Online</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-sm text-ink-700 px-3.5 py-1.5 rounded-xl bg-surface border border-line">
            <Clock size={15} className="text-ink-500" />
            <span>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden p-6 flex">
        {/* State 1: Completed Sale / Thank You Screen */}
        {completedSale ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-card rounded-2xl border border-line shadow-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 mb-5 shadow-sm">
              <CheckCircle2 size={46} />
            </div>

            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">
              Payment Approved & Verified
            </span>
            <h2 className="text-3xl font-black text-ink-900 mb-1">Thank You for Shopping at Nova Mart!</h2>
            <p className="text-ink-500 text-sm mb-6 font-mono">Invoice #{completedSale.invoiceNumber}</p>

            <div className="bg-surface border border-line rounded-2xl p-6 w-full max-w-md space-y-3 mb-6 shadow-2xs">
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Total Paid:</span>
                <span className="font-bold text-ink-900 font-mono text-base">
                  Rs. {completedSale.amountPaid.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t border-line pt-3">
                <span className="text-ink-900">Change Returned:</span>
                <span className="text-brand-600 font-mono font-black">
                  Rs. {completedSale.change.toFixed(2)}
                </span>
              </div>
            </div>

            <p className="text-xs text-ink-500 flex items-center gap-1.5 font-medium">
              <Heart size={14} className="text-brand-600 fill-brand-600" />
              <span>Please collect your printed receipt and change. Have a pleasant day!</span>
            </p>
          </div>
        ) : hasItems ? (
          /* State 2: Active Cart View (Matches POS Card Style Exactly) */
          <div className="w-full h-full grid grid-cols-12 gap-6 overflow-hidden">
            {/* Left 7 Columns: Items List Card */}
            <div className="col-span-7 flex flex-col bg-card rounded-2xl border border-line shadow-xs overflow-hidden">
              {/* Card Header */}
              <div className="px-6 py-3.5 border-b border-line flex items-center justify-between bg-surface/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                    <ShoppingBag size={16} />
                  </div>
                  <span className="font-bold text-sm text-ink-900">Your Scanned Cart</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-surface border border-line text-ink-600">
                    {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {cartState.lastScannedItem && (
                  <div className="flex items-center gap-1.5 text-xs text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200 font-medium animate-in fade-in slide-in-from-right-2 duration-150">
                    <Sparkles size={13} className="text-brand-600" />
                    <span className="truncate max-w-[220px]">
                      Scanned: <strong>{cartState.lastScannedItem.name}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Items Scrollable List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {cartState.items.map((item, index) => {
                  const isLastScanned = cartState.lastScannedItem?.name === item.name;
                  return (
                    <div
                      key={index}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                        isLastScanned
                          ? 'bg-brand-50/50 border-brand-300 ring-1 ring-brand-400/20 shadow-2xs'
                          : 'bg-surface border-line hover:border-ink-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-card border border-line text-ink-600 text-[11px] font-mono font-bold flex items-center justify-center shadow-2xs">
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-ink-900">{item.name}</h4>
                          <p className="text-xs text-ink-500 mt-0.5 font-mono">
                            Rs. {item.unitPrice.toFixed(2)} × {Number.isInteger(item.quantity) ? item.quantity : item.quantity.toFixed(3)}{item.unitOfMeasure && item.unitOfMeasure !== 'pcs' ? ` ${item.unitOfMeasure}` : ''}
                            {item.discount > 0 && (
                              <span className="ml-2 text-emerald-600 font-semibold font-sans">
                                (-Rs. {item.discount.toFixed(2)} off)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-bold text-ink-900 font-mono">
                          Rs. {item.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 5 Columns: Billing & Payment Card */}
            <div className="col-span-5 flex flex-col justify-between space-y-4">
              {/* Order Totals Card */}
              <div className="bg-card rounded-2xl border border-line p-6 shadow-xs flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-4">
                    Invoice Summary
                  </span>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-ink-600">
                      <span>Subtotal</span>
                      <span className="font-mono text-ink-900 font-semibold">
                        Rs. {cartState.subtotal.toFixed(2)}
                      </span>
                    </div>

                    {cartState.totalDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold bg-emerald-50/60 px-3 py-1.5 rounded-lg border border-emerald-200">
                        <span className="flex items-center gap-1.5">
                          <Tag size={15} />
                          <span>Savings & Discounts</span>
                        </span>
                        <span className="font-mono">-Rs. {cartState.totalDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    {cartState.totalTax > 0 && (
                      <div className="flex justify-between text-ink-600">
                        <span>Tax</span>
                        <span className="font-mono text-ink-900">
                          Rs. {cartState.totalTax.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Big Grand Total */}
                <div className="pt-6 border-t border-line">
                  <span className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-1">
                    Total Amount Due
                  </span>
                  <div className="text-4xl font-black text-brand-600 font-mono tracking-tight">
                    Rs. {cartState.grandTotal.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Payment Tender Callout (when cashier enters paid amount) */}
              {paymentState && paymentState.amountPaid > 0 ? (
                <div className="bg-card rounded-2xl border border-brand-500/40 p-5 shadow-xs space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="flex items-center justify-between text-xs text-ink-600">
                    <span className="flex items-center gap-1.5 font-semibold">
                      {paymentState.paymentMethod === 'Cash' ? <Banknote size={15} /> : <CreditCard size={15} />}
                      <span>Tender ({paymentState.paymentMethod}):</span>
                    </span>
                    <span className="font-mono font-bold text-ink-900 text-sm">
                      Rs. {paymentState.amountPaid.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-line">
                    <span className="text-sm font-bold text-ink-900">Change Due:</span>
                    <span
                      className={`text-2xl font-black font-mono ${
                        paymentState.change >= 0 ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      Rs. {Math.max(0, paymentState.change).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                /* Information footnote */
                <div className="p-4 bg-card rounded-2xl border border-line text-xs text-ink-500 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    <span>Scanned items are verified & price-checked live</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* State 3: Idle / Promotional Screen Saver (Clean Light NovaMart Theme) */
          <div className="w-full h-full flex flex-col justify-between p-8 rounded-2xl border border-line bg-card shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
                  Ready for Next Customer
                </span>
                <h2 className="text-3xl font-black text-ink-900 mt-3">Welcome to {shopInfo.name}</h2>
                <p className="text-ink-500 text-sm mt-1 max-w-md">
                  Please place your shopping items on the checkout counter. Our cashier will assist you promptly.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface border border-line flex items-center gap-3">
                <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                  <Receipt size={22} />
                </div>
                <div className="text-xs text-ink-700">
                  <p className="font-bold">Official Digital Receipts</p>
                  <p className="text-ink-500">Unique invoice barcode on every receipt</p>
                </div>
              </div>
            </div>

            {/* Rotating Promotional Hero Card */}
            <div
              className={`p-8 rounded-2xl border ${activePromo.accent} shadow-2xs transition-all duration-500`}
            >
              <div className="max-w-xl space-y-2.5">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block ${activePromo.badgeColor}`}>
                  {activePromo.badge}
                </span>
                <h3 className="text-2xl font-bold">{activePromo.title}</h3>
                <p className="text-sm opacity-90 leading-relaxed">{activePromo.subtitle}</p>
              </div>
            </div>

            {/* Accepted Payments Bar */}
            <div className="pt-4 border-t border-line flex items-center justify-between text-xs text-ink-500">
              <div className="flex items-center gap-6">
                <span className="font-semibold text-ink-700">Accepted Payments:</span>
                <span className="flex items-center gap-1.5 font-medium text-ink-900 bg-surface px-2.5 py-1 rounded-lg border border-line">
                  <Banknote size={15} className="text-emerald-600" /> Cash
                </span>
                <span className="flex items-center gap-1.5 font-medium text-ink-900 bg-surface px-2.5 py-1 rounded-lg border border-line">
                  <CreditCard size={15} className="text-brand-600" /> Credit / Debit Card
                </span>
                <span className="flex items-center gap-1.5 font-medium text-ink-900 bg-surface px-2.5 py-1 rounded-lg border border-line">
                  <Receipt size={15} className="text-blue-600" /> Bank Transfer
                </span>
              </div>

              <span>Thank you for choosing {shopInfo.name}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
