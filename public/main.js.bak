document.addEventListener('DOMContentLoaded', async () => {
  const semana = obtenerSemanaActual();
  document.getElementById('titulo').textContent = `LIGA VELOCIDRONE - Semana ${semana}`;
  cargarMejoras();

  document.getElementById('btnReglamento').onclick = mostrarReglamento;
  document.getElementById('btnAlta').onclick = mostrarAlta;

  document.querySelectorAll('.overlay').forEach(el => el.onclick = cerrarPopups);
});

function obtenerSemanaActual() {
  const fecha = new Date();
  const inicio = new Date(fecha.getFullYear(), 0, 1);
  const dias = Math.floor((fecha - inicio) / 86400000);
  return Math.ceil((dias + inicio.getDay() + 1) / 7);
}

async function mostrarReglamento() {
  const res = await fetch('reglamento.txt');
  const texto = await res.text();
  document.getElementById('popupTexto').innerHTML = `<pre>${texto}</pre>`;
  document.getElementById('popup').style.display = 'block';
  document.getElementById('overlay').style.display = 'block';
}

function mostrarAlta() {
  document.getElementById('popupAlta').style.display = 'block';
  document.getElementById('overlay').style.display = 'block';
}

function cerrarPopups() {
  document.getElementById('popup').style.display = 'none';
  document.getElementById('popupAlta').style.display = 'none';
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('mensajeAlta').textContent = '';
  document.getElementById('nombreJugador').value = '';
  if (window.hcaptcha) hcaptcha.reset();
}

async function registrarJugador(event) {
  event.preventDefault();

  const nombre = document.getElementById('nombreJugador').value.trim();
  const token = document.querySelector('[name="h-captcha-response"]')?.value;
  const mensaje = document.getElementById('mensajeAlta');

  if (!nombre || !token) {
    mensaje.textContent = 'Por favor, completa el captcha y el nombre.';
    return;
  }

  try {
    const res = await fetch('/api/alta-jugador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, token })
    });

    const json = await res.json();
    if (res.ok) {
      mensaje.textContent = 'Jugador registrado correctamente.';
      hcaptcha.reset();
    } else {
      mensaje.textContent = json?.error || 'Error al registrar.';
    }
  } catch (err) {
    console.error(err);
    mensaje.textContent = 'Error al conectar con el servidor.';
  }
}

async function cargarMejoras() {
  const contenedor = document.getElementById('mejoras');
  contenedor.innerHTML = '<p>Cargando resultados...</p>';

  try {
    const res = await fetch('/api/tiempos-mejorados');
    const data = await res.json();
    contenedor.innerHTML = '';

    data.forEach(pista => {
      const card = document.createElement('div');
      card.classList.add('card');

      const titulo = document.createElement('h2');
      titulo.textContent = `${pista.escenario} - ${pista.pista}`;
      card.appendChild(titulo);

      const tabla = document.createElement('table');
      tabla.innerHTML = `
        <thead>
          <tr><th>Ranking</th><th>Piloto</th><th>Tiempo</th><th>Mejora</th></tr>
        </thead>
        <tbody>
          ${pista.resultados.map((r, i) => {
            const clase = r.mejora < 0 ? 'mejorado' : r.mejora > 0 ? 'empeorado' : '';
            const mejora = r.mejora === 0 ? '=' : (r.mejora > 0 ? '+' : '') + r.mejora.toFixed(2) + ' s';
            return `<tr class="${clase}"><td>${i + 1}</td><td>${r.jugador}</td><td>${r.tiempo.toFixed(2)} s</td><td>${mejora}</td></tr>`;
          }).join('')}
        </tbody>
      `;
      card.appendChild(tabla);
      contenedor.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = '<p>Error al cargar los resultados.</p>';
  }
}
