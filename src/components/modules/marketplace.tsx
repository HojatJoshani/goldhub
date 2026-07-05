"use client";

import * as React from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Search,
  Store,
  SlidersHorizontal,
  Star,
  Heart,
  ShoppingCart,
  Crown,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Trash2,
  Minus,
  Plus,
  Check,
  ShoppingBag,
  Gem,
  PackageSearch,
  RotateCcw,
  TrendingUp,
  MapPin,
} from "lucide-react";
import {
  formatToman,
  formatWeight,
  toPersianDigits,
  karatLabel,
} from "@/lib/persian";
import { cn } from "@/lib/utils";

// ============ Types ============

interface MarketplaceProduct {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  barcode: string | null;
  karat: string;
  weight: number;
  salePrice: number;
  stock: number;
  minStock: number;
  images: string;
  category: { id: string; name: string; slug: string } | null;
  branch: { id: string; name: string; code: string } | null;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

interface MarketplaceStore {
  id: string;
  name: string;
  code: string;
  isMain: boolean;
  productCount: number;
  rating: number;
}

interface MarketplaceCategory {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

interface MarketplaceResponse {
  items: MarketplaceProduct[];
  total: number;
  page: number;
  pageSize: number;
  stores: MarketplaceStore[];
  categories: MarketplaceCategory[];
}

interface CartItem {
  product: MarketplaceProduct;
  quantity: number;
}

// ============ Constants ============

const KARAT_OPTIONS = [
  { value: "999", label: "۲۴ عیار" },
  { value: "916", label: "۲۲ عیار" },
  { value: "750", label: "۱۸ عیار" },
  { value: "585", label: "۱۴ عیار" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "جدیدترین" },
  { value: "price_asc", label: "قیمت: کم به زیاد" },
  { value: "price_desc", label: "قیمت: زیاد به کم" },
  { value: "popular", label: "محبوب‌ترین" },
];

const WISHLIST_KEY = "goldhub_marketplace_wishlist";
const CART_KEY = "goldhub_marketplace_cart";

const GRADIENTS = [
  "from-amber-200 via-amber-400 to-amber-600",
  "from-yellow-200 via-amber-300 to-orange-500",
  "from-amber-100 via-yellow-300 to-amber-500",
  "from-orange-200 via-amber-400 to-yellow-600",
  "from-amber-300 via-yellow-200 to-amber-400",
];

function gradientFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

/** Normalize a typed text input (which may contain Persian digits / Persian decimal separator)
 *  into a plain numeric string suitable for sending to the API. */
function normalizeNumericInput(raw: string): string {
  const persianToEnglish = (s: string) =>
    s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
  const cleaned = raw
    .replace(/٫/g, ".") // Persian decimal separator
    .replace(/[^\d۰-۹.]/g, "");
  return persianToEnglish(cleaned);
}

// ============ Sub-components ============

function ProductImage({
  product,
  className,
  iconSize = "w-12 h-12",
}: {
  product: { id: string; name: string };
  className?: string;
  iconSize?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center bg-gradient-to-br overflow-hidden",
        gradientFor(product.id),
        className
      )}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.7), transparent 50%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 80% 80%, rgba(255,255,255,0.5), transparent 40%)",
        }}
      />
      <Crown
        className={cn(iconSize, "text-white/85 drop-shadow-lg relative z-10")}
        strokeWidth={1.5}
      />
      <span className="absolute bottom-2 right-2 text-white/80 text-xs font-bold">
        {product.name.slice(0, 1)}
      </span>
    </div>
  );
}

function Stars({
  rating,
  size = "sm",
  showNumber = false,
  reviewCount,
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
  reviewCount?: number;
}) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const sz =
    size === "sm" ? "w-3.5 h-3.5" : size === "md" ? "w-4 h-4" : "w-5 h-5";
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < full;
          const isHalf = i === full && half;
          return (
            <Star
              key={i}
              className={cn(
                sz,
                filled || isHalf
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/30"
              )}
            />
          );
        })}
      </div>
      {showNumber && (
        <span className="text-xs font-medium text-amber-700">
          {toPersianDigits(rating.toFixed(1))}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className="text-xs text-muted-foreground">
          ({toPersianDigits(reviewCount)})
        </span>
      )}
    </div>
  );
}

interface FilterPanelProps {
  categories: MarketplaceCategory[];
  categoryId?: string;
  setCategoryId: (v?: string) => void;
  karat?: string;
  setKarat: (v?: string) => void;
  minPrice: string;
  setMinPrice: (v: string) => void;
  maxPrice: string;
  setMaxPrice: (v: string) => void;
  minWeight: string;
  setMinWeight: (v: string) => void;
  maxWeight: string;
  setMaxWeight: (v: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

function FilterPanel(props: FilterPanelProps) {
  const {
    categories,
    categoryId,
    setCategoryId,
    karat,
    setKarat,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    minWeight,
    setMinWeight,
    maxWeight,
    setMaxWeight,
    onReset,
    hasActiveFilters,
  } = props;

  return (
    <Card className="bg-card">
      <CardContent className="p-4 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="w-4 h-4 text-amber-600" />
            فیلترها
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-amber-700"
              onClick={onReset}
            >
              <RotateCcw className="w-3 h-3" />
              پاکسازی
            </Button>
          )}
        </div>

        <Separator />

        {/* Categories */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            دسته‌بندی
          </div>
          <div className="space-y-1">
            <button
              onClick={() => setCategoryId(undefined)}
              className={cn(
                "flex items-center justify-between w-full rounded-md px-2 py-1.5 text-sm transition-colors",
                !categoryId
                  ? "bg-amber-50 text-amber-700 font-medium"
                  : "hover:bg-accent"
              )}
            >
              <span>همه دسته‌ها</span>
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() =>
                  setCategoryId(categoryId === c.id ? undefined : c.id)
                }
                className={cn(
                  "flex items-center justify-between w-full rounded-md px-2 py-1.5 text-sm transition-colors",
                  categoryId === c.id
                    ? "bg-amber-50 text-amber-700 font-medium"
                    : "hover:bg-accent"
                )}
              >
                <span className="truncate">{c.name}</span>
                <Badge
                  variant="secondary"
                  className="text-[10px] h-5 min-w-5 px-1 justify-center"
                >
                  {toPersianDigits(c.productCount)}
                </Badge>
              </button>
            ))}
            {categories.length === 0 && (
              <p className="text-xs text-muted-foreground/70 px-2 py-1">
                دسته‌ای یافت نشد
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Karat chips */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            عیار
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setKarat(undefined)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                !karat
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-border hover:border-amber-400 hover:text-amber-700"
              )}
            >
              همه
            </button>
            {KARAT_OPTIONS.map((k) => (
              <button
                key={k.value}
                onClick={() =>
                  setKarat(karat === k.value ? undefined : k.value)
                }
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  karat === k.value
                    ? "border-amber-500 bg-amber-500 text-white"
                    : "border-border hover:border-amber-400 hover:text-amber-700"
                )}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Price range */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            محدوده قیمت (تومان)
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              inputMode="numeric"
              value={minPrice ? toPersianDigits(minPrice) : ""}
              onChange={(e) => setMinPrice(normalizeNumericInput(e.target.value))}
              placeholder="از"
              className="h-8 text-xs"
            />
            <span className="text-muted-foreground text-xs">—</span>
            <Input
              type="text"
              inputMode="numeric"
              value={maxPrice ? toPersianDigits(maxPrice) : ""}
              onChange={(e) => setMaxPrice(normalizeNumericInput(e.target.value))}
              placeholder="تا"
              className="h-8 text-xs"
            />
          </div>
        </div>

        <Separator />

        {/* Weight range */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            محدوده وزن (گرم)
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              inputMode="numeric"
              value={minWeight ? toPersianDigits(minWeight) : ""}
              onChange={(e) => setMinWeight(normalizeNumericInput(e.target.value))}
              placeholder="از"
              className="h-8 text-xs"
            />
            <span className="text-muted-foreground text-xs">—</span>
            <Input
              type="text"
              inputMode="numeric"
              value={maxWeight ? toPersianDigits(maxWeight) : ""}
              onChange={(e) => setMaxWeight(normalizeNumericInput(e.target.value))}
              placeholder="تا"
              className="h-8 text-xs"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onQuickView,
}: {
  product: MarketplaceProduct;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  onAddToCart: () => void;
  onQuickView: () => void;
}) {
  const lowStock = product.stock <= product.minStock;
  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 duration-200 border-border/70">
      {/* Wishlist button overlay */}
      <button
        onClick={onToggleWishlist}
        className={cn(
          "absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-20 size-7 sm:size-8 rounded-full bg-white/90 backdrop-blur shadow flex items-center justify-center transition-colors hover:bg-white",
          isWishlisted ? "text-rose-500" : "text-muted-foreground"
        )}
        aria-label="افزودن به علاقه‌مندی"
      >
        <Heart
          className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isWishlisted && "fill-rose-500")}
        />
      </button>

      {/* Karat badge */}
      <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-20">
        <Badge className="bg-amber-500/95 text-white text-[9px] sm:text-[10px] font-bold shadow">
          {karatLabel(product.karat)}
        </Badge>
      </div>

      {/* Image */}
      <button
        onClick={onQuickView}
        className="block w-full relative"
        aria-label="نمایش سریع"
      >
        <ProductImage
          product={product}
          className="aspect-square w-full"
          iconSize="w-10 h-10 sm:w-14 sm:h-14"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-end justify-center pb-2 sm:pb-3">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 text-foreground text-[10px] sm:text-xs font-medium px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow flex items-center gap-1.5">
            <Search className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            نمایش سریع
          </span>
        </div>
        {/* Stock indicator */}
        {lowStock && (
          <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 z-10">
            <Badge
              variant="destructive"
              className="text-[9px] sm:text-[10px] bg-rose-500/90"
            >
              موجودی محدود
            </Badge>
          </div>
        )}
      </button>

      <CardContent className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
        {/* Branch */}
        {product.branch && (
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-muted-foreground">
            <Store className="w-3 h-3 shrink-0" />
            <span className="truncate">{product.branch.name}</span>
          </div>
        )}

        {/* Name */}
        <button
          onClick={onQuickView}
          className="block w-full text-right"
        >
          <h3 className="font-semibold text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-amber-700 transition-colors min-h-[2.25rem] sm:min-h-[2.5rem]">
            {product.name}
          </h3>
        </button>

        {/* Rating */}
        <Stars
          rating={product.rating}
          size="sm"
          showNumber
          reviewCount={product.reviewCount}
        />

        {/* Weight */}
        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
          <Gem className="w-3 h-3 text-amber-600 shrink-0" />
          {formatWeight(product.weight)}
          {product.category && (
            <>
              <span>•</span>
              <span className="truncate">{product.category.name}</span>
            </>
          )}
        </div>

        <Separator />

        {/* Price + add to cart */}
        <div className="flex items-end justify-between gap-2 pt-0.5 sm:pt-1">
          <div className="min-w-0">
            <div className="text-[9px] sm:text-[10px] text-muted-foreground">قیمت</div>
            <div className="text-xs sm:text-sm font-bold text-amber-700 leading-tight">
              {formatToman(product.salePrice)}
            </div>
          </div>
          <Button
            size="sm"
            onClick={onAddToCart}
            className="bg-amber-500 hover:bg-amber-600 text-white h-7 sm:h-8 shrink-0 px-2 sm:px-3"
          >
            <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="text-[10px] sm:text-xs">افزودن</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickViewContent({
  product,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
}: {
  product: MarketplaceProduct;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  onAddToCart: (qty: number) => void;
}) {
  const [qty, setQty] = React.useState(1);
  const lowStock = product.stock <= product.minStock;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 max-h-[85vh] overflow-y-auto scrollbar-thin">
      {/* Image side */}
      <div className="relative bg-muted">
        <ProductImage
          product={product}
          className="w-full aspect-square md:h-full"
          iconSize="w-24 h-24"
        />
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <Badge className="bg-amber-500 text-white shadow">
            {karatLabel(product.karat)}
          </Badge>
          {lowStock && (
            <Badge variant="destructive" className="bg-rose-500 shadow">
              موجودی محدود
            </Badge>
          )}
        </div>
      </div>

      {/* Details side */}
      <div className="p-4 sm:p-6 space-y-4">
        <DialogHeader className="text-right">
          {product.branch && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Store className="w-3.5 h-3.5" />
              <span>{product.branch.name}</span>
              {product.branch.code && (
                <Badge variant="outline" className="text-[10px] h-4 px-1">
                  {product.branch.code}
                </Badge>
              )}
            </div>
          )}
          <DialogTitle className="text-xl leading-tight">
            {product.name}
          </DialogTitle>
          <DialogDescription className="sr-only">
            جزئیات محصول
          </DialogDescription>
        </DialogHeader>

        <Stars
          rating={product.rating}
          size="md"
          showNumber
          reviewCount={product.reviewCount}
        />

        {product.description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
            {product.description}
          </p>
        )}

        {/* Attribute grid */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-accent/50 p-3">
            <div className="text-xs text-muted-foreground">عیار</div>
            <div className="font-semibold mt-0.5">
              {karatLabel(product.karat)}
            </div>
          </div>
          <div className="rounded-lg bg-accent/50 p-3">
            <div className="text-xs text-muted-foreground">وزن</div>
            <div className="font-semibold mt-0.5">
              {formatWeight(product.weight)}
            </div>
          </div>
          <div className="rounded-lg bg-accent/50 p-3">
            <div className="text-xs text-muted-foreground">دسته‌بندی</div>
            <div className="font-semibold mt-0.5">
              {product.category?.name || "—"}
            </div>
          </div>
          <div className="rounded-lg bg-accent/50 p-3">
            <div className="text-xs text-muted-foreground">موجودی</div>
            <div
              className={cn(
                "font-semibold mt-0.5",
                lowStock ? "text-rose-600" : "text-emerald-600"
              )}
            >
              {toPersianDigits(product.stock)} عدد
            </div>
          </div>
        </div>

        <Separator />

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">قیمت واحد</div>
            <div className="text-2xl font-bold text-amber-700">
              {formatToman(product.salePrice)}
            </div>
          </div>
          <Button
            variant={isWishlisted ? "default" : "outline"}
            size="icon"
            onClick={onToggleWishlist}
            className={
              isWishlisted
                ? "bg-rose-500 hover:bg-rose-600 text-white"
                : "hover:text-rose-500"
            }
            aria-label="افزودن به علاقه‌مندی"
          >
            <Heart className={cn("w-4 h-4", isWishlisted && "fill-white")} />
          </Button>
        </div>

        {/* Quantity + add to cart */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-background px-2 py-1.5 self-start sm:self-auto">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
            >
              <Minus className="w-3.5 h-3.5" />
            </Button>
            <span className="text-sm font-semibold w-6 text-center">
              {toPersianDigits(qty)}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() =>
                setQty((q) => Math.min(product.stock, q + 1))
              }
              disabled={qty >= product.stock}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          <Button
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white h-11"
            onClick={() => onAddToCart(qty)}
            disabled={product.stock === 0}
          >
            <ShoppingCart className="w-4 h-4" />
            افزودن به سبد خرید
          </Button>
        </div>

        {product.sku && (
          <div className="text-[11px] text-muted-foreground font-mono">
            کد محصول: {product.sku}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-16 px-6 flex flex-col items-center text-center gap-4">
        <div className="size-20 rounded-full bg-amber-50 flex items-center justify-center">
          <PackageSearch className="w-10 h-10 text-amber-500" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold">محصولی یافت نشد</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            با فیلترهای فعلی هیچ محصولی پیدا نشد. لطفاً فیلترها را تغییر دهید یا
            پاک کنید تا همه محصولات را ببینید.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onReset}
          className="border-amber-500 text-amber-700 hover:bg-amber-50"
        >
          <RotateCcw className="w-4 h-4" />
          پاک کردن همه فیلترها
        </Button>
      </CardContent>
    </Card>
  );
}

// ============ Main Module ============

export function MarketplaceModule() {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<MarketplaceResponse | null>(null);

  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [categoryId, setCategoryId] = React.useState<string | undefined>();
  const [karat, setKarat] = React.useState<string | undefined>();
  const [branchId, setBranchId] = React.useState<string | undefined>();
  const [sort, setSort] = React.useState("newest");
  const [page, setPage] = React.useState(1);
  const pageSize = 12;

  const [minPrice, setMinPrice] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [minWeight, setMinWeight] = React.useState("");
  const [maxWeight, setMaxWeight] = React.useState("");

  const [showFilters, setShowFilters] = React.useState(false);
  const [quickView, setQuickView] = React.useState<MarketplaceProduct | null>(
    null
  );
  const [cartOpen, setCartOpen] = React.useState(false);
  const [wishlistOpen, setWishlistOpen] = React.useState(false);

  const [wishlist, setWishlist] = React.useState<string[]>([]);
  const [cart, setCart] = React.useState<CartItem[]>([]);

  // Hydrate wishlist & cart from localStorage
  React.useEffect(() => {
    try {
      const w = localStorage.getItem(WISHLIST_KEY);
      if (w) setWishlist(JSON.parse(w) as string[]);
      const c = localStorage.getItem(CART_KEY);
      if (c) setCart(JSON.parse(c) as CartItem[]);
    } catch {
      // ignore corrupted storage
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    } catch {
      // ignore
    }
  }, [wishlist]);

  React.useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // Debounce search input
  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 whenever any filter changes
  React.useEffect(() => {
    setPage(1);
  }, [categoryId, karat, branchId, sort, minPrice, maxPrice, minWeight, maxWeight, debouncedSearch]);

  // Fetch products from API
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (categoryId) params.set("categoryId", categoryId);
    if (karat) params.set("karat", karat);
    if (branchId) params.set("branchId", branchId);
    if (sort) params.set("sort", sort);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (minWeight) params.set("minWeight", minWeight);
    if (maxWeight) params.set("maxWeight", maxWeight);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    fetch(`/api/marketplace?${params.toString()}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("request failed");
        return r.json() as Promise<MarketplaceResponse>;
      })
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("خطا در دریافت محصولات ویترین");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    debouncedSearch,
    categoryId,
    karat,
    branchId,
    sort,
    page,
    minPrice,
    maxPrice,
    minWeight,
    maxWeight,
  ]);

  // ----- Derived state -----
  const stores = data?.stores ?? [];
  const categories = data?.categories ?? [];
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const wishlistProducts = React.useMemo(() => {
    // include wishlisted items that may not be in current page's items: filter current items only
    return items.filter((p) => wishlist.includes(p.id));
  }, [items, wishlist]);

  const hasActiveFilters =
    !!categoryId ||
    !!karat ||
    !!branchId ||
    !!minPrice ||
    !!maxPrice ||
    !!minWeight ||
    !!maxWeight ||
    !!debouncedSearch;

  // ----- Actions -----
  const toggleWishlist = (id: string) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const addToCart = (product: MarketplaceProduct, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        return prev.map((c) =>
          c.product.id === product.id
            ? {
                ...c,
                quantity: Math.min(c.quantity + qty, c.product.stock),
              }
            : c
        );
      }
      return [
        ...prev,
        { product, quantity: Math.min(qty, product.stock) },
      ];
    });
    toast.success(`${product.name} به سبد خرید اضافه شد`);
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.product.id !== id) return c;
        const q = Math.max(1, Math.min(c.quantity + delta, c.product.stock));
        return { ...c, quantity: q };
      })
    );
  };

  const removeCart = (id: string) => {
    setCart((prev) => prev.filter((c) => c.product.id !== id));
  };

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const cartTotal = cart.reduce(
    (s, c) => s + c.product.salePrice * c.quantity,
    0
  );

  const placeOrder = () => {
    toast.success(
      `سفارش شما با ${toPersianDigits(cartCount)} کالا به مبلغ ${formatToman(
        cartTotal
      )} با موفقیت ثبت شد`,
      { description: "همکاران ما به‌زودی برای هماهنگی ارسال با شما تماس خواهند گرفت." }
    );
    setCart([]);
    setCartOpen(false);
  };

  const resetFilters = () => {
    setCategoryId(undefined);
    setKarat(undefined);
    setBranchId(undefined);
    setSort("newest");
    setMinPrice("");
    setMaxPrice("");
    setMinWeight("");
    setMaxWeight("");
    setSearch("");
    setPage(1);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* ============ Hero ============ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-amber-500 via-amber-600 to-yellow-700 text-white p-4 sm:p-6 md:p-10 shadow-lg">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.6), transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3), transparent 40%)",
          }}
        />
        <Crown
          className="absolute -top-8 -left-8 w-32 h-32 sm:w-48 sm:h-48 text-white/10 pointer-events-none"
          strokeWidth={1}
        />
        <div className="relative z-10 space-y-3 sm:space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
            <Sparkles className="w-3.5 h-3.5" />
            ویترین آنلاین طلا و جواهر
          </div>
          <h1 className="text-xl sm:text-2xl md:text-4xl font-bold leading-tight">
            گنجینه‌ای از زیبایی‌های دست‌ساز
          </h1>
          <p className="text-white/85 text-xs sm:text-sm md:text-base leading-relaxed max-w-2xl">
            مجموعه‌ای منتخب از جدیدترین طلاهای عیار و جواهرات نفیس، با تضمین
            اصالت و ارسال سریع به سراسر کشور
          </p>

          {/* Search bar */}
          <div className="relative max-w-xl">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-700" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی محصول، بارکد یا SKU..."
              className="bg-white text-foreground pr-10 h-11 sm:h-12 text-sm sm:text-base border-0 shadow-md"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-1 top-1/2 -translate-y-1/2 h-9 w-9 text-amber-700 hover:text-amber-900 hover:bg-transparent"
                onClick={() => setSearch("")}
                aria-label="پاک کردن جستجو"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Promotional strip */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 text-xs text-white/90">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              ضمانت اصالت کالا
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              ارسال بیمه‌شده
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              پرداخت امن
            </span>
          </div>
        </div>
      </div>

      {/* ============ Store selector + actions ============ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Store className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-foreground">
              فروشگاه‌ها
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setBranchId(undefined)}
              className={cn(
                "shrink-0 rounded-xl border px-3 py-2 text-sm transition-all min-w-32",
                !branchId
                  ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                  : "border-border bg-card hover:border-amber-300"
              )}
            >
              <div className="font-semibold flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5" />
                همه فروشگاه‌ها
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {toPersianDigits(total)} محصول
              </div>
            </button>
            {stores.map((s) => (
              <button
                key={s.id}
                onClick={() => setBranchId(s.id)}
                className={cn(
                  "shrink-0 rounded-xl border px-3 py-2 text-sm transition-all min-w-32 text-right",
                  branchId === s.id
                    ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                    : "border-border bg-card hover:border-amber-300"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-semibold truncate">{s.name}</span>
                  {s.isMain && (
                    <Badge
                      variant="outline"
                      className="text-[10px] h-4 px-1 py-0 bg-amber-100 text-amber-700 border-amber-300"
                    >
                      اصلی
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {toPersianDigits(s.rating)}
                  <span className="mx-0.5">•</span>
                  {toPersianDigits(s.productCount)} محصول
                </div>
              </button>
            ))}
            {stores.length === 0 && !loading && (
              <div className="text-xs text-muted-foreground py-2 px-3">
                فروشگاهی تعریف نشده است
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            className="relative"
            onClick={() => setWishlistOpen(true)}
          >
            <Heart
              className={cn(
                "w-4 h-4",
                wishlist.length > 0 && "fill-rose-500 text-rose-500"
              )}
            />
            <span className="hidden sm:inline">علاقه‌مندی</span>
            {wishlist.length > 0 && (
              <Badge className="absolute -top-2 -left-2 h-5 min-w-5 px-1 text-[10px] bg-rose-500 text-white justify-center">
                {toPersianDigits(wishlist.length)}
              </Badge>
            )}
          </Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white relative"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">سبد خرید</span>
            {cartCount > 0 && (
              <Badge className="absolute -top-2 -left-2 h-5 min-w-5 px-1 text-[10px] bg-rose-500 text-white justify-center">
                {toPersianDigits(cartCount)}
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            className="lg:hidden"
            onClick={() => setShowFilters(true)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">فیلترها</span>
            <span className="sm:hidden">فیلتر</span>
          </Button>
        </div>
      </div>

      {/* ============ Main layout ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 lg:gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-4">
            <FilterPanel
              categories={categories}
              categoryId={categoryId}
              setCategoryId={setCategoryId}
              karat={karat}
              setKarat={setKarat}
              minPrice={minPrice}
              setMinPrice={setMinPrice}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              minWeight={minWeight}
              setMinWeight={setMinWeight}
              maxWeight={maxWeight}
              setMaxWeight={setMaxWeight}
              onReset={resetFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        </aside>

        {/* Products section */}
        <section>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-4">
            <div className="text-xs sm:text-sm text-muted-foreground">
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 animate-pulse text-amber-500" />
                  در حال بارگذاری...
                </span>
              ) : (
                <>
                  <span className="font-semibold text-foreground">
                    {toPersianDigits(total)}
                  </span>{" "}
                  محصول یافت شد
                </>
              )}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-muted-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">پاک کردن فیلترها</span>
                  <span className="sm:hidden">پاکسازی</span>
                </Button>
              )}
              <Label className="text-xs text-muted-foreground hidden sm:inline">
                مرتب‌سازی:
              </Label>
              <Select
                value={sort}
                onValueChange={(v) => setSort(v)}
              >
                <SelectTrigger className="w-32 sm:w-44 h-9">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Product grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-square w-full" />
                  <CardContent className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState onReset={resetFilters} />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                {items.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    isWishlisted={wishlist.includes(p.id)}
                    onToggleWishlist={() => toggleWishlist(p.id)}
                    onAddToCart={() => addToCart(p)}
                    onQuickView={() => setQuickView(p)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 sm:mt-8">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="صفحه قبل"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <span className="text-xs sm:text-sm text-muted-foreground px-3">
                    صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    aria-label="صفحه بعد"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* ============ Quick view dialog ============ */}
      <Dialog
        open={!!quickView}
        onOpenChange={(o) => !o && setQuickView(null)}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-3xl p-0 overflow-hidden gap-0 max-h-[95vh]">
          {quickView && (
            <QuickViewContent
              product={quickView}
              isWishlisted={wishlist.includes(quickView.id)}
              onToggleWishlist={() => toggleWishlist(quickView.id)}
              onAddToCart={(qty) => {
                addToCart(quickView, qty);
                setQuickView(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ============ Mobile filter sheet ============ */}
      <Sheet open={showFilters} onOpenChange={setShowFilters}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
          <SheetHeader className="px-4 pt-4">
            <SheetTitle className="flex items-center gap-2">
              <Filter className="w-4 h-4" /> فیلترها
            </SheetTitle>
            <SheetDescription>
              فیلترهای مورد نظر خود را اعمال کنید
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4 overflow-y-auto">
            <FilterPanel
              categories={categories}
              categoryId={categoryId}
              setCategoryId={setCategoryId}
              karat={karat}
              setKarat={setKarat}
              minPrice={minPrice}
              setMinPrice={setMinPrice}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              minWeight={minWeight}
              setMinWeight={setMinWeight}
              maxWeight={maxWeight}
              setMaxWeight={setMaxWeight}
              onReset={resetFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
          <SheetFooter className="px-4 pb-4 safe-bottom">
            <Button
              onClick={() => setShowFilters(false)}
              className="bg-amber-500 hover:bg-amber-600 text-white w-full"
            >
              نمایش {toPersianDigits(total)} محصول
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ============ Cart drawer ============ */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md flex flex-col p-0">
          <SheetHeader className="border-b">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              سبد خرید
              {cartCount > 0 && (
                <Badge className="bg-amber-500 text-white">
                  {toPersianDigits(cartCount)}
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription>
              {toPersianDigits(cart.length)} کالا در سبد شما
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-muted-foreground">
                <ShoppingBag className="w-16 h-16 text-muted-foreground/30" />
                <div>
                  <p className="font-medium text-foreground">
                    سبد خرید شما خالی است
                  </p>
                  <p className="text-sm mt-1">
                    برای شروع، محصولات مورد علاقه را انتخاب کنید
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCartOpen(false)}
                >
                  بازگشت به فروشگاه
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((c) => (
                  <Card key={c.product.id} className="overflow-hidden">
                    <div className="flex gap-3 p-3">
                      <ProductImage
                        product={c.product}
                        className="w-20 h-20 rounded-lg shrink-0"
                        iconSize="w-8 h-8"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm line-clamp-2 leading-snug">
                            {c.product.name}
                          </h4>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-rose-500 shrink-0"
                            onClick={() => removeCart(c.product.id)}
                            aria-label="حذف از سبد"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {karatLabel(c.product.karat)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatWeight(c.product.weight)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-6 w-6"
                              onClick={() => updateCartQty(c.product.id, -1)}
                              disabled={c.quantity <= 1}
                              aria-label="کاهش تعداد"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-sm font-medium w-7 text-center">
                              {toPersianDigits(c.quantity)}
                            </span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-6 w-6"
                              onClick={() => updateCartQty(c.product.id, 1)}
                              disabled={c.quantity >= c.product.stock}
                              aria-label="افزایش تعداد"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="text-sm font-bold text-amber-700">
                            {formatToman(c.product.salePrice * c.quantity)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <SheetFooter className="border-t">
              <div className="space-y-2 w-full">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">تعداد کل</span>
                  <span>{toPersianDigits(cartCount)} کالا</span>
                </div>
                <div className="flex items-center justify-between text-base font-bold">
                  <span>مبلغ قابل پرداخت</span>
                  <span className="text-amber-700">
                    {formatToman(cartTotal)}
                  </span>
                </div>
                <Button
                  className="bg-amber-500 hover:bg-amber-600 text-white w-full mt-2 h-11"
                  onClick={placeOrder}
                >
                  <Check className="w-4 h-4" />
                  ثبت سفارش
                </Button>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* ============ Wishlist sheet ============ */}
      <Sheet open={wishlistOpen} onOpenChange={setWishlistOpen}>
        <SheetContent
          side="left"
          className="w-full sm:max-w-md flex flex-col p-0"
        >
          <SheetHeader className="border-b">
            <SheetTitle className="flex items-center gap-2">
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
              علاقه‌مندی‌ها
              {wishlist.length > 0 && (
                <Badge className="bg-rose-500 text-white">
                  {toPersianDigits(wishlist.length)}
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription>محصولات مورد علاقه شما</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-4">
            {wishlistProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-muted-foreground">
                <Heart className="w-16 h-16 text-muted-foreground/30" />
                <div>
                  <p className="font-medium text-foreground">
                    لیست علاقه‌مندی خالی است
                  </p>
                  <p className="text-sm mt-1">
                    با کلیک روی قلب کنار هر محصول، آن را به این لیست اضافه کنید
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {wishlistProducts.map((p) => (
                  <Card key={p.id} className="overflow-hidden">
                    <div className="flex gap-3 p-3">
                      <ProductImage
                        product={p}
                        className="w-20 h-20 rounded-lg shrink-0"
                        iconSize="w-8 h-8"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm line-clamp-2 leading-snug">
                            {p.name}
                          </h4>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-rose-500 shrink-0"
                            onClick={() => toggleWishlist(p.id)}
                            aria-label="حذف از علاقه‌مندی"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px]">
                            {karatLabel(p.karat)}
                          </Badge>
                          <Stars rating={p.rating} />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-sm font-bold text-amber-700">
                            {formatToman(p.salePrice)}
                          </div>
                          <Button
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-600 text-white h-7"
                            onClick={() => addToCart(p)}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            افزودن
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            {wishlist.length > wishlistProducts.length && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                برخی موارد در صفحه فعلی نمایش داده نمی‌شوند. برای دیدن همه، فیلترها
                را پاک کنید.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
