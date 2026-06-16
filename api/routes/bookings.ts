
import { Router } from 'express';
import db, { generateId } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const { status, customerId, vehicleType, page = 1, pageSize = 20 } = req.query;
  
  let countQuery = 'SELECT COUNT(*) as count FROM bookings WHERE 1=1';
  let dataQuery = `
    SELECT b.*, c.name as customer_name, c.phone as phone,
           v.plate_number, v.brand, v.model
    FROM bookings b
    LEFT JOIN customers c ON b.customer_id = c.id
    LEFT JOIN vehicles v ON b.vehicle_id = v.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (status) {
    countQuery += ' AND b.status = ?';
    dataQuery += ' AND b.status = ?';
    params.push(status);
  }
  if (customerId) {
    countQuery += ' AND b.customer_id = ?';
    dataQuery += ' AND b.customer_id = ?';
    params.push(customerId);
  }
  if (vehicleType) {
    countQuery += ' AND b.vehicle_type = ?';
    dataQuery += ' AND b.vehicle_type = ?';
    params.push(vehicleType);
  }
  
  dataQuery += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
  
  const { count } = db.prepare(countQuery).get(...params.slice(0, params.length - 2)) as { count: number };
  const bookings = db.prepare(dataQuery).all(...params);
  
  res.json({
    data: bookings,
    total: count,
    page: Number(page),
    pageSize: Number(pageSize),
  });
});

router.get('/:id', (req, res) => {
  const booking = db.prepare(`
    SELECT b.*, c.name as customer_name, c.phone as phone, 
           c.id_card, c.driver_license, c.credit_score, c.has_violation,
           v.plate_number, v.brand, v.model, v.daily_rate
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    LEFT JOIN vehicles v ON b.vehicle_id = v.id
    WHERE b.id = ?
  `).get(req.params.id);
  
  if (!booking) {
    return res.status(404).json({ error: '预订不存在' });
  }
  
  res.json(booking);
});

router.post('/', (req, res) => {
  const { 
    customerId, vehicleType, pickupStoreId, returnStoreId,
    pickupTime, expectedReturnTime, deposit, estimatedAmount
  } = req.body;
  
  const id = generateId();
  
  db.prepare(`
    INSERT INTO bookings (id, customer_id, vehicle_type, pickup_store_id, return_store_id,
                          pickup_time, expected_return_time, deposit, estimated_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(id, customerId, vehicleType, pickupStoreId, returnStoreId,
         pickupTime, expectedReturnTime, deposit || 0, estimatedAmount || 0);
  
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
  res.status(201).json(booking);
});

router.put('/:id/status', (req, res) => {
  const { status, vehicleId } = req.body;
  
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) {
    return res.status(404).json({ error: '预订不存在' });
  }
  
  if (vehicleId) {
    db.prepare('UPDATE bookings SET status = ?, vehicle_id = ? WHERE id = ?')
      .run(status, vehicleId, req.params.id);
  } else {
    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, req.params.id);
  }
  
  if (status === 'active' && vehicleId) {
    db.prepare("UPDATE vehicles SET status = 'rented' WHERE id = ?").run(vehicleId);
  }
  
  if (status === 'completed') {
    const b = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id) as any;
    if (b.vehicle_id) {
      db.prepare("UPDATE vehicles SET status = 'cleaning' WHERE id = ?").run(b.vehicle_id);
    }
  }
  
  const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  res.json(updated);
});

export default router;
