
import { Router } from 'express';
import db, { generateId } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const { status, type, storeId, search } = req.query;
  
  let query = 'SELECT * FROM vehicles WHERE 1=1';
  const params: any[] = [];
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (storeId) {
    query += ' AND store_id = ?';
    params.push(storeId);
  }
  if (search) {
    query += ' AND (plate_number LIKE ? OR brand LIKE ? OR model LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const vehicles = db.prepare(query).all(...params);
  res.json(vehicles);
});

router.get('/locations', (req, res) => {
  const vehicles = db.prepare(`
    SELECT id, plate_number, status, lat, lng, brand, model, type
    FROM vehicles
  `).all();
  
  res.json(vehicles.map((v: any) => ({
    id: v.id,
    plate_number: v.plate_number,
    status: v.status,
    lat: v.lat,
    lng: v.lng,
    brand: v.brand,
    model: v.model,
    type: v.type,
  })));
});

router.get('/:id', (req, res) => {
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  
  if (!vehicle) {
    return res.status(404).json({ error: '车辆不存在' });
  }
  
  const store = db.prepare('SELECT * FROM stores WHERE id = ?').get((vehicle as any).store_id);
  const maintenances = db.prepare(`
    SELECT * FROM maintenance_orders 
    WHERE vehicle_id = ? 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all(req.params.id);
  const bookings = db.prepare(`
    SELECT b.*, c.name as customer_name
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    WHERE b.vehicle_id = ?
    ORDER BY b.pickup_time DESC
    LIMIT 10
  `).all(req.params.id);
  
  res.json({ ...(vehicle as any), store, maintenances, bookings });
});

router.post('/', (req, res) => {
  const { plateNumber, brand, model, type, year, color, storeId, dailyRate, mileage = 0 } = req.body;
  
  const id = generateId();
  
  db.prepare(`
    INSERT INTO vehicles (id, plate_number, brand, model, type, year, color, mileage, store_id, daily_rate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, plateNumber, brand, model, type, year, color, mileage, storeId, dailyRate);
  
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
  res.status(201).json(vehicle);
});

router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  if (!vehicle) {
    return res.status(404).json({ error: '车辆不存在' });
  }
  
  db.prepare('UPDATE vehicles SET status = ? WHERE id = ?').run(status, req.params.id);
  
  const updated = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.put('/:id', (req, res) => {
  const { plateNumber, brand, model, type, year, color, storeId, dailyRate, lat, lng } = req.body;
  
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  if (!vehicle) {
    return res.status(404).json({ error: '车辆不存在' });
  }
  
  db.prepare(`
    UPDATE vehicles 
    SET plate_number = ?, brand = ?, model = ?, type = ?, year = ?, 
        color = ?, store_id = ?, daily_rate = ?, lat = ?, lng = ?
    WHERE id = ?
  `).run(plateNumber, brand, model, type, year, color, storeId, dailyRate, lat, lng, req.params.id);
  
  const updated = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  res.json(updated);
});

export default router;
