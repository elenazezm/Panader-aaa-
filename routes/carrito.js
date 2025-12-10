const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  try {
    const [items] = await pool.query(
      `SELECT c.idcarrito, c.cantidad, p.idproducto, p.nombre, p.precio, p.unidad_medida,
              (c.cantidad * p.precio) as subtotal
       FROM carrito c
       INNER JOIN producto p ON c.idproducto = p.idproducto
       WHERE c.idcliente = ? AND c.activo = 1`,
      [req.session.userId]
    );

    const total = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

    res.json({ items, total: total.toFixed(2) });
  } catch (error) {
    console.error('Error al obtener carrito:', error);
    res.status(500).json({ error: 'Error al obtener carrito' });
  }
});

router.post('/agregar', requireAuth, async (req, res) => {
  const { idproducto, cantidad } = req.body;

  if (!idproducto || !cantidad || cantidad <= 0 || cantidad > 9999) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  try {
    const [producto] = await pool.query(
      'SELECT i.cantidad_actual FROM inventario i WHERE i.id_producto = ?',
      [idproducto]
    );

    if (!producto[0] || producto[0].cantidad_actual < cantidad) {
      return res.status(400).json({ error: 'Stock insuficiente' });
    }

    const [existente] = await pool.query(
      'SELECT idcarrito, cantidad FROM carrito WHERE idcliente = ? AND idproducto = ? AND activo = 1',
      [req.session.userId, idproducto]
    );

    if (existente.length > 0) {
      const nuevaCantidad = existente[0].cantidad + cantidad;
      await pool.query(
        'UPDATE carrito SET cantidad = ? WHERE idcarrito = ?',
        [nuevaCantidad, existente[0].idcarrito]
      );
    } else {
      await pool.query(
        'INSERT INTO carrito (idcliente, idproducto, cantidad, activo) VALUES (?, ?, ?, 1)',
        [req.session.userId, idproducto, cantidad]
      );
    }

    res.json({ mensaje: 'Producto agregado al carrito' });
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    res.status(500).json({ error: 'Error al agregar al carrito' });
  }
});
router.delete('/:idcarrito', requireAuth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM carrito WHERE idcarrito = ? AND idcliente = ?',
      [req.params.idcarrito, req.session.userId]
    );

    res.json({ mensaje: 'Producto eliminado del carrito' });
  } catch (error) {
    console.error('Error al eliminar del carrito:', error);
    res.status(500).json({ error: 'Error al eliminar del carrito' });
  }
});
router.post('/comprar', requireAuth, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [items] = await connection.query(
      `SELECT c.idcarrito, c.idproducto, c.cantidad, p.precio, p.nombre
       FROM carrito c
       INNER JOIN producto p ON c.idproducto = p.idproducto
       WHERE c.idcliente = ? AND c.activo = 1`,
      [req.session.userId]
    );

    if (items.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Carrito vacío' });
    }

    const total = items.reduce((sum, item) => sum + (item.cantidad * parseFloat(item.precio)), 0);

    let [direccion] = await connection.query(
      'SELECT iddireccion FROM direccion WHERE idcliente = ? LIMIT 1',
      [req.session.userId]
    );

    if (direccion.length === 0) {
      const [nuevaDireccion] = await connection.query(
        'INSERT INTO direccion (idcliente, calle, ciudad, codigo_postal, pais) VALUES (?, ?, ?, ?, ?)',
        [req.session.userId, 'Dirección temporal', 'Ciudad', '00000', 'México']
      );
      direccion = [{ iddireccion: nuevaDireccion.insertId }];
    }

    const [detallePago] = await connection.query(
      'INSERT INTO detalle_pago (subtotal, tarifas_envio, total, idmetodo_pago) VALUES (?, 0, ?, 1)',
      [total, total]
    );

    const [pedido] = await connection.query(
      'INSERT INTO pedido (iddireccion, iddetalle_pago) VALUES (?, ?)',
      [direccion[0].iddireccion, detallePago.insertId]
    );

    const idpedido = pedido.insertId;

    for (const item of items) {
      await connection.query(
        'INSERT INTO detalle_pedido (idpedido, idproducto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [idpedido, item.idproducto, item.cantidad, item.precio]
      );

      await connection.query(
        'UPDATE inventario SET cantidad_actual = cantidad_actual - ? WHERE id_producto = ?',
        [item.cantidad, item.idproducto]
      );

      await connection.query(
        'INSERT INTO movimiento_salida (idproducto, idpedido, cantidad) VALUES (?, ?, ?)',
        [item.idproducto, idpedido, item.cantidad]
      );
    }

    await connection.query('DELETE FROM carrito WHERE idcliente = ? AND activo = 1', [req.session.userId]);

    await connection.commit();

    res.json({
      mensaje: 'Compra realizada exitosamente',
      ticket: {
        numero_venta: idpedido,
        fecha: new Date().toLocaleString('es-MX'),
        productos: items.map(i => ({ nombre: i.nombre, cantidad: i.cantidad, precio: i.precio })),
        total: total.toFixed(2)
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al procesar compra:', error);
    res.status(500).json({ error: 'Error al procesar compra' });
  } finally {
    connection.release();
  }
});

module.exports = router;