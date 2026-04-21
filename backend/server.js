const express    = require('express');
const cors       = require('cors');
const morgan     = require('morgan');
const dotenv     = require('dotenv');
const helmet     = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp        = require('hpp');
const rateLimit  = require('express-rate-limit');
const connectDB  = require('./config/db');
const { filterXSS } = require('xss');

dotenv.config();
connectDB();

const app = express();

// Security Headers
app.use(helmet());
app.use(mongoSanitize());
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') return filterXSS(obj);
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(k => { obj[k] = sanitize(obj[k]); });
    }
    return obj;
  };
  if (req.body) req.body = sanitize(req.body);
  next();
});

// CORS - only allow whitelisted origins
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// Body parsers - limit payload size
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Data sanitization against NoSQL injection & XSS


app.use(hpp());

// Global rate limiter: 200 req per 15 min per IP
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many login attempts. Please wait 15 minutes.' },
  skipSuccessfulRequests: true,
});
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// Routes
app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders',   require('./routes/orderRoutes'));
app.use('/api/upload',   require('./routes/uploadRoutes'));
app.use('/api/payment',  require('./routes/paymentRoutes'));
app.use('/api/admin',    require('./routes/adminRoutes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// 404
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: messages.join('. ') });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(400).json({ message: `${field} already exists` });
  }
  if (err.name === 'JsonWebTokenError') return res.status(401).json({ message: 'Invalid token' });
  if (err.name === 'TokenExpiredError') return res.status(401).json({ message: 'Token expired, please log in again' });
  if (err.code === 'LIMIT_FILE_SIZE')   return res.status(400).json({ message: 'File too large (max 5MB)' });

  const statusCode = err.statusCode || 500;
  if (process.env.NODE_ENV !== 'production') console.error(err.stack);
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🍰 SweetCrumbs running on port ${PORT} [${process.env.NODE_ENV}]`));
