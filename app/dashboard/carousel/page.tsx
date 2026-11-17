'use client';

import { useCallback, useEffect, useState } from 'react';
import { http, errMsg } from '@/lib/http';
import { DBadge, DModal, StatusMsg, dBtnGhost, dBtnPrimary, dCard, dInput, dLabel } from '../_components/dark';

interface SlideDTO {
  id: string;
  title: string;
  eyebrow: string;
  image: string;
  imageAlt: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  order: number;
  isActive: boolean;
}

const emptyForm = {
  title: '',
  eyebrow: '',
  imageAlt: '',
  primaryLabel: 'Package Plans',
  primaryHref: '#price',
  secondaryLabel: 'Get Now',
  secondaryHref: '/home-internet',
  isActive: true,
};

export default function CarouselAdminPage() {
  const [slides, setSlides] = useState<SlideDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<SlideDTO | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await http<{ data: SlideDTO[] }>('/api/carousel?all=1');
      setSlides(r.data);
    } catch (e) {
      setMsg({ type: 'error', text: errMsg(e) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // object-URL preview for the chosen file (revoked when it changes)
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFile(null);
    setPreview('');
    setFormError('');
    setModal(true);
  };

  const openEdit = (s: SlideDTO) => {
    setEditing(s);
    setForm({
      title: s.title,
      eyebrow: s.eyebrow,
      imageAlt: s.imageAlt,
      primaryLabel: s.primaryLabel,
      primaryHref: s.primaryHref,
      secondaryLabel: s.secondaryLabel,
      secondaryHref: s.secondaryHref,
      isActive: s.isActive,
    });
    setFile(null);
    setPreview(s.image);
    setFormError('');
    setModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!editing && !file) return setFormError('Please choose an image');

    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, String(v)));
    if (file) body.append('image', file);

    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/carousel/${editing.id}` : '/api/carousel', { method: editing ? 'PUT' : 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save slide');
      setModal(false);
      setMsg({ type: 'success', text: editing ? 'Slide updated.' : 'Slide added.' });
      load();
    } catch (err) {
      setFormError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (s: SlideDTO) => {
    const body = new FormData();
    Object.entries({ ...s, isActive: !s.isActive }).forEach(([k, v]) => {
      if (['title', 'eyebrow', 'imageAlt', 'primaryLabel', 'primaryHref', 'secondaryLabel', 'secondaryHref', 'isActive'].includes(k)) body.append(k, String(v));
    });
    try {
      const res = await fetch(`/api/carousel/${s.id}`, { method: 'PUT', body });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Update failed');
      load();
    } catch (err) {
      setMsg({ type: 'error', text: errMsg(err) });
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= slides.length) return;
    const next = [...slides];
    [next[index], next[j]] = [next[j], next[index]];
    setSlides(next); // optimistic
    try {
      await http('/api/carousel/reorder', { method: 'PUT', json: { ids: next.map((s) => s.id) } });
    } catch (err) {
      setMsg({ type: 'error', text: errMsg(err) });
      load();
    }
  };

  const remove = async (s: SlideDTO) => {
    if (!confirm(`Delete the slide "${s.title}"? Its image will be removed from Cloudinary too.`)) return;
    try {
      await http(`/api/carousel/${s.id}`, { method: 'DELETE' });
      setMsg({ type: 'success', text: 'Slide deleted.' });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: errMsg(err) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Homepage Carousel</h1>
          <p className="mt-1 text-sm text-slate-400">Add, reorder and hide the hero slides. Changes appear on the homepage right away.</p>
        </div>
        <button onClick={openCreate} className={`${dBtnPrimary} self-start sm:self-auto`}>+ Add Slide</button>
      </div>

      <StatusMsg msg={msg} />

      {loading ? (
        <p className="text-sm text-slate-400">Loading slides...</p>
      ) : slides.length === 0 ? (
        <div className={`${dCard} p-10 text-center text-sm text-slate-400`}>
          No slides yet, so the website is showing its built-in default slides. Add your first slide to replace them.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {slides.map((s, i) => (
            <li key={s.id} className={`${dCard} overflow-hidden ${s.isActive ? '' : 'opacity-60'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.image} alt={s.imageAlt || s.title} className="aspect-[1.9/1] w-full object-cover" />
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Slide {i + 1}</p>
                    <h3 className="truncate text-sm font-semibold text-slate-100" title={s.title}>{s.title}</h3>
                  </div>
                  <DBadge value={s.isActive ? 'Active' : 'Hidden'} />
                </div>
                <p className="truncate text-xs text-slate-400">
                  {s.primaryLabel} &rarr; {s.primaryHref} · {s.secondaryLabel} &rarr; {s.secondaryHref}
                </p>
                <div className="flex flex-wrap items-center gap-3 border-t border-slate-800 pt-3 text-sm">
                  <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier" className="cursor-pointer text-slate-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-30">&uarr;</button>
                  <button onClick={() => move(i, 1)} disabled={i === slides.length - 1} aria-label="Move later" className="cursor-pointer text-slate-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-30">&darr;</button>
                  <button onClick={() => openEdit(s)} className="cursor-pointer font-medium text-indigo-400 hover:text-indigo-300">Edit</button>
                  <button onClick={() => toggle(s)} className="cursor-pointer font-medium text-amber-400 hover:text-amber-300">{s.isActive ? 'Hide' : 'Show'}</button>
                  <button onClick={() => remove(s)} className="ml-auto cursor-pointer font-medium text-red-400 hover:text-red-300">Delete</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modal && (
        <DModal title={editing ? 'Edit slide' : 'Add slide'} onClose={() => !saving && setModal(false)} wide>
          <form onSubmit={save} className="space-y-4">
            {formError && <StatusMsg msg={{ type: 'error', text: formError }} />}

            <div>
              <label className={dLabel}>Image {editing ? '(leave empty to keep current)' : '*'}</label>
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Preview" className="mb-2 aspect-[1.9/1] w-full rounded-xl border border-slate-800 object-cover" />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full cursor-pointer text-sm text-slate-300 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-200 hover:file:bg-slate-700"
              />
              <p className="mt-1 text-xs text-slate-500">Landscape works best, about 1600 x 840 px (roughly 1.9 : 1). JPG, PNG, WebP or AVIF, up to 4 MB.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={dLabel}>Heading *</label>
                <input required maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={dInput} placeholder="Best connection for your home" />
              </div>
              <div>
                <label className={dLabel}>Small line above heading</label>
                <input maxLength={80} value={form.eyebrow} onChange={(e) => setForm({ ...form, eyebrow: e.target.value })} className={dInput} placeholder="Defaults to the heading" />
              </div>
              <div>
                <label className={dLabel}>Image description (alt text)</label>
                <input maxLength={160} value={form.imageAlt} onChange={(e) => setForm({ ...form, imageAlt: e.target.value })} className={dInput} />
              </div>
              <div>
                <label className={dLabel}>Button 1 label</label>
                <input maxLength={30} value={form.primaryLabel} onChange={(e) => setForm({ ...form, primaryLabel: e.target.value })} className={dInput} />
              </div>
              <div>
                <label className={dLabel}>Button 1 link</label>
                <input value={form.primaryHref} onChange={(e) => setForm({ ...form, primaryHref: e.target.value })} className={dInput} placeholder="#price or /page" />
              </div>
              <div>
                <label className={dLabel}>Button 2 label</label>
                <input maxLength={30} value={form.secondaryLabel} onChange={(e) => setForm({ ...form, secondaryLabel: e.target.value })} className={dInput} />
              </div>
              <div>
                <label className={dLabel}>Button 2 link</label>
                <input value={form.secondaryHref} onChange={(e) => setForm({ ...form, secondaryHref: e.target.value })} className={dInput} placeholder="/home-internet" />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-slate-100" />
              Show on the homepage
            </label>

            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button type="button" onClick={() => setModal(false)} disabled={saving} className={dBtnGhost}>Cancel</button>
              <button type="submit" disabled={saving} className={dBtnPrimary}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Add slide'}</button>
            </div>
          </form>
        </DModal>
      )}
    </div>
  );
}
