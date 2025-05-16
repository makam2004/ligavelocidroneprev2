router.get('/api/ranking-anual', async (_req, res) => {
  try {
    const { data: jugadores } = await supabase.from('jugadores').select('id, nombre');
    const { data: ranking } = await supabase.from('ranking_anual').select('jugador_id, puntos');

    if (!Array.isArray(jugadores) || !Array.isArray(ranking)) {
      return res.status(500).json({ error: 'Datos incompletos' });
    }

    const nombres = Object.fromEntries(jugadores.map(j => [j.id, j.nombre]));

    const resultado = ranking.map(r => ({
      nombre: nombres[r.jugador_id] || 'Desconocido',
      puntos: r.puntos
    }));

    res.json(resultado.sort((a, b) => b.puntos - a.puntos));
  } catch (err) {
    console.error('Error al obtener ranking anual:', err.message);
    res.status(500).json({ error: 'Error al obtener ranking anual' });
  }
});
