async function cargarMejoras() {
  const cont1 = document.getElementById("track1");
  const cont2 = document.getElementById("track2");
  cont1.innerHTML = cont2.innerHTML = "";

  try {
    console.log("▶️ Solicitando resultados...");
    const res = await fetch("/api/tiempos-mejorados");

    if (!res.ok) throw new Error(`HTTP error ${res.status}`);

    const data = await res.json();
    console.log("[DEBUG] Datos recibidos:", data);

    const puntos = [10, 8, 6, 4, 2];
    const semanal = {};

    data.forEach((pista, index) => {
      console.log(`📍 Procesando pista ${index + 1}:`, pista);

      const container = index === 0 ? cont1 : cont2;

      const pestana = document.createElement('div');
      pestana.textContent = pista.pestana || '';
      pestana.className = 'nombre-pestana';
      container.appendChild(pestana);

      const titulo = document.createElement("h3");
      titulo.textContent = `${pista.escenario} - ${pista.pista}`;
      container.appendChild(titulo);

      const tabla = document.createElement("table");
      const filas = pista.resultados.map((r, i) => {
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
      });

      tabla.innerHTML = `
        <thead>
          <tr><th>Ranking</th><th>Piloto</th><th>Tiempo</th><th>Mejora</th></tr>
        </thead>
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

document.addEventListener('DOMContentLoaded', () => {
  cargarMejoras();
});
