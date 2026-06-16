
import { Router } from 'express';
import db, { generateId } from '../db.js';

const router = Router();

router.get('/invoices', (req, res) => {
  const { status, customerId, page = 1, pageSize = 20 } = req.query;
  
  let countQuery = 'SELECT COUNT(*) as count FROM invoices WHERE 1=1';
  let dataQuery = `
    SELECT i.*, c.name as customer_name, b.plate_number
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    LEFT JOIN (
      SELECT b.id, v.plate_number 
      FROM bookings b 
      JOIN vehicles v ON b.vehicle_id = v.id
    ) b ON i.booking_id = b.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (status) {
    countQuery += ' AND i.status = ?';
    dataQuery += ' AND i.status = ?';
    params.push(status);
  }
  if (customerId) {
    countQuery += ' AND i.customer_id = ?';
    dataQuery += ' AND i.customer_id = ?';
    params.push(customerId);
  }
  
  dataQuery += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
  
  const { count } = db.prepare(countQuery).get(...params.slice(0, params.length - 2)) as { count: number };
  const invoices = db.prepare(dataQuery).all(...params);
  
  res.json({
    data: invoices,
    total: count,
    page: Number(page),
    pageSize: Number(pageSize),
  });
});

router.get('/invoices/:id', (req, res) => {
  const invoice = db.prepare(`
    SELECT i.*, c.name as customer_name, c.id_card, c.phone,
           b.pickup_time, b.actual_return_time, v.plate_number, v.brand, v.model
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    JOIN bookings b ON i.booking_id = b.id
    JOIN vehicles v ON b.vehicle_id = v.id
    WHERE i.id = ?
  `).get(req.params.id);
  
  if (!invoice) {
    return res.status(404).json({ error: '发票不存在' });
  }
  
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(req.params.id);
  
  res.json({ ...(invoice as any), items });
});

router.post('/invoices/:id/issue', (req, res) => {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!invoice) {
    return res.status(404).json({ error: '发票不存在' });
  }
  
  const now = new Date().toISOString();
  db.prepare("UPDATE invoices SET status = 'issued', issued_at = ? WHERE id = ?")
    .run(now, req.params.id);
  
  const updated = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.post('/invoices/:id/pay', (req, res) => {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!invoice) {
    return res.status(404).json({ error: '发票不存在' });
  }
  
  const now = new Date().toISOString();
  db.prepare("UPDATE invoices SET status = 'paid', paid_at = ? WHERE id = ?")
    .run(now, req.params.id);
  
  const updated = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.post('/calculate', (req, res) => {
  const { vehicleType, pickupTime, returnTime, hasDiscount = false } = req.body;
  
  const pickup = new Date(pickupTime);
  const ret = new Date(returnTime);
  const hours = Math.ceil((ret.getTime() - pickup.getTime()) / (1000 * 60 * 60));
  const days = Math.ceil(hours / 24);
  
  const rateMap: Record<string, number> = {
    economy: 200,
    comfort: 350,
    luxury: 600,
    suv: 450,
  };
  
  const dailyRate = rateMap[vehicleType] || 300;
  let baseAmount = days * dailyRate;
  
  if (hasDiscount && days >= 7) {
    baseAmount *= 0.85;
  } else if (hasDiscount && days >= 3) {
    baseAmount *= 0.9;
  }
  
  const deposit = baseAmount * 0.3;
  const tax = baseAmount * 0.06;
  const totalAmount = baseAmount + tax;
  
  const lateFeeSchedule = [
    { period: '0-24小时', rate: '1.5倍日租金', per: '每小时' },
    { period: '24-72小时', rate: '2倍日租金', per: '每天' },
    { period: '72小时以上', rate: '3倍日租金', per: '每天' },
  ];
  
  res.json({
    days,
    hours,
    dailyRate,
    baseAmount: Math.round(baseAmount * 100) / 100,
    deposit: Math.round(deposit * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    lateFeeSchedule,
  });
});

export default router;
