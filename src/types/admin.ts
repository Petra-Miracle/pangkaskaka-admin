export type DashboardStats = {
  total_shops: number;
  pending_verifications: number;
  total_customers: number;
  revenue_today: number;
};

export type RecruitmentCriteria = {
  items: string[];
  updated_at: string;
};

export const FACE_SHAPES = ["oval", "round", "square", "oblong", "heart"] as const;
export type FaceShape = (typeof FACE_SHAPES)[number];

export const FACE_SHAPE_LABELS: Record<FaceShape, string> = {
  oval: "Oval",
  round: "Bulat",
  square: "Kotak",
  oblong: "Oblong",
  heart: "Hati",
};

export type Hairstyle = {
  id: string;
  name: string;
  image_url: string;
  description: string;
  suitable_shapes: FaceShape[];
  match_score_map: Partial<Record<FaceShape, number>>;
};

export type AnalyticsDistribution = {
  name: string;
  count: number;
  pct: number;
};

export type AnalyticsWarningShop = {
  id?: string;
  shop_id?: string;
  name?: string;
  [key: string]: unknown;
};

export type AdminAnalytics = {
  kpi: {
    total_shops: number;
    new_shops_month: number;
    pending: number;
    total_customers: number;
    customer_growth_pct: number;
    revenue_today: number;
    revenue_growth_pct: number;
  };
  health: {
    avg_rating: number;
    warning_shops: AnalyticsWarningShop[];
  };
  distribution: AnalyticsDistribution[];
};

export type DocKey = "ktp" | "nib" | "npwp" | "surat_usaha" | "toko";
export type DocStatus = "pending" | "valid" | "invalid" | "needs_revision";

export const DOC_LABELS: Record<DocKey, string> = {
  ktp: "KTP",
  nib: "NIB",
  npwp: "NPWP",
  surat_usaha: "Surat Usaha",
  toko: "Foto Toko",
};

export type ShopDocument = {
  url: string;
  status: DocStatus;
  note: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

export type Shop = {
  id: string;
  owner_id: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  price_range: string;
  image: string;
  rating: number;
  reviews_count: number;
  is_verified: boolean;
  verification_status: "pending" | "approved" | "rejected" | string;
  verification_note: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  doc_ktp: string;
  doc_nib: string;
  doc_npwp: string;
  doc_surat_usaha: string;
  doc_toko: string;
  docs: Record<DocKey, ShopDocument>;
  revision_count: number;
  last_reviewed_by: string | null;
  last_reviewed_at: string | null;
  chat_closed: boolean;
  docs_submitted_at: string;
  created_at: string;
  owner?: {
    email: string;
    name: string;
    phone: string;
  };
};

export const ADMIN_USER_ROLES = ["customer", "owner", "karyawan", "admin"] as const;
export type AdminUserRole = (typeof ADMIN_USER_ROLES)[number];

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  address: string;
  photo: string;
  created_at: string;
};

export type ChatMessage = {
  id?: string;
  sender_id?: string;
  sender_role?: string;
  sender_name?: string;
  message?: string;
  text?: string;
  created_at?: string;
  [key: string]: unknown;
};

export type ChatThreadDetail = {
  shop: { id: string; name: string; image: string; closed: boolean };
  messages: ChatMessage[];
};
