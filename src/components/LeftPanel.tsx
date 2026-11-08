/**
 * LeftPanel v2.4 — theo ảnh 3 + yêu cầu của bro: khung navy bo tròn,
 * header "● M3", rồi NGAY DƯỚI là THANH MENU 4 mục chính (Gán phím / DPI /
 * Hiệu năng / Khác — tiếng Việt, mỗi mục có icon của nó ĐẰNG SAU label).
 * Create / Import / Onboard configuration ĐÃ XÓA khỏi đầu panel (v2.3):
 * chúng chỉ là thao tác phụ (lưu/nhập profile, xem cấu hình đang chạy) —
 * chức năng đó đã có đủ trong mục Khác → Profile (OthersPage). Bên trong
 * là nội dung tab. Activity Log ĐÃ XÓA ở v2.4 (thông báo giờ là toast
 * ngắn ở đầu trang). FIX v2.1: các khối cố định shrink-0 (Onboard từng bị
 * bóp còn 38px). FIX v2.4: bỏ AnimatePresence mode="wait" (kẹt exit sau
 * modal macro) — tab dùng key + animation CSS thuần (tabIn).
 */
import { useState } from 'react';
import {
  Download,
  Gauge,
  Keyboard,
  MoreHorizontal,
  RotateCcw,
  Settings,
  Zap,
} from 'lucide-react';
import { useMouse, type TabId } from '../store';
import { ConfirmModal, PageHead } from './ui';
import Dashboard from '../pages/Dashboard';
import DpiPage from '../pages/DpiPage';
import KeysPage from '../pages/KeysPage';
import PerformancePage from '../pages/PerformancePage';
import MacroPage from '../pages/MacroPage';
import { FirmwareCard, BatteryCard, ProfileCard, RawReplyCard, RestoreCard } from '../pages/OthersPage';

export function LeftPanel(): React.JSX.Element {
  const { tab, setTab, config, keys, restoreFactory } = useMouse();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);

  const exportJson = (): void => {
    if (!config || !keys) return;
    const data = {
      name: 'Onboard configuration',
      savedAt: new Date().toLocaleString('vi-VN'),
      config,
      keys,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smailwolf-m3pro-onboard.json';
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  return (
    <section
      id="left-panel"
      className="dark-panel flex min-w-0 flex-col overflow-hidden rounded-[24px] border border-white/10 shadow-[0_20px_50px_rgba(22,22,26,0.35)] lg:h-full lg:min-h-0"
      aria-label="Bảng điều khiển M3"
    >
      {/* Header kiểu ảnh 3 */}
      <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 pt-4 pb-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="font-display text-[20px] leading-none font-semibold tracking-wide text-[#edebe6]">M3</div>
          <div className="font-mono2 mt-1 text-[10px] tracking-[0.18em] text-[#a2a2b0] uppercase">
            Onboard · M3 Pro
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Tùy chọn cấu hình"
            aria-expanded={menuOpen}
            className="flex h-[44px] w-[44px] items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#edebe6] transition hover:bg-white/10"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {menuOpen && (
            <>
              <button
                className="fixed inset-0 z-10 cursor-default"
                aria-label="Đóng menu"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-2 w-[240px] overflow-hidden rounded-xl border border-white/10 bg-[#262640] shadow-2xl">
                <button
                  className="flex min-h-[44px] w-full items-center gap-2 px-4 text-left text-sm text-[#edebe6] hover:bg-white/10"
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmRestore(true);
                  }}
                >
                  <RotateCcw className="h-4 w-4 text-[#ff8a3d]" /> Khôi phục mặc định
                </button>
                <button
                  className="flex min-h-[44px] w-full items-center gap-2 px-4 text-left text-sm text-[#edebe6] hover:bg-white/10"
                  onClick={exportJson}
                >
                  <Download className="h-4 w-4 text-[#ff8a3d]" /> Xuất JSON cấu hình
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Thanh menu 4 mục chính — NGAY DƯỚI header (v2.3). Create / Import /
          Onboard đã dồn vào mục Khác → Profile (OthersPage có đủ).
          Mỗi mục: label tiếng Việt + icon của nó ĐẰNG SAU label. */}
      <nav
        className="mx-4 mt-3 flex shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#1f1f38]"
        aria-label="Mục cấu hình"
      >
        {(
          [
            { id: 'keys', label: 'Gán phím', icon: <Keyboard className="h-4 w-4" /> },
            { id: 'dpi', label: 'DPI', icon: <Gauge className="h-4 w-4" /> },
            { id: 'performance', label: 'Hiệu năng', icon: <Zap className="h-4 w-4" /> },
            { id: 'others', label: 'Khác', icon: <Settings className="h-4 w-4" /> },
          ] as { id: TabId; label: string; icon: React.ReactNode }[]
        ).map(({ id, label, icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 px-1 text-[12px] font-semibold whitespace-nowrap transition ${
                active ? 'bg-[#ff5a1f]/15 text-[#ffb37a]' : 'text-[#a2a2b0] hover:bg-white/5 hover:text-[#edebe6]'
              }`}
            >
              {label}
              <span className={active ? 'text-[#ff8a3d]' : 'text-[#55555c]'} aria-hidden="true">
                {icon}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Nội dung tab — khối duy nhất được cuộn trong panel.
          v2.4: BỎ AnimatePresence mode="wait" — nó KẸT exit sau khi mở/đóng
          modal macro (tab đổi state nhưng content cũ không unmount, content
          mới chất đống bên dưới → bấm Khác không đổi tab). Thay bằng
          key={tab} + animation CSS thuần (tabIn) — không có exit tracking
          để kẹt, mượt hơn (chỉ opacity/transform, chạy trên GPU). */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div key={tab} className="tab-enter">
          {tab === 'keys' && (
            <>
              <KeysPage />
              <div className="mt-6 border-t border-white/10 pt-5">
                <MacroPage />
              </div>
            </>
          )}
          {tab === 'dpi' && <DpiPage />}
          {tab === 'performance' && <PerformancePage />}
          {tab === 'others' && (
            <div>
              <PageHead title="Khác" subtitle="Thiết bị · Pin · Firmware · Profile." />
              {/* v2.5: 2 cột cân nhau — trái: Thiết bị & pin + Profile;
                  phải: Firmware + Khôi phục + Raw. Không còn chồng 1 cột
                  dài 1294px, lướt còn ~0.4 màn ở 1366x768. */}
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="min-w-0 space-y-4">
                  <Dashboard bare />
                  <ProfileCard />
                </div>
                <div className="min-w-0 space-y-4">
                  <FirmwareCard />
                  <BatteryCard />
                  <RestoreCard />
                  <RawReplyCard />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activity Log ĐÃ XÓA ở v2.4 (theo yêu cầu bro) — mọi thông báo giờ
          là toast NGẮN ở đầu trang (Toasts), không còn dòng log trong panel. */}
      <ConfirmModal
        open={confirmRestore}
        title="Khôi phục mặc định gốc?"
        confirmLabel="Khôi phục"
        danger
        onConfirm={() => {
          setConfirmRestore(false);
          void restoreFactory();
        }}
        onCancel={() => setConfirmRestore(false)}
      >
        Ghi lại cấu hình mặc định của app gốc (DPI 800/1600/2400/3200/6400/12000, nấc 2, polling index 3, ngủ 10
        phút) + phím mặc định xuống chuột.
      </ConfirmModal>
    </section>
  );
}
