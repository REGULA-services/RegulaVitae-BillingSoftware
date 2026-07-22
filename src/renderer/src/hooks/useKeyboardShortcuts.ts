import { useEffect, useRef } from 'react';

interface ShortcutHandlers {
  onF1?: () => void;      // New Bill
  onF2?: () => void;      // Focus Product Search
  onF3?: () => void;      // Edit Quantity
  onF4?: () => void;      // Apply Discount
  onF5?: () => void;      // Hold Bill
  onF6?: () => void;      // Focus Active Queue
  onF7?: () => void;      // Payment Window
  onF8?: () => void;      // Print Bill
  onF9?: () => void;      // Complete Billing
  onEsc?: () => void;     // Cancel Action / Reset
  onCtrlD?: () => void;   // Delete Selected Item
  onAltNum?: (num: number) => void; // Switch Bill 1-9
  onAltN?: () => void;    // Open New Bill
  onAltX?: () => void;    // Close Current Bill
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  // Keep handlers in a ref to avoid re-binding event listeners on every state change
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ALT + numbers (ALT+1 to ALT+9) for customer switching
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const num = parseInt(e.key, 10);
        if (handlersRef.current.onAltNum) {
          handlersRef.current.onAltNum(num);
        }
        return;
      }

      // ALT + N (New bill)
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        if (handlersRef.current.onAltN) handlersRef.current.onAltN();
        return;
      }

      // ALT + X (Close current bill)
      if (e.altKey && (e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        if (handlersRef.current.onAltX) handlersRef.current.onAltX();
        return;
      }

      // CTRL + D (Delete Selected Item)
      if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        if (handlersRef.current.onCtrlD) handlersRef.current.onCtrlD();
        return;
      }

      // Standard Functional Keys (F1-F9, ESC)
      switch (e.key) {
        case 'F1':
          e.preventDefault();
          if (handlersRef.current.onF1) handlersRef.current.onF1();
          break;
        case 'F2':
          e.preventDefault();
          if (handlersRef.current.onF2) handlersRef.current.onF2();
          break;
        case 'F3':
          e.preventDefault();
          if (handlersRef.current.onF3) handlersRef.current.onF3();
          break;
        case 'F4':
          e.preventDefault();
          if (handlersRef.current.onF4) handlersRef.current.onF4();
          break;
        case 'F5':
          e.preventDefault();
          if (handlersRef.current.onF5) handlersRef.current.onF5();
          break;
        case 'F6':
          e.preventDefault();
          if (handlersRef.current.onF6) handlersRef.current.onF6();
          break;
        case 'F7':
          e.preventDefault();
          if (handlersRef.current.onF7) handlersRef.current.onF7();
          break;
        case 'F8':
          e.preventDefault();
          if (handlersRef.current.onF8) handlersRef.current.onF8();
          break;
        case 'F9':
          e.preventDefault();
          if (handlersRef.current.onF9) handlersRef.current.onF9();
          break;
        case 'Escape':
          e.preventDefault();
          if (handlersRef.current.onEsc) handlersRef.current.onEsc();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
