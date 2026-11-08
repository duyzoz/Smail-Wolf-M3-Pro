/**
 * Macro v2.5 — gọn, ít chữ (theo yêu cầu bro: bản cũ nhiều chữ đến nỗi
 * nút tụt xuống 1 dòng, UI xấu):
 * - Danh sách compact + 2 nút ngắn ("+ Tạo macro", "Ghi xuống chuột").
 * - Bấm "Tạo macro" / sửa 1 macro → POPUP MODAL giữa màn hình, làm mờ
 *   hết phía sau (backdrop-blur), editor nằm trong đó. Đóng modal là xong.
 * - v2.5: modal mở thì khóa lướt nền (useScrollLock) — popup cố định 1
 *   chỗ, nền sau cấm lướt.
 * - Macro chỉ lưu ở máy và ghi xuống chuột — không đọc lại được.
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MousePointerClick, Play, Plus, Save, Trash2, Zap } from 'lucide-react';
import { CODE_TO_HID, keyName, type MacroAction, type MacroDef } from '../lib/hid';
import { useMouse } from '../store';
import { ConfirmModal, EmptyState, FieldLabel, GlassButton, GlassCard, PageHead, useScrollLock } from '../components/ui';

function actionLabel(a: MacroAction): string {
  if (a.kind === 'key') return `${a.action === 'keydown' ? 'Nhấn' : 'Nhả'} ${keyName(16, 0, a.code, 0).replace('Keyboard: ', '')}`;
  if (a.kind === 'mouse') return `${a.action === 'mousedown' ? 'Bấm chuột' : 'Nhả chuột'} nút ${a.button}`;
  return `Chờ ${a.delayMs} ms`;
}

export default function MacroPage(): React.JSX.Element {
  const { macros, setMacros, writeMacros, busy, addLog, mode, connected } = useMouse();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [steps, setSteps] = useState<MacroAction[]>([]);
  const [recording, setRecording] = useState(false);
  const [delayMs, setDelayMs] = useState(50);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const startNew = (): void => {
    setEditingId(`m${Date.now()}`);
    setName(`Macro ${macros.length + 1}`);
    setSteps([]);
  };

  const openEdit = (m: MacroDef): void => {
    setEditingId(m.id);
    setName(m.name);
    setSteps([...m.actions]);
  };

  const closeEditor = (): void => {
    setEditingId(null);
    setRecording(false);
  };

  // v2.5: modal mở thì khóa lướt nền — popup cố định 1 chỗ.
  useScrollLock(editingId !== null);

  const saveCurrent = (): void => {
    if (!editingId) return;
    const trimmed = name.trim() || 'Macro không tên';
    const def: MacroDef = { id: editingId, name: trimmed, actions: steps };
    const next = macros.some((m) => m.id === editingId)
      ? macros.map((m) => (m.id === editingId ? def : m))
      : [...macros, def];
    setMacros(next);
    addLog(`Đã lưu macro "${trimmed}" (${steps.length} bước).`);
    closeEditor();
  };

  // Record mode: chỉ ghi khi modal mở + đang ghi — bấm phím thật thành bước.
  useEffect(() => {
    if (!recording || !editingId) return;
    const down = (e: KeyboardEvent): void => {
      if (e.repeat) return;
      const hid = CODE_TO_HID[e.code];
      if (hid === undefined) return;
      e.preventDefault();
      setSteps((prev) => [...prev, { kind: 'key', code: hid, action: 'keydown', delayMs: 0 }]);
    };
    const up = (e: KeyboardEvent): void => {
      const hid = CODE_TO_HID[e.code];
      if (hid === undefined) return;
      e.preventDefault();
      setSteps((prev) => [...prev, { kind: 'key', code: hid, action: 'keyup', delayMs: 0 }]);
    };
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    return () => {
      window.removeEventListener('keydown', down, true);
      window.removeEventListener('keyup', up, true);
    };
  }, [recording, editingId]);

  const editing = editingId ? macros.find((m) => m.id === editingId) : undefined;

  return (
    <div>
      <PageHead title="Macro" subtitle="Lưu ở máy, ghi xuống chuột. Không đọc lại được." />
      <GlassCard>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-[15px] font-semibold text-[#edebe6]">Danh sách macro</h3>
          <span className="text-xs text-[#a2a2b0]">{macros.length} macro</span>
        </div>
        {macros.length === 0 ? (
          <EmptyState text="Chưa có macro nào." />
        ) : (
          <div className="space-y-2">
            {macros.map((m, i) => (
              <div key={m.id} className="uiv-stripe">
                <div
                  className={`uiv-stripe-inner flex items-center gap-2 p-3 ${editingId === m.id ? 'ring-2 ring-[#ff5a1f]/60' : ''}`}
                >
                  <Zap className="h-4 w-4 shrink-0 text-[#ff8a3d]" />
                  <button onClick={() => openEdit(m)} className="min-w-0 flex-1 text-left">
                    <div className="truncate text-sm font-semibold text-white">{m.name}</div>
                    <div className="text-[11px] text-[#a2a2b0]">
                      Macro #{i} · {m.actions.length} bước
                    </div>
                  </button>
                  <button
                    onClick={() => setConfirmDelete(m.id)}
                    aria-label={`Xóa macro ${m.name}`}
                    className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-lg text-red-300 hover:bg-red-400/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <GlassButton onClick={startNew} className="flex-1">
            <Plus className="h-4 w-4" /> Tạo macro
          </GlassButton>
          <GlassButton
            variant="ghost"
            onClick={() => void writeMacros(0)}
            disabled={macros.length === 0 || busy || !connected}
            className="flex-1"
          >
            <Play className="h-4 w-4" /> {mode === 'demo' ? 'Ghi (mô phỏng)' : 'Ghi xuống chuột'}
          </GlassButton>
        </div>
      </GlassCard>

      {/* Modal sửa/tạo macro — làm mờ hết phía sau (theo yêu cầu bro).
          v2.6: PORTAL ra document.body (cùng lý do ConfirmModal — Shell
          giữ transform .app-enter nên fixed inset-0 chỉ phủ khung Shell,
          2 mép ngoài không mờ). */}
      {editingId !== null &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={editing ? 'Sửa macro' : 'Macro mới'}
            onClick={closeEditor}
          >
          <div
            className="panel-card max-h-[85vh] w-full max-w-lg overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[#edebe6]">{editing ? 'Sửa macro' : 'Macro mới'}</h3>
            <div className="mt-4 space-y-4">
              <div>
                <FieldLabel>Tên macro</FieldLabel>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-label="Tên macro"
                  className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white"
                  placeholder="VD: Mở Chrome + dán"
                />
              </div>

              <div>
                <FieldLabel>Các bước ({steps.length})</FieldLabel>
                {steps.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/15 p-4 text-sm text-[#a2a2b0]">
                    Chưa có bước nào. Bấm “Ghi phím” rồi nhấn phím thật, hoặc thêm bước chờ / bấm chuột.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {steps.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm">
                        <span className="w-6 shrink-0 font-mono text-xs text-[#a2a2b0]">{i + 1}.</span>
                        <span className="flex-1 text-white">{actionLabel(s)}</span>
                        <button
                          onClick={() => setSteps((prev) => prev.filter((_, j) => j !== i))}
                          aria-label={`Xóa bước ${i + 1}`}
                          className="flex h-[36px] w-[36px] items-center justify-center rounded-lg text-red-300 hover:bg-red-400/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <GlassButton variant="ghost" onClick={() => setRecording((r) => !r)}>
                  <MousePointerClick className="h-4 w-4" />
                  {recording ? 'Dừng ghi phím…' : 'Ghi phím…'}
                </GlassButton>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={delayMs}
                    min={10}
                    max={5000}
                    step={10}
                    aria-label="Số mili giây chờ"
                    onChange={(e) => setDelayMs(Number(e.target.value))}
                    className="w-[90px] rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-right font-mono text-sm text-white"
                  />
                  <GlassButton
                    variant="ghost"
                    onClick={() => {
                      setSteps((prev) => [...prev, { kind: 'delay', delayMs: Math.max(10, delayMs) }]);
                    }}
                  >
                    + Chờ {delayMs} ms
                  </GlassButton>
                </div>
                <GlassButton
                  variant="ghost"
                  onClick={() => setSteps((prev) => [...prev, { kind: 'mouse', button: 0, action: 'mousedown', delayMs: 0 }, { kind: 'mouse', button: 0, action: 'mouseup', delayMs: 0 }])}
                >
                  + Bấm chuột trái
                </GlassButton>
              </div>
              {recording && (
                <p className="animate-pulse text-sm text-[#ffb37a]">
                  Đang ghi… nhấn phím bất kỳ (nhấn + nhả sẽ thành 2 bước). Bấm “Dừng ghi phím…” để xong.
                </p>
              )}

              <div className="flex gap-2 border-t border-white/10 pt-4">
                <GlassButton onClick={saveCurrent}>
                  <Save className="h-4 w-4" /> Lưu macro
                </GlassButton>
                <GlassButton variant="ghost" onClick={closeEditor}>
                  Hủy
                </GlassButton>
              </div>
            </div>
          </div>
          </div>,
          document.body,
        )}

      <ConfirmModal
        open={confirmDelete !== null}
        title="Xóa macro?"
        confirmLabel="Xóa"
        danger
        onConfirm={() => {
          if (confirmDelete) {
            setMacros(macros.filter((m) => m.id !== confirmDelete));
            if (editingId === confirmDelete) closeEditor();
          }
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      >
        Macro sẽ bị xóa khỏi máy.
      </ConfirmModal>
    </div>
  );
}
