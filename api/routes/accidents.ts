
import { Router } from 'express';
import db, { generateId } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const { severity, claimStatus, page = 1, pageSize = 20 } = req.query;
  
  let countQuery = 'SELECT COUNT(*) as count FROM accidents WHERE 1=1';
  let dataQuery = `
    SELECT a.*, v.plate_number, v.brand, v.model, c.name as customer_name
    FROM accidents a
    JOIN vehicles v ON a.vehicle_id = v.id
    LEFT JOIN customers c ON a.customer_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (severity) {
    countQuery += ' AND a.severity = ?';
    dataQuery += ' AND a.severity = ?';
    params.push(severity);
  }
  if (claimStatus) {
    countQuery += ' AND a.claim_status = ?';
    dataQuery += ' AND a.claim_status = ?';
    params.push(claimStatus);
  }
  
  dataQuery += ' ORDER BY a.date DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
  
  const { count } = db.prepare(countQuery).get(...params.slice(0, params.length - 2)) as { count: number };
  const accidents = db.prepare(dataQuery).all(...params);
  
  res.json({
    data: accidents,
    total: count,
    page: Number(page),
    pageSize: Number(pageSize),
  });
});

router.get('/:id', (req, res) => {
  const accident = db.prepare(`
    SELECT a.*, v.plate_number, v.brand, v.model, 
           c.name as customer_name, c.phone as customer_phone
    FROM accidents a
    JOIN vehicles v ON a.vehicle_id = v.id
    LEFT JOIN customers c ON a.customer_id = c.id
    WHERE a.id = ?
  `).get(req.params.id);
  
  if (!accident) {
    return res.status(404).json({ error: '事故记录不存在' });
  }
  
  res.json(accident);
});

router.post('/', (req, res) => {
  const { 
    vehicleId, bookingId, customerId, date, location, 
    description, severity, claimNumber, insuranceCompany, claimAmount = 0 
  } = req.body;
  
  const id = generateId();
  
  db.prepare(`
    INSERT INTO accidents 
    (id, vehicle_id, booking_id, customer_id, date, location, description, 
     severity, claim_number, insurance_company, claim_amount, claim_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'filed')
  `).run(id, vehicleId, bookingId || null, customerId || null, date, location, 
         description, severity, claimNumber, insuranceCompany, claimAmount);
  
  const accident = db.prepare('SELECT * FROM accidents WHERE id = ?').get(id);
  res.status(201).json(accident);
});

router.put('/:id', (req, res) => {
  const { 
    date, location, description, severity, 
    claimNumber, insuranceCompany, claimStatus, claimAmount 
  } = req.body;
  
  const accident = db.prepare('SELECT * FROM accidents WHERE id = ?').get(req.params.id);
  if (!accident) {
    return res.status(404).json({ error: '事故记录不存在' });
  }
  
  db.prepare(`
    UPDATE accidents 
    SET date = ?, location = ?, description = ?, severity = ?,
        claim_number = ?, insurance_company = ?, claim_status = ?, claim_amount = ?
    WHERE id = ?
  `).run(date, location, description, severity, claimNumber, 
         insuranceCompany, claimStatus, claimAmount, req.params.id);
  
  const updated = db.prepare('SELECT * FROM accidents WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.put('/:id/claim-status', (req, res) => {
  const { claimStatus } = req.body;
  
  const accident = db.prepare('SELECT * FROM accidents WHERE id = ?').get(req.params.id);
  if (!accident) {
    return res.status(404).json({ error: '事故记录不存在' });
  }
  
  db.prepare('UPDATE accidents SET claim_status = ? WHERE id = ?')
    .run(claimStatus, req.params.id);
  
  const updated = db.prepare('SELECT * FROM accidents WHERE id = ?').get(req.params.id);
  res.json(updated);
});

export default router;
