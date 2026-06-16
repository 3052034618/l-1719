
import { Router } from 'express';
import db, { generateId } from '../db.js';

const router = Router();

router.get('/orders', (req, res) => {
  const { status, vehicleId, type, page = 1, pageSize = 20 } = req.query;
  
  let countQuery = 'SELECT COUNT(*) as count FROM maintenance_orders WHERE 1=1';
  let dataQuery = `
    SELECT m.*, v.plate_number, v.brand, v.model
    FROM maintenance_orders m
    JOIN vehicles v ON m.vehicle_id = v.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (status) {
    countQuery += ' AND m.status = ?';
    dataQuery += ' AND m.status = ?';
    params.push(status);
  }
  if (vehicleId) {
    countQuery += ' AND m.vehicle_id = ?';
    dataQuery += ' AND m.vehicle_id = ?';
    params.push(vehicleId);
  }
  if (type) {
    countQuery += ' AND m.type = ?';
    dataQuery += ' AND m.type = ?';
    params.push(type);
  }
  
  dataQuery += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
  
  const { count } = db.prepare(countQuery).get(...params.slice(0, params.length - 2)) as { count: number };
  const orders = db.prepare(dataQuery).all(...params);
  
  const ordersWithParts = orders.map((order: any) => {
    const parts = db.prepare('SELECT * FROM maintenance_parts WHERE order_id = ?').all(order.id);
    return { ...order, parts };
  });
  
  res.json({
    data: ordersWithParts,
    total: count,
    page: Number(page),
    pageSize: Number(pageSize),
  });
});

router.get('/orders/:id', (req, res) => {
  const order = db.prepare(`
    SELECT m.*, v.plate_number, v.brand, v.model, v.mileage as current_mileage
    FROM maintenance_orders m
    JOIN vehicles v ON m.vehicle_id = v.id
    WHERE m.id = ?
  `).get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '维保工单不存在' });
  }
  
  const parts = db.prepare('SELECT * FROM maintenance_parts WHERE order_id = ?').all(req.params.id);
  
  res.json({ ...(order as any), parts });
});

router.post('/orders', (req, res) => {
  const { vehicleId, type, description, mileage, laborCost = 0, parts = [] } = req.body;
  
  const id = generateId();
  const totalPartsCost = parts.reduce((sum: number, p: any) => sum + p.quantity * p.unitPrice, 0);
  const totalCost = laborCost + totalPartsCost;
  
  db.prepare(`
    INSERT INTO maintenance_orders 
    (id, vehicle_id, type, status, mileage, description, labor_cost, total_cost)
    VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)
  `).run(id, vehicleId, type, mileage, description, laborCost, totalCost);
  
  parts.forEach((part: any) => {
    const partId = generateId();
    db.prepare(`
      INSERT INTO maintenance_parts (id, order_id, part_id, part_name, quantity, unit_price)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(partId, id, part.partId, part.partName, part.quantity, part.unitPrice);
  });
  
  const order = db.prepare('SELECT * FROM maintenance_orders WHERE id = ?').get(id);
  res.status(201).json(order);
});

router.put('/orders/:id/status', (req, res) => {
  const { status, engineerId } = req.body;
  
  const order = db.prepare('SELECT * FROM maintenance_orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: '维保工单不存在' });
  }
  
  if (status === 'in_progress') {
    db.prepare(`
      UPDATE maintenance_orders 
      SET status = ?, engineer_id = ?
      WHERE id = ?
    `).run(status, engineerId, req.params.id);
    
    db.prepare("UPDATE vehicles SET status = 'maintenance' WHERE id = ?").run((order as any).vehicle_id);
  } else if (status === 'completed') {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE maintenance_orders 
      SET status = ?, completed_at = ?
      WHERE id = ?
    `).run(status, now, req.params.id);
    
    const parts = db.prepare('SELECT * FROM maintenance_parts WHERE order_id = ?').all(req.params.id);
    parts.forEach((p: any) => {
      db.prepare('UPDATE part_inventory SET quantity = quantity - ? WHERE id = ?')
        .run(p.quantity, p.part_id);
    });
    
    const o = db.prepare('SELECT * FROM maintenance_orders WHERE id = ?').get(req.params.id) as any;
    db.prepare(`
      UPDATE vehicles 
      SET status = 'available', 
          last_maintenance_date = DATE('now'),
          next_maintenance_mileage = mileage + 5000
      WHERE id = ?
    `).run(o.vehicle_id);
  } else {
    db.prepare('UPDATE maintenance_orders SET status = ? WHERE id = ?').run(status, req.params.id);
  }
  
  const updated = db.prepare('SELECT * FROM maintenance_orders WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.get('/parts', (req, res) => {
  const { category, lowStock, search } = req.query;
  
  let query = 'SELECT * FROM part_inventory WHERE 1=1';
  const params: any[] = [];
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (lowStock === 'true') {
    query += ' AND quantity < min_stock';
  }
  if (search) {
    query += ' AND (name LIKE ? OR sku LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }
  
  query += ' ORDER BY name';
  
  const parts = db.prepare(query).all(...params);
  res.json(parts);
});

router.post('/parts', (req, res) => {
  const { name, sku, category, quantity = 0, unitPrice = 0, minStock = 10, location } = req.body;
  
  const id = generateId();
  
  try {
    db.prepare(`
      INSERT INTO part_inventory (id, name, sku, category, quantity, unit_price, min_stock, location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, sku, category, quantity, unitPrice, minStock, location);
    
    const part = db.prepare('SELECT * FROM part_inventory WHERE id = ?').get(id);
    res.status(201).json(part);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/parts/:id', (req, res) => {
  const { name, category, quantity, unitPrice, minStock, location } = req.body;
  
  const part = db.prepare('SELECT * FROM part_inventory WHERE id = ?').get(req.params.id);
  if (!part) {
    return res.status(404).json({ error: '配件不存在' });
  }
  
  db.prepare(`
    UPDATE part_inventory 
    SET name = ?, category = ?, quantity = ?, unit_price = ?, min_stock = ?, location = ?
    WHERE id = ?
  `).run(name, category, quantity, unitPrice, minStock, location, req.params.id);
  
  const updated = db.prepare('SELECT * FROM part_inventory WHERE id = ?').get(req.params.id);
  res.json(updated);
});

export default router;
