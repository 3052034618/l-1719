
import { Router } from 'express';
import db, { generateId } from '../db.js';

const router = Router();

router.get('/check-license', (req, res) => {
  const { licenseNumber, idCard, bookingId } = req.query;
  
  let customer;
  
  if (bookingId) {
    const booking = db.prepare(`
      SELECT b.*, c.*
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      WHERE b.id = ?
    `).get(bookingId);
    
    if (!booking) {
      return res.status(404).json({ valid: false, message: '预订不存在' });
    }
    
    customer = booking;
  } else if (licenseNumber && idCard) {
    customer = db.prepare(`
      SELECT * FROM customers 
      WHERE driver_license = ? AND id_card = ?
    `).get(licenseNumber, idCard);
    
    if (!customer) {
      return res.json({ valid: false, message: '驾照信息不匹配' });
    }
  } else {
    return res.status(400).json({ valid: false, message: '参数不完整' });
  }
  
  const c = customer as any;
  
  const hasViolation = !!c.has_violation;
  const creditScore = c.credit_score || 0;
  const needsDeposit = creditScore < 650 || hasViolation;
  const depositAmount = creditScore < 650 ? 5000 : (hasViolation ? 3000 : 0);
  
  res.json({
    valid: true,
    licenseValid: true,
    violations: hasViolation ? 2 : 0,
    hasViolation,
    creditScore,
    needsDeposit,
    depositAmount,
    canPickup: true,
    customer: {
      id: c.id,
      name: c.name,
      phone: c.phone,
      idCard: c.id_card,
      driverLicense: c.driver_license,
      creditScore,
      totalRentals: c.total_rentals,
    },
  });
});

router.post('/pickup', (req, res) => {
  const { bookingId, mileage } = req.body;
  
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) {
    return res.status(404).json({ error: '预订不存在' });
  }
  
  const b = booking as any;
  
  if (b.status !== 'confirmed') {
    return res.status(400).json({ error: '预订状态不正确，无法取车' });
  }
  
  if (!b.vehicle_id) {
    return res.status(400).json({ error: '未分配车辆' });
  }
  
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(b.customer_id) as any;
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(b.vehicle_id) as any;
  
  const now = new Date().toISOString();
  
  db.prepare(`
    UPDATE bookings 
    SET status = 'active', pickup_time = ?
    WHERE id = ?
  `).run(now, bookingId);
  
  db.prepare("UPDATE vehicles SET status = 'rented', mileage = ? WHERE id = ?")
    .run(mileage || vehicle.mileage, b.vehicle_id);
  
  db.prepare('UPDATE customers SET total_rentals = total_rentals + 1 WHERE id = ?')
    .run(b.customer_id);
  
  const contract = {
    contractNumber: `CT-${Date.now()}`,
    customerName: customer.name,
    customerIdCard: customer.id_card,
    vehiclePlate: vehicle.plate_number,
    vehicleBrand: vehicle.brand,
    vehicleModel: vehicle.model,
    pickupTime: now,
    expectedReturnTime: b.expected_return_time,
    dailyRate: vehicle.daily_rate,
    deposit: b.deposit,
    estimatedAmount: b.estimated_amount,
    terms: [
      '1. 承租人应按照合同约定时间归还车辆',
      '2. 超时归还将按累进费率计算滞纳金',
      '3. 车辆损坏需照价赔偿',
      '4. 租赁期间保险由本公司承担',
      '5. 未尽事宜双方协商解决',
    ],
  };
  
  const updatedBooking = db.prepare(`
    SELECT b.*, c.name as customer_name, v.plate_number, v.brand, v.model
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    JOIN vehicles v ON b.vehicle_id = v.id
    WHERE b.id = ?
  `).get(bookingId);
  
  res.json({
    success: true,
    booking: updatedBooking,
    contract,
    message: '取车成功，电子合同已生成',
  });
});

router.post('/return', (req, res) => {
  const { bookingId, mileage, damages = [], extraCharges = [] } = req.body;
  
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) {
    return res.status(404).json({ error: '预订不存在' });
  }
  
  const b = booking as any;
  
  if (b.status !== 'active') {
    return res.status(400).json({ error: '预订状态不正确，无法还车' });
  }
  
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(b.vehicle_id) as any;
  
  const now = new Date();
  const expectedReturn = new Date(b.expected_return_time);
  const pickupTime = new Date(b.pickup_time);
  
  const baseDays = Math.ceil((expectedReturn.getTime() - pickupTime.getTime()) / (1000 * 60 * 60 * 24));
  const baseAmount = baseDays * vehicle.daily_rate;
  
  let lateFee = 0;
  const lateHours = Math.max(0, Math.ceil((now.getTime() - expectedReturn.getTime()) / (1000 * 60 * 60)));
  if (lateHours > 0) {
    if (lateHours <= 24) {
      lateFee = vehicle.daily_rate * 1.5 * (lateHours / 24);
    } else if (lateHours <= 72) {
      lateFee = vehicle.daily_rate * 2 * Math.ceil(lateHours / 24);
    } else {
      lateFee = vehicle.daily_rate * 3 * Math.ceil(lateHours / 24);
    }
  }
  
  const damagesTotal = damages.reduce((sum: number, d: any) => sum + d.cost, 0);
  const extraTotal = extraCharges.reduce((sum: number, c: any) => sum + c.amount, 0);
  
  const totalAmount = baseAmount + lateFee + damagesTotal + extraTotal;
  const actualAmount = Math.max(0, totalAmount - b.deposit);
  
  db.prepare(`
    UPDATE bookings 
    SET status = 'completed', actual_return_time = ?, actual_amount = ?
    WHERE id = ?
  `).run(now.toISOString(), totalAmount, bookingId);
  
  db.prepare("UPDATE vehicles SET status = 'cleaning', mileage = ? WHERE id = ?")
    .run(mileage || vehicle.mileage + 500, b.vehicle_id);
  
  const invoiceId = generateId();
  const tax = totalAmount * 0.06;
  const totalWithTax = totalAmount + tax;
  
  db.prepare(`
    INSERT INTO invoices (id, booking_id, customer_id, amount, tax, total_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, 'issued')
  `).run(invoiceId, bookingId, b.customer_id, totalAmount, tax, totalWithTax);
  
  const invoiceItems = [
    { description: '基础租金', quantity: baseDays, unitPrice: vehicle.daily_rate, amount: baseAmount },
  ];
  
  if (lateFee > 0) {
    invoiceItems.push({ description: `超时滞纳金(${lateHours}小时)`, quantity: 1, unitPrice: lateFee, amount: lateFee });
  }
  
  damages.forEach((d: any) => {
    invoiceItems.push({ description: `车损-${d.description}`, quantity: 1, unitPrice: d.cost, amount: d.cost });
  });
  
  extraCharges.forEach((c: any) => {
    invoiceItems.push({ description: c.description, quantity: 1, unitPrice: c.amount, amount: c.amount });
  });
  
  invoiceItems.forEach((item: any) => {
    const itemId = generateId();
    db.prepare(`
      INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, amount)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(itemId, invoiceId, item.description, item.quantity, item.unitPrice, item.amount);
  });
  
  res.json({
    success: true,
    invoice: {
      id: invoiceId,
      amount: totalAmount,
      tax,
      totalAmount: totalWithTax,
      items: invoiceItems,
    },
    settlement: {
      baseAmount,
      lateFee,
      damagesTotal,
      extraTotal,
      deposit: b.deposit,
      actualPayable: actualAmount,
      depositRefund: Math.max(0, b.deposit - totalAmount),
    },
    lateHours,
    message: '还车成功，费用已结算',
  });
});

router.get('/contract/:bookingId', (req, res) => {
  const booking = db.prepare(`
    SELECT b.*, c.name as customer_name, c.id_card, c.driver_license, c.phone,
           v.plate_number, v.brand, v.model, v.color, v.year
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    JOIN vehicles v ON b.vehicle_id = v.id
    WHERE b.id = ?
  `).get(req.params.bookingId);
  
  if (!booking) {
    return res.status(404).json({ error: '预订不存在' });
  }
  
  const b = booking as any;
  
  const contract = {
    contractNumber: `CT-${b.id.slice(0, 8).toUpperCase()}`,
    customer: {
      name: b.customer_name,
      idCard: b.id_card,
      driverLicense: b.driver_license,
      phone: b.phone,
    },
    vehicle: {
      plateNumber: b.plate_number,
      brand: b.brand,
      model: b.model,
      color: b.color,
      year: b.year,
    },
    rental: {
      pickupTime: b.pickup_time,
      expectedReturnTime: b.expected_return_time,
      dailyRate: b.estimated_amount / 3,
      deposit: b.deposit,
      estimatedAmount: b.estimated_amount,
    },
    terms: [
      '1. 承租人应按照合同约定时间归还车辆，逾期将产生滞纳金',
      '2. 车辆限乘人数以行驶证为准，不得超载',
      '3. 承租人不得将车辆转租、转借他人',
      '4. 车辆发生事故应立即通知租赁公司并报警',
      '5. 租赁期间车辆正常保养由出租方负责',
      '6. 因承租人原因造成的车辆损坏由承租人承担',
      '7. 押金在还车后如无问题将在7个工作日内退还',
      '8. 本合同未尽事宜，双方协商解决',
    ],
    signedAt: b.pickup_time,
  };
  
  res.json(contract);
});

export default router;
