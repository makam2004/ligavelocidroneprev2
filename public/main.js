document.addEventListener("DOMContentLoaded", async () => {
  const semanaActual = obtenerSemanaActual();
  document.getElementById("titulo").innerText = `LIGA VELOCIDRONE - Semana ${semanaActual}`;

  document.getElementById("btnReglamento").addEventListener("click", () => {
    document.getElementById("popup").style.display = "block";
    fetch("/reglamento.txt")
      .then(res => res.text())
      .then(txt => {
        document.getElementById("popupTexto").innerText = txt;
      });
  });

  document.getElementById("btnAlta").addEventListener("click", () => {
    document.getElementById("popupAlta").style.display = "block";
  });

  document.getElementById("popup").addEventListener("click", (e) => {
    if (e.target.classList.contains("popup")) {
      e.target.style.display = "none";
    }
  });

  document.getElementById("popupAlta").addEventListener("click", (e) => {
    if (e.target.classList.contains("popup")) {
      e.target.style.display = "none";
    }
  });

  document.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("nombreJugador").value;
    try {
      const res = await fetch("/api/alta-jugador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre })
      });
      const json = await res.json();
      document.getElementById("mensajeAlta").innerText = json.ok ? "✅ Alta enviada" : "❌ Error: " + json.error;
    } catch (err) {
      document.getElementById("mensajeAlta").innerText = "❌ Error al registrar: " + err.message;
    }
  });

  await cargarMejoras();
  await cargarRankingAnual();
});

function obtenerSemanaActual() {
  const fecha = new Date();
  const inicio = new Date(fecha.getFullYear(), 0, 1);
  const dias = Math.floor((fecha - inicio) / 86400000);
  return Math.ceil((dias + inicio.getDay() + 1) / 7);
}

async function cargarMejoras() {
  const contenedor = document.getElementById("mejoras");
  contenedor.innerHTML = '<p>Leyendo Resultados...</p>';

  try {
    const res = await fetch("/api/tiempos-mejorados");
    const pistas = await res.json();

    contenedor.innerHTML = "";

    pistas.forEach((pista, idx) => {
      const card = document.createElement("div");
      card.className = "card";

      const titulo = document.createElement("h3");
      const pestana = idx === 0 ? "Race Mode: Single Class" : "3 Lap: Single Class";
      titulo.innerHTML = `<div class="pestana">${pestana}</div>${pista.escenario} - ${pista.pista}`;
      card.appendChild(titulo);

      const tabla = document.createElement("table");
      tabla.innerHTML = `
        <tr>
          <th>#</th>
          <th>Piloto</th>
          <th>Tiempo</th>
          <th>Mejora</th>
        </tr>
      `;

      pista.resultados.forEach((r, i) => {
        const fila = document.createElement("tr");
        if (r.mejora > 0) fila.classList.add("mejorado");
        else if (r.mejora < 0) fila.classList.add("empeorado");

        fila.innerHTML = `
          <td>${i + 1}</td>
          <td>${r.jugador}</td>
          <td>${r.tiempo}</td>
          <td>${r.mejora > 0 ? "+" : ""}${r.mejora.toFixed(2)}</td>
        `;
        tabla.appendChild(fila);
      });

      card.appendChild(tabla);
      contenedor.appendChild(card);
    });
  } catch (err) {
    console.error("❌ Error capturado en cargarMejoras:", err);
    contenedor.innerHTML = '<p>Error al cargar resultados</p>';
  }
}

async function cargarRankingAnual() {
  try {
    const res = await fetch("/api/ranking-anual");
    const data = await res.json();

    const contenedor = document.createElement("div");
    contenedor.className = "ranking-row";
    const card = document.createElement("div");
    card.className = "card";

    const titulo = document.createElement("h3");
    titulo.textContent = "Ranking Anual";
    card.appendChild(titulo);

    const tabla = document.createElement("table");
    tabla.innerHTML = `
      <tr>
        <th>#</th>
        <th>Piloto</th>
        <th>Puntos</th>
      </tr>
    `;

    data.forEach((r, i) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${i + 1}</td>
        <td>${r.nombre}</td>
        <td>${r.puntos}</td>
      `;
      tabla.appendChild(fila);
    });

    card.appendChild(tabla);
    contenedor.appendChild(card);
    document.getElementById("mejoras").appendChild(contenedor);
  } catch (err) {
    console.error("main.js:155 Error al cargar ranking anual:", err);
  }
}
