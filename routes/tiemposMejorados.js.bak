import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const TRACKS = [
  { escena: 33, pista: 1527, pestana: "Race Mode: Single Class" },
  { escena: 16, pista: 1795, pestana: "3 Lap: Single Class" }
];

export default async function obtenerResultados(req, res) {
  try {
    const jugadores = await supabase.from('jugadores').select('nombre');
    const nombresValidos = jugadores.data.map(j => j.nombre.toLowerCase());

    const browser = await puppeteer.launch({
      args: ['--no-sandbox'],
      headless: true
    });
    const resultados = [];

    for (const track of TRACKS) {
      const url = `https://www.velocidrone.com/leaderboard/${track.escena}/${track.pista}/All`;
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });

      // Selecciona la pestaña correspondiente
      const pestanas = await page.$$('.leaderboard-category-tab');
      const textoTabs = await Promise.all(pestanas.map(el => el.evaluate(n => n.textContent.trim())));
      const indexTab = textoTabs.findIndex(t => t.includes(track.pestana));
      if (indexTab >= 0) await pestanas[indexTab].click();

      await page.waitForSelector('table tbody tr');

      const datos = await page.evaluate(() => {
        const filas = Array.from(document.querySelectorAll("table tbody tr"));
        return filas.map(f => {
          const celdas = f.querySelectorAll("td");
          const player = celdas[2]?.innerText?.trim() || "";
          const time = parseFloat(celdas[1]?.innerText?.trim()) || 0;
          return { jugador: player, tiempo: time, mejora: "-" };
        });
      });

      // Filtrar solo pilotos registrados
      const filtrados = datos.filter(d => nombresValidos.includes(d.jugador.toLowerCase()));

      resultados.push({
        escenario: track.escena,
        pista: track.pista,
        pestana: track.pestana,
        resultados: filtrados
      });

      await page.close();
    }

    await browser.close();
    res.json(resultados);
  } catch (e) {
    console.error("Scraping error:", e);
    res.status(500).json({ error: "Error al obtener los resultados" });
  }
}
