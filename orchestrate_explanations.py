import json
import os
import subprocess

schema = {
    "type": "object",
    "properties": {
        "explanations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "integer"},
                    "full_explanation": {"type": "string"}
                },
                "required": ["id", "full_explanation"]
            }
        }
    },
    "required": ["explanations"]
}

def build_prompt(batch):
    batch_ids = [q['id'] for q in batch]
    batch_data_str = json.dumps(batch, ensure_ascii=False, indent=2)
    prompt = f"""Bạn là chuyên gia kiến trúc giải pháp AWS (AWS Certified Solutions Architect – Professional).
Dưới đây là danh sách {len(batch)} câu hỏi trắc nghiệm AWS SAA-C03 (gồm ID câu hỏi, chủ đề, nội dung câu hỏi, danh sách lựa chọn A, B, C, D... và đáp án đúng đã được xác định).

Hãy đọc kỹ từng câu và viết phần giải thích chi tiết (bằng tiếng Việt chuẩn thuật ngữ AWS) cho TẤT CẢ các câu hỏi trong danh sách:
Yêu cầu đối với mỗi câu:
1. Phân tích cụ thể vì sao đáp án đúng là giải pháp tối ưu nhất (dựa trên các nguyên tắc thiết kế AWS: Performance, Latency, High Availability, Scalability, Cost Optimization, Security).
2. Phân tích rõ ràng vì sao từng phương án còn lại là sai hoặc không tối ưu.
3. Giải thích súc tích, mạch lạc, chính xác tuyệt đối theo tài liệu chuẩn AWS.

Dữ liệu câu hỏi:
{batch_data_str}

Hãy trả về kết quả theo định dạng JSON đúng schema sau:
{{
  "explanations": [
    {{
      "id": {batch_ids[0]},
      "full_explanation": "- **Đáp án đúng là ...:** ...\\n- **Vì sao các lựa chọn khác sai / không tối ưu:**\\n  - **...:** ...\\n  - **...:** ..."
    }}
  ]
}}
"""
    return prompt

async def process_one_chunk(c):
    p = build_prompt(c)
    r_name = f"Explainer Q{c[0]['id']}-Q{c[-1]['id']}"
    res = await agent(p, schema=schema, role=r_name, model="flash")
    return res

# Load questions
with open('all_questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

# Load existing explanations
existing = {}
if os.path.exists('explanations.json'):
    try:
        with open('explanations.json', 'r', encoding='utf-8') as f:
            existing = json.load(f)
    except:
        existing = {}

missing_qs = [q for q in questions if str(q['id']) not in existing]
log(f"Starting orchestration: {len(existing)} completed, {len(missing_qs)} remaining.")

# Split into chunks of 10
chunk_size = 10
chunks = [missing_qs[i:i + chunk_size] for i in range(0, len(missing_qs), chunk_size)]

# We process in waves of 4 chunks in parallel
wave_size = 4
total_waves = (len(chunks) + wave_size - 1) // wave_size

for wave_idx in range(total_waves):
    current_chunks = chunks[wave_idx * wave_size : (wave_idx + 1) * wave_size]
    wave_qids = [f"Q{c[0]['id']}-Q{c[-1]['id']}" for c in current_chunks]
    
    phase(f"Wave {wave_idx + 1}/{total_waves}: {', '.join(wave_qids)}")
    log(f"Processing Wave {wave_idx + 1}/{total_waves} with {len(current_chunks)} batches in parallel...")

    results = await parallel(current_chunks, lambda c: process_one_chunk(c))

    # Accumulate results
    new_count = 0
    for res in results:
        if res and "explanations" in res:
            for item in res["explanations"]:
                qid_str = str(item["id"])
                existing[qid_str] = item["full_explanation"]
                new_count += 1

    # Save to disk immediately after each wave
    with open('explanations.json', 'w', encoding='utf-8') as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)

    log(f"Wave {wave_idx + 1} finished: +{new_count} explanations. Total saved: {len(existing)}/390")

    # Apply to web app and markdown
    subprocess.run(["python", "apply_explanations.py"], check=True)

log("ALL 390 QUESTIONS EXPLANATIONS GENERATED AND APPLIED SUCCESSFULLY!")
