# Approved five-stage content migration (20 Nov 2026)

Source: user-approved PDF “รวมบทสนทนาและคำถามปรับปรุง_3.pdf”, pages 1–9 and 11 (ending). Use the PRIMARY numbered questions 1–20. **Do not use the duplicate stage-5 section or alternate questions numbered 1–3 on pages 9–11.**

## Approved flow
- Preserve existing school/coin opening and character selection.
- Stage 1 ทุ่งนาแห่งความอุดมสมบูรณ์: Q1–Q4 (3 multiple choice, 1 written).
- Stage 2 สายน้ำแห่งการค้า: Q5–Q7 (3 multiple choice).
- Stage 3 ตลาดหลากหลาย สินค้ามากมาย: Q8–Q11 (3 multiple choice, 1 written).
- Stage 4 สำเภาการค้าแห่งอยุธยา: Q12–Q15 (3 multiple choice, 1 written).
- Stage 5 ความลับแห่งพระคลังสินค้า: Q16–Q19 (4 multiple choice).
- Ending (เทพแห่งกาลเวลา): Q20 (written), then return to school and show result.

Total: 16 multiple-choice scored /16, four written responses Q4,Q11,Q15,Q20 unscored, stored for analysis. Do not count written questions as wrong or block progression on correctness; require a response according to the existing classroom input rules.

## Implementation checklist
- [ ] Transcribe all approved dialogue, exact options, answer keys and feedback from PDF into game content; retain gender-specific student text with meaning unchanged.
- [ ] Remap nine legacy scenes to five approved locations without changing assets unnecessarily.
- [ ] Update map pins, unlocking and transition logic.
- [ ] Remove nine-stage assumptions in score summary, CSV export and ending.
- [ ] Verify all 20 questions, correct answers, written-answer persistence, scene transitions, BGM and result /16.
- [ ] Keep main untouched until a full playthrough is tested.

## Existing implementation observations
The current `js/game.js` still uses nine entries in `classroomStages` and nine-stage result logic. `js/adventure-map.js` also uses the nine-stage structure. The original `index.html` labels the result summary as nine stages. A simple text replacement would break scene and quiz routing, so migration must be tested as a coherent change.

This is a migration specification, not a claim that gameplay has already been updated.
