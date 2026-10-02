# Gravity Falls · Cipher Lab

Người thực hiện: **Nhữ Duy Anh Minh** và **Nguyễn Vũ Tuấn Phong**.

## Xem và kiểm tra

Mở `Gravity_Falls_Cipher_Lab.html` bằng Chrome hoặc Edge. Đây là bản một tệp, đã nhúng phông, công thức, kiểu giao diện và mã nguồn; không cần cài thư viện.

Bộ tệp trong ZIP dùng đường dẫn tương đối và có thể đưa lên GitHub Pages sau khi bạn kiểm tra. Chưa có bản nào được xuất bản lên Sites hoặc GitHub.

## Các chức năng đã có

- 9 phân cảnh với thanh thời gian, tua 5 giây, 6 tốc độ, phụ đề và toàn màn hình.
- Toàn bộ nội dung, nhãn, thông báo, lời giảng và phản hồi đổi giữa Việt–Anh.
- Caesar, Atbash, A1Z26, Vigenère và bảng ký hiệu Bill Cipher.
- Chạy từng bước với dòng giả mã được tô sáng; chuyển giữa mã hóa và giải mã.
- Mã JavaScript có thể chỉnh, chạy trong luồng riêng, so với thuật toán chuẩn và tải về. Giới hạn 1,5 giây ngăn vòng lặp không dừng.
- Vét cạn đủ 26 khóa Caesar, biểu đồ tần suất, tìm cụm ba chữ lặp của Vigenère và thí nghiệm sửa bản mã.
- 3 bài tự kiểm tra với gợi ý và phản hồi.

## Lộ trình kiểm tra đề nghị

1. Caesar: `WELCOME TO GRAVITY FALLS`, khóa `3` phải cho `ZHOFRPH WR JUDYLWB IDOOV`. Thử `XYZ` phải cho `ABC`. Chuyển giải mã phải khôi phục được đầu vào.
2. Atbash: `HELLO WORLD` phải cho `SVOOL DLIOW`. Biến đổi lần thứ hai phải trở lại bản rõ.
3. A1Z26: `AZ BC` phải cho `1-26 2-3`. Giải mã `0`, `27`, `1--2` phải báo đầu vào không hợp lệ.
4. Vigenère: `ATTACKATDAWN`, khóa `LEMON` phải cho `LXFOPVEFRNHR`. Với `A A!A` và khóa `ABC`, kết quả phải là `A B!C`; khoảng trắng không tiêu thụ khóa.
5. Bill Cipher: mã hóa, sao chép và dán ký hiệu vào chế độ giải mã. Bảng có 26 ký hiệu riêng, đầu ra khác chuỗi A–Z. Khi sao chép ra ứng dụng khác, cần phông của lab để hiển thị vùng ký tự riêng.
6. Mở mã nguồn của mỗi hệ mã, chạy mẫu rồi sửa phép toán. Chạy mẫu khớp thuật toán chuẩn; mã sửa có thể cho kết quả khác. Thử vòng lặp không dừng phải bị hủy sau 1,5 giây.
7. Phá mã: bản mã `KLGH WKH NHB`, khóa ứng viên `3` phải cho `HIDE THE KEY`. Khi sửa một chữ của bản mã, Bob nhận bản rõ sai; Caesar không tự có cơ chế phát hiện sửa đổi.
8. Đổi Việt–Anh ở giữa thí nghiệm và khi đang có lỗi. Các nhãn và thông báo phải đổi, dữ liệu đang nhập phải được giữ.
9. Kiểm tra loa trên trình duyệt của bạn, tốc độ 0.5×/1.5×, phụ đề, toàn màn hình và điện thoại. Giọng Việt/Anh phụ thuộc các giọng có sẵn; thiếu giọng thì lab thông báo và giữ phụ đề. Âm thanh tổng hợp có thể không trùng thanh thời gian tới từng mili giây.

## Đưa lên GitHub Pages sau khi bạn đã duyệt

Giải nén ZIP, đưa **toàn bộ các tệp và thư mục bên trong** vào thư mục gốc repository. `index.html` phải nằm ở gốc, cùng `app.js`, `engine.js`, `content.js`, `examples.js`, `style.css` và `assets/`. Trong Settings → Pages, chọn nhánh chứa các tệp và thư mục `/ (root)`. Không cần backend hoặc bước build để chạy bản đã đóng gói này.

## Tài nguyên và phạm vi

Các ví dụ thực hành được tạo cho lab; không gán cho một tập phim cụ thể. Bảng chữ cái chính là A–Z, chữ thường được đổi thành chữ hoa; không tự bỏ dấu tiếng Việt. Các hệ mã này phục vụ giảng dạy/câu đố và không bảo vệ dữ liệu nhạy cảm. A1Z26 và bảng Bill Cipher không có khóa bí mật.

Phông Bill’s Cipher của monstervibes được trang tác giả ghi **Free for personal use**; thông tin tài nguyên và giấy phép đi kèm trong `LICENCES.md`. Việc xuất bản tiếp theo thuộc bước kiểm tra của bạn.

Kiểm tra tự động đã qua 20 nhóm: thuật toán, nghịch đảo, đầu vào lỗi, mã nguồn, song ngữ, bàn phím ký hiệu, tấn công, giới hạn thời gian chạy, phím tắt, bố cục điện thoại và không có lỗi console trong những luồng đã kiểm tra. Tệp HTML độc lập cũng được kiểm tra riêng trước khi bàn giao.
