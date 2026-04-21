import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { assetUrl } from '../../lib/api';
import { formatCRC } from '../../lib/currency';
import useToastStore from '../../store/toastStore';

const USE_API = import.meta.env.VITE_API_URL;
const CATEGORIES = ['ojos', 'labios', 'rostro', 'skincare', 'maquillaje', 'cabello'];

const EMPTY = {
  name: '',
  slug: '',
  brand: '',
  category: 'maquillaje',
  price: '',
  oldPrice: '',
  description: '',
  features: [''],
  images: [],
  stock: 99,
  isActive: true,
  badge: '',
  badgeType: '',
};

function slugify(s = '') {
  return s.toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const inputCls = 'w-full border border-cream-200 rounded-xl px-4 py-2.5 text-sm text-ink-900 placeholder-ink-300 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all bg-white';
const labelCls = 'block text-[11px] font-bold text-ink-500 uppercase tracking-widest mb-1.5';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const toast = useToastStore();

  const [form, setForm]       = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!isEdit || !USE_API) return;
    (async () => {
      try {
        const { data } = await api.get('/products/admin/all');
        const found = (data.products || []).find((p) => (p._id || p.id) === id);
        if (found) {
          setForm({
            ...EMPTY,
            ...found,
            oldPrice: found.oldPrice ?? '',
            features: found.features?.length ? found.features : [''],
          });
        } else {
          setError('Producto no encontrado');
        }
      } catch {
        setError('No se pudo cargar el producto');
      } finally { setLoading(false); }
    })();
  }, [id, isEdit]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setField = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    set(k, v);
    if (k === 'name' && !slugTouched) set('slug', slugify(v));
  };

  const setFeature = (idx, v) => {
    const arr = [...form.features];
    arr[idx] = v;
    set('features', arr);
  };
  const addFeature    = () => set('features', [...form.features, '']);
  const removeFeature = (idx) => set('features', form.features.filter((_, i) => i !== idx));

  const removeImage = (idx) => set('images', form.images.filter((_, i) => i !== idx));

  const uploadFiles = async (files) => {
    if (!files?.length) return;
    if (!isEdit) {
      setError('Guardá el producto primero para poder subir imágenes.');
      return;
    }
    const fd = new FormData();
    [...files].forEach((f) => fd.append('images', f));
    try {
      const { data } = await api.post(`/products/${id}/images`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set('images', [...form.images, ...data.urls]);
      toast.success(`${data.urls.length} imagen${data.urls.length === 1 ? '' : 'es'} subida${data.urls.length === 1 ? '' : 's'}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al subir imágenes');
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!USE_API) { setError('Backend no conectado (falta VITE_API_URL).'); return; }

    const payload = {
      name:        form.name.trim(),
      slug:        (form.slug || slugify(form.name)).trim(),
      brand:       form.brand.trim(),
      category:    form.category,
      price:       Number(form.price) || 0,
      oldPrice:    form.oldPrice === '' ? null : Number(form.oldPrice),
      description: form.description.trim(),
      features:    form.features.map((f) => f.trim()).filter(Boolean),
      images:      form.images,
      stock:       Number(form.stock) || 0,
      isActive:    form.isActive,
      badge:       form.badge.trim(),
      badgeType:   form.badgeType.trim(),
    };

    if (!payload.name || !payload.brand || payload.price <= 0) {
      setError('Nombre, marca y precio son obligatorios.');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/products/${id}`, payload);
        toast.success('Cambios guardados');
        navigate('/admin/productos');
      } else {
        const { data } = await api.post('/products', payload);
        toast.success('Producto creado. Ahora podés agregarle imágenes.');
        navigate(`/admin/productos/${data._id}/editar`, { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al guardar';
      setError(msg);
      toast.error(msg);
    } finally { setSaving(false); }
  };

  if (!USE_API) {
    return (
      <div className="bg-white rounded-2xl border border-cream-100 shadow-card p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-cream-100 flex items-center justify-center text-3xl mx-auto mb-5">📦</div>
        <h2 className="font-display text-xl font-semibold text-ink-900 mb-2">Backend no conectado</h2>
        <p className="text-ink-400 text-sm max-w-sm mx-auto leading-relaxed">
          Configurá <code className="bg-cream-100 px-1.5 py-0.5 rounded text-rose-500 text-xs">VITE_API_URL</code> para crear y editar productos.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="bg-white rounded-2xl border border-cream-100 shadow-card p-10 text-center text-ink-400">Cargando...</div>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <Link to="/admin/productos" className="text-xs text-ink-400 hover:text-rose-500 font-medium inline-flex items-center gap-1 mb-1">
            ← Productos
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900 leading-none">
            {isEdit ? 'Editar producto' : 'Nuevo producto'}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/productos"
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-cream-200 text-ink-600 hover:bg-cream-50 transition-colors">
            Cancelar
          </Link>
          <button type="submit" disabled={saving}
            className="bg-rose-500 hover:bg-rose-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-btn">
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Left: basic info */}
        <div className="lg:col-span-2 space-y-5">

          <div className="bg-white rounded-2xl border border-cream-100 shadow-card p-5 sm:p-6 space-y-4">
            <p className="text-xs font-bold text-ink-400 uppercase tracking-widest">Información básica</p>

            <div>
              <label className={labelCls}>Nombre *</label>
              <input value={form.name} onChange={setField('name')} className={inputCls} placeholder="Paleta de sombras 35 colores" required />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Marca *</label>
                <input value={form.brand} onChange={setField('brand')} className={inputCls} placeholder="Beauty Creations" required />
              </div>
              <div>
                <label className={labelCls}>Categoría *</label>
                <select value={form.category} onChange={setField('category')} className={inputCls + ' cursor-pointer capitalize'}>
                  {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Slug (URL)</label>
              <input
                value={form.slug}
                onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }}
                className={inputCls + ' font-mono text-xs'} placeholder="paleta-sombras-35-colores" />
              <p className="text-[11px] text-ink-400 mt-1">Se genera automático desde el nombre. /producto/<span className="font-mono">{form.slug || '...'}</span></p>
            </div>

            <div>
              <label className={labelCls}>Descripción</label>
              <textarea value={form.description} onChange={setField('description')} rows={4}
                className={inputCls + ' resize-none'} placeholder="Descripción breve del producto..." />
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-2xl border border-cream-100 shadow-card p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-ink-400 uppercase tracking-widest">Características</p>
              <button type="button" onClick={addFeature}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold">+ Agregar</button>
            </div>
            {form.features.map((f, i) => (
              <div key={i} className="flex gap-2">
                <input value={f} onChange={(e) => setFeature(i, e.target.value)}
                  className={inputCls} placeholder={`Característica ${i + 1}`} />
                {form.features.length > 1 && (
                  <button type="button" onClick={() => removeFeature(i)}
                    className="px-3 rounded-xl text-ink-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Eliminar">
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Images */}
          <div className="bg-white rounded-2xl border border-cream-100 shadow-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-ink-400 uppercase tracking-widest">Imágenes</p>
              <button type="button" onClick={() => fileRef.current?.click()}
                disabled={!isEdit}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold disabled:text-ink-300 disabled:cursor-not-allowed"
                title={!isEdit ? 'Guardá el producto primero' : 'Subir imágenes'}>
                + Subir
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden
                onChange={(e) => { uploadFiles(e.target.files); e.target.value = ''; }} />
            </div>

            {!isEdit && (
              <p className="text-[11px] text-ink-400">Podés agregar imágenes una vez creado el producto.</p>
            )}

            {form.images.length === 0 ? (
              <div className="border-2 border-dashed border-cream-200 rounded-xl p-8 text-center text-ink-400 text-sm">
                Sin imágenes todavía.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {form.images.map((url, i) => (
                  <div key={url + i} className="relative group aspect-square rounded-xl overflow-hidden border border-cream-200">
                    <img src={assetUrl(url)} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute top-1.5 left-1.5 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">Principal</span>
                    )}
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-ink-400">La primera imagen es la principal. Formatos: JPG, PNG, WebP (máx 5 MB c/u).</p>
          </div>

        </div>

        {/* Right: pricing, stock, badges */}
        <div className="space-y-5">

          <div className="bg-white rounded-2xl border border-cream-100 shadow-card p-5 sm:p-6 space-y-4">
            <p className="text-xs font-bold text-ink-400 uppercase tracking-widest">Precio e inventario</p>

            <div>
              <label className={labelCls}>Precio (CRC) *</label>
              <input type="number" min="0" value={form.price} onChange={setField('price')}
                className={inputCls} placeholder="12500" required />
              {form.price > 0 && (
                <p className="text-[11px] text-ink-400 mt-1">{formatCRC(Number(form.price))}</p>
              )}
            </div>

            <div>
              <label className={labelCls}>Precio anterior (opcional)</label>
              <input type="number" min="0" value={form.oldPrice} onChange={setField('oldPrice')}
                className={inputCls} placeholder="15000" />
              <p className="text-[11px] text-ink-400 mt-1">Muestra el precio tachado (descuento).</p>
            </div>

            <div>
              <label className={labelCls}>Stock</label>
              <input type="number" min="0" value={form.stock} onChange={setField('stock')}
                className={inputCls} />
            </div>

            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={setField('isActive')}
                className="w-4 h-4 rounded text-rose-500 focus:ring-rose-400" />
              <span className="text-sm text-ink-700 font-medium">Producto activo (visible en tienda)</span>
            </label>
          </div>

          <div className="bg-white rounded-2xl border border-cream-100 shadow-card p-5 sm:p-6 space-y-4">
            <p className="text-xs font-bold text-ink-400 uppercase tracking-widest">Etiqueta (badge)</p>

            <div>
              <label className={labelCls}>Texto</label>
              <input value={form.badge} onChange={setField('badge')} className={inputCls}
                placeholder="Top ventas, Nuevo, Oferta..." />
            </div>

            <div>
              <label className={labelCls}>Tipo</label>
              <select value={form.badgeType} onChange={setField('badgeType')} className={inputCls + ' cursor-pointer'}>
                <option value="">Normal</option>
                <option value="new">Nuevo</option>
                <option value="sale">Oferta</option>
                <option value="hot">Destacado</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
