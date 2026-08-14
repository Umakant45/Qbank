// ============================================================
// LOAD QUESTIONS FROM JSON FILES
// ============================================================

const QUESTION_BANK = {};

const SUBJECTS_META = [
  {id:'java', label:'Java', icon:'☕', desc:'OOP, collections, streams, multithreading, and JVM concepts'},
  {id:'c', label:'C Programming', icon:'🔵', desc:'Pointers, memory management, data structures, and file handling'},
  {id:'cpp', label:'C++', icon:'⚙️', desc:'OOP, STL, templates, virtual functions, and smart pointers'},
  {id:'dbms', label:'Database Management', icon:'🗄️', desc:'SQL, normalization, ACID, indexes, and transactions'},
  {id:'html', label:'HTML', icon:'🌐', desc:'Web structure, semantic markup, forms, and HTML5 features'},
  {id:'css', label:'CSS', icon:'🎨', desc:'Styling, Flexbox, Grid, animations, and responsive design'},
  {id:'javascript', label:'JavaScript', icon:'💛', desc:'DOM, closures, async, ES6+, and event loop'},
  {id:'python', label:'Python', icon:'🐍', desc:'Theory, OOP, file handling, and programming exercises'},
];

// ============================================================
// APP STATE
// ============================================================

let state = {
  user: null,
  subject: null,
  qIndex: 0,
  progress: [],
  solvedSet: {},
};

// ============================================================
// LOAD ALL QUESTIONS
// ============================================================

async function loadQuestions() {
  const subjects = SUBJECTS_META.map(s => s.id);

  for (const subject of subjects) {
    const response = await fetch(`questions/${subject}.json`);
    QUESTION_BANK[subject] = await response.json();
  }

  initAfterQuestionsLoad();
  checkNoteSphereLogin();
}
// ============================================================
// LOAD ALL QUESTIONS
// ============================================================

async function loadQuestions() {

  const subjects = SUBJECTS_META.map(s => s.id);

  for (const subject of subjects) {

    const response =
      await fetch(`questions/${subject}.json`);

    QUESTION_BANK[subject] =
      await response.json();
  }

  initAfterQuestionsLoad();

  checkNoteSphereLogin();
}


// ============================================================
// AFTER QUESTIONS LOAD
// ============================================================

function initAfterQuestionsLoad() {

  let total = 0;

  for (const k in QUESTION_BANK) {
    total += QUESTION_BANK[k].length;
  }

  document.getElementById('total-q-count')
    .textContent = total;

  // QBank does NOT use its own automatic login.
  // Authentication comes from NoteSphere.
  showPage('page-login');
}


// Start loading
loadQuestions();


// ============================================================
// HELPERS
// ============================================================

function getInitials(name){
  return name
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0,2) || '?';
}

function saveState(){

  if(!state.user) return;

  const ss = {};

  for(const k in state.solvedSet){
    ss[k] = [...state.solvedSet[k]];
  }

  localStorage.setItem(
    'qb_solved_' + state.user.id,
    JSON.stringify(ss)
  );

  localStorage.setItem(
    'qb_progress_' + state.user.id,
    JSON.stringify(state.progress)
  );
}

function loadUserData(userId){

  const rawSolved =
    localStorage.getItem('qb_solved_' + userId);

  const rawProg =
    localStorage.getItem('qb_progress_' + userId);

  const ss = rawSolved
    ? JSON.parse(rawSolved)
    : {};

  const solvedSet = {};

  for(const k in ss){
    solvedSet[k] = new Set(ss[k]);
  }

  return {
    progress: rawProg
      ? JSON.parse(rawProg)
      : [],
    solvedSet
  };
}

// ============================================================
// SHOW PAGE
// ============================================================

function showPage(id){

  document
    .querySelectorAll('.page')
    .forEach(p => p.classList.remove('active'));

  document
    .getElementById(id)
    .classList.add('active');
}

// ============================================================
// LOGIN
// ============================================================



async function checkNoteSphereLogin() {

  if (!noteSphereSupabase) {
    console.error("Supabase is not configured.");
    return;
  }

  const { data, error } =
    await noteSphereSupabase.auth.getSession();

  if (error) {
    console.error("Session error:", error);
    showPage('page-login');
    return;
  }

  const session = data?.session;

  if (!session) {
    showPage('page-login');
    return;
  }

  const { data: profile, error: profileError } =
    await noteSphereSupabase
      .from("profiles")
      .select("student_id, full_name, role, status")
      .eq("id", session.user.id)
      .maybeSingle();

  if (profileError || !profile) {
    console.error("Profile error:", profileError);
    showPage('page-login');
    return;
  }

  if (profile.status === "banned") {

    await noteSphereSupabase.auth.signOut();

    alert("Your account has been banned from NoteSphere.");

    showPage('page-login');

    return;
  }

  // Create QBank user from NoteSphere account
  state.user = {
    id: session.user.id,
    name: profile.full_name,
    email: session.user.email,
    studentId: profile.student_id
  };

  const d =
    loadUserData(session.user.id);

  state.progress = d.progress;
  state.solvedSet = d.solvedSet;

  initMain();

  showPage('page-main');
}

// ============================================================
// INIT MAIN
// ============================================================

function initMain(){

  document.getElementById('topbar-center')
    .textContent =
    `Hey, ${state.user.name.split(' ')[0]} 👋`;

  document.getElementById('profile-btn')
    .textContent =
    getInitials(state.user.name);

  buildSubjectsGrid();

  showSubjectsView();
}

// ============================================================
// SUBJECTS GRID
// ============================================================

function buildSubjectsGrid(){

  const grid =
    document.getElementById('subjects-grid');

  grid.innerHTML = SUBJECTS_META.map(s => {

    const qs =
      QUESTION_BANK[s.id] || [];

    const done =
      state.solvedSet[s.id]
      ? state.solvedSet[s.id].size
      : 0;

    return `
      <div class="subject-card" data-subj="${s.id}">
        <span class="sc-icon">${s.icon}</span>

        <div class="sc-title">${s.label}</div>

        <div class="sc-desc">${s.desc}</div>

        <div class="sc-meta">
          <span class="sc-count">
            ${qs.length} questions
            ${done > 0 ? ' · ' + done + ' done' : ''}
          </span>

          <span class="sc-arrow">→</span>
        </div>
      </div>
    `;
  }).join('');

  grid
    .querySelectorAll('.subject-card')
    .forEach(card => {

      card.addEventListener('click', () => {

        loadSubject(
          card.getAttribute('data-subj')
        );

      });

    });
}

function showSubjectsView(){

  document.getElementById('view-subjects')
    .style.display = 'block';

  document.getElementById('view-questions')
    .style.display = 'none';

  buildSubjectsGrid();
}

// ============================================================
// LOAD SUBJECT
// ============================================================

function loadSubject(subjectId){

  state.subject = subjectId;

  state.qIndex = 0;

  if(!state.solvedSet[subjectId]){
    state.solvedSet[subjectId] = new Set();
  }

  const meta =
    SUBJECTS_META.find(s => s.id === subjectId);

  document.getElementById('q-subj-name')
    .textContent =
    `${meta.icon} ${meta.label}`;

  document.getElementById('view-subjects')
    .style.display = 'none';

  document.getElementById('view-questions')
    .style.display = 'block';

  renderQuestion();
}

// ============================================================
// RENDER QUESTION
// ============================================================

function renderQuestion(){

  const qs =
    QUESTION_BANK[state.subject];

  const q =
    qs[state.qIndex];

  const total =
    qs.length;

  const done =
    state.solvedSet[state.subject]?.size || 0;

  const pct =
    Math.round(((state.qIndex + 1) / total) * 100);

  document.getElementById('q-counter')
    .textContent =
    `Q ${state.qIndex + 1} / ${total}`;

  document.getElementById('st-total')
    .textContent = total;

  document.getElementById('st-done')
    .textContent = done;

  document.getElementById('st-cur')
    .textContent = state.qIndex + 1;

  document.getElementById('pbar-pct')
    .textContent = pct + '%';

  document.getElementById('q-pbar-fill')
    .style.width = pct + '%';

  document.getElementById('q-num-pill')
    .textContent =
    `Q${state.qIndex + 1}`;

  document.getElementById('q-title')
    .textContent = q.title;

  document.getElementById('q-content')
    .innerHTML = q.content;

  const diff =
    q.difficulty || 'easy';

  const badge =
    document.getElementById('q-diff-badge');

  badge.textContent =
    diff.toUpperCase();

  badge.className =
    'diff-badge ' + diff;

  const dotsEl =
    document.getElementById('solved-dots');

  dotsEl.innerHTML = qs.map((_, i) =>
    `<div class="sdot ${
      state.solvedSet[state.subject]?.has(i)
      ? 'done'
      : ''
    }" title="Q${i+1}"></div>`
  ).join('');

  document.getElementById('prev-btn')
    .disabled =
    state.qIndex === 0;

  document.getElementById('next-btn')
    .disabled =
    state.qIndex === total - 1;

  const doneBtn =
    document.getElementById('done-btn');

  const alreadyDone =
    state.solvedSet[state.subject]
    ?.has(state.qIndex);

  doneBtn.textContent =
    alreadyDone
    ? '✓ Done'
    : '✓ Mark Done';

  doneBtn.style.opacity =
    alreadyDone ? '.6' : '1';

  const card =
    document.getElementById('q-card');

  card.style.animation = 'none';

  void card.offsetWidth;

  card.style.animation =
    'fadeUp .3s ease both';

  document.getElementById('done-toast')
    .classList.remove('show');
}

// ============================================================
// QUESTION CONTROLS
// ============================================================

document.getElementById('back-btn')
  .addEventListener('click', () => {
    showSubjectsView();
  });

document.getElementById('prev-btn')
  .addEventListener('click', () => {

    if(state.qIndex > 0){
      state.qIndex--;
      renderQuestion();
    }

  });

document.getElementById('next-btn')
  .addEventListener('click', () => {

    const qs =
      QUESTION_BANK[state.subject];

    if(state.qIndex < qs.length - 1){
      state.qIndex++;
      renderQuestion();
    }

  });

document.getElementById('rand-btn')
  .addEventListener('click', () => {

    const qs =
      QUESTION_BANK[state.subject];

    let idx;

    do{
      idx =
        Math.floor(Math.random() * qs.length);

    }while(
      qs.length > 1 &&
      idx === state.qIndex
    );

    state.qIndex = idx;

    renderQuestion();
  });

document.getElementById('done-btn')
  .addEventListener('click', () => {

    const qs =
      QUESTION_BANK[state.subject];

    const q =
      qs[state.qIndex];

    if(!state.solvedSet[state.subject]){
      state.solvedSet[state.subject] =
      new Set();
    }

    state.solvedSet[state.subject]
      .add(state.qIndex);

    state.progress.push({
      title: q.title,
      subject: state.subject,
      difficulty: q.difficulty || 'easy',
      date: new Date()
        .toLocaleDateString('en-IN'),
      time: new Date()
        .toLocaleTimeString('en-IN',{
          hour:'2-digit',
          minute:'2-digit'
        })
    });

    saveState();

    renderQuestion();

    const toast =
      document.getElementById('done-toast');

    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  });

// ============================================================
// PROFILE
// ============================================================

document.getElementById('profile-btn')
  .addEventListener('click', openProfile);

document.getElementById('close-profile')
  .addEventListener('click', closeProfile);

document.getElementById('logout-btn')
  .addEventListener('click', () => {

    state.user = null;
    state.subject = null;
    state.qIndex = 0;
    state.progress = [];
    state.solvedSet = {};

    closeProfile();

    // Do NOT sign out of NoteSphere.
    // QBank uses the NoteSphere session.
    showPage('page-login');
  });
function openProfile(){

  const u = state.user;

  const initials =
    getInitials(u.name);

  document.getElementById('pp-avatar')
    .textContent = initials;

  document.getElementById('pp-name')
    .textContent = u.name;

  document.getElementById('pp-email')
    .textContent = u.email;

  const totalDone =
    state.progress.length;

  const subjsDone =
    Object.keys(state.solvedSet)
      .filter(k =>
        state.solvedSet[k].size > 0
      ).length;

  document.getElementById('pp-total')
    .textContent = totalDone;

  document.getElementById('pp-subjects')
    .textContent = subjsDone;

  const breakdown =
    document.getElementById('pp-breakdown');

  const rows =
    SUBJECTS_META.map(s => {

      const cnt =
        state.solvedSet[s.id]
        ? state.solvedSet[s.id].size
        : 0;

      if(cnt === 0) return '';

      return `
        <div class="sb-row">
          <span class="sb-label">
            ${s.icon} ${s.label}
          </span>

          <span class="sb-count">
            ${cnt} done
          </span>
        </div>
      `;
    })
    .filter(Boolean)
    .join('');

  breakdown.innerHTML =
    rows ||
    '<p style="font-size:.78rem;color:var(--tx3)">No subjects attempted yet</p>';

  const prog =
    document.getElementById('pp-progress');

  const recent =
    [...state.progress]
    .reverse()
    .slice(0,20);

  if(recent.length === 0){

    prog.innerHTML = `
      <div class="prog-empty">
        <span class="pe-icon">📭</span>
        No questions marked done yet.
        <br>
        Start practising!
      </div>
    `;

  } else {

    prog.innerHTML =
      recent.map(item => {

        const meta =
          SUBJECTS_META.find(
            s => s.id === item.subject
          ) || {icon:'📘'};

        return `
          <div class="prog-item">

            <div class="prog-icon">
              ${meta.icon}
            </div>

            <div class="prog-info">

              <div class="pi-title">
                ${item.title}
              </div>

              <div class="pi-meta">
                ${(item.subject || '').toUpperCase()}
                ·
                ${item.difficulty}
                ·
                ${item.date}
                ${item.time}
              </div>

            </div>

          </div>
        `;
      }).join('');
  }

  document.getElementById('overlay')
    .style.display = 'flex';
}

function closeProfile(){
  document.getElementById('overlay')
    .style.display = 'none';
}

function closeProfileOnBg(e){
  if(e.target.id === 'overlay'){
    closeProfile();
  }
}