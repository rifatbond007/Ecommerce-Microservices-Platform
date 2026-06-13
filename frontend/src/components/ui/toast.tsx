import * as ToastPrimitive from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createContext, useContext, useState, useCallback } from 'react';

type ToastVariant = 'default' | 'success' | 'destructive' | 'warning';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (t: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const variantStyles: Record<ToastVariant, string> = {
  default: 'bg-background border',
  success: 'bg-success text-success-foreground border-success',
  destructive: 'bg-destructive text-destructive-foreground border-destructive',
  warning: 'bg-warning text-warning-foreground border-warning',
};

export function Toaster({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider>
        {children}
        <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[100] flex max-h-screen flex-col-reverse p-4 gap-2 w-full max-w-sm" />
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            open
            onOpenChange={(open) => { if (!open) removeToast(t.id); }}
            className={cn(
              'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 shadow-lg transition-all animate-in slide-in-from-right-full',
              variantStyles[t.variant || 'default']
            )}
          >
            <div className="flex-1">
              <ToastPrimitive.Title className="text-sm font-semibold">{t.title}</ToastPrimitive.Title>
              {t.description && (
                <ToastPrimitive.Description className="text-sm opacity-90 mt-0.5">{t.description}</ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close className="shrink-0 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/10">
              <X className="h-4 w-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
