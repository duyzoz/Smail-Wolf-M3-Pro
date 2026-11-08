/**
 * Hiệu năng v2.4 — gọn, ít chữ, vừa khung không lướt (theo yêu cầu bro):
 * 4 hàng compact, không còn đoạn giải thích dài, không còn dòng "Byte 51
 * = ..." — bấm/toggle/kéo là ăn ngay (ghi qua setConfig đã chứng minh
 * live), KHÔNG còn nút Lưu / Hoàn tác. Ghi hỏng (đang bận) thì trả lại
 * giá trị cũ. Ngủ đông: kéo slider thì ghi sau khi thả 250ms (debounce).
 * Wake-up chỉ còn 1 dòng (hành vi cố định của chuột, không phải setting).
 */
import { useEffect, useRef, useState } from 'react';
import { Moon, MoveHorizontal, Zap } from 'lucide-react';
import { POLLING_24G, POLLING_WIRED, type MouseConfig } from '../lib/hid';
import { useMouse } from '../store';
import { EmptyState, GlassCard, PageHead, PowerSwitch, SegmentedControl, Slider, Toggle } from '../components/ui';

export default function PerformancePage(): React.JSX.Element {
  const { config, wired, busy, saveConfig } = useMouse();
  const [rateIdx, setRateIdx] = useState(0);
  const [sleep, setSleep] = useState(5);
  const [neverSleep, setNeverSleep] = useState(false);
  // v2.7: số phút KHÔI PHỤC khi tắt Never sleep. BUG v2.6: effect đồng bộ
  // dưới đây setSleep(config.sleepLight) — khi bật Never sleep, config
  // về 0 nên sleep bị ghi đè thành 0, mất số phút cũ; tắt Never sleep
  // thì ghi lại sleepLight = sleep = 0 → toggle nhảy bật lại, không tắt
  // được (đúng lỗi bro báo). lastSleep CHỈ cập nhật khi giá trị ≠ 0.
  const [lastSleep, setLastSleep] = useState(5);
  const [scroll, setScroll] = useState(0);
  const [lineCorrection, setLineCorrection] = useState(false);
  const sleepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (config) {
      setRateIdx(config.reportRateIndex);
      setSleep(config.sleepLight);
      setNeverSleep(config.sleepLight === 0);
      // v2.7: chỉ nhớ số phút khi nó ≠ 0 — không thì mất số khôi phục.
      if (config.sleepLight !== 0) setLastSleep(config.sleepLight);
      setScroll(config.scrollFlag);
      setLineCorrection((config.sensorFlag & 1) === 1);
    }
  }, [config]);

  useEffect(
    () => () => {
      if (sleepTimer.current) clearTimeout(sleepTimer.current);
    },
    [],
  );

  if (!config) {
    return (
      <div>
        <PageHead title="Hiệu năng" subtitle="Bấm là ăn ngay — không nút Lưu." compact />
        <EmptyState text="Chưa kết nối — chọn Demo (mô phỏng) hoặc Kết nối chuột thật ở thanh trên cùng." />
      </div>
    );
  }

  const list = wired ? POLLING_WIRED : POLLING_24G;

  /** Ghi 1 field ngay; hỏng thì trả lại giá trị cũ (tránh lệch UI ↔ chuột). */
  const apply = (patch: Partial<MouseConfig>, revert: () => void): void => {
    if (busy) {
      revert();
      return;
    }
    void saveConfig({ ...config, ...patch }).then((ok) => {
      if (!ok) revert();
    });
  };

  const setRate = (v: number): void => {
    const prev = rateIdx;
    setRateIdx(v);
    apply({ reportRateIndex: v }, () => setRateIdx(prev));
  };

  const setScrollDir = (v: number): void => {
    const prev = scroll;
    setScroll(v);
    apply({ scrollFlag: v }, () => setScroll(prev));
  };

  const setLine = (v: boolean): void => {
    const prev = lineCorrection;
    setLineCorrection(v);
    apply({ sensorFlag: v ? 1 : 0 }, () => setLineCorrection(prev));
  };

  const commitSleep = (never: boolean, mins: number): void => {
    apply({ sleepLight: never ? 0 : mins }, () => {
      setNeverSleep(config.sleepLight === 0);
      setSleep(config.sleepLight);
    });
  };

  const onSleepChange = (v: number): void => {
    const mins = Math.max(1, v);
    setSleep(mins);
    setLastSleep(mins);
    if (sleepTimer.current) clearTimeout(sleepTimer.current);
    sleepTimer.current = setTimeout(() => commitSleep(neverSleep, mins), 250);
  };

  const onNeverSleep = (v: boolean): void => {
    const prev = neverSleep;
    setNeverSleep(v);
    if (sleepTimer.current) clearTimeout(sleepTimer.current);
    // v2.7: tắt thì ghi lại lastSleep (số phút trước khi bật), KHÔNG
    // dùng sleep (đã bị 0 khi bật Never sleep).
    apply({ sleepLight: v ? 0 : lastSleep }, () => setNeverSleep(prev));
  };

  return (
    <div>
      <PageHead title="Hiệu năng" subtitle="Bấm là ăn ngay — không nút Lưu." compact />
      <div className="space-y-2">
        <GlassCard compact>
          <div className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-[#edebe6]">
            <Zap className="h-4 w-4 text-[#ff8a3d]" /> Polling rate
            <span className="ml-auto font-mono text-xs text-[#a2a2b0]">{wired ? 'Dây' : '2.4G'}</span>
          </div>
          <SegmentedControl
            name="polling-rate"
            value={rateIdx}
            onChange={setRate}
            columns={4}
            options={list.map((hz, i) => ({ value: i, label: `${hz} Hz`, tag: `P${i + 1}` }))}
          />
        </GlassCard>

        <GlassCard compact>
          <div className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-[#edebe6]">
            <Moon className="h-4 w-4 text-[#ff8a3d]" /> Ngủ đông
            <span className="ml-auto text-sm font-bold text-white">{neverSleep ? 'Không ngủ' : `${sleep} phút`}</span>
            <Toggle checked={neverSleep} label="Never sleep" onChange={onNeverSleep} compact />
          </div>
          <Slider
            value={neverSleep ? 0 : sleep}
            min={0}
            max={100}
            step={1}
            ariaLabel="Số phút trước khi ngủ đông"
            disabled={neverSleep}
            onChange={onSleepChange}
          />
        </GlassCard>

        <GlassCard compact>
          <div className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-[#edebe6]">
            <MoveHorizontal className="h-4 w-4 text-[#ff8a3d]" /> Hướng lăn
          </div>
          <SegmentedControl
            name="roller-direction"
            value={scroll}
            onChange={setScrollDir}
            options={[
              { value: 0, label: 'Bình thường', tag: '正向' },
              { value: 1, label: 'Đảo ngược', tag: '反向' },
            ]}
          />
        </GlassCard>

        <GlassCard compact>
          <PowerSwitch
            id="line-correction-power"
            checked={lineCorrection}
            label="Line correction"
            onChange={setLine}
          />
          <p className="mt-1 text-xs text-[#a2a2b0]">Đánh thức: bấm hoặc di chuột (cố định, không đổi được).</p>
        </GlassCard>
      </div>
    </div>
  );
}
