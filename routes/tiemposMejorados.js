import express from 'express';
import puppeteer from 'puppeteer';
import supabase from '../supabaseClient.js';

const router = express.Router();

const urls = [
  {
    url: 'https://www.velocidrone.com/leaderboard/33/1527/All',
    pestana: 'Race Mode: Single Class'
  },
  {
    url: 'https://www.velocidrone.com/leaderboard/16/1795/All',
    pestana: '3 Lap: Single Class'
  }
];

function calcularSemanaActual() {
  const fecha = new Date();
  const inicio = new Date(fecha.getFullYear(), 0, 1);
  const dias = Math.floor((fecha - inicio) / 86400000);
  return Math.ceil((dias + inicio.getDay() + 1) / 7);
}

async function obtenerResultados(url, pestana, jugadoresRegistrados) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  await page.evaluate((pestanaTexto) => {
    const tab = Array.from(document.querySelectorAll('a')).find(el =>
      el.textContent.includes(pestanaTexto)
    );
    if (tab) tab.click();
  }, pestana);

  await page.waitForSelector('tbody tr', { timeout: 10000 });

  const pista = await page.$eval('div.container h3', el => el.innerText.trim());
  const escenario = await page.$eval('h2.text-center', el => el.innerText.trim());

  const resultados = await page.$$eval('tbody tr', (filas, jugadores) => {
    return filas.map(fila => {
      const celdas = fila.querySelectorAll('td');
      const tiempo = parseFloat(celdas[1]?.innerText.replace(',', '.').trim());
      const jugador = celdas[2]?.innerText.trim();
      if (jugadores.includes(jugador)) return { jugador, tiempo };
      return null;
    }).filter(Boolean);
  }, jugadoresRegistrados);

  await browser.close();
  return { escenario, pista, pestana, resultados };
}

router.get('/api/tiempos-mejorados', async (_req, res) => {
  try {
    const semana = calcularSemanaActual();

    const { data: jugadores } = await supabase.from('jugadores').select('id, nombre');
    const nombreToId = Object.fromEntries(jugadores.map(j => [j.nombre, j.id]));
    const resultadosFinales = [];

    for (const { url, pestana } of urls) {
      const { escenario, pista, resultados } = await obtenerResultados(url, pestana, Object.keys(nombreToId));

      const comparados = [];

      for (const r of resultados) {
        const jugador_id = nombreToId[r.jugador];
        if (!jugador_id) continue;

        const { data: hist } = await supabase
          .from('mejores_tiempos')
          .select('mejor_tiempo')
          .eq('jugador_id', jugador_id)
          .eq('pista', pista)
          .eq('escenario', escenario)
          .limit(1)
          .maybeSingle();

        const mejorHistorico = hist?.mejor_tiempo ?? r.tiempo;
        const mejora = parseFloat((mejorHistorico - r.tiempo).toFixed(2));

        comparados.push({ jugador: r.jugador, tiempo: r.tiempo, mejora });

        // Actualiza mejor tiempo si es nuevo récord
        if (!hist || r.tiempo < hist.mejor_tiempo) {
          await supabase.from('mejores_tiempos').upsert({
            jugador_id,
            pista,
            escenario,
            mejor_tiempo: r.tiempo,
            ultima_actualizacion: new Date().toISOString()
          }, { onConflict: ['jugador_id', 'pista', 'escenario'] });
        }

        // Guarda resultado
        await supabase.from('resultados').insert({
          jugador_id,
          semana,
          pista,
          escenario,
          tiempo: r.tiempo
        });
      }

      comparados.sort((a, b) => a.tiempo - b.tiempo);
      resultadosFinales.push({ pestana, pista, escenario, resultados: comparados });
    }

    res.json(resultadosFinales);
  } catch (e) {
    console.error("Scraping error:", e);
    res.status(500).json({ error: 'Error en el scraping' });
  }
});

export default router;
