document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const correo = document.getElementById('correo').value.trim();
  const password = document.getElementById('password').value;
  
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, password })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      if (data.usuario.isAdmin) {
        window.location.href = '/admin.html';
      } else {
        window.location.href = '/productos.html';
      }
    } else {
      mostrarMensaje(data.error || 'Error al iniciar sesión', 'error');
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