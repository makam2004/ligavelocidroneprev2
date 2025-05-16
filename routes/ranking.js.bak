import express from 'express';
import supabase from '../supabaseClient.js';

const router = express.Router();

router.get('/api/ranking-anual', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('ranking_anual')
      .select('puntos, jugador_id, jugadores(nombre)')
      .order('puntos', { ascending: false });

    if (error) throw error;

    const resultado = data.map(r => ({
      nombre: r.jugadores?.nombre || 'Desconocido',
      puntos: r.puntos
    }));

    res.json(resultado);
  } catch (err) {
    console.error('Error al obtener ranking anual:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

export default router;
