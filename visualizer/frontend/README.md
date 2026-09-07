# HoneyTrace Visualizer Web

Frontend local en React, TypeScript, Vite y Tailwind CSS para consultar la API privada del visualizador.

## Desarrollo local

```powershell
Copy-Item .env.example .env
npm ci
npm run dev
```

La interfaz usa `http://localhost:8080` por defecto. El backend debe estar activo y tener configurado GitHub OAuth con callback `http://localhost:8080/api/auth/github/callback` y frontend `http://localhost:5173`.

## Funcionalidad

- Login mediante GitHub y sesión por cookies `HttpOnly`.
- Dashboard con métricas, actividad reciente y fuentes.
- Historial paginado con búsqueda y filtros server-side.
- Attack Explorer con grafo 3D, timeline, evidencias y exportación.
- Creación y revocación de tokens de ingestión.
- Vista de configuración del entorno local.

## Validación

```powershell
npm run build
npm test
```
