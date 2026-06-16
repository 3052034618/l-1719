
import { Router } from 'express';
import db, { generateId } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const stores = db.prepare(`
    SELECT s.*, 
           COUNT(v.id) as vehicle_count,
           SUM(CASE WHEN v.status = 'available' THEN 1 ELSE 0 END) as available_count
    FROM stores s
    LEFT JOIN vehicles v ON s.id = v.store_id
    GROUP BY s.id
    ORDER BY s.name
  `).all();
  
  res.json(stores);
});

router.get('/:id', (req, res) => {
  const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(req.params.id);
  
  if (!store) {
    return res.status(404).json({ error: '门店不存在' });
  }
  
  const vehicles = db.prepare('SELECT * FROM vehicles WHERE store_id = ?').all(req.params.id);
  const staff = db.prepare('SELECT id, name, role, username FROM users WHERE store_id = ?').all(req.params.id);
  
  res.json({ ...(store as any), vehicles, staff });
});

router.post('/', (req, res) => {
  const { name, address, phone } = req.body;
  
  const id = generateId();
  
  db.prepare('INSERT INTO stores (id, name, address, phone) VALUES (?, ?, ?, ?)')
    .run(id, name, address, phone);
  
  const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(id);
  res.status(201).json(store);
});

export default router;
