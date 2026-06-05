# 🎨 Escuela de Dibujo Manager

Aplicación web completa para gestionar alumnos, pagos, asistencia, grupos y facturación de una escuela de dibujo.

---

## ⚡ Requisitos previos

- **Node.js** v18 o superior → https://nodejs.org
- **npm** v9 o superior (viene con Node.js)

---

## 🚀 Instalación — opción A (un solo comando)

```bash
cd escuela-dibujo-manager
npm install           # instala concurrently
npm run install:all   # instala dependencias de backend y frontend
npm run db:init       # genera BD, migra y carga datos de prueba
npm run dev           # arranca backend + frontend a la vez
```

Visita **http://localhost:3000** 🎉

---

## 🚀 Instalación — opción B (manual, dos terminales)

### Terminal 1 — Backend

```bash
cd escuela-dibujo-manager/backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

El backend arranca en: **http://localhost:3001**

### Terminal 2 — Frontend

```bash
cd escuela-dibujo-manager/frontend
npm install
npm run dev
```

El frontend arranca en: **http://localhost:3000**

> El archivo `.env` ya está creado con los valores por defecto. Solo cámbialo si necesitas otro puerto o base de datos.

---

## 🔐 Usuarios de prueba

| Rol           | Email                    | Contraseña |
|---------------|--------------------------|------------|
| Administrador | admin@arteycolor.es      | admin123   |
| Profesor      | ana@arteycolor.es        | prof123    |

---

## 📁 Estructura del proyecto

```
escuela-dibujo-manager/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      ← Modelo de base de datos
│   │   └── seed.ts            ← Datos de prueba
│   ├── src/
│   │   ├── routes/            ← Endpoints de la API
│   │   ├── middleware/        ← Auth y roles
│   │   └── index.ts           ← Servidor Express
│   ├── .env                   ← Variables de entorno (crear manualmente)
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/             ← Pantallas de la app
    │   ├── components/        ← Componentes reutilizables
    │   ├── api/               ← Llamadas a la API
    │   ├── context/           ← Contexto de autenticación
    │   └── utils/pdf.ts       ← Generador de PDFs
    └── package.json
```

---

## 🛠️ Comandos útiles

### Backend

```bash
npm run dev           # Servidor en modo desarrollo (recarga automática)
npm run build         # Compilar TypeScript
npm run db:migrate    # Aplicar migraciones pendientes
npm run db:seed       # Cargar datos de prueba
npm run db:studio     # Abrir Prisma Studio (explorador visual de BD)
npm run db:reset      # Resetear BD y recargar datos de prueba
```

### Frontend

```bash
npm run dev           # Servidor de desarrollo
npm run build         # Build de producción
npm run preview       # Previsualizar el build
```

---

## 🔧 Problemas comunes

### "Cannot find module @prisma/client"
```bash
cd backend && npx prisma generate
```

### "Port 3001 is already in use"
Cambiar el puerto en `/backend/.env`: `PORT=3002`
Y en `/frontend/vite.config.ts` actualizar el proxy.

### La base de datos está vacía
```bash
cd backend && npm run db:reset
```

### Error de CORS
Asegúrate de que el backend está en el puerto 3001 y el frontend en el 3000.

---

## 📦 Producción (despliegue futuro)

Para desplegar en un servidor:

1. **Backend**: `npm run build && node dist/index.js`
2. **Frontend**: `npm run build` → sirve la carpeta `dist/` con Nginx/Apache
3. Cambiar `DATABASE_URL` a PostgreSQL si se necesita más escala
4. Usar variables de entorno seguras en producción

---

## 🔮 Próximas mejoras (v2)

- [ ] Exportación a Excel
- [ ] Notificaciones por email automáticas
- [ ] Historial completo de cambios (audit log)
- [ ] Copias de seguridad automáticas
- [ ] App móvil (React Native)
- [ ] Integración directa con WhatsApp Business API
- [ ] Panel de estadísticas avanzadas
- [ ] Lista de espera para grupos llenos

---

## 🐛 Soporte

Si encuentras algún error, revisa la consola del navegador (F12) y los logs del terminal del backend.
