/**
 * Coursera Quiz Application - Main Controller
 * AWS Certified Solutions Architect – Associate (SAA-C03) Practice Web App
 * Supports 7 Quiz Sets: Master 390 Questions Bank + 6 Stephane Maarek Practice Tests
 */

(function () {
  'use strict';

  // Constants
  const PASSING_PERCENT = 72; // AWS SAA 720/1000 equivalent
  const ACTIVE_QUIZ_KEY = 'coursera_active_quiz_id';

  // Application State
  const state = {
    currentQuizId: 'catalog', // 'catalog' or quiz id ('quiz-390', 'stephane-1', etc.)
    activeQuiz: null,
    questions: [],
    currentIndex: 0,
    userAnswers: {},       // { [qId]: ['A', 'B'] }
    flagged: new Set(),    // Set of qIds
    checked: {},           // { [qId]: true } (checked in practice mode)
    mode: 'practice',      // 'practice' | 'exam'
    viewMode: 'single',    // 'single' | 'all'
    filterTopic: 'all',    // 'all' | specific topic string
    filterStatus: 'all',   // 'all' | 'answered' | 'unanswered' | 'flagged' | 'incorrect'
    searchQuery: '',
    timerSeconds: 0,
    timerRunning: true,
    timerInterval: null,
    isSubmitted: false,
    examSubmittedAt: null,
    isShuffled: false,
    activeExpTab: {}       // { [qId]: 'vn' | 'official' }
  };

  // DOM Elements
  const el = {
    // Header
    brandLogoBtn: document.getElementById('brand-logo-btn'),
    headerCourseTitle: document.getElementById('header-course-title'),
    headerCourseSub: document.getElementById('header-course-sub'),
    btnBackCatalog: document.getElementById('btn-back-catalog'),
    headerQuizSelector: document.getElementById('header-quiz-selector'),
    headerModes: document.getElementById('header-modes'),
    modePracticeBtn: document.getElementById('mode-practice-btn'),
    modeExamBtn: document.getElementById('mode-exam-btn'),
    headerTimerBox: document.getElementById('header-timer-box'),
    timerDisplay: document.getElementById('timer-display'),
    timerBtn: document.getElementById('timer-btn'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    submitBtn: document.getElementById('submit-btn'),
    
    // Subbar
    headerSubbar: document.getElementById('header-subbar'),
    breadcrumb: document.getElementById('breadcrumb'),
    metaTotal: document.getElementById('meta-total'),
    metaAnswered: document.getElementById('meta-answered'),
    progressBarFill: document.getElementById('progress-bar-fill'),
    viewSingleBtn: document.getElementById('view-single-btn'),
    viewAllBtn: document.getElementById('view-all-btn'),
    btnShuffleQuiz: document.getElementById('btn-shuffle-quiz'),
    shuffleBtnText: document.getElementById('shuffle-btn-text'),
    
    // Views
    catalogViewContainer: document.getElementById('catalog-view-container'),
    masterBankCardContainer: document.getElementById('master-bank-card-container'),
    stephaneTestsGrid: document.getElementById('stephane-tests-grid'),
    quizViewContainer: document.getElementById('quiz-view-container'),

    // Sidebar
    sidebar: document.getElementById('sidebar'),
    sidebarSearch: document.getElementById('sidebar-search'),
    topicFilter: document.getElementById('topic-filter'),
    statusFilters: document.getElementById('status-filters'),
    questionGrid: document.getElementById('question-grid'),
    mobileSidebarToggle: document.getElementById('mobile-sidebar-toggle'),
    sidebarCountBadge: document.getElementById('sidebar-count-badge'),
    
    // Main Content
    singleViewContainer: document.getElementById('single-view-container'),
    allViewContainer: document.getElementById('all-view-container'),
    
    // Modals
    confirmModal: document.getElementById('confirm-modal'),
    confirmQuizName: document.getElementById('confirm-quiz-name'),
    resultsModal: document.getElementById('results-modal'),
    resultsModalTitle: document.getElementById('results-modal-title'),
    shortcutsModal: document.getElementById('shortcuts-modal'),
    settingsModal: document.getElementById('settings-modal'),
    
    // Results Modal Elements
    scorePercent: document.getElementById('score-percent'),
    scoreVerdict: document.getElementById('score-verdict'),
    statCorrect: document.getElementById('stat-correct'),
    statIncorrect: document.getElementById('stat-incorrect'),
    statTime: document.getElementById('stat-time'),
    domainBreakdown: document.getElementById('domain-breakdown'),
    
    // Toast
    toastContainer: document.getElementById('toast-container')
  };

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  function init() {
    setupTheme();
    setupEventListeners();
    populateQuizDropdown();

    // Check if user has an active quiz
    const savedActiveQuiz = localStorage.getItem(ACTIVE_QUIZ_KEY) || 'catalog';
    if (savedActiveQuiz !== 'catalog' && window.QUIZZES_CATALOG && window.QUIZZES_CATALOG[savedActiveQuiz]) {
      selectQuiz(savedActiveQuiz, false);
    } else {
      selectQuiz('catalog', false);
    }
  }

  function populateQuizDropdown() {
    if (!el.headerQuizSelector || !window.QUIZZES_CATALOG) return;
    el.headerQuizSelector.innerHTML = '';
    
    // Catalog option
    const catOpt = document.createElement('option');
    catOpt.value = 'catalog';
    catOpt.textContent = '📋 Danh sách tất cả đề thi';
    el.headerQuizSelector.appendChild(catOpt);

    // Master 390
    if (window.QUIZZES_CATALOG['quiz-390']) {
      const opt = document.createElement('option');
      opt.value = 'quiz-390';
      opt.textContent = '⭐ Bộ 390 câu hỏi tổng hợp';
      el.headerQuizSelector.appendChild(opt);
    }

    // Stephane 1-6
    for (let i = 1; i <= 6; i++) {
      const qid = `stephane-${i}`;
      if (window.QUIZZES_CATALOG[qid]) {
        const opt = document.createElement('option');
        opt.value = qid;
        opt.textContent = `📝 ${window.QUIZZES_CATALOG[qid].shortTitle || window.QUIZZES_CATALOG[qid].title}`;
        el.headerQuizSelector.appendChild(opt);
      }
    }
  }

  // ==========================================================================
  // QUIZ NAVIGATION & SELECTION (CATALOG VS QUIZ VIEW)
  // ==========================================================================
  function selectQuiz(quizId, userInitiated = true) {
    // If we were in a quiz, save its state
    if (state.currentQuizId && state.currentQuizId !== 'catalog') {
      saveQuizState(state.currentQuizId);
    }

    state.currentQuizId = quizId;
    localStorage.setItem(ACTIVE_QUIZ_KEY, quizId);

    if (quizId === 'catalog') {
      // Show Catalog View
      if (state.timerInterval) clearInterval(state.timerInterval);
      el.catalogViewContainer.style.display = 'flex';
      el.quizViewContainer.style.display = 'none';

      // Hide quiz-specific header items
      el.btnBackCatalog.style.display = 'none';
      el.headerQuizSelector.style.display = 'none';
      el.headerModes.style.display = 'none';
      el.headerTimerBox.style.display = 'none';
      el.submitBtn.style.display = 'none';
      el.headerSubbar.style.display = 'none';
      el.mobileSidebarToggle.style.display = 'none';

      // Update header titles
      el.headerCourseTitle.textContent = 'AWS Certified Solutions Architect – Associate (SAA-C03)';
      el.headerCourseSub.textContent = 'Trung tâm luyện thi chứng chỉ kiến trúc sư AWS • 7 Bộ đề thi';

      renderCatalog();
      updateGlobalCourseProgress();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Show Quiz View
      const quiz = window.QUIZZES_CATALOG ? window.QUIZZES_CATALOG[quizId] : null;
      if (!quiz) {
        showToast('Không tìm thấy dữ liệu đề thi!', 'danger');
        selectQuiz('catalog');
        return;
      }

      state.activeQuiz = quiz;
      state.questions = quiz.questions || [];
      state.currentIndex = 0;
      state.searchQuery = '';
      state.filterTopic = 'all';
      state.filterStatus = 'all';

      // Load quiz state
      loadQuizState(quizId);

      // Show quiz view
      el.catalogViewContainer.style.display = 'none';
      el.quizViewContainer.style.display = 'flex';

      // Show quiz-specific header items
      el.btnBackCatalog.style.display = 'inline-flex';
      el.headerQuizSelector.style.display = 'inline-block';
      el.headerQuizSelector.value = quizId;
      el.headerModes.style.display = 'flex';
      el.headerTimerBox.style.display = 'flex';
      el.submitBtn.style.display = 'inline-flex';
      el.headerSubbar.style.display = 'flex';
      el.mobileSidebarToggle.style.display = 'flex';

      // Update header titles
      el.headerCourseTitle.textContent = quiz.title;
      el.headerCourseSub.textContent = quiz.subtitle || 'Bài thi trắc nghiệm kiến trúc AWS';

      // Reset & Populate Topic Filter
      populateTopicFilter();

      // Setup Timer & Render
      state.isShuffled = false;
      if (el.shuffleBtnText) el.shuffleBtnText.textContent = 'Trộn ngẫu nhiên';
      if (el.btnShuffleQuiz) {
        el.btnShuffleQuiz.classList.remove('active');
        el.btnShuffleQuiz.style.borderColor = '';
        el.btnShuffleQuiz.style.color = '';
      }
      setupTimer();
      renderAll();
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (userInitiated) {
        showToast(`Đã mở ${quiz.title}`);
      }
    }
  }

  // ==========================================================================
  // CATALOG RENDERING & PROGRESS TRACKING
  // ==========================================================================
  function getQuizStoredStats(quizId, questionCount) {
    try {
      const saved = localStorage.getItem(`coursera_quiz_state_${quizId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const userAnswers = parsed.userAnswers || {};
        const answeredCount = Object.keys(userAnswers).filter(id => userAnswers[id] && userAnswers[id].length > 0).length;
        const percent = questionCount > 0 ? Math.round((answeredCount / questionCount) * 100) : 0;
        return {
          answeredCount,
          percent,
          isSubmitted: parsed.isSubmitted || false
        };
      }
    } catch (e) {}
    return { answeredCount: 0, percent: 0, isSubmitted: false };
  }

  function renderCatalog() {
    if (!window.QUIZZES_CATALOG) return;

    // 1. Master 390 Card
    const masterQuiz = window.QUIZZES_CATALOG['quiz-390'];
    if (masterQuiz && el.masterBankCardContainer) {
      const stats = getQuizStoredStats('quiz-390', masterQuiz.questionCount);
      const isStarted = stats.answeredCount > 0;
      const btnText = stats.isSubmitted ? 'Xem lại kết quả / Làm lại' : (isStarted ? 'Tiếp tục làm bài' : 'Bắt đầu làm bài');

      el.masterBankCardContainer.innerHTML = `
        <div class="quiz-card featured" data-quizid="quiz-390">
          <div>
            <div class="quiz-card-header">
              <span class="quiz-card-badge">${masterQuiz.badge}</span>
              ${stats.isSubmitted ? '<span class="status-pill active" style="background: var(--cds-success); border-color: var(--cds-success);">Đã hoàn thành</span>' : ''}
            </div>
            <h3 class="quiz-card-title">${masterQuiz.title}</h3>
            <p class="quiz-card-desc">${masterQuiz.subtitle}</p>
          </div>

          <div class="quiz-card-progress">
            <div class="card-prog-info">
              <span>Tiến độ hoàn thành</span>
              <span><strong>${stats.answeredCount}</strong> / ${masterQuiz.questionCount} câu (${stats.percent}%)</span>
            </div>
            <div class="card-prog-track">
              <div class="card-prog-fill" style="width: ${stats.percent}%;"></div>
            </div>
          </div>

          <div class="quiz-card-footer">
            <button class="btn-start-quiz">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              ${btnText}
            </button>
          </div>
        </div>
      `;

      el.masterBankCardContainer.querySelector('.quiz-card').addEventListener('click', () => {
        selectQuiz('quiz-390');
      });
    }

    // 2. Stephane Tests Grid (1 - 6)
    if (el.stephaneTestsGrid) {
      el.stephaneTestsGrid.innerHTML = '';
      for (let i = 1; i <= 6; i++) {
        const qid = `stephane-${i}`;
        const quiz = window.QUIZZES_CATALOG[qid];
        if (!quiz) continue;

        const stats = getQuizStoredStats(qid, quiz.questionCount);
        const isStarted = stats.answeredCount > 0;
        const btnText = stats.isSubmitted ? 'Xem lại bài thi' : (isStarted ? 'Làm tiếp' : 'Bắt đầu thi');

        const card = document.createElement('div');
        card.className = 'quiz-card';
        card.dataset.quizid = qid;
        card.innerHTML = `
          <div>
            <div class="quiz-card-header">
              <span class="quiz-card-badge">${quiz.badge}</span>
              ${stats.isSubmitted ? '<span class="status-pill active" style="background: var(--cds-success); border-color: var(--cds-success); font-size: 11px;">Đã nộp</span>' : ''}
            </div>
            <h3 class="quiz-card-title">${quiz.title}</h3>
            <p class="quiz-card-desc">${quiz.subtitle}</p>
          </div>

          <div class="quiz-card-progress">
            <div class="card-prog-info">
              <span>Đã làm</span>
              <span><strong>${stats.answeredCount}</strong> / ${quiz.questionCount} (${stats.percent}%)</span>
            </div>
            <div class="card-prog-track">
              <div class="card-prog-fill" style="width: ${stats.percent}%;"></div>
            </div>
          </div>

          <div class="quiz-card-footer">
            <button class="btn-start-quiz">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              ${btnText}
            </button>
          </div>
        `;

        card.addEventListener('click', () => {
          selectQuiz(qid);
        });

        el.stephaneTestsGrid.appendChild(card);
      }
    }
  }

  function updateGlobalCourseProgress() {
    let totalQuestions = 0;
    let totalAnswered = 0;

    if (window.QUIZZES_CATALOG) {
      Object.keys(window.QUIZZES_CATALOG).forEach(qid => {
        const q = window.QUIZZES_CATALOG[qid];
        totalQuestions += q.questionCount || 0;
        const stats = getQuizStoredStats(qid, q.questionCount);
        totalAnswered += stats.answeredCount;
      });
    }

    const overallPercent = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;
    if (el.progressBarFill) {
      el.progressBarFill.style.width = `${overallPercent}%`;
    }
  }

  // ==========================================================================
  // STATE PERSISTENCE PER QUIZ (LocalStorage)
  // ==========================================================================
  function saveQuizState(quizId) {
    if (!quizId || quizId === 'catalog') return;
    try {
      const dataToSave = {
        currentIndex: state.currentIndex,
        userAnswers: state.userAnswers,
        flagged: Array.from(state.flagged),
        checked: state.checked,
        mode: state.mode,
        viewMode: state.viewMode,
        timerSeconds: state.timerSeconds,
        isSubmitted: state.isSubmitted
      };
      localStorage.setItem(`coursera_quiz_state_${quizId}`, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save quiz state:', e);
    }
  }

  function loadQuizState(quizId) {
    // Reset state defaults
    state.currentIndex = 0;
    state.userAnswers = {};
    state.flagged = new Set();
    state.checked = {};
    state.mode = 'practice';
    state.viewMode = 'single';
    state.timerSeconds = 0;
    state.isSubmitted = false;

    try {
      const saved = localStorage.getItem(`coursera_quiz_state_${quizId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.userAnswers) state.userAnswers = parsed.userAnswers;
        if (parsed.flagged) state.flagged = new Set(parsed.flagged);
        if (parsed.checked) state.checked = parsed.checked;
        if (parsed.mode) state.mode = parsed.mode;
        if (parsed.viewMode) state.viewMode = parsed.viewMode;
        if (typeof parsed.currentIndex === 'number') state.currentIndex = parsed.currentIndex;
        if (typeof parsed.timerSeconds === 'number') state.timerSeconds = parsed.timerSeconds;
        if (typeof parsed.isSubmitted === 'boolean') state.isSubmitted = parsed.isSubmitted;
      }
    } catch (e) {
      console.error('Failed to load quiz state:', e);
    }
  }

  function resetCurrentQuizProgress() {
    if (!state.currentQuizId || state.currentQuizId === 'catalog') return;
    if (confirm(`Bạn có chắc chắn muốn đặt lại đề thi "${state.activeQuiz ? state.activeQuiz.title : ''}" không? Mọi đáp án đã chọn sẽ bị xóa.`)) {
      state.userAnswers = {};
      state.flagged.clear();
      state.checked = {};
      state.currentIndex = 0;
      state.timerSeconds = 0;
      state.isSubmitted = false;
      saveQuizState(state.currentQuizId);
      renderAll();
      showToast('Đã đặt lại tiến độ đề thi thành công!');
      closeAllModals();
    }
  }

  // ==========================================================================
  // TIMER
  // ==========================================================================
  function setupTimer() {
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      if (state.timerRunning && !state.isSubmitted && state.currentQuizId !== 'catalog') {
        state.timerSeconds++;
        updateTimerDisplay();
      }
    }, 1000);
    updateTimerDisplay();
  }

  function updateTimerDisplay() {
    if (!el.timerDisplay) return;
    const hours = Math.floor(state.timerSeconds / 3600);
    const minutes = Math.floor((state.timerSeconds % 3600) / 60);
    const seconds = state.timerSeconds % 60;
    
    if (hours > 0) {
      el.timerDisplay.textContent = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      el.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  function toggleTimer() {
    state.timerRunning = !state.timerRunning;
    showToast(state.timerRunning ? 'Đã tiếp tục tính giờ' : 'Đã tạm dừng tính giờ');
    renderHeaderActions();
  }

  // ==========================================================================
  // THEME (Dark / Light Mode)
  // ==========================================================================
  function setupTheme() {
    const savedTheme = localStorage.getItem('coursera_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('coursera_theme', newTheme);
    updateThemeIcon(newTheme);
  }

  function updateThemeIcon(theme) {
    if (!el.themeToggleBtn) return;
    el.themeToggleBtn.innerHTML = theme === 'dark'
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================
  function setupEventListeners() {
    // Logo & Back to catalog
    el.brandLogoBtn.addEventListener('click', () => selectQuiz('catalog'));
    el.btnBackCatalog.addEventListener('click', () => selectQuiz('catalog'));

    // Quick quiz dropdown
    el.headerQuizSelector.addEventListener('change', (e) => {
      selectQuiz(e.target.value);
    });

    // Mode toggles
    el.modePracticeBtn.addEventListener('click', () => switchMode('practice'));
    el.modeExamBtn.addEventListener('click', () => switchMode('exam'));

    // View toggles & Shuffle
    el.viewSingleBtn.addEventListener('click', () => switchViewMode('single'));
    el.viewAllBtn.addEventListener('click', () => switchViewMode('all'));
    if (el.btnShuffleQuiz) {
      el.btnShuffleQuiz.addEventListener('click', toggleShuffle);
    }

    // Theme & Timer
    el.themeToggleBtn.addEventListener('click', toggleTheme);
    el.timerBtn.addEventListener('click', toggleTimer);

    // Settings
    el.settingsBtn.addEventListener('click', openSettingsModal);

    // Submit
    el.submitBtn.addEventListener('click', openConfirmModal);

    // Sidebar Search & Filters
    el.sidebarSearch.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase().trim();
      renderSidebar();
    });

    el.topicFilter.addEventListener('change', (e) => {
      state.filterTopic = e.target.value;
      renderSidebar();
    });

    el.statusFilters.addEventListener('click', (e) => {
      const pill = e.target.closest('.status-pill');
      if (pill) {
        state.filterStatus = pill.dataset.status;
        document.querySelectorAll('.status-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        renderSidebar();
      }
    });

    // Mobile sidebar toggle
    el.mobileSidebarToggle.addEventListener('click', () => {
      el.sidebar.classList.toggle('mobile-open');
    });

    // Close mobile sidebar on clicking outside
    document.addEventListener('click', (e) => {
      if (el.sidebar && el.sidebar.classList.contains('mobile-open') &&
          !el.sidebar.contains(e.target) &&
          !el.mobileSidebarToggle.contains(e.target)) {
        el.sidebar.classList.remove('mobile-open');
      }
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Modal Close Buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', closeAllModals);
    });

    // Modal Background Click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeAllModals();
      });
    });

    // Confirm Modal Actions
    document.getElementById('confirm-cancel-btn').addEventListener('click', closeAllModals);
    document.getElementById('confirm-submit-btn').addEventListener('click', executeSubmitExam);

    // Results Modal Actions
    document.getElementById('results-review-all-btn').addEventListener('click', () => {
      closeAllModals();
      state.viewMode = 'single';
      state.currentIndex = 0;
      renderAll();
    });

    document.getElementById('results-review-wrong-btn').addEventListener('click', () => {
      closeAllModals();
      state.filterStatus = 'incorrect';
      state.viewMode = 'single';
      // Jump to first wrong question
      const firstWrong = state.questions.find(q => isQuestionAnswered(q.id) && !isQuestionCorrect(q.id));
      if (firstWrong) {
        state.currentIndex = state.questions.indexOf(firstWrong);
      }
      renderAll();
    });

    document.getElementById('results-retake-btn').addEventListener('click', resetCurrentQuizProgress);
    document.getElementById('results-print-btn').addEventListener('click', () => window.print());

    // Settings Modal Actions
    document.getElementById('settings-reset-btn').addEventListener('click', resetCurrentQuizProgress);
    document.getElementById('settings-shortcuts-btn').addEventListener('click', () => {
      closeAllModals();
      openModal(el.shortcutsModal);
    });
    document.getElementById('settings-export-btn').addEventListener('click', exportProgressJson);
    document.getElementById('settings-import-input').addEventListener('change', importProgressJson);
  }

  // ==========================================================================
  // KEYBOARD NAVIGATION
  // ==========================================================================
  function handleKeyboardShortcuts(e) {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

    if (e.key === 'Escape' || e.key.toLowerCase() === 'h') {
      if (state.currentQuizId !== 'catalog') {
        selectQuiz('catalog');
      }
      return;
    }

    if (state.currentQuizId === 'catalog') return;

    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      nextQuestion();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      prevQuestion();
    } else if (e.key.toLowerCase() === 'f') {
      e.preventDefault();
      const currentQ = getCurrentQuestion();
      if (currentQ) toggleFlag(currentQ.id);
    } else if (e.key === 'Enter') {
      const currentQ = getCurrentQuestion();
      if (currentQ && state.mode === 'practice' && !state.checked[currentQ.id]) {
        e.preventDefault();
        checkCurrentAnswer(currentQ.id);
      }
    } else if (['1', '2', '3', '4', '5', '6', 'a', 'b', 'c', 'd', 'e', 'f'].includes(e.key.toLowerCase())) {
      const currentQ = getCurrentQuestion();
      if (!currentQ) return;
      const keyMap = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E', '6': 'F' };
      const selectedKey = keyMap[e.key] || e.key.toUpperCase();
      const optionExists = currentQ.options.some(o => o.key === selectedKey);
      if (optionExists) {
        e.preventDefault();
        handleOptionSelect(currentQ.id, selectedKey);
      }
    } else if (e.key === '?') {
      openModal(el.shortcutsModal);
    }
  }

  // ==========================================================================
  // MODE SWITCHING & VIEW SWITCHING
  // ==========================================================================
  function switchMode(newMode) {
    if (state.mode === newMode) return;
    state.mode = newMode;
    el.modePracticeBtn.classList.toggle('active', newMode === 'practice');
    el.modeExamBtn.classList.toggle('active', newMode === 'exam');
    saveQuizState(state.currentQuizId);
    renderAll();
    showToast(newMode === 'practice' 
      ? 'Đã chuyển sang Chế độ Luyện tập (Kiểm tra đáp án tức thì)' 
      : 'Đã chuyển sang Chế độ Thi thử (Nộp bài chấm điểm)');
  }

  function switchViewMode(newViewMode) {
    if (state.viewMode === newViewMode) return;
    state.viewMode = newViewMode;
    el.viewSingleBtn.classList.toggle('active', newViewMode === 'single');
    el.viewAllBtn.classList.toggle('active', newViewMode === 'all');
    saveQuizState(state.currentQuizId);
    renderContentArea();
  }

  function toggleShuffle() {
    if (!state.activeQuiz || !state.questions.length) return;
    state.isShuffled = !state.isShuffled;
    if (state.isShuffled) {
      const shuffled = [...state.activeQuiz.questions];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      state.questions = shuffled;
      state.currentIndex = 0;
      if (el.shuffleBtnText) el.shuffleBtnText.textContent = 'Thứ tự gốc';
      if (el.btnShuffleQuiz) {
        el.btnShuffleQuiz.classList.add('active');
        el.btnShuffleQuiz.style.borderColor = 'var(--cds-primary)';
        el.btnShuffleQuiz.style.color = 'var(--cds-primary)';
      }
      showToast('Đã trộn ngẫu nhiên thứ tự câu hỏi!');
    } else {
      state.questions = [...state.activeQuiz.questions];
      state.currentIndex = 0;
      if (el.shuffleBtnText) el.shuffleBtnText.textContent = 'Trộn ngẫu nhiên';
      if (el.btnShuffleQuiz) {
        el.btnShuffleQuiz.classList.remove('active');
        el.btnShuffleQuiz.style.borderColor = '';
        el.btnShuffleQuiz.style.color = '';
      }
      showToast('Đã khôi phục thứ tự chuẩn (1 - ' + state.questions.length + ')');
    }
    renderAll();
  }

  // ==========================================================================
  // QUESTION SELECTION & ANSWER HANDLING
  // ==========================================================================
  function getCurrentQuestion() {
    return state.questions[state.currentIndex] || null;
  }

  function jumpToQuestion(index) {
    if (index >= 0 && index < state.questions.length) {
      state.currentIndex = index;
      if (state.viewMode === 'all') {
        state.viewMode = 'single';
        el.viewSingleBtn.classList.add('active');
        el.viewAllBtn.classList.remove('active');
      }
      saveQuizState(state.currentQuizId);
      renderContentArea();
      renderSidebar();
      renderSubbar();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function nextQuestion() {
    if (state.currentIndex < state.questions.length - 1) {
      jumpToQuestion(state.currentIndex + 1);
    }
  }

  function prevQuestion() {
    if (state.currentIndex > 0) {
      jumpToQuestion(state.currentIndex - 1);
    }
  }

  function handleOptionSelect(qId, key) {
    const q = state.questions.find(item => item.id === qId);
    if (!q) return;

    if (!state.userAnswers[qId]) {
      state.userAnswers[qId] = [];
    }

    if (q.type === 'radio') {
      state.userAnswers[qId] = [key];
    } else {
      // Checkbox multiple selection
      const curr = state.userAnswers[qId];
      const idx = curr.indexOf(key);
      if (idx > -1) {
        curr.splice(idx, 1);
      } else {
        if (q.select_count && curr.length >= q.select_count) {
          curr.shift();
        }
        curr.push(key);
      }
    }

    // If checked previously in practice mode, un-check to allow re-checking
    if (state.mode === 'practice' && state.checked[qId]) {
      delete state.checked[qId];
    }

    saveQuizState(state.currentQuizId);
    renderContentArea();
    renderSidebar();
    renderSubbar();
  }

  function clearAnswer(qId) {
    delete state.userAnswers[qId];
    delete state.checked[qId];
    saveQuizState(state.currentQuizId);
    renderContentArea();
    renderSidebar();
    renderSubbar();
    showToast('Đã xóa lựa chọn câu này');
  }

  function toggleFlag(qId) {
    if (state.flagged.has(qId)) {
      state.flagged.delete(qId);
      showToast('Đã bỏ đánh dấu câu ' + qId);
    } else {
      state.flagged.add(qId);
      showToast('Đã gắn cờ câu ' + qId + ' để xem lại 🚩');
    }
    saveQuizState(state.currentQuizId);
    renderContentArea();
    renderSidebar();
  }

  function checkCurrentAnswer(qId) {
    const userAns = state.userAnswers[qId] || [];
    if (userAns.length === 0) {
      showToast('Vui lòng chọn đáp án trước khi kiểm tra!', 'warning');
      return;
    }
    state.checked[qId] = true;
    saveQuizState(state.currentQuizId);
    renderContentArea();
    renderSidebar();
  }

  // ==========================================================================
  // VALIDATION & SCORING HELPERS
  // ==========================================================================
  function isQuestionAnswered(qId) {
    const ans = state.userAnswers[qId];
    return Array.isArray(ans) && ans.length > 0;
  }

  function isQuestionCorrect(qId) {
    const q = state.questions.find(item => item.id === qId);
    if (!q) return false;
    const userAns = state.userAnswers[qId] || [];
    if (userAns.length === 0) return false;

    const correctSet = new Set(q.correct);
    if (userAns.length !== correctSet.size) return false;
    return userAns.every(ans => correctSet.has(ans));
  }

  // ==========================================================================
  // RENDERING FUNCTIONS
  // ==========================================================================
  function renderAll() {
    renderHeaderActions();
    renderSubbar();
    renderSidebar();
    renderContentArea();
  }

  function renderHeaderActions() {
    el.modePracticeBtn.classList.toggle('active', state.mode === 'practice');
    el.modeExamBtn.classList.toggle('active', state.mode === 'exam');
    el.viewSingleBtn.classList.toggle('active', state.viewMode === 'single');
    el.viewAllBtn.classList.toggle('active', state.viewMode === 'all');
  }

  function renderSubbar() {
    const total = state.questions.length;
    const answeredCount = Object.keys(state.userAnswers).filter(id => state.userAnswers[id] && state.userAnswers[id].length > 0).length;
    const percent = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

    if (el.metaTotal) el.metaTotal.textContent = `${total} câu`;
    if (el.metaAnswered) el.metaAnswered.textContent = `${answeredCount} / ${total} (${percent}%)`;
    if (el.progressBarFill) el.progressBarFill.style.width = `${percent}%`;

    const currentQ = getCurrentQuestion();
    if (el.breadcrumb && currentQ) {
      const qTitle = state.activeQuiz ? (state.activeQuiz.shortTitle || state.activeQuiz.title) : 'Đề thi';
      el.breadcrumb.innerHTML = `<a href="javascript:void(0)" id="subbar-catalog-link" style="color: var(--cds-primary);">Danh sách đề thi</a> &gt; ${qTitle} &gt; Câu ${currentQ.id}`;
      const catLink = document.getElementById('subbar-catalog-link');
      if (catLink) {
        catLink.addEventListener('click', () => selectQuiz('catalog'));
      }
    }
  }

  function populateTopicFilter() {
    if (!el.topicFilter) return;
    el.topicFilter.innerHTML = '<option value="all">Tất cả chủ đề</option>';
    const topics = Array.from(new Set(state.questions.map(q => q.topic))).filter(Boolean);
    topics.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      el.topicFilter.appendChild(opt);
    });
  }

  function getFilteredQuestions() {
    return state.questions.filter(q => {
      // Topic filter
      if (state.filterTopic !== 'all' && q.topic !== state.filterTopic) {
        return false;
      }
      // Status filter
      if (state.filterStatus === 'answered' && !isQuestionAnswered(q.id)) {
        return false;
      }
      if (state.filterStatus === 'unanswered' && isQuestionAnswered(q.id)) {
        return false;
      }
      if (state.filterStatus === 'flagged' && !state.flagged.has(q.id)) {
        return false;
      }
      if (state.filterStatus === 'incorrect') {
        if (!isQuestionAnswered(q.id) || isQuestionCorrect(q.id)) {
          return false;
        }
      }
      // Search query filter
      if (state.searchQuery) {
        const idMatch = q.id.toString() === state.searchQuery;
        const textMatch = q.question.toLowerCase().includes(state.searchQuery);
        const optMatch = q.options.some(o => o.text.toLowerCase().includes(state.searchQuery));
        if (!idMatch && !textMatch && !optMatch) return false;
      }
      return true;
    });
  }

  function renderSidebar() {
    const filtered = getFilteredQuestions();
    if (el.sidebarCountBadge) {
      el.sidebarCountBadge.textContent = `${filtered.length} / ${state.questions.length}`;
    }

    el.questionGrid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    state.questions.forEach((q, idx) => {
      const isVisible = filtered.some(fq => fq.id === q.id);
      if (!isVisible) return;

      const btn = document.createElement('button');
      btn.className = 'grid-q-btn';
      btn.textContent = q.id;
      btn.title = `Câu ${q.id} - ${q.topic}`;

      if (idx === state.currentIndex && state.viewMode === 'single') {
        btn.classList.add('current');
      }

      if (isQuestionAnswered(q.id)) {
        btn.classList.add('answered');
      }

      if (state.flagged.has(q.id)) {
        btn.classList.add('flagged');
      }

      if (state.isSubmitted || state.checked[q.id]) {
        if (isQuestionAnswered(q.id)) {
          if (isQuestionCorrect(q.id)) {
            btn.classList.add('correct');
          } else {
            btn.classList.add('incorrect');
          }
        }
      }

      btn.addEventListener('click', () => {
        jumpToQuestion(idx);
        if (window.innerWidth <= 768) {
          el.sidebar.classList.remove('mobile-open');
        }
      });

      fragment.appendChild(btn);
    });

    el.questionGrid.appendChild(fragment);
  }

  // ==========================================================================
  // QUESTION CONTENT RENDERING
  // ==========================================================================
  function renderContentArea() {
    if (state.viewMode === 'single') {
      el.singleViewContainer.style.display = 'block';
      el.allViewContainer.style.display = 'none';
      renderSingleQuestion();
    } else {
      el.singleViewContainer.style.display = 'none';
      el.allViewContainer.style.display = 'block';
      renderAllQuestionsList();
    }
  }

  function renderSingleQuestion() {
    const q = getCurrentQuestion();
    if (!q) {
      el.singleViewContainer.innerHTML = '<div class="question-card"><p>Không tìm thấy câu hỏi.</p></div>';
      return;
    }

    el.singleViewContainer.innerHTML = createQuestionCardHtml(q, state.currentIndex);
    attachCardEventListeners(el.singleViewContainer, q);
  }

  function renderAllQuestionsList() {
    const filtered = getFilteredQuestions();
    if (filtered.length === 0) {
      el.allViewContainer.innerHTML = '<div class="question-card"><p>Không có câu hỏi nào khớp với bộ lọc hiện tại.</p></div>';
      return;
    }

    el.allViewContainer.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'all-questions-container';

    filtered.forEach((q) => {
      const originalIdx = state.questions.indexOf(q);
      const cardWrapper = document.createElement('div');
      cardWrapper.innerHTML = createQuestionCardHtml(q, originalIdx, true);
      attachCardEventListeners(cardWrapper, q);
      container.appendChild(cardWrapper.firstElementChild);
    });

    el.allViewContainer.appendChild(container);
  }

  // Generate HTML for a single question card
  function createQuestionCardHtml(q, index, isListView = false) {
    const userAns = state.userAnswers[q.id] || [];
    const isFlagged = state.flagged.has(q.id);
    const isChecked = state.checked[q.id] || state.isSubmitted;
    const isCorrect = isQuestionCorrect(q.id);
    const isAnswered = userAns.length > 0;

    // Multi-select pill
    let multiInstruction = '';
    if (q.type === 'checkbox') {
      const needed = q.select_count || q.correct.length;
      multiInstruction = `
        <div class="q-instruction">
          <span>Chọn ${needed} đáp án đúng</span>
          <span class="q-select-count">Đã chọn: ${userAns.length} / ${needed}</span>
        </div>
      `;
    }

    // Format Question Text
    const formattedPrompt = formatTextWithCode(q.question);

    // Options HTML
    const optionsHtml = q.options.map(opt => {
      const isSelected = userAns.includes(opt.key);
      let statusClass = '';

      if (isChecked) {
        if (q.correct.includes(opt.key)) {
          statusClass = 'correct-answer';
        } else if (isSelected && !q.correct.includes(opt.key)) {
          statusClass = 'wrong-answer';
        }
      }

      const formattedOptionText = formatTextWithCode(opt.text);

      return `
        <div class="option-item ${q.type === 'checkbox' ? 'checkbox' : ''} ${isSelected ? 'selected' : ''} ${statusClass}" data-key="${opt.key}">
          <div class="opt-indicator"></div>
          <div class="opt-letter">${opt.key}.</div>
          <div class="opt-text">${formattedOptionText}</div>
        </div>
      `;
    }).join('');

    // Feedback Banner with Dual Tabs (Vietnamese vs Official Stephane Maarek)
    let feedbackBanner = '';
    if (isChecked) {
      const activeTab = state.activeExpTab[q.id] || 'vn';
      const hasOfficial = Boolean(q.explanation_official && q.explanation_official.trim());
      const hasVn = Boolean(q.explanation_vn && q.explanation_vn.trim());

      let explanationBody = '';
      if (hasOfficial && hasVn) {
        explanationBody = `
          <div class="exp-tabs-nav">
            <button class="exp-tab-btn ${activeTab === 'vn' ? 'active' : ''}" data-tab="vn" data-qid="${q.id}">
              🇻🇳 Lời giải tiếng Việt chuyên sâu
            </button>
            <button class="exp-tab-btn ${activeTab === 'official' ? 'active' : ''}" data-tab="official" data-qid="${q.id}">
              🌐 Sơ đồ &amp; Lời giải gốc (Stephane Maarek)
            </button>
          </div>
          <div class="exp-tab-pane ${activeTab === 'vn' ? 'active' : ''}" id="exp-pane-vn-${q.id}">
            ${formatTextWithCode(q.explanation_vn)}
          </div>
          <div class="exp-tab-pane ${activeTab === 'official' ? 'active' : ''}" id="exp-pane-official-${q.id}">
            <div class="exp-official-content">${q.explanation_official}</div>
          </div>
        `;
      } else if (hasOfficial) {
        explanationBody = `<div class="exp-official-content">${q.explanation_official}</div>`;
      } else {
        explanationBody = formatTextWithCode(q.explanation || q.explanation_vn || '');
      }

      if (isCorrect) {
        feedbackBanner = `
          <div class="feedback-banner correct">
            <div class="feedback-title-row">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Chính xác! Làm rất tốt.</span>
            </div>
            <div class="feedback-details">${explanationBody}</div>
          </div>
        `;
      } else {
        feedbackBanner = `
          <div class="feedback-banner incorrect">
            <div class="feedback-title-row">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              <span>Chưa chính xác. Đáp án đúng là: <strong>${q.correct.join(', ')}</strong></span>
            </div>
            <div class="feedback-details">${explanationBody}</div>
          </div>
        `;
      }
    }

    // Footer HTML
    const isFirst = index === 0;
    const isLast = index === state.questions.length - 1;

    let footerHtml = '';
    if (!isListView) {
      footerHtml = `
        <div class="q-footer">
          <div class="footer-nav-left">
            <button class="btn-nav btn-prev-q" ${isFirst ? 'disabled' : ''}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              Câu trước
            </button>
            <button class="btn-nav btn-next-q" ${isLast ? 'disabled' : ''}>
              Câu sau
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
          <div class="footer-nav-right">
            ${isAnswered ? `<button class="btn-clear-choice">Bỏ chọn</button>` : ''}
            ${state.mode === 'practice' && !isChecked ? `
              <button class="btn-check-answer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Kiểm tra đáp án
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }

    return `
      <div class="question-card" id="q-card-${q.id}" data-qid="${q.id}">
        <div class="q-meta-header">
          <div class="q-tags">
            <span class="q-badge-num">Câu ${q.id} / ${state.questions.length}</span>
            <span class="q-badge-point">1 điểm</span>
            <span class="q-badge-topic">${q.topic}</span>
          </div>
          <button class="btn-flag ${isFlagged ? 'active' : ''}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${isFlagged ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
            ${isFlagged ? 'Đã đánh dấu' : 'Đánh dấu xem lại'}
          </button>
        </div>

        <div class="q-prompt">${formattedPrompt}</div>

        ${multiInstruction}

        <div class="options-list">
          ${optionsHtml}
        </div>

        ${feedbackBanner}

        ${footerHtml}
      </div>
    `;
  }

  // Attach event handlers inside a question card
  function attachCardEventListeners(rootElement, q) {
    const card = rootElement.querySelector(`#q-card-${q.id}`) || rootElement;

    // Option items click
    card.querySelectorAll('.option-item').forEach(item => {
      item.addEventListener('click', () => {
        handleOptionSelect(q.id, item.dataset.key);
      });
    });

    // Flag button
    const flagBtn = card.querySelector('.btn-flag');
    if (flagBtn) {
      flagBtn.addEventListener('click', () => toggleFlag(q.id));
    }

    // Check answer button
    const checkBtn = card.querySelector('.btn-check-answer');
    if (checkBtn) {
      checkBtn.addEventListener('click', () => checkCurrentAnswer(q.id));
    }

    // Explanation tab buttons
    card.querySelectorAll('.exp-tab-btn').forEach(tBtn => {
      tBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tabType = tBtn.dataset.tab;
        state.activeExpTab[q.id] = tabType;
        
        card.querySelectorAll('.exp-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabType));
        const paneVn = card.querySelector(`#exp-pane-vn-${q.id}`);
        const paneOff = card.querySelector(`#exp-pane-official-${q.id}`);
        if (paneVn) paneVn.classList.toggle('active', tabType === 'vn');
        if (paneOff) paneOff.classList.toggle('active', tabType === 'official');
      });
    });

    // Clear choice button
    const clearBtn = card.querySelector('.btn-clear-choice');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => clearAnswer(q.id));
    }

    // Nav buttons
    const prevBtn = card.querySelector('.btn-prev-q');
    if (prevBtn) {
      prevBtn.addEventListener('click', prevQuestion);
    }
    const nextBtn = card.querySelector('.btn-next-q');
    if (nextBtn) {
      nextBtn.addEventListener('click', nextQuestion);
    }
  }

  // Helper: Format text, markdown bullets, inline code, and JSON code blocks
  function formatTextWithCode(rawText) {
    if (!rawText) return '';

    // Sanitize basic HTML tags
    let text = rawText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Protect JSON blocks starting with { and ending with }
    const codeBlocks = [];
    text = text.replace(/(\{[\s\S]*?\})/g, function (match) {
      if (match.includes('&quot;') || match.includes('"') || match.includes(':') || match.includes('Statement')) {
        const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
        codeBlocks.push(`<pre class="code-block"><code>${match.replace(/&amp;quot;/g, '"')}</code></pre>`);
        return placeholder;
      }
      return match;
    });

    // Inline code `...`
    text = text.replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>');

    // Bold **...** and italic *...*
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/(^|[^\w*])\*([^*\n]+)\*([^\w*]|$)/g, '$1<em>$2</em>$3');

    // Format markdown bullet lines & newlines
    const lines = text.split('\n');
    const formattedLines = lines.map(line => {
      if (/^\s{2,}[-•]\s+/.test(line)) {
        return `<div class="exp-bullet-sub">${line.replace(/^\s+[-•]\s+/, '• ')}</div>`;
      }
      if (/^[-•]\s+/.test(line)) {
        return `<div class="exp-bullet">${line.replace(/^[-•]\s+/, '')}</div>`;
      }
      if (line.trim() === '') {
        return '<div class="exp-spacer"></div>';
      }
      return `<div>${line}</div>`;
    });
    text = formattedLines.join('');

    // Restore JSON code blocks
    codeBlocks.forEach((block, i) => {
      text = text.replace(`__CODE_BLOCK_${i}__`, block);
    });

    return text;
  }

  // ==========================================================================
  // MODALS & EXAM SUBMISSION
  // ==========================================================================
  function openModal(modalEl) {
    modalEl.classList.add('active');
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  }

  function openConfirmModal() {
    const total = state.questions.length;
    const answeredCount = Object.keys(state.userAnswers).filter(id => state.userAnswers[id] && state.userAnswers[id].length > 0).length;
    const unansweredCount = total - answeredCount;
    const flaggedCount = state.flagged.size;

    if (el.confirmQuizName && state.activeQuiz) {
      el.confirmQuizName.textContent = state.activeQuiz.title;
    }

    document.getElementById('confirm-answered').textContent = answeredCount;
    document.getElementById('confirm-unanswered').textContent = unansweredCount;
    document.getElementById('confirm-flagged').textContent = flaggedCount;

    const warnBox = document.getElementById('confirm-warning-box');
    if (unansweredCount > 0) {
      warnBox.style.display = 'block';
      warnBox.textContent = `Chú ý: Bạn còn ${unansweredCount} câu hỏi chưa trả lời. Bạn có chắc chắn muốn nộp bài?`;
    } else {
      warnBox.style.display = 'none';
    }

    openModal(el.confirmModal);
  }

  function executeSubmitExam() {
    closeAllModals();
    state.isSubmitted = true;
    state.examSubmittedAt = new Date().toISOString();
    saveQuizState(state.currentQuizId);

    // Calculate score
    const total = state.questions.length;
    let correctCount = 0;
    const domainStats = {};

    state.questions.forEach(q => {
      if (!domainStats[q.topic]) {
        domainStats[q.topic] = { total: 0, correct: 0 };
      }
      domainStats[q.topic].total++;

      if (isQuestionCorrect(q.id)) {
        correctCount++;
        domainStats[q.topic].correct++;
      }
    });

    const percent = Math.round((correctCount / total) * 100);
    const passed = percent >= PASSING_PERCENT;

    // Populate Results Modal
    if (el.resultsModalTitle && state.activeQuiz) {
      el.resultsModalTitle.textContent = `Kết quả: ${state.activeQuiz.title}`;
    }

    el.scorePercent.textContent = `${percent}%`;
    const scoreCircle = document.querySelector('.score-circle');
    scoreCircle.className = `score-circle ${passed ? 'passed' : 'failed'}`;

    el.scoreVerdict.textContent = passed ? 'ĐẠT (PASSED) 🎉' : 'CHƯA ĐẠT (FAILED)';
    el.scoreVerdict.className = `verdict-badge ${passed ? 'passed' : 'failed'}`;

    el.statCorrect.textContent = `${correctCount} / ${total}`;
    el.statIncorrect.textContent = `${total - correctCount}`;
    
    // Format Time
    const m = Math.floor(state.timerSeconds / 60);
    const s = state.timerSeconds % 60;
    el.statTime.textContent = `${m} phút ${s} giây`;

    // Domain Breakdown HTML
    el.domainBreakdown.innerHTML = '';
    Object.keys(domainStats).forEach(topic => {
      const d = domainStats[topic];
      const dPercent = Math.round((d.correct / d.total) * 100);
      const row = document.createElement('div');
      row.className = 'domain-bar-item';
      row.innerHTML = `
        <div class="domain-bar-header">
          <span>${topic}</span>
          <span>${d.correct}/${d.total} (${dPercent}%)</span>
        </div>
        <div class="domain-bar-track">
          <div class="domain-bar-fill" style="width: ${dPercent}%; background-color: ${dPercent >= PASSING_PERCENT ? 'var(--cds-success)' : 'var(--cds-danger)'}"></div>
        </div>
      `;
      el.domainBreakdown.appendChild(row);
    });

    openModal(el.resultsModal);
    renderAll();
  }

  // ==========================================================================
  // SETTINGS & EXPORT / IMPORT
  // ==========================================================================
  function openSettingsModal() {
    openModal(el.settingsModal);
  }

  function exportProgressJson() {
    const data = {
      quizId: state.currentQuizId,
      userAnswers: state.userAnswers,
      flagged: Array.from(state.flagged),
      checked: state.checked,
      timerSeconds: state.timerSeconds,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aws-saa-${state.currentQuizId}-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất tiến độ bài thi thành công!');
  }

  function importProgressJson(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported.userAnswers) state.userAnswers = imported.userAnswers;
        if (imported.flagged) state.flagged = new Set(imported.flagged);
        if (imported.checked) state.checked = imported.checked;
        if (imported.timerSeconds) state.timerSeconds = imported.timerSeconds;
        saveQuizState(state.currentQuizId);
        renderAll();
        closeAllModals();
        showToast('Đã nhập dữ liệu tiến độ thành công!');
      } catch (err) {
        showToast('File dữ liệu không hợp lệ!', 'danger');
      }
    };
    reader.readAsText(file);
  }

  // ==========================================================================
  // TOAST NOTIFICATION
  // ==========================================================================
  function showToast(message, type = 'info') {
    if (!el.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
      <span>${message}</span>
    `;
    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
