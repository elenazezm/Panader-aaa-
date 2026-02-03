const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

//Historial de todos los pedidos
router.get('/historial', requireAdmin, async (req, res) => {
  try {
    const [pedidos] = await pool.query(
      `SELECT p.idpedido, p.fecha, c.nombre, c.apellido, c.correo,
              dp.total
       FROM pedido p
       INNER JOIN direccion d ON p.iddireccion = d.iddireccion
       INNER JOIN cliente c ON d.idcliente = c.idcliente
       INNER JOIN detalle_pago dp ON p.iddetalle_pago = dp.iddetalle_pago
       ORDER BY p.fecha DESC`
    );

    res.json(pedidos);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

//Detalles de un pedido 
router.get('/pedido/:id', requireAdmin, async (req, res) => {
  try {
    const [detalles] = await pool.query(
      `SELECT dp.iddetalle_pedido, p.nombre, dp.cantidad, dp.precio_unitario, dp.subtotal
       FROM detalle_pedido dp
       INNER JOIN producto p ON dp.idproducto = p.idproducto
       WHERE dp.idpedido = ?`,
      [req.params.id]
    );

    res.json(detalles);
  } catch (error) {
    console.error('Error al obtener detalle:', error);
    res.status(500).json({ error: 'Error al obtener detalle' });
  }
});

//Lista de los usuarios
router.get('/usuarios', requireAdmin, async (req, res) => {
  try {
    const [usuarios] = await pool.query(
      'SELECT idcliente, nombre, apellido, correo, telefono, fecha_registro FROM cliente ORDER BY fecha_registro DESC'
    );

    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

module.exports = router;