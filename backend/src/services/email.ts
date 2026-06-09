import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.RESEND_FROM || 'onboarding@resend.dev';
const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─── Plantilla base HTML ──────────────────────────────────────────────────────
function baseTemplate(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#161616;border-radius:16px;border:1px solid #222;overflow:hidden;">

          <!-- Cabecera -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#6366f1);padding:28px 32px;text-align:center;">
              <p style="margin:0;font-size:28px;">🎨</p>
              <h1 style="margin:8px 0 0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                Escuela Lorenzo
              </h1>
              <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.7);">Portal de familias</p>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>

          <!-- Pie -->
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #222;text-align:center;">
              <p style="margin:0;font-size:11px;color:#444;line-height:1.6;">
                Este email ha sido enviado por Escuela Lorenzo.<br/>
                Si no esperabas este mensaje, puedes ignorarlo.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Email: bienvenida al registrarse como padre ──────────────────────────────
export async function sendWelcomeParent(to: string, name: string, childName: string) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#f0f0f0;">
      ¡Bienvenido/a, ${name.split(' ')[0]}! 👋
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:#888;line-height:1.6;">
      Tu cuenta en el portal de familias de Escuela Lorenzo ha sido creada correctamente.
      Ya puedes ver el seguimiento de <strong style="color:#d0d0d0;">${childName}</strong>:
      pagos, asistencia y datos del grupo.
    </p>

    <table width="100%" style="background:#111;border-radius:10px;border:1px solid #222;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#444;text-transform:uppercase;letter-spacing:0.08em;">Alumno/a</p>
          <p style="margin:0;font-size:15px;font-weight:600;color:#e0e0e0;">🎨 ${childName}</p>
        </td>
      </tr>
    </table>

    <a href="${APP_URL}/login"
       style="display:block;text-align:center;background:linear-gradient(135deg,#7c3aed,#6366f1);
              color:#fff;text-decoration:none;padding:14px 24px;border-radius:10px;
              font-size:14px;font-weight:600;letter-spacing:0.2px;">
      Acceder al portal →
    </a>

    <p style="margin:20px 0 0;font-size:12px;color:#555;text-align:center;">
      Usa tu email y la contraseña que acabas de crear.
    </p>`;

  await resend.emails.send({
    from: `Escuela Lorenzo <${FROM}>`,
    to,
    subject: '¡Bienvenido/a al portal de familias! 🎨',
    html: baseTemplate('Bienvenido al portal de familias', body),
  });
}

// ─── Email: recuperación de contraseña ───────────────────────────────────────
export async function sendPasswordReset(to: string, name: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const body = `
    <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#f0f0f0;">
      Recuperar contraseña
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:#888;line-height:1.6;">
      Hola, ${name.split(' ')[0]}. Hemos recibido una solicitud para restablecer la contraseña
      de tu cuenta. Pulsa el botón de abajo para crear una nueva.
    </p>

    <a href="${resetUrl}"
       style="display:block;text-align:center;background:linear-gradient(135deg,#7c3aed,#6366f1);
              color:#fff;text-decoration:none;padding:14px 24px;border-radius:10px;
              font-size:14px;font-weight:600;letter-spacing:0.2px;margin-bottom:20px;">
      Restablecer contraseña →
    </a>

    <div style="background:#111;border:1px solid #222;border-radius:10px;padding:14px 16px;margin-bottom:20px;">
      <p style="margin:0;font-size:12px;color:#555;line-height:1.6;">
        ⏱ Este enlace caduca en <strong style="color:#888;">1 hora</strong>.<br/>
        Si no solicitaste este cambio, ignora este email — tu contraseña no cambiará.
      </p>
    </div>

    <p style="margin:0;font-size:12px;color:#444;word-break:break-all;">
      Si el botón no funciona, copia este enlace en tu navegador:<br/>
      <span style="color:#7c3aed;">${resetUrl}</span>
    </p>`;

  await resend.emails.send({
    from: `Escuela Lorenzo <${FROM}>`,
    to,
    subject: 'Restablecer contraseña — Escuela Lorenzo',
    html: baseTemplate('Restablecer contraseña', body),
  });
}

// ─── Email: aviso de cuota pendiente (uso futuro) ─────────────────────────────
export async function sendPaymentReminder(
  to: string,
  parentName: string,
  childName: string,
  month: string,
  amount: number
) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#f0f0f0;">
      Recordatorio de pago 💳
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:#888;line-height:1.6;">
      Hola, ${parentName.split(' ')[0]}. Te recordamos que está pendiente la cuota
      mensual de <strong style="color:#d0d0d0;">${childName}</strong>.
    </p>

    <table width="100%" style="background:#111;border-radius:10px;border:1px solid #222;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #1e1e1e;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#444;text-transform:uppercase;letter-spacing:0.08em;">Mes</p>
          <p style="margin:0;font-size:15px;color:#e0e0e0;">${month}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#444;text-transform:uppercase;letter-spacing:0.08em;">Importe</p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#a78bfa;">${amount.toFixed(2)} €</p>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#666;line-height:1.6;">
      Los pagos se realizan en efectivo en la escuela.<br/>
      Si ya has realizado el pago, ignora este mensaje.
    </p>`;

  await resend.emails.send({
    from: `Escuela Lorenzo <${FROM}>`,
    to,
    subject: `Recordatorio: cuota de ${month} pendiente — Escuela Lorenzo`,
    html: baseTemplate('Recordatorio de pago', body),
  });
}
