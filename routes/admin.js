import express from 'express';
import basicAuth from 'express-basic-auth';
import supabase from '../supabaseClient.js';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware de autenticación global
const auth = basicAuth({
  users: { [process.env.ADMIN_USER]: process.env.ADMIN_PASS },
  challenge: true
});

// ✅ Ruta protegida para servir admin.html
router.get('/admin.html', auth, (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// ✅ Ruta POST para actualizar tracks y sumar puntos
router.post('/admin/update-tracks', auth, async (req, res) => {
  try {
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

    if (error) throw error;

    // Llamar a la función que transfiere puntos del ranking semanal al anual
    const { error: rpcError } = await supabase.rpc('incrementar_ranking_anual');
    if (rpcError) throw rpcError;

    res.status(200).json({ mensaje: '✅ Tracks actualizados y puntos añadidos al ranking anual' });
  } catch (err) {
    console.error('❌ Error en update-tracks:', err.message);
    res.status(500).json({ error: 'Error al actualizar tracks o ranking anual' });
  }
});

// ✅ Ruta POST independiente para commit manual del ranking
router.post('/admin/commit-ranking', auth, async (_req, res) => {
  try {
    const { error } = await supabase.rpc('incrementar_ranking_anual');
    if (error) throw error;
    res.json({ mensaje: '✅ Ranking anual actualizado correctamente.' });
  } catch (err) {
    console.error('❌ Error en commit-ranking:', err.message);
    res.status(500).json({ error: 'Error al actualizar el ranking anual.' });
  }
});

export default router;
