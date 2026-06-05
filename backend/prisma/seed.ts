import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos...');

  // ─── LIMPIAR DATOS EXISTENTES ──────────────────────────────────────────────
  await prisma.absenceNotification.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.withdrawal.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.studentGroup.deleteMany();
  await prisma.guardian.deleteMany();
  await prisma.student.deleteMany();
  await prisma.group.deleteMany();
  await prisma.messageTemplate.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.user.deleteMany();

  // ─── CONFIGURACIÓN ─────────────────────────────────────────────────────────
  await prisma.settings.create({
    data: {
      schoolName:    'Escuela de Dibujo Arte & Color',
      address:       'Calle Mayor 15, 28001 Madrid',
      phone:         '91 123 45 67',
      email:         'info@arteycolor.es',
      cifNif:        'B12345678',
      monthlyFee:    55.0,
      invoicePrefix: 'FAC',
      invoiceCounter: 1,
      invoiceFooter: 'Gracias por confiar en Escuela de Dibujo Arte & Color.',
    },
  });
  console.log('✅ Configuración creada');

  // ─── USUARIOS ──────────────────────────────────────────────────────────────
  await prisma.user.create({
    data: {
      name:     'Administrador',
      email:    'admin@arteycolor.es',
      password: await bcrypt.hash('admin123', 10),
      role:     'admin',
    },
  });
  await prisma.user.create({
    data: {
      name:     'Ana García',
      email:    'ana@arteycolor.es',
      password: await bcrypt.hash('prof123', 10),
      role:     'profesor',
    },
  });
  await prisma.user.create({
    data: {
      name:     'Carlos Martínez',
      email:    'carlos@arteycolor.es',
      password: await bcrypt.hash('prof123', 10),
      role:     'profesor',
    },
  });
  console.log('✅ Usuarios creados');

  // ─── GRUPOS ────────────────────────────────────────────────────────────────
  const grupo1 = await prisma.group.create({
    data: {
      name:        'Grupo Mañana',
      dayOfWeek:   'Lunes, Miércoles',
      startTime:   '10:00',
      endTime:     '12:00',
      teacher:     'Ana García',
      maxCapacity: 15,
      notes:       'Grupo mixto de edades, nivel iniciación y medio',
    },
  });
  const grupo2 = await prisma.group.create({
    data: {
      name:        'Grupo Tarde A',
      dayOfWeek:   'Martes, Jueves',
      startTime:   '17:00',
      endTime:     '19:00',
      teacher:     'Carlos Martínez',
      maxCapacity: 15,
      notes:       'Grupo principalmente niños de primaria',
    },
  });
  const grupo3 = await prisma.group.create({
    data: {
      name:        'Grupo Tarde B',
      dayOfWeek:   'Viernes',
      startTime:   '16:30',
      endTime:     '18:30',
      teacher:     'Ana García',
      maxCapacity: 12,
      notes:       'Grupo avanzado, adolescentes y adultos',
    },
  });
  console.log('✅ Grupos creados');

  // ─── ALUMNOS ───────────────────────────────────────────────────────────────
  const alumnosData = [
    { fullName: 'Lucía Fernández Torres',   birthDate: new Date('2014-03-15'), school: 'CEIP San Juan',       howFoundUs: 'referido',  referredBy: 'María López',   enrollmentReason: 'Le encanta dibujar',                  group: grupo1, status: 'activo' },
    { fullName: 'Pablo López Ruiz',         birthDate: new Date('2013-07-22'), school: 'CEIP San Juan',       howFoundUs: 'redes',     referredBy: '',              enrollmentReason: 'Aprender técnicas de ilustración',    group: grupo2, status: 'activo' },
    { fullName: 'Sofía Martín García',      birthDate: new Date('2012-11-08'), school: 'Colegio Santa María', howFoundUs: 'pasando',   referredBy: '',              enrollmentReason: 'Vio el cartel en la calle',           group: grupo2, status: 'activo' },
    { fullName: 'Hugo Sánchez Pérez',       birthDate: new Date('2015-02-14'), school: 'CEIP Los Pinos',      howFoundUs: 'referido',  referredBy: 'Carmen Pérez',  enrollmentReason: 'Recomendado por amigos',              group: grupo1, status: 'activo' },
    { fullName: 'Carmen Díaz Moreno',       birthDate: new Date('2010-09-30'), school: 'IES Ramón y Cajal',   howFoundUs: 'redes',     referredBy: '',              enrollmentReason: 'Mejorar para selectividad de arte',   group: grupo3, status: 'activo' },
    { fullName: 'Alejandro Romero Gil',     birthDate: new Date('2011-05-19'), school: 'Colegio Santa María', howFoundUs: 'otro',      referredBy: '',              enrollmentReason: 'Hobby creativo',                      group: grupo3, status: 'activo' },
    { fullName: 'Valentina Cruz Navarro',   birthDate: new Date('2016-08-03'), school: 'CEIP Los Pinos',      howFoundUs: 'referido',  referredBy: 'Lucía Fernández', enrollmentReason: 'Su amiga viene a la escuela',       group: grupo1, status: 'activo' },
    { fullName: 'Daniel Vargas Reyes',      birthDate: new Date('2013-12-25'), school: 'CEIP San Juan',       howFoundUs: 'redes',     referredBy: '',              enrollmentReason: 'Publicidad en Instagram',             group: grupo2, status: 'activo' },
    { fullName: 'Marta Jiménez Castro',     birthDate: new Date('2009-04-11'), school: 'IES Ramón y Cajal',   howFoundUs: 'pasando',   referredBy: '',              enrollmentReason: 'Pasó por la calle y entró a preguntar', group: grupo3, status: 'activo' },
    { fullName: 'Andrés Torres Blanco',     birthDate: new Date('2014-06-28'), school: 'CEIP El Olivar',      howFoundUs: 'colegio',   referredBy: '',              enrollmentReason: 'Actividad extraescolar',              group: grupo1, status: 'pausa'  },
    { fullName: 'Elena Morales Vega',       birthDate: new Date('2012-01-17'), school: 'Colegio Santa María', howFoundUs: 'redes',     referredBy: '',              enrollmentReason: 'Le gusta el arte',                    group: grupo2, status: 'baja'   },
    { fullName: 'Jaime Herrera Campos',     birthDate: new Date('2015-10-09'), school: 'CEIP El Olivar',      howFoundUs: 'referido',  referredBy: 'Hugo Sánchez',  enrollmentReason: 'Su amigo Hugo viene aquí',            group: grupo2, status: 'activo' },
  ];

  const alumnos = [];
  for (const a of alumnosData) {
    const alumno = await prisma.student.create({
      data: {
        fullName:         a.fullName,
        birthDate:        a.birthDate,
        school:           a.school,
        howFoundUs:       a.howFoundUs,
        referredBy:       a.referredBy,
        enrollmentReason: a.enrollmentReason,
        currentGroupId:   a.status !== 'baja' ? a.group.id : null,
        status:           a.status,
      },
    });
    alumnos.push({ ...alumno, group: a.group });
  }
  console.log(`✅ ${alumnos.length} alumnos creados`);

  // ─── TUTORES ───────────────────────────────────────────────────────────────
  const tutoresData = [
    { idx: 0,  fullName: 'Rosa Torres Méndez',      phone: '612345678', email: 'rosa.torres@gmail.com',      relationship: 'madre' },
    { idx: 1,  fullName: 'Antonio López García',    phone: '623456789', email: 'antonio.lopez@gmail.com',    relationship: 'padre' },
    { idx: 2,  fullName: 'Isabel García Ruiz',      phone: '634567890', email: 'isabel.garcia@gmail.com',    relationship: 'madre' },
    { idx: 3,  fullName: 'Carmen Pérez Sanz',       phone: '645678901', email: 'carmen.perez@gmail.com',     relationship: 'madre' },
    { idx: 4,  fullName: 'Luis Díaz Flores',        phone: '656789012', email: 'luis.diaz@gmail.com',        relationship: 'padre' },
    { idx: 5,  fullName: 'Patricia Romero Vidal',   phone: '667890123', email: 'patricia.romero@gmail.com',  relationship: 'madre' },
    { idx: 6,  fullName: 'Marcos Cruz Peña',        phone: '678901234', email: 'marcos.cruz@gmail.com',      relationship: 'padre' },
    { idx: 7,  fullName: 'Laura Vargas Medina',     phone: '689012345', email: 'laura.vargas@gmail.com',     relationship: 'madre' },
    { idx: 8,  fullName: 'Roberto Jiménez Ortiz',   phone: '690123456', email: 'roberto.jimenez@gmail.com',  relationship: 'padre' },
    { idx: 9,  fullName: 'Susana Torres Rueda',     phone: '601234567', email: 'susana.torres@gmail.com',    relationship: 'madre' },
    { idx: 10, fullName: 'Fernando Morales Cano',   phone: '612345670', email: 'fernando.morales@gmail.com', relationship: 'padre' },
    { idx: 11, fullName: 'Pilar Herrera Castillo',  phone: '623456781', email: 'pilar.herrera@gmail.com',    relationship: 'madre' },
  ];
  for (const t of tutoresData) {
    await prisma.guardian.create({
      data: {
        studentId:    alumnos[t.idx].id,
        fullName:     t.fullName,
        phone:        t.phone,
        email:        t.email,
        relationship: t.relationship,
        isPrimary:    true,
      },
    });
  }
  console.log('✅ Tutores creados');

  // ─── ASIGNACIONES DE GRUPO ─────────────────────────────────────────────────
  for (const a of alumnos) {
    if (a.status !== 'baja' && a.group) {
      await prisma.studentGroup.create({
        data: { studentId: a.id, groupId: a.group.id, isCurrent: true },
      });
    }
  }
  console.log('✅ Asignaciones de grupo creadas');

  // ─── PAGOS (4 meses) ───────────────────────────────────────────────────────
  const meses = [
    { month: 3, year: 2026 },
    { month: 4, year: 2026 },
    { month: 5, year: 2026 },
    { month: 6, year: 2026 },
  ];

  const alumnosActivos = alumnos.filter(a => a.status === 'activo');
  for (const alumno of alumnosActivos) {
    for (let i = 0; i < meses.length; i++) {
      const m = meses[i];
      const esMesActual = m.month === 6;
      // Pablo debe el mes 4 (índice 1) para demostrar alerta de cuotas atrasadas
      const estaAtrasado = i === 1 && alumno.fullName === 'Pablo López Ruiz';
      const estaPagado   = i < 3 && !estaAtrasado;

      await prisma.payment.create({
        data: {
          studentId: alumno.id,
          month:     m.month,
          year:      m.year,
          amount:    55.0,
          paidAt:    estaPagado ? new Date(m.year, m.month - 1, 5) : null,
          method:    'efectivo',
          status:    estaAtrasado ? 'atrasado' : estaPagado ? 'pagado' : 'pendiente',
        },
      });
    }
  }
  console.log('✅ Pagos creados');

  // ─── ASISTENCIAS (últimos 10 días) ────────────────────────────────────────
  for (let d = 9; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    date.setHours(0, 0, 0, 0);

    for (const alumno of alumnosActivos.slice(0, 8)) {
      const statusOptions = ['presente', 'presente', 'presente', 'presente', 'ausente', 'justificado'];
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)] as string;
      try {
        await prisma.attendance.create({
          data: {
            studentId: alumno.id,
            groupId:   alumno.group.id,
            date,
            status,
          },
        });
      } catch {
        // Ignorar duplicados del unique constraint
      }
    }
  }
  console.log('✅ Asistencias creadas');

  // ─── BAJA ─────────────────────────────────────────────────────────────────
  const alumnoConBaja = alumnos.find(a => a.status === 'baja')!;
  await prisma.withdrawal.create({
    data: {
      studentId:      alumnoConBaja.id,
      withdrawalDate: new Date('2026-04-30'),
      reason:         'tiempo',
      notes:          'La familia se ha mudado de barrio, queda lejos.',
      contactLater:   true,
    },
  });
  console.log('✅ Baja registrada');

  // ─── PLANTILLAS DE MENSAJES ───────────────────────────────────────────────
  await prisma.messageTemplate.createMany({
    data: [
      { name: 'Recordatorio de pago',         category: 'pago',        body: 'Hola {{TUTOR_NOMBRE}}, te recordamos que queda pendiente la cuota de {{MES}} de {{ALUMNO_NOMBRE}}. Puedes pasar por la escuela cuando te venga bien. ¡Gracias!' },
      { name: 'Confirmación de inscripción',  category: 'inscripcion', body: 'Hola {{TUTOR_NOMBRE}}, confirmamos la inscripción de {{ALUMNO_NOMBRE}} en nuestra escuela. ¡Bienvenido/a! Le esperamos el {{DIA}} a las {{HORA}}.' },
      { name: 'Aviso de ausencia registrada', category: 'ausencia',    body: 'Hola {{TUTOR_NOMBRE}}, hemos registrado la ausencia de {{ALUMNO_NOMBRE}} de hoy. ¡Hasta la próxima!' },
      { name: 'Cambio de horario',            category: 'horario',     body: 'Hola {{TUTOR_NOMBRE}}, te informamos de un cambio de horario para {{ALUMNO_NOMBRE}}. Cualquier duda, escríbenos.' },
      { name: 'Aviso de evento o actividad',  category: 'evento',      body: 'Hola {{TUTOR_NOMBRE}}, te informamos de una actividad especial en la escuela. ¡Esperamos que {{ALUMNO_NOMBRE}} pueda participar!' },
    ],
  });
  console.log('✅ Plantillas de mensajes creadas');

  console.log('\n🎉 Seed completado con éxito.');
  console.log('──────────────────────────────────────────');
  console.log('  Admin:    admin@arteycolor.es / admin123');
  console.log('  Profesor: ana@arteycolor.es   / prof123');
  console.log('──────────────────────────────────────────');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
