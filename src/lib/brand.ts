/**
 * brand.ts — logo SMAILWOLF (v3.0).
 *
 * File gốc 4K (4096x1024) giữ trong public/brand/ làm source asset.
 * Trong app chỉ dùng bản downscale 800px (đủ cho hiển thị ~320px,
 * nhẹ ~100KB thay vì ~900KB).
 *
 * QUY TẮC CỦA ETHAN — map theo ĐỘ SÁNG CỦA NỀN, KHÔNG theo tên file:
 * - nền TỐI (dark mode / màn loading navy) → file LIGHT (swoosh TRẮNG)
 * - nền SÁNG (light mode) → file DARK (swoosh TỐI)
 * Tên file dễ nhầm ngược (DARK file = swoosh tối, LIGHT file = swoosh
 * trắng) nên hàm này là chỗ duy nhất được phép chọn file.
 */
export type AppTheme = 'light' | 'dark';

export const BRAND_DARK_800 = '/brand/SMAILWOLF_DARK_800.png';
export const BRAND_LIGHT_800 = '/brand/SMAILWOLF_LIGHT_800.png';

/** Logo cho nền sáng/tối theo theme hiện tại. */
export function brandLogoSrc(theme: AppTheme): string {
  return theme === 'dark' ? BRAND_LIGHT_800 : BRAND_DARK_800;
}

/** Logo cho nền navy tối cố định (màn loading) — luôn swoosh trắng. */
export const BRAND_ON_DARK = BRAND_LIGHT_800;
