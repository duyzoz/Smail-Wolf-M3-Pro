/**
 * TopBar v2.5 — theo yêu cầu của bro: CHỈ còn logo + cụm kết nối.
 * - FW + Pin ĐÃ XÓA khỏi topbar (đã có trong 4 dock bên dưới).
 * - Icon chế độ kết nối: Wifi = 2.4G, Cable (ethernet) = dây, Bluetooth =
 *   Bluetooth. (App chỉ tới được chuột qua dây/2.4G bằng WebHID vendor
 *   filter — nhánh Bluetooth để sẵn cho đường BT sau này.)
 * - Nút "Ngắt" hỏi xác nhận: "Bạn có muốn ngắt kết nối với thiết bị
 *   này?" — Đồng ý / Hủy (không ngắt ngay nữa).
 * - v2.5: nút kết nối Demo/Live ĐÃ XÓA khỏi topbar — màn chọn thiết bị
 *   (DevicePicker) lo việc kết nối rồi; vào tới topbar là đã kết nối.
 *   Mọi nhánh "chưa kết nối" trong topbar đều đã dọn.
 * Nav đã xóa từ v2.2, dồn vào menu 4 mục trong panel trái (LeftPanel).
 * Dưới là dải annotation mono kiểu bản vẽ kỹ thuật (chỉ màn ≥1536px).
 */
import { useState } from 'react';
import { Bluetooth, Cable, Power, RefreshCw, Wifi } from 'lucide-react';
import { useMouse } from '../store';
import { ConfirmModal } from './ui';
import { ThemeToggle } from './ThemeToggle';
import { brandLogoSrc } from '../lib/brand';

export function TopBar(): React.JSX.Element {
  const { mode, connected, busy, wired, deviceLabel, disconnect, refresh, theme } = useMouse();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  // Chế độ kết nối hiện tại: dây → Cable, 2.4G → Wifi, Bluetooth → Bluetooth.
  // (FW + Pin không hiện ở topbar nữa — đã có trong 4 dock bên dưới.)
  return (
    <header className="shrink-0 pt-2">
      <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
        <div className="flex min-w-0 items-center gap-2.5">
          {/* Logo brand 800px — map theo theme (dark → LIGHT file, light → DARK file). */}
          <img src={brandLogoSrc(theme)} alt="SMAILWOLF" className="h-7 w-auto shrink-0" />
          <div className="min-w-0">
            <div className="font-display text-[18px] leading-none font-bold tracking-wide text-[#c2410c] uppercase">
              M3 Pro
            </div>
            <div className="font-mono2 mt-0.5 text-[10px] tracking-[0.18em] text-[#55555c] uppercase">
              Driver remake · v3.0.0 · clean-room
            </div>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* v3.0: toggle sáng/tối Uiverse (mamyapro123) — góc trên khung
              quản lý, ngay cạnh cụm chế độ kết nối. */}
          <ThemeToggle />
          {/* Icon chế độ kết nối (thay 2 pill FW/Pin đã xóa ở v2.4): 3 icon
              Wifi = 2.4G, Cable (ethernet) = dây, Bluetooth = Bluetooth —
              icon nào đang dùng thì sáng cam, còn lại mờ. (App chỉ tới được
              chuột qua dây/2.4G bằng WebHID vendor filter — Bluetooth để
              sẵn cho đường BT sau này.) */}
          {connected && (
            <span
              className="flex items-center gap-2 rounded-full border border-[rgba(22,22,26,0.16)] bg-white/50 px-3 py-2"
              title={wired ? 'Chế độ có dây' : 'Chế độ 2.4GHz'}
            >
              <Wifi className={`h-4 w-4 ${!wired ? 'text-[#c2410c]' : 'text-[#55555c]/40'}`} />
              <Cable className={`h-4 w-4 ${wired ? 'text-[#c2410c]' : 'text-[#55555c]/40'}`} />
              <Bluetooth className="h-4 w-4 text-[#55555c]/40" />
              <span className="text-[11px] font-bold tracking-wide text-[#33333a]">{wired ? 'DÂY' : '2.4G'}</span>
            </span>
          )}
          <span
            className={`rounded-full border px-3 py-2 text-[11px] font-bold tracking-wide ${
              mode === 'demo'
                ? 'border-amber-600/40 bg-amber-100 text-amber-800'
                : 'border-[#c2410c]/40 bg-[#ff5a1f]/10 text-[#c2410c]'
            }`}
          >
            {mode === 'demo' ? 'DEMO · MÔ PHỎNG' : 'LIVE'}
          </span>
          <button
            onClick={() => setConfirmDisconnect(true)}
            aria-label="Ngắt kết nối"
            className="flex h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full border border-[rgba(22,22,26,0.16)] bg-white/50 px-3 text-[13px] font-semibold text-[#16161a] transition hover:bg-white/80"
          >
            <Power className="h-4 w-4" /> Ngắt
          </button>
          <button
            onClick={() => void refresh()}
            disabled={!connected || busy}
            aria-label="Đọc lại từ chuột"
            className="flex h-[44px] w-[44px] items-center justify-center rounded-full border border-[rgba(22,22,26,0.16)] bg-white/50 text-[#16161a] transition hover:bg-white/80 disabled:opacity-40"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Dải annotation chỉ hiện ở màn rất rộng (≥1536px) — ở 1366x768 nó
          chiếm 28px chiều cao vô ích, làm cả trang tràn viewport. */}
      <div className="font-mono2 mt-2 hidden items-center justify-between gap-2 border-y border-[rgba(22,22,26,0.14)] py-1 text-[10px] tracking-[0.14em] text-[#55555c] uppercase min-[1536px]:flex">
        <span className="flex items-center gap-1.5">
          <span className={`inline-block h-2 w-2 rounded-full ${connected ? 'bg-[#15803d]' : 'bg-[#dc2626]'}`} />
          SYS.READY STATUS: {connected ? 'ONLINE' : 'OFFLINE'}
        </span>
        <span className="hidden md:inline">UNIT_04 // CORE_SCAN_OK · BOOT_SEQ: 0x001 · FAB: PAW3311</span>
        <span className="truncate" title={deviceLabel}>
          {deviceLabel}
          {mode === 'live' && (
            <span className="ml-2 inline-flex items-center gap-1">
              {wired ? <Cable className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
              {wired ? 'WIRED' : '2.4G'}
            </span>
          )}
        </span>
      </div>

      {/* Hỏi xác nhận trước khi ngắt (v2.4, theo yêu cầu bro). */}
      <ConfirmModal
        open={confirmDisconnect}
        title="Ngắt kết nối?"
        confirmLabel="Đồng ý"
        danger
        onConfirm={() => {
          setConfirmDisconnect(false);
          void disconnect();
        }}
        onCancel={() => setConfirmDisconnect(false)}
      >
        Bạn có muốn ngắt kết nối với thiết bị này?
      </ConfirmModal>
    </header>
  );
}
