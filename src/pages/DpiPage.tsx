/**
 * DPI v2.5 — y như ảnh bro gửi (6 nấc màu + slider Slow↔Fast), nút đổi
 * sang shy-moth-10 (pill cam + mũi tên chevron), thêm preset theo tác vụ:
 * - 6 nấc: radio trên + pill giá trị (800 đỏ, 1600 xanh lá, 2400 xanh
 *   dương, 3200 tím, 6400 vàng, 12000 xanh ngọc — màu giữ trên nấc chưa
 *   chọn; nấc đang dùng = pill cam + chữ trắng). Nấc đang dùng có chữ
 *   "Current DPI" xanh.
 * - Slider 200–12000: kéo thì màu fill đổi dần (xanh → đỏ theo DPI) và
 *   nấc "Current DPI" nhảy sang nấc gần nhất. Thả ra mới ghi (không spam
 *   50 lần ghi khi kéo); bấm nấc thì ăn ngay. KHÔNG còn nút Lưu / Hoàn
 *   tác — theo yêu cầu của bro ("bấm nút nào ăn ngay nút đấy").
 * - Preset theo tác vụ (v2.5): Văn phòng 1600 / Chơi game 3200 / Thiết
 *   kế 800 — bấm là ăn ngay (applyStage). Không còn subtitle (bro bảo xóa).
 * - "Restore default settings" góc phải trên → DEFAULT_DPI + nấc 2.
 * - Ít chữ, vừa khung không lướt.
 */
import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { clampDpi, DEFAULT_DPI } from '../lib/hid';
import { useMouse } from '../store';
import { EmptyState, PageHead, ShyArrow } from '../components/ui';

const STAGE_COLORS = ['#f87171', '#4ade80', '#60a5fa', '#c084fc', '#facc15', '#22d3ee'];
const TICKS = [200, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000];

/** Preset theo tác vụ (v2.5, lấp khoảng trống dưới slider — bro bảo phần
    thừa bên dưới phải là preset văn phòng/chơi game, thật chuẩn từng tác
    vụ): mỗi preset = 1 nấc có sẵn, bấm là ăn ngay (applyStage). Giá trị
    chọn theo chuẩn thường dùng: văn phòng 1600 (nấc mặc định của chuột),
    chơi game 3200 (mức game phổ biến), thiết kế 800 (thấp nhất, điều
    khiển từng pixel). */
const TASK_PRESETS: { label: string; dpi: number; stage: number }[] = [
  { label: 'Văn phòng', dpi: 1600, stage: 1 },
  { label: 'Chơi game', dpi: 3200, stage: 3 },
  { label: 'Thiết kế', dpi: 800, stage: 0 },
];

/** Màu fill của slider đổi dần theo DPI: xanh dương (thấp) → đỏ (cao). */
function dpiHue(v: number): string {
  const t = Math.min(1, Math.max(0, (v - 200) / (12000 - 200)));
  return `hsl(${Math.round(220 - t * 220)} 90% 60%)`;
}

function nearestStage(dpi: number[], v: number): number {
  let best = 0;
  let bestDiff = Infinity;
  dpi.forEach((d, i) => {
    const diff = Math.abs(d - v);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  });
  return best;
}

export default function DpiPage(): React.JSX.Element {
  const { config, busy, saveConfig } = useMouse();
  const [draft, setDraft] = useState<number[]>(DEFAULT_DPI);
  const [draftIndex, setDraftIndex] = useState(1);
  // Giá trị slider đang kéo (live) — khác draft[draftIndex] trong lúc kéo.
  const [sliderVal, setSliderVal] = useState(1600);
  const sliderValRef = useRef(1600);
  const [dragging, setDragging] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (config) {
      setDraft([...config.dpi]);
      setDraftIndex(config.dpiIndex);
      setSliderVal(config.dpi[config.dpiIndex]);
      sliderValRef.current = config.dpi[config.dpiIndex];
    }
  }, [config]);

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  if (!config) {
    return (
      <div>
        <PageHead title="DPI" />
        <EmptyState text="Chưa kết nối — chọn Demo (mô phỏng) hoặc Kết nối chuột thật ở thanh trên cùng." />
      </div>
    );
  }

  // Nấc "Current DPI" hiển thị: lúc kéo thì nhảy theo nấc gần nhất,
  // lúc không kéo thì là nấc đang dùng thật.
  const shownIndex = dragging ? nearestStage(draft, sliderVal) : draftIndex;
  // Giá trị hiển thị trên từng thẻ: nấc đang kéo thì hiện sliderVal live.
  const shownDpi = (i: number): number => (dragging && i === shownIndex ? sliderVal : draft[i]);

  const applyStage = (i: number): void => {
    if (busy || i === draftIndex) return;
    const prevIndex = draftIndex;
    const prevVal = draft[draftIndex];
    setDraftIndex(i);
    setSliderVal(draft[i]);
    sliderValRef.current = draft[i];
    void saveConfig({ ...config, dpi: draft, dpiIndex: i }).then((ok) => {
      if (!ok) {
        setDraftIndex(prevIndex);
        setSliderVal(prevVal);
      }
    });
  };

  const commitSlider = (v: number): void => {
    const idx = nearestStage(draft, v);
    const next = [...draft];
    next[idx] = clampDpi(v);
    setDraft(next);
    setDraftIndex(idx);
    setSliderVal(next[idx]);
    sliderValRef.current = next[idx];
    void saveConfig({ ...config, dpi: next, dpiIndex: idx }).then((ok) => {
      if (!ok) {
        setDraft([...config.dpi]);
        setDraftIndex(config.dpiIndex);
        setSliderVal(config.dpi[config.dpiIndex]);
        sliderValRef.current = config.dpi[config.dpiIndex];
      }
    });
  };

  const onSliderChange = (v: number): void => {
    const clamped = clampDpi(v);
    setSliderVal(clamped);
    sliderValRef.current = clamped;
    setDragging(true);
    // Ghi sau khi thả 250ms (debounce) — kéo 1 lần chỉ ghi 1 lần.
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setDragging(false);
      commitSlider(v);
    }, 250);
  };

  const restoreDefaults = (): void => {
    if (busy) return;
    setDraft([...DEFAULT_DPI]);
    setDraftIndex(1);
    setSliderVal(1600);
    sliderValRef.current = 1600;
    void saveConfig({ ...config, dpi: [...DEFAULT_DPI], dpiIndex: 1 });
  };

  const pct = ((sliderVal - 200) / (12000 - 200)) * 100;
  const fillColor = dpiHue(sliderVal);

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-2">
        <PageHead title="DPI" />
        <button
          onClick={restoreDefaults}
          disabled={busy}
          className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 text-[13px] font-semibold text-[#edebe6] transition hover:border-[#ff5a1f]/50 hover:text-white active:scale-[0.97] disabled:opacity-40"
        >
          <RotateCcw className="h-4 w-4" /> Restore default settings
        </button>
      </div>

      {/* 6 nấc: radio trên + pill shy-moth-10 (v2.5, thay thẻ vuông v2.4).
          Nấc chưa chọn giữ màu riêng của nó (800 đỏ, 1600 xanh lá…);
          nấc đang chọn = pill cam + chữ trắng + mũi tên. */}
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        {draft.map((d, i) => {
          const active = i === shownIndex;
          const val = shownDpi(i);
          return (
            <div key={i} className="flex flex-col items-center">
              <button
                onClick={() => applyStage(i)}
                disabled={busy}
                aria-label={`Chọn nấc ${i + 1} (${d} DPI)`}
                aria-pressed={active}
                className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90 ${
                  active ? 'border-[#ff5a1f] bg-[#ff5a1f]' : 'border-[#ff5a1f]/60 bg-transparent hover:border-[#ff5a1f]'
                }`}
              >
                {active && <span className="h-[8px] w-[8px] rounded-full bg-white" aria-hidden="true" />}
              </button>
              {/* Nhãn "Current DPI" (xanh, như ảnh bro gửi) — hàng riêng để
                  các thẻ luôn thẳng hàng, không bị nhãn dài đẩy lệch. */}
              <span className="mt-1 flex h-4 items-center text-[10px] font-bold whitespace-nowrap text-[#60a5fa]">
                {active ? 'Current DPI' : ''}
              </span>
              <button
                onClick={() => applyStage(i)}
                disabled={busy}
                aria-label={`Nấc ${i + 1}: ${val.toLocaleString('vi-VN')} DPI`}
                aria-pressed={active}
                className={`uiv-shy-btn uiv-shy-compact mt-1.5 w-full ${active ? 'uiv-shy-selected' : ''}`}
                style={active ? undefined : { color: STAGE_COLORS[i] }}
              >
                {val.toLocaleString('vi-VN')}
                <ShyArrow small />
              </button>
            </div>
          );
        })}
      </div>

      {/* Slider Slow↔Fast (y như ảnh bro gửi): fill đổi màu dần theo DPI,
          nấc Current DPI nhảy theo khi kéo. */}
      <div className="mt-6">
        <div className="flex items-center gap-3">
          <span className="w-10 shrink-0 text-right text-[13px] font-medium text-[#c9c9d6]">Slow</span>
          <input
            type="range"
            className="uiv-dpi-slider"
            value={sliderVal}
            min={200}
            max={12000}
            step={50}
            disabled={busy}
            aria-label="DPI (kéo để đổi, thả ra là ghi)"
            style={{
              background: `linear-gradient(90deg, ${fillColor} ${pct}%, rgba(255,255,255,0.14) ${pct}%)`,
            }}
            onChange={(e) => onSliderChange(Number(e.target.value))}
            onPointerUp={() => {
              if (saveTimer.current) clearTimeout(saveTimer.current);
              setDragging(false);
              commitSlider(sliderValRef.current);
            }}
          />
          <span className="w-10 shrink-0 text-[13px] font-medium text-[#c9c9d6]">Fast</span>
        </div>
        <div className="mt-1 flex justify-between px-[52px] font-mono text-[10px] text-[#a2a2b0]">
          {TICKS.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <p className="mt-2 text-center text-[13px] text-[#a2a2b0]">
          Đang đặt: <b style={{ color: fillColor }}>{sliderVal.toLocaleString('vi-VN')} DPI</b>
          {dragging ? ' — thả ra để ghi' : ` — nấc ${shownIndex + 1}`}
        </p>
      </div>

      {/* Preset theo tác vụ (v2.5): bấm là ăn ngay, không lướt. */}
      <div className="mt-6 border-t border-white/10 pt-4">
        <div className="mb-2 text-[13px] font-semibold text-[#edebe6]">Preset theo tác vụ</div>
        <div className="flex flex-wrap gap-2">
          {TASK_PRESETS.map((p) => {
            const active = draftIndex === p.stage && draft[p.stage] === p.dpi;
            return (
              <button
                key={p.label}
                onClick={() => applyStage(p.stage)}
                disabled={busy}
                aria-label={`Preset ${p.label}: ${p.dpi.toLocaleString('vi-VN')} DPI`}
                aria-pressed={active}
                className={`uiv-shy-btn ${active ? 'uiv-shy-selected' : ''}`}
              >
                {p.label} · {p.dpi.toLocaleString('vi-VN')}
                <ShyArrow />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
