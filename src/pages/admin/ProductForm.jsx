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
  stock: '',
  isActive: true,
  badge: '',
  badgeType: '',
  variants: [],
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

  const [form, setForm]           = useState(EMPTY);
  const [loading, setLoading]     = useState(isEdit);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const fileRef = useRef(null);
  const [restockReqs, setRestockReqs] = useState([]);

  useEffect(() => {
    if (!isEdit || !USE_API) return;
    api.get('/restock/admin/all')
      .then(({ data }) => {
        const mine = (data.requests || []).filter(
          (r) => String(r.product?._id || r.product) === id
        );
        setRestockReqs(mine);
      })
      .catch(() => {});
  }, [id, isEdit]);

  const notifyRestock = (req) => {
    const phone = req.phone.replace(/\D/g, '');
    const wa = phone.length === 8 ? '506' + phone : phone;
    const msg = `Hola! Te escribimos de JD Virtual. El producto *${req.productName}* que tenias en lista de espera ya volvio a estar disponible. Podés verlo aquí: ${window.location.origin}/producto/${form.slug}`;
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, '_blank');
    api.patch(`/restock/admin/${req._id}`)
      .then(() => setRestockReqs((prev) => prev.map((r) => r._id === req._id ? { ...r, notified: true } : r)))
      .catch(() => {});
  };

  const removeRestock = (req) => {
    api.delete(`/restock/admin/${req._id}`)
      .then(() => setRestockReqs((prev) => prev.filter((r) => r._id !== req._id)))
      .catch(() => {});
  };

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
            variants: found.variants?.length ? found.variants : [],
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

  const addVariant    = () => set('variants', [...(form.variants || []), { name: '', options: [''] }]);
  const removeVariant = (vi) => set('variants', form.variants.filter((_, i) => i !== vi));
  const setVariantName = (vi, v) => {
    const arr = [...form.variants]; arr[vi] = { ...arr[vi], name: v }; set('variants', arr);
  };
  const addVariantOption = (vi) => {
    const arr = [...form.variants]; arr[vi] = { ...arr[vi], options: [...arr[vi].options, ''] }; set('variants', arr);
  };
  const setVariantOption = (vi, oi, v) => {
    const arr = [...form.variants]; arr[vi].options[oi] = v; set('variants', arr);
  };
  const removeVariantOption = (vi, oi) => {
    const arr = [...form.variants]; arr[vi].options = arr[vi].options.filter((_, i) => i !== oi); set('variants', arr);
  };

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
      variants:    (form.variants || []).filter((v) => v.name.trim()).map((v) => ({
        name: v.name.trim(),
        options: v.options.map((o) => o.trim()).filter(Boolean),
      })),
      stock:       form.stock === '' ? null : Number(form.stock),
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

          {/* Variants */}
          <div className="bg-white rounded-2xl border border-cream-100 shadow-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-ink-400 uppercase tracking-widest">Variantes (colores, tallas, tonos...)</p>
              <button type="button" onClick={addVariant}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold">+ Agregar grupo</button>
            </div>
            {(!form.variants || form.variants.length === 0) && (
              <p className="text-[11px] text-ink-400">Sin variantes. Agrega grupos como "Color", "Talla", "Tono"...</p>
            )}
            {(form.variants || []).map((v, vi) => (
              <div key={vi} className="border border-cream-200 rounded-xl p-4 space-y-3">
                <div className="flex gap-2 items-center">
                  <input value={v.name} onChange={(e) => setVariantName(vi, e.target.value)}
                    placeholder="Nombre del grupo (ej: Color)" className={inputCls + ' flex-1'} />
                  <button type="button" onClick={() => removeVariant(vi)}
                    className="px-3 py-2.5 rounded-xl text-ink-400 hover:text-red-500 hover:bg-red-50 text-sm transition-colors">×</button>
                </div>
                <div className="space-y-2">
                  {v.options.map((opt, oi) => (
                    <div key={oi} className="flex gap-2">
                      <input value={opt} onChange={(e) => setVariantOption(vi, oi, e.target.value)}
                        placeholder={`Opción ${oi + 1} (ej: Rosa)`} className={inputCls + ' flex-1 text-sm'} />
                      {v.options.length > 1 && (
                        <button type="button" onClick={() => removeVariantOption(vi, oi)}
                          className="px-3 rounded-xl text-ink-300 hover:text-red-400 transition-colors">×</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => addVariantOption(vi)}
                    className="text-xs text-rose-500 hover:text-rose-600 font-semibold">+ Opción</button>
                </div>
              </div>
            ))}
          </div>

          {/* Restock requests */}
          {isEdit && restockReqs.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 sm:p-6 space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-widest flex-1">
                  Lista de espera — {restockReqs.length} persona{restockReqs.length !== 1 ? 's' : ''}
                </p>
                <button type="button"
                  onClick={() => restockReqs.filter((r) => !r.notified).forEach((r, i) => setTimeout(() => notifyRestock(r), i * 600))}
                  className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                  Avisar a todos
                </button>
              </div>
              <div className="divide-y divide-amber-100">
                {restockReqs.map((r) => (
                  <div key={r._id} className="flex items-center gap-3 py-2.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.notified ? 'bg-green-400' : 'bg-amber-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink-900">{r.phone}</p>
                      <p className="text-[11px] text-ink-400">{r.notified ? 'Ya avisado' : 'Esperando aviso'} · {new Date(r.createdAt).toLocaleDateString('es-CR')}</p>
                    </div>
                    <button type="button" onClick={() => notifyRestock(r)} disabled={r.notified}
                      className="flex items-center gap-1.5 text-xs font-bold bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg transition-colors">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      {r.notified ? 'Avisado' : 'Avisar'}
                    </button>
                    <button type="button" onClick={() => removeRestock(r)}
                      className="text-ink-300 hover:text-red-500 transition-colors p-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                placeholder="Vacío = ilimitado"
                className={inputCls} />
              <p className="text-[11px] text-ink-400 mt-1">Dejá vacío si no querés controlar el inventario.</p>
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
