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

async function obtenerResultados(url, pestaña, jugadoresPermitidos) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Selección dinámica de pestaña
    await page.evaluate(pestaña => {
      const tabs = Array.from(document.querySelectorAll('a'));
      const target = tabs.find(el => el.textContent.includes(pestaña));
      if (target) target.click();
    }, pestaña);

    await page.waitForTimeout(2000);
    await page.waitForSelector('tbody tr');

    const pista = await page.$eval('div.container h3', el => el.innerText.trim());
    const escenario = await page.$eval('h2.text-center', el => el.innerText.trim());

    const resultados = await page.$$eval('tbody tr', (filas, permitidos) => {
      return filas.map(fila => {
        const celdas = fila.querySelectorAll('td');
        const jugador = celdas[2]?.innerText.trim();
        const tiempo = parseFloat(celdas[1]?.innerText.replace(',', '.'));
        if (permitidos.includes(jugador)) {
          return { jugador, tiempo };
        }
        return null;
      }).filter(Boolean);
    }, jugadoresPermitidos);

    await browser.close();
    return { pista, escenario, pestaña, resultados };
  } catch (err) {
    console.error('❌ Scraping error:', err);
    return { pista: 'Error', escenario: 'Error', pestaña, resultados: [] };
  }
}

router.get('/api/tiempos-mejorados', async (_req, res) => {
  const semana = calcularSemanaActual();

  // Obtener lista de jugadores
  const { data: jugadores } = await supabase.from('jugadores').select('id, nombre');
  const nombreToId = Object.fromEntries(jugadores.map(j => [j.nombre, j.id]));

  // Obtener configuración dinámica
  const { data: config, error: errConfig } = await supabase.from('configuracion').select('*').eq('id', 1).maybeSingle();
  if (errConfig || !config) return res.status(500).json({ error: 'No se pudo obtener configuración de tracks.' });

  const urls = [
    {
      url: `https://www.velocidrone.com/leaderboard/${config.track1_escena}/${config.track1_pista}/All`,
      pestaña: 'Race Mode: Single Class'
    },
    {
      url: `https://www.velocidrone.com/leaderboard/${config.track2_escena}/${config.track2_pista}/All`,
      pestaña: '3 Lap: Single Class'
    }
  ];

  const respuesta = [];

  for (const { url, pestaña } of urls) {
    const { pista, escenario, resultados } = await obtenerResultados(url, pestaña, Object.keys(nombreToId));

    const comparados = [];

    for (const r of resultados) {
      const id = nombreToId[r.jugador];
      if (!id) continue;

      const { data: hist } = await supabase
        .from('mejores_tiempos')
        .select('mejor_tiempo')
        .eq('jugador_id', id)
        .eq('pista', pista)
        .eq('escenario', escenario)
        .limit(1)
        .maybeSingle();

      const mejorHistorico = hist?.mejor_tiempo ?? r.tiempo;
      const mejora = parseFloat((mejorHistorico - r.tiempo).toFixed(2));

      comparados.push({ jugador: r.jugador, tiempo: r.tiempo, mejora });

      if (!hist || r.tiempo < hist.mejor_tiempo) {
        await supabase.from('mejores_tiempos').upsert({
          jugador_id: id,
          pista,
          escenario,
          mejor_tiempo: r.tiempo,
          ultima_actualizacion: new Date().toISOString()
        }, { onConflict: ['jugador_id', 'pista', 'escenario'] });
      }

      await supabase.from('resultados').insert({
        jugador_id: id,
        semana,
        pista,
        escenario,
        tiempo: r.tiempo
      });
    }

    comparados.sort((a, b) => a.tiempo - b.tiempo);
    respuesta.push({ pista, escenario, pestaña, resultados: comparados });
  }

  res.json(respuesta);
});

export default router;
