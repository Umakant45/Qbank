// ============================================================
// QBANK - QUESTION BANK
// ============================================================

const QUESTION_BANK = {};

const SUBJECTS_META = [
  {
    id: 'java',
    label: 'Java',
    icon: '☕',
    desc: 'OOP, collections, streams, multithreading, and JVM concepts'
  },
  {
    id: 'c',
    label: 'C Programming',
    icon: '🔵',
    desc: 'Pointers, memory management, data structures, and file handling'
  },
  {
    id: 'cpp',
    label: 'C++',
    icon: '⚙️',
    desc: 'OOP, STL, templates, virtual functions, and smart pointers'
  },
  {
    id: 'dbms',
    label: 'Database Management',
    icon: '🗄️',
    desc: 'SQL, normalization, ACID, indexes, and transactions'
  },
  {
    id: 'html',
    label: 'HTML',
    icon: '🌐',
    desc: 'Web structure, semantic markup, forms, and HTML5 features'
  },
  {
    id: 'css',
    label: 'CSS',
    icon: '🎨',
    desc: 'Styling, Flexbox, Grid, animations, and responsive design'
  },
  {
    id: 'javascript',
    label: 'JavaScript',
    icon: '💛',
    desc: 'DOM, closures, async, ES6+, and event loop'
  },
  {
    id: 'python',
    label: 'Python',
    icon: '🐍',
    desc: 'Theory, OOP, file handling, and programming exercises'
  }
];


// ============================================================
// APP STATE
// ============================================================

let state = {
  user: null,
  subject: null,
  qIndex: 0,
  progress: [],
  solvedSet: {}
};


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  setupLogin();

  setupQuestionControls();

  setupProfile();

  loadQuestions();

});


// ============================================================
// LOAD QUESTIONS
// ============================================================

async function loadQuestions() {

  let total = 0;

  for (const subject of SUBJECTS_META) {

    try {

      const response = await fetch(
        `questions/${subject.id}.json`
      );

      if (!response.ok) {
        console.warn(
          `Could not load questions/${subject.id}.json`
        );

        QUESTION_BANK[subject.id] = [];
        continue;
      }

      const data = await response.json();

      QUESTION_BANK[subject.id] =
        Array.isArray(data) ? data : [];

      total += QUESTION_BANK[subject.id].length;

    } catch (error) {

      console.warn(
        `Error loading ${subject.id}.json`,
        error
      );

      QUESTION_BANK[subject.id] = [];
    }
  }


  const totalElement =
    document.getElementById('total-q-count');

  if (totalElement) {
    totalElement.textContent = total;
  }

});


// ============================================================
// LOGIN
// ============================================================

function setupLogin() {

  const loginButton =
    document.getElementById('login-btn');

  const nameInput =
    document.getElementById('inp-name');

  const emailInput =
    document.getElementById('inp-email');


  if (!loginButton || !nameInput || !emailInput) {

    console.error('Login elements not found.');

    return;
  }


  loginButton.addEventListener('click', loginUser);


  // Allow Enter key
  nameInput.addEventListener('keydown', event => {

    if (event.key === 'Enter') {
      loginUser();
    }

  });


  emailInput.addEventListener('keydown', event => {

    if (event.key === 'Enter') {
      loginUser();
    }

  });

}


// ============================================================
// LOGIN USER
// ============================================================

function loginUser() {

  const nameInput =
    document.getElementById('inp-name');

  const emailInput =
    document.getElementById('inp-email');


  const name =
    nameInput.value.trim();

  const email =
    emailInput.value.trim();


  if (!name) {

    alert('Please enter your name.');

    nameInput.focus();

    return;
  }


  if (!email) {

    alert('Please enter your email.');

    emailInput.focus();

    return;
  }


  if (!email.includes('@')) {

    alert('Please enter a valid email.');

    emailInput.focus();

    return;
  }


  // Create user

  state.user = {

    id: email.toLowerCase(),

    name: name,

    email: email

  };


  // Save login information

  localStorage.setItem(
    'qbank_name',
    name
  );

  localStorage.setItem(
    'qbank_email',
    email
  );


  // Load previous progress

  const userData =
    loadUserData(state.user.id);


  state.progress =
    userData.progress;

  state.solvedSet =
    userData.solvedSet;


  // Update topbar

  const firstName =
    name.split(/\s+/)[0];


  const topbar =
    document.getElementById(
      'topbar-center'
    );


  if (topbar) {

    topbar.textContent =
      `Hey, ${firstName} 👋`;

  }


  // Update profile button

  const profileButton =
    document.getElementById(
      'profile-btn'
    );


  if (profileButton) {

    profileButton.textContent =
      getInitials(name);

  }


  // IMPORTANT:
  // Show main page

  showPage('page-main');


  // IMPORTANT:
  // Show subjects

  showSubjectsView();

}


// ============================================================
// HELPERS
// ============================================================

function getInitials(name) {

  return name
    .trim()
    .split(/\s+/)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

}


// ============================================================
// SAVE USER PROGRESS
// ============================================================

function saveState() {

  if (!state.user) {
    return;
  }


  const solved = {};


  for (const subject in state.solvedSet) {

    solved[subject] =
      [...state.solvedSet[subject]];

  }


  localStorage.setItem(
    'qb_solved_' + state.user.id,
    JSON.stringify(solved)
  );


  localStorage.setItem(
    'qb_progress_' + state.user.id,
    JSON.stringify(state.progress)
  );

}


// ============================================================
// LOAD USER PROGRESS
// ============================================================

function loadUserData(userId) {

  const rawSolved =
    localStorage.getItem(
      'qb_solved_' + userId
    );


  const rawProgress =
    localStorage.getItem(
      'qb_progress_' + userId
    );


  let solvedData = {};

  let progress = [];


  try {

    solvedData =
      rawSolved
        ? JSON.parse(rawSolved)
        : {};

  } catch {

    solvedData = {};

  }


  try {

    progress =
      rawProgress
        ? JSON.parse(rawProgress)
        : [];

  } catch {

    progress = [];

  }


  const solvedSet = {};


  for (const subject in solvedData) {

    solvedSet[subject] =
      new Set(solvedData[subject]);

  }


  return {

    progress,

    solvedSet

  };

}


// ============================================================
// SHOW PAGE
// ============================================================

function showPage(id) {

  document
    .querySelectorAll('.page')
    .forEach(page => {

      page.classList.remove('active');

    });


  const page =
    document.getElementById(id);


  if (page) {

    page.classList.add('active');

  } else {

    console.error(
      `Page "${id}" was not found.`
    );

  }

}


// ============================================================
// SUBJECTS GRID
// ============================================================

function buildSubjectsGrid() {

  const grid =
    document.getElementById(
      'subjects-grid'
    );


  if (!grid) {

    console.error(
      'subjects-grid element not found.'
    );

    return;
  }


  grid.innerHTML = '';


  SUBJECTS_META.forEach(subject => {

    const questions =
      QUESTION_BANK[subject.id] || [];


    const done =
      state.solvedSet[subject.id]
        ? state.solvedSet[subject.id].size
        : 0;


    const card =
      document.createElement('div');


    card.className =
      'subject-card';


    card.setAttribute(
      'data-subj',
      subject.id
    );


    card.innerHTML = `

      <span class="sc-icon">
        ${subject.icon}
      </span>

      <div class="sc-title">
        ${subject.label}
      </div>

      <div class="sc-desc">
        ${subject.desc}
      </div>

      <div class="sc-meta">

        <span class="sc-count">

          ${questions.length} questions

          ${
            done > 0
              ? ' · ' + done + ' done'
              : ''
          }

        </span>

        <span class="sc-arrow">
          →
        </span>

      </div>

    `;


    card.addEventListener(
      'click',
      () => {

        loadSubject(subject.id);

      }
    );


    grid.appendChild(card);

  });

}


// ============================================================
// SHOW SUBJECTS VIEW
// ============================================================

function showSubjectsView() {

  const subjectsView =
    document.getElementById(
      'view-subjects'
    );


  const questionsView =
    document.getElementById(
      'view-questions'
    );


  if (subjectsView) {

    subjectsView.style.display =
      'block';

  }


  if (questionsView) {

    questionsView.style.display =
      'none';

  }


  buildSubjectsGrid();

}


// ============================================================
// LOAD SUBJECT
// ============================================================

function loadSubject(subjectId) {

  const questions =
    QUESTION_BANK[subjectId];


  if (
    !questions ||
    questions.length === 0
  ) {

    alert(
      `No questions found for ${subjectId}.`
    );

    return;
  }


  state.subject =
    subjectId;


  state.qIndex =
    0;


  if (!state.solvedSet[subjectId]) {

    state.solvedSet[subjectId] =
      new Set();

  }


  const meta =
    SUBJECTS_META.find(
      subject =>
        subject.id === subjectId
    );


  const subjectName =
    document.getElementById(
      'q-subj-name'
    );


  if (subjectName && meta) {

    subjectName.textContent =
      `${meta.icon} ${meta.label}`;

  }


  const subjectsView =
    document.getElementById(
      'view-subjects'
    );


  const questionsView =
    document.getElementById(
      'view-questions'
    );


  if (subjectsView) {

    subjectsView.style.display =
      'none';

  }


  if (questionsView) {

    questionsView.style.display =
      'block';

  }


  renderQuestion();

}


// ============================================================
// RENDER QUESTION
// ============================================================

function renderQuestion() {

  if (!state.subject) {
    return;
  }


  const questions =
    QUESTION_BANK[state.subject];


  if (
    !questions ||
    questions.length === 0
  ) {

    return;
  }


  const question =
    questions[state.qIndex];


  if (!question) {
    return;
  }


  const total =
    questions.length;


  const done =
    state.solvedSet[state.subject]
      ? state.solvedSet[state.subject].size
      : 0;


  const percentage =
    Math.round(
      ((state.qIndex + 1) / total) * 100
    );


  // Counter

  const counter =
    document.getElementById(
      'q-counter'
    );


  if (counter) {

    counter.textContent =
      `Q ${state.qIndex + 1} / ${total}`;

  }


  // Stats

  const totalElement =
    document.getElementById(
      'st-total'
    );


  if (totalElement) {

    totalElement.textContent =
      total;

  }


  const doneElement =
    document.getElementById(
      'st-done'
    );


  if (doneElement) {

    doneElement.textContent =
      done;

  }


  const currentElement =
    document.getElementById(
      'st-cur'
    );


  if (currentElement) {

    currentElement.textContent =
      state.qIndex + 1;

  }


  // Progress

  const percentageElement =
    document.getElementById(
      'pbar-pct'
    );


  if (percentageElement) {

    percentageElement.textContent =
      percentage + '%';

  }


  const progressBar =
    document.getElementById(
      'q-pbar-fill'
    );


  if (progressBar) {

    progressBar.style.width =
      percentage + '%';

  }


  // Question number

  const questionNumber =
    document.getElementById(
      'q-num-pill'
    );


  if (questionNumber) {

    questionNumber.textContent =
      `Q${state.qIndex + 1}`;

  }


  // Title

  const title =
    document.getElementById(
      'q-title'
    );


  if (title) {

    title.textContent =
      question.title || '';

  }


  // Content

  const content =
    document.getElementById(
      'q-content'
    );


  if (content) {

    content.innerHTML =
      question.content || '';

  }


  // Difficulty

  const difficulty =
    question.difficulty || 'easy';


  const difficultyBadge =
    document.getElementById(
      'q-diff-badge'
    );


  if (difficultyBadge) {

    difficultyBadge.textContent =
      difficulty.toUpperCase();


    difficultyBadge.className =
      'diff-badge ' + difficulty;

  }


  // Solved dots

  const dots =
    document.getElementById(
      'solved-dots'
    );


  if (dots) {

    dots.innerHTML =
      questions.map((_, index) => {

        const solved =
          state.solvedSet[state.subject]
            ?.has(index);


        return `

          <div
            class="sdot ${solved ? 'done' : ''}"
            title="Q${index + 1}"
          ></div>

        `;

      }).join('');

  }


  // Previous

  const previousButton =
    document.getElementById(
      'prev-btn'
    );


  if (previousButton) {

    previousButton.disabled =
      state.qIndex === 0;

  }


  // Next

  const nextButton =
    document.getElementById(
      'next-btn'
    );


  if (nextButton) {

    nextButton.disabled =
      state.qIndex === total - 1;

  }


  // Done

  const doneButton =
    document.getElementById(
      'done-btn'
    );


  const alreadyDone =
    state.solvedSet[state.subject]
      ?.has(state.qIndex);


  if (doneButton) {

    doneButton.textContent =
      alreadyDone
        ? '✓ Done'
        : '✓ Mark Done';

    doneButton.style.opacity =
      alreadyDone ? '.6' : '1';

  }


  // Animation

  const card =
    document.getElementById(
      'q-card'
    );


  if (card) {

    card.style.animation =
      'none';

    void card.offsetWidth;

    card.style.animation =
      'fadeUp .3s ease both';

  }

}


// ============================================================
// QUESTION CONTROLS
// ============================================================

function setupQuestionControls() {

  // BACK

  const backButton =
    document.getElementById(
      'back-btn'
    );


  if (backButton) {

    backButton.addEventListener(
      'click',
      () => {

        showSubjectsView();

      }
    );

  }


  // PREVIOUS

  const previousButton =
    document.getElementById(
      'prev-btn'
    );


  if (previousButton) {

    previousButton.addEventListener(
      'click',
      () => {

        if (state.qIndex > 0) {

          state.qIndex--;

          renderQuestion();

        }

      }
    );

  }


  // NEXT

  const nextButton =
    document.getElementById(
      'next-btn'
    );


  if (nextButton) {

    nextButton.addEventListener(
      'click',
      () => {

        const questions =
          QUESTION_BANK[state.subject];


        if (
          questions &&
          state.qIndex <
            questions.length - 1
        ) {

          state.qIndex++;

          renderQuestion();

        }

      }
    );

  }


  // RANDOM

  const randomButton =
    document.getElementById(
      'rand-btn'
    );


  if (randomButton) {

    randomButton.addEventListener(
      'click',
      () => {

        const questions =
          QUESTION_BANK[state.subject];


        if (
          !questions ||
          questions.length === 0
        ) {

          return;

        }


        let randomIndex;


        do {

          randomIndex =
            Math.floor(
              Math.random() *
              questions.length
            );

        } while (
          questions.length > 1 &&
          randomIndex === state.qIndex
        );


        state.qIndex =
          randomIndex;


        renderQuestion();

      }
    );

  }


  // DONE

  const doneButton =
    document.getElementById(
      'done-btn'
    );


  if (doneButton) {

    doneButton.addEventListener(
      'click',
      markQuestionDone
    );

  }

}


// ============================================================
// MARK QUESTION DONE
// ============================================================

function markQuestionDone() {

  const questions =
    QUESTION_BANK[state.subject];


  if (
    !questions ||
    !questions[state.qIndex]
  ) {

    return;
  }


  if (!state.solvedSet[state.subject]) {

    state.solvedSet[state.subject] =
      new Set();

  }


  const alreadyDone =
    state.solvedSet[state.subject]
      .has(state.qIndex);


  if (!alreadyDone) {

    const question =
      questions[state.qIndex];


    state.solvedSet[state.subject]
      .add(state.qIndex);


    const now =
      new Date();


    state.progress.push({

      title:
        question.title || 'Untitled Question',

      subject:
        state.subject,

      difficulty:
        question.difficulty || 'easy',

      date:
        now.toLocaleDateString('en-IN'),

      time:
        now.toLocaleTimeString(
          'en-IN',
          {
            hour: '2-digit',
            minute: '2-digit'
          }
        )

    });


    saveState();

  }


  renderQuestion();


  const toast =
    document.getElementById(
      'done-toast'
    );


  if (toast) {

    toast.classList.add('show');


    setTimeout(() => {

      toast.classList.remove('show');

    }, 2000);

  }

}


// ============================================================
// PROFILE
// ============================================================

function setupProfile() {

  const profileButton =
    document.getElementById(
      'profile-btn'
    );


  if (profileButton) {

    profileButton.addEventListener(
      'click',
      openProfile
    );

  }


  const closeButton =
    document.getElementById(
      'close-profile'
    );


  if (closeButton) {

    closeButton.addEventListener(
      'click',
      closeProfile
    );

  }


  const logoutButton =
    document.getElementById(
      'logout-btn'
    );


  if (logoutButton) {

    logoutButton.addEventListener(
      'click',
      logout
    );

  }

}


// ============================================================
// OPEN PROFILE
// ============================================================

function openProfile() {

  if (!state.user) {
    return;
  }


  const user =
    state.user;


  const avatar =
    document.getElementById(
      'pp-avatar'
    );


  if (avatar) {

    avatar.textContent =
      getInitials(user.name);

  }


  const name =
    document.getElementById(
      'pp-name'
    );


  if (name) {

    name.textContent =
      user.name;

  }


  const email =
    document.getElementById(
      'pp-email'
    );


  if (email) {

    email.textContent =
      user.email;

  }


  const totalElement =
    document.getElementById(
      'pp-total'
    );


  if (totalElement) {

    totalElement.textContent =
      state.progress.length;

  }


  const subjectsElement =
    document.getElementById(
      'pp-subjects'
    );


  const subjectsDone =
    Object.keys(state.solvedSet)
      .filter(subject =>
        state.solvedSet[subject].size > 0
      )
      .length;


  if (subjectsElement) {

    subjectsElement.textContent =
      subjectsDone;

  }


  // Subject breakdown

  const breakdown =
    document.getElementById(
      'pp-breakdown'
    );


  if (breakdown) {

    const rows =
      SUBJECTS_META
        .map(subject => {

          const count =
            state.solvedSet[subject.id]
              ? state.solvedSet[subject.id].size
              : 0;


          if (count === 0) {
            return '';
          }


          return `

            <div class="sb-row">

              <span class="sb-label">

                ${subject.icon}
                ${subject.label}

              </span>

              <span class="sb-count">

                ${count} done

              </span>

            </div>

          `;

        })
        .filter(Boolean)
        .join('');


    breakdown.innerHTML =
      rows ||
      `
        <p style="
          font-size:.78rem;
          color:var(--tx3)
        ">
          No subjects attempted yet
        </p>
      `;

  }


  // Recent progress

  const progressElement =
    document.getElementById(
      'pp-progress'
    );


  if (progressElement) {

    const recent =
      [...state.progress]
        .reverse()
        .slice(0, 20);


    if (recent.length === 0) {

      progressElement.innerHTML = `

        <div class="prog-empty">

          <span class="pe-icon">
            📭
          </span>

          No questions marked done yet.

          <br>

          Start practising!

        </div>

      `;

    } else {

      progressElement.innerHTML =
        recent.map(item => {

          const meta =
            SUBJECTS_META.find(
              subject =>
                subject.id === item.subject
            ) || {
              icon: '📘'
            };


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

  }


  const overlay =
    document.getElementById(
      'overlay'
    );


  if (overlay) {

    overlay.style.display =
      'flex';

  }

}


// ============================================================
// CLOSE PROFILE
// ============================================================

function closeProfile() {

  const overlay =
    document.getElementById(
      'overlay'
    );


  if (overlay) {

    overlay.style.display =
      'none';

  }

}


// ============================================================
// CLOSE PROFILE BACKGROUND
// ============================================================

function closeProfileOnBg(event) {

  if (
    event.target.id ===
    'overlay'
  ) {

    closeProfile();

  }

}


// ============================================================
// LOGOUT
// ============================================================

function logout() {

  state.user = null;

  state.subject = null;

  state.qIndex = 0;

  state.progress = [];

  state.solvedSet = {};


  closeProfile();


  const nameInput =
    document.getElementById(
      'inp-name'
    );


  const emailInput =
    document.getElementById(
      'inp-email'
    );


  if (nameInput) {

    nameInput.value = '';

  }


  if (emailInput) {

    emailInput.value = '';

  }


  showPage('page-login');

}


// ============================================================
// AUTO RESTORE LOGIN? NO
// ============================================================
//
// We deliberately do NOT auto-login.
// QBank starts at the login page every time.
//
// ============================================================