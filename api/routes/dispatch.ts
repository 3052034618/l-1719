
import { Router } from 'express';
import db, { generateId } from '../db.js';

const router = Router();

router.get('/plans', (req, res) => {
  const { status, date } = req.query;
  
  let query = 'SELECT * FROM dispatch_plans WHERE 1=1';
  const params: any[] = [];
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (date) {
    query += ' AND date = ?';
    params.push(date);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const plans = db.prepare(query).all(...params);
  
  const plansWithAssignments = plans.map((plan: any) => {
    const assignments = db.prepare(`
      SELECT da.*, b.customer_id, b.vehicle_type, b.pickup_time as booking_pickup_time,
             c.name as customer_name, v.plate_number, v.brand, v.model
      FROM dispatch_assignments da
      JOIN bookings b ON da.booking_id = b.id
      JOIN customers c ON b.customer_id = c.id
      LEFT JOIN vehicles v ON da.vehicle_id = v.id
      WHERE da.plan_id = ?
      ORDER BY da.pickup_time
    `).all(plan.id);
    
    return { ...plan, assignments };
  });
  
  res.json(plansWithAssignments);
});

router.post('/generate', (req, res) => {
  const { date } = req.body;
  const planDate = date || new Date().toISOString().split('T')[0];
  
  const existingPlan = db.prepare('SELECT * FROM dispatch_plans WHERE date = ?').get(planDate);
  if (existingPlan) {
    return res.status(400).json({ error: '当日调度方案已存在' });
  }
  
  const pendingBookings = db.prepare(`
    SELECT b.*, c.name as customer_name, c.credit_score
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    WHERE b.status IN ('pending', 'confirmed')
      AND DATE(b.pickup_time) = ?
    ORDER BY c.credit_score DESC, b.created_at ASC
  `).all(planDate);
  
  const availableVehicles = db.prepare(`
    SELECT * FROM vehicles 
    WHERE status = 'available'
    ORDER BY daily_rate ASC
  `).all();
  
  const planId = generateId();
  db.prepare(`
    INSERT INTO dispatch_plans (id, date, status)
    VALUES (?, ?, 'pending_approval')
  `).run(planId, planDate);
  
  const vehicleTypeMap: Record<string, any[]> = {};
  availableVehicles.forEach((v: any) => {
    if (!vehicleTypeMap[v.type]) {
      vehicleTypeMap[v.type] = [];
    }
    vehicleTypeMap[v.type].push(v);
  });
  
  const assignments: any[] = [];
  const usedVehicles = new Set<string>();
  
  pendingBookings.forEach((booking: any) => {
    const typeVehicles = vehicleTypeMap[booking.vehicle_type] || [];
    const availableTypeVehicles = typeVehicles.filter(v => !usedVehicles.has(v.id));
    
    if (availableTypeVehicles.length > 0) {
      const vehicle = availableTypeVehicles[0];
      usedVehicles.add(vehicle.id);
      
      const assignmentId = generateId();
      db.prepare(`
        INSERT INTO dispatch_assignments 
        (id, plan_id, booking_id, vehicle_id, store_id, pickup_time, cleaning_time)
        VALUES (?, ?, ?, ?, ?, ?, 120)
      `).run(assignmentId, planId, booking.id, vehicle.id, vehicle.store_id, booking.pickup_time);
      
      assignments.push({
        id: assignmentId,
        bookingId: booking.id,
        vehicleId: vehicle.id,
        vehiclePlate: vehicle.plate_number,
        customerName: booking.customer_name,
        pickupTime: booking.pickup_time,
        cleaningTime: 120,
      });
    }
  });
  
  const plan = db.prepare('SELECT * FROM dispatch_plans WHERE id = ?').get(planId);
  
  res.status(201).json({
    ...(plan as any),
    assignments,
    totalBookings: pendingBookings.length,
    assignedBookings: assignments.length,
    unassignedBookings: pendingBookings.length - assignments.length,
  });
});

router.put('/plans/:id/approve', (req, res) => {
  const { approved, approvedBy } = req.body;
  
  const plan = db.prepare('SELECT * FROM dispatch_plans WHERE id = ?').get(req.params.id);
  if (!plan) {
    return res.status(404).json({ error: '调度方案不存在' });
  }
  
  const newStatus = approved ? 'approved' : 'rejected';
  const now = new Date().toISOString();
  
  if (approved) {
    db.prepare(`
      UPDATE dispatch_plans 
      SET status = ?, approved_at = ?, approved_by = ?
      WHERE id = ?
    `).run(newStatus, now, approvedBy || '系统管理员', req.params.id);
    
    const assignments = db.prepare('SELECT * FROM dispatch_assignments WHERE plan_id = ?').all(req.params.id);
    assignments.forEach((a: any) => {
      db.prepare('UPDATE bookings SET status = ?, vehicle_id = ? WHERE id = ?')
        .run('confirmed', a.vehicle_id, a.booking_id);
    });
  } else {
    db.prepare(`
      UPDATE dispatch_plans 
      SET status = ?, approved_at = ?, approved_by = ?
      WHERE id = ?
    `).run(newStatus, now, approvedBy || '系统管理员', req.params.id);
  }
  
  const updated = db.prepare('SELECT * FROM dispatch_plans WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.post('/plans/:id/push', (req, res) => {
  const plan = db.prepare('SELECT * FROM dispatch_plans WHERE id = ?').get(req.params.id);
  if (!plan) {
    return res.status(404).json({ error: '调度方案不存在' });
  }
  
  if ((plan as any).status !== 'approved') {
    return res.status(400).json({ error: '方案未审批，无法推送' });
  }
  
  const assignments = db.prepare(`
    SELECT da.*, s.name as store_name
    FROM dispatch_assignments da
    JOIN stores s ON da.store_id = s.id
    WHERE da.plan_id = ?
  `).all(req.params.id);
  
  const storeGroups = new Map<string, number>();
  assignments.forEach((a: any) => {
    storeGroups.set(a.store_id, (storeGroups.get(a.store_id) || 0) + 1);
  });
  
  res.json({
    success: true,
    message: `已推送到 ${storeGroups.size} 个门店，共 ${assignments.length} 条分配记录`,
    storeCount: storeGroups.size,
    assignmentCount: assignments.length,
  });
});

export default router;
