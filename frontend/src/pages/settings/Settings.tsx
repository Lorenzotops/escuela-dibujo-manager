import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';

export default function Settings() {
  const [form, setForm] = useState({
    schoolName: '', address: '', phone: '', email: '',
    cifNif: '', monthlyFee: 55, invoicePrefix: 'FAC', invoiceFooter: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    api.get('/settings').then(r => {
      const s = r.data;
      setForm({
        schoolName:    s.schoolName || '',
        address:       s.address || '',
        phone:         s.phone || '',
        email:         s.email || '',
        cifNif:        s.cifNif || '',
        monthlyFee:    s.monthlyFee || 55,
        invoicePrefix: s.invoicePrefix || 'FAC',
        invoiceFooter: s.invoiceFooter || '',
      });
    }).finally(() => setLoading(false));
  }, []);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', form);
      toast.success('Configuración guardada');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);
    try {
      await api.post('/settings/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Logo subido correctamente');
    } catch {
      toast.error('Error al subir el logo');
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-800">Datos de la escuela</h2>
          <div>
            <label className="label">Nombre de la escuela</label>
            <input className="input" value={form.schoolName} onChange={set('schoolName')} />
          </div>
          <div>
            <label className="label">Dirección</label>
            <input className="input" value={form.address} onChange={set('address')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Teléfono</label>
              <input className="input" value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="label">CIF/NIF</label>
              <input className="input" value={form.cifNif} onChange={set('cifNif')} />
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-800">Facturación</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cuota mensual (€)</label>
              <input type="number" step="0.01" className="input" value={form.monthlyFee} onChange={set('monthlyFee')} />
            </div>
            <div>
              <label className="label">Prefijo de factura</label>
              <input className="input" value={form.invoicePrefix} onChange={set('invoicePrefix')} placeholder="FAC" />
            </div>
          </div>
          <div>
            <label className="label">Texto de pie de factura</label>
            <textarea className="input resize-none" rows={2} value={form.invoiceFooter} onChange={set('invoiceFooter')} />
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-800">Logo</h2>
          <div>
            <label className="label">Subir logo (aparecerá en las facturas)</label>
            <input type="file" accept="image/*" className="input" onChange={handleLogoUpload} />
            <p className="text-xs text-gray-400 mt-1">Máximo 2MB. Formatos: JPG, PNG, SVG</p>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full py-3" disabled={saving}>
          {saving ? 'Guardando...' : '💾 Guardar configuración'}
        </button>
      </form>
    </div>
  );
}
