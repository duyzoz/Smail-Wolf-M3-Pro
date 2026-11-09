# SMAILWOLF M3 Pro — Landing Page

Trang landing cho driver remake. HTML + CSS + JS thuần — **không framework, không WebGL, không thư viện animation ngoài**. Toàn bộ font/ảnh tự host trong `assets/` nên trang chạy offline và không gọi ra ngoài.

## Chạy thử local

```bash
cd landing
python3 -m http.server 8903 --bind 127.0.0.1
# mở http://127.0.0.1:8903/
```

## Cấu trúc

| File | Vai trò |
| --- | --- |
| `index.html` | Nội dung + cấu trúc 6 khung: Hero, Mổ xẻ, Chip, Thông số, Skin, Driver, Tải xuống |
| `styles.css` | Design system (paper / navy / cam — theo driver) + toàn bộ animation CSS |
| `app.js` | Motion engine: SplitText, BlurText, ScrollReveal, TiltedCard, đếm số, **video scrub ở hero**, **kệ skin kéo ngang** |
| `assets/` | Ảnh WebP + font woff2 + **đủ 67 skin full-res 944×1667** + bản thumb 320px (`assets/skins/thumbs/`, dùng cho kệ để decode nhanh) + 61 khung hình 1280×720 cắt từ video mổ xẻ (`assets/explode/`) |

## Ngôn ngữ chuyển động (đã đọc repo gốc)

- **React Bits** (DavidHDev/react-bits, MIT): SplitText, BlurText, ScrollReveal, TiltedCard, Galaxy, ShinyText — hiệu ứng được viết lại bằng CSS/JS thuần cho đúng chất, không kéo React vào trang tĩnh.
- **ThreeUI** (MengTo/threeui, MIT): đã đọc — đây là catalog shader Three.js; KHÔNG dùng cho trang này vì bro cấm vẽ model 3D (nhìn nhựa). Chỉ lấy tinh thần chiều sâu/ánh sáng.
- **Uiverse Galaxy**: nền sao bằng CSS thuần (gradient + drift), không WebGL.
- **Video tham chiếu**: TikTok cuộn-càng-cuốn (zoom in/out theo cuộn) + kệ VHS Leon Vasari (hàng ngang phối cảnh 3D, bấm vào thì zoom chi tiết bằng wipe tròn) — kệ skin làm đúng kiểu này.

## Tối ưu máy yếu (đây là yêu cầu bắt buộc)

- Không Three.js / GSAP / React — 1 file JS ~13 KB, 0 request ngoài.
- Mọi animation chỉ dùng `transform` / `opacity` / `filter` (compositor-only, không layout).
- Một vòng lặp rAF duy nhất cho scroll; listener `passive`; IntersectionObserver chỉ bật hiệu ứng khi khung vào viewport.
- Ảnh WebP, lazy-load trừ hero, `width`/`height` khai báo sẵn (không CLS).
- Tổng cả trang ~1,7 MB (ảnh skin lazy-load, trên màn đầu chỉ ~400 KB).
- `prefers-reduced-motion`: tắt hết chuyển động, hiện trạng thái cuối.

## Nội dung — chỉ ghi sự thật đã kiểm chứng

PAW3311, DPI 800–12000 (6 nấc), polling 2.4G 125/250/500/1000 Hz, dây 1000 Hz, BT 125 Hz, pin 500 mAh, 3 chế độ kết nối, 6 phím gán được, chip FR2012 48 MHz, firmware gốc 2.1.3. Pin trong app là **ước tính** (chuột không có chip đo pin) — ghi rõ trên trang, không giấu.

## Hero — video mổ xẻ, cuộn để xem (hiệu ứng chính)

Hero dùng **chính video Kling AI mổ xẻ chuột của Ethan, bản không watermark** (5 giây, 1280×720), cắt thành **61 khung hình WebP 1280×720** (`assets/explode/f01..f61.webp`, 12 fps, tổng 1,5 MB — giữ nguyên độ phân giải gốc, không upscale). Video **full-bleed, tràn trọn vẹn khung web** — chữ SMAILWOLF M3 PRO nằm đè lên trên video (chỉ còn tên + 2 nút, không còn câu mô tả). Cuộn chuột = chạy video **đảo ngược**: mở đầu là chuột hoàn chỉnh, càng cuộn các linh kiện càng bung ra từng cái một, kiểu morph (linh kiện bung ra → zoom vào cảm biến PAW3311 phát sáng tím → bung hết). Chữ SMAILWOLF M3 PRO cũng zoom theo cuộn (to dần + trồi lên + mờ dần), không đứng yên. Thanh tiến độ cam chạy theo cuộn. Trên điện thoại, chữ dồn xuống đáy trên nền tối dần từ dưới lên.

**Chống chớp nháy:** video được vẽ bằng `<canvas>` + `drawImage()` từ 121 khung hình đã preload (24 fps, 1280×720, q85) thay vì đổi `src` của `<img>`. Đổi `src` là nguyên nhân chớp nháy: trình duyệt gỡ khung cũ ngay và chỉ hiện khung mới khi decode xong — trên GPU yếu decode chậm hơn cuộn nên cứ nhấp nháy. `drawImage()` vẽ đồng bộ từ ảnh đã decode nên không bao giờ có khung trống. (Bug v4 đi kèm: handler `onload` dùng biến vòng lặp `var im` nên chỉ khung cuối được `decode()` — đã sửa bằng `this.decode()`.)

Vì là ảnh tĩnh đổi theo cuộn (không phải `<video>` seek) nên máy yếu vẫn mượt — không decode khi cuộn, chỉ đổi `src` của ảnh đã preload. Khung hình tải nền, có đếm `n/61`; `prefers-reduced-motion` thì hiện thẳng chuột đã lắp ráp.

Muốn đổi video khác: thay file video rồi chạy lại lệnh cắt khung (ffmpeg) với cùng tên `f%02d.webp`, giữ nguyên 61 khung hoặc sửa `FRAMES` trong `app.js`.

## Kệ skin — cuộn dọc, kéo ngang, chuột thật cắt nền

Không còn thanh topbar cố định — video hero tràn tới mép trên của trang, chỉ còn vạch tiến độ cam 3px ở trên cùng.

**v7 — toàn trang tiếng Anh + hero góc trái + Morph:** toàn bộ text trong web đã dịch sang tiếng Anh (nút, kicker, tiêu đề, specs, footer, aria-label — kiểm chứng bằng quét `innerText`, 0 ký tự tiếng Việt; chỉ còn 1 dòng comment trong `app.js`). Tiêu đề hero + 2 nút dời lên góc trái trên cùng (x = 56px), không còn đè lên thân chuột. **Morph kiểu PowerPoint:** khi cuộn, tiêu đề hero trượt + thu nhỏ dần về đúng vị trí của tiêu đề kệ skin (`measureMorph()` đo live từ layout: tâm ngang về giữa màn hình, thu 1 → 0.6, mờ dần 1 → 0) rồi nhường chỗ cho heading kệ skin bay chữ lên — 2 nút rời đi sớm hơn (mờ hết ở p = 0.4). Chữ cuộn chỉ còn `SCROLL`. Mobile giữ chữ ở dưới cùng như cũ.

**v8 — FX PACK (free rein, Ethan 2026-11-09 20:53):** 13 hiệu ứng từ react-bits / threeui / galaxy, vanilla, không thư viện: StarBorder (viền sáng chạy quanh nút Download), Galaxy (sao nhấp nháy ở download + footer, canvas, tắt khi ngoài màn hình), Aurora (2 vệt màu trôi), CircularText (chữ xoay quanh chuột ở khung download), ShinyText (ánh quét qua tiêu đề Download), DecryptedText (dòng footer giải mã dần rồi hiện rõ), ClickSpark (bấm đâu là tóe lửa ở đó), CursorGlow (đốm cam theo chuột), Magnetic (nút hút nhẹ về phía chuột), DotGrid (chấm blueprint ở chip + specs), Glass card (thẻ download kính mờ), AnimatedList stagger (danh sách tính năng hiện lần lượt), Ribbon (dải gradient chảy trước khung download). Tất cả chỉ dùng transform/opacity/canvas, 1 rAF chung tự dừng khi không có việc, tắt hẳn khi reduced-motion. Sửa kèm: nút Portable từng bị chữ navy trên nền tối (khó đọc) → đổi sang chữ giấy. Số count-up đổi sang định dạng en-US (12,000 thay vì 12.000). BUG NẶNG BẮT ĐƯỢC KHI VERIFY: lần chèn đầu đặt cả khối FX *bên trong* hàm `tiltLoop` (chèn trước `})();` đầu tiên thay vì cuối file) nên nó chạy lại mỗi 400ms — observer phình 6 → 26, interval giải mã nhân 10 bản đua nhau ghi đè chữ footer; đã dời khối FX ra cuối file (top-level IIFE) + đổi tên `finePointer` bị trùng. Bài học: không bao giờ chèn code trước `})();` đầu tiên — phải chèn trước `})();` CUỐI CÙNG.

**v9 — MORE SCROLL + MORE ELEMENTS + FIX LAG (Ethan 2026-11-09 21:16):** hiệu ứng scroll mới: parallax + xoay theo cuộn cho ảnh chip và chuột download, clip-path wipe reveal cho ảnh chip + ảnh app, thanh progress đổi thành gradient cam → tím. Element mới: MagnetLines (lưới vạch ở khung specs, cong về phía chuột), ImageTrail (chuột rê qua kệ skin là có ảnh skin bám theo rồi mờ dần), PixelTrail (vệt ô vuông cam/trắng sau chuột), GlitchText (tên brand ở footer glitch khi rê chuột), RotatingText (dòng "Measured on the real mouse" xoay qua 5 chỉ số đã kiểm chứng: DPI, polling, battery, keys, skins). FIX LAG (bước cuối): nút magnetic cache rect thay vì đọc layout mỗi lần rê chuột; galaxy vẽ lại mỗi 3 frame thay vì mỗi frame + giảm sao 140 → 100; animation CSS tạm dừng khi section ra khỏi màn hình; `content-visibility: auto` cho chip/specs/driver/download/footer (trình duyệt bỏ qua việc render các section ngoài màn hình); tất cả resize handler debounce 150ms; ImageTrail dùng pool 10 ảnh tái chế thay vì tạo/xóa DOM. BUG NẶNG BẮT ĐƯỢC KHI VERIFY (2 cái, đã sửa): (1) clip reveal chết hoàn toàn vì IntersectionObserver tính theo vùng *nhìn thấy được* — ảnh bị clip-path che kín thì ratio = 0 nên IO không bao giờ kích hoạt (deadlock); sửa bằng cách observe *section* (không bị clip) rồi mới mở clip cho ảnh. (2) Sau khi sửa (1), clip vẫn không mở vì `html.js .chip-media` (0,2,1) thắng `.chip-media.in` (0,2,0) — sửa thành `html.js .chip-media.in` (0,3,1). BÀI HỌC: đừng bao giờ trigger reveal bằng IO trên chính element đang bị clip/ẩn; và nhớ đếm specificity khi một class "không ăn".

**v10 — PLAN + MORE + FIX LAG (Ethan 2026-11-09 21:16 "tiếp tục tối ưu lãn thêm thật nhiều hiệu ứng" + plan landing-v9-plan.md):** v9 đã giao trước nên plan này thành v10 (không có 2 bản v9 khác nhau). Hiệu ứng scroll mới: ScrollVelocity marquee ×2 (dải chữ outline "SMAILWOLF M3 PRO • 12000 DPI • 1000 HZ • 67 SKINS •" giữa hero→skins và driver→download, trôi theo vận tốc cuộn + nghiêng nhẹ), spec-card + chip-facts stagger (hiện lần lượt 70ms, dùng thuộc tính `translate` để không đánh nhau với hover `transform`), driver-shot parallax qua thuộc tính `translate` (vì TiltedCard giữ `transform`), hero canvas zoom 1 → 1.05 theo scrub, skins centre pop 1.03 (thuộc tính `scale`, tách khỏi blur `transform`). Element thêm: nút back-to-top góc phải dưới + vòng progress tròn (SVG ring, % cuộn), download card parallax + chuột download scale 0.96 → 1.04 theo cuộn. FIX LAG (bước cuối): ScrollReveal cache `p` cuối (bỏ ~120 setProperty mỗi frame khi p không đổi), galaxy dừng hẳn khi tab ẩn (visibilitychange), tilt loop bỏ polling setTimeout 400ms (chỉ thức khi pointermove), ClickSpark 10 → 8 tia/click. Đã có từ v9 nên KHÔNG làm lại: aurora + animation pause ngoài màn hình, magnetic cache rect, galaxy cap 100 + vẽ mỗi 3 frame. Jank (longtask, cuộn full trang, headless SwiftShader — số tuyệt đối chỉ mang tính tương đối, máy thật mới là chuẩn): 1920×1080 v9 6 task/559ms/max 211ms → v10 5 task/358ms/max 82ms; 1366×768 v9 6/473ms/max 91ms → v10 5/383ms/max 95ms. BUG BẮT ĐƯỢC KHI CODE: `lastVelY = vel` (gán nhầm vận tốc thay vì vị trí) — sửa thành `lastVelY = y` ngay trước khi test. RAM máy Ethan: 2x4GB DDR3 dual-channel 8GB (đã đính chính 21:30, không phải 16GB).

**v11 — FIX LAG + MORE EFFECTS (Ethan 2026-11-09 21:42 "giữ nguyên mọi thứ, tiếp tục fix lag, máy hơi lag, thêm thật nhiều hiệu ứng, đảm bảo đọc .skill"):** đã đọc skill ui-ux-pro-max (SKILL.md + pro-rules.md + quick-reference §3: virtualize-lists / main-thread-budget / debounce-throttle). Giữ nguyên toàn bộ thiết kế + nội dung, chỉ thêm hiệu ứng và tối ưu. FIX LAG (skill Priority 3 Performance): (1) onScroll gom hết layout read vào 1 READ PHASE trước mọi style write (chống layout thrashing); (2) gộp listener cacheFxRects vào onScroll (bỏ hẳn rAF cuộn thứ 2); (3) tilt dùng rect đã đo sẵn thay vì đọc layout mỗi lần rê chuột; (4) galaxy sao 100 → 70 + vẽ mỗi 4 frame (từ 3); (5) will-change: transform cho canvas hero, chip, driver-shot, download card, chuột download, 2 vệt aurora; (6) aurora tự đóng băng sau 2s không cuộn (để backdrop-filter blur 14px của thẻ download ngừng vẽ lại mỗi frame khi rảnh — giữ nguyên blur 14px, không đổi giao diện). BUG BẮT ĐƯỢC KHI VERIFY: `cacheFxRects` khai báo trong khối `if (fxFinePointer)` nên onScroll không thấy (ReferenceError) — đã hoist lên top-level IIFE. Hiệu ứng thêm: Spotlight (ánh sáng cam chạy theo chuột trong từng thẻ spec), skin hover scale 1.06 + bấm xuống 0.97, marquee mờ dần 2 mép (mask), chip hover scale 1.02, kicker line mọc dài khi vào section (đã làm robust: trigger từ khối cha section-head/copy vì kicker 18px bị jump-scroll bỏ qua), footer link gạch chân tự vẽ khi hover, nút back-to-top bấm xuống 0.94. Jank longtask (headless SwiftShader, số nhảy giữa các lần chạy — máy thật mới là chuẩn): 1920×1080 v10 5 task/358ms/max 82ms → v11 2 task/142ms/max 77ms (lần chạy sạch); 1366×768 v10 5/383ms/max 95ms → v11 5/365ms/max 89ms.

Sau hero là kệ **đủ 67 skin**, mỗi skin là ảnh chuột thật đã tách nền (RGBA 944×1667, không khung chữ nhật, không bo tròn). Cuộn dọc kéo kệ sang ngang hết 67 con rồi mới sang khung khác; có đếm `n / 67` + tên skin đang xem + thanh tiến độ. Bấm vào con chuột để phóng to xem (không khung, chuột to trên nền kính mờ), Esc / bấm nền / nút ĐÓNG để thoát.

**Kích thước kệ đo bằng JS trực tiếp (`fitSkins()` trong `app.js`):** v3–v5 ước lượng chiều cao đầu kệ bằng con số cố định và toàn sai trên máy Ethan (font render cao hơn) nên viền đầu chuột cứ bị cắt. Giờ mọi số đo đều lấy từ layout thật (chiều cao đầu kệ, thanh tiến độ, padding, chiều cao caption — đo bằng `offsetHeight`/`getComputedStyle`), tính lại khi resize và khi font tải xong. Bug v6 đi kèm: bản đầu đo chiều cao của chính khung sticky (`min-height: 100svh` nên nó phình theo nội dung — toán vòng tròn, chuột to → khung cao → 'còn chỗ' → chuột to) — đã sửa thành đo theo `window.innerHeight`.

**Hiệu ứng blur (depth of field):** con chuột gần giữa màn hình luôn nét, càng ra xa hai bên càng mờ dần (blur 2px → 5px) + tối + nhỏ lại. Blur được gán theo 3 mức rời rạc, chỉ đổi class khi con chuột vượt ngưỡng khoảng cách — trong lúc cuộn liên tục, trình duyệt chỉ di chuyển các layer đã tính sẵn, không tính lại blur từng khung hình.

**Chống lag (máy yếu):** kệ dùng **thumb 320px** (hiển thị 260px nên vẫn nét, decode nhanh gấp ~9 lần ảnh gốc 944px — đây chính là nguồn lag khi cuộn trước đây), bấm xem to mới tải ảnh gốc 944px. Khung hero được `decode()` trước để cuộn không khựng. Blur đổi **tức thì** (không còn transition 0,35s trên `filter` — transition đó bắt GPU vẽ lại layer liên tục trong lúc cuộn nhanh, cũng gây nhấp nháy; chỉ giữ transition trên `transform` vì nó rẻ). Thanh tiến độ dùng `scaleX` thay vì `width` để khỏi trigger layout. Kích thước kệ được tính theo `100svh` với dự trữ 500px + media query màn thấp (≤860px) thu gọn đầu kệ — không bao giờ cắt viền đầu chuột (đã kiểm chứng ở viewport 1080 / 950 / 800 / 768 / 700). `prefers-reduced-motion` thì kệ thành hàng cuộn ngang thường, không blur.

## Cập nhật phiên bản mới

Khi có release driver mới, sửa 3 chỗ trong `index.html`:

1. Nút tải `.setup` (2 chỗ: hero + khung tải xuống) — link `releases/download/<tag>/<file>-setup.exe`.
2. Nút portable `.zip` + dòng SHA-256.
3. Dòng “Bản mới nhất vX.Y.Z · phát hành ngày …”.

## Deploy

Đẩy thư mục `landing/` lên repo rồi bật **GitHub Pages** (Settings → Pages → Deploy from branch → `main` → `/landing`), hoặc ném cả thư mục lên bất kỳ static host nào (Cloudflare Pages, Netlify, Vercel). Không cần build step.
