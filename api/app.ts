
import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import './db.js'

import authRoutes from './routes/auth.js'
import dashboardRoutes from './routes/dashboard.js'
import vehiclesRoutes from './routes/vehicles.js'
import bookingsRoutes from './routes/bookings.js'
import customersRoutes from './routes/customers.js'
import dispatchRoutes from './routes/dispatch.js'
import maintenanceRoutes from './routes/maintenance.js'
import rentalRoutes from './routes/rental.js'
import billingRoutes from './routes/billing.js'
import reportsRoutes from './routes/reports.js'
import accidentsRoutes from './routes/accidents.js'
import storesRoutes from './routes/stores.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/vehicles', vehiclesRoutes)
app.use('/api/bookings', bookingsRoutes)
app.use('/api/customers', customersRoutes)
app.use('/api/dispatch', dispatchRoutes)
app.use('/api/maintenance', maintenanceRoutes)
app.use('/api/rental', rentalRoutes)
app.use('/api/billing', billingRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/accidents', accidentsRoutes)
app.use('/api/stores', storesRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
