
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'rental.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      plate_number TEXT NOT NULL UNIQUE,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      type TEXT NOT NULL,
      year INTEGER,
      color TEXT,
      mileage INTEGER DEFAULT 0,
      status TEXT DEFAULT 'available',
      lat REAL DEFAULT 39.9042,
      lng REAL DEFAULT 116.4074,
      store_id TEXT,
      daily_rate REAL NOT NULL,
      last_maintenance_date TEXT,
      next_maintenance_mileage INTEGER DEFAULT 5000,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      id_card TEXT NOT NULL UNIQUE,
      driver_license TEXT NOT NULL UNIQUE,
      phone TEXT,
      email TEXT,
      credit_score INTEGER DEFAULT 700,
      has_violation INTEGER DEFAULT 0,
      total_rentals INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      vehicle_id TEXT,
      vehicle_type TEXT NOT NULL,
      pickup_store_id TEXT NOT NULL,
      return_store_id TEXT NOT NULL,
      pickup_time TEXT NOT NULL,
      expected_return_time TEXT NOT NULL,
      actual_return_time TEXT,
      status TEXT DEFAULT 'pending',
      deposit REAL DEFAULT 0,
      estimated_amount REAL DEFAULT 0,
      actual_amount REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      amount REAL NOT NULL,
      tax REAL NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'draft',
      issued_at TEXT,
      paid_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id)
    );

    CREATE TABLE IF NOT EXISTS maintenance_orders (
      id TEXT PRIMARY KEY,
      vehicle_id TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      mileage INTEGER NOT NULL,
      description TEXT,
      labor_cost REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      engineer_id TEXT,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS maintenance_parts (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      part_id TEXT NOT NULL,
      part_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES maintenance_orders(id),
      FOREIGN KEY (part_id) REFERENCES part_inventory(id)
    );

    CREATE TABLE IF NOT EXISTS part_inventory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      category TEXT,
      quantity INTEGER DEFAULT 0,
      unit_price REAL DEFAULT 0,
      min_stock INTEGER DEFAULT 10,
      location TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS accidents (
      id TEXT PRIMARY KEY,
      vehicle_id TEXT NOT NULL,
      booking_id TEXT,
      customer_id TEXT,
      date TEXT NOT NULL,
      location TEXT,
      description TEXT,
      severity TEXT NOT NULL,
      claim_number TEXT,
      insurance_company TEXT,
      claim_status TEXT DEFAULT 'filed',
      claim_amount REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (booking_id) REFERENCES bookings(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS dispatch_plans (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      approved_at TEXT,
      approved_by TEXT
    );

    CREATE TABLE IF NOT EXISTS dispatch_assignments (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL,
      booking_id TEXT NOT NULL,
      vehicle_id TEXT NOT NULL,
      store_id TEXT NOT NULL,
      pickup_time TEXT NOT NULL,
      cleaning_time INTEGER DEFAULT 120,
      FOREIGN KEY (plan_id) REFERENCES dispatch_plans(id),
      FOREIGN KEY (booking_id) REFERENCES bookings(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      store_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
    CREATE INDEX IF NOT EXISTS idx_vehicles_store ON vehicles(store_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_pickup_time ON bookings(pickup_time);
    CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_orders(status);
    CREATE INDEX IF NOT EXISTS idx_dispatch_date ON dispatch_plans(date);
  `);
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function seedData() {
  const storeCount = db.prepare('SELECT COUNT(*) as count FROM stores').get() as { count: number };
  if (storeCount.count > 0) return;

  const stores = [
    { id: 'store-001', name: '北京朝阳门店', address: '北京市朝阳区建国路88号', phone: '010-12345678' },
    { id: 'store-002', name: '北京海淀门店', address: '北京市海淀区中关村大街1号', phone: '010-87654321' },
    { id: 'store-003', name: '上海浦东门店', address: '上海市浦东新区陆家嘴环路1000号', phone: '021-12345678' },
  ];

  const insertStore = db.prepare('INSERT INTO stores (id, name, address, phone) VALUES (?, ?, ?, ?)');
  stores.forEach(store => insertStore.run(store.id, store.name, store.address, store.phone));

  const vehicles = [
    { plateNumber: '京A12345', brand: '大众', model: '朗逸', type: 'economy', year: 2022, color: '白色', mileage: 28000, status: 'available', lat: 39.92, lng: 116.46, storeId: 'store-001', dailyRate: 199, nextMaintenanceMileage: 30000 },
    { plateNumber: '京B23456', brand: '丰田', model: '卡罗拉', type: 'economy', year: 2023, color: '银色', mileage: 15000, status: 'available', lat: 39.93, lng: 116.45, storeId: 'store-001', dailyRate: 219, nextMaintenanceMileage: 20000 },
    { plateNumber: '京C34567', brand: '本田', model: '雅阁', type: 'comfort', year: 2022, color: '黑色', mileage: 32000, status: 'rented', lat: 39.91, lng: 116.44, storeId: 'store-001', dailyRate: 349, nextMaintenanceMileage: 35000 },
    { plateNumber: '京D45678', brand: '奥迪', model: 'A4L', type: 'luxury', year: 2023, color: '黑色', mileage: 18000, status: 'available', lat: 39.94, lng: 116.43, storeId: 'store-001', dailyRate: 599, nextMaintenanceMileage: 20000 },
    { plateNumber: '京E56789', brand: '宝马', model: 'X5', type: 'suv', year: 2022, color: '白色', mileage: 42000, status: 'maintenance', lat: 39.95, lng: 116.47, storeId: 'store-001', dailyRate: 899, nextMaintenanceMileage: 45000, lastMaintenanceDate: '2026-05-15' },
    { plateNumber: '京F67890', brand: '日产', model: '轩逸', type: 'economy', year: 2023, color: '白色', mileage: 12000, status: 'available', lat: 39.96, lng: 116.32, storeId: 'store-002', dailyRate: 189, nextMaintenanceMileage: 15000 },
    { plateNumber: '京G78901', brand: '别克', model: '君威', type: 'comfort', year: 2022, color: '灰色', mileage: 35000, status: 'rented', lat: 39.97, lng: 116.31, storeId: 'store-002', dailyRate: 329, nextMaintenanceMileage: 40000 },
    { plateNumber: '京H89012', brand: '奔驰', model: 'C260L', type: 'luxury', year: 2023, color: '白色', mileage: 8000, status: 'available', lat: 39.98, lng: 116.30, storeId: 'store-002', dailyRate: 649, nextMaintenanceMileage: 10000 },
    { plateNumber: '沪A12345', brand: '大众', model: '帕萨特', type: 'comfort', year: 2022, color: '黑色', mileage: 25000, status: 'available', lat: 31.23, lng: 121.47, storeId: 'store-003', dailyRate: 359, nextMaintenanceMileage: 30000 },
    { plateNumber: '沪B23456', brand: '特斯拉', model: 'Model 3', type: 'luxury', year: 2023, color: '红色', mileage: 20000, status: 'rented', lat: 31.24, lng: 121.48, storeId: 'store-003', dailyRate: 699, nextMaintenanceMileage: 25000 },
    { plateNumber: '沪C34567', brand: '比亚迪', model: '宋PLUS', type: 'suv', year: 2023, color: '蓝色', mileage: 10000, status: 'cleaning', lat: 31.22, lng: 121.46, storeId: 'store-003', dailyRate: 279, nextMaintenanceMileage: 15000 },
    { plateNumber: '沪D45678', brand: '丰田', model: '汉兰达', type: 'suv', year: 2022, color: '白色', mileage: 48000, status: 'available', lat: 31.25, lng: 121.49, storeId: 'store-003', dailyRate: 549, nextMaintenanceMileage: 50000, lastMaintenanceDate: '2026-04-20' },
  ];

  const insertVehicle = db.prepare(`
    INSERT INTO vehicles (id, plate_number, brand, model, type, year, color, mileage, status, lat, lng, store_id, daily_rate, next_maintenance_mileage, last_maintenance_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  vehicles.forEach(v => {
    insertVehicle.run(
      generateId(), v.plateNumber, v.brand, v.model, v.type, v.year, v.color,
      v.mileage, v.status, v.lat, v.lng, v.storeId, v.dailyRate,
      v.nextMaintenanceMileage, v.lastMaintenanceDate || null
    );
  });

  const customers = [
    { name: '张伟', idCard: '110101199001011234', driverLicense: '110101199001011234', phone: '13800138001', email: 'zhangwei@example.com', creditScore: 750, hasViolation: 0, totalRentals: 12 },
    { name: '李娜', idCard: '110101199203045678', driverLicense: '110101199203045678', phone: '13900139002', email: 'lina@example.com', creditScore: 820, hasViolation: 0, totalRentals: 25 },
    { name: '王强', idCard: '310101198805059012', driverLicense: '310101198805059012', phone: '13700137003', email: 'wangqiang@example.com', creditScore: 650, hasViolation: 1, totalRentals: 5 },
    { name: '刘芳', idCard: '320101199512123456', driverLicense: '320101199512123456', phone: '13600136004', email: 'liufang@example.com', creditScore: 780, hasViolation: 0, totalRentals: 18 },
    { name: '陈明', idCard: '440101199308087890', driverLicense: '440101199308087890', phone: '13500135005', email: 'chenming@example.com', creditScore: 710, hasViolation: 1, totalRentals: 8 },
    { name: '赵丽', idCard: '510101199606062345', driverLicense: '510101199606062345', phone: '13400134006', email: 'zhaoli@example.com', creditScore: 680, hasViolation: 0, totalRentals: 3 },
  ];

  const insertCustomer = db.prepare(`
    INSERT INTO customers (id, name, id_card, driver_license, phone, email, credit_score, has_violation, total_rentals)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  customers.forEach(c => {
    insertCustomer.run(generateId(), c.name, c.idCard, c.driverLicense, c.phone, c.email, c.creditScore, c.hasViolation, c.totalRentals);
  });

  const allCustomers = db.prepare('SELECT * FROM customers').all() as any[];
  const allVehicles = db.prepare('SELECT * FROM vehicles').all() as any[];

  const insertBooking = db.prepare(`
    INSERT INTO bookings (id, customer_id, vehicle_id, vehicle_type, pickup_store_id, return_store_id, pickup_time, expected_return_time, actual_return_time, status, deposit, estimated_amount, actual_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const today = new Date();
  const bookingsData = [
    { customerIdx: 0, vehicleIdx: 2, vehicleType: 'comfort', status: 'active', days: 3, offset: -1 },
    { customerIdx: 1, vehicleIdx: 6, vehicleType: 'comfort', status: 'active', days: 2, offset: 0 },
    { customerIdx: 2, vehicleIdx: 9, vehicleType: 'luxury', status: 'active', days: 5, offset: -2 },
    { customerIdx: 3, vehicleIdx: -1, vehicleType: 'economy', status: 'confirmed', days: 2, offset: 1 },
    { customerIdx: 4, vehicleIdx: -1, vehicleType: 'suv', status: 'pending', days: 3, offset: 2 },
    { customerIdx: 5, vehicleIdx: -1, vehicleType: 'luxury', status: 'pending', days: 1, offset: 1 },
  ];

  bookingsData.forEach(b => {
    const customer = allCustomers[b.customerIdx];
    const vehicle = b.vehicleIdx >= 0 ? allVehicles[b.vehicleIdx] : null;
    const pickupDate = new Date(today);
    pickupDate.setDate(pickupDate.getDate() + b.offset);
    const returnDate = new Date(pickupDate);
    returnDate.setDate(returnDate.getDate() + b.days);
    
    const dailyRate = vehicle ? vehicle.daily_rate : 300;
    const estimated = dailyRate * b.days;
    const deposit = estimated * 0.3;

    insertBooking.run(
      generateId(),
      customer.id,
      vehicle?.id || null,
      b.vehicleType,
      vehicle?.store_id || 'store-001',
      vehicle?.store_id || 'store-001',
      pickupDate.toISOString(),
      returnDate.toISOString(),
      b.status === 'completed' ? returnDate.toISOString() : null,
      b.status,
      deposit,
      estimated,
      b.status === 'completed' ? estimated : null
    );
  });

  const parts = [
    { name: '机油', sku: 'OIL-001', category: '润滑系统', quantity: 50, unitPrice: 89, minStock: 20, location: 'A-01' },
    { name: '机油滤芯', sku: 'FIL-001', category: '滤清器', quantity: 40, unitPrice: 35, minStock: 15, location: 'A-02' },
    { name: '空气滤芯', sku: 'FIL-002', category: '滤清器', quantity: 30, unitPrice: 45, minStock: 15, location: 'A-03' },
    { name: '刹车片（前）', sku: 'BRA-001', category: '制动系统', quantity: 15, unitPrice: 280, minStock: 10, location: 'B-01' },
    { name: '刹车片（后）', sku: 'BRA-002', category: '制动系统', quantity: 18, unitPrice: 220, minStock: 10, location: 'B-02' },
    { name: '轮胎（米其林）', sku: 'TYR-001', category: '轮胎', quantity: 8, unitPrice: 850, minStock: 10, location: 'C-01' },
    { name: '雨刮片', sku: 'WIP-001', category: '电气系统', quantity: 25, unitPrice: 60, minStock: 10, location: 'D-01' },
    { name: '蓄电池', sku: 'BAT-001', category: '电气系统', quantity: 5, unitPrice: 520, minStock: 5, location: 'D-02' },
  ];

  const insertPart = db.prepare(`
    INSERT INTO part_inventory (id, name, sku, category, quantity, unit_price, min_stock, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  parts.forEach(p => {
    insertPart.run(generateId(), p.name, p.sku, p.category, p.quantity, p.unitPrice, p.minStock, p.location);
  });

  const maintenanceOrders = [
    { vehicleIdx: 4, type: 'routine', status: 'in_progress', mileage: 42000, laborCost: 200 },
    { vehicleIdx: 3, type: 'inspection', status: 'pending', mileage: 18000, laborCost: 150 },
  ];

  const insertMaintOrder = db.prepare(`
    INSERT INTO maintenance_orders (id, vehicle_id, type, status, mileage, description, labor_cost, total_cost)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  maintenanceOrders.forEach(m => {
    const vehicle = allVehicles[m.vehicleIdx];
    const totalCost = m.laborCost + 89 + 35;
    insertMaintOrder.run(
      generateId(), vehicle.id, m.type, m.status, m.mileage,
      `${m.type === 'routine' ? '常规保养' : '安全检查'}`,
      m.laborCost, totalCost
    );
  });

  const allMaintOrders = db.prepare('SELECT * FROM maintenance_orders').all() as any[];
  const allParts = db.prepare('SELECT * FROM part_inventory').all() as any[];
  
  const insertMaintPart = db.prepare(`
    INSERT INTO maintenance_parts (id, order_id, part_id, part_name, quantity, unit_price)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  allMaintOrders.forEach((order: any) => {
    insertMaintPart.run(generateId(), order.id, allParts[0].id, allParts[0].name, 1, allParts[0].unit_price);
    insertMaintPart.run(generateId(), order.id, allParts[1].id, allParts[1].name, 1, allParts[1].unit_price);
  });

  const accidents = [
    { vehicleIdx: 4, customerIdx: -1, date: '2026-05-20', location: '北京市朝阳区', description: '倒车时轻微刮蹭', severity: 'minor', claimNumber: 'CLM20260520001', insuranceCompany: '中国平安', claimStatus: 'approved', claimAmount: 800 },
  ];

  const insertAccident = db.prepare(`
    INSERT INTO accidents (id, vehicle_id, booking_id, customer_id, date, location, description, severity, claim_number, insurance_company, claim_status, claim_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  accidents.forEach(a => {
    const vehicle = allVehicles[a.vehicleIdx];
    insertAccident.run(
      generateId(), vehicle.id, null, a.customerIdx >= 0 ? allCustomers[a.customerIdx].id : null,
      a.date, a.location, a.description, a.severity,
      a.claimNumber, a.insuranceCompany, a.claimStatus, a.claimAmount
    );
  });

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, role, name, store_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(generateId(), 'admin', 'admin123', 'manager', '系统管理员', null);
  insertUser.run(generateId(), 'store1', 'store123', 'store_admin', '朝阳店长', 'store-001');
  insertUser.run(generateId(), 'finance1', 'finance123', 'finance', '财务小王', null);
  insertUser.run(generateId(), 'engineer1', 'eng123', 'engineer', '张工', 'store-001');
}

initDatabase();
seedData();

export { db, generateId };
export default db;
