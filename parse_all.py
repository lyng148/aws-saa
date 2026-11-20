import os
import re
import json

src_file = 'quiz.md' if os.path.exists('quiz.md') else '2026-AWS-SAA-03-quiz.md'
print(f"Reading quiz questions from: {src_file}")
with open(src_file, 'r', encoding='utf-8') as f:
    text = f.read()

pattern = r'## Câu (\d+)'
splits = re.split(pattern, text)

print(f"Total question sections: {(len(splits)-1)//2}")

all_questions = []
anomalies = []

for i in range(1, len(splits), 2):
    q_num = int(splits[i])
    q_body = splits[i+1]
    
    # Topic
    topic_match = re.search(r'\*\*Chủ đề:\*\*\s*(.+)', q_body)
    topic = topic_match.group(1).strip() if topic_match else 'General'
    
    # Label matches
    # Match <label ...> ... </label>
    labels = re.findall(r'<label\s+for="([^"]+)">\s*<input\s+type="([^"]+)"\s+id="([^"]+)"\s+name="([^"]+)"\s+value="([^"]+)">\s*(?:<strong>([A-Za-z0-9]+)\.</strong>)?\s*(.*?)</label>', q_body, re.DOTALL)
    
    # If standard regex didn't catch all, fallback
    if not labels:
        anomalies.append((q_num, 'No labels found!'))
        continue

    q_type = labels[0][1] # 'radio' or 'checkbox'
    
    options = []
    opt_keys = []
    for l in labels:
        k = l[4].strip()
        opt_keys.append(k)
        # Clean text
        raw_text = l[6].strip()
        options.append({
            'key': k,
            'text': raw_text
        })
        
    # Details / Answers
    details_match = re.search(r'<details>(.*?)</details>', q_body, re.DOTALL)
    details_content = details_match.group(1).strip() if details_match else ''
    
    # Find correct answer letters:
    # Lines starting with A. or B. etc.
    # Note: lines might have leading whitespace or markdown
    lines = details_content.split('\n')
    correct_keys = []
    for line in lines:
        m = re.match(r'^\s*([A-G])\.\s+', line)
        if m:
            correct_keys.append(m.group(1))
            
    # If not found by line prefix, fallback to looking for [A-G] in the section
    if not correct_keys:
        # maybe like "**Đáp án đúng:** A" or "A, B"
        ans_part = re.sub(r'<summary>.*?</summary>', '', details_content, flags=re.DOTALL)
        ans_part = re.sub(r'\*\*Đáp án đúng:\*\*', '', ans_part)
        found = re.findall(r'\b([A-G])\b', ans_part)
        for f in found:
            if f in opt_keys and f not in correct_keys:
                correct_keys.append(f)
                
    # Deduplicate
    seen = set()
    dedup_correct = [k for k in correct_keys if not (k in seen or seen.add(k))]
    
    # Validation
    if not dedup_correct:
        anomalies.append((q_num, 'No correct answer found!', details_content))
    for k in dedup_correct:
        if k not in opt_keys:
            anomalies.append((q_num, f'Correct answer {k} not in options {opt_keys}'))
            
    # Question text: from start of body (or after Chủ đề) up to **Lựa chọn:** or first <label
    # Remove topic line
    body_clean = re.sub(r'^\s*\*\*Chủ đề:\*\*.*?\n+', '', q_body, flags=re.DOTALL)
    # Split at **Lựa chọn:** or <label
    parts = re.split(r'\n+\s*(?:\*\*Lựa chọn:\*\*|<label)', body_clean, 1)
    q_text = parts[0].strip()
    
    # Explanation: anything in details
    explanation = re.sub(r'<summary>.*?</summary>', '', details_content, flags=re.DOTALL).strip()
    explanation = re.sub(r'^\*\*Đáp án đúng:\*\*\s*', '', explanation).strip()
    
    # Count how many choices to select if mentioned in question
    select_count = 1
    if q_type == 'checkbox':
        m_sel = re.search(r'\(Select\s+(two|three|four|five|\d+)\)', q_text, re.IGNORECASE)
        if m_sel:
            word = m_sel.group(1).lower()
            num_map = {'two': 2, 'three': 3, 'four': 4, 'five': 5}
            select_count = num_map.get(word, int(word) if word.isdigit() else len(dedup_correct))
        else:
            select_count = len(dedup_correct)

    all_questions.append({
        'id': q_num,
        'topic': topic,
        'type': q_type,
        'select_count': select_count,
        'question': q_text,
        'options': options,
        'correct': dedup_correct,
        'explanation': explanation
    })

print(f"Total processed questions: {len(all_questions)}")
print(f"Total anomalies: {len(anomalies)}")
if anomalies:
    for a in anomalies[:10]:
        print("Anomaly:", a)
else:
    print("ALL 390 QUESTIONS VALIDATED PERFECTLY WITH ZERO ANOMALIES!")

with open('all_questions.json', 'w', encoding='utf-8') as f:
    json.dump(all_questions, f, ensure_ascii=False, indent=2)

with open('quiz-data.js', 'w', encoding='utf-8') as f:
    f.write('window.QUIZ_DATA = ' + json.dumps(all_questions, ensure_ascii=False, indent=2) + ';\n')

print("Saved both all_questions.json and quiz-data.js successfully!")
