import os
import glob
import json
import re

# Load original 390 questions with Vietnamese explanations
with open('all_questions.json', 'r', encoding='utf-8') as f:
    orig_390 = json.load(f)

print(f"Loaded original {len(orig_390)} questions.")

dir_path = r'01 - Practice Test #1 - AWS Certified Solutions Architect Associate-20261120T074631Z-1-001\01 - Practice Test #1 - AWS Certified Solutions Architect Associate'
html_files = sorted(glob.glob(os.path.join(dir_path, '*.html')))
print(f"Found {len(html_files)} Stephane Maarek HTML files.")

def clean_html_option(opt_html):
    text = re.sub(r'^\s*<p>\s*', '', opt_html)
    text = re.sub(r'\s*</p>\s*$', '', text)
    return text.strip()

# Explanation for Question 8 (AWS Cost Anomaly Detection)
q8_vn_explanation = """- **Đáp án đúng là D: Create an AWS Cost Anomaly Detection monitor and configure an alert to send notifications to an Amazon SNS topic when cost anomalies are detected.**
  - **Phân tích kiến trúc tối ưu:**
    - **Tự động phát hiện bất thường & Phân tích nguyên nhân gốc rễ (Root-cause Analysis):** **AWS Cost Anomaly Detection** là dịch vụ thuộc bộ giải pháp AWS Cost Management, sử dụng Machine Learning nâng cao để liên tục theo dõi mô hình chi tiêu, tự động phát hiện các đợt tăng vọt chi phí bất thường (cost spikes) gần thời gian thực và cung cấp phân tích nguyên nhân gốc rễ (chỉ rõ service, tài khoản, hoặc region nào gây ra bất thường) với nỗ lực vận hành tối thiểu (**LEAST operational overhead**).
    - **Cảnh báo tức thì qua Amazon SNS:** Tích hợp trực tiếp với Amazon SNS để gửi thông báo ngay lập tức qua Email, Slack, Chime hoặc webhook khi phát hiện chi phí đột biến.
- **Vì sao các lựa chọn khác sai / không tối ưu:**
  - **A:** AWS Pricing Calculator là công cụ lập kế hoạch dự toán chi phí trước khi triển khai, KHÔNG phải là công cụ giám sát chi phí theo thời gian thực của các tài nguyên đang chạy.
  - **B:** CloudWatch billing alarms chỉ so sánh tổng chi phí tích lũy theo ngưỡng cố định (ví dụ chi phí tháng vượt 1000$), KHÔNG sử dụng Machine Learning để phát hiện đột biến bất thường và KHÔNG cung cấp phân tích nguyên nhân gốc rễ (root-cause analysis).
  - **C:** AWS Budgets thiết lập ngân sách cố định và cảnh báo khi chi phí chạm mốc phần trăm ngân sách định sẵn, nhưng không tự động phát hiện các dị biệt chi phí (anomalies) không báo trước và không có tính năng phân tích nguyên nhân gốc rễ tự động như Cost Anomaly Detection."""

quizzes_catalog = {}

# 1. Parse the 6 Stephane Maarek practice tests in exact sequential order
global_q_idx = 0

for i, fpath in enumerate(html_files):
    fname = os.path.basename(fpath)
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    m = re.search(r'const quizData = ({.*?});\s*(?:let correct|const explanationMap)', content, re.DOTALL)
    if not m:
        raise ValueError(f"Could not parse quizData from {fname}")

    data = json.loads(m.group(1))
    title = data.get('quiz_title', f'Practice Test #{i+1} - Stephane Maarek')
    raw_qs = data.get('questions', [])

    test_questions = []
    for local_q_num, q in enumerate(raw_qs, start=1):
        prompt = q.get('prompt', {})
        q_plain = q.get('question_plain', '').strip()
        if not q_plain:
            q_plain = re.sub(r'<[^>]+>', '', prompt.get('question', '')).strip()

        answers_raw = prompt.get('answers', [])
        options = []
        letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
        for opt_idx, a_html in enumerate(answers_raw):
            key = letters[opt_idx] if opt_idx < len(letters) else chr(65 + opt_idx)
            options.append({
                'key': key,
                'text': clean_html_option(a_html)
            })

        correct_raw = q.get('correct_response', [])
        correct = [c.upper() for c in correct_raw]

        q_type = 'checkbox' if len(correct) > 1 else 'radio'
        select_count = len(correct)
        m_sel = re.search(r'\(Select\s+(two|three|four|five|\d+)\)', q_plain, re.IGNORECASE)
        if m_sel:
            word = m_sel.group(1).lower()
            num_map = {'two': 2, 'three': 3, 'four': 4, 'five': 5}
            select_count = num_map.get(word, int(word) if word.isdigit() else len(correct))

        section = q.get('section', 'General')
        stephane_explanation = prompt.get('explanation', '').strip()

        # Handle Question 8 vs other questions
        if i == 0 and local_q_num == 8:
            vn_explanation = q8_vn_explanation
        else:
            vn_explanation = ""
            if global_q_idx < len(orig_390):
                orig_match = orig_390[global_q_idx]
                vn_explanation = orig_match.get('explanation', '')

        test_questions.append({
            'id': local_q_num,
            'global_id': global_q_idx + 1,
            'topic': section,
            'type': q_type,
            'select_count': select_count,
            'question': q_plain,
            'options': options,
            'correct': correct,
            'explanation': vn_explanation,
            'explanation_official': stephane_explanation,
            'explanation_vn': vn_explanation
        })

        global_q_idx += 1

    test_id = f"stephane-{i+1}"
    subtitles = [
        "Đề thi thử #1 chuẩn cấu trúc AWS Certified Solutions Architect Associate",
        "Đề thi thử #2 chuyên sâu High Availability, Auto Scaling & VPC Networking",
        "Đề thi thử #3 tối ưu hóa Security, IAM, KMS & Data Protection",
        "Đề thi thử #4 phân tích Database, Analytics & Containers (EKS/ECS)",
        "Đề thi thử #5 nâng cao về Disaster Recovery, Multi-Region & Cost Optimization",
        "Đề thi thử #6 tổng duyệt kiến thức thực chiến với kịch bản kiến trúc phức tạp"
    ]

    quizzes_catalog[test_id] = {
        'id': test_id,
        'title': f"Practice Test #{i+1} - Stephane Maarek",
        'shortTitle': f"Test #{i+1}",
        'subtitle': subtitles[i] if i < len(subtitles) else title,
        'badge': "65 câu • 130 phút • Điểm đạt 72%",
        'author': "Stephane Maarek",
        'questionCount': len(test_questions),
        'durationMinutes': 130,
        'passPercent': 72,
        'questions': test_questions
    }
    print(f"Processed {test_id}: {len(test_questions)} questions.")

# 2. Build Master 390 Questions Bank from the 6 sequential tests
master_questions = []
for test_id in [f"stephane-{k}" for k in range(1, 7)]:
    t = quizzes_catalog[test_id]
    for q in t['questions']:
        q_copy = dict(q)
        q_copy['id'] = q['global_id']
        master_questions.append(q_copy)

quizzes_catalog["quiz-390"] = {
    'id': "quiz-390",
    'title': "Bộ 390 câu hỏi tổng hợp (Full Question Bank)",
    'shortTitle': "Tổng hợp 390 câu",
    'subtitle': "Trọn bộ 390 câu hỏi luyện thi AWS SAA-C03 kèm lời giải chi tiết & sơ đồ kiến trúc",
    'badge': "390 câu • 4 Domains • Đầy đủ giải thích",
    'author': "AWS SAA-C03 Question Bank",
    'questionCount': len(master_questions),
    'durationMinutes': 130,
    'passPercent': 72,
    'questions': master_questions
}
print(f"Processed quiz-390: {len(master_questions)} questions.")

# Save to quiz-data.js and all_quizzes.json
with open('all_quizzes.json', 'w', encoding='utf-8') as f:
    json.dump(quizzes_catalog, f, ensure_ascii=False, indent=2)

with open('quiz-data.js', 'w', encoding='utf-8') as f:
    js_content = "window.QUIZZES_CATALOG = " + json.dumps(quizzes_catalog, ensure_ascii=False) + ";\n"
    js_content += "window.QUIZ_DATA = window.QUIZZES_CATALOG['quiz-390'].questions;\n"
    f.write(js_content)

print(f"Updated quiz-data.js and all_quizzes.json successfully!")
