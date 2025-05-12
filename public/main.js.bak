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

function mostrarAlta() {
  document.getElementById('popupAlta').style.display = 'block';
  document.getElementById('overlay').style.display = 'block';
  if (window.hcaptcha) hcaptcha.render(document.querySelector('.h-captcha'), {
    sitekey: '8ac62e84-891a-4d2e-b8a0-e39aabb4b246'
  });
}

function mostrarReglamento() {
  fetch('reglamento.txt')
    .then(res => res.text())
    .then(txt => {
      document.getElementById('popupTexto').innerHTML = `<pre>${txt}</pre>`;
      document.getElementById('popup').style.display = 'block';
      document.getElementById('overlay').style.display = 'block';
    });
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
    mensaje.textContent = res.ok ? 'Jugador registrado correctamente.' : (json?.error || 'Error al registrar.');
    if (res.ok && window.hcaptcha) hcaptcha.reset();
  } catch (err) {
    console.error(err);
    mensaje.textContent = 'Error al conectar con el servidor.';
  }
}

async function cargarMejoras() {
  try {
    const res = await fetch('/api/tiempos-mejorados');
    const data = await res.json();

    const cont1 = document.getElementById('track1');
    const cont2 = document.getElementById('track2');
    const semanal = {};
    const puntos = [10, 8, 6, 4, 2];

    cont1.innerHTML = '';
    cont2.innerHTML = '';

    data.forEach((pista, index) => {
      const container = index === 0 ? cont1 : cont2;
      const titulo = document.createElement('h3');
      titulo.textContent = `${pista.escenario} - ${pista.pista}`;
      container.appendChild(titulo);

      const tabla = document.createElement('table');
      tabla.innerHTML = `
        <thead>
          <tr><th>Ranking</th><th>Piloto</th><th>Tiempo</th><th>Mejora</th></tr>
        </thead>
        <tbody>
          ${pista.resultados.map((r, i) => {
            const clase = r.mejora < 0 ? 'mejorado' : r.mejora > 0 ? 'empeorado' : '';
            const mejora = r.mejora === 0 ? '=' : (r.mejora > 0 ? '+' : '') + r.mejora.toFixed(2) + ' s';

            const puntosGanados = puntos[i] ?? 1;
            semanal[r.jugador] = (semanal[r.jugador] || 0) + puntosGanados;

            return `<tr class="${clase}">
              <td>${i + 1}</td>
              <td>${r.jugador}</td>
              <td>${r.tiempo.toFixed(2)} s</td>
              <td>${mejora}</td>
            </tr>`;
          }).join('')}
        </tbody>
      `;
      container.appendChild(tabla);
    });

    // Mostrar Ranking Semanal
    const tablaSemanal = document.getElementById('tablaSemanal');
    const ranking = Object.entries(semanal)
      .sort((a, b) => b[1] - a[1])
      .map(([nombre, puntos], i) => `<tr><td>${i + 1}</td><td>${nombre}</td><td>${puntos} pts</td></tr>`);

    tablaSemanal.innerHTML = `
      <table>
        <thead><tr><th>#</th><th>Piloto</th><th>Puntos</th></tr></thead>
        <tbody>${ranking.join('')}</tbody>
      </table>
    `;
  } catch (err) {
    console.error(err);
    document.getElementById('mejoras').innerHTML = '<p>Error al cargar los resultados.</p>';
  }
}
