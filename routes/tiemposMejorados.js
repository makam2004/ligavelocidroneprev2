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

async function obtenerResultados(url, jugadoresPermitidos, forzarRaceMode = false) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  if (forzarRaceMode) {
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('a')).filter(el =>
        el.textContent.includes('Race Mode: Single Class')
      );
      if (tabs.length > 0) tabs[0].click();
    });
    // 🛠️ Sustituimos waitForTimeout por setTimeout correcto
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  await page.waitForSelector('tbody tr', { timeout: 10000 });

  const pista = await page.$eval('div.container h3', el => el.innerText.trim());
  const escenario = await page.$eval('h2.text-center', el => el.innerText.trim());

  const resultadosCrudos = await page.$$eval('tbody tr', filas => {
    return Array.from(filas).slice(1).map(fila => {
      const celdas = fila.querySelectorAll('td');
      const tiempo = celdas[1]?.innerText.trim();
      const jugador = celdas[2]?.innerText.trim();
      return { jugador, tiempo };
    });
  });

  await browser.close();

  const resultadosFiltrados = resultadosCrudos.filter(r => jugadoresPermitidos.includes(r.jugador));

  resultadosFiltrados.sort((a, b) => {
    const tA = r.tiempo === "Error" ? Infinity : parseFloat(a.tiempo);
    const tB = r.tiempo === "Error" ? Infinity : parseFloat(b.tiempo);
    return tA - tB;
  });

  return { pista, escenario, resultados: resultadosFiltrados };
}

router.get('/api/tiempos-mejorados', async (_req, res) => {
  const semana = calcularSemanaActual();

  const { data: jugadoresDB, error } = await supabase.from('jugadores').select('nombre');
  const jugadoresPermitidos = jugadoresDB?.map(j => j.nombre) || [];

  const urls = await obtenerURLsDesdeConfiguracion();
  if (urls.length < 2) return res.status(500).json({ error: 'Faltan URLs de tracks' });

  const respuesta = [];

  const resultado1 = await obtenerResultados(urls[0], jugadoresPermitidos, true);  // Race Mode
  const resultado2 = await obtenerResultados(urls[1], jugadoresPermitidos, false); // 3 Lap

  for (const { pista, escenario, resultados } of [resultado1, resultado2]) {
    const comparados = resultados.map(r => ({
      jugador: r.jugador,
      tiempo: r.tiempo,
      mejora: "–"
    }));
    respuesta.push({ pista, escenario, resultados: comparados });
  }

  res.json(respuesta);
});

export default router;
