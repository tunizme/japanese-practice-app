# Minna Play

Ứng dụng học từ vựng Minna no Nihongo và luyện Hiragana/Katakana. Next.js, TypeScript, Tailwind CSS; xuất web tĩnh, không cần backend. LocalStorage `minna-play-v1` lưu bài Minna đã chọn (`selected`) và cấu hình luyện chữ (`kana`): bảng đang dùng, chế độ chữ đơn/âm ghép, các nhóm đã chọn riêng cho từng bảng và chế độ. Dữ liệu cũ được chuyển tự động, giữ bài đã chọn và loại bỏ `cards`, `autoAudio`.

## Chạy local

Yêu cầu Node.js 20.9 trở lên.

```sh
npm install
npm run dev
```

## Dữ liệu

Dữ liệu sẵn dùng nằm trong `public/data` và `public/audio`. Clone repo, cài thư viện và build là đủ; không cần chạy crawler hoặc Python. Khi bổ sung bài, cập nhật JSON theo bài, danh sách `public/data/lessons.json` và các file audio tương ứng.

Nút nghe bị vô hiệu hóa cho từ chưa có audio. Số bài, số từ và số audio lấy từ dữ liệu đã nhập. Danh sách bài tự cập nhật, hỗ trợ bổ sung đến 50 bài.

Bộ 25 bài hiện có đủ 1.035 mục có audio: 1.029 từ Langoal, 1 tái dùng file của từ/cách đọc trùng hoàn toàn, 5 được tạo bằng Edge TTS vì file nguồn trả 403 (ID 5651, 2558, 2944, 4052, 915). Dữ liệu web có `audioSource`, nút loa cho audio TTS có nhãn “giọng tổng hợp”.

Nhấn vào thẻ hoặc Space để lật; dùng hai nút mũi tên hoặc phím ← / → để chuyển thẻ. Hai mặt giữ nguyên kích thước, nội dung dài cuộn bên trong thẻ. Đầu và cuối danh sách sẽ vô hiệu hóa nút tương ứng.
Mặt trước hiển thị thêm cách đọc kana dưới từ có kanji khi dữ liệu có cách đọc. Nút loa ở góc phải phía trên thẻ phát âm thanh riêng, không lật thẻ.

Luyện kana: nhập romaji đúng để chuyển câu ngay, không chờ thông báo, không khóa ô nhập và không cần Enter. Khi đang nhập dở một đáp án hợp lệ (ví dụ `sh` trước `shi`), ứng dụng không báo sai. Nút Gợi ý ở góc phải hoặc phím Space lật chữ sang romaji; nhấn lại để ẩn. Xem gợi ý không chuyển câu, vẫn phải nhập đúng; chữ đã xem gợi ý được đưa vào danh sách cần ôn. Câu tiếp theo tự ẩn gợi ý, xóa ô nhập và giữ con trỏ để gõ liên tục.

## Deploy Vercel

Đưa repo lên GitHub cá nhân, import vào Vercel, chọn Next.js và build command `npm run build`. Trang xuất tĩnh vào `out`. Dùng tên miền mặc định để không tốn chi phí tên miền. Vercel Hobby dành cho mục đích cá nhân, phi thương mại và có hạn mức sử dụng.

## Kiểm tra

```sh
npx tsc --noEmit
npm run build
```

Kiểm tra thủ công: chọn nhiều bài; nhấn thẻ/Space để lật, dùng ← / → để chuyển; kiểm tra kích thước thẻ với nội dung dài; phát audio; chọn nhóm kana, nhập đúng/sai và bật/tắt gợi ý bằng nút/Space; dùng bàn phím và màn hình điện thoại. Google Fonts cần mạng để tải; trình duyệt dùng font dự phòng khi offline.
