import { Timestamp } from "firebase-admin/firestore";

// === Products ===
export type ProductStatus = "ACTIVE" | "DRAFT" | "OUT_OF_STOCK" | "ARCHIVED";

export interface Product {
  id: string;
  aliexpressId?: string;
  title: string;
  titleHe: string;
  description: string;
  descriptionHe: string;
  slug: string;
  price: number;       // ILS retail
  costPrice: number;   // USD cost
  compareAtPrice: number; // ILS strikethrough
  images: string[];    // Cloud Storage URLs
  categoryId: string;
  categoryName: string;    // denormalized
  categoryNameHe: string;  // denormalized
  tags: string[];
  aliexpressUrl?: string;
  supplierName?: string;
  supplierRating?: number;
  shippingDays: number;
  weight?: number;
  status: ProductStatus;
  salesCount: number;
  viewCount: number;
  trendScore: number;
  reviewCount: number;
  avgRating: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// === Orders ===
export type OrderStatus = "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";

export interface OrderItem {
  productId: string;
  title: string;
  titleHe: string;
  image: string;
  quantity: number;
  priceAtPurchase: number;
  costAtPurchase: number;
}

export interface Order {
  id: string;
  orderNumber: string;  // IL-10001
  customerId: string;
  customerName: string;   // denormalized
  customerEmail: string;  // denormalized
  customerPhone: string;  // denormalized
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  tax: number;        // VAT 17%
  total: number;      // ILS
  status: OrderStatus;
  aliexpressOrderId?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  paymentMethod: string;
  paymentId?: string;
  installments: number;
  couponCode?: string;
  notes?: string;
  shippingAddress: Address;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Address {
  street: string;
  city: string;
  zipCode: string;
  country: string; // default "IL"
}

// === Customers ===
export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address?: Address;
  totalSpent: number;
  orderCount: number;
  marketingConsent: boolean;
  createdAt: Timestamp;
}

// === Categories ===
export interface Category {
  id: string;
  name: string;
  nameHe: string;
  slug: string;
  parentId?: string;
  image?: string;
  order: number;
}

// === Reviews ===
export interface Review {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  rating: number; // 1-5
  text: string;
  images?: string[];
  verified: boolean;
  approved: boolean;
  createdAt: Timestamp;
}

// === Coupons ===
export type DiscountType = "PERCENTAGE" | "FIXED";

export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: Timestamp;
  active: boolean;
  createdAt: Timestamp;
}

// === Invoices ===
export interface Invoice {
  id: string;
  orderId: string;
  invoiceNumber: number;
  pdfUrl: string;
  signedUrl?: string;
  totalAmount: number;
  vatAmount: number;
  createdAt: Timestamp;
}

// === Cart ===
export interface CartItem {
  productId: string;
  quantity: number;
  priceSnapshot: number;
  titleHe: string;
  image: string;
}

export interface Cart {
  sessionId: string;
  items: CartItem[];
  email?: string;
  phone?: string;
  totalValue: number;
  recovered: boolean;
  remindersSent: number;
  lastReminderAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// === Site Settings ===
export interface SiteSettings {
  storeName: string;
  storeNameHe: string;
  logo: string;
  favicon: string;
  announcementBar?: string;
  freeShippingThreshold: number;
  shippingPolicy: string;
  returnPolicy: string;
  privacyPolicy: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    whatsapp?: string;
  };
}

// === Viral Posts ===
export type ViralStatus = "DRAFT" | "SCHEDULED" | "POSTED" | "VIRAL";

export interface ViralPost {
  id: string;
  productId: string;
  platform: string;
  contentType: string;
  hebrewCaption: string;
  hashtags: string[];
  scheduledAt?: Timestamp;
  postedAt?: Timestamp;
  engagement: { likes: number; shares: number; comments: number; views: number };
  status: ViralStatus;
}

// === Support Tickets ===
export type TicketStatus = "OPEN" | "PENDING" | "RESOLVED";
export type TicketChannel = "WHATSAPP" | "EMAIL" | "WEB";

export interface SupportTicket {
  id: string;
  customerId?: string;
  channel: TicketChannel;
  subject: string;
  messages: { from: string; text: string; timestamp: Timestamp }[];
  status: TicketStatus;
  priority: "LOW" | "MEDIUM" | "HIGH";
  assignedTo?: string;
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
}

// === Marketing Campaigns ===
export interface MarketingCampaign {
  id: string;
  name: string;
  platform: "META" | "TIKTOK" | "GOOGLE" | "EMAIL" | "WHATSAPP";
  status: string;
  budget: number;
  spent: number;
  revenue: number;
  clicks: number;
  impressions: number;
  conversions: number;
  startDate: Timestamp;
  endDate?: Timestamp;
}

// === Search Index ===
export interface SearchIndexEntry {
  productId: string;
  tokens: string[]; // lowercased words from title, titleHe, tags
  titleHe: string;
  price: number;
  image: string;
  categoryId: string;
  status: ProductStatus;
}
