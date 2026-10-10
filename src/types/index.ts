export interface User {
  id: string;
  email: string;
  name: string;
  pharmacyName?: string | null;
  role: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface Batch {
  id: string;
  medicineId: string;
  batchNumber: string;
  quantity: number;
  expiryDate?: string | null;
  purchasePrice?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockHistoryItem {
  id: string;
  medicineId: string;
  changeType: 'INITIAL_STOCK' | 'STOCK_RECEIVED' | 'STOCK_ADJUSTMENT' | 'STOCK_CORRECTION' | 'DAMAGED_EXPIRED' | 'RETURN_TO_SUPPLIER';
  quantityBefore: number;
  quantityChanged: number;
  quantityAfter: number;
  batchNumber?: string | null;
  unitPurchaseCost?: number | null;
  reason?: string | null;
  timestamp: string;
  medicine?: {
    id: string;
    name: string;
    genericName?: string | null;
    strength?: string | null;
    dosageForm?: string | null;
    rackLocation?: string | null;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Medicine {
  id: string;
  name: string;
  sellingPrice: number;
  quantity: number;
  genericName?: string | null;
  brandName?: string | null;
  manufacturer?: string | null;
  strength?: string | null;
  dosageForm?: string | null;
  category?: string | null;
  barcode?: string | null;
  purchasePrice?: number | null;
  minimumStock?: number | null;
  rackLocation?: string | null;
  supplierName?: string | null;
  batchNumber?: string | null;
  expiryDate?: string | null;
  imageUrl?: string | null;
  notes?: string | null;
  onlinePurchaseUrl?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  batches?: Batch[];
  stockHistories?: StockHistoryItem[];
}

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LowStockItem {
  id: string;
  name: string;
  genericName?: string | null;
  brandName?: string | null;
  manufacturer?: string | null;
  strength?: string | null;
  dosageForm?: string | null;
  currentQuantity: number;
  minimumStock: number;
  shortage: number;
  rackLocation?: string | null;
  supplierName?: string | null;
  onlinePurchaseUrl?: string | null;
}

export interface LowStockResponse {
  count: number;
  items: LowStockItem[];
}

export interface ExpiringItem {
  medicineId: string;
  batchId?: string;
  name: string;
  genericName?: string | null;
  brandName?: string | null;
  batchNumber?: string | null;
  quantity?: number;
  totalQuantity?: number;
  expiryDate: string;
  daysRemaining: number;
  scope: 'MEDICINE_LEVEL' | 'BATCH_LEVEL';
  status: 'EXPIRED' | 'EXPIRING_SOON';
}

export interface ExpiringResponse {
  windowDays: number;
  expiredCount: number;
  expiringSoonCount: number;
  expired: ExpiringItem[];
  expiringSoon: ExpiringItem[];
}

export interface DashboardSummary {
  totalMedicines: number;
  totalStockUnits: number;
  totalSellingValue: number;
  totalCostValue: number;
  lowStockCount: number;
  expiringSoonCount: number;
  expiredCount: number;
}

export interface CartItem {
  medicine: Medicine;
  quantity: number;
  customPrice?: number;
}
