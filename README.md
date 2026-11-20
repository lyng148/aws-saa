# AWS Certified Solutions Architect – Associate (SAA-C03) Quiz Web App
### Trung tâm luyện thi phong cách Coursera Assessment (Coursera UI/UX)

Ứng dụng web ôn thi chứng chỉ **AWS Certified Solutions Architect – Associate (SAA-C03)** tích hợp đầy đủ **7 bộ đề thi tuyển chọn** (780 câu hỏi):
1. **⭐ Bộ 390 câu hỏi tổng hợp (Master Question Bank):** Toàn bộ câu hỏi bao quát 4 nhóm kiến trúc AWS SAA-C03 có giải thích chi tiết tiếng Việt và sơ đồ kiến trúc.
2. **📝 6 Đề thi thử chuẩn đề thi thật của Stephane Maarek (Practice Tests 1 - 6):** 65 câu/đề, thời lượng 130 phút, điểm chuẩn đạt 72%, tích hợp lời giải chuyên sâu và sơ đồ kiến trúc chính thức.

---

## 🚀 Cách mở và sử dụng ứng dụng

Bạn có 2 cách mở ứng dụng rất đơn giản:

### Cách 1: Mở trực tiếp (Không cần cài đặt, không cần server)
- Nhấp đúp (Double-click) trực tiếp vào file **`index.html`** bằng bất kỳ trình duyệt nào (Google Chrome, Microsoft Edge, Firefox, Cốc Cốc, Safari,...).
- Toàn bộ 7 bộ đề thi hoạt động 100% offline, không yêu cầu kết nối mạng hay cài đặt bất cứ phần mềm nào.

### Cách 2: Mở qua máy chủ cục bộ (Local Web Server)
- Nhấp đúp vào file **`start_server.bat`**. Trình duyệt sẽ tự động mở tại địa chỉ: `http://localhost:8000`.

---

## ✨ Các tính năng nổi bật chuẩn Coursera

### 1. Trang chọn bài thi ban đầu (Coursera Assessment Hub)
- Trang chủ hiển thị tổng quan khóa học và danh sách 7 bộ đề thi dạng card trực quan.
- Mỗi card hiển thị: tên bài thi, số lượng câu hỏi, thời gian thi, thanh tiến độ hoàn thành thực tế (`X / Y câu`) và trạng thái hoàn thành.
- Dễ dàng chuyển đổi qua lại giữa trang chọn đề và bài thi bất kỳ lúc nào qua nút **"← Tất cả đề thi"** hoặc dropdown chọn nhanh ở thanh tiêu đề.

### 2. Hai tab giải thích song song (Dual Explanations)
- **🇻🇳 Lời giải tiếng Việt chuyên sâu:** Phân tích cặn kẽ vì sao phương án đúng là tối ưu nhất và vì sao từng phương án còn lại là sai/chưa tối ưu theo chuẩn kiến trúc AWS.
- **🌐 Sơ đồ & Lời giải gốc (Stephane Maarek):** Lời giải chính thức của giảng viên Stephane Maarek với hình ảnh sơ đồ kiến trúc trực quan từ AWS Documentation và liên kết tham khảo.

### 3. Hai chế độ học tập linh hoạt (Mode Switcher)
- **📖 Chế độ Luyện tập (Practice Mode):**
  - Làm từng câu và bấm **"Kiểm tra đáp án"** ngay lập tức.
  - Hiển thị thông báo kết quả chuẩn Coursera (Chính xác / Chưa chính xác).
  - Tự động hiển thị lời giải và đáp án đúng.
- **⏱️ Chế độ Thi thử (Exam Mode):**
  - Giả lập bài thi thực tế có đồng hồ đếm thời gian (Tạm dừng / Tiếp tục).
  - Không hiển thị đáp án trước, cho phép gắn cờ câu hỏi để xem lại.
  - Bấm **"Nộp bài thi"** để nhận bảng điểm (Grade Report) chi tiết.

### 4. Phân tích kết quả chi tiết theo 4 Domain AWS SAA-C03
- Bảng điểm chuẩn Coursera với tỷ lệ phần trăm (Đạt chuẩn từ **72%**).
- Đánh giá năng lực theo từng nhóm kiến trúc AWS:
  1. *Design High-Performing Architectures*
  2. *Design Secure Architectures*
  3. *Design Resilient Architectures*
  4. *Design Cost-Optimized Architectures*
- Tính năng **"Chỉ xem lại các câu làm sai ❌"** giúp bạn ôn lại nhanh những lỗ hổng kiến thức.
- Nút **"In / Lưu PDF"** xuất báo cáo kết quả ôn luyện.

### 5. Bảng điều hướng câu hỏi thông minh (Assessment Navigator)
- Danh sách câu hỏi dạng lưới trực quan với các trạng thái màu sắc:
  - Trắng/Xám: Chưa làm
  - Xanh Coursera: Đã làm
  - Viền xanh nổi bật: Câu đang chọn
  - Góc cam: Đã gắn cờ xem lại 🚩
  - Xanh lá / Đỏ: Đúng / Sai khi kiểm tra hoặc nộp bài
- Bộ lọc câu hỏi theo: Chủ đề (Domain), Trạng thái (Đã làm / Chưa làm / Gắn cờ / Câu sai) và ô tìm kiếm nhanh.

### 6. Tự động lưu tiến độ độc lập cho từng bài thi
- Mỗi bài thi được lưu tiến độ, đáp án, cờ đánh dấu và thời gian riêng biệt vào `localStorage` của trình duyệt. Làm bài thi này không ảnh hưởng đến bài thi khác.
- Hỗ trợ **Xuất file tiến độ (Export JSON)** và **Khôi phục tiến độ (Import JSON)**.

### 7. Phím tắt bàn phím tiện lợi
- `→` hoặc `PageDown`: Câu tiếp theo
- `←` hoặc `PageUp`: Câu trước
- `1` - `6` hoặc `A` - `F`: Chọn nhanh đáp án
- `F`: Gắn cờ / Bỏ gắn cờ xem lại
- `Enter`: Kiểm tra đáp án (trong chế độ Luyện tập)
- `Esc` hoặc `H`: Trở về trang danh sách tất cả đề thi
- `?`: Mở bảng trợ giúp phím tắt

---

## 📁 Cấu trúc thư mục

```text
QUIZ/
├── 01 - Practice Test #1.../ # Thư mục chứa 6 đề thi gốc của Stephane Maarek
├── 2026-AWS-SAA-03-quiz.md   # File Markdown 390 câu kèm giải thích chi tiết
├── quiz.md                   # Bản sao quiz.md
├── index.html                # Trang web chính (Trang chọn đề + Giao diện thi Coursera)
├── styles.css                # Toàn bộ mã CSS thiết kế Coursera Design System
├── app.js                    # Javascript xử lý chọn đề, làm bài, chấm điểm và điều hướng
├── quiz-data.js              # Dữ liệu 7 bộ đề thi đã chuẩn hóa (chạy offline 100%)
├── all_quizzes.json          # Toàn bộ 7 bộ đề dạng JSON thuần
├── build_quizzes_catalog.py  # Script tự động trích xuất & cập nhật dữ liệu đề thi
├── start_server.bat          # File khởi động nhanh web server trên Windows
└── README.md                 # Tài liệu hướng dẫn sử dụng
```
