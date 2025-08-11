(function(){
  'use strict';
  // ---------- State ----------
  const state = {
    dataset: null,
    themes: [],
    selection: new Set(),
    mode: null,            // 'practice' | 'exam'
    questions: [],
    index: 0,
    answers: [],           // {id, pickedIndex, correct, theme}
    lastSelection: null,   // { mode, themes }
  };

  // ---------- Elements ----------
  const $ = sel => document.querySelector(sel);
  const app = $('#app');
  const views = {
    home: $('#view-home'),
    practiceSettings: $('#view-practice-settings'),
    examSettings: $('#view-exam-settings'),
    quiz: $('#view-quiz'),
    results: $('#view-results'),
  };
  const els = {
    btnHome: $('#btn-home'),
    goPractice: $('#go-practice'),
    goExam: $('#go-exam'),
    themesWrap: $('#themes'),
    allThemes: $('#all-themes'),
    startPractice: $('#start-practice'),
    lastHome: $('#last-home'),
    resumeWrap: $('#resume-wrap'),
    resumeBtn: $('#resume-practice'),
    practiceAvailability: $('#practice-availability'),
    practiceCount: $('#practice-count'),
    startExam: $('#start-exam'),
    progress: $('#progress-bar'),
    status: $('#status'),
    qCard: $('#question-card'),
    qMeta: $('#q-meta'),
    qText: $('#q-text'),
    qForm: $('#q-form'),
    qExpl: $('#q-expl'),
    btnPrev: $('#btn-prev'),
    btnNext: $('#btn-next'),
    lastFooter: $('#last-result'),
    resSummary: $('#results-summary'),
    resDetails: $('#results-details'),
    btnRetrySame: $('#btn-retry-same'),
    btnRetryNew: $('#btn-retry-new'),
  };

  
function updatePracticeAvailability(){
  if (!state.dataset || !state.themes) return;
  const themes = (typeof selectedThemes==='function') ? selectedThemes() : state.themes;
  const pool = state.dataset.filter(q=>themes.includes(q.category));
  const n = pool.length;
  const want = parseInt(els.practiceCount?.value||'10',10);
  if (els.practiceAvailability){
    els.practiceAvailability.textContent = themes.length? `Beschikbaar in selectie: ${n} vragen` : 'Kies één of meer thema’s (of Alle thema’s)';
  }
  if (els.startPractice){
    els.startPractice.textContent = `Start Oefenen (${want})`;
    els.startPractice.disabled = !themes.length || n===0;
  }
  try{ localStorage.setItem('imker:practiceCount', String(want)); }catch{}
}
function saveResumeIfPractice(){
  if (state.mode!=='practice' || !state.questions?.length) return;
  const snapshot = {
    ts: Date.now(),
    mode: 'practice',
    index: state.index,
    answers: state.answers,
    qIds: state.questions.map(q=>q.__id),
    themes: state.lastSelection?.themes || []
  };
  try{ localStorage.setItem('imker:resume', JSON.stringify(snapshot)); }catch{}
}
function clearResume(){ try{ localStorage.removeItem('imker:resume'); }catch{} }
function hasResume(){ try{ return !!localStorage.getItem('imker:resume'); }catch{ return false; } }
function loadResume(){
  try{
    const raw = localStorage.getItem('imker:resume');
    if (!raw) return null;
    const snap = JSON.parse(raw);
    if (snap?.mode!=='practice' || !Array.isArray(snap.qIds)) return null;
    return snap;
  }catch{ return null; }
}
function showResumeCTA(){
  const ok = hasResume();
  if (els.resumeWrap){ els.resumeWrap.style.display = ok ? '' : 'none'; }
}
// ---------- Utilities ----------
  const fmtDate = (d=new Date()) => {
    const pad=n=>String(n).padStart(2,'0');
    return `${pad(d.getDate())}-${pad(d.getMonth()+1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const shuffle = arr => { for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]];} return arr; };
  const sum = arr => arr.reduce((a,b)=>a+b,0);
  function largestRemainder(targetTotal, weights){
    const total = sum(weights);
    if (total===0) return weights.map(_=>0);
    const raw = weights.map(w => w/total * targetTotal);
    const base = raw.map(x => Math.floor(x));
    let remaining = targetTotal - sum(base);
    const rema = raw.map((x,i)=>({i, r: x - base[i]})).sort((a,b)=>b.r-a.r);
    for(let k=0;k<rema.length && remaining>0;k++){ base[rema[k].i]++; remaining--; }
    return base;
  }

  // ---------- Data Load & Normalize ----------
  async function ensureDataLoaded(){
    if (state.dataset) return;
    const res = await fetch('./data/oefenvragen_nbv.json');
    const raw = await res.json();
    const seen = new Set();
    const adapted = [];
    for (const q of raw){
      const category = q.thema?.trim();
      const question = q.vraag?.trim();
      if (!category || !question) continue;
      const key = `${category}__${question}`;
      if (seen.has(key)) continue; seen.add(key);
      const choices = (q.opties || []).map(opt => String(opt).replace(/^\s*[a-dA-D]\)\s*/, ''));
      const answerIndex = (typeof q.antwoord === 'string') ? ({a:0,b:1,c:2,d:3}[q.antwoord.toLowerCase()] ?? 0) : 0;
      adapted.push({
        __id: adapted.length,
        category,
        question,
        choices,
        answer: answerIndex,
        difficulty: Number.isInteger(q.difficulty) ? Math.max(1, Math.min(3, q.difficulty)) : 1,
        explanation: q.explanation ?? ''
      });
    }
    state.dataset = adapted;
    state.themes = [...new Set(adapted.map(q=>q.category))].sort((a,b)=>a.localeCompare(b,'nl'));
  }

  // ---------- Views & Navigation ----------
  function show(view){
    Object.values(views).forEach(v=>v.classList.remove('active'));
    view.classList.add('active');
    window.scrollTo({top:0,behavior:'instant'});
  }

  async function enterPracticeSettings(){
    state.mode = 'practice';
    await ensureDataLoaded();
    renderThemeList();
    updatePracticeAvailability();
    showResumeCTA();
    show(views.practiceSettings);
  }
  async function enterExamSettings(){
    state.mode = 'exam';
    await ensureDataLoaded();
    show(views.examSettings);
  }

  function renderThemeList(){
    const wrap = els.themesWrap; wrap.innerHTML = '';
    state.themes.forEach(theme => {
      const id = `th-${theme.replace(/[^a-z0-9]+/gi,'-')}`;
      const label = document.createElement('label');
      label.className = 'check';
      label.innerHTML = `
        <input type="checkbox" data-theme="${theme}" id="${id}">
        <span>${theme}</span>
      `;
      wrap.appendChild(label);
    });
  }
  function selectedThemes(){
    const all = Array.from(els.themesWrap.querySelectorAll('input[type="checkbox"]'));
    return all.filter(cb=>cb.checked).map(cb=>cb.dataset.theme);
  }

  function buildSession({mode, themes, count}){
    const pool = (mode==='exam') ? state.dataset.slice() : state.dataset.filter(q=>themes.includes(q.category));
    const themeList = (mode==='exam') ? state.themes : themes;
    const perThemeCounts = themeList.map(t => pool.filter(q=>q.category===t).length);
    const alloc = largestRemainder(count, perThemeCounts);

    const picked = [];
    themeList.forEach((t, idx)=>{
      const need = alloc[idx];
      if (!need) return;
      const from = shuffle(pool.filter(q=>q.category===t).slice());
      for (let i=0;i<need && i<from.length;i++) picked.push(from[i]);
    });

    state.mode = mode;
    state.questions = shuffle(picked).map(q=>({...q}));
    state.index = 0;
    state.answers = new Array(state.questions.length).fill(null);
    state.lastSelection = { mode, themes: (mode==='exam'? state.themes.slice() : themes.slice()) };
  }

  function updateProgress(){
    const pct = ((state.index)/state.questions.length)*100;
    els.progress.style.width = `${pct}%`;
    const correctSoFar = state.answers.filter(a=>a && a.correct).length;
    els.status.textContent = `${state.index} / ${state.questions.length} · goed: ${correctSoFar}`;
  }

  function renderQuestion(){
    const i = state.index;
    const q = state.questions[i];
    if (!q){ show(views.results); return; }
    els.qMeta.textContent = `${state.mode==='exam' ? 'Examen' : 'Oefenen'} · Thema: ${q.category}`;
    els.qText.textContent = q.question;

    els.btnNext.disabled = true;
    els.qForm.innerHTML = '';
    q.choices.forEach((choice, idx)=>{
      const id = `opt-${i}-${idx}`;
      const label = document.createElement('label');
      label.className = 'option';
      label.setAttribute('role','radio');
      label.setAttribute('aria-checked','false');
      label.innerHTML = `
        <input type="radio" name="q${i}" id="${id}" value="${idx}" />
        <span><strong>${String.fromCharCode(97+idx)})</strong> ${choice}</span>
      `;
      label.addEventListener('click', ()=> onPick(idx));
      els.qForm.appendChild(label);
    });

    const ans = state.answers[i];
    els.qExpl.hidden = true; els.qExpl.textContent = '';
    if (ans){
      markFeedback(ans.pickedIndex, ans.correctIndex);
      if (state.mode==='practice' && q.explanation){ els.qExpl.hidden = false; els.qExpl.textContent = q.explanation; }
    }

    els.btnPrev.disabled = (i===0);
    els.btnNext.textContent = (i === state.questions.length-1) ? 'Afronden' : 'Volgende →';
    updateProgress();
    saveResumeIfPractice();
  }

  function markFeedback(picked, correct){
    els.qForm.querySelectorAll('.option').forEach((el, idx)=>{
      el.dataset.state = '';
      if (idx===correct) el.dataset.state = 'correct';
      if (idx===picked && picked!==correct) el.dataset.state = 'wrong';
      el.setAttribute('aria-checked', String(idx===picked));
    });
  }

  function onPick(idx){
    els.btnNext.disabled = false;

    const i = state.index; const q = state.questions[i];
    const correct = (idx === q.answer);
    if (correct) { try{ els.btnNext.focus(); }catch{} }
    state.answers[i] = {
      id: q.__id,
      pickedIndex: idx,
      correctIndex: q.answer,
      correct,
      theme: q.category
    };
    if (state.mode==='practice'){
      markFeedback(idx, q.answer);
      if (q.explanation){ els.qExpl.hidden = false; els.qExpl.textContent = q.explanation; }
    }
    updateProgress();
    saveResumeIfPractice();
  }

  function next(){
    if (state.index < state.questions.length - 1){ state.index++; renderQuestion(); }
    else { finish(); }
  }
  function prev(){ if (state.index>0){ state.index--; renderQuestion(); } }

  function finish(){
    clearResume();
    const total = state.questions.length;
    const correct = state.answers.filter(a=>a && a.correct).length;
    const pct = Math.round((correct/total)*100);

    const per = new Map();
    state.answers.forEach(a=>{
      if (!a) return;
      const t=a.theme;
      if(!per.has(t)) per.set(t,{good:0,total:0});
      per.get(t).total++; if (a.correct) per.get(t).good++;
    });

    const weak = Array.from(per.entries())
      .map(([t,v])=>({theme:t, pct: v.total? Math.round((v.good/v.total)*100) : 0}))
      .filter(x=>x.pct<80)
      .sort((a,b)=>a.pct-b.pct)
      .slice(0,3)
      .map(x=>x.theme);

    els.resSummary.innerHTML = `
      <h3>Samenvatting</h3>
      <p><strong>Score:</strong> ${correct}/${total} (${pct}%)</p>
      <p><strong>Advies:</strong> ${weak.length? `oefen extra met ${weak.join(', ')}` : 'ga zo door' }.</p>
    `;

    let perHtml = '<h3>Per thema</h3><ul>';
    Array.from(per.entries()).sort((a,b)=>a[0].localeCompare(b[0],'nl')).forEach(([t,v])=>{
      const tpct = v.total? Math.round((v.good/v.total)*100) : 0;
      perHtml += `<li><strong>${t}</strong>: ${v.good}/${v.total} (${tpct}%)</li>`;
    });
    perHtml += '</ul>';

    if (state.mode==='exam'){
      perHtml += '<h3>Volledige lijst</h3><ol>';
      state.questions.forEach((q, i)=>{
        const a = state.answers[i];
        const your = a? String.fromCharCode(97 + a.pickedIndex) : '—';
        const right = String.fromCharCode(97 + q.answer);
        perHtml += `<li><em>${q.category}</em>: ${q.question}<br>Jouw antwoord: <strong>${your}</strong>; Juist: <strong>${right}</strong>${q.explanation? `<br><small>Uitleg: ${q.explanation}</small>`:''}</li>`;
      });
      perHtml += '</ol>';
    }
    els.resDetails.innerHTML = perHtml;

    if (state.mode==='practice'){
      els.btnRetrySame.textContent = 'Opnieuw (zelfde selectie)';
      els.btnRetryNew.textContent = 'Opnieuw (andere selectie)';
      els.btnRetrySame.classList.remove('hidden');
      els.btnRetryNew.classList.remove('hidden');
    } else {
      els.btnRetrySame.textContent = 'Start nieuw proefexamen';
      els.btnRetrySame.classList.remove('hidden');
      els.btnRetryNew.classList.add('hidden');
    }

    persistSession({
      mode: state.mode,
      themes: state.lastSelection?.themes ?? [],
      answers: state.answers,
      total,
      correct,
      pct
    });
    show(views.results);
  }

  // ---------- Persistence ----------
  function persistSession({mode,themes,answers,total,correct,pct}){
    const date = new Date();
    const last = `${correct}/${total} (${pct}%) – ${fmtDate(date)}`;
    localStorage.setItem('imker:last', last);

    const sess = {
      id: cryptoRandomId(),
      mode,
      dateISO: date.toISOString(),
      themes,
      questionCount: total,
      answers: answers.map(a=>({id:a?.id??null, correct: !!(a&&a.correct), theme: a?.theme??null})),
      score: {correct, total, pct}
    };
    const allRaw = localStorage.getItem('imker:sessions');
    const all = allRaw? JSON.parse(allRaw) : [];
    all.push(sess);
    localStorage.setItem('imker:sessions', JSON.stringify(all));

    els.lastFooter.textContent = last;
  }

  function cryptoRandomId(){
    const bytes = new Uint8Array(6); crypto.getRandomValues(bytes);
    return Array.from(bytes, b=>b.toString(16).padStart(2,'0')).join('');
  }
  function restoreFooter(){
    const last = localStorage.getItem('imker:last');
    els.lastFooter.textContent = last || '';
  }

  // ---------- Events ----------
  app.addEventListener('click', (e)=>{
    const nav = e.target.closest('[data-nav]');
    if (nav){ const target = nav.getAttribute('data-nav'); if (target==='home'){ resetToHome(); } }
  });

  els.btnHome.addEventListener('click', resetToHome);
  els.goPractice.addEventListener('click', enterPracticeSettings);
  els.goExam.addEventListener('click', enterExamSettings);

  els.allThemes.addEventListener('change', (e)=>{
    const all = e.target.checked;
    els.themesWrap.querySelectorAll('input[type="checkbox"]').forEach(cb=> cb.checked = all);
  });

  els.startPractice.addEventListener('click', ()=>{
    const themes = selectedThemes();
    if (!themes.length){ alert('Selecteer minimaal één thema (of kies Alle thema’s).'); return; }
    buildSession({mode:'practice', themes, count: parseInt(els.practiceCount?.value||'10',10)});
    show(views.quiz); renderQuestion();
  });

  els.startExam.addEventListener('click', ()=>{
    buildSession({mode:'exam', themes: state.themes.slice(), count:30});
    show(views.quiz); renderQuestion();
  });

  els.btnNext.addEventListener('click', next);
  els.btnPrev.addEventListener('click', prev);
if (els.themesWrap){ els.themesWrap.addEventListener('change', updatePracticeAvailability); }
if (els.allThemes){
  els.allThemes.addEventListener('change', ()=>{
    const cbs = els.themesWrap.querySelectorAll('input[type="checkbox"]');
    cbs.forEach(cb=> cb.checked = els.allThemes.checked);
    updatePracticeAvailability();
  });
}
if (els.practiceCount){
  const savedCount = localStorage.getItem('imker:practiceCount');
  if (savedCount) els.practiceCount.value = savedCount;
  els.practiceCount.addEventListener('change', updatePracticeAvailability);
}
if (els.resumeBtn){
  els.resumeBtn.addEventListener('click', async ()=>{
    await ensureDataLoaded();
    const snap = loadResume();
    if (!snap) return;
    const idToQ = new Map(state.dataset.map(q=>[q.__id, q]));
    const qs = snap.qIds.map(id=> ({...idToQ.get(id)}));
    state.mode = 'practice';
    state.questions = qs;
    state.index = Math.min(snap.index || 0, qs.length-1);
    state.answers = Array.isArray(snap.answers)? snap.answers : new Array(qs.length).fill(null);
    state.lastSelection = { mode:'practice', themes: snap.themes || [] };
    show(views.quiz); renderQuestion();
  });
}


  els.btnRetrySame.addEventListener('click', ()=>{
    if (!state.lastSelection){ resetToHome(); return; }
    const { mode, themes } = state.lastSelection;
    if (mode==='practice'){
      buildSession({mode:'practice', themes: themes.slice(), count:10});
      show(views.quiz); renderQuestion();
    } else {
      buildSession({mode:'exam', themes: state.themes.slice(), count:30});
      show(views.quiz); renderQuestion();
    }
  });
  els.btnRetryNew.addEventListener('click', ()=>{
    if (state.mode==='practice') enterPracticeSettings();
    else enterExamSettings();
  });

  function resetToHome(){
    Object.assign(state, { mode:null, questions:[], index:0, answers:[] });
    show(views.home);
  }

  // init
  show(views.home);
  restoreFooter();
})();