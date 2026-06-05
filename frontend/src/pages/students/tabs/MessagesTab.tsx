import React, { useEffect, useState } from 'react';
import api from '../../../api/client';
import toast from 'react-hot-toast';

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function MessagesTab({ student }: { student: any }) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selected,  setSelected]  = useState<any>(null);
  const [message,   setMessage]   = useState('');
  const guardian = student.guardians?.[0];

  useEffect(() => {
    // Cargar plantillas (las tenemos en seed)
    api.get('/settings').then(() => {
      // Plantillas hardcoded por ahora (las podríamos guardar en BD)
      setTemplates([
        { id: 1, name: 'Recordatorio de pago', category: 'pago', body: 'Hola {{TUTOR_NOMBRE}}, te recordamos que queda pendiente la cuota de {{MES}} de {{ALUMNO_NOMBRE}}. Puedes pasar por la escuela cuando te venga bien. ¡Gracias!' },
        { id: 2, name: 'Confirmación de inscripción', category: 'inscripcion', body: 'Hola {{TUTOR_NOMBRE}}, confirmamos la inscripción de {{ALUMNO_NOMBRE}} en nuestra escuela. ¡Bienvenido/a!' },
        { id: 3, name: 'Aviso de ausencia registrada', category: 'ausencia', body: 'Hola {{TUTOR_NOMBRE}}, hemos registrado la ausencia de {{ALUMNO_NOMBRE}} de hoy. ¡Hasta la próxima!' },
        { id: 4, name: 'Cambio de horario', category: 'horario', body: 'Hola {{TUTOR_NOMBRE}}, te informamos que el horario de {{ALUMNO_NOMBRE}} ha sido actualizado. Cualquier duda, escríbenos.' },
        { id: 5, name: 'Evento o actividad', category: 'evento', body: 'Hola {{TUTOR_NOMBRE}}, te informamos de una actividad especial en la escuela. ¡Esperamos que {{ALUMNO_NOMBRE}} pueda participar!' },
      ]);
    });
  }, []);

  const selectTemplate = (t: any) => {
    setSelected(t);
    const now = new Date();
    let body = t.body;
    body = body.replace(/{{TUTOR_NOMBRE}}/g, guardian?.fullName || '[Nombre del tutor]');
    body = body.replace(/{{ALUMNO_NOMBRE}}/g, student.fullName);
    body = body.replace(/{{MES}}/g, MONTH_NAMES[now.getMonth()]);
    setMessage(body);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message);
    toast.success('Mensaje copiado al portapapeles');
  };

  const openWhatsApp = () => {
    if (!guardian?.phone) { toast.error('El tutor no tiene teléfono registrado'); return; }
    const phone = guardian.phone.replace(/\s/g, '').replace(/^\+/, '');
    const phoneWithCountry = phone.startsWith('34') ? phone : `34${phone}`;
    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {!guardian && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          ⚠️ Este alumno no tiene tutor registrado. Añade uno en la pestaña "Tutores" para poder enviar mensajes.
        </div>
      )}

      {guardian && (
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700">💬</div>
          <div>
            <p className="font-medium text-gray-900">{guardian.fullName}</p>
            <p className="text-sm text-gray-500">{guardian.phone}</p>
          </div>
          <button className="ml-auto btn-secondary text-sm" onClick={() => {
            const phone = guardian.phone.replace(/\s/g, '').replace(/^\+/, '');
            const phoneWithCountry = phone.startsWith('34') ? phone : `34${phone}`;
            window.open(`https://wa.me/${phoneWithCountry}`, '_blank');
          }}>
            Abrir WhatsApp
          </button>
        </div>
      )}

      <h3 className="font-semibold text-gray-800">Plantillas de mensajes</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {templates.map(t => (
          <button
            key={t.id}
            onClick={() => selectTemplate(t)}
            className={`text-left p-3 rounded-xl border text-sm transition-all ${selected?.id === t.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
          >
            <p className="font-medium text-gray-800">{t.name}</p>
            <p className="text-xs text-gray-400 capitalize mt-0.5">{t.category}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="space-y-2">
          <label className="label">Mensaje (puedes editarlo)</label>
          <textarea
            className="input resize-none text-sm"
            rows={5}
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          <div className="flex gap-2">
            <button className="btn-secondary flex-1 text-sm" onClick={copyToClipboard}>
              📋 Copiar mensaje
            </button>
            <button className="btn-success flex-1 text-sm" onClick={openWhatsApp} disabled={!guardian?.phone}>
              💬 Abrir en WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
