async function cargarMejoras() {
  const cont1 = document.getElementById("track1");
  const cont2 = document.getElementById("track2");
  const rankingCont = document.getElementById("rankingSemanal");
  cont1.innerHTML = cont2.innerHTML = rankingCont.innerHTML = "";

  const mensaje = document.createElement("div");
  mensaje.textContent = "⏳ Cargando resultados…";
  mensaje.style.textAlign = "center";
  mensaje.style.margin = "20px";
  mensaje.style.color = "white";
  cont1.appendChild(mensaje.cloneNode(true));
  cont2.appendChild(mensaje.cloneNode(true));

  try {
    const res = await fetch("/api/tiempos-mejorados");
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();

    const puntos = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const semanal = {};

    cont1.innerHTML = "";
    cont2.innerHTML = "";

    data.forEach((pista, index) => {
      const container = index === 0 ? cont1 : cont2;

      const pestana = document.createElement('h3');
      pestana.textContent = pista.pestana;
      pestana.className = "nombre-pestana";
      pestana.style.color = "red";
      container.appendChild(pestana);

      const titulo = document.createElement("h3");
      titulo.textContent = `${pista.escenario} - ${pista.pista}`;
      container.appendChild(titulo);

      const tabla = document.createElement("table");
      const filas = pista.resultados.map((r, i) => {
        const puntosGanados = puntos[i] ?? 1;
        semanal[r.jugador] = (semanal[r.jugador] || 0) + puntosGanados;

        const mejoraValida = typeof r.mejora === "number";
        const clase = mejoraValida
          ? (r.mejora < 0 ? 'mejorado' : r.mejora > 0 ? 'empeorado' : '')
          : '';
        const mejora = mejoraValida
          ? (r.mejora === 0 ? '=' : (r.mejora > 0 ? '+' : '') + r.mejora.toFixed(2) + ' s')
          : r.mejora;

        return `<tr class="${clase}">
          <td>${i + 1}</td>
          <td>${r.jugador}</td>
          <td>${r.tiempo.toFixed(2)} s</td>
          <td>${mejora}</td>
        </tr>`;
      });

      tabla.innerHTML = `
        <thead><tr><th>Ranking</th><th>Piloto</th><th>Tiempo</th><th>Mejora</th></tr></thead>
        <tbody>${filas.join("")}</tbody>
      `;
      container.appendChild(tabla);
    });

    mostrarRanking(semanal);
  } catch (err) {
    console.error("❌ Error capturado en cargarMejoras:", err);
    cont1.innerHTML = cont2.innerHTML = "<div style='color:red'>❌ Error al cargar los resultados</div>";
  }
}

function mostrarRanking(semanal) {
  const cont = document.getElementById("rankingSemanal");
  cont.innerHTML = "<h3>Ranking Semanal</h3>";
  const tabla = document.createElement("table");

  const filas = Object.entries(semanal)
    .sort((a, b) => b[1] - a[1])
    .map(([jugador, puntos], i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${jugador}</td>
        <td>${puntos}</td>
      </tr>
    `);

  tabla.innerHTML = `
    <thead><tr><th>Posición</th><th>Piloto</th><th>Puntos</th></tr></thead>
    <tbody>${filas.join("")}</tbody>
  `;
  cont.appendChild(tabla);

  const anual = document.getElementById("rankingAnual");
  anual.innerHTML = "<h3>Ranking Anual (en desarrollo)</h3>";
}

async function registrarJugador(event) {
  event.preventDefault();

  const nombre = document.getElementById("nombreJugador").value.trim();
  if (!nombre) return;

  try {
    const token = hcaptcha.getResponse();
    if (!token) throw new Error("Captcha requerido");

    const res = await fetch("/api/alta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, token })
    });

    const r = await res.json();
    document.getElementById("mensajeAlta").textContent = r.message || "✅ Alta completada";
  } catch (e) {
    console.error("Error al registrar:", e);
    document.getElementById("mensajeAlta").textContent = "❌ Error al registrar";
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
    document.getElementById("popup").style.display = "block";
    try {
      const r = await fetch("/reglamento.txt");
      const texto = await r.text();
      document.getElementById("popupTexto").innerHTML = texto.replace(/\n/g, "<br>");
    } catch (e) {
      document.getElementById("popupTexto").textContent = "⚠ No se pudo cargar el reglamento.";
    }
  });

  document.getElementById("btnAlta").addEventListener("click", () => {
    document.getElementById("popupAlta").style.display = "block";
    document.getElementById("mensajeAlta").textContent = "";
    if (window.hcaptcha) hcaptcha.reset();
  });
});

function cerrarPopups() {
  document.getElementById("popup").style.display = "none";
  document.getElementById("popupAlta").style.display = "none";
}
