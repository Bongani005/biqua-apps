const STORAGE_KEY = 'az900-study-progress-v1';
const state = { data: null, sectionIndex: 0, questionIndex: 0, visibleQuestions: [], completed: new Set(), shuffled: false };
const $ = (id) => document.getElementById(id);

function loadProgress(){ try { state.completed = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); } catch { state.completed = new Set(); } }
function saveProgress(){ localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.completed])); }
function allQuestions(){ return state.data.sections.flatMap(s => s.questions.map(q => ({...q, sectionId:s.id, sectionTitle:s.title || sectionLabel(s.id)}))); }
function sectionLabel(id){ return id.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase()).replace('Az','AZ'); }
function currentSection(){ return state.data.sections[state.sectionIndex]; }
function currentQuestion(){ return state.visibleQuestions[state.questionIndex]; }
function key(q){ return `${q.sectionId}:${q.number}`; }
function escapeHtml(value){ return String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function renderNav(){
  $('sectionNav').innerHTML = state.data.sections.map((s,i)=>`<button class="section-link ${i===state.sectionIndex?'active':''}" data-section="${i}"><span class="min-w-0 truncate">${escapeHtml(sectionLabel(s.id))}</span><span class="section-count">${s.questions.length}</span></button>`).join('');
  document.querySelectorAll('[data-section]').forEach(btn=>btn.addEventListener('click',()=>selectSection(Number(btn.dataset.section))));
}
function selectSection(index){ state.sectionIndex=index;state.questionIndex=0;state.shuffled=false;renderNav();refreshQuestions();$('sidebar').classList.remove('mobile-open'); }
function refreshQuestions(){
  const section=currentSection(); const term=$('searchInput').value.trim().toLowerCase(); const filter=$('viewFilter').value;
  let qs=section.questions.map(q=>({...q,sectionId:section.id}));
  if(term) qs=qs.filter(q=>`${q.question_and_options} ${q.answer} ${q.answer_explanation}`.toLowerCase().includes(term));
  if(filter==='completed') qs=qs.filter(q=>state.completed.has(key(q)));
  if(filter==='unanswered') qs=qs.filter(q=>!state.completed.has(key(q)));
  if(state.shuffled) qs=shuffle([...qs]);
  state.visibleQuestions=qs;
  state.questionIndex=Math.min(state.questionIndex,Math.max(0,qs.length-1));
  renderQuestion();renderStats();
}
function shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
function renderStats(){
  const total=allQuestions().length; $('totalCount').textContent=total; $('completedCount').textContent=state.completed.size;
  const section=currentSection();const done=section.questions.filter(q=>state.completed.has(`${section.id}:${q.number}`)).length;const pct=section.questions.length?Math.round(done/section.questions.length*100):0;
  $('progressBar').style.width=pct+'%';$('progressLabel').textContent=pct+'%';$('sectionTitle').textContent=sectionLabel(section.id);$('sectionMeta').textContent=`${section.questions.length} questions · ${done} completed`;
}
function renderQuestion(){
  const q=currentQuestion();const empty=!q;$('emptyState').classList.toggle('hidden',!empty);$('questionText').classList.toggle('hidden',empty);$('revealBtn').classList.toggle('hidden',empty);$('answerPanel').classList.add('hidden');
  if(empty){$('questionNumber').textContent='—';$('positionLabel').textContent='No matching questions';$('completionBadge').classList.add('hidden');$('prevBtn').disabled=true;$('nextBtn').disabled=true;return;}
  $('completionBadge').classList.remove('hidden');$('questionNumber').textContent=`${q.number}`;$('questionText').textContent=q.question_and_options;$('answerText').textContent=q.answer||'No answer was extracted for this question.';$('explanationText').textContent=(q.answer_explanation && q.answer_explanation!==q.answer)?q.answer_explanation:'';
  const done=state.completed.has(key(q));$('completionBadge').textContent=done?'Completed':'Not completed';$('completionBadge').classList.toggle('done',done);$('markDoneBtn').textContent=done?'Completed ✓':'Mark as completed';$('positionLabel').textContent=`Question ${state.questionIndex+1} of ${state.visibleQuestions.length}`;$('prevBtn').disabled=state.questionIndex===0;$('nextBtn').disabled=state.questionIndex===state.visibleQuestions.length-1;
}
function move(delta){const next=state.questionIndex+delta;if(next<0||next>=state.visibleQuestions.length)return;state.questionIndex=next;renderQuestion();}
function reveal(){if(!currentQuestion())return;$('answerPanel').classList.remove('hidden');$('revealBtn').classList.add('hidden');}
function markDone(){const q=currentQuestion();if(!q)return;state.completed.add(key(q));saveProgress();renderStats();renderQuestion();$('answerPanel').classList.remove('hidden');$('revealBtn').classList.add('hidden');}

async function init(){
  try{
    const response=await fetch('./questions.json');if(!response.ok)throw new Error('Could not load questions.json');state.data=await response.json();
    loadProgress();$('sourceTitle').textContent=`${state.data.source.title} · ${state.data.source.author}`;
    $('totalCount').textContent=allQuestions().length;renderNav();refreshQuestions();
  }catch(error){$('sourceTitle').textContent='Unable to load the question bank.';$('questionText').textContent='Start the app using a local web server and make sure questions.json is in the same folder. See README.md for instructions.';console.error(error);}
}
$('prevBtn').addEventListener('click',()=>move(-1));$('nextBtn').addEventListener('click',()=>move(1));$('revealBtn').addEventListener('click',reveal);$('hideAnswerBtn').addEventListener('click',()=>{$('answerPanel').classList.add('hidden');$('revealBtn').classList.remove('hidden');});$('markDoneBtn').addEventListener('click',markDone);
$('searchInput').addEventListener('input',()=>{state.questionIndex=0;refreshQuestions();});$('viewFilter').addEventListener('change',()=>{state.questionIndex=0;refreshQuestions();});
$('shuffleBtn').addEventListener('click',()=>{state.shuffled=!state.shuffled;state.questionIndex=0;$('shuffleBtn').innerHTML=state.shuffled?'↻ <span>Unshuffle</span>':'↻ <span>Shuffle</span>';refreshQuestions();});
$('resetBtn').addEventListener('click',()=>{if(confirm('Clear all completed-question progress on this browser?')){state.completed.clear();saveProgress();refreshQuestions();}});
$('clearSearchBtn').addEventListener('click',()=>{$('searchInput').value='';$('viewFilter').value='all';refreshQuestions();});
$('mobileMenuBtn').addEventListener('click',()=>{$('sidebar').classList.toggle('mobile-open');});
document.addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea'))return;if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1);if(e.key==='Enter'&&!$('answerPanel').classList.contains('hidden'))return;if(e.key==='Enter')reveal();});
init();
