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
  await page.goto(url);
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    await page.waitForSelector('tbody tr', { timeout: 20000 });
  } catch {
    console.warn('Timeout: no se encontraron resultados en', url);
    await browser.close();
    return null;
  }

  const resultados = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    return rows.map(row => {
      const cols = row.querySelectorAll('td');
      return {
        jugador: cols[0]?.textContent?.trim() || '',
        tiempo: parseFloat(cols[2]?.textContent?.replace('s', '').trim()) || 0
      };
    });
  });

  const { escenario, pista } = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const [escenario, pista] = h1 ? h1.textContent.split(' - ') : ['Desconocido', 'Desconocido'];
    return { escenario: escenario?.trim(), pista: pista?.trim() };
  });

  await browser.close();
  return { escenario, pista, resultados };
}

router.get('/api/tiempos-mejorados', async (_req, res) => {
  const semana = calcularSemanaActual();
  const urls = await obtenerURLsDesdeConfiguracion();

  if (urls.length !== 2) {
    return res.status(500).json({ error: 'No se pudieron obtener los tracks configurados.' });
  }

  try {
    const resultadosFinales = [];

    for (let i = 0; i < urls.length; i++) {
      const datos = await obtenerResultados(urls[i]);

      if (!datos || !datos.resultados || datos.resultados.length === 0) continue;

      const resultadosConMejora = datos.resultados.map((r, idx) => ({
        ...r,
        mejora: idx === 0 ? 0 : parseFloat((Math.random() * 2 - 1).toFixed(2)) // aleatorio para demo
      }));

      resultadosFinales.push({
        escenario: datos.escenario,
        pista: datos.pista,
        resultados: resultadosConMejora
      });
    }

    res.json(resultadosFinales);
  } catch (err) {
    console.error('Scraping error:', err);
    res.status(500).json({ error: 'Error al obtener los resultados' });
  }
});

export default router;
