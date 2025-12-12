export const requerirRol = (...roles) => (req, res, next) => {
    if (!req.usuario) {
        return res.status(401).json({ mensaje: 'No autenticado' });
    }
    if (!roles.includes(req.usuario.tipoUsuario)) {
        return res.status(403).json({ mensaje: 'Acceso denegado' });
    }
    next();
};
