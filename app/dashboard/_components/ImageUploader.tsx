'use client';

import { useEffect, useRef, useState } from 'react';

const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX = 4 * 1024 * 1024;

interface Props {
  /** The file picked in the form (uploaded to Cloudinary by the server when the form is saved). */
  file: File | null;
  onFile: (file: File | null) => void;
  /** Image already saved (Cloudinary URL or old /img/... path), shown until a new file is picked. */
  currentUrl?: string;
  onError?: (message: string) => void;
  label?: string;
  hint?: string;
}

export function ImageUploader({ file, onFile, currentUrl, onError, label = 'Plan image', hint }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState('');
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState('');

  // Object-URL preview for the picked file; revoked when it changes or the component unmounts
  useEffect(() => {
    if (!file) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (f: File | undefined | null) => {
    if (!f) return;
    let err = '';
    if (!TYPES.includes(f.type)) err = 'Image must be JPG, PNG, WebP or AVIF';
    else if (f.size > MAX) err = 'Image must be 4 MB or smaller';
    setLocalError(err);
    if (err) return onError?.(err);
    onFile(f);
  };

  const shown = preview || currentUrl || '';

  return (
    <div>
      <span className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">{label}</span>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]); }}
        className={`flex flex-col gap-4 rounded-xl border border-dashed p-4 transition sm:flex-row sm:items-center ${
          dragging ? 'border-indigo-400 bg-indigo-500/10' : 'border-slate-800 bg-slate-950'
        }`}
      >
        <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-800 bg-slate-900 sm:w-48">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="Image preview" className="h-full w-full object-cover" />
          ) : (
            <span className="px-3 text-center text-xs text-slate-500">No image selected</span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="cursor-pointer rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              {shown ? 'Choose a different image' : 'Choose image'}
            </button>
            {file && (
              <button
                type="button"
                onClick={() => { onFile(null); setLocalError(''); if (inputRef.current) inputRef.current.value = ''; }}
                className="cursor-pointer rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
              >
                Undo selection
              </button>
            )}
          </div>

          <p className="text-xs text-slate-500">
            {file ? (
              <>
                <span className="text-slate-300">{file.name}</span> ({(file.size / 1024).toFixed(0)} KB) - uploads to Cloudinary when you save.
              </>
            ) : (
              <>Drag &amp; drop or click to browse. {hint ?? 'JPG, PNG, WebP or AVIF, up to 4 MB.'}</>
            )}
          </p>
          {localError && <p role="alert" className="text-xs text-red-400">{localError}</p>}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={TYPES.join(',')}
          className="sr-only"
          aria-label={label}
          onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }}
        />
      </div>
    </div>
  );
}
