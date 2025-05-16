import express from 'express';
import supabase from '../supabaseClient.js';

const router = express.Router();

router.get('/api/ranking-anual', async (_req, res) => {
  try {
    // Obtener todos los jugadores
    const { data: jugadores, error: errorJugadores } = await supabase
      .from('jugadores')
      .select('id, nombre');

    if (errorJugadores) throw errorJugadores;

    // Obtener el ranking anual (id y puntos)
    const { data: ranking, error: errorRanking } = await supabase
      .from('ranking_anual')
      .select('jugador_id, puntos');

    if (errorRanking) throw errorRanking;

    // Enlazar los puntos con los nombres de los jugadores
    const nombres = Object.fromEntries(jugadores.map(j => [j.id, j.nombre]));

    const resultado = ranking.map(r => ({
      nombre: nombres[r.jugador_id] || 'Desconocido',
      puntos: r.puntos
    }));

    // Ordenar de mayor a menor puntuación
    res.json(resultado.sort((a, b) => b.puntos - a.puntos));
  } catch (err) {
    console.error('Error al obtener ranking anual:', err.message);
    res.status(500).json({ error: 'Error al obtener ranking anual' });
  }
});

export default router;
