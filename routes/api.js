import express from 'express';
import supabase from '../supabaseClient.js'; // Ajusta el path si lo pones en otra carpeta

const router = express.Router();

// Alta de jugador
router.post('/api/jugadores', async (req, res) => {
  const { nombre } = req.body;

  if (!nombre || nombre.trim().length < 3) {
    return res.status(400).json({ error: 'Nombre inválido' });
  }

  const { data, error } = await supabase
    .from('jugadores')
    .insert([{ nombre: nombre.trim() }]);

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ message: 'Jugador añadido', data });
});

// Listado completo de jugadores (admin)
router.get('/api/jugadores', async (_req, res) => {
  const { data, error } = await supabase
    .from('jugadores')
    .select('id, nombre, fecha_alta')
    .order('fecha_alta', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
