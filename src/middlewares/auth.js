import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware para verificar el token JWT
export const requerirAutenticacion = async (req, res, next) => {
  let token;

  // 1. Revisar si el token existe en el encabezado 'Authorization'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. Extraer el token (eliminar 'Bearer ')
      token = req.headers.authorization.split(' ')[1];

      // 3. Verificar el token y decodificar el payload
      const decodificado = jwt.verify(token, JWT_SECRET);
      // Se espera payload con `sub` y opcionalmente rol; usamos `sub` como id
      const usuarioId = decodificado.sub || decodificado.id;
      // 4. Buscar el usuario en la base de datos (sin incluir la contraseña)
      req.usuario = await Usuario.findById(usuarioId).select('-contrasena');

      if (!req.usuario) {
        return res.status(401).json({ mensaje: 'Usuario no encontrado o token inválido.' });
      }

      // 5. Continuar al siguiente middleware o al controlador
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ mensaje: 'No autorizado, token fallido o expirado.' });
    }
  }

  // 6. Si no hay token
  if (!token) {
    return res.status(401).json({ mensaje: 'No autorizado, no se proveyó token.' });
  }
};
// Alias para compatibilidad con otras rutas
export const protect = requerirAutenticacion;

export default requerirAutenticacion;