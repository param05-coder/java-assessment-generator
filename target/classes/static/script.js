'use strict';

const bank=window.JAVA_BANK||{};

const $=id=>document.getElementById(id);

const names=Object.keys(bank);


let current=[], selectedTitle='', selectedDuration=60, selectedPoints=5, selectedTopic='ALL';

const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function activate(tab){document.querySelectorAll('.tab').forEach(el=>{const yes=el.dataset.tab===tab;el.classList.toggle('active',yes);el.setAttribute('aria-selected',String(yes));});document.querySelectorAll('.tab-panel').forEach(el=>el.classList.toggle('active',el.id===tab));}
document.querySelectorAll('.tab').forEach(el=>el.addEventListener('click',()=>activate(el.dataset.tab)));
$('topic').innerHTML='<option value="ALL">All topics (mixed test)</option>'+names.map((n,i)=>`<option value="${i}">${escapeHtml(n)}</option>`).join('');
$('metric-topics').textContent=names.length;
$('metric-types').textContent=Object.values(bank).reduce((n,rows)=>n+rows.length,0);
$('topic-grid').innerHTML=names.map((n,i)=>`<button type="button" class="topic-card" data-topic="${i}"><span class="topic-number">${String(i+1).padStart(2,'0')}</span><strong>${escapeHtml(n)}</strong><span>${bank[n].length} questions</span><span class="topic-link">Select topic →</span></button>`).join('');
document.querySelectorAll('.topic-card').forEach(el=>el.addEventListener('click',()=>{$('topic').value=el.dataset.topic;activate('builder');$('topic').focus();}));
$('go-topics').addEventListener('click',()=>activate('topics'));
$('go-preview').addEventListener('click',()=>activate('preview'));
$('preview-key').addEventListener('click',()=>activate('answers'));
$('count').addEventListener('change',()=>{$('metric-questions').textContent=$('count').value;});
function showError(message, fieldId){
    $('status').textContent=message;
    $('status').classList.add('error');
    if(fieldId)$(fieldId).focus();
}
function readSettings(){
    const title=$('title').value.trim();
    const duration=Number($('duration').value);
    const points=Number($('points').value);
    if(!title){showError('Please enter a test title.','title');return null;}
    if(!Number.isInteger(duration)||duration<1||duration>300){
        showError('Duration must be a whole number from 1 to 300 minutes.','duration');return null;
    }
    if(!Number.isInteger(points)||points<1||points>100){
        showError('Points per question must be a whole number from 1 to 100.','points');return null;
    }
    return {title,duration,points};
}
function buildPool(topicIndex){
    const topicNames=topicIndex==='ALL'?names:[names[Number(topicIndex)]];
    return topicNames.flatMap(n=>bank[n].map(([type,q,a],order)=>({topic:n,type,q,a,order})));
}
function generate(){
    $('status').classList.remove('error');
    const settings=readSettings();
    if(!settings)return;
    const requested=Number($('count').value), topicIndex=$('topic').value;
    selectedTopic=topicIndex==='ALL'?'Mixed Java Topics':names[Number(topicIndex)];
    const pool=buildPool(topicIndex);
    if(!pool.length){showError('No questions available for this topic.');return;}

    // Pick a random set every time; never repeat a question.
    const count=Math.min(requested,pool.length);
    current=shuffle([...pool]).slice(0,count);
    if(!$('shuffle').checked){
        // Keep the bank's order when shuffling is turned off.
        current.sort((x,y)=>names.indexOf(x.topic)-names.indexOf(y.topic)||x.order-y.order);
    }
    selectedTitle=settings.title;
    selectedDuration=settings.duration;
    selectedPoints=settings.points;
    $('metric-questions').textContent=count;
    $('test-heading').textContent=selectedTitle;
    $('test-output').classList.remove('placeholder');
    $('test-output').innerHTML=`<div class="test-meta"><p><strong>Name:</strong> __________________________________ <strong>Date:</strong> _______________</p><p><strong>Topic:</strong> ${escapeHtml(selectedTopic)} &nbsp; <strong>Duration:</strong> ${selectedDuration} minutes &nbsp; <strong>Total:</strong> ${count*selectedPoints} points</p></div>`+current.map((item,i)=>`<article class="question"><div class="question-label">${escapeHtml(item.topic)} · ${escapeHtml(item.type)}</div><p><strong>${i+1}.</strong> ${escapeHtml(item.q)} <span class="point-label">(${selectedPoints} points)</span></p><div class="student-work"><label for="student-answer-${i}">Your answer</label><textarea id="student-answer-${i}" class="student-answer" data-index="${i}" rows="3" placeholder="Type your answer here..."></textarea><div class="student-controls"><button type="button" class="check-answer" data-index="${i}">Check answer</button><button type="button" class="ask-question" data-index="${i}">Explain in chatbot</button></div><div class="answer-feedback" id="feedback-${i}" aria-live="polite"></div></div></article>`).join('');
    $('answer-output').classList.remove('placeholder');
    $('answer-output').innerHTML=`<div class="test-meta"><strong>${escapeHtml(selectedTitle)}</strong><p>${escapeHtml(selectedTopic)} · ${count} questions · ${count*selectedPoints} points</p></div>`+current.map((item,i)=>`<article class="key-row"><strong>${i+1}.</strong> ${escapeHtml(item.a)}<div class="question-label">${escapeHtml(item.topic)} · ${escapeHtml(item.type)}</div></article>`).join('');
    $('chat-question').innerHTML='<option value="">Choose a question (optional)</option>'+current.map((item,i)=>`<option value="${i}">Question ${i+1}: ${escapeHtml(item.q.slice(0,72))}</option>`).join('');
    $('status').textContent=count<requested
        ?`Only ${pool.length} questions exist for ${selectedTopic}, so the test has ${count} instead of ${requested}.`
        :`Test generated successfully: ${count} questions. Open Test Preview to review.`;
    activate('preview');
}
$('generate').addEventListener('click',generate);

function printView(which){if(!current.length){alert('Please generate a test first.');activate('builder');return;}activate(which);document.body.dataset.print=which;window.print();}
$('print').addEventListener('click',()=>printView('preview'));
$('keyprint').addEventListener('click',()=>printView('answers'));
window.addEventListener('afterprint',()=>{delete document.body.dataset.print;});


// Student workspace and local, question-bank-based Java tutor.
// No external AI service or API key is required.
function normalizeAnswer(value) {
    return String(value).toLowerCase().replace(/\s+/g,'')
        .replace(/[−–]/g,'-').replace(/×/g,'*').replace(/÷/g,'/')
        .replace(/\^/g,'').replace(/²/g,'2').replace(/³/g,'3')
        .replace(/\bplusc\b/g,'+c').replace(/\*/g,'');
}
function numericAnswer(value) {
    const s=normalizeAnswer(value);
    if (/^[+-]?\d+(\.\d+)?(\/[+-]?\d+(\.\d+)?)?$/.test(s)) {
        const bits=s.split('/');return Number(bits[0])/(bits.length===2?Number(bits[1]):1);
    }
    return null;
}
function answerMatches(given, expected) {
    const a=normalizeAnswer(given), b=normalizeAnswer(expected);
    if (!a) return false;
    if (a===b) return true;
    const x=numericAnswer(given), y=numericAnswer(expected);
    return x!==null && y!==null && Number.isFinite(x) && Number.isFinite(y) && Math.abs(x-y)<1e-8;
}
const topicTips={
    'Variables & Data Types':'Check the type of every value: int / int drops the decimal, (int) casting cuts off the decimal part, and a String followed by + joins text from left to right.',
    'Conditionals':'Test the conditions from top to bottom. Only the first true if / else-if branch runs, a switch keeps running into the next case until it reaches break, and && and || stop as soon as the result is known.',
    'Loops':'Make a trace table of the loop variable. for and while check the condition before the body, do-while checks it after, continue skips to the next round and break leaves the loop.',
    'Arrays':'Indexes start at 0 and the last one is length - 1. New arrays are filled with 0, 0.0, false or null, and two variables can point to the same array.'
};
function explainQuestion(item) {
    const tip=topicTips[item.topic]||'Review the Java rule this question is about.';
    const isOutput=item.q.startsWith('Predict the output:');
    const lines=isOutput?[
        'Step 1: Read the code one statement at a time and write down each variable\'s value.',
        'Step 2: '+tip,
        'Step 3: Write exactly what is printed. print stays on the same line; println moves to a new line.'
    ]:[
        'Step 1: Find the Java concept the question is asking about.',
        'Step 2: '+tip,
        'Step 3: Answer with the exact Java keyword, type, value or expression.'
    ];
    return `Question: ${item.q}\n\n${lines.join('\n')}\n\nAnswer in the question bank: ${item.a}`;
}
function tutorReply(text, selectedIndex) {
    if (!current.length) return 'Generate a test first so I can use its questions and answer key.';
    const input=text.trim();
    if (!input && selectedIndex===null) return 'Enter a question number or choose a question from the list.';
    let idx=selectedIndex;
    if (idx===null) {
        const number=input.match(/^(?:question\s*|q\s*|#)(\d+)\b/i);
        if (number && Number(number[1])>=1 && Number(number[1])<=current.length) idx=Number(number[1])-1;
        if (idx===null) idx=current.findIndex(item=>item.q.toLowerCase()===input.toLowerCase());
        if (idx===-1) idx=current.findIndex(item=>input.length>12 && (item.q.toLowerCase().includes(input.toLowerCase()) || input.toLowerCase().includes(item.q.toLowerCase())));
    }
    if (idx===null || idx<0 || idx>=current.length) return 'I can explain questions from the generated test. Select a question from the menu, enter “Question 1”, or paste its exact question text.';
    return explainQuestion(current[idx]);
}
function appendChat(role, message) {
    const node=document.createElement('div');node.className='chat-message '+role;
    node.textContent=message;$('chat-history').appendChild(node);
    $('chat-history').scrollTop=$('chat-history').scrollHeight;
}
function askTutor(index=null) {
    if (index!==null) $('chat-question').value=String(index);
    const raw=$('chat-input').value;
    const indexFromSelect=$('chat-question').value;
    const chosen=index!==null?index:(indexFromSelect===''?null:Number(indexFromSelect));
    appendChat('student',raw.trim()||(chosen!==null?`Please explain question ${chosen+1}.`:'Please explain this question.'));
    appendChat('tutor',tutorReply(raw,chosen));
    $('chat-input').value='';
}
$('test-output').addEventListener('click',event=>{
    const check=event.target.closest('.check-answer');
    const ask=event.target.closest('.ask-question');
    if(check){
        const i=Number(check.dataset.index), given=$('student-answer-'+i).value.trim();
        const feedback=$('feedback-'+i);
        feedback.className='answer-feedback '+(!given?'':answerMatches(given,current[i].a)?'correct':'incorrect');
        feedback.textContent=!given?'Please type your answer first.':answerMatches(given,current[i].a)?'Correct answer!':'Not matched to the answer key. Check your spelling and spacing, or use the chatbot for help.';
    }
    if(ask){const i=Number(ask.dataset.index);$('chat-question').value=String(i);askTutor(i);$('chat-panel').scrollIntoView({behavior:'smooth',block:'start'});}
});
$('chat-send').addEventListener('click',()=>askTutor());
$('chat-input').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();askTutor();}});