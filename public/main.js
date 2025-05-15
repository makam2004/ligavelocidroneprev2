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
      mensaje.textContent = '✅ Jugador registrado correctamente.';
      hcaptcha.reset();
    } else {
      mensaje.textContent = json?.error || '❌ Error al registrar.';
    }
  } catch (err) {
    console.error('Error al registrar:', err);
    mensaje.textContent = '❌ Error al conectar con el servidor.';
  }
}

async function cargarMejoras() {
  const cont1 = document.getElementById("track1");
  const cont2 = document.getElementById("track2");
  cont1.innerHTML = cont2.innerHTML = "<p style='text-align:center;'>⏳ Cargando resultados...</p>";

  try {
    const res = await fetch("/api/tiempos-mejorados");
    const data = await res.json();

    cont1.innerHTML = cont2.innerHTML = "";

    data.forEach((track, i) => {
      const card = i === 0 ? cont1 : cont2;
      const titulo = document.createElement("h3");
      titulo.innerHTML = `<span style="color:red;">${track.pestana}</span><br>${track.escenario} - ${track.pista}`;
      card.appendChild(titulo);

      const tabla = document.createElement("table");
      tabla.innerHTML = `
        <thead><tr><th>Ranking</th><th>Piloto</th><th>Tiempo</th></tr></thead>
        <tbody>${track.resultados.map((r, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${r.jugador}</td>
            <td>${r.tiempo.toFixed(2)} s</td>
          </tr>`).join('')}
        </tbody>`;
      card.appendChild(tabla);
    });
  } catch (err) {
    console.error("❌ Error capturado en cargarMejoras:", err);
    cont1.innerHTML = cont2.innerHTML = "<div style='color:red;'>❌ Error al cargar los resultados</div>";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  cargarMejoras();

  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), 0, 1);
  const diff = (hoy - inicio + ((inicio.getTimezoneOffset() - hoy.getTimezoneOffset()) * 60000)) / 86400000;
  const numeroSemana = Math.ceil((diff + inicio.getDay() + 1) / 7);
  document.getElementById("tituloSemana").textContent = `LIGA VELOCIDRONE - Semana ${numeroSemana}`;

  document.getElementById("btnReglamento").addEventListener("click", async () => {
    try {
      const r = await fetch("/reglamento.txt");
      const texto = await r.text();
      document.getElementById("popupTexto").innerHTML = texto.replace(/\n/g, "<br>");
    } catch {
      document.getElementById("popupTexto").textContent = "⚠ Error al cargar el reglamento.";
    }
    document.getElementById("popup").style.display = "block";
    document.getElementById("overlay").style.display = "block";
  });

  document.getElementById("btnAlta").addEventListener("click", () => {
    document.getElementById("popupAlta").style.display = "block";
    document.getElementById("overlay").style.display = "block";
    document.getElementById("mensajeAlta").textContent = '';
    if (window.hcaptcha) hcaptcha.reset();
  });
});
