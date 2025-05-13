import express from 'express';
import puppeteer from 'puppeteer';
import supabase from '../supabaseClient.js';

const router = express.Router();

function calcularSemanaActual() {
  const fecha = new Date();
  const inicio = new Date(fecha.getFullYear(), 0, 1);
  const dias = Math.floor((fecha - inicio) / 86400000);
  return Math.ceil((dias + inicio.getDay() + 1) / 7);
}

async function obtenerURLsDesdeConfiguracion() {
  const { data, error } = await supabase
    .from('configuracion')
    .select('track1_id, track2_id')
    .order('fecha_actualizacion', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    console.error('Error al obtener configuración de tracks:', error);
    return [];
  }

  return [
    `https://www.velocidrone.com/leaderboard/${data.track1_id}/All`,
    `https://www.velocidrone.com/leaderboard/${data.track2_id}/All`
  ];
}

async function obtenerResultados(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Hacer clic en pestaña "Race Mode: Single Class"
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('a')).filter(el =>
      el.textContent.includes('Race Mode: Single Class')
    );
    if (tabs.length > 0) tabs[0].click();
  });

  // Esperar a que cargue la tabla después del clic
  await page.waitForSelector('tbody tr', { timeout: 10000 });

  // Extraer nombres de escenario y pista
  const pista = await page.$eval('div.container h3', el => el.innerText.trim());
  const escenario = await page.$eval('h2.text-center', el => el.innerText.trim());

  // Leer los resultados
  const resultados = await page.$$eval('tbody tr', filas => {
    return filas.map(fila => {
      const celdas = fila.querySelectorAll('td');
      const jugador = celdas[3]?.innerText.trim(); // columna Player (índice 3)
      const tiempoStr = celdas[4]?.innerText.trim(); // columna Time (índice 4)
      const tiempo = parseFloat(tiempoStr.replace(',', '.').replace('s', ''));

      return { jugador, tiempo };
    });
  });

  await browser.close();

  console.log(`[Scraping] ${resultados.length} pilotos leídos de ${pista} - ${escenario}`);

  resultados.sort((a, b) => a.tiempo - b.tiempo);

  return { pista, escenario, resultados };
}

router.get('/api/tiempos-mejorados', async (_req, res) => {
  const semana = calcularSemanaActual();

  // 🔁 Comentado el filtro temporal para depuración
  // const { data: jugadores } = await supabase.from('jugadores').select('id, nombre');
  // const nombreToId = Object.fromEntries(jugadores.map(j => [j.nombre, j.id]));
  // const nombresPermitidos = Object.keys(nombreToId);

  const urls = await obtenerURLsDesdeConfiguracion();
  if (!urls.length) return res.status(500).json({ error: 'No hay configuración de tracks.' });

  const respuesta = [];

  for (const url of urls) {
    const { pista, escenario, resultados } = await obtenerResultados(url);

    const comparados = resultados.map((r, i) => ({
      jugador: r.jugador,
      tiempo: r.tiempo,
      mejora: i === 0 ? 0 : parseFloat((Math.random() * 2 - 1).toFixed(2)) // temporal
    }));

    respuesta.push({ pista, escenario, resultados: comparados });
  }

  res.json(respuesta);
});

export default router;
