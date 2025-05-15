import express from 'express';
import basicAuth from 'express-basic-auth';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

router.use(basicAuth({
  users: { [process.env.ADMIN_USER]: process.env.ADMIN_PASS },
  challenge: true
}));

// Página admin
router.get('/admin', (_req, res) => {
  res.sendFile('admin.html', { root: './public' });
});

// Actualizar tracks
router.post('/admin/update-tracks', express.json(), async (req, res) => {
  const { track1_escena, track1_pista, track2_escena, track2_pista } = req.body;

  const { error } = await supabase
    .from('configuracion')
    .upsert([{
      id: 1,
      track1_escena,
      track1_pista,
      track2_escena,
      track2_pista,
      fecha_actualizacion: new Date().toISOString()
    }], { onConflict: ['id'] });

  if (error) {
    console.error(error);
    return res.status(500).send('Error al actualizar tracks');
  }

  res.send('✅ Tracks actualizados');
});

// Commit semanal
router.post('/admin/commit-week', async (_req, res) => {
  const { data: ranking, error } = await supabase.from('ranking_semanal').select('*');

  if (error) return res.status(500).send('Error al leer ranking semanal');

  for (const r of ranking) {
    await supabase.rpc('incrementar_ranking_anual', {
      jugador: r.nombre,
      puntos_a_sumar: r.puntos
    });
  }

  await supabase.from('ranking_semanal').delete().neq('nombre', '');

  res.send('✅ Commit completado');
});

export default router;
