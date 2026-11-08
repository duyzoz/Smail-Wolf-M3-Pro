# SMAILWOLF M3 Pro — Driver UI (remake)

Giao diện driver cho chuột SMAILWOLF M3 Pro (PAW3311, firmware 2.1.3), viết lại
clean-room từ protocol HID đã đo trên chuột thật. Dashboard kính tối theo ảnh
Admin Dashboard V2.

## Chạy thử

Yêu cầu: **Node.js 18+** và **Chrome/Edge** (WebHID chỉ có trên Chromium).

```bash
npm install
npm run dev        # mở http://localhost:5173
```

Chỉ xem bản build sẵn (không cần build lại):

```bash
npm run build
npm run preview    # mở http://localhost:4173
# hoặc: mở thư mục dist/ bằng bất kỳ static server nào
#        (vd: python3 -m http.server 8901 --directory dist)
```

Kiểm thử protocol (51 test, dùng đúng reply live của chuột thật):

```bash
npx tsx tests/hid.test.ts
```

## 2 chế độ

| Chế độ | Cách bật | Dùng để làm gì |
|---|---|---|
| **Demo** (mô phỏng, KHÔNG tự kết nối) | Nút “Dùng thử Demo” ở sidebar hoặc card “Chưa kết nối chuột” | Test toàn bộ giao diện không cần chuột. Chuột mô phỏng dùng đúng trạng thái live 20:59:13 của Ethan (DPI nấc 1 = 1600, polling 125 Hz, ngủ 5 phút, phím Ctrl+V/C), trả reply đúng định dạng dây (kèm checksum thật). App mở ở trạng thái **Chưa kết nối** — không tự nhận là đã kết nối khi chưa xin quyền gì. |
| **Live** (chuột thật) | Nút “Kết nối chuột thật (WebHID)” | Cắm dongle 2.4G (hoặc dây), bấm nút, chọn “USB Receiver” trong hộp thoại Chrome. Mọi lệnh ghi đều ghi thật xuống chuột rồi đọc lại verify. |

## Tính năng (tất cả đều chạy thật)

- **Dashboard** — 4 stat card (DPI, polling, pin, firmware), chart 6 nấc DPI (bấm 1 cột để đổi nấc), donut pin, thẻ thiết bị, Activity Log. **Pin (v3.1):** % là mô phỏng ước tính theo polling rate (xem mục "Pin (mô phỏng)" bên dưới), không còn hiện giá trị thô report 48; Live vẫn hỏi report 48 mỗi 30 giây ở tầng store nhưng chỉ để tham khảo nội bộ.
- **DPI** — sửa 6 nấc DPI (50–50000, tự clamp), preset nhanh, chọn nấc hiện tại, lưu qua `setConfig`.
- **Gán phím** — remap 6 phím (chuột / phím tắt có Ctrl/Shift/Alt / macro / DPI / trống), lưu qua `setKeys`. Nút DPI cố định, không đổi được — app gốc cũng vậy.
- **Hiệu năng** — polling 125/250/500/1000 Hz, ngủ đông 0–100 phút + Never, hướng lăn, line correction. Wake-up method **không có nút đổi** vì app gốc chỉ có 1 lựa chọn (di chuột hoặc bấm đều đánh thức — hành vi cố định).
- **Macro** — tạo/sửa macro (ghi phím thật, thêm bước chờ/bấm chuột), lưu ở localStorage như app gốc, ghi xuống chuột qua `[240,13]` + commit. **Macro không đọc lại được từ chuột.**
- **Khác** — firmware (hiện 2.1.3, V3.1.2 có sẵn nhưng **chưa cập nhật** — protocol đo trên 2.1.3), khôi phục mặc định, profile lưu/áp dụng, xuất/nhập JSON, raw reply kèm checksum.

## Protocol (tóm tắt — xem `../PROTOCOL.md` đầy đủ)

- Transport: WebHID `usagePage 0xFF01, usage 0x10`, lệnh 64 byte, byte 0 = Report ID 240, **1 lệnh 1 lúc** (serial queue), `readReply` timeout 500 ms, `sendReport` timeout 3 s.
- Đọc: version `[240,4]`, info `[240,82]`, pin `[240,48,…]` (qua status listener), phím `[240,8,…]`, config `[240,14,…]`, status `[240,237]`.
- Ghi config `[240,15,174,10,47,…]` — **đã chứng minh live, round-trip khớp 100% (3 lần)**. Ghi phím `[240,9,165,34,44,…]`. Ghi macro `[240,13,…]` + commit `[240,16,165,34,0,0,0,5]`.
- Checksum reply: byte `[2]` = tổng byte `[3..63]` mod 256 (đúng 9/9 lần live). App này kiểm tra mỗi lần đọc/ghi.
- Không có: chỉnh đèn LED (app gốc v1.3.2 không có control đèn), đọc macro từ chuột (report 6 không ghi được), cập nhật firmware.

## Pin (mô phỏng) — v3.1

% pin trong app là **ước tính (mô phỏng), KHÔNG phải số đo phần cứng** — mọi chỗ hiện pin đều ghi
"ước tính". Firmware chỉ báo 100% thô tới lúc yếu (report 48, byte 7) và chuột không có chip đo pin
(fuel gauge), nên giá trị report 48 **không hiện ra UI nữa**; đèn LED trên chuột vẫn là chỉ báo thật
(đỏ sáng = đang sạc, tắt = đầy, nhấp nháy = sắp hết).

Mô hình (`src/lib/battery.ts`, logic thuần — test ở `tests/battery.test.ts`, 42 test):

- Pin 500 mAh, dùng được 400 mAh (hiệu suất 0.8). % = mAh còn lại / 400.
- Xả theo polling rate (đo live): 125 Hz → 3 mA (~133,3 giờ), 250 Hz → 5 mA (~80 giờ),
  500 Hz → 8 mA (~50 giờ), 1000 Hz → 14 mA (~28,6 giờ). Tick mỗi 1 giây khi đã kết nối, dùng
  polling rate hiện tại từ config live; Demo dùng rate của demo, giả định xả qua 2.4G.
- Sạc (cắm dây, VID 43172): pin lên theo dòng sạc — xem giả định dưới đây.
- Trạng thái lưu ở key `battery-state-v1` (`{ remaining_mah, last_polling_rate, updated_at,
  charging, low_notified, saver }`), lưu mỗi 10 giây + khi đổi rate/sạc + khi đóng app. **Không bao
  giờ reset về 100%/0% khi khởi động lại**: lúc mở app, thời gian thực đã trôi qua kể từ
  `updated_at` được áp dụng (xả theo rate cuối, hoặc sạc nếu lúc đóng app đang sạc) rồi mới hiện %.

**Giả định sạc 150 mA (0,3C, sạc đầy phần dùng được ~2,7 giờ):** dòng sạc thật chưa từng được đo —
firmware không báo dòng sạc, và cờ sạc (report 48 byte 8) vẫn = 0 ngay cả khi LED đỏ sáng báo đang
sạc. 150 mA là giả định hợp lý cho pin 500 mAh (0,3C); nếu Ethan đo được thời gian sạc đầy thật thì
chỉ cần sửa một hằng số `CHARGE_MA` trong `src/lib/battery.ts`.

**Giả định sạc khi app đóng:** nếu lúc đóng app chuột đang cắm dây (`charging: true`), lúc mở lại
app giả định nó đã sạc liên tục 150 mA trong suốt thời gian đóng (tới tối đa 400 mAh). App không
thể biết dây có còn cắm trong lúc nó đóng hay không — nếu dây đã rút thì % sẽ đọc cao hơn thực tế
cho tới khi xả đuổi kịp; đó chính là lý do mọi chỗ đều ghi "ước tính".

- **Tiết kiệm pin** (tab Khác): bật = lưu polling + DPI hiện tại, ghi polling 125 Hz + DPI 1600
  xuống chuột qua `setConfig` (đường ghi đã chứng minh live); tắt = khôi phục lại. Khi bật, thanh
  pin chuyển **vàng** (chỉ báo trong app + popup tray), như chế độ tiết kiệm pin trên điện thoại.
- **Pin yếu:** khi % tụt qua 20% thì bắn thông báo Windows đúng một lần mỗi chu kỳ xả —
  "Chuột của bạn còn 20% pin, vui lòng sạc pin". Cờ reset khi bắt đầu sạc hoặc % lên lại trên 25%.
- **Mở app khi khởi động Windows** (tab Khác): đọc/ghi thật qua plugin autostart của Tauri, mặc
  định BẬT từ lần chạy đầu; ở chế độ web dev thì công tắc bị khóa kèm ghi chú (không có tác dụng
  ngoài app Windows).
- **Popup tray** (`?tray=1`, cửa sổ riêng không có store chung): đọc state đã lưu mỗi 1 giây và
  áp dụng thời gian trôi qua ngay trong bộ nhớ (chỉ hiển thị, không ghi) nên % vẫn chạy đúng.

Giới hạn đã biết: đây là mô phỏng, không phải đo thật — sai số tích lũy theo thời gian (rate đổi
thật ngoài app, chuột ngủ/xả nền, giả định sạc khi đóng app). Muốn % chính xác tuyệt đối thì chỉ
có cách đo dòng sạc/xả thật hoặc đọc ADC qua firmware tùy chỉnh (đường này đã đóng — xem
`../FOT-RE.md`).

## Cấu trúc code

```
src/
  lib/hid.ts      — protocol port 1:1 từ test-read v3.2 / test-write (parser, builder, LiveMouse)
  lib/mouse.ts    — DemoMouse (mô phỏng chuột thật) + macro/profile localStorage
  lib/battery.ts  — pin mô phỏng (ước tính): xả theo polling, sạc 150 mA, loadWithElapsed
  lib/tauri.ts    — bridge Tauri: store `battery-state-v1`, autostart, notify, tray
  store.tsx       — 1 backend (demo/live) + state chung, mọi lệnh ghi đều verify bằng re-read
  components/     — Sidebar, ui primitives (nút kính, slider, toggle, donut, toast, modal)
  pages/          — Dashboard, DPI, Keys, Performance, Macro, Others
tests/hid.test.ts — 51 test protocol (npx tsx tests/hid.test.ts)
tests/battery.test.ts — 42 test pin mô phỏng (npx tsx tests/battery.test.ts)
```

## Stack & nguồn thiết kế

- Vite + React 19 + TypeScript + Tailwind CSS v4 + framer-motion + lucide-react.
- Kính tối (glassmorphism) theo ảnh Admin Dashboard V2.
- Rules UI/UX: `nextlevelbuilder/ui-ux-pro-max-skill` v2.15.0 (119 rules) — xem `../../design-skills/`.
- Element Uiverse (copy nguyên văn, chỉ đổi màu/kích thước): slider gradient
  `bright-swan-54`, card kính `grumpy-mule-23`, viền xoay `serious-monkey-58` —
  xem `../../design-skills/uiverse-galaxy/INDEX.md`. Nút kính lấy ý tưởng từ
  `modern-bear-96` nhưng v1.1 đã bỏ cấu trúc 2 lớp của nó (lớp BG lệch
  z-index:-1 render nổi lên trên nút trong card backdrop-filter và nuốt click)
  thành nút 1 lớp duy nhất — xem “v1.1” dưới đây.

## v2.8.2 — bỏ hiệu ứng lướt trong popup Skin + chống lag máy yếu (2026-11-08 15:47–…)

1. **Bỏ hẳn hiệu ứng lướt/scroll** (IntersectionObserver + stagger trôi
   từng hàng) theo yêu cầu của bro: lưới render LUÔN ngay khi mở popup
   (tranh thủ lúc load để render xong hết >60 skin), loader la bàn chỉ là
   lớp phủ che trên lưới; load xong là hiện ra luôn, không trôi, không
   chờ từng hàng, không hiệu ứng lướt gì nữa. Hover nổi trên thẻ skin
   vẫn giữ (cùng ngôn ngữ hover của mọi nút trong app).
2. **Chống lag (cấm lag trên máy yếu):** lưới dùng thumbnail 320px
   (2.5MB tổng) thay full-res 9MB, mỗi ảnh decode nhanh hơn ~9 lần;
   img có `decoding="async"` + `loading="lazy"`; từng hàng có
   `content-visibility:auto` nên hàng ngoài khung nhìn không tốn
   layout/paint khi lướt. Nút Skin + card chọn thiết bị cũng dùng thumb.
   Stage vẫn dùng ảnh đủ nét.
3. **BUG do chính đợt này lòi ra (test bắt được, user thật cũng sẽ dính):**
   bọc khung lướt trong `<div class="relative min-h-0 flex-1">` rồi cho
   khung con `h-full` — wrapper cao theo flex (không definite) nên
   `height:100%` rơi về `auto` = 2454px, tràn xuống đè lên footer (wrapper
   `relative` nên nội dung tràn vẽ TRÊN footer tĩnh) khiến nút Áp dụng
   không bấm được — click trúng ảnh skin (sẽ chọn nhầm skin thay vì áp
   dụng). Fix: wrapper `flex flex-col` + khung lướt `flex-1 min-h-0`
   (flex-item tự co lại 553px và lướt đúng). Bài học: **không bao giờ
   dùng `h-full` cho khung lướt bên trong 1 flex-item — phải là flex-item
   trực tiếp (flex-1 min-h-0) hoặc absolute inset-0.**
4. **Kiểm chứng:** build sạch, 75/75 tests, verify282 **144/144 PASS**
   (142 cũ + 2 check mới: không còn `.skin-row`, lưới dùng thumb), scan28
   sạch, 0 lỗi console.

## v2.8.1 — tách tag MIDDLE/RIGHT BUTTON ra (2026-11-08 15:43–…)

1. **BUG bro chụp ảnh (Middle và Right dính nhau):** 2 tag bên phải chỉ
   cách nhau ~26px tâm-tâm, trừ chiều cao tag ~25px còn ~1px khe hở —
   nhìn như dính nhau. Fix: layout() trong MousePhoto.tsx thêm 1 vòng
   tách tag cùng phía — tâm-tâm tối thiểu 38px (khe hở nhìn thấy ~13px),
   chỉ đẩy tag DƯỚI xuống (Right dy 0 → +12), kẻ nối chỉ nghiêng thêm
   ~6°, rồi kẹp cả nhóm lại trong khung nếu tag cuối tràn dưới. Đo thật:
   khe hở Middle→Right **12px ở 1366×768, 11px ở dọc 1080×1920** (trước
   ~1px). Không hardcode từng tag — quy tắc chung nên mọi cặp tag cùng
   phía đều được tách, kể cả khi đổi tên phím (Left·Copy…).
2. **Kiểm chứng:** build sạch, 75/75 tests, verify28 142/142 PASS
   (không regression), 0 lỗi console.

## v2.8 — popup Skin to (thay strip ngang) + quét lại toàn bộ skin: F bị cắt viền phải, 0 trùng (2026-11-08 15:03–…)

1. **Strip ngang BỎ — thay bằng nút layer Skin + popup to (bro dặn):**
   dưới dock Pin chỉ còn 1 nút `SKIN CHUỘT` (ảnh thu nhỏ skin đang dùng +
   tên + "67 skin", hover nổi lên + viền cam như các nút khác). Bấm mở
   popup to (portal ra body, nền sau mờ đen toàn màn hình): header
   "SKIN CHUỘT · 67 skin · Đang dùng: …", lưới **5 skin/hàng, đủ 5 cái
   trọn vẹn**, mỗi skin có tên ngay dưới ảnh, skin đầu tiên LUÔN là
   Mặc định. Chọn trong lưới chỉ là chọn tạm (pending, viền cam + tick);
   **Áp dụng** mới đổi thật (stage + localStorage + toast), **Hủy** đóng
   popup không đổi gì; thẻ skin đang dùng có nút **Hủy áp dụng** — bấm là
   về Mặc định ngay. Esc / bấm nền đen / nút X cũng đóng.
2. **Loader trong popup (tái dụng hiệu ứng load trang, có mục đích):**
   mở popup là preload toàn bộ 67 ảnh skin, hiện la bàn ancient-yak-42
   (KHÔNG logo SMAILWOLF — bro dặn xóa) + "Đang tải skin… n/67" — đợi
   máy render xong hết >60 skin rồi lưới mới trôi lên (timeout 10s thì
   vẫn hiện lưới với ảnh đã kịp tải). Không load vô cớ.
3. **Lướt tới đâu, hàng trôi lên tới đó:** mỗi hàng là 1 `.skin-row`
   (opacity 0 + translateY 14px), IntersectionObserver gắn `.in` khi
   hàng cắt khung lướt — chỉ transform/opacity nên không lag (Intel HD
   4400). Lỗi thật đã bắt khi test: lướt NHẢY thẳng xuống cuối thì hàng
   giữa không bao giờ cắt viewport nên kẹt ẩn — fix: khi 1 hàng hiện thì
   hiện luôn mọi hàng tới nó. 4 hàng đầu stagger 70ms/hàng khi mở.
   Tôn trọng prefers-reduced-motion (hàng hiện luôn, không transition).
4. **Quét lại toàn bộ 66 skin (bro dặn — trùng + mất viền/mất đuôi):**
   - **Trùng: 0.** So từng cặp bằng MAD trên RGB 64×64 trong vùng alpha
     giao nhau: cặp giống nhất MAD 25.7/255 (F01–F07), không cặp nào
     <12 → 66 artwork đều khác nhau, không xóa skin nào. (Hash 16×16 ở
     vòng đầu báo 6 cặp "trùng" là dương tính giả — cùng silhouette M3
     + cấu trúc sáng/tối giống nhau, không phải cùng artwork.)
   - **Mất viền: sheet F (cả 10 skin).** Nguyên nhân: v2.7 crop F phải
     240px như sheet B, nhưng sheet F KHÔNG có thumbnail phải — chuột
     full-width x25–280, crop đã cắt mất viền phải (F01 rộng 697px so
     với gốc 867px, IoU 0.81). Fix: crop F (0,0,307,450) full-width,
     chạy lại cả 10 skin — audit lại không còn skin F nào lệch, F01
     composite magenta chứng minh silhouette đủ cả 2 bên + đuôi.
     (Batch chạy lại 1 lần chết sau F06 không lỗi rõ + F07.webp 0 byte
     bị skip-nhầm — xóa file 0 byte rồi chạy lại mới xong.)
   - **A02/A10/D09/D10 "ngắn hơn gốc 70–108px": dương tính giả** —
     xem ô gốc: chuột vẽ nhỏ hơn trong sheet (đáy ~y440–445, trên crop
     450/452), silhouette đủ, không cắt. Không sửa.
5. **Kiểm chứng:** build sạch, **75/75 tests**, **verify28 142/142 PASS**,
   scan28 sạch 4 cỡ (1366 scrollH 768, 1920 scrollH 1080, mobile scrollW
   390, dọc 1080×1920 scrollW 1080; 0 tag đè nhau, 0 tag ngoài stage,
   0 lỗi console; Khác vẫn lướt nội bộ 428px ở 1366 / 151px ở 1920 như
   v2.6–v2.7). Flake đã bắt khi test (không phải lỗi app): lần đo
   scrollH 1920 ra 1104, đo lại 1080; đo hàng skin khi chuột còn đậu
   trên thẻ thì hover lift −2px làm lệch y — test dời chuột ra góc
   trước khi đo.

## v2.7 — sửa Never sleep + fit dọc + khung Skin grip 67 skin (2026-11-08 13:49–…)

1. **BUG Never sleep (bro báo — tắt không được, cứ nhảy bật lại):**
   nguyên nhân thật — effect đồng bộ `setSleep(config.sleepLight)`:
   khi bật Never sleep, config về 0 nên `sleep` bị ghi đè thành 0, mất
   số phút cũ; tắt Never sleep thì ghi lại `sleepLight = sleep = 0` →
   toggle nhảy bật lại. Fix: `lastSleep` riêng, CHỈ cập nhật khi giá trị
   ≠ 0; tắt thì ghi lại `lastSleep` (5 phút của bro). Kiểm chứng: bật →
   "Không ngủ" → tắt → "5 phút", toggle unchecked, ổn định qua 2 chu kỳ.
2. **Tỉ lệ dọc (bro chụp ở 1080x1920 — chuột kéo giãn rất xấu):**
   nguyên nhân thật — ảnh chỉ có `h-[96%] w-auto`: ở viewport dọc
   (cao, hẹp) ảnh cao 96% khung thì bề ngang vượt khung → 2 bên bị cắt,
   nhìn như kéo giãn dọc. Fix: tính fit từ tỉ lệ thật của ảnh
   (`naturalWidth/naturalHeight`, fallback 944x1667): `fit = min(cw*0.96/
   iw, ch*0.96/ih)`, đặt width/height rõ ràng + căn giữa — không bao giờ
   tràn/cắt, giữ đúng aspect ở mọi tỉ lệ (đo: 592x1046, aspect đúng
   0.566 ở 1080x1920). Kèm: tag bị cắt 5-9px khỏi mép stage ở dọc (ước
   lượng bề rộng tag thiếu ~10px do chữ in hoa + letter-spacing) — tăng
   ước lượng 7.2/18 → 8.2/26 và hạ sàn leader 14px → 4px cho neo
   Copy/Paste sát mép trái; đo lại cả 6 tag đều nằm trong stage.
3. **Khung SKIN GRIP dưới dock Pin (bro gửi 12 ảnh — 6 sheet 10 skin +
   6 chuột lẻ):** strip ngang dưới dock Pin, 67 lựa chọn (Mặc định +
   66 skin), thumb 56px + tên, bấm là đổi ảnh chuột ngay (chỉ giao diện,
   không ghi xuống chuột), lưu localStorage (mở lại vẫn giữ skin), lướt
   ngang trong strip, không lướt dọc trang. Skin cũng áp cho card thiết
   bị ở màn chọn thiết bị.
4. **Tách nền (bro dặn "cắt nền thật kĩ"):** rembg/u2net (176MB — model
   mặc định bria-rmbg-2.0 1.02GB bị OOM-kill trong sandbox) + lọc
   component lớn nhất (+ component ≥15%) + mở hình thái erosion 2px →
   label → dilation 2px (cắt cầu mỏng nối nhãn với chuột). Chuẩn hóa về
   canvas trong suốt 944x1667 (cùng silhouette M3 Pro nên neo bấm đo sẵn
   dùng chung), WebP q85, tổng ~9MB. Cắt nhãn/thumbnail khỏi ảnh ĐẦU
   VÀO theo từng sheet (nhãn pill dưới đáy, thumbnail phải, thanh LED
   DEMO, swatch Grip Tape) — để lọt vào mask rồi mới lọc thì không sạch.
   Kiểm chứng bằng montage nền caro + composite magenta từng skin khó:
   A02 chuột đen trên nền đen tách sạch; B02 card tách sạch; S1 nền
   trắng tách sạch. Lần 1 còn 7 skin dính nhãn (A02/A10 pill, D04/D05/
   D09/D10 nhãn Grip Tape + swatch, F02 dính nhãn của ô bên cạnh) + 3
   skin B dính thumbnail phải (B07/B08/B10) — đã sửa bằng crop đầu vào
   và chạy lại, montage lần 2 sạch.
5. **Kiểm chứng:** build sạch, **75/75 tests**, **verify27 129/129 PASS**
   (Never sleep 2 chu kỳ + fit dọc + tag + skin strip 67 lựa chọn + đổi
   skin A03 + localStorage + các check cũ; chạy lại lần 2 cũng 129/129,
   lần trước có 1 fail lẻ do timing toast/loading, chạy lại là qua),
   scan27 4 cỡ sạch (1366 scrollH 768, 1920 scrollH 1080, mobile scrollW
   390, dọc 1080x1920 scrollW 1080; 0 tag đè nhau, 0 tag ngoài stage,
   0 lỗi console; Khác vẫn lướt nội bộ 428px ở 1366 / 151px ở 1920 như
   v2.6, không đổi).
6. **Giới hạn trung thực (không đổi):** setKeys/macro ghi xuống chuột
   thật vẫn CHƯA kiểm chứng live; độ mịn pin cần bro chạy Live dài mới
   biết; không LED; không cập nhật firmware; Bluetooth không tới được
   qua WebHID nên icon BT không bao giờ sáng. Skin chỉ đổi ảnh trong
   app, không đổi vỏ chuột thật.

## v2.6 — chuột anime + hover sáng từng nút + quét thiết bị thật + modal phủ toàn màn hình + nền theo chuột (2026-11-08 12:34–12:5x)

1. **Toàn bộ ảnh chuột đổi sang ảnh anime bro gửi (944x1667, nền trong
   suốt, WebP 95KB):** cả ảnh chính trong giao diện lẫn card thiết bị
   (Demo lẫn Live đều dùng đúng ảnh này). Neo bấm đo lại bằng PIL/numpy
   (erosion 3px giết viền nét mảnh, chỉ giữ vùng đen đặc): con lăn
   (0.50, 0.227), nút DPI (0.50, 0.398), nút hông trên (0.090, 0.410),
   nút hông dưới (0.102, 0.546), tấm trái/phải (0.27/0.73, 0.22).
2. **Hover sáng từng phần tử chuột:** rê vào 1 nút (vùng bấm hoặc tag)
   → phần tử đó sáng cam lên (lớp glow phủ đúng hình nút: tấm = ellipse
   lớn, con lăn/DPI = capsule, nút hông = chữ nhật bo góc) + nảy nhẹ
   như bấm thật (keyframes partPress: scale 1 → 0.94 → 1.03 → 1,
   translateY 2px, 0.45s) + tag/kẻ nối/chấm chuyển cyberpunk (nền navy,
   chữ cam neon, viền + hào quang #FF5A1F). Áp cho cả 6 nút, cả chuột
   lẫn bàn phím (focus cũng kích hoạt, theo pro-max §1).
3. **Gán phím theo đúng hiệu ứng DPI:** nút "Đổi gán phím" + nút Lưu /
   Về mặc định + các nút chọn trong modal đều thành pill shy-moth-10
   (cam khi chọn, chevron trượt khi hover). **Xóa dòng text type**
   ("type 32 · 1,0,0") khỏi card. **Sửa lỗi xuống dòng:** card 3 cột
   hẹp (~152px) làm "Phím Trái" và nút xuống dòng 2 lần, lệch cả lưới
   → về 2 cột (~240px), tiêu đề + nút đều vừa 1 dòng (đã kiểm chứng
   bằng đo boundingBox < 26px).
4. **Modal mờ đen TOÀN màn hình (bug bro chụp):** nguyên nhân thật —
   Shell giữ class `.app-enter` với animation fill `both` nên
   `transform: translateY(0)` còn áp, transform trên tổ tiên làm
   `fixed inset-0` chỉ phủ đúng khung Shell (max-w 1440, 2 mép ngoài
   không mờ). Fix: ConfirmModal + modal Macro **portal ra
   document.body** (react-dom createPortal) — lớp mờ giờ phủ đúng
   1366x768 toàn viewport (đã kiểm chứng bằng đo boundingBox).
5. **DevicePicker quét thật:** "Thêm thiết bị mới" giờ gọi
   `requestDevice({filters:[{usagePage: 0xFF01, usage: 0x10}]})` mở hộp
   chọn thiết bị của trình duyệt (đúng dialog ảnh 4 bro gửi); mở màn
   thì `getDevices()` liệt kê thiết bị đã cấp quyền. Danh sách = mọi
   thiết bị Smailwolf quét được, card ghi tên + chế độ theo VID (43172
   Có dây, 43173/14391 2.4G) — bấm card là kết nối ĐÚNG thiết bị đó
   (`LiveMouse.connect(device)`, không quét lại/lấy thiết bị đầu tiên
   theo VID nữa). **Không còn card để sẵn:** chưa quét ra gì thì hiện
   ô trống "Chưa thấy thiết bị nào"; **Demo tách riêng** thành dòng link
   chữ dưới danh sách. Nói thẳng: Bluetooth không hiện trong quét
   WebHID (đi qua stack Bluetooth của hệ điều hành, app gốc Tauri cũng
   vậy) — quét rộng ở đây là có dây + 2.4G qua cổng HID.
6. **Logo không chìm nữa:** cả màn chọn thiết bị lẫn màn loading đều
   chèn aura hào quang trắng sau logo SMAILWOLF (`.logo-aura`:
   radial-gradient trắng + blur 6px) — logo đen nổi hẳn trên nền sao tối.
7. **Nền chọn thiết bị hết nhàm:** hào quang cam/tím đi theo con trỏ
   (lerp mượt) + **pixel vuông trồi lên mỗi lần di chuột** (canvas,
   tối đa ~70 hạt, màu cam/trắng/cyan/vàng, bay lên + xoay + mờ dần
   trong ~2s) + sao nhấp nháy (twinkle 3.2s). Rẻ cho GPU (canvas 2D,
   không backdrop-filter), tôn trọng prefers-reduced-motion (tắt hẳn).
8. **Kiểm chứng:** build sạch, **75/75 tests**, **verify26 111/111
   PASS** (quét thật + card thiết bị + loading 5s + hover glow +
   Gán phím shy + không type text + modal portal phủ toàn viewport +
   ngắt → về màn chọn), scan 3 cỡ sạch (1366 scrollH 768, 1920
   scrollH 1080, mobile scrollW 390; 0 tag đè nhau, 0 tag ngoài stage,
   0 lỗi console; Khác còn lướt ~428px ở 1366, ~151px ở 1920).
   Lưu ý đo: chụp loading ở click+1500ms từng hụt 1 lần (chụp nhầm
   giao diện chính) — chụp ở click+2500ms mới chắc (readAll ~300ms +
   loading lên hẳn).
9. **Giới hạn trung thực (không đổi):** setKeys/macro ghi xuống chuột
   thật vẫn CHƯA kiểm chứng live; độ mịn pin cần bro chạy Live dài mới
   biết; không LED; không cập nhật firmware; Bluetooth không tới được
   qua WebHID nên icon BT không bao giờ sáng.

## v2.5 — màn chọn thiết bị kiểu app gốc + loading la bàn đúng 5s + tất cả nút shy-moth-10 + popup khóa lướt + Khác 2 cột (2026-11-08 11:35–12:0x)

1. **Màn chọn thiết bị kiểu app gốc (ảnh 3 bro gửi):** mở app không còn vào
   thẳng giao diện nữa — nền sao tối (`#0b0b26` + 8 lớp radial-gradient sao),
   chỉ logo SMAILWOLF wordmark (không chữ "M3 Pro"), nút cam "Thêm thiết bị
   mới" quét lại bằng `navigator.hid.getDevices()` ("Tìm thấy N thiết bị"),
   2 card chuột PNG thật: **USB Receiver** (chuột thật · WebHID → Live,
   mở picker HID của trình duyệt như ảnh 4 bro gửi) và **Demo** (mô phỏng ·
   không cần chuột thật). Bấm card là kết nối. Ngắt kết nối ở giao diện
   chính (Đồng ý) quay lại đúng màn này.
2. **Loading đúng 5s khi vào giao diện:** la bàn `ancient-yak-42` (Nawsome,
   lấy nguyên văn từ mirror uiverse-io/galaxy — vòng xanh/cyan xoay 2s,
   8 tick, kim la bàn đỏ/trắng) ở giữa màn, toàn bộ giao diện phía sau che
   mờ (`bg-[#0b0b26]/85 backdrop-blur-md`, z-100), sau đúng 5000 ms (timer
   ở store) giao diện chính mới trôi lên (`app-enter`: opacity + translateY
   24px → 0, 0.6s). Toast "Đã bật Demo…" dời vào cuối 5s để không hết hạn
   sau lớp phủ. **Nói thẳng: đọc dữ liệu thật chỉ mất ~1s, 5s là splash
   bro đặt — không phải nhu cầu kỹ thuật.**
3. **Tất cả nút Polling / Hướng lăn / DPI đổi sang `shy-moth-10` (Li-Deheng):**
   pill bo tròn, nền cam `#EA580C` khi chọn (xám mờ khi chưa chọn), mũi tên
   3 chevron trượt phải + đổi màu khi hover, viền outline pulse 1s khi
   hover/focus. Lấy nguyên văn từ galaxy mirror, chỉ đổi: hồng `#ff135a` →
   cam `#EA580C`, font 30px → 13px, padding 5px 30px → 6px 12px, trượt
   25px → 6px, **id SVG → class** (12 nút trên 1 trang, id trùng là bẫy).
   Hiệu ứng cũ `serious-monkey-58` (`.uiv-seg-spin` / `.spin-border`) **XÓA
   HẾT** theo lệnh bro.
4. **Popup khóa lướt nền (`useScrollLock`):** bất kỳ modal nào mở lên
   (Tạo macro, xác nhận Ngắt, khôi phục…) đều khóa scroll cả body lẫn
   panel trái — nền sau không trôi đi đâu được, popup cố định giữa màn để
   xem/tương tác trọn khung; nội dung dài trong chính modal vẫn lướt được;
   đóng modal trả lại scroll như cũ. Đã kiểm chứng bằng test (overflow =
   hidden lúc mở, trả về '' lúc đóng).
5. **Xóa 2 subtitle:** "Remap 6 phím qua lệnh setKeys." (Gán phím) và
   "6 nấc DPI — bấm nấc hoặc kéo thanh, ăn ngay." (DPI). PageHead giờ cho
   subtitle tùy chọn.
6. **Preset theo tác vụ (lấp khoảng trống dưới slider DPI):** Văn phòng ·
   1.600 / Chơi game · 3.200 / Thiết kế · 800 — bấm ăn ngay như nấc DPI.
   Lý do chọn số: Văn phòng 1.600 = nấc mặc định của chuột; Chơi game
   3.200 = DPI chơi game phổ biến; Thiết kế 800 = nấc thấp nhất, chỉnh
   từng pixel. Bro cứ bảo đổi số nếu chưa chuẩn tay.
7. **Khác cải tổ lại 2 cột cân nhau:** trái = Thiết bị & pin (donut pin +
   lịch sử + thông tin, nút "Đọc ngay" gọn 1 dòng) + Profile; phải =
   Firmware + Khôi phục mặc định + Raw reply (thu gọn mặc định, bấm mới mở
   2 hex dump). Cắt chữ thừa (thẻ "Chưa kết nối", nút "Kiểm tra cập nhật"
   bị vô hiệu, đoạn firmware dài). Lướt còn **~430px ở 1366x768** (từ
   968px) và **~138px ở 1920x1080** (từ 689px) — chưa tới 1 màn; DPI và
   Hiệu năng vẫn **0px lướt**.
8. **Sửa mock test (không phải app):** `navigator.hid = {...}` gán trực
   tiếp KHÔNG có tác dụng vì `navigator.hid` là getter-only trên
   Navigator.prototype (sloppy mode bỏ qua lặng lẽ) — DevicePicker quét
   được 0 thiết bị dù mock trả 1. Đổi sang `Object.defineProperty`
   (cả `gen-mock.ts` lẫn `mock-init.js` tái sinh, builder vẫn khớp
   byte-identical, checksum 196). Bài học: stub API của trình duyệt phải
   defineProperty, đừng gán trực tiếp.
9. **Kiểm chứng:** build sạch (bundle 467 kB, gzip 146 kB), **75/75 tests**,
   **verify25 100/100 PASS** (màn chọn thiết bị, loading 5s, shy-moth-10,
   subtitle đã xóa, preset, khóa lướt, Khác 2 cột, ngắt → về màn chọn),
   scan 3 cỡ sạch (1366 scrollH 768, 1920 scrollH 1080, mobile scrollW
   390; 0 tag đè nhau, 0 tag ngoài stage, 0 lỗi console). Lưu ý đo: số
   scrollH 1920 đọc lúc animation `app-enter` còn chạy sẽ nhầm 1080+24
   (translateY 24px) — đo sau khi animation xong mới đúng.
10. **Giới hạn trung thực (không đổi):** setKeys/macro ghi xuống chuột thật
    vẫn CHƯA kiểm chứng live; độ mịn pin cần bro chạy Live dài mới biết;
    không LED; không cập nhật firmware (đừng lên V3.1.2); Bluetooth không
    tới được qua WebHID nên icon BT không bao giờ sáng.

## v2.4 — DPI y như ảnh bro gửi + bấm nút nào ăn ngay + toast thay Activity Log + mượt (2026-11-08 10:10–10:5x)

1. **DPI designer lại y như ảnh 1 bro gửi:** 6 nấc màu (800 đỏ / 1.600
   xanh lá / 2.400 xanh dương / 3.200 tím / 6.400 vàng / 12.000 cyan),
   radio tròn phía trên mỗi nấc, nấc đang chọn có chữ "Current DPI" +
   viền xanh + glow; thanh trượt Slow↔Fast với tick 200–12000 và nút
   "Restore default settings" góc phải. **Kéo thanh:** fill đổi màu dần
   (hue xanh→đỏ theo DPI) và nấc "Current DPI" nhảy theo nấc gần nhất
   ngay lúc kéo; thả ra (hoặc sau 250ms) mới ghi 1 lần xuống chuột
   (không spam ~50 lệnh/kéo). Bấm nấc = ghi ngay. Không còn nút Lưu /
   Hoàn tác ở trang DPI.
2. **Bấm nút nào ăn ngay nút đấy, không hoàn tác — áp cho toàn app:**
   Hiệu năng (polling, ngủ đông, hướng lăn, line correction), DPI,
   gán phím đều ghi thẳng qua setConfig/setKeys đã chứng minh live;
   ghi hỏng thì UI trả lại giá trị cũ. Slider ngủ đông ghi sau 250ms
   debounce; slider DPI ghi 1 lần lúc thả.
3. **Hiệu năng gọn, ít chữ, vừa khung không lướt:** 4 card compact
   (polling 4 nút 1 hàng; "Never sleep" nhét chung hàng tiêu đề Ngủ
   đông; không còn dòng "Byte 51 = ..." hay đoạn giải thích dài) —
   đo được scrollHeight = clientHeight = 513px ở 1366x768, **không
   cuộn**. GlassCard/PageHead/Toggle có thêm prop `compact`.
4. **Macro gọn + popup làm mờ nền:** nút ngắn ("+ Tạo macro" / "Ghi
   xuống chuột" — không còn rớt dòng), không còn đoạn giải thích lệnh
   `[240, 13, …]`; bấm Tạo macro mở modal giữa màn hình, nền sau mờ
   (`backdrop-blur-sm` + đen 60%), có tên macro / danh sách bước / Ghi
   phím / + Chờ X ms / + Bấm chuột trái.
5. **Activity Log XÓA HẾT — thay bằng toast ngắn ở ĐẦU trang:**
   mỗi thao tác hiện 1 banner ngắn (tối đa 3, tự tắt 4.5s) theo đúng
   hiệu ứng CSS của Uiverse **empty-wolverine-58** (Cybercom682) mà bro
   link — lấy nguyên văn từ trang uiverse.io (repo galaxy mirror
   KHÔNG có element này, đã kiểm chứng bằng git ls-tree + raw 404):
   `border-l-4`, nền pastel, chữ đậm, icon SVG, hover scale-105.
   Khác nguyên văn: bỏ biến thể `dark:` (app không dùng Tailwind
   `dark` class); icon ok/err đổi thành check / tam giác cảnh báo
   cùng kiểu stroke (gốc dùng chung 1 icon "i" cho cả 4 loại).
   Bug tìm được lúc verify v2.4: mỗi lần ghi hiện **2 toast trùng**
   (backend `onLog` sinh ra cho Activity Log + `pushToast` của store)
   — fix: `backend.onLog` không nối vào toast nữa (nó mặc định no-op).
6. **TopBar:** xóa 2 pill FW + Pin (đã có ở dock dưới); thêm cụm
   icon chế độ: **Wifi = 2.4G**, **Cable = dây**, **Bluetooth** —
   icon của chế độ đang dùng sáng cam, còn lại mờ. Lưu ý trung thực:
   app chỉ tới được chuột qua wired/2.4G (WebHID vendor filter),
   nên icon Bluetooth hiện có mặt nhưng chưa bao giờ sáng — chưa có
   đường Bluetooth. Nút **Ngắt** giờ hỏi xác nhận: "Bạn có muốn ngắt
   kết nối với thiết bị này?" — nút **Đồng ý** / **Hủy**.
7. **Mượt (bro kêu lướt lag):** thủ phạm chính là `backdrop-filter`
   blur trên các phần tử LUÔN HIỆN — 4 dock blur(18px) saturate(1.2),
   nút ghost blur(8px), stripe blur(12px), blue-glass blur(10.5px
   trên nền ĐẶC = tốn chi phí mà không đổi gì) — **xóa hết, thay bằng
   nền đặc hơn một chút** (dock rgba(255,255,255,0.82)). Giữ
   backdrop-blur CHỈ ở overlay modal (hiện thoáng qua, bro yêu cầu
   mờ nền ở đó). Ảnh chuột PNG 634KB → **WebP 36KB** (nền trong suốt
   giữ nguyên). `will-change: transform` cho marquee + viền xoay.
   Hiệu ứng NHIỀU hơn nhưng chỉ dùng transform/opacity (chạy trên
   GPU) — không còn hiệu ứng nào tốn paint.
8. **Bug tìm được lúc verify v2.4 (nghiêm trọng):** sau khi mở/đóng
   modal macro, bấm tab **Khác không đổi nội dung** (state đã đổi —
   `aria-current="page"` có trên nút Khác — nhưng content cũ không
   unmount, content mới chất đống bên dưới). Nguyên nhân:
   `AnimatePresence mode="wait"` kẹt exit. Fix: bỏ AnimatePresence ở
   tab content, thay bằng `key={tab}` + animation CSS thuần (`tabIn`,
   chỉ opacity/transform) — không còn exit tracking để kẹt, và mượt
   hơn. Tab Khác đã pass lại trong full sequence.
9. **Kiểm chứng (mock HID stateful, uitest/):** build sạch, **75/75
   test**, **75/75 check** (DPI 6 nấc + slider đổi màu + ghi ngay,
   Hiệu năng vừa khung không lướt, macro modal + nút ngắn, Activity
   Log đã xóa + toast đầu trang, TopBar không FW/Pin + icon chế độ +
   Ngắt hỏi Đồng ý/Hủy, gán phím Copy→Cut, tour full sequence qua
   tab Khác, 0 lỗi console), scan 3 cỡ: 1366x768 scroll=768,
   1920x1080 scroll=1080, mobile 390 scrollW=390 (scrollH mobile
   2603 — ngắn hơn v2.3 nhờ xóa Activity Log + gọn trang), 0 tag đè
   nhau, 0 tag ngoài stage, 0 lỗi console.
10. **Giới hạn trung thực:** ghi phím/macro vẫn chưa chứng minh trên
    chuột thật; độ hạt pin vẫn cần bro chạy Live dài; không có LED;
    không update firmware; Bluetooth chưa tới được qua WebHID.

## v2.3 — ảnh thật thay mô hình 3D + xóa text thừa + polling có hiệu ứng (2026-11-08 09:20–09:3x)

Bro chửi tiếp, lần này đúng hết:

1. **Mô hình 3D dựng lại "quá ngu" — bỏ hẳn, thay bằng ẢNH THẬT.**
   Ảnh sản phẩm M3 Pro (707×1373, nền trong suốt) làm "mô hình" luôn:
   `public/mouse-m3pro.png`. Vị trí các nút = số đo thật từ ảnh (PIL/numpy,
   không đoán): con lăn tâm (0.49, 0.19), nút DPI (0.49, 0.36), nút hông
   trên (0.033, 0.40), nút hông dưới (0.048, 0.54), tấm trái/phải
   (0.28, 0.20)/(0.72, 0.20). Nhãn viền mảnh + kẻ nối chéo + chấm trên
   nút giữ nguyên kiểu ảnh 2; bấm vào nút trên ảnh (vùng bấm vô hình 44×44
   tâm = neo đo thật) thì mở popup gán phím như cũ. Three.js ĐÃ GỠ khỏi
   package (bundle 461KB, nhẹ hơn ~150KB), `Mouse3D.tsx` đã xóa.
2. **Xóa text thừa, tốn diện tích:** 2 dòng stage header ("[MOUSE // M3
   PRO] PAW3311 · 12000 DPI..." + dòng hint "Bấm 1 nút trên chuột...") —
   XÓA; caption "Mô hình 3D dựng từ số đo... không phải ảnh chụp" — XÓA
   (giờ là ảnh thật nên caption đó sai); footer dài "SMAILWOLF M3 Pro —
   Driver remake..." — XÓA (các giới hạn trung thực vẫn ghi đúng chỗ
   trong từng tab). Panel: **Create / Import / Onboard configuration XÓA
   khỏi đầu panel** — thanh menu 4 mục chính nằm NGAY DƯỚI header M3;
   chức năng profile (lưu/nhập) đã có đủ trong mục Khác → Profile.
3. **Nút polling rate bắt buộc phải có hiệu ứng, cấm để mặc định.**
   Chọn từ repo Uiverse/galaxy bro gửi: **animated-border-radio
   serious-monkey-58** (viền gradient xoay) — cơ chế nguyên văn (2 dải
   conic xoay sau lớp trong inset 2px, chỉ còn viền 2px xoay quanh nút),
   đổi sang cam/vàng. Nút đang chọn = nền cam đặc + viền xoay; nút chưa
   chọn = viền mờ. Áp dụng cho cả polling rate lẫn hướng lăn. Glitch
   radio (lucky-bobcat-25) đã xóa từ v2.2, không dùng lại.
4. **Logo:** icon chuột cam ở ảnh 3 chỉ là glyph lucide tao tự chọn —
   KHÔNG phải logo đúng. Logo đúng là wordmark **SMAILWOLF** của app gốc
   (`public/logo.png`, header app gốc dùng đúng file này). CẢNH BÁO:
   `svgs/logo.svg` trong frontend gốc là logo **MCHOSE 迈从** (hãng khác)
   — suýt dùng nhầm, đã kiểm chứng bằng grep trong chunk 515 trước khi
   chốt.
5. **Bug tìm được lúc verify v2.3:** wordmark 186px + subtitle 257px làm
   cụm logo topbar rộng 453px → tràn ngang 79px ở mobile 390. Fix:
   cụm logo `min-w-0` (bỏ `shrink-0`) để subtitle tự xuống dòng ở mobile.
6. **Kiểm chứng (mock HID stateful, uitest/):** build sạch, **75/75
   test**, **45/45 check** (ảnh thật hiện + không còn canvas 3D, menu
   ngay dưới header, Create/Import/Onboard đã xóa, Profile có trong Khác,
   spin-border trên nút đang chọn, 2 dòng header + hint + footer + caption
   đã xóa, gán phím Copy→Cut end-to-end, DPI cố định, 0 lỗi console),
   scan 3 cỡ: 1366x768 scroll=768, 1920x1080 scroll=1080, mobile 390
   scrollW=390, 0 tag đè nhau, 0 tag ngoài stage, 0 lỗi console.
7. **Giới hạn trung thực:** ảnh là ảnh sản phẩm (không phải scan chuột của
   bro — nhưng là đúng mẫu M3 Pro); ghi phím/macro vẫn chưa chứng minh
   trên chuột thật.

## v2.2 — layout mới theo yêu cầu của bro + polling hết lỗi glitch (2026-11-08 08:52–09:0x)

Bro chửi 4 điểm, cả 4 đều đúng:

1. **Panel phải đẩy sát lên dưới SMAILWOLF M3 PRO.** Nav trên cùng đã XÓA
   sạch ([Dashboard][DPI][Gán phím][Hiệu năng][Macro][Khác] không còn trên
   topbar). Panel trái giờ bắt đầu ở y=60, ngay dưới header. **4 dock DPI /
   Polling / Pin / Firmware dồn hết sang cột phải, xếp 2 ô 1 dòng (2x2)**,
   chuột 3D nằm dưới chúng.
2. **6 tab gộp thành 4 mục trong panel, tiếng Việt, mỗi mục có icon đằng
   sau label:** Gán phím ⌨ (Keys + Macro gộp chung — Macro nằm ngay dưới
   danh sách phím), DPI ◐, Hiệu năng ⚡, Khác ⚙ (Dashboard "Thiết bị & pin"
   + Others gộp chung). Tab mặc định là Gán phím. Dòng Onboard bấm vào thì
   sang mục Khác.
3. **Hiệu ứng polling rate lỗi.** Glitch radio cyberpunk (Uiverse
   lucky-bobcat-25) đã XÓA HẲN (component + toàn bộ CSS `.uiv-g-*`): trạng
   thái chọn của nó là 1 vạch đỏ đặc ngang cả hàng, hiệu ứng glitch gần như
   không thấy — đúng như bro chửi "hiện có một tí". Thay bằng **segmented
   control sạch**: mục chọn = nền cam đặc + chữ trắng, mục chưa chọn = viền
   mờ trên nền tối. Hướng lăn cũng đổi sang segmented control luôn.
4. **Bug tìm được lúc verify v2.2:** tăng tỉ lệ lấp đầy chuột 0.82 → 0.88
   (để bù canvas ngắn lại vì dock 2x2) làm 2 tag trên (LEFT/MIDDLE BUTTON,
   dy âm) bị cắt khỏi mép trên canvas — scan cũ KHÔNG bắt được vì chỉ đo
   tag đè nhau, không đo tag nằm ngoài stage. Đã thêm check
   `tagsOutsideStage` vào scan. Fix: giữ fill 0.82 + giảm dy 2 tag trên
   (−24→−12, −32→−20). Chuột ở 1366x768 nhỏ hơn v2.1 một chút — đó là cái
   giá của layout dock 2x2 mà bro chọn (canvas ngắn lại 402→302px).
5. **Kiểm chứng (mock HID stateful tái tạo lại, đã chuyển vào
   `uitest/` trong workspace để VM thay thế không xóa mất):** build sạch,
   **75/75 test**, **36/36 check** (nav đã xóa, panel y=60, dock 2x2 đúng
   cột phải, segmented 125→250 Hz + lưu + log, gán phím Copy→Cut
   end-to-end, DPI cố định, Khác có Thiết bị & pin + firmware, 0 lỗi
   console), scan 3 cỡ: 1366x768 scroll=768, 1920x1080 scroll=1080, mobile
   390 scrollW=390, 0 tag đè nhau, **0 tag ngoài stage**, 0 lỗi console.
6. **Giới hạn trung thực:** mô hình 3D vẫn dựng lại từ số đo + ảnh 2,
   không phải scan; ghi phím/macro vẫn chưa chứng minh trên chuột thật.

## v2.1 — vừa 1 viewport + mô hình 3D đúng chuẩn ảnh 2 (2026-11-07 23:4x–00:0x)

Ethan chửi đúng 3 điểm, cả 3 đều do tao không đo ở màn 1366x768 của bro:

1. **Trang tràn viewport, lướt trong khung.** Đo bằng máy: page scrollHeight
   1156 so với viewport 768 (panel thò 258px dưới màn hình), panel còn có
   scroll riêng trong tab. Nguyên nhân gốc: panel `max-h: calc(100vh-2rem)`
   nhưng grid bắt đầu 242px dưới đầu trang → panel luôn thò ra ngoài; các
   khối cố định trong panel bị `flex-shrink` bóp (dòng Onboard chỉ còn 38px,
   chữ bị cắt — đúng cái "lòi" bro thấy). **Fix:** shell `h-dvh +
   overflow-hidden` ở desktop, topbar/dock gọn lại, main `flex-1`, panel
   `h-full` với mọi khối cố định `shrink-0`, chỉ nội dung tab được cuộn,
   Activity Log gập được (mặc định 1 dòng mới nhất, bấm mở ra). Dải
   annotation chỉ hiện ở màn ≥1536px.
2. **Mô hình chuột v2.0 như quả trứng.** Đo lại từ ảnh 2 (chuột thật nhìn
   từ trên): thân thon hơn (rộng/dài 0.49), hai bên gần song song, bevel nhỏ
   lại; 2 tấm nút có rãnh giữa thật (khe 0.30 — v2.1 lần đầu khe 0.16 bị
   bevel lấp kín nên không thấy đường giữa) + rãnh ngang mép sau tấm; con
   lăn **có gân** (16 gân quanh trụ, nhìn từ trên thấy vạch ngang như ảnh 2);
   nút DPI thành capsule đen; nút hông thành capsule dọc hơi lồi; tag đổi
   sang kiểu ảnh 2 (viền mảnh, nền trong, chữ mực) + kẻ nối chéo nhẹ
   (tag so le dy ±24/±32 vì 3 chấm bên phải chỉ cách nhau ~20px).
3. **Mobile tràn ngang 132px.** Nguyên nhân: grid 1 cột `auto` bị
   max-content của nút Reset/caption đội lên 488px, panel + stage giãn theo.
   **Fix:** cột `minmax(0,1fr)` + `min-w-0` + leader cắt ngắn theo chiều
   rộng khung (tag không bao giờ tràn).
4. **Bug tìm được lúc verify v2.1:** chuột scale theo khung kiểu `h/640`
   làm chuột chỉ còn 162px trong khung 381px → nhãn dồn lại đè nhau; scale
   đúng phải lấp đầy ~82% chiều cao khung, giới hạn thêm theo chiều rộng.
   Anchor nút hông cũ (x=3.5) nằm ngoài capsule mới (tới 3.35) nên click
   test trượt — dời về 3.15.
5. **Kiểm chứng (scan đo bằng máy, 3 cỡ):** 1366x768 page scroll = 768
   (KHÔNG scroll), 1920x1080 = 1080, mobile 390px scrollW = 390 (hết tràn
   ngang), 0 nhãn đè nhau ở cả 3 cỡ, 0 lỗi console/page, build sạch,
   **75/75 test**, **27/27 check** (gán phím Copy→Cut end-to-end vẫn chạy).
   Ảnh chụp kèm: 1366x768 + 1920x1080 + crop chuột 2x.
6. **Áp dụng skill ui-ux-pro-max lần này:** query design-system density 9
   → Data-Dense Dashboard (tối thiểu padding, tối đa dữ liệu vừa màn hình);
   §5 Layout (không horizontal scroll, vừa viewport), §2 touch 44px giữ
   nguyên, §1 contrast 4.5:1.
7. **Giới hạn trung thực:** mô hình 3D vẫn là dựng lại từ số đo + ảnh 2,
   không phải scan; ghi phím/macro vẫn chưa chứng minh trên chuột thật.

## v2.0 — đại cải tổ giao diện "TRANSISTOR" (2026-11-07 22:51–23:2x)

Theo đúng 4 ảnh bro gửi:

1. **Nền giấy + lưới kỹ thuật (ảnh 1):** giấy be #E9E7E2 + lưới mờ 56px,
   headline Oswald, chú thích mono Fira Code — chip/transistor đã XÓA,
   thay bằng **mô hình 3D chuột M3 trắng** (Three.js, dựng từ số đo thật:
   thân extrude, 2 tấm nút, con lăn, nút DPI, 2 nút hông). Chuột **đứng yên**
   (không tự xoay — bro dặn), bấm vào 1 nút trên chuột (hoặc nhãn của nó)
   là mở popup gán phím.
2. **Khung navy bo tròn bên trái (ảnh 3):** panel #17172B, header "● M3",
   nút **+ Create** (cam) + **Import** (xuất/nhập JSON cấu hình), dòng
   "Onboard configuration" vạch cam, chứa cả 6 tab + Activity Log ở đáy.
3. **Popup gán phím (ảnh 4):** panel tối, 4 tab **System / Keyboard /
   Instruction / Macro**, đủ catalog hành động của app gốc (Chuột 8, Sửa 3,
   Đa phương tiện 8, Hệ thống 12 — xem `../PROTOCOL.md` §8.7). Bấm chọn 1
   hành động → popup **bay vào khung cấu hình bên trái** (framer-motion)
   rồi mới ghi xuống chuột qua `saveKeys` + đọc lại kiểm chứng. Nút DPI
   cố định, không gán lại được (app gốc cũng vậy).
4. **4 dock kính mờ trên cùng (không copy y ảnh 1):** DPI hiện tại /
   Polling / Pin / Firmware — kính sáng `backdrop-filter` trên nền giấy,
   giá trị Oswald 30px.
5. **Hiệu ứng cũ (teal glass v1.x) bỏ hết.** Galaxy đợt 2: radio glitch
   (polling + hướng lăn), công tắc nguồn neon (Line correction), toast
   trượt, loader rắn vuông, card sọc (macro), card kính xanh (firmware),
   nút blob (nút phụ trong panel tối). Font **tự host** trong
   `public/fonts/` (Oswald + Fira Code + Fira Sans, SIL OFL) — app chạy
   offline, không cần Google Fonts.
6. **Bug tìm được lúc verify v2.0 (đã sửa):** handler click của canvas 3D
   giữ closure `onPartClick` cũ từ lúc mount (`connected=false`) nên bấm
   nút 3D khi đã kết nối vẫn hiện "Chưa kết nối" — fix bằng ref luôn trỏ
   bản mới nhất; nhãn 3D chặn pointer event nổi bọt để 1 click không gọi
   2 lần. Nhãn 3D giờ có đường kẻ nối (leader line) kiểu ảnh 2, tag nằm
   ngoài thân chuột, không đè lên nhau (đã đo bằng Playwright: 0 va chạm).
7. **Kiểm chứng (Chrome headless + chuột HID giả nói đúng protocol, có nhớ
   trạng thái ghi):** build sạch, **75/75 test** (61 cũ + 14 mới: keyName
   scroll/consumer + catalog), **27/27 check headless PASS** (render WebGL
   thật, 4 dock đúng số live 1.600/125Hz/100%/2.1.3, bấm nút hông Copy →
   popup mở → gán Cut → log "Đã gán Tiến → Keyboard: Ctrl+X" + nhãn 3D
   đổi thành Cut, bấm DPI hiện ghi chú cố định, đủ 6 tab, **0 lỗi
   console/page**). Ảnh chụp kèm trong thư mục test.
8. **Giới hạn trung thực:** mô hình 3D là dựng lại từ số đo, không phải
   scan chuột thật; ghi phím/macro qua popup vẫn dùng đường `saveKeys`/
   `writeMacros` — ghi config đã chứng minh live, **ghi phím/macro chưa
   chứng minh trên chuột thật** (cần bro bấm Live); pin vẫn chỉ mịn bằng
   byte chuột tự báo; không LED, không cập nhật firmware (theo thiết kế).

## v1.2 — pin đo chuẩn theo thời gian thực (2026-11-07 22:2x)

1. **Vì sao pin v1.0/v1.1 "báo sai sự thật":** app gốc chỉ hỏi pin đúng 1
   lần lúc khởi động, không bao giờ hỏi lại — bản remake copy y chang nên
   pin thật tụt mà màn hình vẫn 100%. Lỗi là **số liệu cũ**, không phải đo sai.
2. **Fix:** ở chế độ Live, app tự hỏi pin mỗi 30 giây (lệnh report 48 qua
   serial queue) + ghi lịch sử kèm giờ (chỉ ghi khi % đổi, tối đa 120 mục)
   + nút "Đọc pin ngay". Chuột ngủ không trả lời thì giữ % cũ, log 1 lần.
   Demo KHÔNG tự hỏi pin — giữ nguyên giá trị mẫu, không bịa đường tụt.
3. **Giới hạn trung thực:** nguồn duy nhất là byte 7 của report 48, app gốc
   hiện thẳng số đó, không có điện áp, không có cách đo mịn hơn phần cứng.
   Độ mịn thật của byte pin (từng % hay theo bậc) chưa biết — mọi lần đọc
   live tới nay đều là 100%; chạy Live lâu sẽ thấy bậc tụt thật trong lịch sử.
4. **Chứng minh bằng chuột HID giả nói đúng protocol:** poll 30/60/90 giây
   về đúng 99/98/97%, log "Pin: 100% → 99%" v.v., "Đọc pin ngay" về 96%,
   Demo 12 giây lịch sử vẫn 1 mục, 0 lỗi console/page.

## v1.1 — sửa 2 lỗi Ethan báo live (2026-11-07 22:06)

1. **Nút bấm có lớp kính lỏng đè lên, bấm không ăn.** Nguyên nhân: nút v1.0
   dùng cấu trúc 2 lớp của Uiverse `modern-bear-96` (text kính + BG gradient
   lệch 6px, `z-index:-1`). Trong card có `backdrop-filter`, 2 lớp tách ra:
   lớp kính sáng nổi lên trên nút, lớp gradient chìm xuống dưới — nhìn như
   kính lỏng đè lên nút; dải gradient lòi ra 6px dưới nút bấm không ăn (rơi
   xuống card). Đã tái hiện bằng Chrome headless (Playwright): chụp được
   đúng lớp kính lệch như ảnh bro gửi; bấm vào dải dưới nút thì chết, bấm
   giữa nút thì ăn. **Fix:** bỏ hẳn lớp BG, nút chỉ còn 1 lớp duy nhất
   (gradient/kính vẽ thẳng lên nút) — nhìn sao bấm vậy. Kiểm chứng lại
   bằng Chrome headless: bấm 5 điểm trên nút (4 góc + giữa) đều ăn, DPI
   đổi nấc đúng, `elementFromPoint` tại tâm nút trả về chính nút; click-through
   đủ 6 tab (DPI preset + lưu, modal gán phím, toggle line correction + lưu,
   tạo macro + ghi phím A + lưu, Others checksum OK) — **0 console/page error**.
2. **App tự nhận “Đã kết nối” dù chưa xin quyền gì — nhìn như bịa đặt.**
   v1.0 tự bật Demo khi mở app. **Fix v1.1:** app mở ở trạng thái **Chưa kết
   nối**, bro chọn rõ ràng “Dùng thử Demo (mô phỏng)” hoặc “Kết nối chuột
   thật (WebHID)” (Live sẽ mở hộp thoại xin quyền chọn thiết bị của trình
   duyệt). Ở Demo, mọi chỗ đều ghi rõ “Demo (mô phỏng) — không phải chuột
   thật, không xin quyền”: badge `DEMO · MÔ PHỎNG`, sidebar “Demo đang chạy
   (mô phỏng)”, log/toast đều tiền tố `Demo (mô phỏng):`, không còn dòng nào
   nói “ghi xuống chuột” khi đang ở Demo.

## Sau này bê sang app thật

Frontend này bê nguyên sang **Tauri 2 + WebHID** được (đúng stack app gốc, nhẹ hơn
Electron). Chỉ cần thay `LiveMouse` dùng WebHID của WebView2 — code protocol giữ nguyên.
