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

async function obtenerResultados(url, jugadoresPermitidos) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Clic en la pestaña "Race Mode: Single Class"
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('a')).filter(el =>
      el.textContent.includes('Race Mode: Single Class')
    );
    if (tabs.length > 0) tabs[0].click();
  });

  // Esperar a que se cargue la tabla
  await page.waitForSelector('tbody tr', { timeout: 10000 });

  // Obtener pista y escenario
  const pista = await page.$eval('div.container h3', el => el.innerText.trim());
  const escenario = await page.$eval('h2.text-center', el => el.innerText.trim());

  // Leer tabla filtrando jugadores
  const resultados = await page.$$eval('tbody tr', (filas, jugadores) => {
    return filas
      .map(fila => {
        const celdas = fila.querySelectorAll('td');
        const nombre = celdas[1]?.innerText.trim(); // columna "Pilot"
        const tiempoStr = celdas[2]?.innerText.trim(); // columna "Time"
        const tiempo = parseFloat(tiempoStr.replace(',', '.').replace('s', ''));

        if (jugadores.includes(nombre)) {
          return { jugador: nombre, tiempo };
        }
        return null;
      })
      .filter(Boolean);
  }, jugadoresPermitidos);

  await browser.close();

  // Ordenar por tiempo ascendente
  resultados.sort((a, b) => a.tiempo - b.tiempo);

  return { pista, escenario, resultados };
}

router.get('/api/tiempos-mejorados', async (_req, res) => {
  const semana = calcularSemanaActual();

  const { data: jugadores } = await supabase.from('jugadores').select('id, nombre');
  const nombreToId = Object.fromEntries(jugadores.map(j => [j.nombre, j.id]));
  const nombresPermitidos = Object.keys(nombreToId);

  const urls = await obtenerURLsDesdeConfiguracion();
  if (!urls.length) return res.status(500).json({ error: 'No hay configuración de tracks.' });

  const respuesta = [];

  for (const url of urls) {
    const { pista, escenario, resultados } = await obtenerResultados(url, nombresPermitidos);

    const resultadosConId = resultados.map(r => ({
      ...r,
      jugador_id: nombreToId[r.jugador]
    }));

    const comparados = [];

    for (const r of resultadosConId) {
      // Consulta de mejor tiempo previo
      const { data: hist } = await supabase
        .from('mejores_tiempos')
        .select('mejor_tiempo')
        .eq('jugador_id', r.jugador_id)
        .eq('pista', pista)
        .eq('escenario', escenario)
        .maybeSingle();

      const mejorHistorico = hist?.mejor_tiempo ?? r.tiempo;
      const mejora = parseFloat((mejorHistorico - r.tiempo).toFixed(2));

      comparados.push({
        jugador: r.jugador,
        tiempo: r.tiempo,
        mejora
      });

      // Actualización en mejores_tiempos
      if (!hist || r.tiempo < hist.mejor_tiempo) {
        await supabase.from('mejores_tiempos').upsert({
          jugador_id: r.jugador_id,
          pista,
          escenario,
          mejor_tiempo: r.tiempo,
          ultima_actualizacion: new Date().toISOString()
        }, { onConflict: ['jugador_id', 'pista', 'escenario'] });
      }

      // Registro de resultado semanal
      await supabase.from('resultados').insert({
        jugador_id: r.jugador_id,
        semana,
        pista,
        escenario,
        tiempo: r.tiempo
      });
    }

    respuesta.push({ pista, escenario, resultados: comparados });
  }

  res.json(respuesta);
});

export default router;
