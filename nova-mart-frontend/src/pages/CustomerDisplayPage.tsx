import { useState, useEffect, useRef } from 'react';
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
  Scale,
  Award,
  QrCode,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  BadgePercent,
  Sparkle,
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

// Promotional showcase carousel items with authentic store products
const PROMO_DEALS = [
  {
    id: 1,
    title: 'Anchor Full Cream Milk Powder',
    size: '400g Pack',
    category: 'Dairy & Essentials',
    badge: 'DAILY ESSENTIAL',
    badgeStyle: 'bg-amber-500 text-white',
    price: 1180.0,
    originalPrice: 1240.0,
    savingsText: 'Save Rs. 60.00 Today',
    description: '100% Pure New Zealand cow’s milk enriched with Calcium, Iron, Protein & essential vitamins.',
    imageUrl: '/products/anchor-milk-powder.png',
    accentGradient: 'from-amber-500/15 via-orange-500/10 to-transparent',
    borderColor: 'border-amber-200',
  },
  {
    id: 2,
    title: 'Dilmah Pure Ceylon Black Tea',
    size: '200g Premium Pack',
    category: 'Ceylon Beverages',
    badge: 'CEYLON ARTISAN',
    badgeStyle: 'bg-emerald-600 text-white',
    price: 580.0,
    originalPrice: 620.0,
    savingsText: 'Member Special Deal',
    description: 'Handpicked ethical single-origin black tea. Unrivaled freshness, deep color and distinctive aroma.',
    imageUrl: '/products/dilmah-ceylon-tea.png',
    accentGradient: 'from-emerald-500/15 via-teal-500/10 to-transparent',
    borderColor: 'border-emerald-200',
  },
  {
    id: 3,
    title: 'Fresh Nuwara Eliya Potatoes',
    size: 'Per Kilogram (kg)',
    category: 'Fresh Farm Produce',
    badge: 'HARVEST FRESH',
    badgeStyle: 'bg-lime-600 text-white',
    price: 380.0,
    originalPrice: 420.0,
    savingsText: 'Farm Direct Savings',
    description: 'Freshly harvested from high-altitude hill country soil. Washed, firm and ready for hearty cooking.',
    imageUrl: '/products/nuwareliya-potatoes.jpg',
    accentGradient: 'from-yellow-500/15 via-amber-500/10 to-transparent',
    borderColor: 'border-yellow-200',
  },
  {
    id: 4,
    title: 'Munchee Real Chocolate Puff',
    size: '200g Family Pack',
    category: 'Biscuits & Snacks',
    badge: 'FAMILY FAVORITE',
    badgeStyle: 'bg-rose-600 text-white',
    price: 240.0,
    originalPrice: 270.0,
    savingsText: 'Tea-Time Special',
    description: 'Crispy golden biscuits generously filled with smooth, decadent cocoa cream. Kids love it!',
    imageUrl: '/products/munchee-chocolate-puff-real.png',
    accentGradient: 'from-rose-500/15 via-pink-500/10 to-transparent',
    borderColor: 'border-rose-200',
  },
  {
    id: 5,
    title: 'Elephant House Ginger Beer (EGB)',
    size: '400ml Glass Bottle',
    category: 'Chilled Soft Drinks',
    badge: 'SINCE 1896',
    badgeStyle: 'bg-orange-600 text-white',
    price: 180.0,
    originalPrice: 200.0,
    savingsText: 'Ice Cold Refreshment',
    description: 'Brewed with 100% natural ginger extract for the signature spicy kick of genuine Sri Lankan heritage.',
    imageUrl: '/products/elephant-house-egb.jpg',
    accentGradient: 'from-orange-500/15 via-amber-500/10 to-transparent',
    borderColor: 'border-orange-200',
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
  const [carouselProgress, setCarouselProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const cartListRef = useRef<HTMLDivElement>(null);

  // Live real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Idle promo carousel with smooth progress bar
  useEffect(() => {
    if (cartState && cartState.items.length > 0) return;
    if (completedSale) return;

    setCarouselProgress(0);
    const intervalTime = 5500;
    const stepTime = 100;
    let elapsed = 0;

    const progressTimer = setInterval(() => {
      elapsed += stepTime;
      setCarouselProgress(Math.min(100, (elapsed / intervalTime) * 100));
      if (elapsed >= intervalTime) {
        elapsed = 0;
        setCarouselProgress(0);
        setPromoIndex((prev) => (prev + 1) % PROMO_DEALS.length);
      }
    }, stepTime);

    return () => clearInterval(progressTimer);
  }, [cartState, completedSale, promoIndex]);

  // Auto-scroll cart to bottom on new scanned items
  useEffect(() => {
    if (cartListRef.current) {
      cartListRef.current.scrollTop = cartListRef.current.scrollHeight;
    }
  }, [cartState?.items.length, cartState?.lastScannedItem]);

  // Fullscreen state tracker
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

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
          }, 8500);
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
  const currentPromo = PROMO_DEALS[promoIndex];
  const totalItemCount = cartState ? cartState.items.reduce((sum, i) => sum + i.quantity, 0) : 0;

  return (
    <div className="h-screen w-screen bg-[#F8F9FA] text-ink-900 font-sans flex flex-col overflow-hidden select-none">
      {/* =========================================================================
          TOP HEADER BAR — Crisp, Premium Retail Dual-Screen Navbar
          ========================================================================= */}
      <header className="h-20 px-8 bg-card border-b border-line flex items-center justify-between shrink-0 shadow-xs z-10">
        {/* Brand identity */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={logo}
              alt={shopInfo.name}
              className="w-13 h-13 rounded-2xl object-contain border border-line p-1 bg-white shadow-2xs"
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold tracking-tight text-ink-900">{shopInfo.name}</h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-500 text-white uppercase tracking-wider shadow-2xs">
                Lane 01 · Express
              </span>
            </div>
            <p className="text-xs text-ink-500 mt-0.5 flex items-center gap-1.5 font-medium">
              <span>{cartState?.cashierName ? `Serving Cashier: ${cartState.cashierName}` : shopInfo.address}</span>
            </p>
          </div>
        </div>

        {/* Status, Time & Fullscreen Controls */}
        <div className="flex items-center gap-3.5 text-xs font-semibold">
          {/* Live System Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[11px] font-bold uppercase tracking-wide">Live Register Sync</span>
          </div>

          {/* Clock */}
          <div className="flex items-center gap-2.5 font-mono text-sm text-ink-800 px-4 py-2 rounded-xl bg-surface border border-line shadow-2xs">
            <Clock size={16} className="text-brand-600" />
            <span className="font-bold tracking-tight">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-ink-400 font-normal">|</span>
            <span className="text-ink-600 font-sans text-xs font-medium">
              {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-2.5 rounded-xl bg-surface hover:bg-ink-100 text-ink-600 hover:text-ink-900 border border-line transition-colors cursor-pointer shadow-2xs"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* =========================================================================
          MAIN CONTENT AREA (3 DYNAMIC STATES)
          ========================================================================= */}
      <main className="flex-1 overflow-hidden p-6 flex flex-col">
        {/* =====================================================================
            STATE 1: SALE COMPLETE / THANK YOU SCREEN
            ===================================================================== */}
        {completedSale ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-card rounded-3xl border border-line shadow-sm animate-in fade-in zoom-in-95 duration-200">
            {/* Celebration Icon */}
            <div className="relative mb-4">
              <div className="w-22 h-22 rounded-full bg-emerald-50 border-3 border-emerald-500 flex items-center justify-center text-emerald-600 shadow-md">
                <CheckCircle2 size={52} className="animate-in zoom-in duration-300" />
              </div>
              <Sparkles size={24} className="text-amber-500 absolute -top-1 -right-1 animate-bounce" />
            </div>

            <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest mb-1 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200">
              Payment Successful & Verified
            </span>
            <h2 className="text-3xl lg:text-4xl font-black text-ink-900 mt-2 text-center">
              Thank You for Shopping at Nova Mart!
            </h2>
            <p className="text-ink-500 text-sm mt-1 mb-6 font-medium">
              We hope you enjoyed your shopping experience today. Please collect your items.
            </p>

            {/* Boarding-Pass / Supermarket Receipt Card */}
            <div className="bg-surface border border-line rounded-3xl p-6 w-full max-w-lg shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-line text-xs">
                <div>
                  <span className="text-ink-500 block">Official Invoice No:</span>
                  <span className="font-mono font-bold text-ink-900 text-sm">{completedSale.invoiceNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-ink-500 block">Items Purchased:</span>
                  <span className="font-bold text-ink-900 text-sm">{completedSale.itemsCount} Items</span>
                </div>
              </div>

              {/* Amount Paid & Change Returned */}
              <div className="grid grid-cols-2 gap-4 py-2">
                <div className="p-4 rounded-2xl bg-card border border-line shadow-2xs">
                  <span className="text-xs font-bold text-ink-500 uppercase tracking-wider block">Total Paid</span>
                  <span className="text-xl font-black text-ink-900 font-mono mt-1 block">
                    Rs. {completedSale.amountPaid.toFixed(2)}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-2xs">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Change Returned</span>
                  <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
                    Rs. {completedSale.change.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Loyalty Points Banner */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-900 text-xs">
                <Award size={20} className="text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold block">Nova Club Points Credited!</span>
                  <span className="text-amber-700">
                    Earned +{Math.max(1, Math.floor(completedSale.grandTotal / 100))} reward points on this purchase.
                  </span>
                </div>
              </div>

              {/* Simulated Barcode */}
              <div className="pt-2 text-center">
                <div className="inline-flex items-center gap-0.5 h-10 px-4 bg-white border border-line rounded-lg">
                  {[4, 2, 6, 2, 3, 5, 2, 4, 3, 6, 2, 4, 3, 5, 2, 4, 6, 3, 2, 5, 4, 2, 3, 6, 4].map((w, idx) => (
                    <div
                      key={idx}
                      className="h-7 bg-ink-900"
                      style={{ width: `${w * 1.5}px`, marginRight: idx % 4 === 0 ? '3px' : '1px' }}
                    />
                  ))}
                </div>
                <p className="text-[10px] font-mono text-ink-400 mt-1 tracking-widest">{completedSale.invoiceNumber}</p>
              </div>
            </div>

            <p className="text-xs text-ink-500 flex items-center gap-1.5 font-medium mt-6">
              <Heart size={14} className="text-brand-600 fill-brand-600" />
              <span>Your paper receipt is being printed. Have a wonderful day ahead!</span>
            </p>
          </div>
        ) : hasItems ? (
          /* =====================================================================
              STATE 2: ACTIVE CART VIEW (CUSTOMER CHECKOUT MODE)
              ===================================================================== */
          <div className="w-full h-full flex flex-col gap-4 overflow-hidden">
            {/* Top Spotlight: Last Scanned Item Banner */}
            {cartState.lastScannedItem && (
              <div className="bg-card rounded-2xl border-2 border-brand-500/30 p-3.5 shadow-xs flex items-center justify-between shrink-0 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-4">
                  {/* Item Image */}
                  <div className="w-16 h-16 rounded-xl border border-line bg-surface p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                    {cartState.lastScannedItem.imageUrl ? (
                      <img
                        src={cartState.lastScannedItem.imageUrl}
                        alt={cartState.lastScannedItem.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <ShoppingBag size={24} className="text-brand-600" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                        <Sparkles size={11} className="text-emerald-600" />
                        Just Scanned
                      </span>
                      {cartState.lastScannedItem.isWeighable && (
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
                          <Scale size={11} />
                          Weighed Produce
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-ink-900 mt-0.5 truncate max-w-lg">
                      {cartState.lastScannedItem.name}
                    </h3>
                    <p className="text-xs text-ink-500 font-mono mt-0.5">
                      Rs. {cartState.lastScannedItem.unitPrice.toFixed(2)} ×{' '}
                      <span className="font-bold text-ink-800">
                        {Number.isInteger(cartState.lastScannedItem.quantity)
                          ? cartState.lastScannedItem.quantity
                          : cartState.lastScannedItem.quantity.toFixed(3)}
                        {cartState.lastScannedItem.unitOfMeasure && cartState.lastScannedItem.unitOfMeasure !== 'pcs'
                          ? ` ${cartState.lastScannedItem.unitOfMeasure}`
                          : ' pcs'}
                      </span>
                      {cartState.lastScannedItem.discount > 0 && (
                        <span className="ml-2 text-emerald-600 font-semibold font-sans">
                          (Saved Rs. {cartState.lastScannedItem.discount.toFixed(2)})
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-right pr-2">
                  <span className="text-xs font-bold text-ink-500 uppercase tracking-wider block">Item Total</span>
                  <span className="text-2xl font-black text-ink-900 font-mono">
                    Rs. {cartState.lastScannedItem.total.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Split Screen: Left (Cart Items Table) / Right (Totals & Payment) */}
            <div className="flex-1 grid grid-cols-12 gap-5 overflow-hidden">
              {/* Left 7 Columns: Items List */}
              <div className="col-span-7 flex flex-col bg-card rounded-3xl border border-line shadow-xs overflow-hidden">
                {/* Header */}
                <div className="px-6 py-3.5 border-b border-line flex items-center justify-between bg-surface/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold border border-brand-200 shadow-2xs">
                      <ShoppingBag size={17} />
                    </div>
                    <div>
                      <span className="font-extrabold text-sm text-ink-900 block leading-tight">Your Cart Items</span>
                      <span className="text-[11px] text-ink-500 font-medium">Scanned items verified with live database</span>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-card border border-line text-ink-700 shadow-2xs">
                    {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Items Scrollable List */}
                <div ref={cartListRef} className="flex-1 overflow-y-auto p-4 space-y-2.5">
                  {cartState.items.map((item, index) => {
                    const isLastScanned = cartState.lastScannedItem?.name === item.name;
                    return (
                      <div
                        key={index}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                          isLastScanned
                            ? 'bg-brand-50/60 border-brand-400 ring-2 ring-brand-400/20 shadow-xs'
                            : 'bg-surface border-line hover:border-ink-300'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-card border border-line text-ink-600 text-[11px] font-mono font-bold flex items-center justify-center shrink-0 shadow-2xs">
                            {index + 1}
                          </span>

                          {/* Product Image Thumbnail */}
                          <div className="w-12 h-12 rounded-xl bg-card border border-line p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <ShoppingBag size={20} className="text-ink-400" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-ink-900 truncate">{item.name}</h4>
                            <p className="text-xs text-ink-500 font-mono mt-0.5">
                              Rs. {item.unitPrice.toFixed(2)} ×{' '}
                              <span className="font-semibold text-ink-800">
                                {Number.isInteger(item.quantity) ? item.quantity : item.quantity.toFixed(3)}
                                {item.unitOfMeasure && item.unitOfMeasure !== 'pcs' ? ` ${item.unitOfMeasure}` : ' pcs'}
                              </span>
                              {item.discount > 0 && (
                                <span className="ml-2 text-emerald-600 font-semibold font-sans">
                                  (-Rs. {item.discount.toFixed(2)})
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-3">
                          <span className="text-base font-extrabold text-ink-900 font-mono">
                            Rs. {item.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer bar */}
                <div className="px-5 py-2.5 bg-surface border-t border-line text-[11px] text-ink-500 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>Weights & barcodes verified by NovaMart scale standards</span>
                  </span>
                  <span className="font-mono text-ink-400">Currency: LKR</span>
                </div>
              </div>

              {/* Right 5 Columns: Billing Summary & Payment Station */}
              <div className="col-span-5 flex flex-col gap-4 overflow-hidden">
                {/* Summary Totals Card */}
                <div className="bg-card rounded-3xl border border-line p-5 shadow-xs space-y-3.5">
                  <span className="text-xs font-extrabold text-ink-500 uppercase tracking-wider block">
                    Invoice Summary
                  </span>

                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between text-ink-600">
                      <span>Subtotal</span>
                      <span className="font-mono text-ink-900 font-bold">Rs. {cartState.subtotal.toFixed(2)}</span>
                    </div>

                    {cartState.totalDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                        <span className="flex items-center gap-1.5">
                          <Tag size={15} />
                          <span>Savings & Discounts</span>
                        </span>
                        <span className="font-mono">-Rs. {cartState.totalDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    {cartState.totalTax > 0 && (
                      <div className="flex justify-between text-ink-600">
                        <span>Tax / VAT</span>
                        <span className="font-mono text-ink-900">Rs. {cartState.totalTax.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Giant Total Payable Card */}
                <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-black rounded-3xl p-6 text-white shadow-md border border-neutral-800 flex flex-col justify-between shrink-0">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest block">
                      Total Amount Due
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/40">
                      Payable Now
                    </span>
                  </div>

                  <div className="my-3">
                    <div className="text-4xl lg:text-5xl font-black text-brand-400 font-mono tracking-tight">
                      Rs. {cartState.grandTotal.toFixed(2)}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <Sparkle size={13} className="text-amber-400" />
                      <span>NovaPoints Reward:</span>
                    </span>
                    <span className="font-bold text-amber-300 font-mono">
                      +{Math.max(1, Math.floor(cartState.grandTotal / 100))} pts
                    </span>
                  </div>
                </div>

                {/* Payment Tender or Payment Methods Box */}
                {paymentState && paymentState.amountPaid > 0 ? (
                  <div className="bg-card rounded-3xl border-2 border-emerald-500/40 p-5 shadow-xs space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <div className="flex items-center justify-between text-xs text-ink-600">
                      <span className="flex items-center gap-1.5 font-bold">
                        {paymentState.paymentMethod === 'Cash' ? (
                          <Banknote size={16} className="text-emerald-600" />
                        ) : (
                          <CreditCard size={16} className="text-brand-600" />
                        )}
                        <span>Tender Received ({paymentState.paymentMethod}):</span>
                      </span>
                      <span className="font-mono font-bold text-ink-900 text-sm">
                        Rs. {paymentState.amountPaid.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-line">
                      <span className="text-sm font-extrabold text-ink-900">Change Due:</span>
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
                  <div className="bg-card rounded-3xl border border-line p-4 text-xs text-ink-600 flex-1 flex flex-col justify-center space-y-2">
                    <span className="font-bold text-ink-900 block">Accepted Payment Methods:</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-surface border border-line text-ink-800 font-semibold justify-center">
                        <Banknote size={14} className="text-emerald-600" />
                        <span>Cash</span>
                      </div>
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-surface border border-line text-ink-800 font-semibold justify-center">
                        <CreditCard size={14} className="text-brand-600" />
                        <span>Cards</span>
                      </div>
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-surface border border-line text-ink-800 font-semibold justify-center">
                        <QrCode size={14} className="text-blue-600" />
                        <span>LankaQR</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-ink-500 pt-1">
                      Member? Mention your phone number before paying to redeem points!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* =====================================================================
              STATE 3: IDLE / DIGITAL SUPERMARKET SIGNAGE CAROUSEL
              ===================================================================== */
          <div className="w-full h-full flex flex-col justify-between gap-5 overflow-hidden">
            {/* Welcoming Top Hero Banner */}
            <div className="px-6 py-4 rounded-3xl bg-card border border-line flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-200 shadow-2xs">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-ink-900 tracking-tight">
                    Welcome to Nova Mart Supermarket
                  </h2>
                  <p className="text-xs text-ink-500">
                    Please place your shopping items on the checkout counter · Our cashier is ready to assist you.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Ready for Next Customer
                </span>
              </div>
            </div>

            {/* Split Content: Left (Featured Products Carousel) / Right (Loyalty & Services) */}
            <div className="flex-1 grid grid-cols-12 gap-5 overflow-hidden">
              {/* Left 7 Columns: Featured Product Promotional Showcase */}
              <div className="col-span-7 flex flex-col justify-between bg-card rounded-3xl border border-line p-6 shadow-xs relative overflow-hidden">
                {/* Carousel Top Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-surface">
                  <div
                    className="h-full bg-brand-500 transition-all duration-100 ease-linear"
                    style={{ width: `${carouselProgress}%` }}
                  />
                </div>

                {/* Header with Deal Badge & Category */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full ${currentPromo.badgeStyle}`}>
                      {currentPromo.badge}
                    </span>
                    <span className="text-xs font-semibold text-ink-500 bg-surface px-2.5 py-1 rounded-full border border-line">
                      {currentPromo.category}
                    </span>
                  </div>

                  {/* Manual Arrow Controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        setPromoIndex((prev) => (prev - 1 + PROMO_DEALS.length) % PROMO_DEALS.length)
                      }
                      className="p-1.5 rounded-lg bg-surface hover:bg-ink-100 border border-line text-ink-700 cursor-pointer shadow-2xs transition-colors"
                      title="Previous Deal"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setPromoIndex((prev) => (prev + 1) % PROMO_DEALS.length)}
                      className="p-1.5 rounded-lg bg-surface hover:bg-ink-100 border border-line text-ink-700 cursor-pointer shadow-2xs transition-colors"
                      title="Next Deal"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Hero Product Body */}
                <div className="grid grid-cols-12 gap-6 items-center my-auto py-2">
                  {/* Left Info */}
                  <div className="col-span-7 space-y-3">
                    <h3 className="text-2xl lg:text-3xl font-black text-ink-900 tracking-tight leading-snug">
                      {currentPromo.title}
                    </h3>
                    <p className="text-xs text-ink-500 leading-relaxed max-w-sm">
                      {currentPromo.description}
                    </p>

                    {/* Price Tag Box */}
                    <div className="pt-2 flex items-baseline gap-3">
                      <span className="text-3xl font-black text-brand-600 font-mono">
                        Rs. {currentPromo.price.toFixed(2)}
                      </span>
                      {currentPromo.originalPrice && (
                        <span className="text-base text-ink-400 line-through font-mono">
                          Rs. {currentPromo.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                      <BadgePercent size={14} className="text-emerald-600" />
                      <span>{currentPromo.savingsText}</span>
                    </div>
                  </div>

                  {/* Right Image Showcase */}
                  <div className="col-span-5 flex items-center justify-center">
                    <div className="relative group">
                      <div className="w-48 h-48 rounded-3xl bg-surface border border-line p-3 flex items-center justify-center shadow-md">
                        <img
                          src={currentPromo.imageUrl}
                          alt={currentPromo.title}
                          className="max-w-full max-h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <span className="absolute -bottom-2 -right-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-ink-900 text-white shadow-sm font-mono">
                        {currentPromo.size}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Carousel Pagination Dots */}
                <div className="flex items-center justify-between pt-3 border-t border-line">
                  <div className="flex items-center gap-2">
                    {PROMO_DEALS.map((deal, idx) => (
                      <button
                        key={deal.id}
                        onClick={() => setPromoIndex(idx)}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          idx === promoIndex ? 'w-8 bg-brand-500' : 'w-2 bg-ink-300 hover:bg-ink-400'
                        }`}
                        title={deal.title}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-ink-500 font-medium">Weekly Supermarket Specials</span>
                </div>
              </div>

              {/* Right 5 Columns: NovaMart Club Loyalty Card & Guarantees */}
              <div className="col-span-5 flex flex-col justify-between gap-4">
                {/* Nova Club Loyalty Card */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-neutral-900 via-zinc-900 to-black text-white border border-neutral-800 shadow-md flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <Award size={20} className="text-amber-400" />
                      <span className="font-extrabold text-sm tracking-wider uppercase text-amber-300">
                        Nova Club Rewards
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/20">
                      MEMBER PERKS
                    </span>
                  </div>

                  <div className="my-3 space-y-1 relative z-10">
                    <p className="text-base font-bold text-white">Earn 1 Point on every Rs. 100 spent</p>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Instant cash deductions on your bill. Just give your mobile number to our cashier to collect or redeem points today!
                    </p>
                  </div>

                  <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400 relative z-10">
                    <span>1 Point = Rs. 1.00 Discount</span>
                    <span className="text-amber-400 font-bold">Free Instant Enrollment</span>
                  </div>
                </div>

                {/* Fresh Produce & Quality Guarantee */}
                <div className="p-4 rounded-3xl bg-card border border-line shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-ink-900 font-bold text-sm">
                    <Scale size={18} className="text-emerald-600" />
                    <span>Certified Trade Precision Scales</span>
                  </div>
                  <p className="text-xs text-ink-500 leading-relaxed">
                    All fresh fruits, vegetables, and seafood are weighed digitally with certified supermarket accuracy.
                  </p>
                </div>

                {/* Digital Receipts & Environment */}
                <div className="p-4 rounded-3xl bg-card border border-line shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-200 shrink-0">
                    <Receipt size={20} />
                  </div>
                  <div className="text-xs text-ink-700">
                    <p className="font-bold text-ink-900">Official Digital & Printed Invoices</p>
                    <p className="text-ink-500">Every receipt carries a verified digital audit barcode</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Accepted Payments Banner */}
            <div className="px-6 py-3 rounded-2xl bg-card border border-line flex items-center justify-between text-xs text-ink-500 shadow-xs">
              <div className="flex items-center gap-5">
                <span className="font-bold text-ink-800">Accepted At Counter:</span>
                <span className="flex items-center gap-1.5 font-semibold text-ink-900 bg-surface px-2.5 py-1 rounded-lg border border-line">
                  <Banknote size={14} className="text-emerald-600" /> Cash (LKR)
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-ink-900 bg-surface px-2.5 py-1 rounded-lg border border-line">
                  <CreditCard size={14} className="text-brand-600" /> Visa & Mastercard
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-ink-900 bg-surface px-2.5 py-1 rounded-lg border border-line">
                  <QrCode size={14} className="text-blue-600" /> LankaQR Instant Pay
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-ink-600 font-medium">
                <Heart size={14} className="text-brand-600 fill-brand-600" />
                <span>Thank you for choosing {shopInfo.name}</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
