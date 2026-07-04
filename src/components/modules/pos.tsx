"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import {
  ShoppingCart,
  ScanLine,
  Search,
  Trash2,
  Plus,
  Minus,
  Printer,
  X,
  User,
  Users,
  Package,
  Loader2,
  CheckCircle2,
  Crown,
  CreditCard,
  Banknote,
  ArrowLeftRight,
  Coins,
  Layers,
  Receipt,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import {
  formatToman,
  formatWeight,
  toPersianDigits,
  karatLabel,
  formatPersianDateTime,
} from "@/lib/persian";

// ============ Types ============

interface PosProduct {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  karat: string;
  weight: number;
  makingCharge: number;
  makingType: string;
  stoneCost: number;
  salePrice: number;
  stock: number;
  minStock: number;
  status: string;
  category: { id: string; name: string; slug: string } | null;
}

interface PosCategory {
  id: string;
  name: string;
  slug: string;
}

interface PosCustomer {
  id: string;
  name: string;
  phone: string | null;
  loyaltyPoints: number;
  totalSpent: number;
  totalOrders: number;
}

interface CartItem {
  product: PosProduct;
  quantity: number;
}

type PaymentMethod = "cash" | "card" | "transfer" | "gold" | "mixed";

interface CreatedSale {
  id: string;
  invoiceNumber: string;
  customerId: string | null;
  cashierId: string;
  branchId: string;
  subtotal: number;
  discount: number;
  tax: number;
  makingTotal: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  notes: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    productId: string;
    name: string;
    karat: string;
    weight: number;
    makingCharge: number;
    unitPrice: number;
    quantity: number;
    total: number;
  }>;
  customer: { id: string; name: string; phone: string | null } | null;
  cashier: { id: string; name: string };
}

// ============ Constants ============

const PAYMENT_METHODS: Array<{
  value: PaymentMethod;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "cash", label: "نقدی", icon: Banknote },
  { value: "card", label: "کارتی", icon: CreditCard },
  { value: "transfer", label: "انتقال", icon: ArrowLeftRight },
  { value: "gold", label: "طلا", icon: Coins },
  { value: "mixed", label: "ترکیبی", icon: Layers },
];

// ============ Component ============

export function PosModule() {
  const [products, setProducts] = React.useState<PosProduct[]>([]);
  const [categories, setCategories] = React.useState<PosCategory[]>([]);
  const [customers, setCustomers] = React.useState<PosCustomer[]>([]);
  const [loadingProducts, setLoadingProducts] = React.useState(true);
  const [loadingCustomers, setLoadingCustomers] = React.useState(false);

  const [search, setSearch] = React.useState("");
  const [barcodeInput, setBarcodeInput] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<string>("");

  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [customerId, setCustomerId] = React.useState<string>("");
  const [discount, setDiscount] = React.useState<string>("");
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("cash");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [lastSale, setLastSale] = React.useState<CreatedSale | null>(null);
  const [showInvoice, setShowInvoice] = React.useState(false);
  const [cartSheetOpen, setCartSheetOpen] = React.useState(false);

  const barcodeRef = React.useRef<HTMLInputElement>(null);

  // Load products (uses Inventory module's /api/products, paginated)
  const loadProducts = React.useCallback(async () => {
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("pageSize", "100");
      if (search.trim()) params.set("search", search.trim());
      if (activeCategory) params.set("categoryId", activeCategory);
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setProducts(data.items || []);
      } else {
        toast.error(data.error || "خطا در دریافت محصولات");
      }
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setLoadingProducts(false);
    }
  }, [search, activeCategory]);

  // Load categories (uses Inventory module's /api/categories) — once on mount
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (res.ok) setCategories(data.items || []);
      } catch {
        // ignore
      }
    })();
  }, []);

  // Initial load + debounced reload on search/category change
  React.useEffect(() => {
    const t = setTimeout(() => {
      loadProducts();
    }, 250);
    return () => clearTimeout(t);
  }, [search, activeCategory, loadProducts]);

  // Load customers (lazy, on first open of selector)
  const loadCustomers = React.useCallback(async (q = "") => {
    setLoadingCustomers(true);
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("pageSize", "100");
      if (q.trim()) params.set("search", q.trim());
      const res = await fetch(`/api/customers?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setCustomers(data.items || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  // Focus barcode input on mount
  React.useEffect(() => {
    barcodeRef.current?.focus();
  }, []);

  // ============ Cart operations ============

  const addToCart = React.useCallback(
    (product: PosProduct) => {
      if (product.stock <= 0) {
        toast.error(`محصول «${product.name}» موجودی ندارد`);
        return;
      }
      setCart((prev) => {
        const existing = prev.find((it) => it.product.id === product.id);
        if (existing) {
          if (existing.quantity + 1 > product.stock) {
            toast.error(`حداکثر موجودی: ${toPersianDigits(product.stock)} عدد`);
            return prev;
          }
          return prev.map((it) =>
            it.product.id === product.id
              ? { ...it, quantity: it.quantity + 1 }
              : it
          );
        }
        return [...prev, { product, quantity: 1 }];
      });
    },
    []
  );

  const changeQty = React.useCallback((productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((it) => {
          if (it.product.id !== productId) return it;
          const next = it.quantity + delta;
          if (next > it.product.stock) {
            toast.error(`حداکثر موجودی: ${toPersianDigits(it.product.stock)} عدد`);
            return it;
          }
          return { ...it, quantity: next };
        })
        .filter((it) => it.quantity > 0);
    });
  }, []);

  const setQty = React.useCallback((productId: string, qty: number) => {
    setCart((prev) => {
      return prev
        .map((it) => {
          if (it.product.id !== productId) return it;
          const safeQty = Math.max(0, Math.min(qty, it.product.stock));
          return { ...it, quantity: safeQty };
        })
        .filter((it) => it.quantity > 0);
    });
  }, []);

  const removeFromCart = React.useCallback((productId: string) => {
    setCart((prev) => prev.filter((it) => it.product.id !== productId));
  }, []);

  const clearCart = React.useCallback(() => {
    setCart([]);
    setDiscount("");
    setNotes("");
    setCustomerId("");
    setPaymentMethod("cash");
  }, []);

  // Barcode scan handler
  const onBarcodeScan = React.useCallback(() => {
    const code = barcodeInput.trim();
    if (!code) return;
    const product = products.find(
      (p) => p.barcode === code || p.sku === code
    );
    if (product) {
      addToCart(product);
      setBarcodeInput("");
      toast.success(`«${product.name}» به سبد اضافه شد`);
    } else {
      toast.error(`محصولی با بارکد «${toPersianDigits(code)}» یافت نشد`);
    }
  }, [barcodeInput, products, addToCart]);

  // ============ Calculations ============

  const subtotal = React.useMemo(
    () => cart.reduce((s, it) => s + it.product.salePrice * it.quantity, 0),
    [cart]
  );

  const makingTotal = React.useMemo(
    () =>
      cart.reduce((s, it) => {
        const m = computeMaking(it.product);
        return s + m * it.quantity;
      }, 0),
    [cart]
  );

  const discountValue = React.useMemo(() => {
    const n = parseInt(discount.replace(/[^\d]/g, "") || "0", 10);
    return Math.max(0, Math.min(isNaN(n) ? 0 : n, subtotal));
  }, [discount, subtotal]);

  const total = React.useMemo(
    () => Math.max(0, subtotal - discountValue),
    [subtotal, discountValue]
  );

  const totalItems = React.useMemo(
    () => cart.reduce((s, it) => s + it.quantity, 0),
    [cart]
  );

  // ============ Checkout ============

  const checkout = React.useCallback(async () => {
    if (cart.length === 0) {
      toast.error("سبد خرید خالی است");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((it) => ({
            productId: it.product.id,
            quantity: it.quantity,
          })),
          customerId: customerId || undefined,
          paymentMethod,
          discount: discountValue,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "خطا در ثبت فروش");
        setSubmitting(false);
        return;
      }
      toast.success(`فاکتور ${toPersianDigits(data.invoiceNumber)} با موفقیت ثبت شد`);
      setLastSale(data);
      setShowInvoice(true);
      clearCart();
      // Refresh products to get updated stock
      loadProducts();
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setSubmitting(false);
    }
  }, [cart, customerId, paymentMethod, discountValue, notes, clearCart, loadProducts]);

  // ============ Render ============

  return (
    <div className="space-y-4">
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #pos-invoice-print, #pos-invoice-print * { visibility: visible !important; }
          #pos-invoice-print {
            position: absolute !important;
            top: 0 !important;
            right: 0 !important;
            left: 0 !important;
            width: 100% !important;
            padding: 16px !important;
            margin: 0 !important;
          }
          .no-print { display: none !important; }
        }
        #pos-invoice-print {
          position: fixed;
          top: 0;
          right: -9999px;
          width: 210mm;
          background: white;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
            <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 shrink-0" />
            <span className="truncate">صندوق فروش</span>
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            ثبت سریع فروش و صدور فاکتور
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-amber-300 text-amber-700 dark:text-amber-300 px-3 py-1 text-xs sm:text-sm shrink-0"
        >
          <ShoppingCart className="w-4 h-4" />
          {toPersianDigits(totalItems)} کالا در سبد
        </Badge>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4">
        {/* Products panel */}
        <Card className="no-print">
          <CardHeader className="p-3 sm:p-6 pb-3">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Search by name */}
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="جستجوی محصول (نام، SKU، بارکد)..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pr-9 h-10"
                  />
                </div>
                {/* Barcode scan input */}
                <div className="relative w-full sm:w-64">
                  <ScanLine className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                  <Input
                    ref={barcodeRef}
                    placeholder="اسکن بارکد..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onBarcodeScan();
                      }
                    }}
                    className="pr-9 border-amber-300 focus-visible:border-amber-500 h-10"
                  />
                </div>
              </div>

              {/* Category filter chips */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                <Button
                  size="sm"
                  variant={activeCategory === "" ? "default" : "outline"}
                  onClick={() => setActiveCategory("")}
                  className="shrink-0"
                >
                  همه
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    size="sm"
                    variant={activeCategory === cat.id ? "default" : "outline"}
                    onClick={() => setActiveCategory(cat.id)}
                    className="shrink-0"
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {loadingProducts ? (
              <div className="flex items-center justify-center py-16 sm:py-20">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
                <Package className="w-10 h-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  محصولی یافت نشد
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                {products.map((p) => {
                  const outOfStock = p.stock <= 0;
                  const inCart = cart.find((it) => it.product.id === p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      disabled={outOfStock}
                      className={`group relative text-right rounded-lg border bg-card p-2 sm:p-3 transition-all ${
                        outOfStock
                          ? "opacity-50 cursor-not-allowed border-muted"
                          : "hover:border-amber-400 hover:shadow-md hover:-translate-y-0.5 border-border"
                      }`}
                    >
                      {/* Karat badge */}
                      <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] h-5"
                        >
                          {karatLabel(p.karat)}
                        </Badge>
                        {inCart && (
                          <Badge className="bg-amber-500 text-white text-[10px] h-5">
                            <Check className="w-2.5 h-2.5" />
                            {toPersianDigits(inCart.quantity)}
                          </Badge>
                        )}
                      </div>

                      {/* Product icon */}
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-gradient-to-br from-amber-100 to-yellow-200 dark:from-amber-950/50 dark:to-yellow-900/30 flex items-center justify-center mb-1.5 sm:mb-2">
                        <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
                      </div>

                      <h3 className="text-xs sm:text-sm font-medium line-clamp-2 leading-snug min-h-[2.25rem] sm:min-h-[2.5rem]">
                        {p.name}
                      </h3>

                      <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-muted-foreground">
                        <span className="tabular-nums">{formatWeight(p.weight)}</span>
                        {p.category && (
                          <>
                            <span>·</span>
                            <span className="truncate">{p.category.name}</span>
                          </>
                        )}
                      </div>

                      <div className="mt-1.5 sm:mt-2 flex items-end justify-between">
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground">
                            موجودی:{" "}
                            <span
                              className={
                                p.stock <= p.minStock
                                  ? "text-destructive font-medium"
                                  : "text-foreground font-medium"
                              }
                            >
                              {toPersianDigits(p.stock)}
                            </span>
                          </p>
                          <p className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400 mt-0.5 tabular-nums">
                            {formatToman(p.salePrice)}
                          </p>
                        </div>
                        {!outOfStock && (
                          <div className="w-7 h-7 rounded-md bg-amber-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                            <Plus className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cart panel (desktop only — inline) */}
        <Card className="no-print hidden lg:flex flex-col lg:max-h-[calc(100vh-9rem)] lg:sticky lg:top-4 overflow-hidden">
          <CartPanelContent
            cart={cart}
            totalItems={totalItems}
            subtotal={subtotal}
            makingTotal={makingTotal}
            discount={discount}
            discountValue={discountValue}
            total={total}
            customerId={customerId}
            setCustomerId={setCustomerId}
            setDiscount={setDiscount}
            notes={notes}
            setNotes={setNotes}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            submitting={submitting}
            customers={customers}
            loadingCustomers={loadingCustomers}
            loadCustomers={loadCustomers}
            onClearCart={clearCart}
            onRemove={removeFromCart}
            onChangeQty={changeQty}
            onSetQty={setQty}
            onCheckout={checkout}
          />
        </Card>
      </div>

      {/* Mobile sticky bottom bar (lg:hidden) */}
      <div className="lg:hidden sticky bottom-0 z-30 bg-background/95 backdrop-blur border-t border-amber-200 dark:border-amber-900 p-3 flex items-center gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] safe-bottom no-print">
        <div className="flex-1 min-w-0">
          {totalItems > 0 ? (
            <>
              <p className="text-[10px] text-muted-foreground">مبلغ نهایی · {toPersianDigits(totalItems)} کالا</p>
              <p className="text-base font-bold text-amber-700 dark:text-amber-400 truncate tabular-nums">
                {formatToman(total)}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">سبد خرید خالی است</p>
          )}
        </div>
        <Button
          onClick={() => setCartSheetOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white font-bold shrink-0 h-11 px-4"
        >
          <ShoppingCart className="w-4 h-4" />
          سبد خرید
          {totalItems > 0 && (
            <Badge className="bg-white/20 text-white ml-1 tabular-nums">
              {toPersianDigits(totalItems)}
            </Badge>
          )}
        </Button>
      </div>

      {/* Mobile cart sheet (lg:hidden) */}
      <Sheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col gap-0 no-print"
        >
          <SheetHeader className="p-4 border-b shrink-0">
            <SheetTitle className="flex items-center gap-2 text-base pr-8">
              <ShoppingCart className="w-5 h-5 text-amber-500" />
              سبد خرید
              {totalItems > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                >
                  {toPersianDigits(totalItems)}
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 flex flex-col overflow-hidden">
            <CartPanelContent
              cart={cart}
              totalItems={totalItems}
              subtotal={subtotal}
              makingTotal={makingTotal}
              discount={discount}
              discountValue={discountValue}
              total={total}
              customerId={customerId}
              setCustomerId={setCustomerId}
              setDiscount={setDiscount}
              notes={notes}
              setNotes={setNotes}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              submitting={submitting}
              customers={customers}
              loadingCustomers={loadingCustomers}
              loadCustomers={loadCustomers}
              onClearCart={() => {
                clearCart();
              }}
              onRemove={removeFromCart}
              onChangeQty={changeQty}
              onSetQty={setQty}
              onCheckout={checkout}
              variant="mobile"
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Invoice Dialog (on-screen) */}
      <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
        <DialogContent className="max-w-[100vw] sm:max-w-2xl h-[100vh] sm:h-auto max-h-[100vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogTitle className="sr-only">فاکتور فروش</DialogTitle>
          {lastSale && (
            <InvoiceView
              sale={lastSale}
              onClose={() => setShowInvoice(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden print version */}
      {lastSale && (
        <div id="pos-invoice-print">
          <InvoiceView sale={lastSale} forPrint />
        </div>
      )}
    </div>
  );
}

// ============ Sub-components ============

interface CartPanelContentProps {
  cart: CartItem[];
  totalItems: number;
  subtotal: number;
  makingTotal: number;
  discount: string;
  discountValue: number;
  total: number;
  customerId: string;
  setCustomerId: (id: string) => void;
  setDiscount: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (m: PaymentMethod) => void;
  submitting: boolean;
  customers: PosCustomer[];
  loadingCustomers: boolean;
  loadCustomers: (q?: string) => void;
  onClearCart: () => void;
  onRemove: (productId: string) => void;
  onChangeQty: (productId: string, delta: number) => void;
  onSetQty: (productId: string, qty: number) => void;
  onCheckout: () => void;
  variant?: "desktop" | "mobile";
}

function CartPanelContent({
  cart,
  totalItems,
  subtotal,
  makingTotal,
  discount,
  discountValue,
  total,
  customerId,
  setCustomerId,
  setDiscount,
  notes,
  setNotes,
  paymentMethod,
  setPaymentMethod,
  submitting,
  customers,
  loadingCustomers,
  loadCustomers,
  onClearCart,
  onRemove,
  onChangeQty,
  onSetQty,
  onCheckout,
  variant = "desktop",
}: CartPanelContentProps) {
  const isMobile = variant === "mobile";
  return (
    <>
      {/* Header (only desktop — mobile uses SheetHeader) */}
      {!isMobile && (
        <CardHeader className="p-4 sm:p-6 pb-3 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-500" />
              سبد خرید
              {totalItems > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                >
                  {toPersianDigits(totalItems)}
                </Badge>
              )}
            </CardTitle>
            {cart.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onClearCart}
                className="text-destructive hover:text-destructive h-8"
              >
                <Trash2 className="w-4 h-4" />
                پاک کردن
              </Button>
            )}
          </div>
        </CardHeader>
      )}

      {/* Clear-cart button on mobile (below SheetHeader) */}
      {isMobile && cart.length > 0 && (
        <div className="px-4 pt-3 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearCart}
            className="text-destructive hover:text-destructive h-8"
          >
            <Trash2 className="w-4 h-4" />
            پاک کردن سبد
          </Button>
        </div>
      )}

      <CardContent
        className={`flex-1 flex flex-col gap-3 overflow-hidden p-4 sm:p-6 ${
          isMobile ? "pt-3" : "pt-0"
        }`}
      >
        {/* Cart items */}
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <ShoppingCart className="w-10 h-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">سبد خرید خالی است</p>
            <p className="text-xs text-muted-foreground mt-1">
              محصولی را انتخاب یا بارکد را اسکن کنید
            </p>
          </div>
        ) : (
          <ScrollArea
            className={`flex-1 pr-1 ${
              isMobile ? "" : "max-h-72 lg:max-h-none"
            }`}
          >
            <div className="space-y-2">
              {cart.map((it) => (
                <div
                  key={it.product.id}
                  className="rounded-lg border bg-card p-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {it.product.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 h-4 border-amber-300 text-amber-700 dark:text-amber-300"
                        >
                          {karatLabel(it.product.karat)}
                        </Badge>
                        <span className="tabular-nums">{formatWeight(it.product.weight)}</span>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => onRemove(it.product.id)}
                      title="حذف از سبد"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between mt-2 gap-2">
                    {/* Qty stepper — touch friendly (min 36px) */}
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9"
                        onClick={() => onChangeQty(it.product.id, -1)}
                        title="کاهش"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={toPersianDigits(it.quantity)}
                        onChange={(e) => {
                          const v = parseInt(
                            e.target.value.replace(/[^\d]/g, "") || "0",
                            10
                          );
                          onSetQty(it.product.id, isNaN(v) ? 0 : v);
                        }}
                        className="h-9 w-12 text-center text-sm px-0 tabular-nums"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9"
                        onClick={() => onChangeQty(it.product.id, 1)}
                        disabled={it.quantity >= it.product.stock}
                        title="افزایش"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-[10px] text-muted-foreground tabular-nums">
                        {formatToman(it.product.salePrice)}
                      </p>
                      <p className="text-sm font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                        {formatToman(it.product.salePrice * it.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Customer + payment + totals */}
        {cart.length > 0 && (
          <div
            className={`space-y-3 pt-1 shrink-0 ${
              isMobile ? "border-t pt-3" : ""
            }`}
          >
            <Separator />

            {/* Customer selector */}
            <CustomerSelector
              value={customerId}
              onChange={setCustomerId}
              customers={customers}
              onLoad={loadCustomers}
              loading={loadingCustomers}
            />

            {/* Discount + notes */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  تخفیف (تومان)
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="۰"
                  value={discount ? toPersianDigits(discount) : ""}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^\d]/g, "");
                    setDiscount(v);
                  }}
                  className="h-9 tabular-nums"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  توضیحات
                </label>
                <Input
                  placeholder="اختیاری..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Payment method */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                روش پرداخت
              </label>
              <div className="grid grid-cols-5 gap-1">
                {PAYMENT_METHODS.map((m) => {
                  const Icon = m.icon;
                  const active = paymentMethod === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-md border py-1.5 text-[10px] font-medium transition-all ${
                        active
                          ? "border-amber-500 bg-amber-500 text-white"
                          : "border-border bg-background hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>جمع کل</span>
                <span className="tabular-nums">{formatToman(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>اجرت ساخت</span>
                <span className="tabular-nums">{formatToman(makingTotal)}</span>
              </div>
              {discountValue > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>تخفیف</span>
                  <span className="tabular-nums">- {formatToman(discountValue)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-dashed">
                <span className="font-bold">مبلغ نهایی</span>
                <span className="text-base sm:text-lg font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                  {formatToman(total)}
                </span>
              </div>
            </div>

            {/* Checkout */}
            <Button
              onClick={onCheckout}
              disabled={submitting || cart.length === 0}
              className="w-full h-12 gold-gradient text-white font-bold hover:opacity-90 shadow-md"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال ثبت...
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  ثبت فروش و صدور فاکتور
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </>
  );
}

function CustomerSelector({
  value,
  onChange,
  customers,
  onLoad,
  loading,
}: {
  value: string;
  onChange: (id: string) => void;
  customers: PosCustomer[];
  onLoad: (q?: string) => void;
  loading: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selected = customers.find((c) => c.id === value);

  React.useEffect(() => {
    if (open && customers.length === 0) {
      onLoad();
    }
  }, [open, customers.length, onLoad]);

  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    if (!open) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      onLoad(query);
    }, 250);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query, open, onLoad]);

  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">مشتری</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-9 font-normal"
          >
            {selected ? (
              <span className="flex items-center gap-2 truncate">
                <User className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="truncate">{selected.name}</span>
                {selected.phone && (
                  <span className="text-xs text-muted-foreground">
                    {toPersianDigits(selected.phone)}
                  </span>
                )}
              </span>
            ) : (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                مشتری متفرقه
              </span>
            )}
            <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <div className="border-b">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="نام یا تلفن مشتری..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border-0 rounded-none pr-9 focus-visible:ring-0"
                autoFocus
              />
            </div>
          </div>
          <ScrollArea className="max-h-60">
            <div className="p-1">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className={`w-full text-right rounded-sm px-2 py-2 text-sm hover:bg-accent flex items-center gap-2 ${
                  !value ? "bg-accent" : ""
                }`}
              >
                <Users className="w-4 h-4 text-muted-foreground" />
                مشتری متفرقه
              </button>
              {loading && customers.length === 0 ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                </div>
              ) : customers.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-6">
                  مشتری یافت نشد
                </p>
              ) : (
                customers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onChange(c.id);
                      setOpen(false);
                    }}
                    className={`w-full text-right rounded-sm px-2 py-2 text-sm hover:bg-accent flex items-center justify-between gap-2 ${
                      value === c.id ? "bg-accent" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xs font-bold shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <span className="min-w-0">
                        <span className="block truncate">{c.name}</span>
                        {c.phone && (
                          <span className="block text-[10px] text-muted-foreground">
                            {toPersianDigits(c.phone)}
                          </span>
                        )}
                      </span>
                    </span>
                    {c.loyaltyPoints > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1 py-0 h-4 border-amber-300 text-amber-700 dark:text-amber-300 shrink-0"
                      >
                        {toPersianDigits(c.loyaltyPoints)} امتیاز
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function InvoiceView({
  sale,
  forPrint = false,
  onClose,
}: {
  sale: CreatedSale;
  forPrint?: boolean;
  onClose?: () => void;
}) {
  const paymentLabel =
    PAYMENT_METHODS.find((m) => m.value === sale.paymentMethod)?.label ||
    sale.paymentMethod;

  return (
    <div className={forPrint ? "p-2" : ""}>
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-amber-500 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-lg gold-gradient flex items-center justify-center">
            <Crown className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold gold-text">گلد هاب</h2>
            <p className="text-xs text-muted-foreground">طلا و جواهرات</p>
          </div>
        </div>
        <div className="text-left">
          <h3 className="font-bold">فاکتور فروش</h3>
          <p className="text-sm font-mono">
            {toPersianDigits(sale.invoiceNumber)}
          </p>
        </div>
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">تاریخ:</span>
            <span className="font-medium">
              {formatPersianDateTime(sale.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">صندوق‌دار:</span>
            <span className="font-medium">{sale.cashier?.name || "—"}</span>
          </div>
        </div>
        <div className="space-y-1 text-left">
          <div className="flex items-center justify-end gap-2">
            <span className="text-muted-foreground">مشتری:</span>
            <span className="font-medium">
              {sale.customer?.name || "مشتری متفرقه"}
            </span>
          </div>
          {sale.customer?.phone && (
            <div className="flex items-center justify-end gap-2">
              <span className="text-muted-foreground">تلفن:</span>
              <span className="font-medium">
                {toPersianDigits(sale.customer.phone)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Items table */}
      <table className="w-full text-sm mb-4 border-collapse">
        <thead>
          <tr className="bg-amber-50 dark:bg-amber-950/30 border-y border-amber-200 dark:border-amber-900">
            <th className="text-right py-2 px-2 font-medium text-xs">ردیف</th>
            <th className="text-right py-2 px-2 font-medium text-xs">کالا</th>
            <th className="text-right py-2 px-2 font-medium text-xs">عیار</th>
            <th className="text-right py-2 px-2 font-medium text-xs">وزن</th>
            <th className="text-center py-2 px-2 font-medium text-xs">تعداد</th>
            <th className="text-left py-2 px-2 font-medium text-xs">قیمت واحد</th>
            <th className="text-left py-2 px-2 font-medium text-xs">مبلغ</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((it, idx) => (
            <tr key={it.id} className="border-b border-border">
              <td className="py-2 px-2 text-muted-foreground">
                {toPersianDigits(idx + 1)}
              </td>
              <td className="py-2 px-2 font-medium">{it.name}</td>
              <td className="py-2 px-2 text-muted-foreground">
                {karatLabel(it.karat)}
              </td>
              <td className="py-2 px-2 text-muted-foreground">
                {toPersianDigits(it.weight.toFixed(3))} گرم
              </td>
              <td className="py-2 px-2 text-center">
                {toPersianDigits(it.quantity)}
              </td>
              <td className="py-2 px-2 text-left">
                {toPersianDigits(Math.round(it.unitPrice).toLocaleString("en-US"))}
              </td>
              <td className="py-2 px-2 text-left font-medium">
                {toPersianDigits(Math.round(it.total).toLocaleString("en-US"))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-full sm:w-72 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">جمع کل</span>
            <span>{formatToman(sale.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">اجرت ساخت</span>
            <span>{formatToman(sale.makingTotal)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between text-destructive">
              <span>تخفیف</span>
              <span>- {formatToman(sale.discount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t-2 border-amber-500">
            <span className="font-bold">مبلغ نهایی</span>
            <span className="font-bold text-amber-700 dark:text-amber-400">
              {formatToman(sale.total)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground pt-1">
            <span>روش پرداخت</span>
            <span>{paymentLabel}</span>
          </div>
        </div>
      </div>

      {/* Barcode (visual representation of invoice number) */}
      <div className="mt-6 pt-4 border-t border-dashed text-center">
        <div className="inline-block bg-white px-4 py-2">
          <svg
            width="280"
            height="40"
            viewBox="0 0 280 40"
            aria-label="بارکد فاکتور"
          >
            {generateBarcodeBars(sale.invoiceNumber).map((h, i) => (
              <rect
                key={i}
                x={i * 4}
                y={0}
                width={h > 0 ? 2 : 1}
                height={40}
                fill="#000"
              />
            ))}
          </svg>
          <p className="text-xs font-mono mt-1 tracking-widest">
            {toPersianDigits(sale.invoiceNumber)}
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground mt-4">
        با تشکر از خرید شما · کالای فروته شده قابل بازگشت ظرف ۷ روز
      </p>

      {/* Action buttons (only on-screen) */}
      {!forPrint && (
        <div className="no-print flex gap-2 mt-6">
          <Button
            onClick={() => window.print()}
            className="flex-1 gold-gradient text-white font-bold hover:opacity-90"
          >
            <Printer className="w-4 h-4" />
            چاپ فاکتور
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onClose?.()}
          >
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            فروش جدید
          </Button>
        </div>
      )}
    </div>
  );
}

// ============ Helpers ============

function computeMaking(product: PosProduct): number {
  switch (product.makingType) {
    case "flat":
      return product.makingCharge;
    case "percent":
      return (product.salePrice * product.makingCharge) / 100;
    case "per_gram":
    default:
      return product.makingCharge * product.weight;
  }
}

/** Generate a deterministic barcode-like pattern from a string. */
function generateBarcodeBars(input: string): number[] {
  const bars: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    // Produce 4 bars per character (70 bars total for ~17 chars)
    for (let j = 0; j < 4; j++) {
      bars.push((code >> j) & 1);
    }
  }
  return bars.slice(0, 70);
}
