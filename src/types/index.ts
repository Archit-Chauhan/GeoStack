// =====================================================================
// GeoStock — shared API entity types (mirror ARCHITECTURE.md §3/§4)
// =====================================================================

export type Role =
  | 'company_owner'
  | 'company_admin'
  | 'warehouse_manager'
  | 'warehouse_staff'
  | 'warehouse_helper'
  | 'store_manager'
  | 'cashier'
  | 'store_helper'
  | 'analyst';

export type Permission = string; // `resource:action`

export interface GeoPoint {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  country?: string;
}

export interface Company {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  owner?: string;
  industry?: string;
  currency: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    country?: string;
    zip?: string;
  };
  settings?: { lowStockThresholdDefault: number };
  plan?: string;
  createdAt?: string;
}

export type UserStatus = 'active' | 'invited' | 'disabled';

export interface User {
  id: string;
  _id?: string;
  company: string | Company;
  name: string;
  email: string;
  role: Role;
  warehouse?: string | Warehouse | null;
  store?: string | Store | null;
  phone?: string;
  avatarColor?: string;
  status: UserStatus;
  lastLoginAt?: string;
  createdAt?: string;
}

export type WarehouseType = 'standard' | 'cold' | 'hub';
export type LocationStatus = 'active' | 'inactive';

export interface Warehouse {
  id: string;
  _id?: string;
  company: string;
  name: string;
  code: string;
  manager?: string | User | null;
  location: GeoPoint;
  capacityPallets: number;
  usedPallets: number;
  type: WarehouseType;
  status: LocationStatus;
  utilization?: number;
  createdAt?: string;
}

export interface Store {
  id: string;
  _id?: string;
  company: string;
  name: string;
  code: string;
  manager?: string | User | null;
  location: GeoPoint;
  status: LocationStatus;
  createdAt?: string;
}

export type ProductStatus = 'active' | 'archived';

export interface Product {
  id: string;
  _id?: string;
  company: string;
  name: string;
  sku: string;
  category: string;
  brand?: string;
  unit: string;
  images?: string[];
  minStock: number;
  maxStock: number;
  price: number;
  cost: number;
  status: ProductStatus;
  createdAt?: string;
}

export type LocationType = 'warehouse' | 'store';

export interface Inventory {
  id: string;
  _id?: string;
  company: string;
  product: Product | string;
  locationType: LocationType;
  warehouse?: Warehouse | string | null;
  store?: Store | string | null;
  available: number;
  reserved: number;
  incoming: number;
  outgoing: number;
  damaged: number;
  onHand?: number;
  updatedBy?: string | User;
  updatedAt?: string;
}

export type TransferStatus =
  | 'requested'
  | 'approved'
  | 'dispatched'
  | 'in_transit'
  | 'delivered'
  | 'received'
  | 'cancelled';

export interface TransferItem {
  product: Product | string;
  quantity: number;
}

export interface TimelineEntry {
  status: TransferStatus;
  at: string;
  by?: string | User;
  note?: string;
}

export interface Transfer {
  id: string;
  _id?: string;
  company: string;
  code: string;
  fromType: LocationType;
  from: Warehouse | Store | string;
  toType: LocationType;
  to: Warehouse | Store | string;
  items: TransferItem[];
  status: TransferStatus;
  requestedBy?: string | User;
  approvedBy?: string | User | null;
  timeline: TimelineEntry[];
  distanceKm?: number;
  etaHours?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type SaleStatus = 'completed' | 'returned' | 'cancelled';

export interface SaleItem {
  product: Product | string;
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  id: string;
  _id?: string;
  company: string;
  code: string;
  store: Store | string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: SaleStatus;
  cashier?: string | User;
  customer?: { name?: string };
  createdAt?: string;
}

export type NotificationLevel = 'info' | 'warning' | 'critical';

export interface AppNotification {
  id: string;
  _id?: string;
  company: string;
  user?: string | null;
  type: string;
  title: string;
  message: string;
  level: NotificationLevel;
  read: boolean;
  meta?: Record<string, unknown>;
  createdAt?: string;
}

export interface AuditLog {
  id: string;
  _id?: string;
  company: string;
  actor?: string | User;
  action: string;
  entity: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  at: string;
}

// -------- analytics shapes --------
export interface KPIs {
  revenueMTD: number;
  revenueDeltaPct: number;
  inventoryValue: number;
  inventoryDeltaPct: number;
  totalUnits: number;
  activeTransfers: number;
  transfersAwaitingApproval: number;
  transfersDelta: number;
  lowStockCount: number;
  criticalCount: number;
  lowStockDelta: number;
  warehouseCount?: number;
  storeCount?: number;
  productCount?: number;
}

export interface ThroughputPoint {
  date: string;
  label: string;
  dispatched: number;
  received: number;
}

export interface CategorySlice {
  category: string;
  units: number;
  pct?: number;
}

export interface FastMovingRow {
  product: Product | string;
  productName?: string;
  sku?: string;
  unitsMoved: number;
}

// -------- roles endpoint --------
export interface RoleDef {
  key: Role;
  label: string;
  level: number;
  permissions: Permission[];
}

export interface RolesResponse {
  roles: RoleDef[];
  permissions: Permission[];
}

// -------- list envelope --------
export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// -------- auth --------
export interface AuthPayload {
  user: User;
  accessToken: string;
  company?: Company;
}
