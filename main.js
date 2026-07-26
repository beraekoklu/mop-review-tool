const HIDE_ANSWERS_CSS = `
#review, #answer, i.icon-check, i.icon-remove, .result-wrapper {
  display: none !important;
}
/* Fallbacks matter here: the newer Vue-based renderer (elements carry a data-v-*
   attribute) does not define these custom properties, and a var() with no fallback
   makes the whole declaration invalid - so without them the native green border on
   the correct answer's letter badge leaks straight through. */
.answer-choice-button.correct, .answer-choice-button.incorrect, .answer-choice-value, .question-container.answer-container.correct, .question-container.answer-container.incorrect {
  border: 1px solid var(--border, #d2d2d2) !important;
  color: var(--black, #1a1a1a) !important;
}
.answer-choice-button.correct, .answer-choice-button.incorrect {
  background-color: var(--pure-white, #fff) !important;
}
.answer-choice-value {
  background-color: var(--background, #f6f6f6) !important;
}
/* An eliminated choice's X is a green (or red) SVG baked into the badge's
   background-image, with the stroke colour hardcoded inside the data-URI. No
   colour/fill/stroke rule can reach it - the colour is part of the image. So swap
   in the identical SVG the site itself uses for a plain eliminated choice: same
   shape and position, just a #DBDBDB stroke. Scoped to .is-eliminated so a correct
   choice the user did NOT eliminate never gets a spurious X. */
.answer-choice-button.is-eliminated.correct .answer-choice-value,
.answer-choice-button.is-eliminated.incorrect .answer-choice-value,
.answer-button-wrapper.is-eliminated.correct .answer-choice-value,
.answer-button-wrapper.is-eliminated.incorrect .answer-choice-value {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' preserveAspectRatio='none' viewBox='0 0 100 100' style='background-color:%23f6f6f6;'><path d='M100 0 L0 100 ' stroke='%23DBDBDB' stroke-width='5px'/><path d='M0 0 L100 100 ' stroke='%23DBDBDB' stroke-width='5px'/></svg>") !important;
}
#answer {
  margin-top: 100%;
}

/* ===== Newer AAMC Question Bank ===== */
/* QBanks wrap each choice in .answer-button-wrapper, and that wrapper carries the
   green/red "correct"/"incorrect" outline + fill. Every wrapper is normalized to
   the same colour and fill (rather than only .correct/.incorrect) so that no state
   can stand out against the others. */
.answer-button-wrapper {
  border-color: var(--border, #d2d2d2) !important;
  background-color: var(--pure-white, #fff) !important;
  color: var(--black, #000) !important;
  outline: none !important;
  box-shadow: none !important;
}
/* The generic rules above give .correct/.incorrect buttons a 1px border, but plain
   QBank buttons have none. That extra border sits inside the wrapper's own border
   and reads as a thicker box, marking the answer and the picked choice. */
.answer-button-wrapper .answer-choice-button.correct,
.answer-button-wrapper .answer-choice-button.incorrect {
  border: 0 none !important;
}
/* QBank result panel that spells out "Your Answer / Correct Answer: X" */
.answer-details {
  display: none !important;
}

/* The in-question flag control marks a flagged question with .is-selected on
   a.bookmark. Rather than guess what the unflagged styling looks like, force both
   states to the same appearance so neither can be told apart. The control stays
   clickable - it just stops reporting state until answers are shown. */
.question-flag .bookmark,
.question-flag .bookmark.is-selected {
  background: none !important;
  border-color: transparent !important;
}
.question-flag .bookmark .flag-icon,
.question-flag .bookmark.is-selected .flag-icon {
  color: #9e9e9e !important;
  opacity: 1 !important;
}

/* ===== Question list ===== */
/* Mask the correctness tick and the flag so scanning the list does not reveal how
   a question went before it is retested. The correctness cell is empty and drawn
   entirely in CSS, so hide the cell itself. visibility rather than display keeps
   the column widths intact, and both stay in the DOM so the filter can still read
   them. Scoped to li.content to leave the column header's own flag glyph alone. */
ul.answers-wrapper li.content .li-cell.correctness,
ul.answers-wrapper li.content .flag-icon {
  visibility: hidden !important;
}
`;

const COLLAPSED_STORAGE_KEY = 'mop-review-tool:collapsed';
const ENABLED_STORAGE_KEY = 'mop-review-tool:enabled';

// Styling for the tool's own UI. This lives in a separate <style> from
// HIDE_ANSWERS_CSS because that one gets emptied whenever answers are shown,
// and the panel must stay styled at all times.
const UI_CSS = `
.mop-rt__panel {
  position: fixed; bottom: 16px; right: 16px; z-index: 2147483646;
  width: 216px; box-sizing: border-box; overflow: hidden;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  box-shadow: 0 6px 24px rgba(15, 23, 42, 0.14);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #0f172a;
}
.mop-rt__panel--collapsed { width: auto; }
.mop-rt__panel[hidden] { display: none !important; }
.mop-rt__header {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; cursor: pointer; user-select: none;
}
.mop-rt__dot {
  flex: none; width: 9px; height: 9px; border-radius: 50%;
  background: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}
.mop-rt__panel--shown .mop-rt__dot { background: #22c55e; box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2); }
.mop-rt__panel--review .mop-rt__dot { background: #f59e0b; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2); }
.mop-rt__status { flex: 1; font-size: 13px; font-weight: 600; white-space: nowrap; }
.mop-rt__chevron {
  flex: none; border: none; background: none; padding: 0;
  color: #94a3b8; font-size: 11px; line-height: 1; cursor: pointer;
}
.mop-rt__body {
  padding: 0 12px 12px; display: flex; flex-direction: column; gap: 8px;
}
.mop-rt__panel--collapsed .mop-rt__body { display: none; }
.mop-rt__seg {
  display: flex; gap: 3px; padding: 3px;
  background: #f1f5f9; border-radius: 8px;
}
.mop-rt__seg-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;
  padding: 6px 0; border: none; border-radius: 6px; background: none;
  font-size: 12px; font-weight: 600; color: #475569; cursor: pointer;
}
.mop-rt__seg-btn--active {
  background: #fff; color: #002c57;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.12);
}
.mop-rt__action {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; padding: 9px; border: none; border-radius: 8px;
  background: #002c57; color: #fff;
  font-size: 13px; font-weight: 600; cursor: pointer;
}
.mop-rt__action:hover { background: #01427f; }
.mop-rt__key {
  padding: 1px 5px; border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px; font-weight: 700;
  background: rgba(255, 255, 255, 0.2); color: inherit;
}
.mop-rt__seg-btn .mop-rt__key { background: #e2e8f0; color: #64748b; }
.mop-rt__seg-btn--active .mop-rt__key { background: #e8eef5; color: #002c57; }
.mop-rt__toggle {
  display: flex; align-items: center; justify-content: center;
  width: 100%; box-sizing: border-box; padding: 9px;
  border: 1px solid #e2e8f0; border-radius: 8px;
  background: #fff; color: #475569;
  font-size: 13px; font-weight: 600; cursor: pointer;
}
.mop-rt__toggle--on { background: #002c57; border-color: #002c57; color: #fff; }
.mop-rt__count { font-size: 12px; color: #64748b; text-align: center; }
.mop-rt__queue {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 0 12px 12px;
}
.mop-rt__queue[hidden] { display: none !important; }
.mop-rt__queue-nav { display: flex; align-items: center; gap: 10px; }
.mop-rt__nav-btn {
  width: 36px; height: 30px; padding: 0;
  border: 1px solid #e2e8f0; border-radius: 8px; background: #fff;
  color: #002c57; font-size: 17px; font-weight: 700; line-height: 1; cursor: pointer;
}
.mop-rt__nav-btn:hover:not(:disabled) { background: #f1f5f9; }
.mop-rt__nav-btn:disabled { color: #cbd5e1; cursor: default; }
.mop-rt__queue-pos {
  min-width: 64px; text-align: center;
  font-size: 13px; font-weight: 600; color: #0f172a;
}
.mop-rt__link-btn {
  border: none; background: none; padding: 2px;
  font-size: 12px; color: #64748b; text-decoration: underline; cursor: pointer;
}
/* All that is left on the page when the tool is switched off. It has to be small
   enough to ignore during a test but obvious enough to actually find again, so it
   sits quietly at partial opacity and expands to a labelled button on hover. */
.mop-rt__revive {
  position: fixed; bottom: 12px; right: 12px; z-index: 2147483646;
  display: flex; align-items: center; gap: 6px;
  padding: 6px 10px; border-radius: 999px;
  border: 1px solid #cbd5e1; background: #fff; color: #475569;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 12px; font-weight: 600; line-height: 1;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
  opacity: 0.55; cursor: pointer;
}
.mop-rt__revive:hover, .mop-rt__revive:focus-visible { opacity: 1; }
.mop-rt__revive::before {
  content: ''; width: 8px; height: 8px; border-radius: 50%; background: #94a3b8;
}
.mop-rt__revive[hidden] { display: none !important; }
.mop-rt__action:disabled { background: #cbd5e1; cursor: default; }
.mop-rt__row-hidden { display: none !important; }
`;

var quizMode = true;
var answersHidden = true;
var enabled = readEnabled();
let style = document.createElement('style');
style.innerHTML = HIDE_ANSWERS_CSS;
document.head.appendChild(style);

let uiStyle = document.createElement('style');
uiStyle.innerHTML = UI_CSS;
document.head.appendChild(uiStyle);

function readEnabled() {
	try {
		return localStorage.getItem(ENABLED_STORAGE_KEY) !== '0';
	} catch (error) {
		return true;
	}
}

// Master switch. While off the tool must leave the page completely alone: during a
// live test its CSS can hide real content, and worse, answering a question would
// run setAnswerButtonsEnabled(false) and disable every choice.
function setEnabled(on) {
	enabled = on;
	try {
		localStorage.setItem(ENABLED_STORAGE_KEY, on ? '1' : '0');
	} catch (error) {
		// Storage can be unavailable; the switch just won't persist
	}
	if (on) {
		setHidden(answersHidden);
		setAnswerButtonsEnabled(quizMode);
		startQuestionChangeObserver();
	} else {
		setHidden(answersHidden);
		// Undo anything already applied to the page
		setAnswerButtonsEnabled(true);
		for (let row of document.querySelectorAll('.mop-rt__row-hidden')) {
			row.classList.remove('mop-rt__row-hidden');
		}
	}
	syncUIForPage();
}

function setHidden(newVal) {
	answersHidden = newVal;
	// Single choke point: nothing can reapply the stylesheet while switched off
	style.innerHTML = (enabled && answersHidden) ? HIDE_ANSWERS_CSS : '';
	updateStatusUI();
}

function quizModeSetup() {
	if (!enabled) {
		return;
	}
	quizMode = true;
	setAnswerButtonsEnabled(quizMode);
	setHidden(quizMode);
}

function reviewModeSetup() {
	if (!enabled) {
		return;
	}
	quizMode = false;
	setAnswerButtonsEnabled(quizMode);
	setHidden(quizMode);

	// Reset answer button appearance
	var answerButtons = document.getElementsByClassName('answer-choice-button');
	for (let answerButton of answerButtons) {
		if (!(answerButton.classList.contains('correct') || answerButton.classList.contains('incorrect'))) {
			// QBank answer buttons have no icon inside them, unlike FL ones
			const icon = answerButton.getElementsByTagName('i')[0];
			if (icon) {
				icon.remove();
			}
			answerButton.classList.remove('is-selected');
		}
	}
}

function setAnswerButtonsEnabled(buttonsEnabled) {
	var answerButtons = document.getElementsByClassName('answer-choice-button');
	for (let answerButton of answerButtons) {
		if (buttonsEnabled) {
			answerButton.removeAttribute('disabled');
		} else {
			answerButton.setAttribute('disabled', true);
			answerButton.blur();
		}
	}
}

// Shared by the '.' shortcut and the panel's action button. Toggling implies the
// user wants to keep quizzing, so it forces quiz mode - and the answer buttons have
// to follow, otherwise the panel reports "Quiz" while the choices stay disabled and
// unclickable from an earlier review-mode or answer-click lock.
function toggleAnswers() {
	if (!enabled) {
		return;
	}
	const hide = !answersHidden;
	quizMode = true;
	setHidden(hide);
	setAnswerButtonsEnabled(hide);
}

// Puts a freshly-opened question back into its unattempted state. Revealing an
// answer both clears the CSS and disables the choices, so restoring one without
// the other would leave a question that claims to be hidden but cannot be answered.
function resetForNewQuestion() {
	if (!enabled || !quizMode) {
		return;
	}
	setHidden(true);
	setAnswerButtonsEnabled(true);
}

function setAnswerClickCallback() {
	if (!enabled) {
		return;
	}
	var answerButtons = document.getElementsByClassName('answer-choice-button');
	for (let answerButton of answerButtons) {
		setAnswerButtonsEnabled(quizMode);
		answerButton.addEventListener('click', (event) => {
			// Listeners added while enabled are never removed, so this has to check
			// too - otherwise answering during a test would still disable the
			// remaining choices after the tool was switched off
			if (!enabled) {
				return;
			}
			// Show all answers
			setHidden(false);
			// Disable clicking answer buttons
			setAnswerButtonsEnabled(false);
		});
	}
}

// ========== Tool UI ========== //

let panel = null;
let statusLabel = null;
let chevron = null;
let quizButton = null;
let reviewButton = null;
let actionLabel = null;

// Builds a labelled button with its keyboard shortcut shown on it, so the
// shortcuts are discoverable without a separate help screen
function buildButton(className, label, key, onClick) {
	const button = document.createElement('button');
	button.className = className;
	const text = document.createElement('span');
	text.textContent = label;
	const kbd = document.createElement('span');
	kbd.className = 'mop-rt__key';
	kbd.textContent = key;
	button.append(text, kbd);
	button.addEventListener('click', () => {
		// Leaving the button focused would make a later Space/Enter re-trigger it
		// and swallow page scrolling
		button.blur();
		onClick();
	});
	return button;
}

function buildUI() {
	panel = document.createElement('div');
	panel.className = 'mop-rt__panel';

	// Header doubles as the collapse control
	const header = document.createElement('div');
	header.className = 'mop-rt__header';
	header.title = 'Collapse / expand';
	const dot = document.createElement('span');
	dot.className = 'mop-rt__dot';
	statusLabel = document.createElement('span');
	statusLabel.className = 'mop-rt__status';
	chevron = document.createElement('button');
	chevron.className = 'mop-rt__chevron';
	header.append(dot, statusLabel, chevron);
	header.addEventListener('click', () => {
		// Same reason as buildButton: a focused chevron would turn a later Space
		// into a collapse instead of a page scroll
		chevron.blur();
		setCollapsed(!isCollapsed());
	});

	const body = document.createElement('div');
	body.className = 'mop-rt__body';

	const segmented = document.createElement('div');
	segmented.className = 'mop-rt__seg';
	quizButton = buildButton('mop-rt__seg-btn', 'Quiz', 'q', quizModeSetup);
	reviewButton = buildButton('mop-rt__seg-btn', 'Review', 'r', reviewModeSetup);
	segmented.append(quizButton, reviewButton);

	const action = buildButton('mop-rt__action', 'Show answers', '.', toggleAnswers);
	actionLabel = action.firstChild;

	body.append(segmented, action);

	// Queue controls live outside .mop-rt__body on purpose: that is what collapsing
	// hides, and a collapsed panel would otherwise make a running queue unreachable
	queueRow = document.createElement('div');
	queueRow.className = 'mop-rt__queue';
	queueRow.hidden = true;

	const nav = document.createElement('div');
	nav.className = 'mop-rt__queue-nav';

	prevButton = document.createElement('button');
	prevButton.className = 'mop-rt__nav-btn';
	prevButton.textContent = '‹';
	prevButton.title = 'Previous in review (←)';
	prevButton.addEventListener('click', () => {
		prevButton.blur();
		retreatQueue();
	});

	queuePos = document.createElement('span');
	queuePos.className = 'mop-rt__queue-pos';

	nextButton = document.createElement('button');
	nextButton.className = 'mop-rt__nav-btn';
	nextButton.textContent = '›';
	nextButton.title = 'Next in review (→)';
	nextButton.addEventListener('click', () => {
		nextButton.blur();
		advanceQueue();
	});

	nav.append(prevButton, queuePos, nextButton);

	stopButton = document.createElement('button');
	stopButton.className = 'mop-rt__link-btn';
	stopButton.textContent = 'Stop review';
	stopButton.addEventListener('click', () => {
		stopButton.blur();
		stopQueue();
	});

	body.append(buildOffButton());

	queueRow.append(nav, stopButton);
	panel.append(header, body, queueRow);
	document.body.append(panel);

	setCollapsed(readCollapsed());
	updateQueueUI();
}

// The site is a single-page app: moving between the question list and a question
// only changes the URL hash, so the content script is never re-run. Both panels are
// built once and shown or hidden according to what is currently on screen.
// Presence in the DOM is not the same as being on screen: this SPA keeps the
// question list markup around and merely hides it while a question is open, so
// testing for existence alone would leave the list panel up - and the queue's
// Next button, which lives in the question panel, permanently hidden.
function isVisible(element) {
	return !!element && !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
}

function syncUIForPage() {
	if (reviveButton) {
		reviveButton.hidden = enabled;
	}
	if (!enabled) {
		if (filterPanel) {
			filterPanel.hidden = true;
		}
		if (panel) {
			panel.hidden = true;
		}
		return;
	}
	// getListRows already resolves to the on-screen list, so a non-empty result
	// means the list view is what is showing
	const onList = getListRows().length > 0;
	// getQuestionApp already relies on innerText, which is empty for hidden nodes
	const onQuestion = isVisible(getQuestionApp());
	if (filterPanel) {
		filterPanel.hidden = !onList;
	}
	if (panel) {
		// Keep the panel up while a queue is running even if the question view is
		// not recognised, so a detection miss cannot strand the user mid-queue
		panel.hidden = onList || (!onQuestion && !readQueue());
	}
	if (onList) {
		applyFilter();
	}
	updateQueueUI();
}

function updateStatusUI() {
	// The list panel's masking button reflects the same state, and that screen is
	// reachable without the quiz panel ever being shown
	if (resultsButton) {
		resultsButton.classList.toggle('mop-rt__toggle--on', answersHidden);
		setText(resultsButton.firstChild, answersHidden ? 'Results hidden' : 'Results shown');
	}
	if (!panel) {
		return;
	}
	panel.classList.remove('mop-rt__panel--shown', 'mop-rt__panel--review');
	if (!quizMode) {
		panel.classList.add('mop-rt__panel--review');
		setText(statusLabel, 'Review mode');
	} else if (answersHidden) {
		setText(statusLabel, 'Quiz · hidden');
	} else {
		panel.classList.add('mop-rt__panel--shown');
		setText(statusLabel, 'Quiz · revealed');
	}
	setText(actionLabel, answersHidden ? 'Show answers' : 'Hide answers');
	quizButton.classList.toggle('mop-rt__seg-btn--active', quizMode);
	reviewButton.classList.toggle('mop-rt__seg-btn--active', !quizMode);
}

// Assigning textContent replaces the node's children even when the string is
// identical, which the page observer would see as a mutation and reschedule on
// forever. Only write when the value actually changes.
function setText(element, value) {
	if (element.textContent !== value) {
		element.textContent = value;
	}
}

// ========== Question list filter + review queue ========== //

const QUEUE_STORAGE_KEY = 'mop-review-tool:queue';
const FILTER_STORAGE_KEY = 'mop-review-tool:filter-on';
const COLLECTED_STORAGE_KEY = 'mop-review-tool:collected';

let filterPanel = null;
let filterToggle = null;
let filterCount = null;
let startButton = null;
let resetButton = null;
let resultsButton = null;
let nextButton = null;
let prevButton = null;
let queuePos = null;
let queueRow = null;
let stopButton = null;
let reviveButton = null;

function buildReviveButton() {
	reviveButton = document.createElement('button');
	reviveButton.className = 'mop-rt__revive';
	reviveButton.textContent = 'Review tool off';
	reviveButton.title = 'Click to turn the MOP Review Tool back on';
	reviveButton.setAttribute('aria-label', 'Turn the MOP Review Tool back on');
	reviveButton.hidden = true;
	reviveButton.addEventListener('click', () => {
		reviveButton.blur();
		setEnabled(true);
	});
	document.body.append(reviveButton);
}

// Added to both panels: either one can be the only one on screen
function buildOffButton() {
	const off = document.createElement('button');
	off.className = 'mop-rt__link-btn';
	off.textContent = 'Turn off';
	off.title = 'Disable the tool completely - use this while taking a test';
	off.addEventListener('click', () => {
		off.blur();
		setEnabled(false);
	});
	return off;
}

// Each exam section renders its own list and the inactive ones stay in the DOM,
// so pick the list that is actually on screen. Testing an individual row instead
// would fail everywhere but the first section, and would also break once the
// filter hides rows - a hidden row is not "invisible section", it is a match that
// was filtered out. The list element itself keeps its header row, so it stays
// measurable even when every row is filtered away.
function getVisibleList() {
	for (let list of document.querySelectorAll('ul.answers-wrapper')) {
		// Fall back to the container: with every row filtered out the list itself
		// can collapse to nothing, but its wrapper is still on screen. On a
		// question screen the whole subtree is hidden, so neither test passes.
		if (isVisible(list) || isVisible(list.parentElement)) {
			return list;
		}
	}
	return null;
}

// The screen-reader mirror table also carries .answers-wrapper, but it is a
// <table>, so selecting the ul above and li.content here leaves it alone.
function getListRows() {
	const list = getVisibleList();
	return list ? Array.from(list.querySelectorAll('li.content')) : [];
}

// Scoped to the row on purpose: the column header also contains a .flag-icon
// (title="Flags"), which would otherwise match every row.
function rowIsFlagged(row) {
	return !!row.querySelector('.flag-icon');
}

// classList.contains does exact token matching, so this is false for the
// "incorrect" class - a substring test would wrongly call every wrong answer
// correct. Any cell not explicitly marked correct counts, which also picks up
// omitted questions without needing to know what class they carry. A row with no
// correctness cell at all is not a question row, so it does not count.
function rowIsIncorrect(row) {
	const cell = row.querySelector('.correctness');
	return !!cell && !cell.classList.contains('correct');
}

function rowMatchesFilter(row) {
	return rowIsIncorrect(row) || rowIsFlagged(row);
}

// Scoped to the action cell: the preview cell renders question text, which could
// itself contain a link and would otherwise be mistaken for the Review link.
function getReviewHref(row) {
	const link = row.querySelector('.li-cell.action a.link[href]');
	return link ? link.href : null;
}

function getRowId(row) {
	return row.getAttribute('data-content-location');
}

// The displayed question number is the only reliable ordering key. Question ids
// do not track it - in the captured data question 1 is ...1162902 while question
// 2 is ...1162901, so ids run backwards relative to the paper.
function getRowNumber(row) {
	const cell = row.querySelector('.li-cell.number');
	const value = cell ? parseInt(cell.innerText.trim(), 10) : NaN;
	return isNaN(value) ? null : value;
}

// Review hrefs look like ".../app/exam-4#exams/383800152/exam_sections/9049/1162901".
// Everything before the trailing question id identifies the section, so a set
// collected in one section can be detected and discarded when the user moves to
// another - otherwise a queue could strand them on unrelated questions.
function getSectionKey(href) {
	return href ? href.replace(/\/[^\/]*$/, '') : '';
}

function readCollected() {
	try {
		const raw = sessionStorage.getItem(COLLECTED_STORAGE_KEY);
		const parsed = raw ? JSON.parse(raw) : null;
		return parsed && parsed.items ? parsed : { section: '', items: [] };
	} catch (error) {
		return { section: '', items: [] };
	}
}

function writeCollected(collected) {
	try {
		sessionStorage.setItem(COLLECTED_STORAGE_KEY, JSON.stringify(collected));
	} catch (error) {
		// Without storage the set only lasts as long as this page render
	}
}

var lastCollectedPageKey = '';

function getPageKey(rows) {
	const ids = [];
	for (let row of rows) {
		const id = getRowId(row);
		if (id) {
			ids.push(id);
		}
	}
	return ids.join(',');
}

function resetCollected() {
	writeCollected({ section: '', items: [] });
	// Mark the page in view as already handled, otherwise applyFilter below would
	// immediately re-add its matches and the count would spring back up, making
	// reset look like it had done nothing
	lastCollectedPageKey = getPageKey(getListRows());
	applyFilter();
}

// Paging on this site hits the network, so the matching set is built up from
// whatever pages the user actually visits rather than by walking the paginator
// automatically. Deduped by question id, so revisiting a page is harmless.
function collectMatches(rows) {
	const collected = readCollected();
	// Read from any row, not just a matching one: a page with no matches still
	// tells us which section we are on, and without that a set gathered elsewhere
	// would survive and send the user to another section's questions
	const section = getSectionKey(getReviewHref(rows[0]));
	if (section && collected.section !== section) {
		collected.section = section;
		collected.items = [];
		writeCollected(collected);
	}
	// Collect each page once. This is what lets reset stay reset until the user
	// actually moves to a different page, and it keeps repeated syncs cheap.
	const pageKey = getPageKey(rows);
	if (pageKey && pageKey === lastCollectedPageKey) {
		return collected;
	}
	lastCollectedPageKey = pageKey;
	const matches = rows.filter(rowMatchesFilter);
	if (!matches.length) {
		return collected;
	}
	const seen = {};
	for (let item of collected.items) {
		seen[item.id] = true;
	}
	let added = false;
	for (let row of matches) {
		const id = getRowId(row);
		const href = getReviewHref(row);
		if (!id || !href || seen[id]) {
			continue;
		}
		seen[id] = true;
		collected.items.push({ id: id, href: href, number: getRowNumber(row) });
		added = true;
	}
	if (added) {
		writeCollected(collected);
	}
	return collected;
}

function isFilterOn() {
	try {
		return sessionStorage.getItem(FILTER_STORAGE_KEY) === '1';
	} catch (error) {
		return false;
	}
}

function setFilterOn(on) {
	try {
		sessionStorage.setItem(FILTER_STORAGE_KEY, on ? '1' : '0');
	} catch (error) {
		// Storage can be unavailable; the filter just won't persist across renders
	}
	applyFilter();
}

// Hides non-matching rows. Called again whenever the table re-renders, because
// AAMC's own Filter button and column sorting rebuild the list from scratch.
function applyFilter() {
	if (!enabled) {
		return;
	}
	const rows = getListRows();
	if (!rows.length) {
		return;
	}
	const on = isFilterOn();
	let matched = 0;
	for (let row of rows) {
		const keep = rowMatchesFilter(row);
		if (keep) {
			matched++;
		}
		row.classList.toggle('mop-rt__row-hidden', on && !keep);
	}
	const collected = collectMatches(rows);
	const total = collected.items.length;
	if (filterToggle) {
		filterToggle.classList.toggle('mop-rt__toggle--on', on);
		setText(filterToggle.firstChild, on ? 'Filter is on' : 'Show incorrect + flagged');
		setText(filterCount, total + ' collected · ' + matched + ' on this page');
		setText(startButton.firstChild, 'Start review (' + total + ')');
		startButton.disabled = total === 0;
		resetButton.hidden = total === 0;
	}
}

function readQueue() {
	try {
		const raw = sessionStorage.getItem(QUEUE_STORAGE_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch (error) {
		return null;
	}
}

function writeQueue(queue) {
	try {
		if (queue) {
			sessionStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
		} else {
			sessionStorage.removeItem(QUEUE_STORAGE_KEY);
		}
	} catch (error) {
		// Without storage the queue simply does not survive a full page load
	}
}

// Builds a queue from everything gathered across the pages the user has visited.
// The hrefs are the site's own per-row Review links, so each step is the same
// navigation the user would make by clicking that link - and since they differ
// only in the URL hash, the SPA handles them in-page without a reload.
function startQueue() {
	// Sort by question number, not by the order the pages happened to be visited,
	// so starting on page 2 still reviews the section front to back. Anything
	// without a number keeps its relative position at the end (sort is stable).
	const items = readCollected().items.slice().sort((a, b) => {
		if (a.number == null && b.number == null) {
			return 0;
		}
		if (a.number == null) {
			return 1;
		}
		if (b.number == null) {
			return -1;
		}
		return a.number - b.number;
	});
	const hrefs = items.map((item) => item.href).filter(Boolean);
	if (!hrefs.length) {
		return;
	}
	// Tagged with its section so it cannot drive navigation elsewhere
	writeQueue({ section: getSectionKey(hrefs[0]), hrefs: hrefs, index: 0 });
	updateQueueUI();
	location.href = hrefs[0];
}

function stopQueue() {
	writeQueue(null);
	updateQueueUI();
}

// Moves to a position in the queue. Bounds-checked, so the prev/next controls and
// the arrow keys can call it freely - out-of-range is a no-op rather than ending
// the queue, so the user can page back and forth without losing their place.
function goToQueueIndex(index) {
	const queue = readQueue();
	if (!queue || index < 0 || index >= queue.hrefs.length) {
		return;
	}
	queue.index = index;
	writeQueue(queue);
	updateQueueUI();
	// Hide before moving. The hashchange listener also covers this, but it does not
	// fire when the target equals the current URL, and this way the answer is never
	// briefly visible on the incoming question.
	resetForNewQuestion();
	if (queue.hrefs[index] !== location.href) {
		location.href = queue.hrefs[index];
	}
}

function advanceQueue() {
	const queue = readQueue();
	if (queue) {
		goToQueueIndex(queue.index + 1);
	}
}

function retreatQueue() {
	const queue = readQueue();
	if (queue) {
		goToQueueIndex(queue.index - 1);
	}
}

// True while a queue is active for the section currently on screen - the gate for
// the prev/next controls and for hijacking the arrow keys.
function queueApplies() {
	const queue = readQueue();
	return !!queue && (!queue.section || getSectionKey(location.href) === queue.section);
}

function updateQueueUI() {
	if (!queueRow) {
		return;
	}
	const queue = readQueue();
	const applies = queueApplies();
	queueRow.hidden = !applies;
	if (!applies) {
		return;
	}
	setText(queuePos, (queue.index + 1) + ' of ' + queue.hrefs.length);
	prevButton.disabled = queue.index <= 0;
	nextButton.disabled = queue.index >= queue.hrefs.length - 1;
}

function buildFilterPanel() {
	filterPanel = document.createElement('div');
	filterPanel.className = 'mop-rt__panel';
	filterPanel.hidden = true;

	const header = document.createElement('div');
	header.className = 'mop-rt__header';
	const dot = document.createElement('span');
	dot.className = 'mop-rt__dot';
	const label = document.createElement('span');
	label.className = 'mop-rt__status';
	label.textContent = 'Review filter';
	header.append(dot, label);

	const body = document.createElement('div');
	body.className = 'mop-rt__body';

	filterToggle = document.createElement('button');
	filterToggle.className = 'mop-rt__toggle';
	filterToggle.append(document.createElement('span'));
	filterToggle.title = 'Show questions that are incorrect OR flagged';
	filterToggle.addEventListener('click', () => {
		filterToggle.blur();
		setFilterOn(!isFilterOn());
	});

	filterCount = document.createElement('div');
	filterCount.className = 'mop-rt__count';

	startButton = document.createElement('button');
	startButton.className = 'mop-rt__action';
	startButton.append(document.createElement('span'));
	startButton.title = 'Review everything collected across the pages you have visited';
	startButton.addEventListener('click', () => {
		startButton.blur();
		startQueue();
	});

	// The quiz panel is hidden on this screen, so masking needs its own control here
	resultsButton = document.createElement('button');
	resultsButton.className = 'mop-rt__toggle';
	resultsButton.append(document.createElement('span'));
	resultsButton.title = 'Show or hide the correctness ticks and flags in this list';
	resultsButton.addEventListener('click', () => {
		resultsButton.blur();
		toggleAnswers();
	});

	const hint = document.createElement('div');
	hint.className = 'mop-rt__count';
	hint.textContent = 'Visit other pages to add to the set';

	resetButton = document.createElement('button');
	resetButton.className = 'mop-rt__link-btn';
	resetButton.textContent = 'Reset collected';
	resetButton.hidden = true;
	resetButton.addEventListener('click', () => {
		resetButton.blur();
		resetCollected();
	});

	body.append(resultsButton, filterToggle, filterCount, startButton, hint, resetButton, buildOffButton());
	filterPanel.append(header, body);
	document.body.append(filterPanel);

	updateStatusUI();
}

function isCollapsed() {
	return panel && panel.classList.contains('mop-rt__panel--collapsed');
}

function setCollapsed(collapsed) {
	if (!panel) {
		return;
	}
	panel.classList.toggle('mop-rt__panel--collapsed', collapsed);
	setText(chevron, collapsed ? '▲' : '▼');
	try {
		localStorage.setItem(COLLAPSED_STORAGE_KEY, collapsed ? '1' : '0');
	} catch (error) {
		// Storage can be unavailable; collapsing just won't persist
	}
	updateStatusUI();
}

function readCollapsed() {
	try {
		return localStorage.getItem(COLLAPSED_STORAGE_KEY) === '1';
	} catch (error) {
		return false;
	}
}

// There are some empty #question-app divs, so find the one that actually has content
function getQuestionApp() {
	for (let questionApp of document.querySelectorAll('#question-app')) {
		if (questionApp.innerText.trim().length > 0) {
			return questionApp;
		}
	}
	return null;
}

var lastChoiceNode = null;
var lastChoiceText = '';

function getChoiceText() {
	return Array.from(document.getElementsByClassName('answer-choice-text'))
		.map((choice) => choice.innerText.trim())
		.join('|');
}

// Decides whether the observer fired for a genuine question change or for an
// unrelated mutation on the same question (revealing an explanation, the site
// updating its own chrome). Getting this wrong in the "same question" direction
// would re-hide answers the user just revealed; getting it wrong the other way
// leaves the next question's answer showing, so both halves matter.
//
// Node identity is the primary test: navigating re-renders the choice elements,
// so the previous nodes are detached. Text alone cannot detect this, because MCAT
// items reuse answer wording verbatim - Roman numeral sets ("I only", "II only",
// ...), True/False, and Increase/Decrease all repeat across consecutive questions.
// Text is still compared as a fallback in case the page reuses the nodes.
function isNewQuestion() {
	const firstChoice = document.getElementsByClassName('answer-choice-button')[0] || null;
	const choiceText = getChoiceText();
	if (firstChoice === lastChoiceNode && choiceText === lastChoiceText) {
		return false;
	}
	lastChoiceNode = firstChoice;
	lastChoiceText = choiceText;
	return true;
}

// The single place a question change is acted on. Driven by whatever notices the
// change first - the #question-app observer, the page-wide observer, or hashchange -
// and made idempotent by isNewQuestion so calling it from all three is harmless.
// Routing everything through here is what makes re-hiding work across renderers:
// the older pages fire the #question-app observer, but the newer Vue renderer
// navigates without a hash change or a fresh #question-app, and only the page-wide
// observer catches it.
function handleQuestionChange() {
	if (!enabled || !isNewQuestion()) {
		return;
	}
	resetForNewQuestion();
	setAnswerClickCallback();
}

// Secondary, less taxing observer
const questionChangeObserver = new MutationObserver(handleQuestionChange);

var observedQuestionApp = null;

// Arms the targeted observer on #question-app when one exists. Safe to call
// repeatedly and re-arms onto a replacement node. The actual re-hide is left to
// handleQuestionChange so it happens the same way whether or not this observer is
// the one that fires.
function startQuestionChangeObserver() {
	if (!enabled) {
		return false;
	}
	const questionApp = getQuestionApp();
	if (!questionApp) {
		return false;
	}
	if (questionApp === observedQuestionApp) {
		return true;
	}
	questionChangeObserver.disconnect();
	observedQuestionApp = questionApp;
	questionChangeObserver.observe(questionApp, { childList: true, subtree: true });
	return true;
}

// ========== Content script ========== //

buildUI();
buildFilterPanel();
buildReviveButton();

// Nothing should be applied to the page if the tool was left switched off
if (!enabled) {
	setHidden(answersHidden);
}

// Coalesced to one pass per frame. Without this, syncUIForPage's own DOM writes
// would re-enter the observer that scheduled them.
var syncScheduled = false;

function scheduleSync() {
	if (syncScheduled) {
		return;
	}
	syncScheduled = true;
	requestAnimationFrame(() => {
		syncScheduled = false;
		startQuestionChangeObserver();
		// Renderer-agnostic re-hide: the page-wide observer fires on any question
		// re-render, and this catches renderers the #question-app observer misses.
		handleQuestionChange();
		syncUIForPage();
	});
}

// Stays connected for the life of the page: this is a single-page app, so the list
// screen and question screens come and go without a reload.
const pageObserver = new MutationObserver(scheduleSync);
pageObserver.observe(document.body, { childList: true, subtree: true });

// The question id is part of the URL hash, so every question navigation lands
// here - the queue's Next button, the site's own arrows, and Review links alike.
// Re-hiding here rather than waiting to observe a DOM mutation is what makes this
// reliable: the page renders questions into more than one pane, so an observer
// watching the wrong one never fires and the previous reveal leaks through.
window.addEventListener('hashchange', () => {
	resetForNewQuestion();
	scheduleSync();
});

startQuestionChangeObserver();
handleQuestionChange();
syncUIForPage();

// While a review queue is active, the left/right arrows step through the queue
// instead of the site's own all-questions navigation. Capture phase + stop-immediate
// keeps the site's handler from also firing, so one press moves exactly one step.
// Only active when a queue applies to this section, so normal browsing is untouched.
document.addEventListener('keydown', (event) => {
	if (!enabled || event.metaKey || event.ctrlKey || event.altKey) {
		return;
	}
	const target = event.target;
	if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
		return;
	}
	if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
		return;
	}
	if (!queueApplies()) {
		return;
	}
	event.preventDefault();
	event.stopImmediatePropagation();
	if (event.key === 'ArrowRight') {
		advanceQueue();
	} else {
		retreatQueue();
	}
}, true);

// Listen for keypresses
document.addEventListener('keydown', (event) => {
	// Don't hijack keys while the user is writing a note or naming a highlight.
	// This has to come first: otherwise typing a capital M into a note would hit
	// the re-enable chord below.
	const target = event.target;
	if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
		return;
	}

	// Never react to browser/OS chords. Without this, Cmd+R or Ctrl+R to reload
	// runs review mode on the way out and reveals the answer being retested, and
	// Cmd+H silently toggles the panel.
	if (event.metaKey || event.ctrlKey || event.altKey) {
		return;
	}

	// Switched off means the shortcuts are dormant, so nothing is intercepted
	// during a real test - except one deliberate way back in, for when the corner
	// button is covered or off screen. Shift is required so no stray keystroke
	// while reading a passage can trip it.
	if (!enabled) {
		if (event.shiftKey && (event.key === 'M' || event.key === 'm')) {
			setEnabled(true);
		}
		return;
	}

	if (event.key === '.') {
		// If user pressed answer toggle key but was in review mode, they probably want to switch to quiz mode
		toggleAnswers();
	} else if  (event.key === 'q') {
		// Quiz mode
		quizModeSetup();
	} else if (event.key === 'r') {
		// Review mode
		reviewModeSetup();
	} else if (event.key === 'h') {
		// Collapse/expand the panel to get it out of the way
		setCollapsed(!isCollapsed());
	}
});
