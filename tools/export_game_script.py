import re, ast, pathlib
from docx import Document
from docx.shared import Pt, Cm, RGBColor

ROOT=pathlib.Path(__file__).resolve().parents[1]
src=(ROOT/'js/game.js').read_text(encoding='utf-8')
intro=(ROOT/'js/intro-cinematic.js').read_text(encoding='utf-8')
OUT=ROOT/'เอกสารบทสนทนาและคำถามเกมเงินพดด้วง.docx'

def extract_balanced(s, pos, left='[', right=']'):
    assert s[pos]==left
    depth=0; quote=None; escape=False; line_comment=False; block_comment=False
    for i in range(pos,len(s)):
        c=s[i]; n=s[i+1] if i+1<len(s) else ''
        if line_comment:
            if c=='\n': line_comment=False
            continue
        if block_comment:
            if c=='*' and n=='/': block_comment=False
            continue
        if quote:
            if escape: escape=False
            elif c=='\\': escape=True
            elif c==quote: quote=None
            continue
        if c=='/' and n=='/': line_comment=True;continue
        if c=='/' and n=='*': block_comment=True;continue
        if c in "'\"\x60": quote=c;continue
        if c==left: depth+=1
        if c==right:
            depth-=1
            if depth==0:return s[pos:i+1]
    raise ValueError('Unclosed bracket at '+str(pos))

def split_top(s):
    chunks=[]; start=0; depth=0; quote=None; escape=False
    for i,c in enumerate(s):
        if quote:
            if escape:escape=False
            elif c=='\\':escape=True
            elif c==quote:quote=None
        elif c in "'\"\x60":quote=c
        elif c in '[{(':depth+=1
        elif c in ']})':depth-=1
        elif c==',' and depth==0:
            chunks.append(s[start:i].strip());start=i+1
    if s[start:].strip():chunks.append(s[start:].strip())
    return [x for x in chunks if x]

def js_str(raw):
    try:return ast.literal_eval(raw)
    except Exception:return raw.strip("'\"")

def quoted(s):
    return [js_str(m.group(0)) for m in re.finditer(r"'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\"",s)]

def get_arrays(s):
    found={}
    for m in re.finditer(r'\bconst\s+(\w+)\s*=\s*\[',s):
        name=m.group(1)
        if any(k in name.lower() for k in ('quiz','lines','dialogue')):
            found[name]=extract_balanced(s,m.end()-1)
    for m in re.finditer(r'\bfunction\s+(\w+)\s*\([^)]*\)\s*\{',s):
        name=m.group(1)
        if any(k in name.lower() for k in ('lines','dialogue','ending')):
            try:
                body=extract_balanced(s,m.end()-1,'{','}')
                arr=re.search(r'\breturn\s*\[',body)
                if arr:found[name]=extract_balanced(body,arr.end()-1)
            except Exception:pass
    return found

arrays=get_arrays(src)
intro_arrays=get_arrays(intro)
doc=Document()
section=doc.sections[0];section.top_margin=Cm(2.1);section.bottom_margin=Cm(2.0)
section.left_margin=Cm(2.4);section.right_margin=Cm(2.4)
styles=doc.styles
styles['Normal'].font.name='TH Sarabun New';styles['Normal'].font.size=Pt(15)
styles['Normal'].paragraph_format.space_after=Pt(4)
for st,size in [('Title',22),('Heading 1',19),('Heading 2',17)]:
    styles[st].font.name='TH Sarabun New';styles[st].font.size=Pt(size)
    styles[st].font.color.rgb=RGBColor(67,49,104)

doc.add_heading('บทสนทนาและข้อคำถามทั้งหมดจากเกมปริศนาเงินพดด้วง',0)
doc.add_paragraph('เอกสารรวบรวมจากไฟล์ต้นฉบับ js/game.js และ js/intro-cinematic.js ใน GitHub โดยไม่แก้ไขข้อความบทพูด คำถาม ตัวเลือก เฉลย หรือคำอธิบาย')
doc.add_paragraph('หมายเหตุ: บทพูดของนักเรียนบางบรรทัดมี 2 รูปแบบตามตัวละครชาย/หญิง จึงแสดงทั้งสองรูปแบบตามโค้ดจริง ข้อความในวงเล็บเหลี่ยมเป็นคำอธิบายการจัดเอกสาร ไม่ใช่ข้อความในเกม')
stage_names=[
 ('บทนำก่อนย้อนเวลา',['coinLines'],[]),
 ('ด่านที่ 1 วิถีชีวิตชาวนา',['farmerLines','farmerDepartureLines'],['farmerQuiz']),
 ('ด่านที่ 2 การเดินทางทางเรือ',['boatJourneyLines'],['boatQuiz']),
 ('ด่านที่ 3 ตลาดในกรุงศรีอยุธยา',['merchantLines'],['marketQuiz']),
 ('ด่านที่ 4 ท่ารับสินค้าจากหัวเมือง',['portDialogueLines'],['portQuiz']),
 ('ด่านที่ 5 ย่านการค้าต่างชาติ',['foreignTradeDialogueLines'],['foreignTradeQuiz']),
 ('ด่านที่ 6 ท่าเรือการค้าต่างประเทศ',['internationalPortDialogueLines'],['internationalPortQuiz']),
 ('ด่านที่ 7 ด่านขนอน',['checkpointDialogueLines'],['checkpointQuiz']),
 ('ด่านที่ 8 พระคลังสินค้า',['treasuryDialogueLines'],['treasuryQuiz']),
 ('ด่านที่ 9 พระราชวัง',['kingNaraiDialogueLines'],['finalRoyalQuiz']),
 ('บทสรุปหลังจบเกม',['royalEndingDialogue'],[])
]
speakers={'student':'นักเรียน','npc':'ชาวนา','farmer':'ชาวนา','boatman':'คนเรือ','merchant':'แม่ค้า','portOfficer':'นายท่า','chineseMerchant':'พ่อค้าชาวจีน','foreignExplorer':'กัปตันชาวต่างชาติ','checkpointOfficer':'เจ้าหน้าที่ด่านขนอน','treasuryOfficer':'เจ้าพนักงานพระคลัง','kingNarai':'สมเด็จพระนารายณ์'}
def dialogue_line(entry):
    entry=entry.strip()
    who='ไม่ระบุผู้พูด'
    m=re.match(r'(student|npc)\s*\(',entry)
    if m:who=speakers[m.group(1)]
    else:
        m=re.search(r'\bwho\s*:\s*[\x27"](\w+)',entry)
        if m:who=speakers.get(m.group(1),m.group(1))
    if 'genderWord(' in entry:
        m=re.search(r'genderWord\s*\(',entry)
        if m:
            args=split_top(extract_balanced(entry,m.end()-1,'(',')')[1:-1])
            if len(args)>=2:return who+' (นักเรียนชาย): '+str(js_str(args[0]))+'\n'+who+' (นักเรียนหญิง): '+str(js_str(args[1]))
    m=re.search(r'\btext\s*:\s*([\x27"](?:\\.|[^\x27"])*?[\x27"])',entry)
    if m:return who+': '+str(js_str(m.group(1)))
    m=re.match(r'(?:student|npc)\s*\(\s*([\x27"](?:\\.|[^\x27"])*?[\x27"])',entry)
    if m:return who+': '+str(js_str(m.group(1)))
    vals=quoted(entry)
    return who+': '+(str(vals[0]) if vals else '[ข้อความแบบไดนามิก — ดูต้นฉบับด้านล่าง]')

count=0
for stage,dialogues,quizzes in stage_names:
    doc.add_heading(stage,1)
    doc.add_heading('บทสนทนา',2)
    available=False
    for name in dialogues:
        raw=arrays.get(name)
        if not raw:continue
        available=True
        doc.add_paragraph('ชุดบทสนทนา: '+name,style='Subtitle')
        entries=split_top(raw[1:-1])
        for i,entry in enumerate(entries,1):
            if not entry.strip():continue
            doc.add_paragraph(f'{i}. {dialogue_line(entry)}')
            count+=1
        # Preserve every original code expression for cross-checking dynamic dialogue.
        doc.add_paragraph('อ้างอิงโค้ดต้นฉบับของชุดบทสนทนา '+name+' (คงข้อความเดิมทุกตัวอักษร):')
        for line in raw.splitlines():
            p=doc.add_paragraph(line)
            p.style='Normal';p.paragraph_format.space_after=Pt(0)
            for run in p.runs:run.font.size=Pt(10)
    if not available:doc.add_paragraph('[ไม่มีชุดบทสนทนาชื่อที่ระบุในรายการ — ตรวจสอบภาคผนวก]')
    if quizzes:
        doc.add_heading('ข้อคำถาม ตัวเลือก เฉลย และคำอธิบาย',2)
    for name in quizzes:
        raw=arrays.get(name)
        if not raw:
            doc.add_paragraph('[ไม่พบชุดคำถาม '+name+']');continue
        entries=split_top(raw[1:-1])
        doc.add_paragraph('ชุดคำถาม: '+name+' ('+str(len(entries))+' ข้อ)',style='Subtitle')
        for i,e in enumerate(entries,1):
            fields={}
            for field in ('q','explain','hint'):
                m=re.search(r'\b'+field+r'\s*:\s*([\x27"](?:\\.|[^\x27"])*?[\x27"])',e)
                if m:fields[field]=js_str(m.group(1))
            m=re.search(r'\boptions\s*:\s*\[',e)
            opts=quoted(extract_balanced(e,m.end()-1)) if m else []
            ans=re.search(r'\banswer\s*:\s*(\d+)',e)
            correct=int(ans.group(1)) if ans else -1
            doc.add_paragraph(f'ข้อ {i}. {fields.get("q","[ตรวจสอบโค้ดต้นฉบับ]")}')
            for j,opt in enumerate(opts):doc.add_paragraph(f'{"กขคงจฉชซ"[j] if j<8 else j+1}. {opt}')
            doc.add_paragraph('เฉลย: '+(f'{"กขคงจฉชซ"[correct]} — {opts[correct]}' if 0<=correct<len(opts) else '[ไม่พบ]'))
            if 'explain' in fields:doc.add_paragraph('คำอธิบายเมื่อตอบถูก: '+str(fields['explain']))
            if 'hint' in fields:doc.add_paragraph('คำแนะนำเมื่อตอบผิด: '+str(fields['hint']))
        doc.add_paragraph('อ้างอิงโค้ดต้นฉบับของชุดคำถาม '+name+':')
        for line in raw.splitlines():
            p=doc.add_paragraph(line);p.paragraph_format.space_after=Pt(0)
            for run in p.runs:run.font.size=Pt(10)

doc.add_heading('ข้อความตอบรับและบทสนทนาที่สร้างขณะเล่นเกม',1)
doc.add_paragraph('ส่วนนี้รวบรวมข้อความที่อยู่ในคำสั่งตอบรับและบทสนทนาแบบเรียกใช้ทันที เพื่อไม่ให้ข้อความนอกชุดตัวแปรหลักตกหล่น')
for label,s in [('game.js',src),('intro-cinematic.js',intro)]:
    doc.add_heading(label,2)
    for m in re.finditer(r'(?:quizFeedback\.textContent|quizHeading\.textContent|quizQuestion\.textContent)\s*=\s*([^;\n]+)|\bopenDialogue\s*\(',s):
        start=m.start()
        if 'openDialogue' in m.group(0):
            pos=s.find('(',start)
            try:code=extract_balanced(s,pos,'(',')')
            except Exception:continue
            if len(code)>4500:continue
            if code.startswith('(lines,'):continue
            val='openDialogue'+code
        else:val=m.group(0)
        doc.add_paragraph(val)
doc.add_heading('บัญชีชุดบทสนทนาและคำถามในโค้ด (ตรวจสอบความครบถ้วน)',1)
for name in sorted(arrays):
    if any(k in name.lower() for k in ('quiz','lines','dialogue','ending')):
        doc.add_paragraph(name)
for name in sorted(intro_arrays):
    doc.add_paragraph('intro-cinematic.js: '+name)
doc.add_paragraph('เอกสารนี้สร้างจากโค้ดเกมโดยอัตโนมัติ ข้อความต้นฉบับในโค้ดไม่ได้ถูกแก้ไข')
doc.save(OUT)
print('CREATED',OUT,'dialogue entries',count,'bytes',OUT.stat().st_size)
