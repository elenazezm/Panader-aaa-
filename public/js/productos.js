let productos = [];

async function cargarProductos() {
  try {
    const sesion = await fetch('/api/auth/perfil');
    if (!sesion.ok) {
      window.location.href = '/login.html';
      return;
    }
    const res = await fetch('/api/productos');
    productos = await res.json();
    renderProductos();
  } catch (error) {
    console.error('Error:', error);
    mostrarMensaje('Error al cargar productos', 'error');
  }
}

function renderProductos() {
  const grid = document.getElementById('productosGrid');
  
  if (productos.length === 0) {
    grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; font-size: 1.2em; color: #666;">No hay productos disponibles</p>';
    return;
  }

  grid.innerHTML = productos.map(p => `
    <div class="producto-card">
      <div class="producto-imagen">
        ${p.imagen ? 
          `<img src="${p.imagen}" alt="${p.nombre}">` : 
          `<div class="imagen-placeholder">
            <span>🥐</span>
          </div>`
        }
        ${(!p.stock || p.stock === 0) ? '<div class="badge-agotado">Agotado</div>' : ''}
      </div>
      
      <div class="producto-info">
        <h3 class="producto-nombre">${p.nombre}</h3>
        <p class="producto-descripcion">${p.descripcion}</p>
        
        <div class="producto-footer">
          <div class="precio-stock">
            <p class="producto-precio">$${parseFloat(p.precio).toFixed(2)}</p>
            <p class="producto-stock">Stock: ${p.stock || 0} ${p.unidad_medida}</p>
          </div>
          
          <div class="cantidad-control">
            <label for="cant-${p.idproducto}">Cantidad:</label>
            <input 
              type="number" 
              id="cant-${p.idproducto}" 
              value="1" 
              min="1" 
              max="${p.stock || 1}"
              ${!p.stock || p.stock === 0 ? 'disabled' : ''}
            >
          </div>
          
          <button 
            class="btn btn-agregar" 
            onclick="agregarAlCarrito(${p.idproducto})" 
            ${!p.stock || p.stock === 0 ? 'disabled' : ''}
          >
            ${!p.stock || p.stock === 0 ? '❌ Sin Stock' : '🛒 Agregar al Carrito'}
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

async function agregarAlCarrito(idproducto) {
  const cantidad = parseInt(document.getElementById(`cant-${idproducto}`).value);
  
  if (cantidad <= 0 || cantidad > 9999) {
    mostrarMensaje('Cantidad inválida', 'error');
    return;
  }

  try {
    const res = await fetch('/api/carrito/agregar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idproducto, cantidad })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      mostrarMensaje('✅ Producto agregado al carrito', 'exito');
      document.getElementById(`cant-${idproducto}`).value = 1;
    } else {
      mostrarMensaje(data.error || 'Error al agregar', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarMensaje('Error de conexión', 'error');
  }
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

// Cargar productos al iniciar
cargarProductos();