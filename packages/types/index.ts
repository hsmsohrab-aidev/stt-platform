// ============================================================
// STT Platform — Shared TypeScript Types
// Database schema থেকে generated — manually edit করবে না
// Source: database/schema.sql
// ============================================================

// ─── ENUMS ───────────────────────────────────────────────────

export type OrgType =
  | 'brand'
  | 'supplier'
  | 'auditor'
  | 'logistics'
  | 'regulator'
  | 'financial'
  | 'platform_admin';

export type FacilityType =
  | 'raw_material_source'
  | 'spinning_mill'
  | 'knitting_unit'
  | 'weaving_unit'
  | 'dyeing_unit'
  | 'printing_unit'
  | 'fabric_supplier'
  | 'garment_factory'
  | 'washing_unit'
  | 'finishing_unit'
  | 'packing_logistics'
  | 'warehouse';

export type TierLevel =
  | 'tier_1'
  | 'tier_2'
  | 'tier_3'
  | 'tier_4'
  | 'tier_5'
  | 'tier_6';

export type MaterialType =
  | 'cotton'
  | 'polyester'
  | 'recycled_cotton'
  | 'recycled_polyester'
  | 'viscose'
  | 'elastane'
  | 'nylon'
  | 'wool'
  | 'linen'
  | 'silk'
  | 'leather'
  | 'rubber'
  | 'eva'
  | 'other';

export type TcStatus =
  | 'draft'
  | 'issued'
  | 'transferred'
  | 'verified'
  | 'rejected'
  | 'expired';

export type VerificationStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ComplianceStatus =
  | 'compliant'
  | 'partial'
  | 'non_compliant'
  | 'not_assessed'
  | 'in_progress';

export type AlertSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type SubscriptionPlan =
  | 'view_access'
  | 'facility_membership'
  | 'importer_supply_chain'
  | 'buyer_brand'
  | 'enterprise';

export type TransactionType =
  | 'credit'
  | 'debit'
  | 'adjustment'
  | 'reservation'
  | 'opening_balance';

export type NotificationChannel =
  | 'in_app'
  | 'email'
  | 'sms'
  | 'slack'
  | 'webhook';

// ─── BASE ────────────────────────────────────────────────────

export interface BaseRecord {
  id: string; // UUID
  created_at: string; // TIMESTAMPTZ
}

export interface BaseOrgRecord extends BaseRecord {
  organization_id: string;
}

export interface BaseAuditableRecord extends BaseOrgRecord {
  updated_at: string;
}

// ─── A. ORGANIZATIONS & USERS ────────────────────────────────

export interface Organization extends BaseRecord {
  name: string;
  slug: string;
  org_type: OrgType;
  subscription_plan: SubscriptionPlan;
  subscription_status: string;
  subscription_ends_at: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postal_code: string | null;
  registration_number: string | null;
  tax_id: string | null;
  founded_year: number | null;
  employee_count: number | null;
  logo_url: string | null;
  primary_color: string;
  onboarding_completed: boolean;
  onboarding_step: number;
  integration_fee_paid: boolean;
  integration_fee_paid_at: string | null;
  is_active: boolean;
  updated_at: string;
}

export interface Profile extends BaseRecord {
  organization_id: string | null;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  job_title: string | null;
  department: string | null;
  preferred_language: string;
  timezone: string;
  is_active: boolean;
  last_seen_at: string | null;
  updated_at: string;
}

export interface Role extends BaseRecord {
  name: string;
  description: string | null;
  org_type: OrgType | null;
  is_system: boolean;
}

export interface OrganizationMember extends BaseRecord {
  organization_id: string;
  user_id: string;
  role_id: string | null;
  is_owner: boolean;
  invited_by: string | null;
  joined_at: string;
}

export interface Invitation extends BaseRecord {
  organization_id: string;
  email: string;
  role_id: string | null;
  token: string;
  invited_by: string | null;
  accepted_at: string | null;
  expires_at: string;
}

export interface ApiKey extends BaseRecord {
  organization_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_by: string | null;
}

export interface AuditLog extends BaseRecord {
  organization_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
}

// ─── B. SUPPLY CHAIN ─────────────────────────────────────────

export interface Facility extends BaseAuditableRecord {
  name: string;
  facility_type: FacilityType;
  tier_level: TierLevel | null;
  facility_code: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  registration_number: string | null;
  employee_count: number | null;
  production_capacity: string | null;
  certifications: string[];
  is_active: boolean;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
}

export interface SupplierRelationship extends BaseRecord {
  brand_org_id: string;
  supplier_org_id: string;
  tier_level: TierLevel;
  status: string;
  onboarded_at: string;
  contract_start_date: string | null;
  contract_end_date: string | null;
  notes: string | null;
  updated_at: string;
}

export interface SupplyChainTier extends BaseRecord {
  brand_org_id: string;
  supplier_org_id: string;
  facility_id: string | null;
  tier_level: TierLevel;
  parent_supplier_id: string | null;
  material_types: MaterialType[];
  is_active: boolean;
}

export interface UnauthorizedFlag extends BaseRecord {
  organization_id: string;
  facility_id: string | null;
  flag_type: string;
  description: string | null;
  detected_by: string;
  confidence_score: number | null;
  status: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

// ─── C. ORDERS & LOGISTICS ───────────────────────────────────

export interface Order extends BaseAuditableRecord {
  order_number: string;
  po_number: string | null;
  season: string | null;
  buyer_org_id: string;
  supplier_org_id: string | null;
  facility_id: string | null;
  order_date: string | null;
  required_ship_date: string | null;
  required_delivery_date: string | null;
  actual_ship_date: string | null;
  actual_delivery_date: string | null;
  total_quantity: number | null;
  quantity_unit: string;
  total_value: number | null;
  currency: string;
  incoterms: string | null;
  status: string;
  on_time_status: string | null;
  completion_pct: number;
  notes: string | null;
}

export interface MaterialCompositionItem {
  material: MaterialType;
  pct: number;
}

export interface OrderItem extends BaseRecord {
  order_id: string;
  style_number: string | null;
  description: string;
  color: string | null;
  size_breakdown: Record<string, number> | null;
  quantity: number;
  unit_price: number | null;
  total_price: number | null;
  material_composition: MaterialCompositionItem[] | null;
  gsm: number | null;
}

export interface Shipment extends BaseAuditableRecord {
  order_id: string | null;
  shipment_number: string;
  bl_number: string | null;
  container_number: string | null;
  shipper_org_id: string | null;
  consignee_org_id: string | null;
  logistics_org_id: string | null;
  origin_facility_id: string | null;
  origin_port: string | null;
  destination_port: string | null;
  destination_address: string | null;
  country_of_origin: string | null;
  etd: string | null;
  eta: string | null;
  actual_departure: string | null;
  actual_arrival: string | null;
  total_cartons: number | null;
  total_weight_kg: number | null;
  total_cbm: number | null;
  status: string;
  current_location: string | null;
  current_latitude: number | null;
  current_longitude: number | null;
}

export interface Exception extends BaseAuditableRecord {
  order_id: string | null;
  shipment_id: string | null;
  exception_type: string;
  severity: RiskLevel;
  title: string;
  description: string | null;
  impact_days: number | null;
  status: string;
  assigned_to: string | null;
  resolved_at: string | null;
}

// ─── D. MATERIAL WALLET ──────────────────────────────────────

export interface Material extends BaseRecord {
  name: string;
  material_type: MaterialType;
  description: string | null;
  unit: string;
  standard: string | null;
  is_certified: boolean;
  is_recycled: boolean;
  is_active: boolean;
}

export interface MaterialWallet extends BaseRecord {
  organization_id: string;
  facility_id: string | null;
  is_active: boolean;
}

export interface WalletBalance extends BaseRecord {
  wallet_id: string;
  material_id: string;
  balance_qty: number;
  reserved_qty: number;
  available_qty: number; // GENERATED — do not update
  unit: string;
  last_updated_at: string;
}

export interface MaterialTransaction extends BaseRecord {
  wallet_id: string;
  material_id: string;
  transaction_type: TransactionType;
  quantity: number;
  unit: string;
  reference_type: string | null;
  reference_id: string | null;
  transaction_date: string;
  description: string | null;
  created_by: string | null;
}

export interface MassBalanceRecord extends BaseRecord {
  organization_id: string;
  facility_id: string | null;
  material_id: string;
  period_start: string;
  period_end: string;
  opening_balance: number;
  total_received: number;
  total_consumed: number;
  total_issued: number;
  closing_balance: number; // GENERATED
  conversion_rate: number;
  is_balanced: boolean;
}

// ─── E. TRANSACTION CERTIFICATES ─────────────────────────────

export interface TransactionCertificate extends BaseAuditableRecord {
  tc_number: string; // auto-generated: TC-2026-000001
  tc_status: TcStatus;
  issuer_org_id: string;
  issuer_facility_id: string | null;
  receiver_org_id: string;
  receiver_facility_id: string | null;
  order_id: string | null;
  shipment_id: string | null;
  invoice_number: string | null;
  issue_date: string;
  shipment_date: string | null;
  expiry_date: string;
  total_quantity: number | null;
  quantity_unit: string;
  net_weight_kg: number | null;
  gross_weight_kg: number | null;
  blockchain_tx_id: string | null;
  blockchain_hash: string | null;
  blockchain_anchored_at: string | null;
  is_blockchain_anchored: boolean;
  pdf_url: string | null;
  qr_code_url: string | null;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_by: string | null;
}

export interface TcLineItem extends BaseRecord {
  tc_id: string;
  material_id: string;
  product_description: string | null;
  quantity: number;
  unit: string;
  certification: string | null;
  cert_percentage: number | null;
  lot_number: string | null;
  hs_code: string | null;
  country_of_origin: string | null;
}

export interface TcBlockchainRecord extends BaseRecord {
  tc_id: string;
  network: string;
  channel: string;
  chaincode: string;
  tx_id: string;
  block_number: number | null;
  document_hash: string;
  payload: Record<string, unknown> | null;
  anchored_at: string;
}

// ─── F. DIGITAL PRODUCT PASSPORT ─────────────────────────────

export interface SustainabilityMetric {
  metric: string;
  value: number;
  unit: string;
  verified: boolean;
}

export interface ProductPassport extends BaseAuditableRecord {
  product_name: string;
  product_sku: string | null;
  product_category: string | null;
  season: string | null;
  gtin: string | null;
  batch_number: string | null;
  dpp_regulation: string;
  material_composition: MaterialCompositionItem[] | null;
  country_of_origin: string | null;
  manufacturing_facility_id: string | null;
  carbon_footprint_kg: number | null;
  water_usage_liters: number | null;
  recyclability_info: string | null;
  end_of_life_instructions: string | null;
  repairability_score: number | null;
  care_instructions: Record<string, unknown> | null;
  chemical_compliance: Record<string, unknown> | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  qr_code_url: string | null;
  public_url: string | null;
  created_by: string | null;
}

export interface PassportScan extends BaseRecord {
  passport_id: string;
  qr_code_id: string | null;
  scanned_at: string;
  ip_address: string | null;
  user_agent: string | null;
  country_code: string | null;
  city: string | null;
  device_type: string | null;
  referrer: string | null;
}

// Public DPP response (no auth)
export interface PublicPassportResponse {
  id: string;
  product_name: string;
  product_sku: string | null;
  product_category: string | null;
  material_composition: MaterialCompositionItem[] | null;
  country_of_origin: string | null;
  carbon_footprint_kg: number | null;
  care_instructions: Record<string, unknown> | null;
  recyclability_info: string | null;
  published_at: string | null;
  supply_chain: Array<{
    tier_level: TierLevel;
    process_type: string | null;
    country: string | null;
    display_name: string | null;
  }>;
  sustainability: SustainabilityMetric[];
}

// ─── G. COMPLIANCE ───────────────────────────────────────────

export interface Regulation extends BaseRecord {
  code: string;
  name: string;
  full_name: string | null;
  jurisdiction: string | null;
  effective_date: string | null;
  mandatory_for: string[];
  description: string | null;
  official_url: string | null;
  is_active: boolean;
  updated_at: string;
}

export interface ComplianceTask extends BaseAuditableRecord {
  control_id: string | null;
  regulation_id: string | null;
  title: string;
  description: string | null;
  task_type: string | null;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to: string | null;
  due_date: string | null;
  completed_at: string | null;
  completed_by: string | null;
}

export interface ComplianceIncident extends BaseAuditableRecord {
  regulation_id: string | null;
  title: string;
  description: string | null;
  incident_type: string | null;
  severity: RiskLevel;
  status: string;
  root_cause: string | null;
  corrective_action: string | null;
  reported_by: string | null;
  assigned_to: string | null;
  due_date: string | null;
  resolved_at: string | null;
}

// ─── H. RISK HUB ─────────────────────────────────────────────

export interface RiskEntity extends BaseRecord {
  organization_id: string;
  entity_type: 'supplier' | 'facility' | 'material' | 'shipment' | 'country';
  entity_id: string | null;
  entity_name: string;
  country: string | null;
  is_monitored: boolean;
  monitoring_started_at: string;
}

export interface RiskScore extends BaseRecord {
  risk_entity_id: string;
  overall_score: number;
  risk_level: RiskLevel;
  financial_score: number | null;
  operational_score: number | null;
  supply_chain_score: number | null;
  esg_score: number | null;
  compliance_score: number | null;
  cyber_score: number | null;
  scored_at: string;
  scoring_method: string;
  score_factors: Record<string, unknown> | null;
  previous_score: number | null;
  score_change: number; // GENERATED
}

export interface RiskAlert extends BaseRecord {
  organization_id: string;
  risk_entity_id: string | null;
  alert_type: string;
  severity: AlertSeverity;
  title: string;
  description: string | null;
  status: 'new' | 'acknowledged' | 'in_progress' | 'resolved';
  assigned_to: string | null;
  detected_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  auto_generated: boolean;
}

// ─── I. SUSTAINABILITY & ESG ──────────────────────────────────

export interface SustainabilityGoal extends BaseAuditableRecord {
  goal_name: string;
  category: 'emissions' | 'water' | 'waste' | 'social' | 'energy';
  baseline_value: number | null;
  baseline_year: number | null;
  target_value: number | null;
  target_unit: string | null;
  target_year: number | null;
  progress_pct: number;
  status: 'on_track' | 'at_risk' | 'achieved' | 'missed';
  framework: string | null;
  owner_id: string | null;
}

export interface EmissionsData extends BaseRecord {
  organization_id: string;
  facility_id: string | null;
  scope: 1 | 2 | 3;
  category: string | null;
  emission_source: string | null;
  quantity_co2e: number;
  measurement_method: string | null;
  data_quality: string | null;
  period_start: string;
  period_end: string;
  reporting_year: number | null;
  is_verified: boolean;
  verified_by: string | null;
}

// ─── J. VERIFICATION MARKETPLACE ─────────────────────────────

export interface VerificationRequest extends BaseAuditableRecord {
  request_number: string; // auto-generated: VR-2026-00001
  buyer_org_id: string;
  supplier_org_id: string;
  facility_id: string | null;
  verification_type: 'physical' | 'certificate' | 'material' | 'capacity' | 'esg' | 'social' | 'supply_chain';
  scope: string | null;
  requirements: Record<string, unknown> | null;
  standards: string[];
  requested_date: string;
  preferred_date: string | null;
  deadline_date: string | null;
  budget_min_usd: number | null;
  budget_max_usd: number | null;
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: string;
  notes: string | null;
  created_by: string | null;
}

export interface AuditReport extends BaseAuditableRecord {
  assignment_id: string;
  request_id: string;
  report_title: string;
  overall_rating: 'pass' | 'pass_with_conditions' | 'fail' | null;
  score: number | null;
  findings: Record<string, unknown>[] | null;
  corrective_actions: Record<string, unknown>[] | null;
  audit_date: string | null;
  file_url: string | null;
  digital_signature: string | null;
  is_published: boolean;
  published_at: string | null;
}

// ─── K. NOTIFICATIONS ────────────────────────────────────────

export interface Notification extends BaseRecord {
  organization_id: string | null;
  user_id: string | null;
  alert_rule_id: string | null;
  title: string;
  body: string | null;
  severity: AlertSeverity;
  module: string | null;
  entity_type: string | null;
  entity_id: string | null;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  channel: NotificationChannel;
  sent_at: string;
}

// ─── API HELPERS ─────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}

// ─── AUTH CONTEXT ─────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile;
  organization: Organization;
  role: Role;
  permissions: string[];
}

// ─── DASHBOARD SUMMARY TYPES ──────────────────────────────────

export interface BrandDashboardSummary {
  totalSuppliers: number;
  activeOrders: number;
  pendingTCs: number;
  complianceScore: number;
  riskScore: number;
  openAlerts: number;
  sustainabilityScore: number;
}

export interface SupplierDashboardSummary {
  walletBalance: Array<{ material: string; available_qty: number; unit: string }>;
  pendingOrders: number;
  issuedTCs: number;
  complianceTasks: number;
  overdueTasksCount: number;
}

export interface TcIssuePayload {
  receiverOrgId: string;
  receiverFacilityId?: string;
  orderId?: string;
  issuerFacilityId?: string;
  shipmentDate?: string;
  invoiceNumber?: string;
  lineItems: Array<{
    materialId: string;
    quantity: number;
    unit: string;
    certification?: string;
    certPercentage?: number;
    lotNumber?: string;
    hsCode?: string;
    countryOfOrigin?: string;
  }>;
  notes?: string;
}
