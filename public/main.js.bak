async function cargarMejoras() {
  const cont1 = document.getElementById("track1");
  const cont2 = document.getElementById("track2");
  const rankingCont = document.getElementById("rankingSemanal");
  cont1.innerHTML = cont2.innerHTML = rankingCont.innerHTML = "";

  const mensajeCargando = document.createElement("div");
  mensajeCargando.textContent = "⏳ Cargando resultados…";
  mensajeCargando.style.textAlign = "center";
  mensajeCargando.style.margin = "20px";
  mensajeCargando.style.color = "white";

  cont1.appendChild(mensajeCargando.cloneNode(true));
  cont2.appendChild(mensajeCargando.cloneNode(true));

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

      const tituloPestana = document.createElement('h3');
      tituloPestana.textContent = pista.pestana;
      tituloPestana.style.color = 'red';
      container.appendChild(tituloPestana);

      const titulo = document.createElement("h3");
      titulo.textContent = `${pista.escenario} - ${pista.pista}`;
      container.appendChild(titulo);

      const tabla = document.createElement("table");
      tabla.innerHTML = `
        <thead>
          <tr><th>Ranking</th><th>Piloto</th><th>Tiempo</th><th>Mejora</th></tr>
        </thead>
        <tbody>
          ${pista.resultados.map((r, i) => {
            const puntosGanados = puntos[i] ?? 1;
            semanal[r.jugador] = (semanal[r.jugador] || 0) + puntosGanados;
            const clase = r.mejora < 0 ? 'mejorado' : r.mejora > 0 ? 'empeorado' : '';
            const mejora = r.mejora === 0 ? '=' : (r.mejora > 0 ? '+' : '') + r.mejora.toFixed(2) + ' s';

            return `<tr class="${clase}">
              <td>${i + 1}</td>
              <td>${r.jugador}</td>
              <td>${r.tiempo.toFixed(2)} s</td>
              <td>${mejora}</td>
            </tr>`;
          }).join("")}
        </tbody>
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
  const rankingCont = document.getElementById("rankingSemanal");
  rankingCont.innerHTML = "<h3>Ranking Semanal</h3>";

  const tabla = document.createElement("table");
  tabla.innerHTML = `
    <thead>
      <tr><th>Posición</th><th>Piloto</th><th>Puntos</th></tr>
    </thead>
    <tbody>
      ${Object.entries(semanal)
        .sort((a, b) => b[1] - a[1])
        .map(([jugador, puntos], i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${jugador}</td>
            <td>${puntos}</td>
          </tr>
        `).join("")}
    </tbody>
  `;
  rankingCont.appendChild(tabla);
}

document.addEventListener('DOMContentLoaded', () => {
  cargarMejoras();

  // ✅ Botones para mostrar popups
  document.getElementById("btnReglamento").addEventListener("click", () => {
    document.getElementById("popup").style.display = "block";
  });
  document.getElementById("btnAlta").addEventListener("click", () => {
    document.getElementById("popupAlta").style.display = "block";
  });
});

function cerrarPopups() {
  document.getElementById("popup").style.display = "none";
  document.getElementById("popupAlta").style.display = "none";
}
