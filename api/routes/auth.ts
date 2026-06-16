
import { Router, type Request, type Response } from 'express';
import db from '../db.js';

const router = Router();

router.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user) {
    res.status(401).json({ success: false, error: '用户名或密码错误' });
    return;
  }
  
  const u = user as any;
  
  if (u.password_hash !== password) {
    res.status(401).json({ success: false, error: '用户名或密码错误' });
    return;
  }
  
  const token = Buffer.from(`${u.id}:${Date.now()}`).toString('base64');
  
  res.json({
    success: true,
    token,
    user: {
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      storeId: u.store_id,
    },
  });
});

router.post('/logout', (req: Request, res: Response): void => {
  res.json({ success: true, message: '退出成功' });
});

router.get('/me', (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '未登录' });
    return;
  }
  
  try {
    const token = authHeader.slice(7);
    const decoded = Buffer.from(token, 'base64').toString();
    const userId = decoded.split(':')[0];
    
    const user = db.prepare('SELECT id, username, name, role, store_id FROM users WHERE id = ?').get(userId);
    
    if (!user) {
      res.status(401).json({ error: '用户不存在' });
      return;
    }
    
    res.json({ user });
  } catch {
    res.status(401).json({ error: '无效的token' });
  }
});

export default router;
