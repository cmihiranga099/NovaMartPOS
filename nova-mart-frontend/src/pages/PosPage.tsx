import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Search,
  CheckCircle2,
  Tag,
  X,
  Delete,
  Percent,
  Keyboard,
  Barcode,
  ShoppingBag,
  PauseCircle,
} from 'lucide-react';
import { productService } from '../services/productService';
import { customerService } from '../services/customerService';
import { saleService } from '../services/saleService';
import { promotionService } from '../services/promotionService';
import { lookupService } from '../services/lookupService';
import CartItemRow, { type CartLine } from '../features/pos/CartItem';
import type { SaleResult } from '../types/sale';
import Receipt from '../features/pos/Receipt';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../store/AuthContext';
import ManagerOverrideModal from '../components/ManagerOverrideModal';
import KeyboardShortcutsModal from '../features/pos/KeyboardShortcutsModal';
import HeldCartsModal, { type HeldCart } from '../features/pos/HeldCartsModal';
import VirtualKeyboard from '../components/VirtualKeyboard';
import { usePosKeyboard, playScannerBeep } from '../features/pos/usePosKeyboard';

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
const HELD_CARTS_STORAGE_KEY = 'novamart_held_carts';

type KeyboardTarget = 'search' | 'promo' | 'discount' | 'amountPaid' | null;

export default function PosPage() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const isCashier = hasRole('Cashier');
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
  const [showOverridePrompt, setShowOverridePrompt] = useState(false);
  const [showDiscountEntry, setShowDiscountEntry] = useState(false);
  const [discountInput, setDiscountInput] = useState('');
  const [discountApprovedPin, setDiscountApprovedPin] = useState<string | null>(null);
  const [discountApprovedBy, setDiscountApprovedBy] = useState<string | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showHeldCartsModal, setShowHeldCartsModal] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const [activeKeyboardTarget, setActiveKeyboardTarget] = useState<KeyboardTarget>(null);

  // Load persistent held carts from localStorage
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>(() => {
    try {
      const saved = localStorage.getItem(HELD_CARTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const customerSelectRef = useRef<HTMLSelectElement>(null);
  const promoInputRef = useRef<HTMLInputElement>(null);

  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: productService.getAll });
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: customerService.getAll });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: lookupService.getCategories });

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Sync held carts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(HELD_CARTS_STORAGE_KEY, JSON.stringify(heldCarts));
    } catch {
      // Ignore quota errors
    }
  }, [heldCarts]);

  useEffect(() => {
    if (!scanFeedback) return;
    const timer = setTimeout(() => setScanFeedback(null), 2500);
    return () => clearTimeout(timer);
  }, [scanFeedback]);

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
      setDiscountApprovedPin(null);
      setDiscountApprovedBy(null);
      setActiveKeyboardTarget(null);
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
      const trimmed = search.trim();
      const exact = activeProducts.find(
        (p) => p.barcode === trimmed || p.productCode.toLowerCase() === trimmed.toLowerCase()
      );
      if (exact) {
        if (exact.stockQuantity <= 0) {
          playScannerBeep(false);
          setError(`${t('pos.outOfStock')}: ${exact.name}`);
          return;
        }
        addToCart(exact);
        playScannerBeep(true);
        setScanFeedback(`${exact.name} (Rs. ${exact.sellingPrice.toFixed(2)})`);
        setSearch('');
        setSubmittedSearch('');
        setError(null);
        return;
      }
      setSubmittedSearch(search);
    }
  };

  const handleBarcodeScanned = (barcode: string) => {
    const trimmed = barcode.trim();
    if (!trimmed) return;
    const exact = activeProducts.find(
      (p) => p.barcode === trimmed || p.productCode.toLowerCase() === trimmed.toLowerCase()
    );
    if (exact) {
      if (exact.stockQuantity <= 0) {
        playScannerBeep(false);
        setError(`${t('pos.outOfStock')}: ${exact.name}`);
        return;
      }
      addToCart(exact);
      playScannerBeep(true);
      setScanFeedback(`${exact.name} · Rs. ${exact.sellingPrice.toFixed(2)}`);
      setError(null);
    } else {
      playScannerBeep(false);
      setError(t('pos.productNotFound', { code: trimmed }));
    }
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const increaseLastItemQty = () => {
    if (cart.length === 0) return;
    const lastItem = cart[cart.length - 1];
    updateQuantity(lastItem.productId, Math.min(lastItem.availableStock, lastItem.quantity + 1));
  };

  const decreaseLastItemQty = () => {
    if (cart.length === 0) return;
    const lastItem = cart[cart.length - 1];
    if (lastItem.quantity > 1) {
      updateQuantity(lastItem.productId, lastItem.quantity - 1);
    } else {
      removeFromCart(lastItem.productId);
    }
  };

  const removeLastItem = () => {
    if (cart.length === 0) return;
    const lastItem = cart[cart.length - 1];
    removeFromCart(lastItem.productId);
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

  // Park / Hold current cart
  const handleHoldCart = () => {
    if (cart.length === 0) {
      setError(t('pos.cartEmptyError'));
      return;
    }

    const selectedCustomer = customers.find((c) => c.id === customerId);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newHeldCart: HeldCart = {
      id: `HC-${Date.now().toString().slice(-4)}`,
      createdAt: now.toISOString(),
      note: `Cart #${heldCarts.length + 1} (${timeStr})`,
      items: [...cart],
      customerId,
      customerName: selectedCustomer?.name,
      appliedPromo,
      discountApprovedPin,
      discountApprovedBy,
      total: grandTotal,
    };

    setHeldCarts((prev) => [newHeldCart, ...prev]);

    // Reset current active cart
    setCart([]);
    setAmountPaid('');
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError(null);
    setDiscountApprovedPin(null);
    setDiscountApprovedBy(null);
    setError(null);
    setActiveKeyboardTarget(null);

    playScannerBeep(true);
    setScanFeedback(t('pos.cartHeldSuccess', { id: newHeldCart.id }));
    searchInputRef.current?.focus();
  };

  // Resume / Recall a held cart
  const handleRecallCart = (heldCart: HeldCart, mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      // If current cart has items, park current cart first
      if (cart.length > 0) {
        const selectedCustomer = customers.find((c) => c.id === customerId);
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const currentParked: HeldCart = {
          id: `HC-${Date.now().toString().slice(-4)}`,
          createdAt: now.toISOString(),
          note: `Cart (${timeStr})`,
          items: [...cart],
          customerId,
          customerName: selectedCustomer?.name,
          appliedPromo,
          discountApprovedPin,
          discountApprovedBy,
          total: grandTotal,
        };
        setHeldCarts((prev) => [currentParked, ...prev.filter((c) => c.id !== heldCart.id)]);
      } else {
        setHeldCarts((prev) => prev.filter((c) => c.id !== heldCart.id));
      }

      setCart(heldCart.items);
      setCustomerId(heldCart.customerId);
      setAppliedPromo(heldCart.appliedPromo ?? null);
      setPromoInput(heldCart.appliedPromo?.code ?? '');
      setDiscountApprovedPin(heldCart.discountApprovedPin ?? null);
      setDiscountApprovedBy(heldCart.discountApprovedBy ?? null);
      setAmountPaid('');
      setError(null);
    } else {
      // Merge mode
      setCart((prev) => {
        const merged = [...prev];
        for (const item of heldCart.items) {
          const existingIdx = merged.findIndex((i) => i.productId === item.productId);
          if (existingIdx >= 0) {
            const newQty = Math.min(
              merged[existingIdx].availableStock,
              merged[existingIdx].quantity + item.quantity
            );
            merged[existingIdx] = { ...merged[existingIdx], quantity: newQty };
          } else {
            merged.push(item);
          }
        }
        return merged;
      });

      setHeldCarts((prev) => prev.filter((c) => c.id !== heldCart.id));
    }

    playScannerBeep(true);
    setScanFeedback(t('pos.cartRecalledSuccess'));
    searchInputRef.current?.focus();
  };

  const handleDiscardHeldCart = (id: string) => {
    setHeldCarts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleClearOrCancel = () => {
    if (showHeldCartsModal) {
      setShowHeldCartsModal(false);
    } else if (activeKeyboardTarget !== null) {
      setActiveKeyboardTarget(null);
    } else if (showShortcutsModal) {
      setShowShortcutsModal(false);
    } else if (showOverridePrompt) {
      setShowOverridePrompt(false);
    } else if (showDiscountEntry) {
      setShowDiscountEntry(false);
      setDiscountInput('');
    } else if (completedSale) {
      setCompletedSale(null);
    } else if (search.length > 0 || submittedSearch.length > 0) {
      setSearch('');
      setSubmittedSearch('');
      setError(null);
      searchInputRef.current?.focus();
    } else {
      setError(null);
      setPromoError(null);
    }
  };

  // Register POS keyboard shortcuts and hardware barcode scanner listener
  usePosKeyboard({
    onSearchFocus: () => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    },
    onCustomerFocus: () => {
      customerSelectRef.current?.focus();
    },
    onPromoFocus: () => {
      promoInputRef.current?.focus();
    },
    onDiscountOpen: () => {
      openDiscountFlow();
    },
    onSetExactAmount: () => {
      setExactAmount();
    },
    onSelectPaymentMethod: (method) => {
      setPaymentMethod(method);
    },
    onCheckout: () => {
      handleCheckout();
    },
    onClearOrCancel: handleClearOrCancel,
    onIncreaseLastItemQty: increaseLastItemQty,
    onDecreaseLastItemQty: decreaseLastItemQty,
    onRemoveLastItem: removeLastItem,
    onToggleShortcutsModal: () => {
      setShowShortcutsModal((prev) => !prev);
    },
    onHoldCart: handleHoldCart,
    onRecallCart: () => {
      setShowHeldCartsModal((prev) => !prev);
    },
    onBarcodeScanned: handleBarcodeScanned,
    isModalOpen:
      showShortcutsModal ||
      showHeldCartsModal ||
      showOverridePrompt ||
      showDiscountEntry ||
      activeKeyboardTarget !== null,
    isCompletedSaleOpen: !!completedSale,
    onNewSale: () => setCompletedSale(null),
  });

  // Manual, cart-wide discount.
  const applyManualDiscount = (amountRs: number) => {
    setCart((prev) => {
      const eligibleTotal = prev.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
      if (eligibleTotal <= 0) return prev;
      const capped = Math.min(amountRs, eligibleTotal);
      return prev.map((i) => {
        const lineSubtotal = i.unitPrice * i.quantity;
        const share = eligibleTotal > 0 ? (lineSubtotal / eligibleTotal) * capped : 0;
        return { ...i, discount: Math.min(share, lineSubtotal) };
      });
    });
  };

  const clearManualDiscount = () => {
    setCart((prev) => prev.map((i) => ({ ...i, discount: 0 })));
    setDiscountApprovedPin(null);
    setDiscountApprovedBy(null);
  };

  const openDiscountFlow = () => {
    if (isCashier) {
      setShowOverridePrompt(true);
    } else {
      setShowDiscountEntry(true);
      setActiveKeyboardTarget('discount');
    }
  };

  const handleDiscountApproved = (pin: string, approvedBy: string) => {
    setDiscountApprovedPin(pin);
    setDiscountApprovedBy(approvedBy);
    setShowOverridePrompt(false);
    setShowDiscountEntry(true);
    setActiveKeyboardTarget('discount');
  };

  const submitManualDiscount = () => {
    const amount = Number(discountInput);
    if (!amount || amount <= 0) return;
    applyManualDiscount(amount);
    setShowDiscountEntry(false);
    setDiscountInput('');
    if (activeKeyboardTarget === 'discount') setActiveKeyboardTarget(null);
  };

  const validatePromoMutation = useMutation({
    mutationFn: (code: string) => promotionService.validate(code, netAfterLineDiscounts),
    onSuccess: (res, code) => {
      if (res.valid) {
        setAppliedPromo({ code: res.code ?? code.toUpperCase(), discount: res.discountAmount });
        setPromoError(null);
        if (activeKeyboardTarget === 'promo') setActiveKeyboardTarget(null);
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
      managerOverridePin: discountApprovedPin ?? undefined,
    });
  };

  // Virtual Keyboard bindings
  const getKeyboardValue = () => {
    switch (activeKeyboardTarget) {
      case 'search': return search;
      case 'promo': return promoInput;
      case 'discount': return discountInput;
      case 'amountPaid': return amountPaid;
      default: return '';
    }
  };

  const handleKeyboardChange = (val: string) => {
    switch (activeKeyboardTarget) {
      case 'search':
        setSearch(val);
        break;
      case 'promo':
        setPromoInput(val);
        setPromoError(null);
        break;
      case 'discount':
        setDiscountInput(val);
        break;
      case 'amountPaid':
        setAmountPaid(val);
        break;
    }
  };

  const handleKeyboardEnter = () => {
    switch (activeKeyboardTarget) {
      case 'search': {
        const trimmed = search.trim();
        const exact = activeProducts.find(
          (p) => p.barcode === trimmed || p.productCode.toLowerCase() === trimmed.toLowerCase()
        );
        if (exact) {
          if (exact.stockQuantity <= 0) {
            playScannerBeep(false);
            setError(`${t('pos.outOfStock')}: ${exact.name}`);
            return;
          }
          addToCart(exact);
          playScannerBeep(true);
          setScanFeedback(`${exact.name} (Rs. ${exact.sellingPrice.toFixed(2)})`);
          setSearch('');
          setSubmittedSearch('');
          setError(null);
          return;
        }
        setSubmittedSearch(search);
        break;
      }
      case 'promo':
        handleApplyPromo();
        break;
      case 'discount':
        submitManualDiscount();
        break;
      case 'amountPaid':
        handleCheckout();
        break;
    }
  };

  const getKeyboardTitle = () => {
    switch (activeKeyboardTarget) {
      case 'search': return t('pos.scanOrSearch');
      case 'promo': return t('pos.promoCode');
      case 'discount': return t('pos.discountAmount');
      case 'amountPaid': return t('pos.amountPaid');
      default: return t('pos.touchKeyboard');
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6 h-full pb-10">
      {/* Left: category tabs + product grid */}
      <div className="col-span-2 flex flex-col min-h-0">
        {/* Search bar & Keyboard Shortcuts Button */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t('pos.scanOrSearch')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleBarcodeEnter}
              className="w-full pl-10 pr-24 py-3 border border-ink-500/20 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-brand-500 bg-card shadow-xs"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveKeyboardTarget(activeKeyboardTarget === 'search' ? null : 'search')}
                title={t('pos.openTouchKeyboard')}
                className={`p-1.5 rounded-lg border transition-colors ${
                  activeKeyboardTarget === 'search'
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-surface hover:bg-ink-500/10 border-line text-ink-600'
                }`}
              >
                <Keyboard size={15} />
              </button>
              <kbd className="px-1.5 py-0.5 text-[11px] font-mono text-ink-500 bg-surface border border-line rounded">
                F1
              </kbd>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowShortcutsModal(true)}
            title={t('pos.shortcutsHelp')}
            className="flex items-center gap-1.5 px-3.5 py-3 border border-line bg-card hover:bg-surface rounded-xl text-xs font-semibold text-ink-700 shadow-xs transition-colors shrink-0"
          >
            <Keyboard size={18} className="text-brand-600" />
            <span className="hidden sm:inline">{t('pos.shortcuts')}</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-surface border border-line rounded text-ink-600">
              ?
            </kbd>
          </button>
        </div>

        {/* Scan feedback alert banner */}
        {scanFeedback && (
          <div className="mb-3 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-1 duration-150">
            <span className="flex items-center gap-2">
              <Barcode size={16} className="text-emerald-600" />
              <span>{scanFeedback}</span>
            </span>
            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-100/70 px-1.5 py-0.5 rounded">
              Active
            </span>
          </div>
        )}

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
          <button
            onClick={() => { setActiveCategory('all'); setSearch(''); setSubmittedSearch(''); }}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-brand-600 text-white'
                : 'bg-card text-ink-700 border border-line hover:bg-surface'
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
                  : 'bg-card text-ink-700 border border-line hover:bg-surface'
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
                    className="group flex flex-col items-stretch rounded-2xl border border-line bg-card overflow-hidden text-left hover:shadow-md hover:border-brand-200 transition-all disabled:opacity-40 disabled:hover:shadow-none disabled:hover:border-line"
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
      <div className="bg-card rounded-xl border border-line shadow flex flex-col p-4 min-h-0">
        {/* Cart Header with Hold Cart / Held Carts buttons */}
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-line/60">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-lg">{t('pos.cart')}</h2>
            <span className="text-xs text-ink-500 font-mono bg-surface px-1.5 py-0.5 rounded border border-line">
              {cart.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {heldCarts.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHeldCartsModal(true)}
                title="View Held Carts (F6)"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shadow-2xs transition-all animate-pulse"
              >
                <ShoppingBag size={13} />
                <span>Held ({heldCarts.length})</span>
                <kbd className="text-[9px] font-mono bg-amber-200 px-1 rounded">F6</kbd>
              </button>
            )}

            <button
              type="button"
              onClick={handleHoldCart}
              disabled={cart.length === 0}
              title="Park / Hold current cart (F5)"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-line bg-surface hover:bg-ink-500/10 text-ink-700 disabled:opacity-40 transition-colors shadow-2xs"
            >
              <PauseCircle size={13} className="text-amber-600" />
              <span>{t('pos.holdCart')}</span>
              <kbd className="text-[9px] font-mono text-ink-500 bg-card border border-line px-1 rounded">F5</kbd>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto min-h-[80px]">
          {cart.length === 0 ? (
            <p className="text-ink-500 text-sm py-4 text-center">{t('pos.cartEmpty')}</p>
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

        {cart.length > 0 && (
          <div className="text-[11px] text-ink-500 flex items-center justify-between py-1.5 px-1 border-t border-line/60">
            <span>{cart.reduce((sum, i) => sum + i.quantity, 0)} items total</span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono text-[10px] px-1 bg-surface border border-line rounded">+</kbd>
              <kbd className="font-mono text-[10px] px-1 bg-surface border border-line rounded">-</kbd>
              <span>qty ·</span>
              <kbd className="font-mono text-[10px] px-1 bg-surface border border-line rounded">Del</kbd>
            </span>
          </div>
        )}

        <div className="border-t border-ink-500/10 pt-3 mt-1">
          {!appliedPromo ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-500" />
                <input
                  ref={promoInputRef}
                  type="text"
                  value={promoInput}
                  onChange={(e) => { setPromoInput(e.target.value); setPromoError(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyPromo(); } }}
                  placeholder={t('pos.promoCode')}
                  className="w-full pl-7 pr-16 py-1.5 border border-ink-500/20 rounded-lg text-xs uppercase"
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveKeyboardTarget(activeKeyboardTarget === 'promo' ? null : 'promo')}
                    title={t('pos.openTouchKeyboard')}
                    className={`p-1 rounded text-ink-500 hover:text-brand-600 ${
                      activeKeyboardTarget === 'promo' ? 'text-brand-600 font-bold' : ''
                    }`}
                  >
                    <Keyboard size={13} />
                  </button>
                  <kbd className="text-[9px] font-mono text-ink-500 bg-surface border border-line px-1 rounded">
                    F4
                  </kbd>
                </div>
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

          {totalDiscount === 0 ? (
            !showDiscountEntry && (
              <button
                onClick={openDiscountFlow}
                disabled={cart.length === 0}
                className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 border border-line rounded-lg text-xs font-medium text-ink-700 hover:bg-surface disabled:opacity-50"
              >
                <Percent size={13} />
                <span>{t('pos.addDiscount')}</span>
                <kbd className="text-[10px] font-mono text-ink-500 px-1 rounded bg-surface border border-line ml-1">
                  F3
                </kbd>
              </button>
            )
          ) : (
            <div className="flex items-center justify-between bg-surface px-2.5 py-1.5 rounded-lg mt-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-ink-700">
                <Percent size={13} /> {t('pos.manualDiscount')}
                {discountApprovedBy && ` · ${t('pos.approvedBy', { name: discountApprovedBy })}`}
              </span>
              <button onClick={clearManualDiscount} className="text-ink-500 hover:text-red-600">
                <X size={14} />
              </button>
            </div>
          )}

          {showDiscountEntry && (
            <div className="flex gap-2 mt-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  autoFocus
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitManualDiscount(); } }}
                  placeholder={t('pos.discountAmount')}
                  className="w-full pl-2.5 pr-8 py-1.5 border border-ink-500/20 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={() => setActiveKeyboardTarget(activeKeyboardTarget === 'discount' ? null : 'discount')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-500 hover:text-brand-600"
                >
                  <Keyboard size={13} />
                </button>
              </div>
              <button
                onClick={submitManualDiscount}
                disabled={!discountInput || Number(discountInput) <= 0}
                className="px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg text-xs font-medium hover:bg-brand-100 disabled:opacity-50"
              >
                {t('pos.apply')}
              </button>
            </div>
          )}
        </div>

        <div className="pt-3 mt-1 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-500">{t('common.subtotal')}</span>
            <span>Rs. {subtotal.toFixed(2)}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-brand-600">
              <span>{t('pos.manualDiscount')}</span>
              <span>-Rs. {totalDiscount.toFixed(2)}</span>
            </div>
          )}
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

        {/* Customer select with F2 shortcut badge */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-ink-700">{t('pos.customer')}</span>
            <kbd className="text-[10px] font-mono text-ink-500 px-1 py-0.2 rounded bg-surface border border-line">
              F2
            </kbd>
          </div>
          <select
            ref={customerSelectRef}
            value={customerId}
            onChange={(e) => setCustomerId(Number(e.target.value))}
            className="w-full px-2.5 py-2 border border-ink-500/20 rounded-lg text-sm bg-card"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Payment method selector buttons with F8/F9/F10 */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-ink-700">{t('pos.paymentMethod')}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setPaymentMethod('Cash')}
              className={`py-2 px-1.5 rounded-lg text-xs font-semibold flex flex-col items-center gap-0.5 border transition-all ${
                paymentMethod === 'Cash'
                  ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                  : 'bg-surface hover:bg-ink-500/10 border-line text-ink-700'
              }`}
            >
              <span>{t('pos.cash')}</span>
              <kbd className={`text-[10px] font-mono ${paymentMethod === 'Cash' ? 'text-white/80' : 'text-ink-500'}`}>F8</kbd>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('Card')}
              className={`py-2 px-1.5 rounded-lg text-xs font-semibold flex flex-col items-center gap-0.5 border transition-all ${
                paymentMethod === 'Card'
                  ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                  : 'bg-surface hover:bg-ink-500/10 border-line text-ink-700'
              }`}
            >
              <span>{t('pos.card')}</span>
              <kbd className={`text-[10px] font-mono ${paymentMethod === 'Card' ? 'text-white/80' : 'text-ink-500'}`}>F9</kbd>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('BankTransfer')}
              className={`py-2 px-1.5 rounded-lg text-xs font-semibold flex flex-col items-center gap-0.5 border transition-all ${
                paymentMethod === 'BankTransfer'
                  ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                  : 'bg-surface hover:bg-ink-500/10 border-line text-ink-700'
              }`}
            >
              <span className="truncate">{t('pos.bankTransfer')}</span>
              <kbd className={`text-[10px] font-mono ${paymentMethod === 'BankTransfer' ? 'text-white/80' : 'text-ink-500'}`}>F10</kbd>
            </button>
          </div>
        </div>

        {/* Amount paid + numeric keypad */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-ink-700">{t('pos.amountPaid')}</span>
            <button
              onClick={setExactAmount}
              className="text-[11px] font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>{t('pos.exact')}</span>
              <kbd className="text-[10px] font-mono text-ink-500 px-1 py-0.2 rounded bg-surface border border-line">
                F7
              </kbd>
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
          className="w-full py-3 mt-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-xs"
        >
          <span>{checkoutMutation.isPending ? t('pos.processing') : t('pos.completeSale')}</span>
          <kbd className="px-1.5 py-0.5 text-xs font-mono font-semibold bg-white/20 text-white rounded">
            F12
          </kbd>
        </button>
      </div>

      {completedSale && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-sm p-6 text-center">
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
              className="w-full py-2.5 border border-line text-ink-900 rounded-lg hover:bg-surface font-medium mb-2"
            >
              {t('pos.printReceipt')}
            </button>
            <button
              onClick={() => setCompletedSale(null)}
              className="w-full py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium flex items-center justify-center gap-2"
            >
              <span>{t('pos.newSale')}</span>
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white/20 text-white rounded">Enter</kbd>
            </button>
          </div>
        </div>
      )}

      {completedSale && <Receipt sale={completedSale} />}

      {showOverridePrompt && (
        <ManagerOverrideModal
          title={t('managerOverride.title')}
          message={t('managerOverride.message')}
          onApproved={handleDiscountApproved}
          onClose={() => setShowOverridePrompt(false)}
        />
      )}

      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      <HeldCartsModal
        isOpen={showHeldCartsModal}
        onClose={() => setShowHeldCartsModal(false)}
        heldCarts={heldCarts}
        onRecall={handleRecallCart}
        onDiscard={handleDiscardHeldCart}
        isCurrentCartEmpty={cart.length === 0}
      />

      {/* Floating Touch Keyboard Quick Toggle Button */}
      <button
        type="button"
        onClick={() => setActiveKeyboardTarget((prev) => (prev ? null : 'search'))}
        title={activeKeyboardTarget ? 'Hide touch keyboard' : 'Open touch keyboard'}
        className={`fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full font-bold text-xs shadow-xl border transition-all ${
          activeKeyboardTarget
            ? 'bg-brand-600 text-white border-brand-700 shadow-brand-500/30'
            : 'bg-card text-ink-800 border-line hover:bg-surface shadow-black/15'
        }`}
      >
        <Keyboard size={16} className={activeKeyboardTarget ? 'text-white' : 'text-brand-600'} />
        <span className="hidden sm:inline">
          {activeKeyboardTarget ? 'Hide Keyboard' : t('pos.touchKeyboard')}
        </span>
      </button>

      {/* On-screen Touchable Virtual Keyboard */}
      <VirtualKeyboard
        isOpen={activeKeyboardTarget !== null}
        onClose={() => setActiveKeyboardTarget(null)}
        value={getKeyboardValue()}
        onChange={handleKeyboardChange}
        onEnter={handleKeyboardEnter}
        title={getKeyboardTitle()}
      />
    </div>
  );
}
