let carrito = { items: [], total: 0 };

async function cargarCarrito() {
  try {
    const sesion = await fetch('/api/auth/perfil');
    if (!sesion.ok) {
      window.location.href = '/login.html';
      return;
    }
    const res = await fetch('/api/carrito');
    carrito = await res.json();
    renderCarrito();
  } catch (error) {
    console.error('Error:', error);
    mostrarMensaje('Error al cargar carrito', 'error');
  }
}

function renderCarrito() {
  const container = document.getElementById('carritoItems');
  const resumen = document.getElementById('carritoResumen');
  
  if (carrito.items.length === 0) {
    container.innerHTML = `
      <div class="carrito-vacio">
        <div class="vacio-icono">🛒</div>
        <h3>Tu carrito está vacío</h3>
        <p>¡Agrega algunos productos deliciosos!</p>
        <a href="/productos.html" class="btn btn-productos">
          🥐 Ver Productos
        </a>
      </div>
    `;
    resumen.style.display = 'none';
    return;
  }

  container.innerHTML = carrito.items.map(item => `
    <div class="carrito-item-card">
      <div class="item-imagen">
        ${item.imagen ? 
          `<img src="${item.imagen}" alt="${item.nombre}">` : 
          `<div class="imagen-placeholder">🥐</div>`
        }
      </div>
      <div class="item-detalles">
        <h3 class="item-nombre">${item.nombre}</h3>
        <p class="item-cantidad">Cantidad: <strong>${item.cantidad} ${item.unidad_medida}</strong></p>
        <p class="item-precio-unitario">Precio unitario: <strong>$${parseFloat(item.precio).toFixed(2)}</strong></p>
      </div>
      <div class="item-acciones">
        <p class="item-subtotal">$${parseFloat(item.subtotal).toFixed(2)}</p>
        <button class="btn-eliminar" onclick="eliminarItem(${item.idcarrito})" title="Eliminar producto">
          🗑️ Eliminar
        </button>
      </div>
    </div>
  `).join('');

  document.getElementById('subtotalMonto').textContent = parseFloat(carrito.total).toFixed(2);
  document.getElementById('totalMonto').textContent = parseFloat(carrito.total).toFixed(2);
  resumen.style.display = 'block';
}

async function eliminarItem(idcarrito) {
  if (!confirm('¿Eliminar este producto del carrito?')) return;
  
  try {
    const res = await fetch(`/api/carrito/${idcarrito}`, { method: 'DELETE' });
    if (res.ok) {
      mostrarMensaje('✅ Producto eliminado del carrito', 'exito');
      cargarCarrito();
    } else {
      const data = await res.json();
      mostrarMensaje(data.error || 'Error al eliminar', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarMensaje('Error de conexión', 'error');
  }
}

async function vaciarCarrito() {
  if (!confirm('¿Estás seguro de vaciar todo el carrito?')) return;
  
  try {
    // Eliminar todos los items uno por uno
    for (const item of carrito.items) {
      await fetch(`/api/carrito/${item.idcarrito}`, { method: 'DELETE' });
    }
    mostrarMensaje('🗑️ Carrito vaciado', 'exito');
    cargarCarrito();
  } catch (error) {
    console.error('Error:', error);
    mostrarMensaje('Error al vaciar carrito', 'error');
  }
}

async function procesarCompra() {
  if (!confirm('¿Confirmar la compra de todos los productos?')) return;
  
  try {
    const res = await fetch('/api/carrito/comprar', { method: 'POST' });
    const data = await res.json();
    
    if (res.ok) {
      mostrarTicket(data.ticket);
      cargarCarrito();
    } else {
      mostrarMensaje(data.error || 'Error al procesar compra', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarMensaje('Error de conexión', 'error');
  }
}

function mostrarTicket(ticket) {
  document.getElementById('ticketNumero').textContent = ticket.numero_venta;
  document.getElementById('ticketFecha').textContent = ticket.fecha;
  
  const productosHTML = ticket.productos.map(p => `
    <li class="ticket-producto-item">
      <span class="producto-detalle">
        ${p.nombre} <span class="producto-cantidad">x${p.cantidad}</span>
      </span>
      <span class="producto-precio">$${parseFloat(p.precio * p.cantidad).toFixed(2)}</span>
    </li>
  `).join('');
  
  document.getElementById('ticketProductos').innerHTML = productosHTML;
  document.getElementById('ticketTotal').textContent = parseFloat(ticket.total).toFixed(2);
  document.getElementById('modalTicket').style.display = 'flex';
}

function cerrarTicket() {
  document.getElementById('modalTicket').style.display = 'none';
  window.location.reload();
}

async function cerrarSesion() {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login.html';
}

function mostrarMensaje(texto, tipo) {
  const div = document.getElementById('mensaje');
  div.className = `mensaje ${tipo}`;
  div.textContent = texto;
  div.style.display = 'block';
  
  setTimeout(() => {
    div.style.display = 'none';
  }, 3000);
}

// Cargar carrito al iniciar
cargarCarrito();