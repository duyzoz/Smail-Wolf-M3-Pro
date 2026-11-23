/**
 * Macro v2.5 — compact, little text (per Ethan's request: the old version had so much text that
 * the buttons dropped to a second line, ugly UI):
 * - Compact list + 2 short buttons ("+ Create macro", "Write to mouse").
 * - Clicking "Create macro" / editing a macro → MODAL POPUP in the middle of the screen, blurring
 *   everything behind (backdrop-blur), the editor lives inside it. Closing the modal is done.
 * - v2.5: an open modal locks background scrolling (useScrollLock) — the popup stays fixed in
 *   place, the background behind must not scroll.
 * - Macros are only stored on this PC and written to the mouse — they cannot be read back.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MousePointerClick, Play, Plus, Save, Trash2, Zap } from 'lucide-react';
import { CODE_TO_HID, keyName, type MacroAction, type MacroDef } from '../lib/hid';
import { useMouse } from '../store';
import { ConfirmModal, EmptyState, FieldLabel, GlassButton, GlassCard, PageHead, useScrollLock } from '../components/ui';

const EXTRA_KEY_CODES: Record<string, number> = {
  ControlLeft: 224,
  ShiftLeft: 225,
  AltLeft: 226,
  MetaLeft: 227,
  ControlRight: 228,
  ShiftRight: 229,
  AltRight: 230,
  MetaRight: 231,
};

function actionLabel(a: MacroAction): string {
  if (a.kind === 'key') {
    const key = keyName(16, 0, a.code, 0).replace('Keyboard: ', '');
    const act = a.action === 'keydown' ? 'Press' : 'Release';
    const delay = a.delayMs ? ` (${a.delayMs} ms)` : '';
    return `${act} ${key}${delay}`;
  }
  if (a.kind === 'mouse') {
    const act = a.action === 'mousedown' ? 'Click' : 'Release';
    const btnName = a.button === 0 ? 'Left' : a.button === 1 ? 'Middle' : a.button === 2 ? 'Right' : `button ${a.button}`;
    const delay = a.delayMs ? ` (${a.delayMs} ms)` : '';
    return `${act} ${btnName} button${delay}`;
  }
  return `Wait ${a.delayMs} ms`;
}

export default function MacroPage(): React.JSX.Element {
  const { macros, setMacros, writeMacros, busy, addLog, mode, connected } = useMouse();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [steps, setSteps] = useState<MacroAction[]>([]);
  const [recording, setRecording] = useState(false);
  const [delayMs, setDelayMs] = useState(50);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const startNew = (): void => {
    setEditingId(`m${Date.now()}`);
    setName(`Macro ${macros.length + 1}`);
    setSteps([]);
    lastTimeRef.current = null;
  };

  const openEdit = (m: MacroDef): void => {
    setEditingId(m.id);
    setName(m.name);
    setSteps([...m.actions]);
    lastTimeRef.current = null;
  };

  const closeEditor = (): void => {
    setEditingId(null);
    setRecording(false);
    lastTimeRef.current = null;
  };

  // v2.5: an open modal locks background scrolling — the popup stays fixed in place.
  useScrollLock(editingId !== null);

  const saveCurrent = (): void => {
    if (!editingId) return;
    const trimmed = name.trim() || 'Untitled macro';
    const def: MacroDef = { id: editingId, name: trimmed, actions: steps };
    const next = macros.some((m) => m.id === editingId)
      ? macros.map((m) => (m.id === editingId ? def : m))
      : [...macros, def];
    setMacros(next);
    addLog(`Macro "${trimmed}" saved (${steps.length} steps).`);
    closeEditor();
  };

  // Record mode: records while modal is open + recording — tracks timing with performance.now().
  // Typing conflict guard: skips keystrokes when focused inside input/textarea/contentEditable elements.
  useEffect(() => {
    if (!recording || !editingId) {
      lastTimeRef.current = null;
      return;
    }

    const clampDelay = (ms: number): number => {
      if (Number.isNaN(ms)) return 2;
      return Math.min(5000, Math.max(2, Math.round(ms)));
    };

    const isTypingElement = (target: EventTarget | null): boolean => {
      const active = typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;
      const el = target as HTMLElement | null;
      const check = (node: HTMLElement | null): boolean => {
        if (!node) return false;
        if (node instanceof HTMLInputElement || node.tagName === 'INPUT') return true;
        if (node instanceof HTMLTextAreaElement || node.tagName === 'TEXTAREA') return true;
        if (node.isContentEditable) return true;
        return false;
      };
      return check(el) || check(active);
    };

    const recordKey = (code: number, action: 'keydown' | 'keyup'): void => {
      const now = performance.now();
      const delay = lastTimeRef.current === null ? 2 : clampDelay(now - lastTimeRef.current);
      lastTimeRef.current = now;
      setSteps((prev) => [...prev, { kind: 'key', code, action, delayMs: delay }]);
    };

    const down = (e: KeyboardEvent): void => {
      if (isTypingElement(e.target)) return;
      if (e.repeat) return;
      const hid = CODE_TO_HID[e.code] ?? EXTRA_KEY_CODES[e.code];
      if (hid === undefined) return;
      e.preventDefault();
      recordKey(hid, 'keydown');
    };

    const up = (e: KeyboardEvent): void => {
      if (isTypingElement(e.target)) return;
      const hid = CODE_TO_HID[e.code] ?? EXTRA_KEY_CODES[e.code];
      if (hid === undefined) return;
      e.preventDefault();
      recordKey(hid, 'keyup');
    };

    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    return () => {
      window.removeEventListener('keydown', down, true);
      window.removeEventListener('keyup', up, true);
      lastTimeRef.current = null;
    };
  }, [recording, editingId]);

  const editing = editingId ? macros.find((m) => m.id === editingId) : undefined;

  return (
    <div>
      <PageHead title="Macro" subtitle="Stored on this PC, written to the mouse. Cannot be read back." />
      <GlassCard>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-[15px] font-semibold text-[#edebe6]">Macro list</h3>
          <span className="text-xs text-[#a2a2b0]">{macros.length} macro</span>
        </div>
        {macros.length === 0 ? (
          <EmptyState text="No macros yet." />
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
                      Macro #{i} · {m.actions.length} steps
                    </div>
                  </button>
                  <button
                    onClick={() => setConfirmDelete(m.id)}
                    aria-label={`Delete macro ${m.name}`}
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
            <Plus className="h-4 w-4" /> Create macro
          </GlassButton>
          <GlassButton
            variant="ghost"
            onClick={() => void writeMacros(0)}
            disabled={macros.length === 0 || busy || !connected}
            className="flex-1"
          >
            <Play className="h-4 w-4" /> {mode === 'demo' ? 'Write (simulated)' : 'Write to mouse'}
          </GlassButton>
        </div>
      </GlassCard>

      {/* Create/edit macro modal — blurs everything behind (per Ethan's request).
          v2.6: PORTAL to document.body (same reason as ConfirmModal — the Shell
          holds the .app-enter transform, so fixed inset-0 only covers the Shell frame,
          and the 2 outer edges stay unblurred). */}
      {editingId !== null &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={editing ? 'Edit macro' : 'New macro'}
            onClick={closeEditor}
          >
          <div
            className="panel-card max-h-[85vh] w-full max-w-lg overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[#edebe6]">{editing ? 'Edit macro' : 'New macro'}</h3>
            <div className="mt-4 space-y-4">
              <div>
                <FieldLabel>Macro name</FieldLabel>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-label="Macro name"
                  className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white"
                  placeholder="e.g. Open Chrome + paste"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <FieldLabel>Steps ({steps.length})</FieldLabel>
                  {steps.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSteps([])}
                      className="text-xs text-red-300 hover:text-red-200 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                {steps.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/15 p-4 text-sm text-[#a2a2b0]">
                    No steps yet. Click “Record keys”, then press a real key, or add a wait / mouse-click step.
                  </p>
                ) : (
                  <div className="max-h-60 overflow-y-auto pr-1 space-y-1.5">
                    {steps.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm">
                        <span className="w-6 shrink-0 font-mono text-xs text-[#a2a2b0]">{i + 1}.</span>
                        <span className="flex-1 text-white">{actionLabel(s)}</span>
                        <button
                          onClick={() => setSteps((prev) => prev.filter((_, j) => j !== i))}
                          aria-label={`Delete step ${i + 1}`}
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
                <GlassButton
                  variant={recording ? 'primary' : 'ghost'}
                  onClick={() => {
                    setRecording((r) => {
                      const next = !r;
                      lastTimeRef.current = null;
                      return next;
                    });
                  }}
                >
                  <MousePointerClick className="h-4 w-4" />
                  {recording ? 'Stop recording…' : 'Record keys…'}
                </GlassButton>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={delayMs}
                    min={10}
                    max={5000}
                    step={10}
                    aria-label="Wait milliseconds"
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setDelayMs(Number.isNaN(v) ? 10 : Math.min(5000, Math.max(10, v)));
                    }}
                    className="w-[90px] rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-right font-mono text-sm text-white"
                  />
                  <GlassButton
                    variant="ghost"
                    onClick={() => {
                      const ms = Math.min(5000, Math.max(10, delayMs || 50));
                      setSteps((prev) => [...prev, { kind: 'delay', delayMs: ms }]);
                      if (recording) lastTimeRef.current = performance.now();
                    }}
                  >
                    + Wait {delayMs} ms
                  </GlassButton>
                </div>
                <GlassButton
                  variant="ghost"
                  onClick={() => {
                    setSteps((prev) => [
                      ...prev,
                      { kind: 'mouse', button: 0, action: 'mousedown', delayMs: 2 },
                      { kind: 'mouse', button: 0, action: 'mouseup', delayMs: 20 },
                    ]);
                    if (recording) lastTimeRef.current = performance.now();
                  }}
                >
                  + Left click
                </GlassButton>
                <GlassButton
                  variant="ghost"
                  onClick={() => {
                    setSteps((prev) => [
                      ...prev,
                      { kind: 'mouse', button: 2, action: 'mousedown', delayMs: 2 },
                      { kind: 'mouse', button: 2, action: 'mouseup', delayMs: 20 },
                    ]);
                    if (recording) lastTimeRef.current = performance.now();
                  }}
                >
                  + Right click
                </GlassButton>
              </div>
              {recording && (
                <p className="animate-pulse text-sm text-[#ffb37a]">
                  Recording… press any key (press + release becomes 2 steps). Click “Stop recording…” when done.
                </p>
              )}

              <div className="flex gap-2 border-t border-white/10 pt-4">
                <GlassButton onClick={saveCurrent}>
                  <Save className="h-4 w-4" /> Save macro
                </GlassButton>
                <GlassButton variant="ghost" onClick={closeEditor}>
                  Cancel
                </GlassButton>
              </div>
            </div>
          </div>
          </div>,
          document.body,
        )}

      <ConfirmModal
        open={confirmDelete !== null}
        title="Delete macro?"
        confirmLabel="Delete"
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
        The macro will be deleted from this PC.
      </ConfirmModal>
    </div>
  );
}
