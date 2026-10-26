import { useEffect, useRef } from 'react';

export interface UsePosKeyboardOptions {
  onSearchFocus: () => void;
  onCustomerFocus: () => void;
  onPromoFocus: () => void;
  onDiscountOpen: () => void;
  onSetExactAmount: () => void;
  onSelectPaymentMethod: (method: string) => void;
  onSplitPaymentOpen?: () => void;
  onCheckout: () => void;
  onClearOrCancel: () => void;
  onIncreaseLastItemQty?: () => void;
  onDecreaseLastItemQty?: () => void;
  onRemoveLastItem?: () => void;
  onToggleShortcutsModal: () => void;
  onHoldCart?: () => void;
  onRecallCart?: () => void;
  onBarcodeScanned: (barcode: string) => void;
  isModalOpen?: boolean;
  isCompletedSaleOpen?: boolean;
  onNewSale?: () => void;
}

export function playScannerBeep(success = true) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (success) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, ctx.currentTime); // High pitch supermarket beep
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    }
  } catch {
    // Ignore audio policy errors before first user gesture
  }
}

export function usePosKeyboard({
  onSearchFocus,
  onCustomerFocus,
  onPromoFocus,
  onDiscountOpen,
  onSetExactAmount,
  onSelectPaymentMethod,
  onSplitPaymentOpen,
  onCheckout,
  onClearOrCancel,
  onIncreaseLastItemQty,
  onDecreaseLastItemQty,
  onRemoveLastItem,
  onToggleShortcutsModal,
  onHoldCart,
  onRecallCart,
  onBarcodeScanned,
  isModalOpen = false,
  isCompletedSaleOpen = false,
  onNewSale,
}: UsePosKeyboardOptions) {
  const scannerBufferRef = useRef<string>('');
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInsideInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // When the completed sale modal is visible, pressing Enter starts a new sale
      if (isCompletedSaleOpen) {
        if (e.key === 'Enter') {
          e.preventDefault();
          onNewSale?.();
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          onClearOrCancel();
          return;
        }
      }

      // 1. Hardware Barcode Scanner Fast-Burst Detection
      // Standard barcode scanners emulate a rapid sequence of keystrokes ending with "Enter".
      // Average human typing is > 100ms per char; scanners burst at < 50-65ms per character.
      const now = Date.now();
      const timeDiff = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Printable single characters
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (timeDiff < 65 || scannerBufferRef.current.length === 0) {
          scannerBufferRef.current += e.key;
        } else {
          // Reset buffer if delay is too long
          scannerBufferRef.current = e.key;
        }
      } else if (e.key === 'Enter') {
        const buffer = scannerBufferRef.current;
        // If buffer has at least 3 characters and arrived in rapid burst, treat as barcode
        if (buffer.length >= 3 && timeDiff < 65) {
          scannerBufferRef.current = '';
          lastTimeRef.current = 0;
          e.preventDefault();
          e.stopPropagation();
          onBarcodeScanned(buffer);
          return;
        }
        scannerBufferRef.current = '';
      }

      // If a manager modal or other blocking modal is open, let user interact with it and allow Escape to close
      if (isModalOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClearOrCancel();
        }
        return;
      }

      // 2. Global Hotkeys (F1-F12, Escape, Ctrl+Enter)
      // These work anywhere, even if focused in an input.
      if (e.key === 'F1') {
        e.preventDefault();
        onSearchFocus();
        return;
      }

      if (e.key === 'F2') {
        e.preventDefault();
        onCustomerFocus();
        return;
      }

      if (e.key === 'F3') {
        e.preventDefault();
        onDiscountOpen();
        return;
      }

      if (e.key === 'F4') {
        e.preventDefault();
        onPromoFocus();
        return;
      }

      if (e.key === 'F5') {
        e.preventDefault();
        onHoldCart?.();
        return;
      }

      if (e.key === 'F6') {
        e.preventDefault();
        onRecallCart?.();
        return;
      }

      if (e.key === 'F7') {
        e.preventDefault();
        onSetExactAmount();
        return;
      }

      if (e.key === 'F8') {
        e.preventDefault();
        onSelectPaymentMethod('Cash');
        return;
      }

      if (e.key === 'F9') {
        e.preventDefault();
        onSelectPaymentMethod('Card');
        return;
      }

      if (e.key === 'F10') {
        e.preventDefault();
        onSelectPaymentMethod('BankTransfer');
        return;
      }

      if (e.key === 'F11') {
        e.preventDefault();
        onSplitPaymentOpen?.();
        return;
      }

      if (e.key === 'F12' || (e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault();
        onCheckout();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClearOrCancel();
        return;
      }

      // 3. Hotkeys that should only fire when NOT inside a text input
      if (!isInsideInput) {
        if (e.key === '?' || (e.shiftKey && e.key === '/')) {
          e.preventDefault();
          onToggleShortcutsModal();
          return;
        }

        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          onIncreaseLastItemQty?.();
          return;
        }

        if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          onDecreaseLastItemQty?.();
          return;
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          onRemoveLastItem?.();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [
    onSearchFocus,
    onCustomerFocus,
    onPromoFocus,
    onDiscountOpen,
    onSetExactAmount,
    onSelectPaymentMethod,
    onSplitPaymentOpen,
    onCheckout,
    onClearOrCancel,
    onIncreaseLastItemQty,
    onDecreaseLastItemQty,
    onRemoveLastItem,
    onToggleShortcutsModal,
    onHoldCart,
    onRecallCart,
    onBarcodeScanned,
    isModalOpen,
    isCompletedSaleOpen,
    onNewSale,
  ]);
}
