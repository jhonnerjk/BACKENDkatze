# Despliegue Backend (Render)

## Variables de entorno
- `MONGO_URI`: cadena de conexión de MongoDB Atlas
- `JWT_SECRET`: secreto para JWT
- `CLOUDINARY_URL` o (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)
- Opcional: `CLOUDINARY_FOLDER` (por defecto `katze/uploads`)

## Comandos
- Build: `npm install`
- Start: `node src/server.js`
- Seed opcional: `node src/seed/seed.js`

## Notas
- Si Cloudinary está configurado, las imágenes se subirán a Cloudinary y se devolverá `secure_url`.
- Si no, se guardarán en `uploads/` local y se servirán vía `/uploads/:filename`.
