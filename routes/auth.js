const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { body, validationResult } = require('express-validator');

//Registro de usuario
router.post(
  '/registro',
  [
    body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
    body('apellido').trim().notEmpty().withMessage('El apellido es requerido'),
    body('correo').isEmail().withMessage('Correo inválido'),
    body('telefono').matches(/^\d{10,12}$/).withMessage('Teléfono inválido (10-12 dígitos)'),
    body('password').isLength({ min: 6 }).withMessage('Contraseña mínimo 6 caracteres')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { nombre, apellido, correo, telefono, password } = req.body;

    try {
      const [existente] = await pool.query('SELECT idcliente FROM cliente WHERE correo = ?', [correo]);
      if (existente.length > 0) {
        return res.status(400).json({ error: 'El correo ya está registrado' });
      }

      const [resultado] = await pool.query(
        'INSERT INTO cliente (nombre, apellido, correo, telefono) VALUES (?, ?, ?, ?)',
        [nombre, apellido, correo, telefono]
      );

      const idcliente = resultado.insertId;

      await pool.query(
        'INSERT INTO metodo_autenticacion (idcliente, idproveedor_autenticacion, password_hash) VALUES (?, 1, ?)',
        [idcliente, password]
      );

      //await pool.query('INSERT INTO carrito (idcliente, idproducto, cantidad, activo) VALUES (?, 0, 0, 0)', [idcliente]);

      res.json({ mensaje: 'Registro exitoso. Ahora puedes iniciar sesión.' });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({ error: 'Error al registrar usuario' });
    }
  }
);

//Inicio de sesión
router.post('/login', async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ error: 'Correo y contraseña requeridos' });
  }

  try {
    const [usuarios] = await pool.query(
      `SELECT c.idcliente, c.nombre, c.apellido, c.correo, ma.password_hash
       FROM cliente c
       INNER JOIN metodo_autenticacion ma ON c.idcliente = ma.idcliente
       WHERE c.correo = ? AND ma.password_hash = ?`,
      [correo, password]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const usuario = usuarios[0];

    const isAdmin = correo === 'admin@panaderia.com';

    req.session.userId = usuario.idcliente;
    req.session.nombre = usuario.nombre;
    req.session.apellido = usuario.apellido;
    req.session.correo = usuario.correo;
    req.session.isAdmin = isAdmin;

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      usuario: {
        id: usuario.idcliente,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        isAdmin: isAdmin
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

//Cerrar sesión
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Error al cerrar sesión' });
    res.clearCookie('connect.sid');
    res.json({ mensaje: 'Sesión cerrada' });
  });
});

router.get('/perfil', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  res.json({
    id: req.session.userId,
    nombre: req.session.nombre,
    apellido: req.session.apellido,
    correo: req.session.correo,
    isAdmin: req.session.isAdmin || false
  });
});

module.exports = router;