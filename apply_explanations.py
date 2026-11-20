import json
import re
import os

def update_all():
    if not os.path.exists('explanations.json'):
        print("No explanations.json found.")
        return 0

    with open('explanations.json', 'r', encoding='utf-8') as f:
        explanations = json.load(f)

    print(f"Loaded {len(explanations)} explanations from explanations.json")

    # Update all_questions.json
    with open('all_questions.json', 'r', encoding='utf-8') as f:
        questions = json.load(f)

    updated_count = 0
    for q in questions:
        qid_str = str(q['id'])
        if qid_str in explanations:
            exp_text = explanations[qid_str]
            if isinstance(exp_text, dict):
                exp_text = exp_text.get('full_explanation', '')
            
            # Format explanation nicely
            clean_exp = exp_text.strip()
            # Combine correct answer text + explanation
            correct_lines = []
            for c in q['correct']:
                matching_opt = next((o['text'] for o in q['options'] if o['key'] == c), '')
                correct_lines.append(f"{c}. {matching_opt}")
            
            header = "\n\n".join(correct_lines)
            if clean_exp:
                full_text = f"{header}\n\n**Giải thích chi tiết:**\n{clean_exp}"
            else:
                full_text = header
            q['explanation'] = full_text
            updated_count += 1

    with open('all_questions.json', 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

    with open('quiz-data.js', 'w', encoding='utf-8') as f:
        f.write('window.QUIZ_DATA = ' + json.dumps(questions, ensure_ascii=False, indent=2) + ';\n')

    print(f"Updated all_questions.json and quiz-data.js ({updated_count} questions updated).")

    # Update quiz.md and 2026-AWS-SAA-03-quiz.md
    for filename in ['quiz.md', '2026-AWS-SAA-03-quiz.md']:
        if not os.path.exists(filename):
            continue
        with open(filename, 'r', encoding='utf-8') as f:
            md_text = f.read()

        splits = re.split(r'(## Câu \d+)', md_text)
        # splits: [header, '## Câu 1', body1, '## Câu 2', body2, ...]
        new_splits = [splits[0]]

        for i in range(1, len(splits), 2):
            q_header = splits[i]
            q_body = splits[i+1]
            q_num = int(re.search(r'\d+', q_header).group())
            qid_str = str(q_num)

            if qid_str in explanations:
                exp_text = explanations[qid_str]
                if isinstance(exp_text, dict):
                    exp_text = exp_text.get('full_explanation', '')
                clean_exp = exp_text.strip()

                # Find <details>...</details> in q_body
                details_match = re.search(r'<details>(.*?)</details>', q_body, re.DOTALL)
                if details_match:
                    details_content = details_match.group(1)
                    # Keep everything up to **Đáp án đúng:** and the answer lines
                    # Remove any existing **Giải thích chi tiết:**
                    details_cleaned = re.sub(r'\n+\*\*Giải thích chi tiết:\*\*.*', '', details_content, flags=re.DOTALL).strip()
                    
                    new_details = f"{details_cleaned}\n\n**Giải thích chi tiết:**\n{clean_exp}\n"
                    q_body = q_body[:details_match.start(1)] + "\n" + new_details + "\n" + q_body[details_match.end(1):]

            new_splits.append(q_header)
            new_splits.append(q_body)

        updated_md = "".join(new_splits)
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(updated_md)
        print(f"Updated {filename} with explanations.")

    return updated_count

if __name__ == '__main__':
    update_all()
