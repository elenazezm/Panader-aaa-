document.getElementById('registroForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const apellido = document.getElementById('apellido').value.trim();
  const correo = document.getElementById('correo').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const password = document.getElementById('password').value;

  console.log('Datos del formulario de registro:');
  console.log({ nombre, apellido, correo, telefono, password });

  // Validaciones frontend
  if (telefono.length < 10 || telefono.length > 12) {
    mostrarMensaje('El teléfono debe tener entre 10 y 12 dígitos', 'error');
    return;
  }

  if (password.length < 6) {
    mostrarMensaje('La contraseña debe tener al menos 6 caracteres', 'error');
    return;
  }

  try {
    const res = await fetch('/api/auth/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, apellido, correo, telefono, password })
    });

    const data = await res.json();

    if (res.ok) {
      mostrarMensaje(data.mensaje, 'exito');
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 2000);
    } else {
      mostrarMensaje(data.error || 'Error al registrar', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarMensaje('Error de conexión', 'error');
  }
});

function mostrarMensaje(texto, tipo) {
  const div = document.getElementById('mensaje');
  div.className = `mensaje ${tipo}`;
  div.textContent = texto;
  div.style.display = 'block';

  setTimeout(() => {
    div.style.display = 'none';
  }, 5000);
}