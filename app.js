
(function(){
  'use strict';

  // ---------- State ----------
  const state = {
    dataset: null,
    themes: [],
    mode: null,            // 'practice' | 'exam'
    questions: [],
    index: 0,
    answers: [],           // {id, pickedIndex, correctIndex, correct, theme, locked?}
    lastSelection: null,
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
    practiceAvailability: $('#practice-availability'),
    practiceCount: $('#practice-count'),
    startExam: $('#start-exam'),
    progress: $('#progress-bar'),
    status: $('#status'),
    qMeta: $('#q-meta'),
    qText: $('#q-text'),
    qForm: $('#q-form'),
    qExpl: $('#q-expl'),
    btnPrev: $('#btn-prev'),
    btnNext: $('#btn-next'),
    historyBody: $('#history-body'),
    resSummary: $('#results-summary'),
    resDetails: $('#results-details'),
    btnRetrySame: $('#btn-retry-same'),
    btnRetryNew: $('#btn-retry-new'),
    btnResetHistory: $('#btn-reset-history'),
  };

  // ---------- Utilities ----------
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
    if (els.allThemes) els.allThemes.checked = false;
    await ensureDataLoaded();
    renderThemeList();
    updatePracticeAvailability();
    show(views.practiceSettings);
  }
  async function enterExamSettings(){
    state.mode = 'exam';
    await ensureDataLoaded();
    show(views.examSettings);
  }

  // ---------- Practice availability ----------
  function updatePracticeAvailability(){
    if (!state.dataset || !state.themes) return;
    const themes = selectedThemes();
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

  function renderThemeList(){
  const wrap = els.themesWrap; 
  wrap.innerHTML = '';

  // "Alle thema’s" als eerste checkbox (zelfde styling)
  const labelAll = document.createElement('label');
  labelAll.className = 'check';
  labelAll.innerHTML = '<input type="checkbox" id="all-themes"><span>Alle thema’s</span>';
  wrap.appendChild(labelAll);

  // Thema's
  state.themes.forEach(theme => {
    const id = `th-${theme.toLowerCase().replace(/[^a-z0-9]+/gi,'-')}`;
    const label = document.createElement('label');
    label.className = 'check';
    label.innerHTML = `
      <input type="checkbox" data-theme="${theme}" id="${id}">
      <span>${theme}</span>
    `;
    wrap.appendChild(label);
  });

  // Toggle "Alle thema’s"
  els.allThemes = document.getElementById('all-themes');
  if (els.allThemes){
    els.allThemes.addEventListener('change', ()=>{
      const all = els.allThemes.checked;
      wrap.querySelectorAll('input[type="checkbox"][data-theme]').forEach(cb=> cb.checked = all);
      updatePracticeAvailability();
    });
  }

  // Sync: als alle losse thema's aanstaan => "Alle thema’s" aan
  wrap.addEventListener('change', ()=>{
    if (!els.allThemes) return;
    const items = wrap.querySelectorAll('input[type="checkbox"][data-theme]');
    const allChecked = items.length>0 && Array.from(items).every(cb => cb.checked);
    els.allThemes.checked = allChecked;
  });
}
`;
    const label = document.createElement('label');
    label.className = 'check';
    label.innerHTML = `
      <input type="checkbox" data-theme="${theme}" id="${id}">
      <span>${theme}</span>
    `;
    wrap.appendChild(label);
  });

  els.allThemes = document.getElementById('all-themes');
  if (els.allThemes){
    els.allThemes.addEventListener('change', ()=>{
      const all = els.allThemes.checked;
      wrap.querySelectorAll('input[type="checkbox"][data-theme]').forEach(cb=> cb.checked = all);
      updatePracticeAvailability();
    });
  }

  wrap.addEventListener('change', ()=>{
    if (!els.allThemes) return;
    const items = wrap.querySelectorAll('input[type="checkbox"][data-theme]');
    const allChecked = items.length>0 && Array.from(items).every(cb => cb.checked);
    els.allThemes.checked = allChecked;
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
    els.status.textContent = (state.mode==='exam')
      ? `${state.index} / ${state.questions.length}`
      : `${state.index} / ${state.questions.length} · goed: ${correctSoFar}`;
  }

  function renderQuestion(){
    const i = state.index;
    const q = state.questions[i];
    if (!q){ show(views.results); return; }
    els.qMeta.textContent = `${state.mode==='exam' ? 'Examen' : 'Oefenen'} · Thema: ${q.category}`;
    els.qText.textContent = q.question;

    els.btnNext.disabled = true;
    els.btnNext.classList.remove('primary');
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

    // In oefenmodus: toon feedback als eerder beantwoord; in examenmodus niet.
    if (ans && state.mode==='practice'){
      markFeedback(ans.pickedIndex, ans.correctIndex);
      if (q.explanation){ els.qExpl.hidden = false; els.qExpl.textContent = q.explanation; }
      // Vergrendel opties indien locked (na fout antwoord)
      if (ans.locked){
        lockOptions();
        els.btnNext.disabled = false;
      els.btnNext.classList.add('primary');
      }
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

  function lockOptions(){
    els.qForm.querySelectorAll('input[type="radio"]').forEach(inp=>{ inp.disabled = true; });
    els.qForm.querySelectorAll('.option').forEach(el=>{ el.style.pointerEvents = 'none'; });
  }
  function unlockOptions(){
    els.qForm.querySelectorAll('input[type="radio"]').forEach(inp=>{ inp.disabled = false; });
    els.qForm.querySelectorAll('.option').forEach(el=>{ el.style.pointerEvents = ''; });
  }

  function onPick(idx){
    const i = state.index; const q = state.questions[i];
    const existing = state.answers[i];

    // In oefenmodus: na eerste keuze bij fout, vergrendelen; bij goed auto-door.
    if (state.mode==='practice'){
      // voorkomen dat UI niet altijd 'checked' toont: radio zelf ook activeren
      const input = els.qForm.querySelector(`input[type="radio"][name="q${i}"][value="${idx}"]`);
      if (input) input.checked = true;

      if (existing?.locked) return; // niet meer aanpassen

      const correct = (idx === q.answer);
      state.answers[i] = {
        id: q.__id,
        pickedIndex: idx,
        correctIndex: q.answer,
        correct,
        theme: q.category,
        locked: true // altijd vergrendelen na eerste keuze
      };

      // Toon feedback en eventuele uitleg
      markFeedback(idx, q.answer);
      if (q.explanation){ els.qExpl.hidden = false; els.qExpl.textContent = q.explanation; }

      // UI: opties vastzetten en Volgende aan + markeren
      lockOptions();
      els.btnNext.disabled = false;
      els.btnNext.classList.add('primary');
      return;
    }

    // In examenmodus: geen feedback tonen, geen vergrendeling; wel keuze registreren
    const wasSelected = (existing && existing.pickedIndex === idx);
    state.answers[i] = {
      id: q.__id,
      pickedIndex: idx,
      correctIndex: q.answer,
      correct: (idx === q.answer),
      theme: q.category,
      locked: false
    };
    // UI: geen markFeedback, geen uitleg
    els.qExpl.hidden = true;
    els.btnNext.disabled = false;
      els.btnNext.classList.add('primary');
  }

  function next(){
    if (state.index < state.questions.length - 1){ state.index++; renderQuestion(); }
    else { finish(); }
  }
  function prev(){
    if (state.index>0){ state.index--; renderQuestion(); }
  }

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
      // Tijdens examen geen feedback; hier na afloop: alleen fout beantwoorde vragen per thema
      const wrong = state.questions.map((q,i)=>({q,i,a:state.answers[i]}))
        .filter(x=>x.a && !x.a.correct);
      wrong.sort((x,y)=> x.q.category.localeCompare(y.q.category,'nl') || x.i - y.i);

      let list = '<h3>Fout beantwoorde vragen</h3>';
      if (wrong.length===0){
        list += '<p>Alles goed beantwoord. Uitstekend!</p>';
      } else {
        let currentTheme = null;
        list += '<div class="wrong-list">';
        wrong.forEach(({q,i,a})=>{
          if (q.category!==currentTheme){
            if (currentTheme!==null) list += '</ol>';
            currentTheme = q.category;
            list += `<h4>${currentTheme}</h4><ol>`;
          }
          const yourText = a.pickedIndex!=null ? `${String.fromCharCode(97+a.pickedIndex)}) ${q.choices[a.pickedIndex]}` : '—';
          const rightText = `${String.fromCharCode(97+q.answer)}) ${q.choices[q.answer]}`;
          list += `<li><div class="q">${q.question}</div>
                     <div class="ans"><strong>Jouw antwoord:</strong> ${yourText}</div>
                     <div class="ans"><strong>Juiste antwoord:</strong> ${rightText}</div>
                   </li>`;
        });
        if (currentTheme!==null) list += '</ol>';
        list += '</div>';
      }
      perHtml += list;

      els.btnRetrySame.textContent = 'Start nieuw proefexamen';
      els.btnRetrySame.classList.remove('hidden');
      els.btnRetryNew.classList.add('hidden');
    } else {
      els.btnRetrySame.textContent = 'Opnieuw (zelfde selectie)';
      els.btnRetrySame.classList.remove('hidden');
      els.btnRetryNew.classList.remove('hidden');
    }

    els.resDetails.innerHTML = perHtml;

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

  function persistSession({mode,themes,answers,total,correct,pct}){
    const date = new Date();
    const sess = {
      id: cryptoRandomId(),
      mode,
      dateISO: date.toISOString(),
      themes,
      questionCount: total,
      answers: answers.map(a=>({id:a?.id??null, correct: !!(a&&a.correct), theme: a?.theme??null})),
      score: {correct, total, pct}
    };
    try {
      const allRaw = localStorage.getItem('imker:sessions');
      const all = allRaw? JSON.parse(allRaw) : [];
      all.push(sess);
      localStorage.setItem('imker:sessions', JSON.stringify(all));
    } catch {}
  }

  function cryptoRandomId(){
    const bytes = new Uint8Array(6); crypto.getRandomValues(bytes);
    return Array.from(bytes, b=>b.toString(16).padStart(2,'0')).join('');
  }

  function renderHistory(){
  if (!els.historyBody) return;
  const card = document.getElementById('history');
  let all = [];
  try {
    const allRaw = localStorage.getItem('imker:sessions');
    all = allRaw ? JSON.parse(allRaw) : [];
  } catch {}
  els.historyBody.innerHTML = '';
  if (!all.length){
    if (card) card.classList.add('hidden');
    return;
  }
  if (card) card.classList.remove('hidden');
  all.slice().reverse().forEach(sess=>{
    const tr = document.createElement('tr');
    const type = sess.mode==='exam' ? 'Proefexamen' : 'Oefenen';
    const res = `${sess.score.correct}/${sess.score.total} (${sess.score.pct}%)`;
    const dt = new Date(sess.dateISO);
    const dateStr = dt.toLocaleString('nl-NL', {dateStyle:'medium', timeStyle:'short'});
    tr.innerHTML = `<td>${type}</td><td>${res}</td><td>${dateStr}</td>`;
    els.historyBody.appendChild(tr);
  });
}
if (card) card.classList.remove('hidden');
  all.slice().reverse().forEach(sess=>{
    const tr = document.createElement('tr');
    const type = sess.mode==='exam' ? 'Proefexamen' : 'Oefenen';
    const res = `${sess.score.correct}/${sess.score.total} (${sess.score.pct}%)`;
    const dt = new Date(sess.dateISO);
    const dateStr = dt.toLocaleString('nl-NL', {dateStyle:'medium', timeStyle:'short'});
    tr.innerHTML = `<td>${type}</td><td>${res}</td><td>${dateStr}</td>`;
    els.historyBody.appendChild(tr);
  });
}
all.slice().reverse().forEach(sess=>{
      const tr = document.createElement('tr');
      const type = sess.mode==='exam' ? 'Proefexamen' : 'Oefenen';
      const res = `${sess.score.correct}/${sess.score.total} (${sess.score.pct}%)`;
      const dt = new Date(sess.dateISO);
      const dateStr = dt.toLocaleString('nl-NL', {dateStyle:'medium', timeStyle:'short'});
      tr.innerHTML = `<td>${type}</td><td>${res}</td><td>${dateStr}</td>`;
      els.historyBody.appendChild(tr);
    });
  }

  function resetHistory(){
    try {
      localStorage.removeItem('imker:sessions');
    } catch {}
    renderHistory();
  }

  
  // Header-link "Imkertrainer" (buiten #app) => Home
  (function(){
    const linkHome = document.getElementById('link-home');
    if (linkHome){
      linkHome.addEventListener('click', function(e){
        e.preventDefault();
        resetToHome();
      });
    }
  })();
// ---------- Events ----------
  app.addEventListener('click', (e)=>{
    const nav = e.target.closest('[data-nav]');
    if (nav){
      const target = nav.getAttribute('data-nav');
      if (target==='home'){ resetToHome(); }
    }
  });

  if (els.btnHome) els.btnHome.addEventListener('click', resetToHome);
  if (els.goPractice) els.goPractice.addEventListener('click', enterPracticeSettings);
  if (els.goExam) els.goExam.addEventListener('click', enterExamSettings);

  if (els.allThemes){
    els.allThemes.addEventListener('change', ()=>{
      const all = els.allThemes.checked;
      els.themesWrap.querySelectorAll('input[type="checkbox"]').forEach(cb=> cb.checked = all);
      updatePracticeAvailability();
    });
  }
  if (els.themesWrap){ els.themesWrap.addEventListener('change', updatePracticeAvailability); }

  if (els.practiceCount){
    const savedCount = localStorage.getItem('imker:practiceCount');
    if (savedCount) els.practiceCount.value = savedCount;
    els.practiceCount.addEventListener('change', updatePracticeAvailability);
  }

  if (els.startPractice){
    els.startPractice.addEventListener('click', ()=>{
      const themes = selectedThemes();
      if (!themes.length){ alert('Selecteer minimaal één thema (of kies Alle thema’s).'); return; }
      buildSession({mode:'practice', themes, count: parseInt(els.practiceCount?.value||'10',10)});
      show(views.quiz); renderQuestion();
    });
  }
  if (els.startExam){
    els.startExam.addEventListener('click', ()=>{
      buildSession({mode:'exam', themes: state.themes.slice(), count:30});
      show(views.quiz); renderQuestion();
    });
  }

  if (els.btnNext) els.btnNext.addEventListener('click', next);
  if (els.btnPrev) els.btnPrev.addEventListener('click', prev);

  if (els.btnRetrySame){
    els.btnRetrySame.addEventListener('click', ()=>{
      if (!state.lastSelection){ resetToHome(); return; }
      const { mode, themes } = state.lastSelection;
      if (mode==='practice'){
        const count = parseInt(els.practiceCount?.value||'10',10);
        buildSession({mode:'practice', themes: themes.slice(), count});
        show(views.quiz); renderQuestion();
      } else {
        buildSession({mode:'exam', themes: state.themes.slice(), count:30});
        show(views.quiz); renderQuestion();
      }
    });
  }
  if (els.btnRetryNew){
    els.btnRetryNew.addEventListener('click', ()=>{
      if (state.mode==='practice') enterPracticeSettings();
      else enterExamSettings();
    });
  }

  if (els.btnResetHistory){
    els.btnResetHistory.addEventListener('click', resetHistory);
  }

  function resetToHome(){
    Object.assign(state, { mode:null, questions:[], index:0, answers:[] });
    show(views.home);
    renderHistory();
  }

  // init
  show(views.home);
  renderHistory();
})()
