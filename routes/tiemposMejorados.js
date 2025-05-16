import express from 'express';
import puppeteer from 'puppeteer';
import supabase from './supabaseClient.js';

const router = express.Router();

const urls = [
  'https://www.velocidrone.com/leaderboard/33/1527/All',
  'https://www.velocidrone.com/leaderboard/16/1795/All'
];

function calcularSemanaActual() {
  const fecha = new Date();
  const inicio = new Date(fecha.getFullYear(), 0, 1);
  const dias = Math.floor((fecha - inicio) / 86400000);
  return Math.ceil((dias + inicio.getDay() + 1) / 7);
}

async function obtenerResultados(url, nombresJugadores) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    if (url.includes('33/1527')) {
      // Race Mode: Single Class
      await page.evaluate(() => {
        const tab = [...document.querySelectorAll('a')].find(a => a.textContent.includes('Race Mode'));
        if (tab) tab.click();
      });
    } else {
      // 3 Lap: Single Class
      await page.evaluate(() => {
        const tab = [...document.querySelectorAll('a')].find(a => a.textContent.includes('3 Lap'));
        if (tab) tab.click();
      });
    }

    await new Promise(res => setTimeout(res, 1000));
    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const pista = await page.$eval('div.container h3', el => el.innerText.trim());
    const escenario = await page.$eval('h2.text-center', el => el.innerText.trim());

    const resultados = await page.$$eval('tbody tr', (filas, jugadores) => {
      return [...filas].map(fila => {
        const celdas = fila.querySelectorAll('td');
        const tiempo = parseFloat(celdas[1]?.innerText.replace(',', '.').trim());
        const jugador = celdas[2]?.innerText.trim();
        if (jugadores.includes(jugador)) {
          return { tiempo, jugador };
        }
        return null;
      }).filter(Boolean);
    }, nombresJugadores);

    await browser.close();
    return { pista, escenario, resultados };
  } catch (e) {
    console.error('❌ Scraping error:', e);
    return { pista: 'Error', escenario: 'Error', resultados: [] };
  }
}

router.get('/api/tiempos-mejorados', async (_req, res) => {
  const semana = calcularSemanaActual();
  const { data: jugadores } = await supabase.from('jugadores').select('id, nombre');
  const nombreToId = Object.fromEntries(jugadores.map(j => [j.nombre, j.id]));

  const respuesta = [];

  for (const url of urls) {
    const { pista, escenario, resultados } = await obtenerResultados(url, Object.keys(nombreToId));

    const resultadosConId = resultados.map(r => ({
      ...r,
      jugador_id: nombreToId[r.jugador]
    }));

    const comparados = [];

    for (const r of resultadosConId) {
      const { data: hist } = await supabase
        .from('mejores_tiempos')
        .select('mejor_tiempo')
        .eq('jugador_id', r.jugador_id)
        .eq('pista', pista)
        .eq('escenario', escenario)
        .maybeSingle();

      const mejorHistorico = hist?.mejor_tiempo ?? r.tiempo;
      const mejora = parseFloat((mejorHistorico - r.tiempo).toFixed(2));

      comparados.push({ jugador: r.jugador, tiempo: r.tiempo, mejora });

      if (!hist || r.tiempo < hist.mejor_tiempo) {
        await supabase.from('mejores_tiempos').upsert({
          jugador_id: r.jugador_id,
          pista,
          escenario,
          mejor_tiempo: r.tiempo,
          ultima_actualizacion: new Date().toISOString()
        }, { onConflict: ['jugador_id', 'pista', 'escenario'] });
      }

      await supabase.from('resultados').insert({
        jugador_id: r.jugador_id,
        semana,
        pista,
        escenario,
        tiempo: r.tiempo
      });
    }

    comparados.sort((a, b) => a.tiempo - b.tiempo);
    respuesta.push({ pista, escenario, resultados: comparados });
  }

  res.json(respuesta);
});

export default router;
