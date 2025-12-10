const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

router.get('/', async (req, res) => {
  try {
    const [productos] = await pool.query(
      `SELECT p.idproducto, p.nombre, p.descripcion, p.precio, p.unidad_medida,
              i.cantidad_actual as stock
       FROM producto p
       LEFT JOIN inventario i ON p.idproducto = i.id_producto
       WHERE i.cantidad_actual > 0 OR i.cantidad_actual IS NULL
       ORDER BY p.nombre`
    );

    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [productos] = await pool.query(
      `SELECT p.*, i.cantidad_actual as stock
       FROM producto p
       LEFT JOIN inventario i ON p.idproducto = i.id_producto
       WHERE p.idproducto = ?`,
      [req.params.id]
    );

    if (productos.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(productos[0]);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

router.post(
  '/',
  requireAdmin,
  [
    body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
    body('precio').isFloat({ min: 0.01, max: 999999 }).withMessage('Precio inválido'),
    body('idcategoria').isInt({ min: 1 }).withMessage('Categoría inválida'),
    body('descripcion').trim().notEmpty().withMessage('Descripción requerida'),
    body('unidad_medida').trim().notEmpty().withMessage('Unidad de medida requerida'),
    body('stock').optional().isInt({ min: 0, max: 999999 }).withMessage('Stock inválido')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { nombre, precio, idcategoria, descripcion, unidad_medida, stock } = req.body;

    try {
      const [resultado] = await pool.query(
        'INSERT INTO producto (nombre, precio, idcategoria, descripcion, unidad_medida) VALUES (?, ?, ?, ?, ?)',
        [nombre, precio, idcategoria, descripcion, unidad_medida]
      );

      const idproducto = resultado.insertId;

      if (stock !== undefined) {
        await pool.query(
          'INSERT INTO inventario (id_producto, cantidad_actual) VALUES (?, ?)',
          [idproducto, stock]
        );
      }

      res.json({ mensaje: 'Producto creado', idproducto });
    } catch (error) {
      console.error('Error al crear producto:', error);
      res.status(500).json({ error: 'Error al crear producto' });
    }
  }
);

router.put('/:id', requireAdmin, async (req, res) => {
  const { nombre, precio, descripcion, unidad_medida, stock } = req.body;
  const idproducto = req.params.id;

  try {
    await pool.query(
      'UPDATE producto SET nombre = ?, precio = ?, descripcion = ?, unidad_medida = ? WHERE idproducto = ?',
      [nombre, precio, descripcion, unidad_medida, idproducto]
    );

    if (stock !== undefined) {
      await pool.query(
        'UPDATE inventario SET cantidad_actual = ? WHERE id_producto = ?',
        [stock, idproducto]
      );
    }

    res.json({ mensaje: 'Producto actualizado' });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM producto WHERE idproducto = ?', [req.params.id]);
    res.json({ mensaje: 'Producto eliminado' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

module.exports = router;