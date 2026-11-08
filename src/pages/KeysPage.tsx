/**
 * Gán phím — remap 6 phím qua setKeys (verbatim chunk 515).
 * Nút DPI (index 5) là cố định, không remap được — app gốc cũng vậy.
 * Bấm "Bấm phím…" rồi nhấn 1 phím (kèm Ctrl/Shift/Alt) để gán.
 */
import { useEffect, useRef, useState } from 'react';
import { Keyboard, MousePointerClick, RotateCcw, X, Zap } from 'lucide-react';
import { CODE_TO_HID, DEFAULT_KEYS, keyName, KEY_LABELS, type KeyBinding, type ParsedKey } from '../lib/hid';
import { useMouse } from '../store';
import { ConfirmModal, EmptyState, FieldLabel, GlassCard, PageHead, ShyArrow } from '../components/ui';

const MOUSE_OPTIONS: { code1: number; label: string }[] = [
  { code1: 1, label: 'Left click' },
  { code1: 2, label: 'Right click' },
  { code1: 4, label: 'Middle click' },
  { code1: 8, label: 'Backward' },
  { code1: 16, label: 'Forward' },
];

export default function KeysPage(): React.JSX.Element {
  const { keys, macros, busy, saveKeys, mode } = useMouse();
  const [draft, setDraft] = useState<KeyBinding[]>(DEFAULT_KEYS.map((k) => ({ ...k })));
  const [dirty, setDirty] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const captureRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (keys) {
      setDraft(keys.map((k) => ({ type: k.type, code1: k.code1, code2: k.code2, code3: k.code3 })));
      setDirty(false);
    }
  }, [keys]);

  // Key capture: 1 lần keydown -> map sang HID usage + modifier bitmask.
  useEffect(() => {
    if (!capturing || editing === null) return;
    const handler = (e: KeyboardEvent): void => {
      e.preventDefault();
      e.stopPropagation();
      const hid = CODE_TO_HID[e.code];
      if (hid === undefined) return; // phím không map được thì bỏ qua, vẫn đang nghe
      let mods = 0;
      if (e.ctrlKey) mods |= 1;
      if (e.shiftKey) mods |= 2;
      if (e.altKey) mods |= 4;
      if (e.metaKey) mods |= 8;
      setDraft((prev) => {
        const next = [...prev];
        next[editing] = { type: 16, code1: mods, code2: hid, code3: 0 };
        return next;
      });
      setDirty(true);
      setCapturing(false);
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [capturing, editing]);

  if (!keys) {
    return (
      <div>
        <PageHead title="Gán phím" subtitle="Remap 6 phím của chuột." />
        <EmptyState text="Chưa kết nối — chọn Demo (mô phỏng) hoặc Kết nối chuột thật ở thanh trên cùng." />
      </div>
    );
  }

  const applyToDraft = (i: number, k: KeyBinding): void => {
    setDraft((prev) => {
      const next = [...prev];
      next[i] = { ...k };
      return next;
    });
    setDirty(true);
  };

  const save = (): void => {
    void saveKeys(draft);
  };

  const editKey: ParsedKey | null = editing !== null ? { ...draft[editing], index: editing, name: keyName(draft[editing].type, draft[editing].code1, draft[editing].code2, draft[editing].code3) } : null;

  return (
    <div>
      <PageHead title="Gán phím" />
      {/* v2.6: 2 cột thay vì 3 — card 3 cột hẹp (~152px) làm "Phím Trái"
          và nút "Đổi gán phím" xuống dòng 2 lần, lệch cả lưới. 2 cột
          (~240px) thì tiêu đề + nút đều vừa 1 dòng. */}
      <div className="grid gap-3 md:grid-cols-2">
        {draft.map((k, i) => {
          const isDpi = i === 5;
          const name = keyName(k.type, k.code1, k.code2, k.code3);
          return (
            <GlassCard key={i} hover={!isDpi}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff5a1f]/25 to-[#facc15]/10 text-[#ffb37a]">
                  {k.type === 16 ? <Keyboard className="h-5 w-5" /> : k.type === 112 ? <Zap className="h-5 w-5" /> : <MousePointerClick className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold whitespace-nowrap text-white">Phím {KEY_LABELS[i]}</div>
                  <div className="truncate text-xs text-[#a2a2b0]" title={name}>
                    {name}
                  </div>
                  {/* v2.6: dòng mono "type N · a,b,c" ĐÃ XÓA theo lệnh bro
                      (text thừa, chỉ dev mới đọc). */}
                </div>
              </div>
              <div className="mt-4">
                {isDpi ? (
                  <span className="inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] text-[#a2a2b0]">
                    Cố định — luôn là nút DPI
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditing(i)}
                    className="uiv-shy-btn w-full justify-center whitespace-nowrap"
                  >
                    Đổi gán phím
                    <ShyArrow />
                  </button>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={save} disabled={!dirty || busy} className="uiv-shy-btn uiv-shy-selected whitespace-nowrap disabled:opacity-50">
          {mode === 'demo' ? 'Lưu (mô phỏng)' : 'Lưu xuống chuột'}
          <ShyArrow />
        </button>
        <button type="button" onClick={() => setConfirmReset(true)} disabled={!dirty || busy} className="uiv-shy-btn whitespace-nowrap disabled:opacity-50">
          <RotateCcw className="h-4 w-4" /> Về mặc định gốc
          <ShyArrow />
        </button>
      </div>
      {!dirty && <p className="mt-3 text-xs text-[#a2a2b0]">Chưa có thay đổi nào. Bấm “Đổi gán phím” ở 1 phím để sửa.</p>}

      {/* Editor modal */}
      <ConfirmModal
        open={editing !== null}
        title={editing !== null ? `Đổi phím ${KEY_LABELS[editing]}` : ''}
        confirmLabel="Xong"
        onConfirm={() => setEditing(null)}
        onCancel={() => setEditing(null)}
      >
        {editKey && editing !== null && (
          <div className="space-y-4">
            <div>
              <FieldLabel>Hiện tại</FieldLabel>
              <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 font-mono text-sm text-white">{editKey.name}</div>
            </div>
            <div>
              <FieldLabel>Chuột</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {MOUSE_OPTIONS.map((o) => (
                  <button
                    key={o.code1}
                    onClick={() => applyToDraft(editing, { type: 32, code1: o.code1, code2: 0, code3: 0 })}
                    className="uiv-shy-btn whitespace-nowrap"
                  >
                    {o.label}
                    <ShyArrow />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Bàn phím — bấm nút rồi nhấn phím thật</FieldLabel>
              <button
                ref={captureRef}
                onClick={() => setCapturing(true)}
                className={`min-h-[48px] w-full rounded-xl border px-4 text-sm font-semibold transition ${
                  capturing
                    ? 'animate-pulse border-[#ff5a1f] bg-[#ff5a1f]/20 text-[#ffd2ae]'
                    : 'border-white/15 bg-white/5 text-white hover:border-[#ff5a1f]/50'
                }`}
              >
                {capturing ? 'Đang nghe… nhấn 1 phím (kèm Ctrl/Shift/Alt nếu muốn)' : 'Bấm phím…'}
              </button>
            </div>
            <div>
              <FieldLabel>Macro</FieldLabel>
              {macros.length === 0 ? (
                <p className="text-xs text-[#a2a2b0]">Chưa có macro nào — sang tab Macro tạo trước rồi quay lại gán.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {macros.map((m, mi) => (
                    <button
                      key={m.id}
                      onClick={() => applyToDraft(editing, { type: 112, code1: mi, code2: 0, code3: 1 })}
                      className="uiv-shy-btn whitespace-nowrap"
                    >
                      {m.name}
                      <ShyArrow />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <FieldLabel>Khác</FieldLabel>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => applyToDraft(editing, { type: 33, code1: 85, code2: 0, code3: 0 })}
                  className="uiv-shy-btn whitespace-nowrap"
                >
                  Nút DPI
                  <ShyArrow />
                </button>
                <button
                  onClick={() => applyToDraft(editing, { type: 0, code1: 0, code2: 0, code3: 0 })}
                  className="uiv-shy-btn whitespace-nowrap"
                >
                  <X className="h-3.5 w-3.5" /> Để trống
                  <ShyArrow />
                </button>
              </div>
            </div>
          </div>
        )}
      </ConfirmModal>

      <ConfirmModal
        open={confirmReset}
        title="Về mặc định gốc?"
        confirmLabel="Khôi phục"
        danger
        onConfirm={() => {
          setDraft(DEFAULT_KEYS.map((k) => ({ ...k })));
          setDirty(true);
          setConfirmReset(false);
        }}
        onCancel={() => setConfirmReset(false)}
      >
        Đặt lại 6 phím về mặc định gốc (Trái / Phải / Giữa / Lùi / Tiến / DPI).{' '}
        {mode === 'demo' ? 'Bấm “Lưu (mô phỏng)” sau đó.' : 'Bấm “Lưu xuống chuột” sau đó để ghi thật.'}
      </ConfirmModal>
    </div>
  );
}
