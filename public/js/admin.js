async function verificarAdmin() {
  try {
    const res = await fetch('/api/auth/perfil');
    if (!res.ok) {
      window.location.href = '/login.html';
      return false;
    }

    const usuario = await res.json();
    if (!usuario.isAdmin) {
      alert('Acceso denegado. Solo administradores.');
      window.location.href = '/productos.html';
      return false;
    }

    return true;
  } catch (error) {
    window.location.href = '/login.html';
    return false;
  }
}

document.getElementById('formProducto').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const descripcion = document.getElementById('descripcion').value.trim();
  const precio = parseFloat(document.getElementById('precio').value);
  const unidad_medida = document.getElementById('unidad_medida').value.trim();
  const idcategoria = parseInt(document.getElementById('idcategoria').value);
  const stock = parseInt(document.getElementById('stock').value);
  const imagen_url = document.getElementById('imagen_url').value;


  if (precio <= 0 || precio > 999999) {
    mostrarMensaje('Precio debe estar entre 0.01 y 999999', 'error');
    return;
  }

  if (stock < 0 || stock > 999999) {
    mostrarMensaje('Stock debe estar entre 0 y 999999', 'error');
    return;
  }

  try {
    const res = await fetch('/api/productos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, descripcion, precio, unidad_medida, idcategoria, stock, imagen_url })
    });

    const data = await res.json();

    if (res.ok) {
      mostrarMensaje('✅ Producto creado exitosamente', 'exito');
      document.getElementById('formProducto').reset();
    } else {
      mostrarMensaje(data.error || 'Error al crear producto', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarMensaje('Error de conexión', 'error');
  }
});

async function cargarHistorial() {
  try {
    const res = await fetch('/api/admin/historial');
    const pedidos = await res.json();

    const tbody = document.getElementById('historialBody');

    if (pedidos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay pedidos registrados</td></tr>';
      return;
    }

    tbody.innerHTML = pedidos.map(p => `
      <tr>
        <td>${p.idpedido}</td>
        <td>${new Date(p.fecha).toLocaleString('es-MX')}</td>
        <td>${p.nombre} ${p.apellido}</td>
        <td>${p.correo}</td>
        <td>$${parseFloat(p.total).toFixed(2)}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error:', error);
    mostrarMensaje('Error al cargar historial', 'error');
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
  }, 5000);
}

verificarAdmin().then(isAdmin => {
  if (isAdmin) {
    cargarHistorial();
  }
});