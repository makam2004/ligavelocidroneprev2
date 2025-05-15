import express from 'express';
import supabase from '../supabaseClient.js';

const router = express.Router();

router.post('/api/admin/actualizar-tracks', async (req, res) => {
  const { track1, track2 } = req.body;

  if (!track1 || !track2) {
    return res.status(400).send('Faltan los IDs de los tracks.');
  }

  try {
    // 1. Leer ranking semanal actual
    const { data: jugadoresSemana } = await supabase
      .from('resultados')
      .select('jugador_id, tiempo, pista')
      .order('tiempo', { ascending: true });

    // Agrupar por pista
    const porPista = {};
    for (const r of jugadoresSemana) {
      if (!porPista[r.pista]) porPista[r.pista] = [];
      porPista[r.pista].push(r.jugador_id);
    }

    // 2. Calcular puntos por posición
    const puntosRanking = [10, 8, 6, 4, 2]; // resto 1 punto
    const acumulado = {};

    for (const pista in porPista) {
      porPista[pista].forEach((jugadorId, idx) => {
        const puntos = puntosRanking[idx] ?? 1;
        acumulado[jugadorId] = (acumulado[jugadorId] || 0) + puntos;
      });
    }

    // 3. Actualizar ranking_anual
    for (const jugador_id in acumulado) {
      const puntos = acumulado[jugador_id];

      await supabase.from('ranking_anual').upsert({
        jugador_id,
        puntos,
        actualizado: new Date().toISOString()
      }, {
        onConflict: ['jugador_id'],
        ignoreDuplicates: false
      }).select();
    }

    // 4. Eliminar resultados semanales
    await supabase.from('resultados').delete().neq('jugador_id', '');

    // 5. Actualizar configuración de tracks
    await supabase.from('configuracion').delete().neq('id', 0);
    await supabase.from('configuracion').insert({
      track1_id: track1,
      track2_id: track2,
      fecha_actualizacion: new Date().toISOString()
    });

    res.send('Tracks actualizados, puntos sumados al ranking anual y ranking semanal reiniciado.');

  } catch (err) {
    console.error('Error al actualizar tracks:', err);
    res.status(500).send('Error al actualizar la configuración de tracks.');
  }
});

export default router;
