
import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/stats', (req, res) => {
  const totalVehicles = db.prepare('SELECT COUNT(*) as count FROM vehicles').get() as { count: number };
  const availableVehicles = db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE status = 'available'").get() as { count: number };
  const rentedVehicles = db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE status = 'rented'").get() as { count: number };
  const maintenanceVehicles = db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE status = 'maintenance'").get() as { count: number };
  
  const totalBookings = db.prepare('SELECT COUNT(*) as count FROM bookings').get() as { count: number };
  const activeBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'active'").get() as { count: number };
  
  const today = new Date().toISOString().split('T')[0];
  const todayBookings = db.prepare(
    "SELECT COUNT(*) as count FROM bookings WHERE DATE(pickup_time) = ?"
  ).get(today) as { count: number };
  
  const rentalRate = totalVehicles.count > 0 ? Math.round((rentedVehicles.count / totalVehicles.count) * 100) : 0;
  
  const completedBookings = db.prepare("SELECT COALESCE(SUM(actual_amount), 0) as revenue FROM bookings WHERE status = 'completed'").get() as { revenue: number };
  const activeEstimated = db.prepare("SELECT COALESCE(SUM(estimated_amount), 0) as revenue FROM bookings WHERE status = 'active'").get() as { revenue: number };
  const monthlyRevenue = completedBookings.revenue + activeEstimated.revenue * 0.5;
  
  const pendingMaintenance = db.prepare("SELECT COUNT(*) as count FROM maintenance_orders WHERE status IN ('pending', 'in_progress')").get() as { count: number };
  const pendingDispatch = db.prepare("SELECT COUNT(*) as count FROM dispatch_plans WHERE status = 'pending_approval'").get() as { count: number };
  const lowStockParts = db.prepare('SELECT COUNT(*) as count FROM part_inventory WHERE quantity < min_stock').get() as { count: number };

  res.json({
    total_vehicles: totalVehicles.count,
    available_vehicles: availableVehicles.count,
    rented_vehicles: rentedVehicles.count,
    maintenance_vehicles: maintenanceVehicles.count,
    total_bookings: totalBookings.count,
    active_bookings: activeBookings.count,
    today_bookings: todayBookings.count,
    rental_rate: rentalRate,
    monthly_revenue: Math.round(monthlyRevenue),
    pending_maintenance: pendingMaintenance.count,
    pending_dispatch: pendingDispatch.count,
    low_stock_parts: lowStockParts.count,
  });
});

router.get('/recent-bookings', (req, res) => {
  const bookings = db.prepare(`
    SELECT b.*, c.name as customer_name, v.plate_number, v.brand, v.model
    FROM bookings b
    LEFT JOIN customers c ON b.customer_id = c.id
    LEFT JOIN vehicles v ON b.vehicle_id = v.id
    ORDER BY b.created_at DESC
    LIMIT 10
  `).all();
  
  res.json(bookings);
});

router.get('/alerts', (req, res) => {
  const alerts = [];
  
  const lowStock = db.prepare('SELECT * FROM part_inventory WHERE quantity < min_stock').all();
  lowStock.forEach((part: any) => {
    alerts.push({
      id: `stock-${part.id}`,
      type: 'warning',
      title: '库存预警',
      message: `${part.name} 库存不足，当前 ${part.quantity} 件`,
      time: new Date().toISOString(),
    });
  });
  
  const pendingMaint = db.prepare(`
    SELECT m.*, v.plate_number
    FROM maintenance_orders m
    JOIN vehicles v ON m.vehicle_id = v.id
    WHERE m.status = 'pending'
    LIMIT 5
  `).all();
  pendingMaint.forEach((m: any) => {
    alerts.push({
      id: `maint-${m.id}`,
      type: 'info',
      title: '维保待处理',
      message: `${m.plate_number} ${m.description}`,
      time: m.created_at,
    });
  });
  
  const pendingPlans = db.prepare(`
    SELECT * FROM dispatch_plans 
    WHERE status = 'pending_approval'
    ORDER BY created_at DESC
    LIMIT 3
  `).all();
  pendingPlans.forEach((p: any) => {
    alerts.push({
      id: `dispatch-${p.id}`,
      type: 'success',
      title: '调度方案待审批',
      message: `${p.date} 调度方案待审批`,
      time: p.created_at,
    });
  });
  
  alerts.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  
  res.json(alerts.slice(0, 10));
});

export default router;
