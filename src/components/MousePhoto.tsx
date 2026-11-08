/**
 * MousePhoto — ẢNH CHUỘT kiểu anime bro gửi (v2.6, thay ảnh thật v2.3).
 * Ảnh anime 944x1667, nền trong suốt — vẽ tay trắng bóng, con lăn + nút
 * DPI + 2 nút hông đen đặc, rõ hơn ảnh chụp cũ.
 *
 * Vị trí các nút = số đo thật từ ảnh (PIL/numpy, erosion 3px để giết
 * viền nét mảnh, chỉ giữ vùng đen đặc — không đoán):
 * - con lăn (đen đặc): tâm (0.50, 0.227) — vùng x 0.434-0.566, y 0.134-0.319
 * - nút DPI (capsule đen): tâm (0.50, 0.398) — vùng x 0.237-0.778, y 0.326-0.470
 * - nút hông trên (Copy mặc định): tâm (0.090, 0.410) — x 0.072-0.108, y 0.342-0.478
 * - nút hông dưới (Paste mặc định): tâm (0.102, 0.546) — x 0.083-0.121, y 0.480-0.613
 * - tấm trái / phải: tâm (0.27, 0.22) / (0.73, 0.22) (thân trên chia đôi ở x=0.50)
 * Nhãn giữ kiểu ảnh 2: tag viền mảnh + kẻ nối chéo (dy so le) + chấm trên nút.
 *
 * v2.6 hover: rê chuột vào 1 nút (vùng bấm hoặc tag) → phần tử đó SÁNG
 * lên (lớp glow cam phủ đúng hình nút) + nảy nhẹ như bấm thật
 * (.part-glow + keyframes partPress) + tag/kẻ nối/chấm chuyển cyberpunk
 * (nền navy, chữ cam, viền + hào quang neon). Áp cho cả 6 nút.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { keyName, SYSTEM_KEY_ACTIONS, type KeyBinding } from '../lib/hid';

export function shortBindingName(b: KeyBinding): string {
  for (const g of SYSTEM_KEY_ACTIONS) {
    const hit = g.actions.find(
      (a) => a.binding.type === b.type && a.binding.code1 === b.code1 && a.binding.code2 === b.code2 && a.binding.code3 === b.code3,
    );
    if (hit) return hit.label;
  }
  return keyName(b.type, b.code1, b.code2, b.code3)
    .replace(/^Mouse: /, '')
    .replace(/^Keyboard: /, '')
    .replace(/^Media: /, '');
}

interface LabelDef {
  keyIndex: number;
  title: string;
  side: 'left' | 'right';
  /** Vị trí neo = tỉ lệ (0..1) trên khung ảnh (đo thật từ ảnh, xem header). */
  fx: number;
  fy: number;
  valueOnly?: boolean;
  line?: number;
  /** Tag lệch dọc khỏi chấm (px, + = xuống) — 3 nhãn bên phải có chấm
      cách nhau chỉ ~20px nên phải so le tag lên/xuống, kẻ nối thành
      đường chéo nhẹ như ảnh 2. */
  dy?: number;
}

interface LabelPos {
  keyIndex: number;
  title: string;
  side: 'left' | 'right';
  x: number;
  y: number;
  line: number;
  dy: number;
}

export function MousePhoto({
  keys,
  onPartClick,
  src = '/mouse-m3pro.webp',
}: {
  keys: KeyBinding[] | null;
  onPartClick: (keyIndex: number, point: { x: number; y: number }) => void;
  /** Ảnh chuột đang hiển thị — skin đang chọn (v2.7). Mọi skin đều cùng
      canvas 944x1667 nên neo bấm đo sẵn dùng chung. */
  src?: string;
}): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [labels, setLabels] = useState<LabelPos[]>([]);
  // v2.6 hover: nút nào đang được rê vào (vùng bấm hoặc tag) → glow sáng
  // đúng hình phần tử đó + nảy nhẹ như bấm thật.
  const [hovered, setHovered] = useState<number | null>(null);
  const [imgBox, setImgBox] = useState({ x: 0, y: 0, w: 0, h: 0 });
  // v2.7: kích thước ảnh FIT trong khung (tính từ tỉ lệ thật của ảnh).
  // BUG v2.6: img chỉ có h-[96%] w-auto — ở viewport DỌC (cao, hẹp) ảnh
  // cao 96% khung thì bề ngang vượt khung → 2 bên bị cắt, nhìn như kéo
  // giãn dọc rất xấu (đúng ảnh bro chụp ở 1080x1920). Fit cả 2 chiều
  // thì không bao giờ tràn/cắt, giữ đúng aspect ở mọi tỉ lệ.
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  // Ảnh load xong (naturalWidth có số thật) thì đo lại — skin khác có
  // thể khác canvas, layout phải theo ảnh thật chứ không theo fallback.
  const [imgLoaded, setImgLoaded] = useState(0);

  const labelDefs: LabelDef[] = useMemo(() => {
    const val = (i: number): string => (keys && keys[i] ? shortBindingName(keys[i]) : '—');
    const leftVal = val(0);
    const rightVal = val(1);
    const base: LabelDef[] = [
      { keyIndex: 0, title: 'Left button', side: 'left', fx: 0.27, fy: 0.22, line: 100, dy: -12 },
      { keyIndex: 1, title: 'Right button', side: 'right', fx: 0.73, fy: 0.22, line: 120 },
      { keyIndex: 2, title: 'Middle button', side: 'right', fx: 0.5, fy: 0.227, line: 150, dy: -48 },
      { keyIndex: 5, title: 'DPI', side: 'right', fx: 0.5, fy: 0.398, line: 150, dy: 56 },
      { keyIndex: 4, title: val(4), side: 'left', fx: 0.09, fy: 0.41, valueOnly: true, line: 100 },
      { keyIndex: 3, title: val(3), side: 'left', fx: 0.102, fy: 0.546, valueOnly: true, line: 100, dy: 24 },
    ];
    return base.map((d) => ({
      ...d,
      title:
        d.keyIndex === 0 && leftVal !== 'Left button' && leftVal !== 'Left click'
          ? `Left · ${leftVal}`
          : d.keyIndex === 1 && rightVal !== 'Right button' && rightVal !== 'Right click'
            ? `Right · ${rightVal}`
            : d.title,
    }));
  }, [keys]);

  // Ảnh căn giữa, fit 96% khung theo CẢ 2 chiều (giữ aspect): vị trí
  // ảnh suy ra từ kích thước khung + tỉ lệ thật của ảnh (naturalWidth/
  // naturalHeight; fallback 944x1667 là canvas chuẩn của mọi skin).
  useEffect(() => {
    const layout = (): void => {
      const container = containerRef.current;
      const img = imgRef.current;
      if (!container || !img) return;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      if (cw === 0 || ch === 0) return;
      const iw0 = img.naturalWidth || 944;
      const ih0 = img.naturalHeight || 1667;
      const fit = Math.min((cw * 0.96) / iw0, (ch * 0.96) / ih0);
      const iw = Math.max(1, iw0 * fit);
      const ih = Math.max(1, ih0 * fit);
      const ix = (cw - iw) / 2;
      const iy = (ch - ih) / 2;
      const pos: LabelPos[] = labelDefs.map((d) => {
        const x = ix + d.fx * iw;
        const y = iy + d.fy * ih;
        // Cắt ngắn leader để tag không tràn khỏi khung (mobile 390px ở v2.0
        // tràn ngang 132px — vi phạm pro-max §5, không horizontal scroll).
        // v2.7: ước lượng bề rộng tag phải DƯ (chữ in hoa + letter-spacing
        // khiến tag thật rộng hơn ~10px so với ước lượng cũ 7.2/18) — ở
        // dọc 1080x1920 tag Right tràn 6px, Left/Copy/Paste tràn 5-9px
        // khỏi mép stage và bị overflow-hidden cắt (đo thật bằng Playwright).
        const tagW = d.title.length * 8.2 + 26;
        const want = d.line ?? 40;
        // Sàn leader 4px (không phải 14): neo Copy/Paste ở mép trái ảnh
        // (x≈66-73px) — với sàn 14 tag vẫn tràn 8-9px khỏi mép stage ở
        // dọc 1080x1920; sàn 4 cho tag lùi sát chấm, vẫn đủ đọc.
        const line =
          d.side === 'left'
            ? Math.min(want, Math.max(4, x - tagW - 12))
            : Math.min(want, Math.max(4, cw - x - tagW - 12));
        return { keyIndex: d.keyIndex, title: d.title, side: d.side, x, y, line, dy: d.dy ?? 0 };
      });
      // v3.0: tag cùng 1 phía phải cách nhau — v2.8.1 chỉ cho khe hở
      // ~13px (TAG_MIN_CTR = 38) mà bro vẫn chê quá gần. Giờ tách tối
      // thiểu TAG_MIN_CTR = 65px tâm-tâm (khe hở nhìn thấy ~40px, gấp
      // ~3 lần trước): Middle dy -48 (bay lên trên Right), DPI dy +56
      // (đẩy xuống dưới), thuật toán vẫn chỉ đẩy tag DƯỚI xuống và kẹp
      // cả nhóm trong khung nếu tràn dưới. Chỉ đẩy tag dưới xuống
      // (không đụng tag trên), kẻ nối chỉ nghiêng thêm vài độ.
      const TAG_H = 25; // .tag: font 11px + padding 4px + border 1px
      const TAG_MIN_CTR = TAG_H + 40;
      for (const side of ['left', 'right'] as const) {
        const group = pos.filter((p) => p.side === side).sort((a, b) => a.y + a.dy - (b.y + b.dy));
        for (let i = 1; i < group.length; i++) {
          const prev = group[i - 1];
          const cur = group[i];
          const minCtr = prev.y + prev.dy + TAG_MIN_CTR;
          if (cur.y + cur.dy < minCtr) cur.dy = minCtr - cur.y;
        }
        const last = group[group.length - 1];
        if (last) {
          const overflow = last.y + last.dy + TAG_H / 2 - ch;
          if (overflow > 0) for (const p of group) p.dy -= overflow;
        }
      }
      setLabels(pos);
      setImgBox({ x: ix, y: iy, w: iw, h: ih });
      setImgSize((prev) => (prev.w === Math.round(iw) && prev.h === Math.round(ih) ? prev : { w: Math.round(iw), h: Math.round(ih) }));
      // Hook cho headless test: bấm đúng tọa độ từng nút (tọa độ trong khung).
      (window as unknown as { __mousePhoto?: unknown }).__mousePhoto = {
        ready: true,
        anchors: Object.fromEntries(pos.map((p) => [p.keyIndex, { x: Math.round(p.x), y: Math.round(p.y) }])),
      };
    };
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(layout);
    ro.observe(container);
    layout();
    return () => ro.disconnect();
  }, [labelDefs, imgLoaded]);

  // Hình glow phủ đúng từng phần tử (tỉ lệ trên ảnh, xem header): tấm
  // trái/phải = ellipse lớn phủ nửa thân trên; con lăn/DPI = capsule;
  // nút hông = chữ nhật bo góc ở mép trái.
  const PART_GLOW: Record<number, { fx: number; fy: number; w: number; h: number; r: string }> = {
    0: { fx: 0.27, fy: 0.22, w: 0.46, h: 0.34, r: '45%' },
    1: { fx: 0.73, fy: 0.22, w: 0.46, h: 0.34, r: '45%' },
    2: { fx: 0.5, fy: 0.227, w: 0.15, h: 0.21, r: '999px' },
    5: { fx: 0.5, fy: 0.398, w: 0.14, h: 0.1, r: '999px' },
    4: { fx: 0.09, fy: 0.41, w: 0.07, h: 0.09, r: '8px' },
    3: { fx: 0.102, fy: 0.546, w: 0.07, h: 0.15, r: '8px' },
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      role="img"
      aria-label="Ảnh chuột SMAILWOLF M3 Pro — bấm 1 nút trên chuột để gán phím"
    >
      <img
        ref={imgRef}
        src={src}
        alt=""
        draggable={false}
        onLoad={() => setImgLoaded((n) => n + 1)}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
        style={imgSize.w > 0 ? { width: imgSize.w, height: imgSize.h } : { height: '96%', width: 'auto' }}
      />
      {/* Lớp glow cam phủ đúng hình phần tử đang được rê vào (v2.6). */}
      {Object.entries(PART_GLOW).map(([k, g]) => {
        const i = Number(k);
        return (
          <div
            key={`glow-${i}`}
            aria-hidden="true"
            className={`part-glow${hovered === i ? ' on' : ''}`}
            style={{
              left: imgBox.x + (g.fx - g.w / 2) * imgBox.w,
              top: imgBox.y + (g.fy - g.h / 2) * imgBox.h,
              width: g.w * imgBox.w,
              height: g.h * imgBox.h,
              borderRadius: g.r,
            }}
          />
        );
      })}
      {/* Vùng bấm vô hình trên từng nút (44x44, tâm = neo đo thật từ ảnh) —
          bấm đúng vào nút trên ảnh thì mở popup gán phím. */}
      {labels.map((l) => (
        <button
          key={`zone-${l.keyIndex}`}
          type="button"
          className="absolute h-11 w-11 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-[#c2410c]"
          style={{ left: l.x - 22, top: l.y - 22 }}
          onClick={(e) => onPartClick(l.keyIndex, { x: e.clientX, y: e.clientY })}
          onMouseEnter={() => setHovered(l.keyIndex)}
          onMouseLeave={() => setHovered((h) => (h === l.keyIndex ? null : h))}
          onFocus={() => setHovered(l.keyIndex)}
          onBlur={() => setHovered((h) => (h === l.keyIndex ? null : h))}
          aria-label={`Gán phím cho nút ${l.title}`}
        />
      ))}
      {labels.map((l) => (
        <button
          key={l.keyIndex}
          className={`mouse-label${hovered === l.keyIndex ? ' cyber-on' : ''}`}
          style={
            l.side === 'left'
              ? { right: `calc(100% - ${l.x}px)`, top: l.y, flexDirection: 'row' }
              : { left: l.x, top: l.y, flexDirection: 'row' }
          }
          onClick={(e) => {
            onPartClick(l.keyIndex, { x: e.clientX, y: e.clientY });
          }}
          onMouseEnter={() => setHovered(l.keyIndex)}
          onMouseLeave={() => setHovered((h) => (h === l.keyIndex ? null : h))}
          onFocus={() => setHovered(l.keyIndex)}
          onBlur={() => setHovered((h) => (h === l.keyIndex ? null : h))}
          aria-label={`Gán phím cho nút ${l.title}`}
        >
          {l.side === 'left' ? (
            <>
              <span className="tag" style={{ transform: `translateY(${l.dy}px)` }}>{l.title}</span>
              <span
                className="leader"
                style={{
                  width: l.line,
                  transform: `rotate(${-Math.atan2(l.dy, l.line)}rad)`,
                  transformOrigin: 'right center',
                }}
                aria-hidden="true"
              />
              <span className="dot" aria-hidden="true" />
            </>
          ) : (
            <>
              <span className="dot" aria-hidden="true" />
              <span
                className="leader"
                style={{
                  width: l.line,
                  transform: `rotate(${Math.atan2(l.dy, l.line)}rad)`,
                  transformOrigin: 'left center',
                }}
                aria-hidden="true"
              />
              <span className="tag" style={{ transform: `translateY(${l.dy}px)` }}>{l.title}</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}
