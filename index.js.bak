import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import supabase from './supabaseClient.js';
import tiemposMejorados from './routes/tiemposMejorados.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Rutas absolutas con ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Endpoint para registrar un nuevo jugador
app.post('/api/alta-jugador', async (req, res) => {
  const { nombre } = req.body;

  if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
    return res.status(400).json({ error: 'Nombre inválido.' });
  }

  try {
    const { data: existe } = await supabase
      .from('jugadores')
      .select('id')
      .eq('nombre', nombre.trim())
      .maybeSingle();

    if (existe) {
      return res.status(400).json({ error: 'El jugador ya existe.' });
    }

    const { error } = await supabase
      .from('jugadores')
      .insert([{ nombre: nombre.trim() }]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Error al registrar jugador:', err);
    res.status(500).json({ error: 'Error inesperado.' });
  }
});

// Rutas adicionales (scraping, etc.)
app.use(tiemposMejorados);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
