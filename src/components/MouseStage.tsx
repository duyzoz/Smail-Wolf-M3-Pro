/**
 * MouseStage v2.3 — cột phải: ẢNH THẬT chuột M3 Pro (như bro yêu cầu —
 * bỏ mô hình 3D dựng lại) + nhãn binding live + popup gán phím bay vào
 * khung panel trái + nút "Reset to default".
 * ĐÃ XÓA theo yêu cầu của bro: 2 dòng header stage ("[MOUSE // M3 PRO]..."
 * + dòng hint "Bấm 1 nút trên chuột...") và caption "Mô hình 3D dựng từ
 * số đo... không phải ảnh chụp" — giờ là ảnh thật nên caption đó sai.
 */
import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useMouse } from '../store';
import { keyName, KEY_LABELS, type KeyBinding } from '../lib/hid';
import { AssignPopup } from './AssignPopup';
import { ConfirmModal } from './ui';
import { MousePhoto } from './MousePhoto';
import { skinSrc } from '../lib/skins';

export function MouseStage(): React.JSX.Element {
  const { keys, connected, mode, saveKeys, restoreFactory, busy, addLog, skinId } = useMouse();
  const stageRef = useRef<HTMLDivElement>(null);
  const [popup, setPopup] = useState<{
    keyIndex: number;
    anchor: { x: number; y: number };
    flyTarget: { x: number; y: number };
  } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [stageSize, setStageSize] = useState({ width: 640, height: 560 });

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setStageSize({ width: el.clientWidth, height: el.clientHeight });
    });
    ro.observe(el);
    setStageSize({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!note) return;
    const id = setTimeout(() => setNote(null), 4500);
    return () => clearTimeout(id);
  }, [note]);

  const onPartClick = (keyIndex: number, point: { x: number; y: number }): void => {
    if (!connected || !keys) {
      setNote('Chưa kết nối — chọn Demo (mô phỏng) hoặc Kết nối chuột thật ở thanh trên cùng trước.');
      return;
    }
    if (keyIndex === 5) {
      const msg = 'Nút DPI cố định — không gán lại được (app gốc cũng vậy).';
      setNote(msg);
      addLog(msg);
      return;
    }
    const stageRect = stageRef.current?.getBoundingClientRect();
    const panelRect = document.getElementById('left-panel')?.getBoundingClientRect();
    const flyTarget =
      stageRect && panelRect
        ? { x: panelRect.left - stageRect.left + 60, y: panelRect.top - stageRect.top + 220 }
        : { x: 40, y: 200 };
    // point là client coords -> đổi sang tọa độ trong stage div.
    const anchor = stageRect ? { x: point.x - stageRect.left, y: point.y - stageRect.top } : point;
    setPopup({ keyIndex, anchor, flyTarget });
  };

  const onAssign = async (binding: KeyBinding): Promise<void> => {
    if (!popup || !keys) return;
    const next: KeyBinding[] = keys.map((k) => ({ type: k.type, code1: k.code1, code2: k.code2, code3: k.code3 }));
    next[popup.keyIndex] = { ...binding };
    const label = KEY_LABELS[popup.keyIndex];
    const name = keyName(binding.type, binding.code1, binding.code2, binding.code3);
    setPopup(null);
    const ok = await saveKeys(next);
    if (ok) addLog(`Đã gán ${label} → ${name}${mode === 'demo' ? ' (mô phỏng)' : ''}.`);
  };

  return (
    <section className="relative flex min-w-0 flex-col lg:min-h-0 lg:flex-1" aria-label="Ảnh chuột SMAILWOLF M3 Pro">
      {note && (
        <div
          className="mb-2 shrink-0 rounded-xl border border-amber-600/40 bg-amber-100 px-3 py-2 text-[13px] text-amber-900"
          role="status"
        >
          {note}
        </div>
      )}

      {/* Stage co giãn theo chiều cao còn lại của viewport (desktop),
          mobile giữ chiều cao cố định để cuộn trang bình thường — ảnh
          position absolute nên khung phải có chiều cao cố định ở mobile. */}
      <div ref={stageRef} className="relative h-[420px] min-h-0 sm:h-[480px] lg:h-auto lg:flex-1">
        <MousePhoto keys={keys} onPartClick={onPartClick} src={skinSrc(skinId)} />
        {popup && (
          <AssignPopup
            keyIndex={popup.keyIndex}
            anchor={popup.anchor}
            stageSize={stageSize}
            flyTarget={popup.flyTarget}
            onClose={() => setPopup(null)}
            onAssign={(b) => void onAssign(b)}
          />
        )}
      </div>

      <div className="mt-2 flex shrink-0 flex-row flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <button
          onClick={() => setConfirmReset(true)}
          disabled={!connected || busy}
          className="flex min-h-[44px] items-center gap-2 rounded-full border border-[rgba(22,22,26,0.2)] bg-white/85 px-5 text-sm font-semibold text-[#16161a] transition hover:bg-white disabled:opacity-40"
        >
          <RotateCcw className="h-4 w-4" /> Reset to default
        </button>
      </div>

      <ConfirmModal
        open={confirmReset}
        title="Khôi phục mặc định gốc?"
        confirmLabel="Khôi phục"
        danger
        onConfirm={() => {
          setConfirmReset(false);
          void restoreFactory();
        }}
        onCancel={() => setConfirmReset(false)}
      >
        Ghi lại cấu hình mặc định của app gốc + phím mặc định xuống chuột.
      </ConfirmModal>
    </section>
  );
}
