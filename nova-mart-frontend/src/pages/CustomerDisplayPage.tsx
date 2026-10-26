import { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Clock,
  Wifi,
  CreditCard,
  Banknote,
  Receipt,
  Heart,
  Tag,
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
    subtitle: 'Your one-stop destination for fresh groceries & daily essentials',
    badge: 'Fresh Daily',
    color: 'from-brand-600 to-indigo-700',
  },
  {
    title: 'Super Saver Deals This Week',
    subtitle: 'Check out special discounts across fresh produce, dairy & bakery items',
    badge: 'Special Offers',
    color: 'from-emerald-600 to-teal-700',
  },
  {
    title: 'Flexible Payment Options',
    subtitle: 'We gladly accept Cash, Visa, Mastercard, and Bank Transfers',
    badge: 'Fast Checkout',
    color: 'from-amber-600 to-orange-700',
  },
  {
    title: 'Member Loyalty Program',
    subtitle: 'Ask our cashier about signing up for exclusive member savings & rewards',
    badge: 'Save More',
    color: 'from-violet-600 to-purple-800',
  },
];

export default function CustomerDisplayPage() {
  const [cartState, setCartState] = useState<DisplayCartState | null>(null);
  const [paymentState, setPaymentState] = useState<DisplayPaymentState | null>(null);
  const [completedSale, setCompletedSale] = useState<DisplaySaleComplete | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [promoIndex, setPromoIndex] = useState(0);

  // Clock timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Promo carousel timer in Idle mode
  useEffect(() => {
    const timer = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % IDLE_PROMOS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Subscribe to Customer Display Broadcasts & SignalR
  useEffect(() => {
    const unsubscribe = customerDisplayService.subscribe('default-register', (msg: CustomerDisplayMessage) => {
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
          // Return to idle screen after 8 seconds
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
    });

    return () => unsubscribe();
  }, []);

  const hasItems = cartState && cartState.items.length > 0;
  const activePromo = IDLE_PROMOS[promoIndex];

  return (
    <div className="h-screen w-screen bg-slate-900 text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* Top Header Bar */}
      <header className="h-20 px-8 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3.5">
          <img src={logo} alt={shopInfo.name} className="w-12 h-12 rounded-xl object-contain bg-white/5 p-1" />
          <div>
            <h1 className="text-xl font-black tracking-wide text-white flex items-center gap-2">
              <span>{shopInfo.name}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Customer View
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              {cartState?.cashierName ? `Cashier: ${cartState.cashierName}` : 'Express Checkout Lane'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm text-slate-400">
          <div className="flex items-center gap-2 bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-800">
            <Wifi size={14} className="text-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Register Online</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-base text-slate-200">
            <Clock size={16} className="text-slate-400" />
            <span>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 overflow-hidden p-6 flex">
        {/* State 1: Completed Sale Screen */}
        {completedSale ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 rounded-3xl border border-emerald-500/30 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mb-6 shadow-2xl shadow-emerald-500/30">
              <CheckCircle2 size={56} />
            </div>

            <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-1">
              Payment Completed
            </span>
            <h2 className="text-4xl font-black text-white mb-2">Thank You for Shopping!</h2>
            <p className="text-slate-400 text-base mb-6 font-mono">Invoice #{completedSale.invoiceNumber}</p>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-3 mb-6 shadow-xl">
              <div className="flex justify-between text-base">
                <span className="text-slate-400">Total Paid:</span>
                <span className="font-bold text-white font-mono">Rs. {completedSale.amountPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-black border-t border-slate-800 pt-3">
                <span className="text-slate-300">Change Return:</span>
                <span className="text-emerald-400 font-mono">Rs. {completedSale.change.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-sm text-slate-400 flex items-center gap-1.5">
              <Heart size={16} className="text-rose-500 fill-rose-500" />
              <span>Please collect your receipt and items. Have a wonderful day!</span>
            </p>
          </div>
        ) : hasItems ? (
          /* State 2: Active Cart View */
          <div className="w-full h-full grid grid-cols-12 gap-6 overflow-hidden">
            {/* Left 7 Columns: Scanned Items List */}
            <div className="col-span-7 flex flex-col bg-slate-950/60 rounded-3xl border border-slate-800/80 overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag size={20} className="text-brand-400" />
                  <span className="font-bold text-base text-white">Your Cart</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {cartState.items.reduce((sum, i) => sum + i.quantity, 0)} items
                  </span>
                </div>

                {cartState.lastScannedItem && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 animate-in fade-in slide-in-from-right-2 duration-150">
                    <Sparkles size={13} />
                    <span className="truncate max-w-[200px]">Scanned: {cartState.lastScannedItem.name}</span>
                  </div>
                )}
              </div>

              {/* Items scroll area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {cartState.items.map((item, index) => {
                  const isLastScanned = cartState.lastScannedItem?.name === item.name;
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                        isLastScanned
                          ? 'bg-brand-600/15 border-brand-500/50 ring-1 ring-brand-500/30 shadow-lg'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 text-xs font-mono font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="text-base font-bold text-white">{item.name}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Rs. {item.unitPrice.toFixed(2)} × {item.quantity}
                            {item.discount > 0 && (
                              <span className="ml-2 text-emerald-400 font-semibold">
                                (-Rs. {item.discount.toFixed(2)} off)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-black text-white font-mono block">
                          Rs. {item.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 5 Columns: Big Bill Totals & Payment Status */}
            <div className="col-span-5 flex flex-col justify-between space-y-4">
              <div className="bg-slate-950/60 rounded-3xl border border-slate-800/80 p-6 shadow-xl flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">
                    Invoice Breakdown
                  </span>

                  <div className="space-y-3.5 text-base">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal</span>
                      <span className="font-mono text-slate-200">Rs. {cartState.subtotal.toFixed(2)}</span>
                    </div>

                    {cartState.totalDiscount > 0 && (
                      <div className="flex justify-between text-emerald-400 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Tag size={16} />
                          <span>Savings & Discounts</span>
                        </span>
                        <span className="font-mono">-Rs. {cartState.totalDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    {cartState.totalTax > 0 && (
                      <div className="flex justify-between text-slate-400">
                        <span>Tax</span>
                        <span className="font-mono text-slate-200">Rs. {cartState.totalTax.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Big Grand Total Callout */}
                <div className="pt-6 border-t border-slate-800">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    Total Amount Due
                  </span>
                  <div className="text-5xl font-black text-brand-400 font-mono tracking-tight">
                    Rs. {cartState.grandTotal.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Payment Status Card (if cashier entered amount) */}
              {paymentState && paymentState.amountPaid > 0 && (
                <div className="bg-slate-950/80 rounded-3xl border border-brand-500/30 p-5 shadow-xl space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span className="flex items-center gap-1.5">
                      {paymentState.paymentMethod === 'Cash' ? <Banknote size={16} /> : <CreditCard size={16} />}
                      <span>Tender ({paymentState.paymentMethod}):</span>
                    </span>
                    <span className="font-mono font-bold text-white text-base">
                      Rs. {paymentState.amountPaid.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-base font-bold text-slate-200">Change Return:</span>
                    <span
                      className={`text-2xl font-black font-mono ${
                        paymentState.change >= 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      Rs. {Math.max(0, paymentState.change).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* State 3: Idle / Promotional Screen Saver */
          <div className="w-full h-full flex flex-col justify-between p-8 rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-2xl relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex justify-between items-start relative z-10">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
                  Ready for Next Customer
                </span>
                <h2 className="text-4xl font-black text-white mt-3">Welcome to Nova Mart</h2>
                <p className="text-slate-400 text-sm mt-1 max-w-md">
                  Please place your items on the counter. Our cashier is ready to assist you.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                <Receipt size={24} className="text-brand-400" />
                <div className="text-xs text-slate-300">
                  <p className="font-bold">Digital & Printed Receipts</p>
                  <p className="text-slate-400">Scannable barcode included</p>
                </div>
              </div>
            </div>

            {/* Rotating Promotional Hero Card */}
            <div
              className={`p-10 rounded-3xl bg-gradient-to-r ${activePromo.color} text-white shadow-2xl relative overflow-hidden transition-all duration-700 transform`}
            >
              <div className="relative z-10 max-w-xl space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full inline-block backdrop-blur-xs">
                  {activePromo.badge}
                </span>
                <h3 className="text-3xl font-black">{activePromo.title}</h3>
                <p className="text-white/80 text-base leading-relaxed">{activePromo.subtitle}</p>
              </div>
            </div>

            {/* Footer marquee / store acceptance info */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 relative z-10">
              <div className="flex items-center gap-6">
                <span>Accepted Payments:</span>
                <span className="flex items-center gap-1 font-semibold text-slate-300">
                  <Banknote size={15} className="text-emerald-400" /> Cash
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-300">
                  <CreditCard size={15} className="text-blue-400" /> Credit / Debit Cards
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-300">
                  <Receipt size={15} className="text-amber-400" /> Bank Transfer
                </span>
              </div>

              <span>Thank you for choosing Nova Mart</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
