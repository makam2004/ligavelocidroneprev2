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

  await page.waitForSelector('tbody tr', { timeout: 10000 });

  const pista = await page.$eval('div.container h3', el => el.innerText.trim());
  const escenario = await page.$eval('h2.text-center', el => el.innerText.trim());

  const resultados = await page.$$eval('tbody tr', filas => {
    return Array.from(filas).slice(1).map(fila => {
      const celdas = fila.querySelectorAll('td');
      const tiempo = celdas[1] ? celdas[1].innerText.trim() : "Error";     // "Time" → 2ª columna
      const jugador = celdas[2] ? celdas[2].innerText.trim() : "Error";   // "Player" → 3ª columna
      return { jugador, tiempo };
    });
  });

  await browser.close();

  resultados.sort((a, b) => {
    const tA = a.tiempo === "Error" ? Infinity : parseFloat(a.tiempo);
    const tB = b.tiempo === "Error" ? Infinity : parseFloat(b.tiempo);
    return tA - tB;
  });

  return { pista, escenario, resultados };
}

router.get('/api/tiempos-mejorados', async (_req, res) => {
  const semana = calcularSemanaActual();
  const urls = await obtenerURLsDesdeConfiguracion();

  if (!urls.length) return res.status(500).json({ error: 'No hay configuración de tracks.' });

  const respuesta = [];

  for (const url of urls) {
    const { pista, escenario, resultados } = await obtenerResultados(url);

    const comparados = resultados.map(r => ({
      jugador: r.jugador,
      tiempo: r.tiempo,
      mejora: "–"
    }));

    respuesta.push({ pista, escenario, resultados: comparados });
  }

  console.log('[API] Resultado final enviado:');
  console.log(JSON.stringify(respuesta, null, 2));
  res.json(respuesta);
});

export default router;
