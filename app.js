const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/errorControllers');
const pug = require('pug');
const path = require('path');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRouters');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const adviceRoutes = require('./routes/adviceRoutes');
const paymentsRoutes = require('./routes/paymentsRoutes');

const app = express();

app.use(cookieParser());

app.use(express.static('public'));

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Logging in Development Mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  console.log('Development mode active...');
}

// Security Middlewares (Production Mode)
if (process.env.NODE_ENV === 'production') {
  console.log('Production mode active...');

  // Rate Limiting
  const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests, please try again after an hour!',
  });

  app.use('/api', limiter);
}

// Common Security Middlewares
app.use(helmet());
app.use(hpp());
app.use(mongoSanitize());
app.use(xss());

app.use(express.json({ limit: '10kb' }));

app.get('/', (req, res) => {
  res.send('B2crypto API is running...');
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/advices', adviceRoutes);
app.use('/api/v1/payments', paymentsRoutes);

app.all('*', (req, res, next) => {
  next(new AppError(`can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
