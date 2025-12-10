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
  
  if (carrito.items.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 40px;">Tu carrito está vacío 🛒</p>';
    document.getElementById('carritoTotal').style.display = 'none';
    return;
  }
  
  container.innerHTML = carrito.items.map(item => `
    <div class="carrito-item">
      <div class="item-info">
        <h3>${item.nombre}</h3>
        <p>Cantidad: ${item.cantidad} ${item.unidad_medida}</p>
        <p>Precio unitario: $${parseFloat(item.precio).toFixed(2)}</p>
      </div>
      <div style="text-align: right;">
        <p class="item-precio">$${parseFloat(item.subtotal).toFixed(2)}</p>
        <button class="btn-danger" onclick="eliminarItem(${item.idcarrito})">Eliminar ❌</button>
      </div>
    </div>
  `).join('');
  
  document.getElementById('totalMonto').textContent = parseFloat(carrito.total).toFixed(2);
  document.getElementById('carritoTotal').style.display = 'block';
}

async function eliminarItem(idcarrito) {
  if (!confirm('¿Eliminar este producto del carrito?')) return;
  
  try {
    const res = await fetch(`/api/carrito/${idcarrito}`, { method: 'DELETE' });
    
    if (res.ok) {
      mostrarMensaje('Producto eliminado', 'exito');
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

async function procesarCompra() {
  if (!confirm('¿Confirmar compra?')) return;
  
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
    <li>
      ${p.nombre} x${p.cantidad} - $${parseFloat(p.precio).toFixed(2)} c/u
    </li>
  `).join('');
  
  document.getElementById('ticketProductos').innerHTML = productosHTML;
  document.getElementById('ticketTotal').textContent = ticket.total;
  
  document.getElementById('modalTicket').style.display = 'block';
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

cargarCarrito();