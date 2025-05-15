import express from 'express';
import basicAuth from 'express-basic-auth';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

router.use(basicAuth({
  users: { [process.env.ADMIN_USER]: process.env.ADMIN_PASS },
  challenge: true
}));

router.get('/admin', (_req, res) => {
  res.sendFile('admin.html', { root: './public' });
});

router.post('/admin/update-tracks', express.json(), async (req, res) => {
  const { track1_escena, track1_pista, track2_escena, track2_pista } = req.body;
  const { error } = await supabase.from('configuracion').insert([{
    track1_escena: +track1_escena,
    track1_pista: +track1_pista,
    track2_escena: +track2_escena,
    track2_pista: +track2_pista,
    fecha_actualizacion: new Date()
  }]);

  await supabase.from('logs_admin').insert([{
    usuario: req.auth.user,
    accion: "Actualizar Tracks",
    detalles: JSON.stringify(req.body)
  }]);

  if (error) {
    res.status(500).send("❌ Error al guardar configuración");
  } else {
    res.send("✅ Tracks actualizados correctamente.");
  }
});

router.post('/admin/commit-week', async (req, res) => {
  const { data: semanal } = await supabase.from('ranking_semanal').select('*');

  for (const fila of semanal) {
    const { nombre, puntos } = fila;
    await supabase.rpc('incrementar_ranking_anual', { jugador: nombre, puntos_a_sumar: puntos });
  }

  await supabase.from('ranking_semanal').delete().neq('nombre', '');

  await supabase.from('logs_admin').insert([{
    usuario: req.auth.user,
    accion: "Commit Semanal",
    detalles: `Pasados ${semanal.length} pilotos al ranking anual`
  }]);

  res.send("✅ Puntos pasados al ranking anual correctamente.");
});

export default router;
