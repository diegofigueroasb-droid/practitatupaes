#!/usr/bin/env python3
import re

clavijero = {
    1: 'B', 2: 'A', 3: 'A', 4: 'B', 5: 'D', 6: 'C', 7: 'B', 8: 'C', 9: 'B', 10: 'C',
    11: 'C', 12: 'D', 13: 'A', 14: 'B', 15: 'A', 16: 'B', 17: 'D', 18: 'C', 19: 'A', 20: 'C',
    21: 'C', 22: 'C', 23: 'B', 24: 'B', 25: 'D', 26: 'B', 27: 'A', 28: 'C', 29: 'B', 30: 'A',
    31: 'D', 32: 'D', 33: 'C', 34: 'B', 35: 'A', 36: 'C', 37: 'D', 38: 'A', 39: 'C', 40: 'C',
    41: 'B', 42: 'C', 43: 'D', 44: 'C', 45: 'A', 46: 'D', 47: 'C', 48: 'D', 49: 'B', 50: 'D',
    51: 'B', 52: 'C', 53: 'B', 54: 'C', 55: 'C', 56: 'C', 57: 'D', 58: 'B', 59: 'B', 60: 'D',
    61: 'D', 62: 'B', 63: 'C', 64: 'B', 65: 'C',
}
excluded = [18, 49, 50, 56, 61]

def clean_text(s):
    if not s:
        return ''
    s = s.replace(chr(0x2012), '-').replace(chr(0x2013), '-').replace(chr(0x2014), '-')
    s = s.replace(chr(0x00D7), '*')
    s = s.replace(chr(0x00A0), ' ')
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

# Read the extracted text
with open('/tmp/m1-questions.txt', 'r') as f:
    text = f.read()

lines = text.split('\n')
questions_data = []
i = 0

while i < len(lines):
    line = lines[i].strip()
    # Match pattern: "1.   Question?" 
    match = re.match(r'^(\d+)\.\s+(.+)$', line)
    if match:
        q_num = int(match.group(1))
        prompt = match.group(2).strip()
        alts = {'A': '', 'B': '', 'C': '', 'D': ''}
        i += 1
        # Collect alternatives
        while i < len(lines):
            alt_line = lines[i].strip()
            alt_match = re.match(r'^([A-D])\)\s+(.*)$', alt_line)
            if alt_match:
                key = alt_match.group(1)
                alts[key] = alt_match.group(2).strip()
                i += 1
            elif alt_line and not alt_line.startswith('A)'):
                i += 1
                break
            else:
                i += 1
                break
        if alts['A'] and q_num <= 65:
            questions_data.append({
                'num': q_num,
                'prompt': clean_text(prompt),
                'A': clean_text(alts['A']),
                'B': clean_text(alts['B']),
                'C': clean_text(alts['C']),
                'D': clean_text(alts['D']),
                'correct': clavijero.get(q_num, 'A'),
                'excluded': q_num in excluded
            })
    else:
        i += 1

# Generate TypeScript file
output = """import type { QuestionItem, AnswerOption } from '../../types/domain';

const inv2025Metadata = {
  admissionProcess: '2025',
  examDate: '2025-06-19',
  sourceProvider: 'DEMRE',
  forma: '111',
  curated: false,
};

export const matematicaM1Questions: QuestionItem[] = [
"""

for q in questions_data:
    output += f"""  {{
    id: 'matematica1-2025-{q['num']:02d}',
    subject: 'Matematica M1',
    modeSource: 'Official',
    prompt: '''{q['prompt']}''',
    alternatives: [
      {{ key: 'A' as AnswerOption, text: '''{q['A']}''' }},
      {{ key: 'B' as AnswerOption, text: '''{q['B']}''' }},
      {{ key: 'C' as AnswerOption, text: '''{q['C']}''' }},
      {{ key: 'D' as AnswerOption, text: '''{q['D']}''' }},
    ],
    correctAlternative: '{q['correct']}',
    explanationsByAlternative: {{}},
    difficulty: 'medium',
    metadata: {{ ...inv2025Metadata, officialKey: '{q['correct']}', originalQuestionNumber: {q['num']}, excludedFromScore: {str(q['excluded']).lower()} }},
  }},
"""

output += "];\n"

# Write to file
with open('/Users/diegofr/Documents/Proyectos/practicatupaes/src/data/paes-questions/matematica-m1.ts', 'w') as f:
    f.write(output)

print(f"Generated {len(questions_data)} questions")