
import { Router } from 'express';
import db, { generateId } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const { search, page = 1, pageSize = 20 } = req.query;
  
  let countQuery = 'SELECT COUNT(*) as count FROM customers WHERE 1=1';
  let dataQuery = 'SELECT * FROM customers WHERE 1=1';
  const params: any[] = [];
  
  if (search) {
    countQuery += ' AND (name LIKE ? OR phone LIKE ? OR id_card LIKE ?)';
    dataQuery += ' AND (name LIKE ? OR phone LIKE ? OR id_card LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  dataQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
  
  const { count } = db.prepare(countQuery).get(...params.slice(0, params.length - 2)) as { count: number };
  const customers = db.prepare(dataQuery).all(...params);
  
  res.json({
    data: customers,
    total: count,
    page: Number(page),
    pageSize: Number(pageSize),
  });
});

router.get('/:id', (req, res) => {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  
  if (!customer) {
    return res.status(404).json({ error: '客户不存在' });
  }
  
  const bookings = db.prepare(`
    SELECT b.*, v.plate_number, v.brand, v.model
    FROM bookings b
    LEFT JOIN vehicles v ON b.vehicle_id = v.id
    WHERE b.customer_id = ?
    ORDER BY b.created_at DESC
    LIMIT 20
  `).all(req.params.id);
  
  res.json({ ...(customer as any), bookings });
});

router.post('/', (req, res) => {
  const { name, idCard, driverLicense, phone, email, creditScore = 700 } = req.body;
  
  const id = generateId();
  
  try {
    db.prepare(`
      INSERT INTO customers (id, name, id_card, driver_license, phone, email, credit_score)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, idCard, driverLicense, phone, email, creditScore);
    
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    res.status(201).json(customer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, phone, email, creditScore, hasViolation } = req.body;
  
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: '客户不存在' });
  }
  
  db.prepare(`
    UPDATE customers 
    SET name = ?, phone = ?, email = ?, credit_score = ?, has_violation = ?
    WHERE id = ?
  `).run(name, phone, email, creditScore, hasViolation ? 1 : 0, req.params.id);
  
  const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  res.json(updated);
});

export default router;
