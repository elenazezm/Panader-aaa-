//servidos princiapl
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const pool = require('./config/db');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const sessionStore = new MySQLStore({}, pool);

app.use(
  session({
    key: 'panaderia_session',
    secret: process.env.SESSION_SECRET || 'panaderia-zeltzin',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 horas
      httpOnly: true,
      secure: false
    }
  })
);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/productos', require('./routes/productos'));
app.use('/api/carrito', require('./routes/carrito'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => {
  res.redirect('/login.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎄 Servidor corriendo en http://localhost:${PORT}`);
});