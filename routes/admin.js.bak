import express from 'express';
import basicAuth from 'express-basic-auth';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 🔐 Middleware de autenticación
router.use(basicAuth({
  users: { [process.env.ADMIN_USER]: process.env.ADMIN_PASS },
  challenge: true
}));

// ✅ Página HTML
router.get('/admin', (_req, res) => {
  res.sendFile('admin.html', { root: './public' });
});

// ✅ Actualizar pistas semanales
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
    console.error(error);
    res.status(500).send("❌ Error al guardar configuración");
  } else {
    res.send("✅ Tracks actualizados correctamente.");
  }
});

// ✅ Cerrar semana y pasar puntos al ranking anual
router.post('/admin/commit-week', async (req, res) => {
  const { data: semanal, error } = await supabase.from('ranking_semanal').select('*');

  if (error) {
    return res.status(500).send("❌ Error al leer ranking semanal");
  }

  for (const fila of semanal) {
    const { nombre, puntos } = fila;
    await supabase.rpc('incrementar_ranking_anual', {
      jugador: nombre,
      puntos_a_sumar: puntos
    });
  }

  await supabase.from('ranking_semanal').delete().neq('nombre', '');

  await supabase.from('logs_admin').insert([{
    usuario: req.auth.user,
    accion: "Commit Semanal",
    detalles: `Pasados ${semanal.length} jugadores al ranking anual`
  }]);

  res.send("✅ Ranking semanal procesado y trasladado al anual.");
});

export default router;
