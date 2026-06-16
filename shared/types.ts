
export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'cleaning';
export type VehicleType = 'economy' | 'comfort' | 'luxury' | 'suv';
export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed';
export type MaintenanceType = 'routine' | 'repair' | 'inspection';
export type DispatchPlanStatus = 'draft' | 'pending' | 'pending_approval' | 'approved' | 'rejected' | 'pushed';
export type AccidentSeverity = 'minor' | 'moderate' | 'severe';
export type ClaimStatus = 'filed' | 'pending' | 'processing' | 'approved' | 'rejected' | 'completed';
export type UserRole = 'admin' | 'manager' | 'store_admin' | 'finance' | 'engineer';
export type AccidentStatus = 'reported' | 'investigating' | 'insurance_claim' | 'settled' | 'closed';
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue';

export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  created_at: string;
}

export interface Vehicle {
  id: string;
  plate_number: string;
  brand: string;
  model: string;
  type: VehicleType;
  year: number;
  color: string;
  mileage: number;
  status: VehicleStatus;
  lat: number;
  lng: number;
  store_id: string;
  daily_rate: number;
  last_maintenance_date?: string;
  next_maintenance_mileage: number;
  created_at: string;
  store_name?: string;
}

export interface Customer {
  id: string;
  name: string;
  id_card: string;
  driver_license: string;
  phone: string;
  email: string;
  credit_score: number;
  has_violation: boolean;
  total_rentals: number;
  created_at: string;
  gender?: string;
  age?: number;
  address?: string;
  license_number?: string;
  license_type?: string;
  rental_count?: number;
}

export interface Booking {
  id: string;
  customer_id: string;
  vehicle_id?: string;
  vehicle_type: VehicleType;
  pickup_store_id: string;
  return_store_id: string;
  pickup_time: string;
  expected_return_time: string;
  actual_return_time?: string;
  status: BookingStatus;
  deposit: number;
  estimated_amount: number;
  actual_amount?: number;
  created_at: string;
  customer_name?: string;
  customer?: Customer;
  vehicle?: Vehicle;
  plate_number?: string;
  phone?: string;
  return_time?: string;
  pickup_store?: string;
  total_amount?: number;
  license_number?: string;
}

export interface DispatchPlan {
  id: string;
  date: string;
  status: DispatchPlanStatus;
  assignments: DispatchAssignment[];
  created_at: string;
  approved_at?: string;
  approved_by?: string;
  plan_date?: string;
  total_assignments?: number;
  expected_revenue?: number;
}

export interface DispatchAssignment {
  id: string;
  plan_id: string;
  booking_id: string;
  vehicle_id: string;
  store_id: string;
  pickup_time: string;
  cleaning_time: number;
  booking?: Booking;
  vehicle?: Vehicle;
}

export interface MaintenanceOrder {
  id: string;
  vehicle_id: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  mileage: number;
  description?: string;
  parts: MaintenancePart[];
  labor_cost: number;
  total_cost: number;
  created_at: string;
  completed_at?: string;
  engineer_id?: string;
  vehicle?: Vehicle;
  plate_number?: string;
  estimated_cost?: number;
}

export interface MaintenancePart {
  id: string;
  order_id: string;
  part_id: string;
  part_name: string;
  quantity: number;
  unit_price: number;
}

export interface PartInventory {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit_price: number;
  min_stock: number;
  location: string;
  created_at: string;
  spec?: string;
  unit?: string;
  price?: number;
}

export interface Invoice {
  id: string;
  booking_id: string;
  customer_id: string;
  amount: number;
  tax: number;
  total_amount: number;
  status: InvoiceStatus;
  issued_at?: string;
  paid_at?: string;
  created_at: string;
  customer?: Customer;
  issue_date?: string;
  customer_name?: string;
  type?: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface AccidentRecord {
  id: string;
  vehicle_id: string;
  booking_id?: string;
  customer_id?: string;
  date: string;
  location: string;
  description: string;
  severity: AccidentSeverity;
  claim_number: string;
  insurance_company: string;
  claim_status: ClaimStatus;
  claim_amount: number;
  created_at: string;
  status?: AccidentStatus;
  vehicle_plate?: string;
  plate_number?: string;
  customer_name?: string;
  accident_time?: string;
  vehicle_type?: string;
  insurance_policy?: string;
  estimated_cost?: number;
  brand?: string;
  model?: string;
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  store_id?: string;
}

export interface DashboardStats {
  total_vehicles: number;
  available_vehicles: number;
  rented_vehicles: number;
  maintenance_vehicles: number;
  total_bookings: number;
  active_bookings: number;
  today_bookings: number;
  rental_rate: number;
  monthly_revenue: number;
  pending_maintenance: number;
  pending_dispatch: number;
  low_stock_parts: number;
}

export interface RentalRateData {
  date: string;
  rate: number;
  total_vehicles: number;
  rented_vehicles: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
}

export interface FailureRateData {
  vehicle_type: string;
  failure_count: number;
  total_count: number;
  rate: number;
}

export interface VehicleLocation {
  id: string;
  plate_number: string;
  status: VehicleStatus;
  lat: number;
  lng: number;
  brand: string;
  model: string;
}
