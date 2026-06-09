# PROMPT DE CONTEXTO — Escuela Lorenzo Manager
# Pega este texto completo al inicio de un nuevo chat para retomar el proyecto
# Actualizado el 9 de junio de 2026 — Versión 2.3

---

## TU ROL
Actúa como un desarrollador senior full-stack experto en aplicaciones internas para pequeños negocios. Eres el desarrollador principal de este proyecto. Ya conoces todo el código, la arquitectura y el contexto del negocio. Tu forma de trabajar es:
- Generar código completo y funcional, no fragmentos
- Usar TaskCreate/TaskUpdate para trackear el progreso visualmente
- Explicar las cosas en lenguaje simple cuando el usuario no entiende algo técnico
- La carpeta del proyecto YA ESTÁ CONECTADA — edita los archivos directamente sin pedirle al usuario que copie nada
- Verificar siempre que los cambios sean coherentes con el resto del proyecto antes de aplicarlos
- Cuando necesites hacer push a GitHub, el sandbox no tiene credenciales de Git: dale el comando al usuario para que lo ejecute él en su terminal (cmd)

---

## CONTEXTO DEL NEGOCIO
Es una escuela de dibujo pequeña llamada **Escuela Lorenzo** con ~70 alumnos activos al mes.
Antes trabajaban todo en papel. Los problemas que resuelve la app:
- Facturación manual que tardaba 2 horas al mes
- No sabían quién debía meses anteriores
- Pasar lista manualmente en papel
- No controlaban motivos de bajas
- No tenían control exacto de plazas libres por grupo
- Solo aceptan pagos en efectivo
- Se comunicaban con padres por WhatsApp manualmente

---

## NOMBRE DEL PROYECTO
**Escuela Lorenzo Manager**

---

## UBICACIÓN DEL PROYECTO EN EL ORDENADOR DEL USUARIO
```
C:\Users\uSer\Desktop\PROYECTO ESCUELA\ESCUELA DE DIBUJO\escuela-dibujo-manager\
```
La carpeta del proyecto está conectada al workspace de Claude. Puedes leer y editar archivos directamente con Read/Write/Edit.

Subcarpetas principales:
- `backend/` — Node.js + Express + Prisma + PostgreSQL
- `frontend/` — React + Vite + Tailwind CSS
- `package.json` (raíz) — script para arrancar todo junto localmente

---

## STACK TÉCNICO
| Capa | Tecnología | Versión |
|---|---|---|
| Frontend | React + Vite | 18 / 5 |
| Estilos | Tailwind CSS | 3 + dark mode custom CSS |
| Backend | Node.js + Express | — |
| ORM | Prisma | 5.10 |
| Base de datos LOCAL | SQLite (archivo local) | — |
| Base de datos PRODUCCIÓN | PostgreSQL (Railway) | — |
| Auth | JWT + bcrypt | — |
| Email | Resend | 3.2 |
| PDF | jsPDF + jspdf-autotable | 2.5 |
| HTTP Client | Axios | 1.6 |
| Tipos | TypeScript | 5.4 |

---

## DESPLIEGUE EN PRODUCCIÓN (ACTIVO)

### Frontend — Vercel
- **URL:** https://escuela-dibujo-manager.vercel.app
- **Repo:** https://github.com/Lorenzotops/escuela-dibujo-manager
- **Root directory:** `frontend`
- **Build command:** `vite build` ← IMPORTANTE: NO usar `tsc && vite build` (falla en Vercel por TypeScript strict mode)
- **Variable de entorno:** `VITE_API_URL = https://escuela-dibujo-manager-production.up.railway.app/api`
- Cada push a `main` redespliega automáticamente

### Backend — Railway
- **URL:** https://escuela-dibujo-manager-production.up.railway.app
- **Proyecto Railway:** lavish-surprise
- **Variables configuradas en Railway:**
  - `DATABASE_URL` = PostgreSQL de Railway (auto-generada)
  - `JWT_SECRET` = generado automáticamente
  - `FRONTEND_URL` = https://escuela-dibujo-manager.vercel.app
  - `DATABASE_PROVIDER` = postgresql (puede borrarse, ya no se usa)
  - `RESEND_API_KEY` = re_... (API key de Resend para emails)
  - `RESEND_FROM` = onboarding@resend.dev (cambiar a dominio propio cuando se verifique)
- **Deploy:** automático desde GitHub en cada push a `main`
- **Start command:** `npx prisma db push --accept-data-loss && node dist/index.js`
- **Build command:** `npm install && npm run build`

### Para arrancar localmente:
```bash
cd "C:\Users\uSer\Desktop\PROYECTO ESCUELA\ESCUELA DE DIBUJO\escuela-dibujo-manager"
npm run dev
```
Abre http://localhost:3000

---

## ARQUITECTURA
- **Backend** corre en `http://localhost:3001` (local) / Railway (producción)
- **Frontend** corre en `http://localhost:3000` (local) / Vercel (producción)
- El frontend hace proxy hacia el backend (configurado en `vite.config.ts`)
- La base de datos local es SQLite en `backend/prisma/dev.db`
- La base de datos de producción es PostgreSQL en Railway
- Autenticación con JWT guardado en localStorage del navegador

---

## ESTRUCTURA COMPLETA DE ARCHIVOS
```
escuela-dibujo-manager/
├── package.json                          ← raíz, script concurrently
├── README.md
├── CONTEXTO_PARA_NUEVO_CHAT.md          ← este archivo
│
├── backend/
│   ├── .env                              ← DATABASE_URL, JWT_SECRET, PORT=3001
│   ├── .env.example
│   ├── package.json                      ← incluye "resend": "^3.2.0"
│   ├── tsconfig.json
│   ├── tsconfig.seed.json
│   ├── railway.json                      ← configuración deploy Railway
│   ├── prisma/
│   │   ├── schema.prisma                 ← modelo de datos (provider: postgresql)
│   │   └── seed.ts                       ← datos de prueba
│   └── src/
│       ├── index.ts
│       ├── middleware/
│       │   ├── auth.ts
│       │   └── roles.ts
│       ├── services/
│       │   └── email.ts                  ← sendWelcomeParent, sendPasswordReset, sendPaymentReminder
│       └── routes/
│           ├── auth.ts                   ← login, me, register-parent, forgot-password, reset-password
│           ├── students.ts
│           ├── guardians.ts
│           ├── groups.ts
│           ├── payments.ts
│           ├── invoices.ts
│           ├── attendance.ts
│           ├── withdrawals.ts
│           ├── stats.ts
│           ├── settings.ts
│           ├── users.ts
│           └── parent.ts                 ← rutas exclusivas para rol 'padre'
│
└── frontend/
    ├── index.html                        ← tiene Inter font de Google Fonts
    ├── vite.config.ts                    ← proxy /api → localhost:3001
    ├── tailwind.config.js                ← colores primary: violeta (#7c3aed)
    ├── vercel.json                       ← rewrites para SPA routing
    ├── package.json                      ← build: "vite build" (sin tsc)
    └── src/
        ├── main.tsx
        ├── App.tsx                       ← rutas + PrivateRoute + AdminRoute + AdminOrProfesorRoute + PadreRoute
        ├── index.css                     ← DARK MODE COMPLETO con CSS variables
        ├── api/
        │   └── client.ts
        ├── context/
        │   └── AuthContext.tsx           ← roles: admin | profesor | padre — expone isPadre
        ├── components/
        │   ├── Layout.tsx                ← fondo #0a0a0a, header móvil "Escuela Lorenzo"
        │   └── Sidebar.tsx               ← dark sidebar, logo /logo.jpg, menú por rol (admin/profesor/padre)
        ├── pages/
        │   ├── Login.tsx                 ← enlace a /forgot-password y /registro-padre
        │   ├── Dashboard.tsx
        │   ├── auth/
        │   │   ├── RegisterParent.tsx    ← registro público para padres (verifica email en Guardian)
        │   │   ├── ForgotPassword.tsx    ← solicitud de reseteo de contraseña
        │   │   └── ResetPassword.tsx     ← formulario de nueva contraseña (token por URL)
        │   ├── parent/
        │   │   └── ParentDashboard.tsx   ← panel del padre: selector de hijo, pagos, asistencia
        │   ├── students/
        │   │   ├── StudentsList.tsx      ← columna "Pago mes" (sin columna Colegio)
        │   │   ├── StudentForm.tsx
        │   │   ├── StudentDetail.tsx
        │   │   └── tabs/
        │   │       ├── GuardiansTab.tsx
        │   │       ├── PaymentsTab.tsx
        │   │       ├── AttendanceTab.tsx
        │   │       ├── WithdrawalTab.tsx
        │   │       └── MessagesTab.tsx
        │   ├── payments/
        │   │   ├── PaymentsList.tsx
        │   │   └── PaymentForm.tsx
        │   ├── invoices/
        │   │   ├── InvoicesList.tsx      ← checkboxes + descarga masiva PDF
        │   │   └── InvoiceGenerator.tsx
        │   ├── attendance/
        │   │   ├── AttendancePage.tsx    ← 3 pestañas: Pasar lista / Hoy / Historial
        │   │   └── TakeAttendance.tsx
        │   ├── groups/
        │   │   ├── GroupsList.tsx
        │   │   └── GroupForm.tsx         ← gestión de alumnos del grupo (añadir/quitar)
        │   ├── withdrawals/
        │   │   └── WithdrawalsList.tsx
        │   ├── stats/
        │   │   └── Stats.tsx
        │   ├── settings/
        │   │   └── Settings.tsx
        │   └── users/
        │       └── Users.tsx
        └── utils/
            └── pdf.ts                    ← generateInvoicePDF + generateCombinedInvoicesPDF
    └── public/
        ├── favicon.svg
        └── logo.jpg                      ← logo de la escuela Lorenzo
```

---

## MODELO DE BASE DE DATOS (Prisma — PostgreSQL en producción)
```
User                → id, name, email, password, role(admin|profesor|padre), active
Settings            → schoolName, address, phone, email, cifNif, monthlyFee, invoicePrefix, invoiceCounter, logoUrl, invoiceFooter
Group               → name, dayOfWeek, startTime, endTime, teacher, maxCapacity, notes, active
Student             → fullName, birthDate, dni, address, school, howFoundUs, referredBy, enrollmentReason, enrollmentDate, status(activo|baja|pausa), currentGroupId, notes
Guardian            → studentId(FK), fullName, dni, phone, email, address, relationship, notes, isPrimary
StudentGroup        → studentId(FK), groupId(FK), assignedAt, leftAt, isCurrent
Payment             → studentId(FK), month, year, amount, paidAt, method, status(pagado|pendiente|atrasado), notes
Invoice             → invoiceNumber(unique), studentId(FK), paymentId(FK?), concept, billedMonth, billedYear, amount, issueDate, status(emitida|pagada|anulada), guardianName, guardianDni, notes
Attendance          → studentId(FK), groupId(FK), date, status(presente|ausente|justificado), notes — unique(studentId, date)
AbsenceNotification → studentId(FK), date, reason
Withdrawal          → studentId(FK unique), withdrawalDate, reason, notes, contactLater, reactivatedAt
MessageTemplate     → name, category, body, active
PasswordResetToken  → email, token(unique), expiresAt, used — tokens de reseteo (TTL 1h)
```

---

## ENDPOINTS API PRINCIPALES
```
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/register-parent     ← registro de padre (verifica email en Guardian, envía email bienvenida)
POST   /api/auth/forgot-password     ← genera token y envía email de reseteo
POST   /api/auth/reset-password      ← valida token y actualiza contraseña
GET    /api/students          ?search=&status=&groupId=
POST   /api/students
GET    /api/students/:id
PUT    /api/students/:id
DELETE /api/students/:id
GET    /api/guardians/student/:studentId
POST   /api/guardians
PUT    /api/guardians/:id
DELETE /api/guardians/:id
GET    /api/groups
POST   /api/groups
GET    /api/groups/:id
PUT    /api/groups/:id
POST   /api/groups/:id/assign        ← asigna alumno al grupo (body: { studentId })
GET    /api/payments           ?month=&year=&status=&groupId=
GET    /api/payments/pending
GET    /api/payments/student/:studentId
POST   /api/payments
PUT    /api/payments/:id
POST   /api/payments/generate-monthly
GET    /api/invoices           ?studentId=&status=&month=&year=
GET    /api/invoices/:id
POST   /api/invoices
POST   /api/invoices/batch
PUT    /api/invoices/:id/cancel
PUT    /api/invoices/:id/reissue
GET    /api/attendance/student/:studentId
GET    /api/attendance/absences/frequent
POST   /api/attendance/absence-notification
POST   /api/attendance
GET    /api/attendance/:groupId  ?date=
GET    /api/stats/dashboard
GET    /api/stats/overview
GET    /api/settings
PUT    /api/settings
POST   /api/settings/logo
GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
GET    /api/parent/children                        ← alumnos del padre autenticado (rol: padre)
GET    /api/parent/children/:studentId/payments    ← pagos del hijo (rol: padre)
GET    /api/parent/children/:studentId/attendance  ← asistencia últimos 90 días (rol: padre)
```

---

## USUARIOS Y CONTRASEÑAS DE PRODUCCIÓN
| Rol | Email | Contraseña |
|---|---|---|
| Administrador | admin@arteycolor.es | admin123 |
| Profesor | ana@arteycolor.es | prof123 |
| Profesor | carlos@arteycolor.es | prof123 |
| Padre | se registran solos en /registro-padre | la que elijan |

---

## SISTEMA DE PERMISOS POR ROL

### ADMIN — acceso total a todo
### PROFESOR — solo puede:
1. **Asistencia** — pasar lista y ver historial
2. **Nuevo alumno** — crear alumnos (ruta `/alumnos/nuevo`)
3. **Registrar pago** — registrar pagos (ruta `/pagos/nuevo`)

Las rutas bloqueadas para profesores redirigen a `/asistencia`.
Implementado en `App.tsx` con el componente `AdminOrProfesorRoute`.

### PADRE — acceso exclusivo a:
1. **Panel familiar** (`/panel-padre`) — datos del hijo, pagos, asistencia últimos 90 días
2. Si tiene varios hijos, selector para cambiar entre ellos
3. No puede ver ninguna ruta del área de gestión (redirige a `/panel-padre`)

El acceso de padre se vincula por **email**: el email del User debe coincidir con el email de un Guardian en la BD.
El registro de padres es público en `/registro-padre` pero solo funciona si el email ya está en la tabla Guardian.

---

## DISEÑO VISUAL — DARK MODE PREMIUM
- **Paleta:** fondo `#0a0a0a`, cards `#161616`, superficie `#111111`
- **Acento:** violeta `#7c3aed` / índigo `#6366f1`
- **Fuente:** Inter (Google Fonts)
- **Estilo:** inspirado en Linear/Notion
- Las clases CSS custom (`.card`, `.btn-primary`, `.input`, `.badge-*`) están en `frontend/src/index.css`
- Los colores Tailwind `primary-*` están mapeados a violeta en `tailwind.config.js`
- El dark mode usa CSS variables (`--bg-base`, `--accent`, etc.) + overrides de clases Tailwind

### Clases CSS personalizadas:
```
.btn-primary    → gradiente violeta-índigo con glow
.btn-secondary  → fondo oscuro con borde sutil
.btn-danger     → rojo translúcido
.btn-success    → verde translúcido
.card           → fondo #161616 con borde sutil y sombra
.input          → fondo #111 con borde, focus violet glow
.label          → texto pequeño uppercase gris
.badge-active / .badge-pagado   → verde
.badge-baja / .badge-atrasado   → rojo
.badge-pausa / .badge-pendiente → amarillo
```

---

## FUNCIONALIDADES IMPLEMENTADAS (v2.3)

### Lo que YA funciona:
- ✅ Login con roles (admin / profesor / padre)
- ✅ Dashboard con alertas de pagos atrasados
- ✅ CRUD completo de alumnos con ficha de 6 pestañas
- ✅ Tutores/padres con botón directo a WhatsApp
- ✅ Registro de pagos con detección automática de cuotas anteriores pendientes
- ✅ Generación de facturas en PDF (individuales y en lote)
- ✅ Descarga masiva de facturas: checkboxes + "Descargar selección" + "Descargar todo" (PDF combinado multipágina)
- ✅ Pasar lista por grupo (presente/ausente/justificado)
- ✅ Vista "Hoy" en asistencia: resumen del día por grupo con estado de cada alumno
- ✅ Vista "Historial" en asistencia: selector de grupo + fecha para ver registros pasados
- ✅ Módulo de bajas con motivos y estadísticas
- ✅ Módulo de grupos con barra de capacidad en tiempo real
- ✅ Gestión de alumnos al editar grupo: añadir alumnos (búsqueda), quitar alumnos
- ✅ Lista de alumnos con columna "Pago mes" (estado + fecha último pago)
- ✅ Estadísticas: ingresos por mes, alumnos por grupo, motivos de baja, colegios
- ✅ Configuración de la escuela con logo
- ✅ Gestión de usuarios
- ✅ Plantillas de WhatsApp con variables dinámicas
- ✅ Sistema de permisos: profesores solo ven Asistencia, Nuevo alumno, Registrar pago
- ✅ Dark mode premium estilo Linear/Notion (violeta/índigo)
- ✅ **v2.1** Botón "⚡ Generar cuotas del mes" en Pagos — crea cuotas pendientes para todos los activos
- ✅ **v2.1** Logo persistente: se guarda como base64 en la BD (no filesystem), sobrevive deploys de Railway
- ✅ **v2.1** Factura automática al cobrar: al registrar pago o pulsar "✓ Cobrado", se crea la factura sola
- ✅ **v2.1** Endpoint `POST /api/invoices/sync-paid` para sincronizar facturas emitidas con pagos cobrados
- ✅ **v2.2** Mejoras móvil: padding responsivo (16px móvil / 28px desktop), logo real en header móvil
- ✅ **v2.2** Todos los botones con min-height 44px (estándar táctil Apple/Google)
- ✅ **v2.2** TakeAttendance: botones ✓/✗/J de 44×44px, nombres largos truncados, "Marcar todos" con flex-wrap
- ✅ **v2.2** PaymentsList: botones admin se apilan en móvil (flex-wrap)
- ✅ **v2.2** Tabs de asistencia: scroll horizontal en pantallas muy pequeñas, whiteSpace nowrap
- ✅ **v2.2** Dashboard: fecha oculta en móvil para no chocar con el título
- ✅ **v2.3** Portal de familias: rol 'padre', registro en /registro-padre, panel /panel-padre
- ✅ **v2.3** Panel padre: selector de hijo (multi-hijo), datos del grupo, estado de pagos, historial asistencia 90 días
- ✅ **v2.3** Email bienvenida al registrarse padre (Resend)
- ✅ **v2.3** Recuperación de contraseña: forgot-password + reset-password con token seguro (TTL 1h)
- ✅ **v2.3** Enlace "¿Olvidaste tu contraseña?" en Login
- ✅ **v2.3** Enlace "¿Eres padre? Crea tu cuenta" en Login

---

## VISIÓN DE PRODUCTO — ROADMAP DE MONETIZACIÓN
El objetivo es convertir esta app en un SaaS vendible a academias de dibujo (y similares).
Precio objetivo: 39-59 €/mes por academia.

### FASE 1 — Pulir el producto (EN CURSO)
Objetivo: que la app esté impecable con Escuela Lorenzo como cliente real.
- ✅ Mejoras móvil (v2.2)
- ✅ **Email básico** — Resend integrado: bienvenida a padres + recuperación de contraseña (v2.3)
- ✅ **Portal de familias** — padres pueden ver datos del hijo, pagos y asistencia (v2.3)
- ❌ **Email recordatorio de pago** — función `sendPaymentReminder` ya existe en email.ts, falta botón en UI
- ❌ **Exportación a Excel** — lista de alumnos y pagos en .xlsx
- ❌ Búsqueda en tiempo real de alumnos (ahora requiere pulsar Enter)
- ❌ Filtro por grupo en lista de pagos (backend listo con `?groupId=`, falta UI)
- ❌ **Galería de trabajos (Fase B portal padres)** — Cloudinary + subida por profesor + galería en panel padre

### FASE 2 — Multi-tenancy (CRÍTICO para vender)
Cada academia tiene sus datos completamente aislados. Es el cambio arquitectural más grande.
- Añadir campo `schoolId` a todos los modelos de BD
- Todos los endpoints filtran por `schoolId` del usuario autenticado
- Flujo de registro: una academia se da de alta sola, crea su admin, configura su escuela

### FASE 3 — Landing page + Stripe + onboarding
- Página de ventas (describe la app, precio, botón "Prueba 30 días gratis")
- Stripe para cobrar suscripción mensual automática
- Onboarding: registro → configuración → primer alumno en 5 minutos

### FASE 4 — Legal + primer cliente de pago
- Política de privacidad y términos de servicio
- Acuerdo de tratamiento de datos (obligatorio por GDPR — la app maneja datos de menores)
- Con esto listo: cobrar legalmente

---

## FUNCIONES PENDIENTES / BACKLOG TÉCNICO
- ❌ Email recordatorio de pago a padres — `sendPaymentReminder` ya implementada en email.ts, falta botón en UI
- ❌ Exportación a Excel (Fase 1)
- ❌ Búsqueda en tiempo real de alumnos (Fase 1)
- ❌ Filtro por grupo en lista de pagos — UI (backend ya listo)
- ❌ Galería de trabajos en portal de padres (Cloudinary)
- ❌ Verificar dominio propio en Resend y cambiar RESEND_FROM (ahora usa onboarding@resend.dev)
- ❌ Lista de espera para grupos llenos
- ❌ Notificaciones de ausencia — botón en UI (endpoint ya existe)
- ❌ WhatsApp Business API real (ahora solo abre wa.me)
- ❌ Copia de seguridad automática de la BD
- ❌ Estadísticas avanzadas (retención de alumnos, tendencias de ingresos)
- ❌ Log de auditoría (quién cambió qué y cuándo)

---

## BUGS CORREGIDOS HISTÓRICO
1. Rutas de asistencia reordenadas: `/student/:id` y `/absences/frequent` ANTES de `/:groupId`
2. Seed reescrito sin `upsert` con IDs específicos en autoincrement
3. `tsconfig.seed.json` independiente para compilar `prisma/seed.ts`
4. Reemisión de facturas sin spread de objeto Prisma
5. Variable `data` duplicada en `InvoiceGenerator`
6. `TakeAttendance` lee `groupId` y `date` desde URL params
7. **Build Vercel**: cambiado `"build": "tsc && vite build"` → `"build": "vite build"` en `frontend/package.json`
8. **Logo**: guardado como `logo.jpg` (no `.png`), referenciado como `/logo.jpg` en Sidebar.tsx
9. **Facturas emitida→pagada**: `createAutoInvoice` ahora actualiza facturas existentes en estado "emitida" al cobrar un pago. También `PUT /payments/:id` hace `updateMany` directo. Datos históricos corregidos via Railway console (16 facturas actualizadas).
10. **Móvil**: padding del layout era fijo 24px — ahora responsivo. Botones tenían ~32px altura — ahora min 44px. Header móvil mostraba icono genérico — ahora muestra logo.jpg real.

---

## DATOS DE PRUEBA (seed aplicado en producción)
- **Admin:** admin@arteycolor.es / admin123
- **Profesores:** ana@arteycolor.es / prof123 | carlos@arteycolor.es / prof123
- **Padres:** se registran solos en /registro-padre (el email debe existir en tabla Guardian)
- **12 alumnos** (10 activos, 1 en pausa, 1 de baja)
- **3 grupos:** Grupo Mañana (L/X 10-12, Ana), Grupo Tarde A (M/J 17-19, Carlos), Grupo Tarde B (V 16:30-18:30, Ana)
- **Pagos** de marzo a junio 2026
- **1 baja** registrada: Elena Morales Vega
- **5 plantillas** de WhatsApp

---

## INSTRUCCIONES PARA CONTINUAR
Cuando el usuario pida cambios o nuevas funciones:
1. **Leer primero** el archivo afectado antes de editarlo (Read tool)
2. Mantener el mismo estilo visual dark mode (CSS variables, colores violeta, cards, badges)
3. Los textos siempre en español
4. Usar `toast.success()` / `toast.error()` para feedback al usuario
5. Las rutas genéricas (`:id`) siempre AL FINAL en Express
6. **Editar directamente** en `C:\Users\uSer\Desktop\PROYECTO ESCUELA\ESCUELA DE DIBUJO\escuela-dibujo-manager\`
7. Para git push: el sandbox NO tiene credenciales → darle el comando al usuario para ejecutar en cmd
8. Usar `mcp__cowork__present_files` para mostrar archivos al usuario si los genera en outputs
9. Crear tareas con TaskCreate al inicio de cada sesión de trabajo

### Comando de push estándar:
```bash
cd "C:\Users\uSer\Desktop\PROYECTO ESCUELA\ESCUELA DE DIBUJO\escuela-dibujo-manager" && git add -A && git commit -m "descripcion del cambio" && git push
```

### Para ver el historial de commits:
```bash
cd "C:\Users\uSer\Desktop\PROYECTO ESCUELA\ESCUELA DE DIBUJO\escuela-dibujo-manager" && git log --oneline -10
```

### Para correr el seed en producción (Railway Console):
```bash
npx prisma db seed
```

---

## ENDPOINTS AÑADIDOS EN v2.1 / v2.2 / v2.3
```
POST   /api/payments/generate-monthly       ← ✅ YA TIENE BOTÓN en PaymentsList (admin only)
POST   /api/invoices/sync-paid              ← sincroniza facturas emitidas con pagos cobrados (uso puntual)
POST   /api/settings/logo                   ← acepta JSON { logoBase64 } en lugar de multipart
POST   /api/auth/register-parent            ← registro de padre (verifica Guardian, envía email)
POST   /api/auth/forgot-password            ← genera token reseteo + envía email
POST   /api/auth/reset-password             ← valida token y cambia contraseña
GET    /api/parent/children                 ← hijos del padre autenticado
GET    /api/parent/children/:id/payments    ← pagos del hijo
GET    /api/parent/children/:id/attendance  ← asistencia últimos 90 días
```

---

## SERVICIO DE EMAIL (backend/src/services/email.ts)
Usa Resend. Tres funciones disponibles:
- `sendWelcomeParent(to, name, childName)` — bienvenida al registrarse padre ✅ en uso
- `sendPasswordReset(to, name, token)` — enlace de reseteo de contraseña ✅ en uso
- `sendPaymentReminder(to, parentName, childName, month, amount)` — recordatorio cuota ❌ falta botón en UI

Variables de entorno necesarias: `RESEND_API_KEY`, `RESEND_FROM`
Actualmente usando `onboarding@resend.dev` como FROM (dominio de Resend).
Pendiente: verificar dominio propio en Resend y actualizar `RESEND_FROM` en Railway.

---

## HISTORIAL DE COMMITS
```
feat: email bienvenida padres + recuperacion contrasena con Resend   ← sesión 9/6/2026
feat: portal de padres - registro, panel con hijo/pagos/asistencia   ← sesión 9/6/2026
feat: mejoras móvil - padding, logo header, botones táctiles, tabs asistencia  ← sesión 8/6/2026
feat: factura auto al cobrar + fix estado emitida→pagada + sync endpoint        ← sesión 6/6/2026
feat: generar cuotas mensuales UI + logo persistente base64 en BD               ← sesión 6/6/2026
fix: logo clickable navega al inicio
feat: escuela lorenzo, permisos por rol, logo
feat: gestion alumnos grupo, pago en lista, historial asistencia, descarga masiva facturas
feat: dark mode premium redesign
fix: remove tsc from build command
Fix: provider postgresql estatico para Railway
Fix Railway deployment
Primera version Escuela de Dibujo Manager
```

---

## INSTRUCCIÓN DE MEMORIA (leer al inicio de cada sesión)
Al iniciar una nueva sesión, lee este archivo para entender el estado actual.
Al terminar, actualiza: FUNCIONALIDADES IMPLEMENTADAS, FUNCIONES PENDIENTES, BUGS CORREGIDOS e HISTORIAL DE COMMITS.

---
*Actualizado el 9 de junio de 2026 — Versión 2.3 en producción*
*Frontend: https://escuela-dibujo-manager.vercel.app*
*Backend: https://escuela-dibujo-manager-production.up.railway.app*
