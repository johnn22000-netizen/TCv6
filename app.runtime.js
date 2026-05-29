;


/* ---- app.runtime.js ---- */

/* TCv6 single-file bundle (auto-generated) */

/* ---- event-model.js ---- */
const EVENT_TYPES = Object.freeze({
  A: "A",
  B: "B",
  FREE: "FREE",
  FLEX_A: "FLEX_A",
  FLEX_B: "FLEX_B",
  CHECK: "CHECK",
  CHECK_H: "CHECK_H"
});
const PERIODS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9]);
function createEvent(payload) {
  const now = new Date();
  return {
    eventId: `EVT-${now.getTime()}-${Math.floor(Math.random() * 1000)}`,
    status: "ACTIVE",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    className: String(payload.className || "").trim(),
    date: payload.date,
    period: Number(payload.period),
    eventType: payload.eventType,
    fromSubject: String(payload.fromSubject || "").trim(),
    fromTeacher: String(payload.fromTeacher || "").trim(),
    toSubject: String(payload.toSubject || "").trim(),
    toTeacher: String(payload.toTeacher || "").trim(),
    reason: String(payload.reason || "").trim()
  };
}
function validateEventInput(input) {
  if (!input.className) return "班級不可為空";
  if (!input.date) return "日期不可為空";
  if (!PERIODS.includes(Number(input.period))) return "節次不合法";
  if (!input.eventType) return "事件類型不可為空";
  if (!input.reason) return "原因不可為空";
  return "";
}

/* ---- storage.js ---- */
const STORAGE_KEY_BASE = "tcv6_app_state_v1";
const SCHOOL_BINDING_KEY = "tcv6_school_binding_v1";
const DEFAULT_SCHOOL_ID = "default-term";
const DEFAULT_BACKEND_URL = "https://script.google.com/macros/s/AKfycbyrwzj2NCwPTjNwj23xOPNShzIfiXFexsmy_MFlLd4tpeOuHesScqWjd0RVcBZfjVCXDQ/exec";

function buildSchoolStorageKey(schoolId) {
  const normalized = String(schoolId || "").trim() || DEFAULT_SCHOOL_ID;
  return `${STORAGE_KEY_BASE}__${normalized}`;
}

function createDefaultState() {
  return {
    events: [],
    adjustmentDrafts: [],
    adjustmentHistory: [],
    baseScheduleData: null
  };
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeState(rawState) {
  const state = rawState && typeof rawState === "object" ? rawState : {};
  return {
    events: normalizeArray(state.events),
    adjustmentDrafts: normalizeArray(state.adjustmentDrafts),
    adjustmentHistory: normalizeArray(state.adjustmentHistory),
    baseScheduleData: state.baseScheduleData && typeof state.baseScheduleData === "object" ? state.baseScheduleData : null
  };
}

function cloneStateValue(value) {
  if (value == null) return value;
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

class EventStorage {
  static activeStorageKey = buildSchoolStorageKey(DEFAULT_SCHOOL_ID);
  static cache = null;

  static setActiveSchool(schoolId) {
    this.activeStorageKey = buildSchoolStorageKey(schoolId);
    this.cache = null;
  }

  static readStateFromStorage() {
    try {
      const raw = localStorage.getItem(this.activeStorageKey);
      if (!raw) return createDefaultState();
      return normalizeState(JSON.parse(raw));
    } catch (_) {
      return createDefaultState();
    }
  }

  static getCachedState() {
    if (!this.cache) {
      this.cache = this.readStateFromStorage();
    }
    return this.cache;
  }

  static replaceCache(state) {
    this.cache = normalizeState(state);
    return this.cache;
  }

  static loadState() {
    return cloneStateValue(this.getCachedState());
  }

  static saveState(state) {
    const normalizedState = this.replaceCache(state);
    localStorage.setItem(this.activeStorageKey, JSON.stringify(normalizedState));
    requestAutoCloudSync("state-save");
  }

  static loadAll() {
    return cloneStateValue(this.getCachedState().events);
  }

  static saveAll(events) {
    const state = this.getCachedState();
    state.events = normalizeArray(events);
    this.saveState(state);
  }

  static add(eventItem) {
    const all = this.loadAll();
    all.unshift(eventItem);
    this.saveAll(all);
    return all;
  }

  static clear() {
    this.cache = null;
    localStorage.removeItem(this.activeStorageKey);
  }

  static loadAdjustmentDrafts() {
    return cloneStateValue(this.getCachedState().adjustmentDrafts);
  }

  static saveAdjustmentDrafts(adjustmentDrafts) {
    const state = this.getCachedState();
    state.adjustmentDrafts = normalizeArray(adjustmentDrafts);
    this.saveState(state);
  }

  static updateAdjustmentDrafts(adjustmentDrafts) {
    this.saveAdjustmentDrafts(adjustmentDrafts);
  }

  static clearAdjustmentDrafts() {
    const state = this.getCachedState();
    state.adjustmentDrafts = [];
    this.saveState(state);
  }

  static loadAdjustmentHistory() {
    return cloneStateValue(this.getCachedState().adjustmentHistory);
  }

  static saveAdjustmentHistory(adjustmentHistory) {
    const state = this.getCachedState();
    state.adjustmentHistory = normalizeArray(adjustmentHistory);
    this.saveState(state);
  }

  static clearAdjustmentHistory() {
    const state = this.getCachedState();
    state.adjustmentHistory = [];
    this.saveState(state);
  }

  static loadBaseScheduleData() {
    return cloneStateValue(this.getCachedState().baseScheduleData);
  }

  static saveBaseScheduleData(baseScheduleData) {
    const state = this.getCachedState();
    state.baseScheduleData = baseScheduleData && typeof baseScheduleData === "object" ? baseScheduleData : null;
    this.saveState(state);
  }

  static clearBaseScheduleData() {
    const state = this.getCachedState();
    state.baseScheduleData = null;
    this.saveState(state);
  }
}

function createDefaultSchoolBinding() {
  return {
    schoolId: DEFAULT_SCHOOL_ID,
    backendUrl: DEFAULT_BACKEND_URL
  };
}

function normalizeSchoolBinding(rawBinding) {
  const raw = rawBinding && typeof rawBinding === "object" ? rawBinding : {};
  const schoolId = String(raw.schoolId || "").trim() || DEFAULT_SCHOOL_ID;
  const backendUrl = String(raw.backendUrl || "").trim() || DEFAULT_BACKEND_URL;
  return {
    schoolId,
    backendUrl
  };
}

class SchoolBindingStorage {
  static loadBinding() {
    try {
      const raw = localStorage.getItem(SCHOOL_BINDING_KEY);
      if (!raw) return createDefaultSchoolBinding();
      return normalizeSchoolBinding(JSON.parse(raw));
    } catch (_) {
      return createDefaultSchoolBinding();
    }
  }

  static saveBinding(binding) {
    const normalized = normalizeSchoolBinding(binding);
    localStorage.setItem(SCHOOL_BINDING_KEY, JSON.stringify(normalized));
    return normalized;
  }
}

/* ---- schedule-engine.js ---- */
function startOfWeek(anchorDate) {
  // 使用本地時區日期計算，避免 UTC 時區偏移
  const parts = anchorDate.split('-');
  const base = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  const day = (base.getDay() + 6) % 7;
  base.setDate(base.getDate() - day);
  return base;
}
function buildWeekDates(anchorDate) {
  const monday = startOfWeek(anchorDate);
  return Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  });
}

function normalizeTeacher(eventItem) {
  return eventItem.toTeacher || eventItem.fromTeacher || "";
}

function normalizeSubject(eventItem) {
  if (eventItem.eventType === EVENT_TYPES.FREE) return "停課";
  return eventItem.toSubject || eventItem.fromSubject || "未填";
}

function cellKey(dayIndex, period) {
  return `${dayIndex}-${period}`;
}

function createEmptyCells() {
  const cells = {};
  for (let day = 0; day < 7; day += 1) {
    for (const period of PERIODS) {
      cells[cellKey(day, period)] = [];
    }
  }
  return cells;
}

function isMatch(viewMode, target, eventItem) {
  if (!target) return false;
  if (viewMode === "class") {
    return eventItem.className.includes(target);
  }
  const teacher = normalizeTeacher(eventItem);
  return teacher.includes(target);
}

const SLOT_DAY_TO_INDEX = {
  一: 0,
  二: 1,
  三: 2,
  四: 3,
  五: 4
};

function normalizeBaseSubject(subjectRaw) {
  const value = String(subjectRaw || "").trim();
  return value || "無課";
}

function addBaseClassBoard(cells, targetClass, baseScheduleData) {
  const schedules = (baseScheduleData && baseScheduleData.schedules) || {};
  const subjectTeachers = (baseScheduleData && baseScheduleData.subjectTeachers) || {};
  const classSchedule = schedules[targetClass] || {};
  const classTeachers = subjectTeachers[targetClass] || {};

  for (const [slotKey, slotData] of Object.entries(classSchedule)) {
    const dayText = String(slotKey || "").slice(0, 1);
    const dayIndex = SLOT_DAY_TO_INDEX[dayText];
    if (dayIndex === undefined) continue;

    const periodText = String(slotKey || "").slice(1);
    const period = Number(periodText);
    if (!PERIODS.includes(period)) continue;

    const subject = normalizeBaseSubject(slotData && slotData.subject);
    if (subject === "無課") continue;

    cells[cellKey(dayIndex, period)].push({
      eventId: `base-${targetClass}-${slotKey}`,
      eventType: "BASE",
      className: targetClass,
      teacher: classTeachers[subject] || "",
      subject,
      reason: "原始課表"
    });
  }
}

function addBaseTeacherBoard(cells, targetTeacher, baseScheduleData) {
  const schedules = (baseScheduleData && baseScheduleData.schedules) || {};
  const subjectTeachers = (baseScheduleData && baseScheduleData.subjectTeachers) || {};

  for (const [className, classSchedule] of Object.entries(schedules)) {
    const classTeachers = subjectTeachers[className] || {};

    for (const [slotKey, slotData] of Object.entries(classSchedule || {})) {
      const dayText = String(slotKey || "").slice(0, 1);
      const dayIndex = SLOT_DAY_TO_INDEX[dayText];
      if (dayIndex === undefined) continue;

      const periodText = String(slotKey || "").slice(1);
      const period = Number(periodText);
      if (!PERIODS.includes(period)) continue;

      const subject = normalizeBaseSubject(slotData && slotData.subject);
      if (subject === "無課") continue;

      const teacher = String(classTeachers[subject] || "").trim();
      if (!teacher || !teacher.includes(targetTeacher)) continue;

      cells[cellKey(dayIndex, period)].push({
        eventId: `base-${className}-${slotKey}`,
        eventType: "BASE",
        className,
        teacher,
        subject,
        reason: "原始課表"
      });
    }
  }
}

function removeBaseByEventSlot(cells, weekDates, eventItem) {
  const dayIndex = weekDates.findIndex((d) => d === eventItem.date);
  if (dayIndex < 0) return;

  const period = Number(eventItem.period);
  if (!PERIODS.includes(period)) return;

  const key = cellKey(dayIndex, period);
  const list = cells[key] || [];
  cells[key] = list.filter((item) => {
    if (item.eventType !== "BASE") return true;
    return item.className !== eventItem.className;
  });
}
function buildWeeklyBoard({ viewMode, target, anchorDate, events, baseScheduleData = null }) {
  const weekDates = buildWeekDates(anchorDate);
  const cells = createEmptyCells();

  if (target && baseScheduleData) {
    if (viewMode === "class") {
      addBaseClassBoard(cells, target, baseScheduleData);
    } else {
      addBaseTeacherBoard(cells, target, baseScheduleData);
    }
  }

  const allActive = events.filter((e) => e.status !== "DELETED");
  const active = allActive.filter((e) => isMatch(viewMode, target, e));

  // 先套用所有異動，把受影響班級在該節次的原課移除；
  // 否則教師視角會留下「已被調走」的原課。
  for (const eventItem of allActive) {
    removeBaseByEventSlot(cells, weekDates, eventItem);
  }

  for (const eventItem of active) {
    const dayIndex = weekDates.findIndex((d) => d === eventItem.date);
    if (dayIndex < 0) continue;
    const period = Number(eventItem.period);
    if (!PERIODS.includes(period)) continue;

    cells[cellKey(dayIndex, period)].push({
      eventId: eventItem.eventId,
      eventType: eventItem.eventType,
      className: eventItem.className,
      teacher: normalizeTeacher(eventItem),
      subject: normalizeSubject(eventItem),
      reason: eventItem.reason
    });
  }

  return {
    weekDates,
    cells
  };
}
function detectConflicts(candidate, events) {
  const clashes = [];
  const targetTeacher = candidate.toTeacher || candidate.fromTeacher || "";

  for (const eventItem of events) {
    if (eventItem.status === "DELETED") continue;
    if (eventItem.date !== candidate.date) continue;
    if (Number(eventItem.period) !== Number(candidate.period)) continue;

    if (eventItem.className === candidate.className) {
      clashes.push(`班級 ${candidate.className} 在第${candidate.period}節已有事件`);
    }

    const eventTeacher = eventItem.toTeacher || eventItem.fromTeacher || "";
    if (targetTeacher && eventTeacher && eventTeacher === targetTeacher && eventItem.className !== candidate.className) {
      clashes.push(`教師 ${targetTeacher} 在同時段已於 ${eventItem.className} 排課`);
    }
  }

  return clashes;
}

/* ---- render.js ---- */
function renderPeriodOptions(selectEl, periods) {
  selectEl.innerHTML = periods
    .map((period) => `<option value="${period}">第${period}節</option>`)
    .join("");
}

const WEEKDAY = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"];

function chipClass(eventType) {
  if (eventType === "A") return "chip-a";
  if (eventType === "B") return "chip-b";
  if (eventType === "BASE") return "chip-base";
  if (eventType === "FREE") return "chip-free";
  return "chip-flex";
}

function chipHint(eventType) {
  if (eventType === "BASE") return "原課";
  return eventType;
}
function renderEventTable(tbody, events) {
  if (!events.length) {
    tbody.innerHTML = `<tr><td colspan="7">目前無資料</td></tr>`;
    return;
  }

  tbody.innerHTML = events
    .map((e) => {
      const changeText = `${e.fromSubject || "-"}/${e.fromTeacher || "-"} -> ${e.toSubject || "-"}/${e.toTeacher || "-"}`;
      return `
        <tr>
          <td>${new Date(e.createdAt).toLocaleString("zh-TW")}</td>
          <td>${e.className}</td>
          <td>${e.date}</td>
          <td>${e.period}</td>
          <td>${e.eventType}</td>
          <td>${changeText}</td>
          <td>${e.reason}</td>
        </tr>
      `;
    })
    .join("");
}
function renderWeeklyBoard(container, board, onChipClick, options = {}) {
  const focusClassName = options.focusClassName || "";
  const focusSlotKey = options.focusSlotKey || "";
  const prevFocusClassName = options.prevFocusClassName || "";
  const prevFocusSlotKey = options.prevFocusSlotKey || "";
  const softFocusClasses = options.softFocusClasses || [];
  const boardTone = Number.isInteger(options.boardTone) ? options.boardTone : 0;
  const dayHead = board.weekDates
    .map((date, idx) => {
      const md = date.slice(5).replace("-", "/");
      return `<th><div class="day-head"><span class="weekday">${WEEKDAY[idx]}</span><span class="date">${md}</span></div></th>`;
    })
    .join("");

  let body = "";
  for (let period = 1; period <= 9; period += 1) {
    let row = `<tr><td>${period}</td>`;
    for (let day = 0; day < 7; day += 1) {
      const key = `${day}-${period}`;
      const items = board.cells[key] || [];
      const slotDate = board.weekDates[day] || "";
      const chips = items
        .map((item) => {
          const itemSlotKey = `${slotDate}-${period}`;
          const isFocusedClass = focusClassName && item.className === focusClassName;
          const isFocusedSlot = isFocusedClass && focusSlotKey === itemSlotKey;
          const isPrevClass = prevFocusClassName && item.className === prevFocusClassName;
          const isPrevSlot = isPrevClass && prevFocusSlotKey === itemSlotKey;
          const isSoftFocusClass = softFocusClasses.includes(item.className);
          const focusClass = isFocusedSlot ? "chip-focus-deep" : (isFocusedClass || isPrevSlot || isSoftFocusClass) ? "chip-focus-soft" : "";
          return `
          <button class="cell-chip ${chipClass(item.eventType)} ${focusClass}"
            data-class="${item.className}"
            data-teacher="${item.teacher}"
            data-subject="${item.subject}"
            data-date="${slotDate}"
            data-period="${period}">
            <div class="chip-subject">${item.subject}</div>
            <div class="chip-meta">${item.className} / ${item.teacher || "-"}</div>
            <div class="chip-hint">${chipHint(item.eventType)}</div>
          </button>
        `;
        })
        .join("");
      row += `<td><div class="cell-stack">${chips}</div></td>`;
    }
    row += "</tr>";
    body += row;
  }

  container.innerHTML = `
    <table class="week-grid">
      <thead>
        <tr>
          <th>節次</th>
          ${dayHead}
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;

  container.querySelectorAll(".cell-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      onChipClick({
        className: chip.dataset.class,
        teacher: chip.dataset.teacher,
        subject: chip.dataset.subject,
        date: chip.dataset.date,
        period: Number(chip.dataset.period)
      });
    });
  });
}
function renderConflictBanner(container, lines) {
  if (!lines.length) {
    container.classList.add("hidden");
    container.innerHTML = "";
    return;
  }
  container.classList.remove("hidden");
  container.innerHTML = lines.map((line) => `<div>${line}</div>`).join("");
}
function downloadAsJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---- app.js ---- */
const el = {
  form: document.getElementById("event-form"),
  className: document.getElementById("class-name"),
  eventDate: document.getElementById("event-date"),
  period: document.getElementById("period"),
  eventType: document.getElementById("event-type"),
  fromSubject: document.getElementById("from-subject"),
  fromTeacher: document.getElementById("from-teacher"),
  toSubject: document.getElementById("to-subject"),
  toTeacher: document.getElementById("to-teacher"),
  reason: document.getElementById("reason"),
  eventList: document.getElementById("event-list"),
  filterClass: document.getElementById("filter-class"),
  filterDate: document.getElementById("filter-date"),
  filterBtn: document.getElementById("filter-btn"),
  resetBtn: document.getElementById("reset-btn"),
  opsCompactBar: document.getElementById("ops-compact-bar"),
  opsCompactText: document.getElementById("ops-compact-text"),
  editMainTargetBtn: document.getElementById("btn-edit-main-target"),
  viewMode: document.getElementById("view-mode"),
  mainClassWrap: document.getElementById("main-class-wrap"),
  mainTargetTeacherWrap: document.getElementById("main-target-teacher-wrap"),
  mainClassSelect: document.getElementById("main-class-select"),
  mainSubjectSelect: document.getElementById("main-subject-select"),
  mainTeacherSelect: document.getElementById("main-teacher-select"),
  mainTargetDisplay: document.getElementById("main-target-display"),
  anchorDate: document.getElementById("anchor-date"),
  renderBoardsBtn: document.getElementById("btn-render-boards"),
  swapTargetsBtn: document.getElementById("btn-swap-targets"),
  boardsContainer: document.getElementById("boards-container"),
  adjustmentSummary: document.getElementById("adjustment-summary"),
  adjustmentSheetTabs: document.getElementById("adjustment-sheet-tabs"),
  adjustmentSheetView: document.getElementById("adjustment-sheet-view"),
  conflictBanner: document.getElementById("conflict-banner"),
  slotCandidatePanel: document.getElementById("slot-candidate-panel"),
  slotCandidateHeader: document.getElementById("slot-candidate-header"),
  slotCandidateTitle: document.getElementById("slot-candidate-title"),
  slotCandidatePinBtn: document.getElementById("slot-candidate-pin"),
  slotCandidateCloseBtn: document.getElementById("slot-candidate-close"),
  floatingTabMainBtn: document.getElementById("floating-tab-main"),
  floatingTabCandidateBtn: document.getElementById("floating-tab-candidate"),
  floatingTabAdjustmentBtn: document.getElementById("floating-tab-adjustment"),
  floatingTabOutputBtn: document.getElementById("floating-tab-output"),
  floatingTabSettingsBtn: document.getElementById("floating-tab-settings"),
  floatingTabHistoryBtn: document.getElementById("floating-tab-history"),
  floatingPanelMain: document.getElementById("floating-panel-main"),
  floatingPanelCandidate: document.getElementById("floating-panel-candidate"),
  floatingPanelAdjustment: document.getElementById("floating-panel-adjustment"),
  floatingPanelOutput: document.getElementById("floating-panel-output"),
  floatingPanelSettings: document.getElementById("floating-panel-settings"),
  floatingPanelHistory: document.getElementById("floating-panel-history"),
  settingsScheduleFile: document.getElementById("settings-schedule-file"),
  settingsLoadFileBtn: document.getElementById("settings-load-file-btn"),
  settingsSourceStatus: document.getElementById("settings-source-status"),
  settingsSchoolSelect: document.getElementById("settings-school-select"),
  settingsAcademicYear: document.getElementById("settings-academic-year"),
  settingsAcademicTerm: document.getElementById("settings-academic-term"),
  settingsBackendUrl: document.getElementById("settings-backend-url"),
  settingsApplySchoolBtn: document.getElementById("settings-apply-school-btn"),
  settingsPullCloudBtn: document.getElementById("settings-pull-cloud-btn"),
  settingsPushCloudBtn: document.getElementById("settings-push-cloud-btn"),
  settingsSchoolStatus: document.getElementById("settings-school-status"),
  historySearchInput: document.getElementById("history-search-input"),
  historySearchBtn: document.getElementById("history-search-btn"),
  historyResetBtn: document.getElementById("history-reset-btn"),
  historyClearBtn: document.getElementById("history-clear-btn"),
  historyMiniBoard: document.getElementById("history-mini-board"),
  historyList: document.getElementById("history-list"),
  slotSameSubject: document.getElementById("slot-same-subject"),
  slotHomeroom: document.getElementById("slot-homeroom"),
  slotClassFree: document.getElementById("slot-class-free"),
  slotClassBusy: document.getElementById("slot-class-busy"),
  slotCampusFree: document.getElementById("slot-campus-free"),
  slotCampusBusy: document.getElementById("slot-campus-busy"),
  addAdjustmentBtn: document.getElementById("add-adjustment-btn"),
  exportAdjustmentBtn: document.getElementById("export-adjustment-btn"),
  buildAdjustmentWorkbookBtn: document.getElementById("build-adjustment-workbook-btn"),
  adjustmentViewSimpleBtn: document.getElementById("adjustment-view-simple"),
  adjustmentViewDetailBtn: document.getElementById("adjustment-view-detail"),
  adjustmentDraftList: document.getElementById("adjustment-draft-list"),
  adjustmentDraftMiniBoard: document.getElementById("adjustment-draft-mini-board"),
  adjustmentEntityFilterInfo: document.getElementById("adjustment-entity-filter-info"),
  adjustmentEntityIcons: document.getElementById("adjustment-entity-icons"),
  adjustmentConflictSummary: document.getElementById("adjustment-conflict-summary"),
  outputApplicantTeacher: document.getElementById("output-applicant-teacher"),
  outputDateRange: document.getElementById("output-date-range"),
  outputLeaveType: document.getElementById("output-leave-type"),
  outputReasonDoc: document.getElementById("output-reason-doc"),
  outputArrowAssist: document.getElementById("output-arrow-assist"),
  outputConfirmExport: document.getElementById("output-confirm-export"),
  outputExportHint: document.getElementById("output-export-hint"),
  adjustmentStatusWall: document.getElementById("adjustment-status-wall"),
  stakeholderAdminBtn: document.getElementById("stakeholder-admin"),
  stakeholderClassBtn: document.getElementById("stakeholder-class"),
  stakeholderTeacherBtn: document.getElementById("stakeholder-teacher"),
  seedBtn: document.getElementById("seed-btn"),
  exportBtn: document.getElementById("export-btn"),
  clearBtn: document.getElementById("clear-btn")
};

let events = [];
let dbTeacherCatalog = new Map();
let dbClasses = [];
let baseScheduleData = null;
let lastClickedSlot = null;
let boardSequence = [];
let boardSelections = [];
let activeBoardIndex = 0;
let adjustmentDrafts = [];
let adjustmentHistory = [];
let activeAdjustmentSheetIndex = 0;
let adjustmentViewMode = "simple";
let isOpsCompactMode = false;
let slotPanelPinned = true;
let slotPanelDragState = null;
let floatingActiveTab = "settings";
let stakeholderView = "admin";
let draftEntityFilter = { type: "all", value: "" };
let historySearchKeyword = "";
let historyExpandedIds = new Set();
let activeHistoryIndex = 0;
let adjustmentScope = "all";
let adjustmentScopeDraftIndex = 0;
let outputReasonDocAutoValue = "";
let outputDateRangeAutoValue = "";
let exportLibsPromise = null;
let spreadsheetImportLibPromise = null;
let currentScheduleSourceLabel = "尚未設定原始課表";
let currentSchoolBinding = createDefaultSchoolBinding();
let availableSchoolBindings = [];
let autoCloudSyncEnabled = false;
let autoCloudSyncTimer = null;
let autoCloudSyncInFlight = false;
let autoCloudSyncPending = false;
let isApplyingCloudPayload = false;
let featureLockedByMissingBaseSchedule = false;
const forcedSubstituteLinks = new Set();

const STATUS_DEF = {
  adjusted: { code: "ADJ", cls: "status-adj" },
  substituted: { code: "SUB", cls: "status-sub" },
  done: { code: "OK", cls: "status-ok" },
  notified: { code: "NTF", cls: "status-ntf" },
  conflict: { code: "WARN", cls: "status-warn" }
};

const BOARD_TONES = [
  { soft: "#f8c8c8", deep: "#b91c1c" },
  { soft: "#fde2b8", deep: "#d97706" },
  { soft: "#fff3b0", deep: "#ca8a04" },
  { soft: "#d9f0c8", deep: "#15803d" },
  { soft: "#cfe8ff", deep: "#2563eb" },
  { soft: "#ddd6fe", deep: "#7c3aed" }
];

const DRAFT_COLOR_SERIES = [
  { arrow: "#0057d9", text: "#003a8c", subtle: "#1f2937" },
  { arrow: "#c81e1e", text: "#7f1d1d", subtle: "#1f2937" },
  { arrow: "#0f8a2b", text: "#166534", subtle: "#1f2937" },
  { arrow: "#d97706", text: "#9a3412", subtle: "#1f2937" },
  { arrow: "#7c3aed", text: "#5b21b6", subtle: "#1f2937" },
  { arrow: "#0e7490", text: "#155e75", subtle: "#1f2937" },
  { arrow: "#92400e", text: "#78350f", subtle: "#1f2937" },
  { arrow: "#be185d", text: "#9d174d", subtle: "#1f2937" },
  { arrow: "#1f2937", text: "#111827", subtle: "#374151" },
  { arrow: "#4f46e5", text: "#3730a3", subtle: "#1f2937" }
];

const DAY_TEXT = ["日", "一", "二", "三", "四", "五", "六"];

const PERIOD_TIME_MAP = {
  1: "08:20-09:05",
  2: "09:15-10:00",
  3: "10:10-10:55",
  4: "11:05-11:50",
  5: "13:15-14:00",
  6: "14:10-14:55",
  7: "15:05-15:50",
  8: "15:55-16:40",
  9: "16:45-17:30"
};

function getDayTextFromDate(dateString) {
  if (!dateString) return "";
  const d = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(d.getTime()) ? "" : DAY_TEXT[d.getDay()];
}

function getSlotKeyFromDatePeriod(dateString, period) {
  const dayText = getDayTextFromDate(dateString);
  if (!["一", "二", "三", "四", "五"].includes(dayText)) return "";
  return `${dayText}${period}`;
}

function formatDateMD(dateString) {
  if (!dateString) return "";
  const d = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateString;
  const weekday = DAY_TEXT[d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()}(週${weekday})`;
}

function formatPeriodWithTime(period) {
  const p = Number(period || 0);
  if (!p) return "";
  const time = PERIOD_TIME_MAP[p] || "";
  return time ? `${p}\n${time}` : String(p);
}

function getDraftSeries(draftIndex) {
  const idxRaw = Number(draftIndex);
  const idx = Number.isFinite(idxRaw) ? Math.abs(idxRaw) % DRAFT_COLOR_SERIES.length : 0;
  return { ...DRAFT_COLOR_SERIES[idx], index: idx };
}

function formatDateShort(dateString) {
  if (!dateString) return "";
  const d = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateString;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDateShortPadded(dateString) {
  if (!dateString) return "";
  const d = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}`;
}

function formatDateRange(startDate, endDate) {
  const start = formatDateShortPadded(startDate);
  const end = formatDateShortPadded(endDate);
  if (!start && !end) return "";
  if (start && end) return `${start}-${end}`;
  return start || end;
}

function normalizeDateRangeText(input) {
  const raw = String(input || "").trim().replace(/\s+/g, "");
  if (!raw) return "";
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})-(\d{1,2})\/(\d{1,2})$/);
  if (!m) return null;

  const m1 = Number(m[1]);
  const d1 = Number(m[2]);
  const m2 = Number(m[3]);
  const d2 = Number(m[4]);
  if (m1 < 1 || m1 > 12 || m2 < 1 || m2 > 12 || d1 < 1 || d1 > 31 || d2 < 1 || d2 > 31) {
    return null;
  }

  return `${String(m1).padStart(2, "0")}/${String(d1).padStart(2, "0")}-${String(m2).padStart(2, "0")}/${String(d2).padStart(2, "0")}`;
}

function getActiveDraft() {
  if (!adjustmentDrafts.length) return null;
  if (activeAdjustmentSheetIndex >= adjustmentDrafts.length) {
    activeAdjustmentSheetIndex = adjustmentDrafts.length - 1;
  }
  if (activeAdjustmentSheetIndex < 0) {
    activeAdjustmentSheetIndex = 0;
  }
  return adjustmentDrafts[activeAdjustmentSheetIndex] || null;
}

function getDraftDateRange(draft) {
  if (!draft) return { startDate: "", endDate: "", text: "" };
  const chain = Array.isArray(draft.chain) ? draft.chain : [];
  const dates = chain
    .flatMap((item) => [
      item && item.from ? String(item.from.date || "").trim() : "",
      item && item.to ? String(item.to.date || "").trim() : ""
    ])
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "zh-Hant"));
  const startDate = dates.length ? dates[0] : "";
  const endDate = dates.length ? dates[dates.length - 1] : "";
  return {
    startDate,
    endDate,
    text: formatDateRange(startDate, endDate)
  };
}

function buildExportSerial(now = new Date()) {
  const pad = (v) => String(v).padStart(2, "0");
  return `L${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function buildExportMetaFromForm() {
  const draft = getActiveDraft();
  const applicantTeacher = draft ? getDraftApplicantTeacher(draft) : "";
  const autoRange = getDraftDateRange(draft);
  const manualRangeRaw = String(el.outputDateRange && el.outputDateRange.value ? el.outputDateRange.value : "").trim();
  let dateRangeText = "";
  if (manualRangeRaw) {
    const normalized = normalizeDateRangeText(manualRangeRaw);
    if (!normalized) {
      throw new Error("調課區間格式需為 mm/dd-mm/dd，例如 05/15-05/25");
    }
    dateRangeText = normalized;
  } else {
    dateRangeText = autoRange.text;
  }

  if (el.outputDateRange) {
    el.outputDateRange.value = dateRangeText;
    outputDateRangeAutoValue = dateRangeText;
  }

  const leaveType = String(el.outputLeaveType && el.outputLeaveType.value ? el.outputLeaveType.value : "調課").trim() || "調課";
  const reasonDoc = String(el.outputReasonDoc && el.outputReasonDoc.value ? el.outputReasonDoc.value : "").trim();
  const now = new Date();
  return {
    headerTitle: "臺北市私立復興實驗高級中學教師調代課單",
    serial: buildExportSerial(now),
    applicantTeacher,
    dateRangeText,
    leaveType,
    reasonDoc,
    arrowAssist: Boolean(el.outputArrowAssist && el.outputArrowAssist.checked),
    exportDateText: `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`
  };
}

function syncOutputFormDefaults() {
  const draft = getActiveDraft();
  const applicantTeacher = draft ? getDraftApplicantTeacher(draft) : "";
  const range = getDraftDateRange(draft);
  const hasDrafts = adjustmentDrafts.length > 0;

  if (el.outputApplicantTeacher) el.outputApplicantTeacher.value = applicantTeacher;
  if (el.outputDateRange) {
    const current = String(el.outputDateRange.value || "").trim();
    if (!current || current === outputDateRangeAutoValue) {
      el.outputDateRange.value = range.text;
      outputDateRangeAutoValue = range.text;
    }
  }
  if (el.outputLeaveType && !el.outputLeaveType.value) el.outputLeaveType.value = "調課";

  const leaveType = String(el.outputLeaveType && el.outputLeaveType.value ? el.outputLeaveType.value : "調課").trim() || "調課";
  if (el.outputReasonDoc) {
    const current = String(el.outputReasonDoc.value || "").trim();
    if (!current || current === outputReasonDocAutoValue) {
      el.outputReasonDoc.value = leaveType;
      outputReasonDocAutoValue = leaveType;
    }
  }

  if (el.outputConfirmExport) {
    el.outputConfirmExport.disabled = !hasDrafts;
    el.outputConfirmExport.title = hasDrafts ? "" : "請先加入異動清單";
  }
  if (el.outputExportHint) {
    el.outputExportHint.textContent = hasDrafts
      ? "已可輸出調課單包（Excel+JPG）。"
      : "尚未加入異動清單，請先到「時段候選教師」完成「確認課程異動」。";
  }
}

function getAllTeacherNames() {
  const set = new Set();
  const subjectTeachers = (baseScheduleData && baseScheduleData.subjectTeachers) || {};
  for (const map of Object.values(subjectTeachers)) {
    if (!map || typeof map !== "object") continue;
    for (const teacherRaw of Object.values(map)) {
      const teacher = String(teacherRaw || "").trim();
      if (teacher) set.add(teacher);
    }
  }

  for (const eventItem of getAppliedEvents({ includeDraftSimulation: false })) {
    const teacher = String(eventItem.toTeacher || eventItem.fromTeacher || "").trim();
    if (teacher) set.add(teacher);
  }

  return Array.from(set).sort((a, b) => a.localeCompare(b, "zh-Hant"));
}

function simulateAdjustmentsAsEvents() {
  const slotKey = (slot) => {
    if (!slot) return "";
    return [slot.date || "", slot.className || "", String(slot.period || "")].join("|");
  };

  const ensureState = (stateMap, slot) => {
    const key = slotKey(slot);
    if (!key) return null;
    if (!stateMap.has(key)) {
      stateMap.set(key, {
        date: slot.date || "",
        period: slot.period || "",
        className: slot.className || "",
        subject: slot.subject || "",
        teacher: slot.teacher || "",
        originalSubject: slot.subject || "",
        originalTeacher: slot.teacher || ""
      });
    }
    return stateMap.get(key);
  };

  const simulatedEvents = [];
  for (const draft of adjustmentDrafts) {
    const slotStates = new Map();
    for (const item of draft.chain) {
      if (!item.from) continue;

      const fromState = ensureState(slotStates, item.from);
      if (!fromState) continue;

      if (item.type === "調課" && item.to) {
        const toState = ensureState(slotStates, item.to);
        if (!toState) continue;

        const tmpSubject = fromState.subject;
        const tmpTeacher = fromState.teacher;
        fromState.subject = toState.subject;
        fromState.teacher = toState.teacher;
        toState.subject = tmpSubject;
        toState.teacher = tmpTeacher;
      } else {
        const substituteTeacher = String(item.toLabel || item.boardTarget || "").trim();
        if (substituteTeacher) {
          fromState.teacher = substituteTeacher;
        }
      }
    }

    for (const state of slotStates.values()) {
      simulatedEvents.push({
        date: state.date,
        period: state.period,
        className: state.className,
        eventType: "A",
        fromTeacher: state.originalTeacher,
        toTeacher: state.teacher,
        fromSubject: state.originalSubject,
        toSubject: state.subject,
        status: "CONFIRMED"
      });
    }
  }
  return simulatedEvents;
}

function getEventSlotKey(eventItem) {
  return `${String(eventItem && eventItem.date ? eventItem.date : "")}|${String(eventItem && eventItem.className ? eventItem.className : "")}|${String(eventItem && eventItem.period ? eventItem.period : "")}`;
}

function buildHistoryEventsFromDrafts(drafts, { exportedAt, historyId, meta } = {}) {
  const createdAt = exportedAt || new Date().toISOString();
  const reasonText = meta && meta.reasonDoc
    ? String(meta.reasonDoc)
    : `${meta && meta.leaveType ? String(meta.leaveType) : "調課"}（歷史異動）`;

  const historyEvents = [];
  (drafts || []).forEach((draft, draftIndex) => {
    const chain = Array.isArray(draft && draft.chain) ? draft.chain : [];
    const { outcomes } = resolveAdjustmentOutcomes(chain);
    outcomes.forEach((outcome, rowIndex) => {
      const action = String(outcome && outcome.lastAction ? outcome.lastAction : "");
      historyEvents.push({
        eventId: `HIS-${historyId || Date.now()}-${draftIndex}-${rowIndex}`,
        status: "ACTIVE",
        createdAt,
        updatedAt: createdAt,
        className: String(outcome && outcome.className ? outcome.className : ""),
        date: String(outcome && outcome.date ? outcome.date : ""),
        period: Number(outcome && outcome.period ? outcome.period : 0),
        eventType: action === "代" ? "B" : "A",
        fromSubject: String(outcome && outcome.originalSubject ? outcome.originalSubject : ""),
        fromTeacher: String(outcome && outcome.originalTeacher ? outcome.originalTeacher : ""),
        toSubject: String(outcome && outcome.subject ? outcome.subject : ""),
        toTeacher: String(outcome && outcome.teacher ? outcome.teacher : ""),
        reason: reasonText,
        source: "ADJUSTMENT_HISTORY",
        historyId: String(historyId || ""),
        historyAction: action
      });
    });
  });
  return historyEvents.filter((item) => item.className && item.date && Number(item.period));
}

function buildHistoryEventsFromRecords(records) {
  const slotMap = new Map();
  (records || []).forEach((record) => {
    const drafts = Array.isArray(record && record.drafts) ? record.drafts : [];
    const meta = record && record.meta ? record.meta : {};
    const eventsFromRecord = buildHistoryEventsFromDrafts(drafts, {
      exportedAt: record && record.exportedAt ? record.exportedAt : new Date().toISOString(),
      historyId: record && record.historyId ? record.historyId : `legacy-${Date.now()}`,
      meta
    });
    eventsFromRecord.forEach((eventItem) => {
      slotMap.set(getEventSlotKey(eventItem), eventItem);
    });
  });
  return Array.from(slotMap.values());
}

function getAppliedEvents({ includeDraftSimulation = false } = {}) {
  const nonHistoryEvents = (events || []).filter((eventItem) => String(eventItem && eventItem.source ? eventItem.source : "") !== "ADJUSTMENT_HISTORY");
  const nonHistorySlotSet = new Set(
    nonHistoryEvents
      .filter((eventItem) => String(eventItem && eventItem.status ? eventItem.status : "") !== "DELETED")
      .map((eventItem) => getEventSlotKey(eventItem))
  );

  const historyEvents = buildHistoryEventsFromRecords(adjustmentHistory).filter((eventItem) => !nonHistorySlotSet.has(getEventSlotKey(eventItem)));
  const merged = [...historyEvents, ...nonHistoryEvents];

  if (!includeDraftSimulation) return merged;
  const draftEvents = simulateAdjustmentsAsEvents();
  return [...merged, ...draftEvents];
}

function commitCurrentDraftsToHistory(meta) {
  if (!adjustmentDrafts.length) return { archived: 0 };

  const now = new Date();
  const exportedAt = now.toISOString();
  const historyId = `HIST-${now.getTime()}-${Math.floor(Math.random() * 1000)}`;
  const snapshotDrafts = JSON.parse(JSON.stringify(adjustmentDrafts));
  const historyMeta = {
    headerTitle: meta && meta.headerTitle ? String(meta.headerTitle) : "",
    serial: meta && meta.serial ? String(meta.serial) : "",
    applicantTeacher: meta && meta.applicantTeacher ? String(meta.applicantTeacher) : "",
    dateRangeText: meta && meta.dateRangeText ? String(meta.dateRangeText) : "",
    leaveType: meta && meta.leaveType ? String(meta.leaveType) : "",
    reasonDoc: meta && meta.reasonDoc ? String(meta.reasonDoc) : ""
  };

  adjustmentHistory.unshift({
    historyId,
    exportedAt,
    exportedAtText: now.toLocaleString("zh-TW"),
    meta: historyMeta,
    drafts: snapshotDrafts
  });
  EventStorage.saveAdjustmentHistory(adjustmentHistory);

  events = getAppliedEvents({ includeDraftSimulation: false });
  EventStorage.saveAll(events);

  adjustmentDrafts = [];
  activeAdjustmentSheetIndex = 0;
  syncAdjustmentDraftState();

  return {
    archived: snapshotDrafts.length,
    historyId
  };
}

function buildAdjustmentBundleTemplate() {
  const ts = new Date();
  const pad = (v) => String(v).padStart(2, "0");
  const tag = `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}`;

  return {
    version: "TCv6-adjustment-bundle-v1",
    generatedAt: ts.toISOString(),
    namingRule: "TCv6_調課單包_YYYYMMDD_HHMMSS.json",
    recommendedExcelName: `TCv6_調課單包_${tag}.xlsx`,
    drafts: adjustmentDrafts
  };
}

function getTeacherAssignmentsAtSlot(dateString, period, includeSimulated = true) {
  const slotKey = getSlotKeyFromDatePeriod(dateString, period);
  const teacherMap = new Map();
  if (!slotKey) return teacherMap;

  const schedules = (baseScheduleData && baseScheduleData.schedules) || {};
  const subjectTeachers = (baseScheduleData && baseScheduleData.subjectTeachers) || {};

  for (const [className, schedule] of Object.entries(schedules)) {
    const slot = (schedule && schedule[slotKey]) || null;
    const subject = String(slot && slot.subject ? slot.subject : "").trim();
    if (!subject || subject === "無課") continue;
    const teacher = String((subjectTeachers[className] && subjectTeachers[className][subject]) || "").trim();
    if (!teacher) continue;

    if (!teacherMap.has(teacher)) teacherMap.set(teacher, []);
    teacherMap.get(teacher).push({ className, subject });
  }

  const allEventsToProcess = getAppliedEvents({ includeDraftSimulation: includeSimulated })
    .filter((e) => e.status !== "DELETED" && e.date === dateString && Number(e.period) === Number(period));
  const slotEvents = allEventsToProcess;
  for (const eventItem of slotEvents) {
    // 事件覆蓋同班同節的原始課表
    for (const [teacher, classList] of teacherMap.entries()) {
      teacherMap.set(teacher, classList.filter((item) => item.className !== eventItem.className));
    }
    for (const [teacher, classList] of teacherMap.entries()) {
      if (!classList.length) teacherMap.delete(teacher);
    }

    if (eventItem.eventType === "FREE") continue;

    const teacher = String(eventItem.toTeacher || eventItem.fromTeacher || "").trim();
    if (!teacher) continue;
    if (!teacherMap.has(teacher)) teacherMap.set(teacher, []);
    teacherMap.get(teacher).push({
      className: eventItem.className,
      subject: String(eventItem.toSubject || eventItem.fromSubject || "").trim()
    });
  }

  return teacherMap;
}

function getClassTeacherList(className) {
  const map = (baseScheduleData && baseScheduleData.subjectTeachers && baseScheduleData.subjectTeachers[className]) || {};
  const set = new Set();
  for (const teacherRaw of Object.values(map)) {
    const teacher = String(teacherRaw || "").trim();
    if (teacher) set.add(teacher);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "zh-Hant"));
}

function getHomeroomTeacher(className) {
  const map = (baseScheduleData && baseScheduleData.subjectTeachers && baseScheduleData.subjectTeachers[className]) || {};
  const keys = ["班週會", "班、週會", "導師時間及放學"];
  for (const key of keys) {
    const teacher = String(map[key] || "").trim();
    if (teacher) return teacher;
  }
  return "";
}

function pickSubjectForTeacher(teacher) {
  for (const [subject, teacherSet] of dbTeacherCatalog.entries()) {
    if (teacherSet.has(teacher)) return subject;
  }
  return "";
}

function renderTeacherItems(container, items, { clickable = true } = {}) {
  if (!container) return;
  if (!items.length) {
    container.innerHTML = '<div class="slot-empty">無資料</div>';
    return;
  }

  container.innerHTML = items
    .map((item) => {
      const label = item.label || item.teacher;
      const meta = item.meta ? `<span class="meta">${item.meta}</span>` : "";
      if (!clickable || !item.teacher) {
        return `<div class="slot-teacher-item">${label}${meta}</div>`;
      }
      return `<button class="slot-teacher-item" data-teacher="${item.teacher}">${label}${meta}</button>`;
    })
    .join("");

  container.querySelectorAll("button[data-teacher]").forEach((button) => {
    button.addEventListener("click", () => {
      const teacher = button.dataset.teacher;
      if (!teacher) return;

      appendTeacherBoard(teacher);
    });
  });
}

function setFloatingTab(tabName) {
  if (featureLockedByMissingBaseSchedule && tabName !== "settings") {
    floatingActiveTab = "settings";
    tabName = "settings";
  }

  floatingActiveTab = tabName;
  const tabs = [
    { btn: el.floatingTabMainBtn, panel: el.floatingPanelMain, name: "main" },
    { btn: el.floatingTabCandidateBtn, panel: el.floatingPanelCandidate, name: "candidate" },
    { btn: el.floatingTabAdjustmentBtn, panel: el.floatingPanelAdjustment, name: "adjustment" },
    { btn: el.floatingTabOutputBtn, panel: el.floatingPanelOutput, name: "output" },
    { btn: el.floatingTabSettingsBtn, panel: el.floatingPanelSettings, name: "settings" },
    { btn: el.floatingTabHistoryBtn, panel: el.floatingPanelHistory, name: "history" }
  ];

  tabs.forEach(({ btn, panel, name }) => {
    if (btn) btn.classList.toggle("active", tabName === name);
    if (panel) panel.classList.toggle("active", tabName === name);
  });

  if (tabName === "history") {
    renderHistoryList();
  }

  if (tabName === "settings") {
    renderScheduleSourceStatus();
  }
}

function setElementDisabled(element, disabled) {
  if (!element) return;
  if (disabled) {
    element.setAttribute("disabled", "disabled");
  } else {
    element.removeAttribute("disabled");
  }
}

function renderFeatureLockState() {
  const disabled = featureLockedByMissingBaseSchedule;
  const tabButtons = [
    el.floatingTabMainBtn,
    el.floatingTabCandidateBtn,
    el.floatingTabAdjustmentBtn,
    el.floatingTabOutputBtn,
    el.floatingTabHistoryBtn
  ];
  tabButtons.forEach((button) => {
    setElementDisabled(button, disabled);
    if (!button) return;
    button.classList.toggle("is-disabled", disabled);
    if (disabled) {
      button.title = "目前學期資料夾尚未設定原始課表，請先到設定上傳課表。";
    } else {
      button.removeAttribute("title");
    }
  });

  if (disabled && floatingActiveTab !== "settings") {
    setFloatingTab("settings");
  }
}

function syncFeatureLockFromBaseSchedule() {
  featureLockedByMissingBaseSchedule = !hasBaseScheduleData();
  renderFeatureLockState();
}

async function loadSpreadsheetImportLibrary() {
  if (!spreadsheetImportLibPromise) {
    spreadsheetImportLibPromise = (async () => {
      if (window && window.XLSX) {
        return window.XLSX;
      }
      throw new Error("XLSX 本地套件未載入，請確認 app.runtime.js 已完整載入");
    })();
  }
  return spreadsheetImportLibPromise;
}

function buildScheduleJsonFromWorksheetRows(rows) {
  if (!Array.isArray(rows) || rows.length < 2) {
    throw new Error("課表資料列不足，無法轉換");
  }

  const schedules = {};
  const subjectTeachers = {};
  const days = ["一", "二", "三", "四", "五"];
  const periods = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = Array.isArray(rows[rowIndex]) ? rows[rowIndex] : [];
    const year = row[0];
    const className = row[1];
    if (!year || !className) continue;

    const fullClassName = `${String(year).trim()}${String(className).trim()}`;
    const classSchedule = {};
    for (let dayIdx = 0; dayIdx < 5; dayIdx += 1) {
      for (let periodIdx = 0; periodIdx < 9; periodIdx += 1) {
        const colIdx = 2 + dayIdx * 9 + periodIdx;
        const rawSubject = colIdx < row.length ? row[colIdx] : "無課";
        const subject = rawSubject == null || String(rawSubject).trim() === "" ? "無課" : String(rawSubject).trim();
        const slotKey = `${days[dayIdx]}${periods[periodIdx]}`;
        classSchedule[slotKey] = {
          subject,
          day: days[dayIdx],
          period: periods[periodIdx]
        };
      }
    }

    const classMapping = {};
    for (let colIdx = 48; colIdx < Math.min(row.length, 90); colIdx += 2) {
      const subject = row[colIdx];
      const teacher = row[colIdx + 1];
      if (subject && subject !== 0 && teacher && teacher !== 0) {
        classMapping[String(subject).trim()] = String(teacher).trim();
      }
    }

    schedules[fullClassName] = classSchedule;
    subjectTeachers[fullClassName] = classMapping;
  }

  return {
    version: "1.0",
    lastUpdated: new Date().toISOString(),
    totalClasses: Object.keys(schedules).length,
    schedules,
    subjectTeachers
  };
}

async function parseScheduleWorkbookArrayBuffer(arrayBuffer) {
  const XLSX = await loadSpreadsheetImportLibrary();
  const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("找不到工作表");
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false });
  return buildScheduleJsonFromWorksheetRows(rows);
}

function renderScheduleSourceStatus() {
  if (!el.settingsSourceStatus) return;
  const totalClasses = baseScheduleData && baseScheduleData.schedules ? Object.keys(baseScheduleData.schedules).length : 0;
  el.settingsSourceStatus.textContent = `目前使用：${currentScheduleSourceLabel}${totalClasses ? `｜共 ${totalClasses} 班` : ""}`;
}

function formatAcademicTermLabel(termId) {
  const raw = String(termId || "").trim();
  if (!raw) return "未命名資料夾";
  const match = raw.match(/^(\d{2,3})(暑|寒|1|2)$/);
  if (!match) return raw;

  const year = match[1];
  const suffix = match[2];
  const suffixMap = {
    "暑": "暑假",
    "1": "第一學期",
    "寒": "寒假",
    "2": "第二學期"
  };
  return `${year}學年度${suffixMap[suffix] || raw}`;
}

function parseAcademicTermId(termId) {
  const raw = String(termId || "").trim();
  const match = raw.match(/^(\d{2,3})(暑|寒|1|2)$/);
  if (!match) return null;
  return {
    year: match[1],
    term: match[2]
  };
}

function buildAcademicTermId(year, term) {
  const y = String(year || "").trim();
  const t = String(term || "").trim();
  if (!y || !t) return "";
  return `${y}${t}`;
}

function getAcademicTermSortScore(termId) {
  const parsed = parseAcademicTermId(termId);
  if (!parsed) return Number.NEGATIVE_INFINITY;
  const yearNum = Number(parsed.year);
  if (!Number.isFinite(yearNum)) return Number.NEGATIVE_INFINITY;
  const termWeightMap = {
    "1": 1,
    "寒": 2,
    "2": 3,
    "暑": 4
  };
  const termWeight = termWeightMap[parsed.term] || 0;
  return yearNum * 10 + termWeight;
}

function sortSchoolBindingsByNewest(bindings) {
  return (Array.isArray(bindings) ? bindings.slice() : []).sort((a, b) => {
    const scoreB = getAcademicTermSortScore(b && b.schoolId ? b.schoolId : "");
    const scoreA = getAcademicTermSortScore(a && a.schoolId ? a.schoolId : "");
    if (scoreB !== scoreA) return scoreB - scoreA;
    const idA = String(a && a.schoolId ? a.schoolId : "");
    const idB = String(b && b.schoolId ? b.schoolId : "");
    return idB.localeCompare(idA, "zh-Hant");
  });
}

function populateAcademicYearOptions() {
  if (!el.settingsAcademicYear) return;
  const currentRocYear = String(new Date().getFullYear() - 1911);
  if (!String(el.settingsAcademicYear.value || "").trim()) {
    el.settingsAcademicYear.value = currentRocYear;
  }
}

function syncAcademicTermControls(termId) {
  const parsed = parseAcademicTermId(termId);
  if (!parsed) return;
  if (el.settingsAcademicYear) {
    el.settingsAcademicYear.value = parsed.year;
  }
  if (el.settingsAcademicTerm) {
    el.settingsAcademicTerm.value = parsed.term;
  }
}

function ensureBindingOptionExists(schoolId) {
  const normalized = String(schoolId || "").trim();
  if (!normalized) return;
  const exists = availableSchoolBindings.some((item) => item.schoolId === normalized);
  if (!exists) {
    availableSchoolBindings.push({ schoolId: normalized, name: formatAcademicTermLabel(normalized) });
    setAvailableSchoolBindings(availableSchoolBindings);
  }
}

function getSchoolLabel(schoolId) {
  const found = availableSchoolBindings.find((item) => item.schoolId === schoolId);
  if (found && found.name) return found.name;
  return formatAcademicTermLabel(schoolId);
}

function normalizeBindingOption(item) {
  if (typeof item === "string") {
    const schoolId = String(item || "").trim();
    return schoolId
      ? { schoolId, name: formatAcademicTermLabel(schoolId) }
      : null;
  }

  if (!item || typeof item !== "object") return null;
  const schoolId = String(item.schoolId || item.termId || item.folderName || item.name || "").trim();
  if (!schoolId) return null;
  const name = String(item.name || item.label || formatAcademicTermLabel(schoolId)).trim() || formatAcademicTermLabel(schoolId);
  return { schoolId, name };
}

function setAvailableSchoolBindings(bindings) {
  availableSchoolBindings = sortSchoolBindingsByNewest(Array.isArray(bindings)
    ? bindings.map(normalizeBindingOption).filter(Boolean)
    : []);

  if (!el.settingsSchoolSelect) return;

  if (!availableSchoolBindings.length) {
    el.settingsSchoolSelect.innerHTML = '<option value="">目前抓不到學期資料夾</option>';
    return;
  }

  el.settingsSchoolSelect.innerHTML = availableSchoolBindings
    .map((item) => `<option value="${item.schoolId}">${item.name}</option>`)
    .join("");
}

async function fetchAvailableSchoolBindings() {
  const backendUrl = String((currentSchoolBinding && currentSchoolBinding.backendUrl) || DEFAULT_BACKEND_URL || "").trim();
  if (!backendUrl) return [];

  const actions = ["listTerms", "listFolders", "listSchools"];
  for (const action of actions) {
    try {
      const requestUrl = new URL(backendUrl);
      requestUrl.searchParams.set("action", action);
      const response = await fetch(requestUrl, {
        method: "GET",
        credentials: "omit"
      });
      if (!response.ok) continue;

      const payload = await response.json();
      if (payload && payload.ok === false) continue;
      const data = payload && Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
      const bindings = data.map(normalizeBindingOption).filter(Boolean);
      if (bindings.length) return bindings;
    } catch (_) {
      // try next action
    }
  }

  return [];
}

async function hydrateSchoolBindings() {
  const bindings = await fetchAvailableSchoolBindings();
  setAvailableSchoolBindings(bindings);

  if (!availableSchoolBindings.length) {
    return;
  }

  // 預設使用最新學期資料夾。
  const newestBinding = availableSchoolBindings[0];
  currentSchoolBinding = normalizeSchoolBinding({
    schoolId: newestBinding.schoolId,
    backendUrl: currentSchoolBinding.backendUrl
  });
  currentSchoolBinding = SchoolBindingStorage.saveBinding(currentSchoolBinding);
}

async function refreshTermFoldersFromCloud() {
  await hydrateSchoolBindings();
  EventStorage.setActiveSchool(currentSchoolBinding.schoolId);
  syncSchoolBindingControls();
  renderSchoolBindingStatus();
}

function syncSchoolBindingControls() {
  if (el.settingsSchoolSelect) {
    const hasOption = Array.from(el.settingsSchoolSelect.options).some((option) => option.value === currentSchoolBinding.schoolId);
    if (!hasOption && currentSchoolBinding.schoolId) {
      const label = getSchoolLabel(currentSchoolBinding.schoolId);
      el.settingsSchoolSelect.insertAdjacentHTML("beforeend", `<option value="${currentSchoolBinding.schoolId}">${label}</option>`);
    }
    el.settingsSchoolSelect.value = currentSchoolBinding.schoolId;
  }
  if (el.settingsBackendUrl) {
    el.settingsBackendUrl.value = currentSchoolBinding.backendUrl || "";
  }
  syncAcademicTermControls(currentSchoolBinding.schoolId);
}

function renderSchoolBindingStatus(appendText = "") {
  if (!el.settingsSchoolStatus) return;
  const schoolLabel = getSchoolLabel(currentSchoolBinding.schoolId);
  const backendState = currentSchoolBinding.backendUrl ? "已設定雲端 API" : "未設定雲端 API";
  const suffix = appendText ? `｜${appendText}` : "";
  el.settingsSchoolStatus.textContent = `目前綁定：${schoolLabel}（${currentSchoolBinding.schoolId}）｜${backendState}${suffix}`;
}

function readSchoolBindingFromForm() {
  const selectedSchoolId = el.settingsSchoolSelect ? String(el.settingsSchoolSelect.value || "").trim() : "";
  return normalizeSchoolBinding({
    schoolId: selectedSchoolId || currentSchoolBinding.schoolId,
    backendUrl: el.settingsBackendUrl ? el.settingsBackendUrl.value : currentSchoolBinding.backendUrl
  });
}

function readNewTermIdFromForm({ required = false } = {}) {
  const selectedYear = el.settingsAcademicYear ? String(el.settingsAcademicYear.value || "").trim() : "";
  const selectedTerm = el.settingsAcademicTerm ? String(el.settingsAcademicTerm.value || "").trim() : "";
  const composedSchoolId = buildAcademicTermId(selectedYear, selectedTerm);
  if (!required) return composedSchoolId;

  if (!selectedYear || !selectedTerm || !composedSchoolId) {
    throw new Error("上傳新課表前，請先填寫學年與學期。");
  }
  if (!parseAcademicTermId(composedSchoolId)) {
    throw new Error("學年/學期格式不正確，學年請填數字，例如 114。\n學期請選 暑假/第一學期/寒假/第二學期。");
  }
  return composedSchoolId;
}

function requestAutoCloudSync(reason = "") {
  if (!autoCloudSyncEnabled) return;
  if (!currentSchoolBinding || !String(currentSchoolBinding.backendUrl || "").trim()) return;
  if (isApplyingCloudPayload) return;

  if (autoCloudSyncTimer) {
    clearTimeout(autoCloudSyncTimer);
  }

  autoCloudSyncTimer = setTimeout(async () => {
    autoCloudSyncTimer = null;
    if (autoCloudSyncInFlight) {
      autoCloudSyncPending = true;
      return;
    }

    autoCloudSyncInFlight = true;
    try {
      renderSchoolBindingStatus("自動上傳中");
      await pushSchoolDataToCloud();
      renderSchoolBindingStatus("自動上傳完成");
    } catch (err) {
      console.error(`Auto cloud sync failed (${reason}):`, err);
      renderSchoolBindingStatus("自動上傳失敗");
    } finally {
      autoCloudSyncInFlight = false;
      if (autoCloudSyncPending) {
        autoCloudSyncPending = false;
        requestAutoCloudSync("pending");
      }
    }
  }, 900);
}

async function autoSyncFromCloudOnStartup() {
  if (!currentSchoolBinding || !String(currentSchoolBinding.backendUrl || "").trim()) {
    renderSchoolBindingStatus("未設定雲端 API");
    return;
  }

  try {
    renderSchoolBindingStatus("啟動同步中");
    await pullSchoolDataFromCloud();
    renderSchoolBindingStatus("啟動同步完成");
  } catch (err) {
    console.error("Startup cloud sync failed:", err);
    renderSchoolBindingStatus("啟動同步失敗");
    alert(`啟動時雲端同步失敗，先使用本機資料。\n${err && err.message ? err.message : "未知錯誤"}`);
  }
}

function hasBaseScheduleData() {
  return Boolean(
    baseScheduleData &&
    baseScheduleData.schedules &&
    Object.keys(baseScheduleData.schedules).length
  );
}

function ensureUf2PanelVisible() {
  if (!el.slotCandidatePanel) return;
  el.slotCandidatePanel.classList.remove("hidden");
  if (slotPanelPinned) {
    resetSlotPanelPosition();
  }
}

function promptInitialScheduleUploadIfNeeded() {
  if (hasBaseScheduleData()) return;
  if (!el.settingsScheduleFile) return;

  alert(`學期資料夾 ${getSchoolLabel(currentSchoolBinding.schoolId)} 目前沒有原始課表，請先上傳課表後才能使用。`);
  ensureUf2PanelVisible();
  setFloatingTab("settings");
  el.settingsScheduleFile.click();
}

async function loadStateFromActiveSchoolStorage() {
  const storedBaseScheduleData = EventStorage.loadBaseScheduleData();
  if (storedBaseScheduleData && storedBaseScheduleData.schedules) {
    applyBaseScheduleData(storedBaseScheduleData, {
      persist: false,
      sourceLabel: "自訂上傳課表"
    });
  } else {
    baseScheduleData = null;
    dbTeacherCatalog = new Map();
    dbClasses = [];
    currentScheduleSourceLabel = "尚未設定原始課表";
    refreshMainTargetControls({ includeSourceStatus: true });
    syncFeatureLockFromBaseSchedule();
  }

  events = EventStorage.loadAll();
  adjustmentHistory = EventStorage.loadAdjustmentHistory();
  adjustmentDrafts = EventStorage.loadAdjustmentDrafts().map((draft, index) => normalizeAdjustmentDraft(draft, index));

  const hasHistoryEvents = events.some((eventItem) => String(eventItem && eventItem.source ? eventItem.source : "") === "ADJUSTMENT_HISTORY");
  if (!hasHistoryEvents && adjustmentHistory.length) {
    const rebuiltHistoryEvents = buildHistoryEventsFromRecords(adjustmentHistory);
    events = [...rebuiltHistoryEvents, ...events];
    EventStorage.saveAll(events);
  }

  historySearchKeyword = "";
  historyExpandedIds = new Set();
  activeHistoryIndex = 0;
  if (el.historySearchInput) {
    el.historySearchInput.value = "";
  }

  refreshMainTargetControls();
  refreshTable();
  renderAdjustmentDraftList();
  renderAdjustmentSheetTabs();
  renderHistoryList();
  renderScheduleSourceStatus();
  updateSlotCandidatePanel(lastClickedSlot);
  renderConflictBanner(el.conflictBanner, []);
  renderAdjustmentStatusWall();
  syncOutputFormDefaults();
  syncFeatureLockFromBaseSchedule();
}

function buildBackendUrl(baseUrl, action, schoolId) {
  const normalized = String(baseUrl || "").trim();
  if (!normalized) throw new Error("請先設定 Apps Script Web App URL");
  const url = new URL(normalized);
  url.searchParams.set("action", action);
  url.searchParams.set("schoolId", schoolId);
  return url;
}

async function pullSchoolDataFromCloud() {
  const backendUrl = String(currentSchoolBinding.backendUrl || "").trim();
  if (!backendUrl) {
    throw new Error("尚未設定 Apps Script Web App URL");
  }

  const requestUrl = buildBackendUrl(backendUrl, "loadAll", currentSchoolBinding.schoolId);
  const response = await fetch(requestUrl, {
    method: "GET",
    credentials: "omit"
  });
  if (!response.ok) {
    throw new Error(`雲端同步失敗（HTTP ${response.status}）`);
  }

  const payload = await response.json();
  if (payload && payload.ok === false) {
    throw new Error(String(payload.message || "雲端回傳失敗"));
  }

  const responseData = payload && payload.data ? payload.data : payload;
  const nestedData = responseData && responseData.data ? responseData.data : null;
  const data = nestedData && (
    Array.isArray(nestedData.events) ||
    Array.isArray(nestedData.adjustmentDrafts) ||
    Array.isArray(nestedData.adjustmentHistory) ||
    Object.prototype.hasOwnProperty.call(nestedData, "baseScheduleData")
  )
    ? nestedData
    : responseData;
  if (!data || typeof data !== "object") {
    throw new Error("雲端資料格式不正確");
  }

  isApplyingCloudPayload = true;
  try {
    EventStorage.saveAll(Array.isArray(data.events) ? data.events : []);
    EventStorage.saveAdjustmentDrafts(Array.isArray(data.adjustmentDrafts) ? data.adjustmentDrafts : []);
    EventStorage.saveAdjustmentHistory(Array.isArray(data.adjustmentHistory) ? data.adjustmentHistory : []);
    EventStorage.saveBaseScheduleData(data.baseScheduleData && typeof data.baseScheduleData === "object" ? data.baseScheduleData : null);
  } finally {
    isApplyingCloudPayload = false;
  }
  await loadStateFromActiveSchoolStorage();
}

async function pushSchoolDataToCloud() {
  const backendUrl = String(currentSchoolBinding.backendUrl || "").trim();
  if (!backendUrl) {
    throw new Error("尚未設定 Apps Script Web App URL");
  }

  const requestUrl = buildBackendUrl(backendUrl, "saveAll", currentSchoolBinding.schoolId);
  const body = {
    schoolId: currentSchoolBinding.schoolId,
    data: {
      events,
      adjustmentDrafts,
      adjustmentHistory,
      baseScheduleData
    }
  };

  let response;
  try {
    response = await fetch(requestUrl, {
      method: "POST",
      // Keep request "simple" to avoid browser preflight OPTIONS for GAS endpoints.
      body: JSON.stringify(body),
      credentials: "omit"
    });
  } catch (err) {
    const message = err && err.message ? err.message : "Failed to fetch";
    throw new Error(
      `雲端推送失敗（網路/CORS）：${message}。\n` +
      "請確認 Apps Script Web App 已部署為可供外部存取，且回應包含 Access-Control-Allow-Origin。"
    );
  }
  if (!response.ok) {
    throw new Error(`雲端推送失敗（HTTP ${response.status}）`);
  }

  const payload = await response.json().catch(() => ({}));
  if (payload && payload.ok === false) {
    throw new Error(String(payload.message || "雲端回傳失敗"));
  }
}

async function tryEnsureFolderByAction(action, schoolId) {
  const backendUrl = String(currentSchoolBinding.backendUrl || "").trim();
  if (!backendUrl) return false;

  const requestUrl = buildBackendUrl(backendUrl, action, schoolId);

  // 優先 POST，若舊版 API 不支援再退回 GET。
  const postResponse = await fetch(requestUrl, {
    method: "POST",
    // Keep request "simple" to avoid browser preflight OPTIONS for GAS endpoints.
    body: JSON.stringify({ schoolId }),
    credentials: "omit"
  });
  if (postResponse.ok) {
    const payload = await postResponse.json().catch(() => ({}));
    if (!payload || payload.ok !== false) return true;
  }

  const getResponse = await fetch(requestUrl, {
    method: "GET",
    credentials: "omit"
  });
  if (!getResponse.ok) return false;
  const payload = await getResponse.json().catch(() => ({}));
  return !payload || payload.ok !== false;
}

async function ensureSchoolFolderExistsInCloud(schoolId) {
  const actions = ["ensureTerm", "ensureFolder", "ensureSchool", "createTerm", "createFolder"];
  for (const action of actions) {
    try {
      const ensured = await tryEnsureFolderByAction(action, schoolId);
      if (ensured) return true;
    } catch (_) {
      // ignore and try next compatibility action
    }
  }
  return false;
}

async function applySchoolBinding(binding, { saveBinding = true, reloadState = true } = {}) {
  currentSchoolBinding = normalizeSchoolBinding(binding);
  ensureBindingOptionExists(currentSchoolBinding.schoolId);
  if (saveBinding) {
    currentSchoolBinding = SchoolBindingStorage.saveBinding(currentSchoolBinding);
  }
  EventStorage.setActiveSchool(currentSchoolBinding.schoolId);
  syncSchoolBindingControls();
  renderSchoolBindingStatus();
  if (reloadState) {
    await loadStateFromActiveSchoolStorage();
    if (!hasBaseScheduleData()) {
      promptInitialScheduleUploadIfNeeded();
    }
  }
}

function refreshMainTargetControls({ includeSourceStatus = false } = {}) {
  populateMainTeacherSelectors();
  populateMainClassSelector();
  syncMainTargetVisibility();
  if (includeSourceStatus) {
    renderScheduleSourceStatus();
  }
}

function applyBaseScheduleData(data, { persist = false, sourceLabel = "自訂原始課表" } = {}) {
  if (!data || !data.schedules || !data.subjectTeachers) {
    throw new Error("課表 JSON 結構不完整");
  }

  baseScheduleData = data;
  dbTeacherCatalog = extractCatalogFromSchedule(data);
  dbClasses = extractClassesFromSchedule(data);
  currentScheduleSourceLabel = sourceLabel;

  if (persist) {
    EventStorage.saveBaseScheduleData(data);
  }

  refreshMainTargetControls({ includeSourceStatus: true });
  if (boardSequence.length && getMainTargetValue()) {
    renderBoards();
  }
  syncFeatureLockFromBaseSchedule();
}

function getHistoryRecordId(record, index) {
  const raw = String(record && record.historyId ? record.historyId : "").trim();
  if (raw) return raw;
  const exportedAt = String(record && record.exportedAt ? record.exportedAt : "").trim();
  return `history-${index}-${exportedAt || "na"}`;
}

function getHistoryOutcomeLines(record) {
  const lines = [];
  const drafts = Array.isArray(record && record.drafts) ? record.drafts : [];
  drafts.forEach((draft) => {
    const chain = Array.isArray(draft && draft.chain) ? draft.chain : [];
    const { outcomes } = resolveAdjustmentOutcomes(chain);
    outcomes.forEach((outcome) => {
      lines.push(formatResolvedOutcomeLine(outcome));
    });
  });
  return lines;
}

function buildHistorySearchText(record) {
  const meta = record && record.meta ? record.meta : {};
  const lines = getHistoryOutcomeLines(record);
  return [
    String(record && record.exportedAtText ? record.exportedAtText : ""),
    String(record && record.exportedAt ? record.exportedAt : ""),
    String(meta && meta.applicantTeacher ? meta.applicantTeacher : ""),
    String(meta && meta.dateRangeText ? meta.dateRangeText : ""),
    String(meta && meta.leaveType ? meta.leaveType : ""),
    String(meta && meta.reasonDoc ? meta.reasonDoc : ""),
    lines.join("\n")
  ].join("\n").toLowerCase();
}

function getHistoryRecordPreview(record) {
  const drafts = Array.isArray(record && record.drafts) ? record.drafts : [];
  const outcomes = [];
  const chainItems = [];
  drafts.forEach((draft, draftIndex) => {
    const chain = Array.isArray(draft && draft.chain) ? draft.chain : [];
    const { outcomes: resolved } = resolveAdjustmentOutcomes(chain);
    outcomes.push(...resolved.map((item) => ({ ...item, draftIndex })));
    chain.forEach((item, order) => {
      chainItems.push({ ...item, draftIndex, order });
    });
  });
  return {
    outcomes,
    links: buildMovementLinks(chainItems, { type: "all", value: "" })
  };
}

function renderHistoryMiniBoard() {
  if (!el.historyMiniBoard) return;
  const record = adjustmentHistory[activeHistoryIndex] || null;
  if (!record) {
    el.historyMiniBoard.innerHTML = '<div class="adjustment-empty">請先選擇一筆歷史異動</div>';
    return;
  }
  const preview = getHistoryRecordPreview(record);
  renderMiniGridTo(el.historyMiniBoard, preview.outcomes, { links: preview.links });
}

function renderHistoryList() {
  if (!el.historyList) return;
  if (!adjustmentHistory.length) {
    activeHistoryIndex = 0;
    renderHistoryMiniBoard();
  } else if (activeHistoryIndex >= adjustmentHistory.length || activeHistoryIndex < 0) {
    activeHistoryIndex = 0;
  }
  const keyword = String(historySearchKeyword || "").trim().toLowerCase();
  const indexed = adjustmentHistory.map((record, index) => ({ record, index }));
  const rows = keyword
    ? indexed.filter(({ record }) => buildHistorySearchText(record).includes(keyword))
    : indexed;

  if (!rows.length) {
    el.historyList.innerHTML = '<div class="history-empty">查無歷史異動資料</div>';
    renderHistoryMiniBoard();
    return;
  }

  const visibleIndexes = rows.map(({ index }) => index);
  if (!visibleIndexes.includes(activeHistoryIndex)) {
    activeHistoryIndex = visibleIndexes[0];
  }

  renderHistoryMiniBoard();

  el.historyList.innerHTML = rows.map(({ record, index }) => {
    const id = getHistoryRecordId(record, index);
    const drafts = Array.isArray(record && record.drafts) ? record.drafts : [];
    const lines = getHistoryOutcomeLines(record);
    const expanded = historyExpandedIds.has(id);
    const activeClass = index === activeHistoryIndex ? "active" : "";
    const meta = record && record.meta ? record.meta : {};
    const title = String(meta && meta.applicantTeacher ? meta.applicantTeacher : "未指定教師");
    const detailText = lines.length ? lines.join("\n") : "無明細";
    return `
      <div class="history-item ${activeClass}" data-history-id="${id}" data-index="${index}">
        <div class="history-item-head">
          <div class="history-item-title">${title}｜${String(record && record.exportedAtText ? record.exportedAtText : "未記錄時間")}</div>
          <div class="history-item-meta">流水：${String(meta && meta.serial ? meta.serial : "-")}</div>
        </div>
        <div class="history-item-info">區間：${String(meta && meta.dateRangeText ? meta.dateRangeText : "-")}｜假別：${String(meta && meta.leaveType ? meta.leaveType : "-")}｜草稿：${drafts.length} 筆｜異動：${lines.length} 筆</div>
        <div class="history-item-actions">
          <button class="btn" type="button" data-action="trace" data-index="${index}">${expanded ? "收合回溯" : "回溯明細"}</button>
          <button class="btn primary" type="button" data-action="restore" data-index="${index}">還原到調動清單</button>
          <button class="btn danger" type="button" data-action="delete" data-index="${index}">刪除此筆</button>
        </div>
        ${expanded ? `<div class="history-detail">${detailText}</div>` : ""}
      </div>
    `;
  }).join("");

  el.historyList.querySelectorAll(".history-item[data-index]").forEach((item) => {
    item.addEventListener("click", (event) => {
      if (event.target.closest("button[data-action]")) return;
      const index = Number(item.dataset.index || -1);
      if (index < 0) return;
      activeHistoryIndex = index;
      renderHistoryList();
    });
  });

  el.historyList.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = String(button.dataset.action || "");
      const index = Number(button.dataset.index || -1);
      const record = adjustmentHistory[index];
      if (!record) return;

      if (action === "trace") {
        activeHistoryIndex = index;
        const id = getHistoryRecordId(record, index);
        if (historyExpandedIds.has(id)) {
          historyExpandedIds.delete(id);
        } else {
          historyExpandedIds.add(id);
        }
        renderHistoryList();
        return;
      }

      if (action === "restore") {
        const drafts = Array.isArray(record && record.drafts) ? record.drafts : [];
        if (!drafts.length) {
          alert("此筆歷史無可還原草稿。");
          return;
        }
        if (adjustmentDrafts.length) {
          const okReplace = confirm("目前清單已有資料，是否以這筆歷史資料覆蓋？");
          if (!okReplace) return;
        }
        adjustmentDrafts = drafts.map((draft, draftIndex) => normalizeAdjustmentDraft(draft, draftIndex));
        activeAdjustmentSheetIndex = adjustmentDrafts.length ? 0 : 0;
        syncAdjustmentDraftState();
        renderAdjustmentDraftList();
        renderAdjustmentSheetTabs();
        renderDraftMiniBoard();
        setFloatingTab("adjustment");
        syncOutputFormDefaults();
        alert("已還原到調動清單。");
        return;
      }

      if (action === "delete") {
        const okDelete = confirm("確定刪除這筆歷史異動？");
        if (!okDelete) return;
        const id = getHistoryRecordId(record, index);
        historyExpandedIds.delete(id);
        adjustmentHistory.splice(index, 1);
        if (activeHistoryIndex >= adjustmentHistory.length) {
          activeHistoryIndex = Math.max(0, adjustmentHistory.length - 1);
        }
        EventStorage.saveAdjustmentHistory(adjustmentHistory);
        renderHistoryList();
      }
    });
  });
}

function getStatusListFromOutcome(outcome) {
  const statuses = [];
  if (outcome.lastAction === "調") statuses.push("adjusted");
  if (outcome.lastAction === "代") statuses.push("substituted");
  statuses.push("done", "notified");
  if (!outcome.teacher) statuses.push("conflict");
  return Array.from(new Set(statuses));
}

function renderStatusBadges(statuses) {
  return (statuses || [])
    .map((s) => {
      const def = STATUS_DEF[s];
      if (!def) return "";
      return `<span class="status-badge ${def.cls}">${def.code}</span>`;
    })
    .join("");
}

function getActiveDraftForStatus() {
  if (!adjustmentDrafts.length) return null;
  if (activeAdjustmentSheetIndex >= adjustmentDrafts.length) {
    activeAdjustmentSheetIndex = adjustmentDrafts.length - 1;
  }
  if (activeAdjustmentSheetIndex < 0) {
    activeAdjustmentSheetIndex = 0;
  }
  return adjustmentDrafts[activeAdjustmentSheetIndex] || null;
}

function buildStakeholderStatusCards(draft) {
  if (!draft) return [];
  const chain = Array.isArray(draft.chain) ? draft.chain : [];
  const { outcomes } = resolveAdjustmentOutcomes(chain);
  const filteredOutcomes = filterOutcomesByEntity(outcomes);

  if (stakeholderView === "admin") {
    return filteredOutcomes.map((o) => ({
      title: `${formatDateMD(o.date)} ${o.className} 第${o.period}節 ${o.subject} ${o.teacher || "（未指定）"}`,
      statuses: getStatusListFromOutcome(o)
    }));
  }

  if (stakeholderView === "class") {
    const byClass = new Map();
    for (const o of filteredOutcomes) {
      const key = o.className || "（未填班級）";
      if (!byClass.has(key)) byClass.set(key, []);
      byClass.get(key).push(o);
    }
    return Array.from(byClass.entries()).map(([className, list]) => ({
      title: `${className}｜共 ${list.length} 筆`,
      statuses: Array.from(new Set(list.flatMap(getStatusListFromOutcome)))
    }));
  }

  const draftIndex = adjustmentDrafts.indexOf(draft);
  const docs = buildTeacherDocumentsForDraft(draft, draftIndex >= 0 ? draftIndex : 0);
  return docs
    .map((doc) => {
      const rows = doc.rows.filter((row) => {
        const probe = {
          className: row.className,
          originalTeacher: row.beforeTeacher || "",
          teacher: row.afterTeacher || ""
        };
        return isOutcomeMatchedByEntity(probe);
      });
      if (!rows.length) return null;
      return {
        title: `${doc.teacher}｜專屬單據`,
        meta: `申請教師：${doc.applicantTeacher || "（未指定）"}｜相關 ${rows.length} 筆`,
        statuses: Array.from(new Set(rows.flatMap((row) => row.statuses || [])))
      };
    })
    .filter(Boolean);
}

function renderStakeholderButtons() {
  if (el.stakeholderAdminBtn) el.stakeholderAdminBtn.classList.toggle("active", stakeholderView === "admin");
  if (el.stakeholderClassBtn) el.stakeholderClassBtn.classList.toggle("active", stakeholderView === "class");
  if (el.stakeholderTeacherBtn) el.stakeholderTeacherBtn.classList.toggle("active", stakeholderView === "teacher");
}

function renderAdjustmentStatusWall() {
  if (!el.adjustmentStatusWall) return;
  const draft = getActiveDraftForStatus();
  if (!draft) {
    el.adjustmentStatusWall.innerHTML = '<div class="status-wall-empty">尚無可顯示狀態</div>';
    return;
  }

  const cards = buildStakeholderStatusCards(draft);
  if (!cards.length) {
    el.adjustmentStatusWall.innerHTML = '<div class="status-wall-empty">尚無可顯示狀態</div>';
    return;
  }

  el.adjustmentStatusWall.innerHTML = cards
    .map((card) => `
      <div class="status-card">
        <div class="status-title">${card.title}</div>
        ${card.meta ? `<div class="status-meta">${card.meta}</div>` : ""}
        <div class="status-badges">${renderStatusBadges(card.statuses)}</div>
      </div>
    `)
    .join("");
}

function detectDraftConflicts(outcomes) {
  const teacherMap = new Map();
  const classMap = new Map();

  for (const item of outcomes || []) {
    const date = String(item.date || "").trim();
    const period = String(item.period || "").trim();
    const teacher = String(item.teacher || "").trim();
    const className = String(item.className || "").trim();
    const slot = `${date}|${period}`;

    if (teacher) {
      const tKey = `${slot}|${teacher}`;
      if (!teacherMap.has(tKey)) teacherMap.set(tKey, []);
      teacherMap.get(tKey).push(item);
    }

    if (className) {
      const cKey = `${slot}|${className}`;
      if (!classMap.has(cKey)) classMap.set(cKey, []);
      classMap.get(cKey).push(item);
    }
  }

  const teacherConflicts = [];
  teacherMap.forEach((items, key) => {
    if (items.length <= 1) return;
    const [date, period, teacher] = key.split("|");
    teacherConflicts.push(`${teacher}（${date} 第${period}節）`);
  });

  const classConflicts = [];
  classMap.forEach((items, key) => {
    if (items.length <= 1) return;
    const [date, period, className] = key.split("|");
    classConflicts.push(`${className}（${date} 第${period}節）`);
  });

  return {
    teacherConflicts: Array.from(new Set(teacherConflicts)),
    classConflicts: Array.from(new Set(classConflicts))
  };
}

function renderDraftConflictSummary(draft, outcomes) {
  if (!el.adjustmentConflictSummary) return;
  if (!draft) {
    el.adjustmentConflictSummary.innerHTML = '<div class="conflict-empty">尚無可分析資料</div>';
    return;
  }

  const { teacherConflicts, classConflicts } = detectDraftConflicts(outcomes);
  if (!teacherConflicts.length && !classConflicts.length) {
    el.adjustmentConflictSummary.innerHTML = '<div class="conflict-empty">本組目前未偵測到衝突</div>';
    return;
  }

  const teacherHtml = teacherConflicts.length
    ? `<div class="conflict-title">老師衝突</div><div class="conflict-list">${teacherConflicts.map((item) => `<span class="conflict-chip">${item}</span>`).join("")}</div>`
    : "";
  const classHtml = classConflicts.length
    ? `<div class="conflict-title">班級衝突</div><div class="conflict-list">${classConflicts.map((item) => `<span class="conflict-chip">${item}</span>`).join("")}</div>`
    : "";

  el.adjustmentConflictSummary.innerHTML = `${teacherHtml}${classHtml}`;
}

function renderMiniGridTo(targetEl, outcomes, options = {}) {
  if (!targetEl) return;
  if (!outcomes || !outcomes.length) {
    targetEl.innerHTML = '<div class="adjustment-empty">尚無可顯示異動結果</div>';
    return;
  }

  const DAYS = ["一", "二", "三", "四", "五"];
  const DAY_TO_WEEKDAY = { "一": 1, "二": 2, "三": 3, "四": 4, "五": 5 };
  const dayHead = DAYS.map((day) => `<th>${day}</th>`).join("");

  let rows = "";
  for (let period = 1; period <= 9; period += 1) {
    const timeText = PERIOD_TIME_MAP[period] || "";
    const timeTwoLine = timeText ? timeText.replace("-", "<br>") : "";
    let row = `<tr><td>${period}</td><td>${timeTwoLine}</td>`;
    for (const day of DAYS) {
      const targetWeekday = DAY_TO_WEEKDAY[day];
      const cellItems = outcomes.filter(
        (item) =>
          Number(item.period) === period &&
          item.date &&
          new Date(`${item.date}T00:00:00`).getDay() === targetWeekday
      );

      if (!cellItems.length) {
        row += `<td data-day="${targetWeekday}" data-period="${period}"></td>`;
        continue;
      }

      const cellContent = cellItems
        .map((item) => {
          const mark = item.lastAction === "代" ? "(代)" : item.lastAction === "調" ? "(調)" : "";
          const dateText = formatDateShort(item.date);
          const classText = String(item.className || "").trim();
          const subjectText = String(item.subject || "").trim();
          const teacherText = String(item.teacher || "").trim();
          const series = getDraftSeries(item && item.draftIndex);
          return `
            <div class="adjustment-info grid-item-fourline">
              <div class="grid-line grid-date" style="color:${series.subtle};">${dateText}</div>
              <div class="grid-line grid-class" style="color:${series.text};">${classText}</div>
              <div class="grid-line grid-subject" style="color:${series.subtle};">${subjectText}</div>
              <div class="grid-line grid-teacher" style="color:${series.arrow};">${teacherText}${mark}</div>
            </div>
          `;
        })
        .join("");
      row += `<td data-day="${targetWeekday}" data-period="${period}"><div class="grid-cell">${cellContent}</div></td>`;
    }
    row += "</tr>";
    rows += row;
  }

  targetEl.innerHTML = `
    <div class="mini-grid-wrap">
      <table class="adjustment-grid mini-grid">
        <thead>
          <tr><th>節次</th><th>時間</th>${dayHead}</tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;

  renderMiniGridArrows(targetEl, options.links || []);
}

function renderDraftMiniBoard() {
  if (!el.adjustmentDraftMiniBoard) return;
  if (!adjustmentDrafts.length) {
    el.adjustmentDraftMiniBoard.innerHTML = '<div class="adjustment-empty">尚無調動清單</div>';
    renderAdjustmentEntityIcons(null, []);
    renderDraftConflictSummary(null, []);
    syncOutputFormDefaults();
    return;
  }
  if (activeAdjustmentSheetIndex >= adjustmentDrafts.length) {
    activeAdjustmentSheetIndex = adjustmentDrafts.length - 1;
  }
  if (activeAdjustmentSheetIndex < 0) {
    activeAdjustmentSheetIndex = 0;
  }

  const selectedDraft = adjustmentScope === "single"
    ? adjustmentDrafts[activeAdjustmentSheetIndex]
    : null;
  const selectedOutcomes = adjustmentScope === "single"
    ? getActiveDraftOutcomes()
    : buildAllDraftOutcomes();
  const selectedChainItems = adjustmentScope === "single"
    ? getActiveDraftChainItems()
    : buildAllDraftChainItems();
  const movementLinks = buildMovementLinks(selectedChainItems, draftEntityFilter);

  renderAdjustmentEntityIcons(selectedDraft, selectedOutcomes);
  renderDraftConflictSummary(selectedDraft, selectedOutcomes);
  const filteredOutcomes = filterOutcomesByEntity(selectedOutcomes);
  renderMiniGridTo(el.adjustmentDraftMiniBoard, filteredOutcomes, { links: movementLinks });
  syncOutputFormDefaults();
}

function formatSlotLabel(slot) {
  if (!slot) return "";
  const dateText = formatDateMD(slot.date);
  return `${dateText} ${slot.className || ""} ${slot.period || ""}節 ${slot.subject || ""}`.trim();
}

function getAdjustmentSlotKey(slot) {
  if (!slot) return "";
  return `${slot.date || ""}|${slot.className || ""}|${String(slot.period || "")}`;
}

function resolveAdjustmentOutcomes(chain) {
  const stateMap = new Map();

  const ensureState = (slot) => {
    if (!slot) return null;
    const key = getAdjustmentSlotKey(slot);
    if (!key) return null;
    if (!stateMap.has(key)) {
      stateMap.set(key, {
        date: slot.date || "",
        className: slot.className || "",
        period: slot.period || "",
        originalSubject: slot.subject || "",
        originalTeacher: slot.teacher || "",
        subject: slot.subject || "",
        teacher: slot.teacher || "",
        lastAction: ""
      });
    }
    return stateMap.get(key);
  };

  for (const item of chain || []) {
    const fromState = ensureState(item.from);
    if (!fromState) continue;

    if (item.type === "調課" && item.to) {
      const toState = ensureState(item.to);
      if (!toState) continue;
      const fromSubject = fromState.subject;
      const fromTeacher = fromState.teacher;
      fromState.subject = toState.subject;
      fromState.teacher = toState.teacher;
      toState.subject = fromSubject;
      toState.teacher = fromTeacher;
      fromState.lastAction = "調";
      toState.lastAction = "調";
    } else {
      const substituteTeacher = String(item.toLabel || item.boardTarget || "").trim();
      if (substituteTeacher) {
        fromState.teacher = substituteTeacher;
      }
      fromState.lastAction = "代";
    }
  }

  const outcomes = Array.from(stateMap.values()).sort((a, b) => {
    if (a.date !== b.date) return String(a.date).localeCompare(String(b.date), "zh-Hant");
    if (String(a.period) !== String(b.period)) return Number(a.period) - Number(b.period);
    return String(a.className).localeCompare(String(b.className), "zh-Hant");
  });

  const outcomeByKey = new Map(outcomes.map((item) => [getAdjustmentSlotKey(item), item]));
  return { outcomes, outcomeByKey };
}

function formatResolvedOutcomeLine(item) {
  if (!item) return "";
  const actionText = item.lastAction ? ` (${item.lastAction})` : "";
  return `${formatDateMD(item.date)} ${item.className || ""} ${item.period || ""}節 ${item.subject || ""} ${item.teacher || ""}${actionText}`
    .replace(/\s+/g, " ")
    .trim();
}

function getDraftApplicantTeacher(draft) {
  const chain = Array.isArray(draft && draft.chain) ? draft.chain : [];
  const first = chain.length ? chain[0] : null;
  const from = first && first.from ? first.from : null;
  return from && from.teacher ? String(from.teacher).trim() : "";
}

function formatMovementSlot(slot) {
  if (!slot) return "";
  const dateText = formatDateMD(slot.date);
  const className = String(slot.className || "").trim();
  const periodText = String(slot.period || "").trim();
  const subjectText = String(slot.subject || "").trim();
  return `${dateText} ${className} 第${periodText}節 ${subjectText}`.replace(/\s+/g, " ").trim();
}

function getMovementTeacherSet(chain, outcomes) {
  const teacherSet = new Set();

  for (const item of chain || []) {
    const fromTeacher = String(item && item.from && item.from.teacher ? item.from.teacher : "").trim();
    const toTeacher = String(item && item.to && item.to.teacher ? item.to.teacher : "").trim();
    const substituteTeacher = item && item.type !== "調課" ? String(item.toLabel || item.boardTarget || "").trim() : "";
    if (fromTeacher) teacherSet.add(fromTeacher);
    if (toTeacher) teacherSet.add(toTeacher);
    if (substituteTeacher) teacherSet.add(substituteTeacher);
  }

  for (const outcome of outcomes || []) {
    const originalTeacher = String(outcome.originalTeacher || "").trim();
    const currentTeacher = String(outcome.teacher || "").trim();
    if (originalTeacher) teacherSet.add(originalTeacher);
    if (currentTeacher) teacherSet.add(currentTeacher);
  }

  return Array.from(teacherSet).sort((a, b) => a.localeCompare(b, "zh-Hant"));
}

function createTeacherDocBucket(draftIndex, draft) {
  return {
    draftIndex: draftIndex + 1,
    draftId: draft && draft.id ? draft.id : "",
    createdAt: draft && draft.createdAt ? draft.createdAt : "",
    anchorDate: draft && draft.anchorDate ? draft.anchorDate : "",
    applicantTeacher: getDraftApplicantTeacher(draft),
    rows: []
  };
}

function addTeacherMovementRow(docMap, teacher, row) {
  const key = String(teacher || "").trim();
  if (!key) return;
  if (!docMap.has(key)) {
    docMap.set(key, createTeacherDocBucket(row.draftIndex, row.draft));
    docMap.get(key).teacher = key;
  }
  docMap.get(key).rows.push(row);
}

function collectDraftTeachers(draft, outcomes) {
  const teacherSet = new Set();
  const chain = Array.isArray(draft && draft.chain) ? draft.chain : [];

  for (const item of chain) {
    const fromTeacher = item && item.from && item.from.teacher ? String(item.from.teacher).trim() : "";
    if (fromTeacher) teacherSet.add(fromTeacher);

    const toTeacher = item && item.to && item.to.teacher ? String(item.to.teacher).trim() : "";
    if (toTeacher) teacherSet.add(toTeacher);

    if (item && item.type !== "調課") {
      const substituteTeacher = String((item.toLabel || item.boardTarget || "")).trim();
      if (substituteTeacher) teacherSet.add(substituteTeacher);
    }
  }

  for (const outcome of outcomes || []) {
    const originalTeacher = String(outcome.originalTeacher || "").trim();
    const currentTeacher = String(outcome.teacher || "").trim();
    if (originalTeacher) teacherSet.add(originalTeacher);
    if (currentTeacher) teacherSet.add(currentTeacher);
  }

  return Array.from(teacherSet).sort((a, b) => a.localeCompare(b, "zh-Hant"));
}

function buildTeacherDocumentsForDraft(draft, draftIndex) {
  const chain = Array.isArray(draft && draft.chain) ? draft.chain : [];
  const { outcomes } = resolveAdjustmentOutcomes(chain);
  const teachers = getMovementTeacherSet(chain, outcomes);
  const docs = new Map();

  const pushRow = (teacher, row) => {
    if (!teacher) return;
    if (!docs.has(teacher)) {
      docs.set(teacher, createTeacherDocBucket(draftIndex, draft));
      docs.get(teacher).teacher = teacher;
    }
    docs.get(teacher).rows.push({ ...row, teacher });
  };

  for (let index = 0; index < chain.length; index += 1) {
    const item = chain[index];
    const from = item && item.from ? item.from : null;
    const to = item && item.to ? item.to : null;
    const fromTeacher = String(from && from.teacher ? from.teacher : "").trim();
    const toTeacher = String(to && to.teacher ? to.teacher : "").trim();
    const fromSlot = formatMovementSlot(from);
    const toSlot = formatMovementSlot(to);
    const isSwap = item && item.type === "調課" && from && to;
    const substituteTeacher = item && item.type !== "調課" ? String(item.toLabel || item.boardTarget || "").trim() : "";

    if (isSwap) {
      if (fromTeacher) {
        pushRow(fromTeacher, {
          draftIndex: draftIndex + 1,
          kind: "調出",
          order: index * 10,
          arrow: "→",
          fromText: fromSlot,
          toText: toSlot,
          summary: `${fromSlot} → ${toSlot}`,
          detail: `本筆是 ${from && from.className ? from.className : ""} 的 ${from && from.period ? `第${from.period}節` : ""} 調到 ${to && to.className ? to.className : ""} 的 ${to && to.period ? `第${to.period}節` : ""}`.replace(/\s+/g, " ").trim(),
          action: "調",
          note: ""
        });
        pushRow(fromTeacher, {
          draftIndex: draftIndex + 1,
          kind: "空洞補入",
          order: index * 10 + 1,
          arrow: "←",
          fromText: toSlot,
          toText: fromSlot,
          summary: `${toSlot} → ${fromSlot}`,
          detail: `原本空出的 ${from && from.className ? from.className : ""} ${from && from.period ? `第${from.period}節` : ""} 由 ${to && to.className ? to.className : ""} ${to && to.period ? `第${to.period}節` : ""} 補進來`.replace(/\s+/g, " ").trim(),
          action: "調",
          note: ""
        });
      }

      if (toTeacher) {
        pushRow(toTeacher, {
          draftIndex: draftIndex + 1,
          kind: "調入",
          order: index * 10,
          arrow: "→",
          fromText: toSlot,
          toText: fromSlot,
          summary: `${toSlot} → ${fromSlot}`,
          detail: `本筆是 ${to && to.className ? to.className : ""} 的 ${to && to.period ? `第${to.period}節` : ""} 調到 ${from && from.className ? from.className : ""} 的 ${from && from.period ? `第${from.period}節` : ""}`.replace(/\s+/g, " ").trim(),
          action: "調",
          note: ""
        });
        pushRow(toTeacher, {
          draftIndex: draftIndex + 1,
          kind: "空洞補入",
          order: index * 10 + 1,
          arrow: "←",
          fromText: fromSlot,
          toText: toSlot,
          summary: `${fromSlot} → ${toSlot}`,
          detail: `原本空出的 ${to && to.className ? to.className : ""} ${to && to.period ? `第${to.period}節` : ""} 由 ${from && from.className ? from.className : ""} ${from && from.period ? `第${from.period}節` : ""} 補進來`.replace(/\s+/g, " ").trim(),
          action: "調",
          note: ""
        });
      }
      continue;
    }

    if (fromTeacher) {
      pushRow(fromTeacher, {
        draftIndex: draftIndex + 1,
        kind: "代課",
        order: index * 10,
        arrow: "→",
        fromText: fromSlot,
        toText: substituteTeacher ? `${substituteTeacher}（代）` : "代課",
        summary: `${fromSlot} → 代課`,
        detail: `${from && from.className ? from.className : ""} ${from && from.period ? `第${from.period}節` : ""} 由代課處理`.replace(/\s+/g, " ").trim(),
        action: "代",
        note: "(代)"
      });
    }

    if (substituteTeacher) {
      pushRow(substituteTeacher, {
        draftIndex: draftIndex + 1,
        kind: "代課支援",
        order: index * 10,
        arrow: "→",
        fromText: "代課",
        toText: fromSlot,
        summary: `代課 → ${fromSlot}`,
        detail: `支援 ${from && from.className ? from.className : ""} ${from && from.period ? `第${from.period}節` : ""}`.replace(/\s+/g, " ").trim(),
        action: "代",
        note: "(代)"
      });
    }
  }

  return teachers
    .map((teacher) => {
      const doc = docs.get(teacher);
      if (!doc || !doc.rows.length) return null;
      doc.rows.sort((a, b) => a.order - b.order || String(a.kind).localeCompare(String(b.kind), "zh-Hant"));
      return {
        ...doc,
        teacher,
        rows: doc.rows,
        statusSet: []
      };
    })
    .filter(Boolean);
}

function buildTeacherDocumentsAllDrafts() {
  const docs = [];
  adjustmentDrafts.forEach((draft, index) => {
    docs.push(...buildTeacherDocumentsForDraft(draft, index));
  });
  return docs;
}

function buildDraftEntities(draft, outcomes) {
  const classSet = new Set();
  const teacherSet = new Set();
  const chain = Array.isArray(draft && draft.chain) ? draft.chain : [];

  for (const item of outcomes || []) {
    const className = String(item.className || "").trim();
    const originalTeacher = String(item.originalTeacher || "").trim();
    const currentTeacher = String(item.teacher || "").trim();
    if (className) classSet.add(className);
    if (originalTeacher) teacherSet.add(originalTeacher);
    if (currentTeacher) teacherSet.add(currentTeacher);
  }

  for (const item of chain) {
    const fromClass = item && item.from && item.from.className ? String(item.from.className).trim() : "";
    const toClass = item && item.to && item.to.className ? String(item.to.className).trim() : "";
    const fromTeacher = item && item.from && item.from.teacher ? String(item.from.teacher).trim() : "";
    const toTeacher = item && item.to && item.to.teacher ? String(item.to.teacher).trim() : "";
    const substituteTeacher = item && item.type !== "調課" ? String(item.toLabel || item.boardTarget || "").trim() : "";

    if (fromClass) classSet.add(fromClass);
    if (toClass) classSet.add(toClass);
    if (fromTeacher) teacherSet.add(fromTeacher);
    if (toTeacher) teacherSet.add(toTeacher);
    if (substituteTeacher) teacherSet.add(substituteTeacher);
  }

  return {
    classes: Array.from(classSet).sort((a, b) => a.localeCompare(b, "zh-Hant")),
    teachers: Array.from(teacherSet).sort((a, b) => a.localeCompare(b, "zh-Hant"))
  };
}

function buildAllDraftEntities() {
  const classSet = new Set();
  const teacherSet = new Set();

  for (const draft of adjustmentDrafts) {
    const chain = Array.isArray(draft && draft.chain) ? draft.chain : [];
    const { outcomes } = resolveAdjustmentOutcomes(chain);
    const entities = buildDraftEntities(draft, outcomes);
    (entities.classes || []).forEach((name) => classSet.add(name));
    (entities.teachers || []).forEach((name) => teacherSet.add(name));
  }

  return {
    classes: Array.from(classSet).sort((a, b) => a.localeCompare(b, "zh-Hant")),
    teachers: Array.from(teacherSet).sort((a, b) => a.localeCompare(b, "zh-Hant"))
  };
}

function buildAllDraftOutcomes() {
  const outcomes = [];
  adjustmentDrafts.forEach((draft, draftIndex) => {
    const chain = Array.isArray(draft && draft.chain) ? draft.chain : [];
    const resolved = resolveAdjustmentOutcomes(chain);
    outcomes.push(...resolved.outcomes.map((item) => ({ ...item, draftIndex })));
  });
  return outcomes;
}

function buildAllDraftChainItems() {
  const items = [];
  adjustmentDrafts.forEach((draft, index) => {
    const chain = Array.isArray(draft && draft.chain) ? draft.chain : [];
    chain.forEach((item, order) => {
      items.push({
        ...item,
        draftIndex: index,
        order
      });
    });
  });
  return items;
}

function getActiveDraftOutcomes() {
  if (!adjustmentDrafts.length) return [];
  const index = Math.min(Math.max(activeAdjustmentSheetIndex, 0), adjustmentDrafts.length - 1);
  const draft = adjustmentDrafts[index];
  const chain = Array.isArray(draft && draft.chain) ? draft.chain : [];
  return resolveAdjustmentOutcomes(chain).outcomes.map((item) => ({ ...item, draftIndex: index }));
}

function getActiveDraftChainItems() {
  if (!adjustmentDrafts.length) return [];
  const index = Math.min(Math.max(activeAdjustmentSheetIndex, 0), adjustmentDrafts.length - 1);
  const draft = adjustmentDrafts[index];
  const chain = Array.isArray(draft && draft.chain) ? draft.chain : [];
  return chain.map((item, order) => ({ ...item, draftIndex: index, order }));
}

function isChainItemMatchedByEntity(item, filter = draftEntityFilter) {
  if (!item) return false;
  if (!filter || filter.type === "all" || !filter.value) return true;

  const from = item.from || {};
  const to = item.to || {};
  if (filter.type === "class") {
    const fromClass = String(from.className || "").trim();
    const toClass = String(to.className || "").trim();
    return fromClass === filter.value || toClass === filter.value;
  }

  const fromTeacher = String(from.teacher || "").trim();
  const toTeacher = String(to.teacher || "").trim();
  const subTeacher = item.type !== "調課" ? String(item.toLabel || item.boardTarget || "").trim() : "";
  return fromTeacher === filter.value || toTeacher === filter.value || subTeacher === filter.value;
}

function buildMovementLinks(chainItems, filter = draftEntityFilter) {
  const links = [];
  const grouped = new Map();

  (chainItems || []).forEach((item) => {
    const draftKey = Number.isFinite(Number(item && item.draftIndex)) ? Number(item.draftIndex) : -1;
    if (!grouped.has(draftKey)) grouped.set(draftKey, []);
    grouped.get(draftKey).push(item);
  });

  grouped.forEach((items, draftKey) => {
    const ordered = (items || []).slice().sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    if (!ordered.length) return;

    // 每一筆資料（draft）內，逐段畫單向箭頭。
    ordered.forEach((item, idx) => {
      if (!isChainItemMatchedByEntity(item, filter)) return;
      const from = item && item.from ? item.from : null;
      const to = item && item.to ? item.to : null;
      if (!from || !to || item.type !== "調課") return;

      links.push({
        key: `m_${draftKey}_${idx}_out`,
        fromDate: to.date,
        fromPeriod: to.period,
        toDate: from.date,
        toPeriod: from.period,
        draftIndex: draftKey,
        label: ""
      });
    });

    const first = ordered[0];
    const last = ordered[ordered.length - 1];
    if (!last || last.type !== "調課") return;
    if (!first || !first.from || !last.to) return;

    // 每一筆資料獨立閉環：最後一段落點回到第一個資訊。
    if (filter && filter.type !== "all" && filter.value) {
      const firstMatched = isChainItemMatchedByEntity(first, filter);
      const lastMatched = isChainItemMatchedByEntity(last, filter);
      if (!firstMatched && !lastMatched) return;
    }

    links.push({
      key: `m_loop_${draftKey}`,
      fromDate: first.from.date,
      fromPeriod: first.from.period,
      toDate: last.to.date,
      toPeriod: last.to.period,
      draftIndex: draftKey,
      label: ""
    });
  });

  return links;
}

function getWeekdayIndexFromDate(dateString) {
  const dayText = getDayTextFromDate(dateString);
  const map = { "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6 };
  return map[dayText] || 0;
}

function renderMiniGridArrows(containerEl, links) {
  if (!containerEl) return;
  const wrap = containerEl.querySelector(".mini-grid-wrap");
  if (!wrap) return;

  const oldLayer = wrap.querySelector(".mini-grid-arrows");
  if (oldLayer) oldLayer.remove();
  if (!links || !links.length) return;

  const wrapRect = wrap.getBoundingClientRect();
  if (!wrapRect.width || !wrapRect.height) return;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "mini-grid-arrows");
  svg.setAttribute("viewBox", `0 0 ${wrapRect.width} ${wrapRect.height}`);
  svg.setAttribute("width", String(wrapRect.width));
  svg.setAttribute("height", String(wrapRect.height));
  svg.style.zIndex = "5";

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  DRAFT_COLOR_SERIES.forEach((series, idx) => {
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", `mini-arrow-head-${idx}`);
    marker.setAttribute("viewBox", "0 0 10 10");
    marker.setAttribute("refX", "8");
    marker.setAttribute("refY", "5");
    marker.setAttribute("markerWidth", "5");
    marker.setAttribute("markerHeight", "5");
    marker.setAttribute("orient", "auto-start-reverse");
    const arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arrowPath.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    arrowPath.setAttribute("fill", series.arrow);
    marker.appendChild(arrowPath);
    defs.appendChild(marker);
  });
  svg.appendChild(defs);

  links.forEach((link) => {
    const fromDay = getWeekdayIndexFromDate(link.fromDate);
    const toDay = getWeekdayIndexFromDate(link.toDate);
    if (!fromDay || !toDay) return;
    const fromPeriod = Number(link.fromPeriod);
    const toPeriod = Number(link.toPeriod);
    if (!fromPeriod || !toPeriod) return;

    const fromCell = wrap.querySelector(`td[data-day='${fromDay}'][data-period='${fromPeriod}']`);
    const toCell = wrap.querySelector(`td[data-day='${toDay}'][data-period='${toPeriod}']`);
    if (!fromCell || !toCell) return;

    const fromRect = fromCell.getBoundingClientRect();
    const toRect = toCell.getBoundingClientRect();

    const startX = fromRect.left - wrapRect.left + (fromRect.width / 2);
    const endX = toRect.left - wrapRect.left + (toRect.width / 2);
    // 箭頭沿著儲存格上緣走，避免穿過中央文字區
    const startY = fromRect.top - wrapRect.top + 6;
    const endY = toRect.top - wrapRect.top + 6;

    const curve = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const cpY = Math.min(startY, endY) - 12;
    const series = getDraftSeries(link && link.draftIndex);
    curve.setAttribute("d", `M ${startX} ${startY} Q ${(startX + endX) / 2} ${cpY} ${endX} ${endY}`);
    curve.setAttribute("fill", "none");
    curve.setAttribute("stroke", series.arrow);
    curve.setAttribute("stroke-width", "1.2");
    curve.setAttribute("stroke-opacity", "0.9");
    curve.setAttribute("marker-end", `url(#mini-arrow-head-${series.index})`);
    svg.appendChild(curve);

    if (link.label) {
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", String((startX + endX) / 2 + 2));
      label.setAttribute("y", String(cpY - 2));
      label.setAttribute("class", "mini-grid-arrow-label");
      label.textContent = link.label;
      svg.appendChild(label);
    }
  });

  wrap.appendChild(svg);
}

function isOutcomeMatchedByEntity(outcome, filter = draftEntityFilter) {
  if (!filter || filter.type === "all" || !filter.value) return true;
  if (filter.type === "class") {
    return String(outcome.className || "").trim() === filter.value;
  }
  const originalTeacher = String(outcome.originalTeacher || "").trim();
  const currentTeacher = String(outcome.teacher || "").trim();
  return originalTeacher === filter.value || currentTeacher === filter.value;
}

function filterOutcomesByEntity(outcomes, filter = draftEntityFilter) {
  return (outcomes || []).filter((item) => isOutcomeMatchedByEntity(item, filter));
}

function isEntityFilterValid(entities, filter = draftEntityFilter) {
  if (!filter || filter.type === "all" || !filter.value) return true;
  if (filter.type === "class") {
    return (entities.classes || []).includes(filter.value);
  }
  return (entities.teachers || []).includes(filter.value);
}

function renderEntityFilterInfo() {
  if (!el.adjustmentEntityFilterInfo) return;
  if (!draftEntityFilter || draftEntityFilter.type === "all" || !draftEntityFilter.value) {
    el.adjustmentEntityFilterInfo.textContent = "目前顯示：全部";
    return;
  }
  const kindText = draftEntityFilter.type === "class" ? "班級" : "老師";
  el.adjustmentEntityFilterInfo.textContent = `目前顯示：${kindText} ${draftEntityFilter.value}`;
}

function renderEntityIconBlock(items, type, title) {
  if (!items.length) {
    return `<div class="entity-group"><div class="entity-group-title">${title}</div><div class="entity-chip-empty">無資料</div></div>`;
  }

  const allActive = draftEntityFilter.type === "all";
  const chipHtml = [
    `<button class="entity-chip ${allActive ? "active" : ""}" type="button" data-entity-type="all" data-entity-value="">全部</button>`,
    ...items.map((name) => {
      const active = draftEntityFilter.type === type && draftEntityFilter.value === name;
      return `<button class="entity-chip ${active ? "active" : ""}" type="button" data-entity-type="${type}" data-entity-value="${name}">${name}</button>`;
    })
  ].join("");

  return `<div class="entity-group"><div class="entity-group-title">${title}</div><div class="entity-chip-list">${chipHtml}</div></div>`;
}

function renderAdjustmentEntityIcons(draft, outcomes) {
  if (!el.adjustmentEntityIcons) return;
  if (!adjustmentDrafts.length) {
    el.adjustmentEntityIcons.innerHTML = '<div class="entity-chip-empty">尚無可篩選對象</div>';
    renderEntityFilterInfo();
    return;
  }

  const entities = buildAllDraftEntities();
  if (!isEntityFilterValid(entities)) {
    draftEntityFilter = { type: "all", value: "" };
  }

  el.adjustmentEntityIcons.innerHTML = [
    renderEntityIconBlock(entities.teachers, "teacher", "關聯老師"),
    renderEntityIconBlock(entities.classes, "class", "關聯班級")
  ].join("");

  el.adjustmentEntityIcons.querySelectorAll("button[data-entity-type]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = String(button.dataset.entityType || "all");
      const value = String(button.dataset.entityValue || "").trim();
      if (type === "all") {
        draftEntityFilter = { type: "all", value: "" };
      } else {
        draftEntityFilter = { type, value };
      }
      renderDraftMiniBoard();
    });
  });

  renderEntityFilterInfo();
}

function createAdjustmentId(prefix = "adj") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeAdjustmentDraft(draft, fallbackIndex = 0) {
  const source = draft && typeof draft === "object" ? draft : {};
  const chain = Array.isArray(source.chain)
    ? source.chain.map((item, index) => ({
        ...item,
        id: item && item.id ? item.id : createAdjustmentId(`adj_item_${fallbackIndex}_${index}`)
      }))
    : [];

  return {
    id: source.id || createAdjustmentId(`adj_${fallbackIndex}`),
    createdAt: source.createdAt || new Date().toLocaleString("zh-TW"),
    anchorDate: source.anchorDate || today(),
    chain
  };
}

function syncAdjustmentDraftState() {
  EventStorage.saveAdjustmentDrafts(adjustmentDrafts);
}

function editAdjustmentDraft(index) {
  const draft = adjustmentDrafts[index];
  if (!draft) return;

  const text = prompt("編輯調課清單 JSON（請確認格式）", JSON.stringify(draft, null, 2));
  if (text === null) return;

  try {
    const parsed = JSON.parse(text);
    adjustmentDrafts[index] = normalizeAdjustmentDraft(parsed, index);
    syncAdjustmentDraftState();
    activeAdjustmentSheetIndex = index;
    renderAdjustmentDraftList();
    renderBoards();
  } catch (err) {
    alert("JSON 格式錯誤，未更新。\n" + (err && err.message ? err.message : ""));
  }
}

function deleteAdjustmentDraft(index) {
  const draft = adjustmentDrafts[index];
  if (!draft) return;
  const ok = confirm(`確定要刪除第 ${index + 1} 筆調課清單嗎？`);
  if (!ok) return;

  adjustmentDrafts.splice(index, 1);
  if (activeAdjustmentSheetIndex >= adjustmentDrafts.length) {
    activeAdjustmentSheetIndex = Math.max(0, adjustmentDrafts.length - 1);
  }
  syncAdjustmentDraftState();
  renderAdjustmentDraftList();
  renderBoards();
}

function renderAdjustmentSheetGrid(draft, index) {
  if (!el.adjustmentSheetView) return;

  const chain = Array.isArray(draft && draft.chain) ? draft.chain : [];
  const { outcomes } = resolveAdjustmentOutcomes(chain);
  const dayList = ["一", "二", "三", "四", "五"];
  const slotMap = new Map();

  for (const item of outcomes) {
    const day = getDayTextFromDate(item.date);
    if (!dayList.includes(day)) continue;
    const key = `${day}-${item.period}`;
    if (!slotMap.has(key)) slotMap.set(key, []);
    slotMap.get(key).push(item);
  }

  const headHtml = dayList.map((d) => `<th>週${d}</th>`).join("");
  let bodyHtml = "";
  for (let period = 1; period <= 9; period += 1) {
    let row = `<tr><td>${formatPeriodWithTime(period).replace(/\n/g, "<br>")}</td>`;
    for (const day of dayList) {
      const key = `${day}-${period}`;
      const list = slotMap.get(key) || [];
      const chips = list.map((item) => {
        const actionTag = item.lastAction === "代" ? "代" : "調";
        const cls = item.lastAction === "代" ? "sheet-chip tag-sub" : "sheet-chip";
        return `<div class="${cls}"><div>${item.className}</div><div>${item.subject} ${item.teacher}</div><div class="tag">(${actionTag})</div></div>`;
      }).join("");
      row += `<td><div class="sheet-cell">${chips}</div></td>`;
    }
    row += "</tr>";
    bodyHtml += row;
  }

  const createdAt = (draft && draft.createdAt) || "";
  const anchorDate = (draft && draft.anchorDate) || "";
  el.adjustmentSheetView.innerHTML = `
    <div class="sheet-meta">#${index + 1} ${createdAt}｜週別基準日：${anchorDate}</div>
    <div class="sheet-grid-wrap">
      <table class="sheet-grid">
        <thead><tr><th>節</th>${headHtml}</tr></thead>
        <tbody>${bodyHtml}</tbody>
      </table>
    </div>
  `;
}

function renderAdjustmentSheetTabs() {
  if (!el.adjustmentSheetTabs || !el.adjustmentSheetView) return;

  if (!adjustmentDrafts.length) {
    el.adjustmentSheetTabs.innerHTML = "";
    el.adjustmentSheetView.innerHTML = '<div class="adjustment-empty">尚無調課紀錄可圖像化顯示</div>';
    return;
  }

  if (activeAdjustmentSheetIndex >= adjustmentDrafts.length) {
    activeAdjustmentSheetIndex = adjustmentDrafts.length - 1;
  }
  if (activeAdjustmentSheetIndex < 0) {
    activeAdjustmentSheetIndex = 0;
  }

  el.adjustmentSheetTabs.innerHTML = adjustmentDrafts
    .map((draft, idx) => {
      const activeClass = idx === activeAdjustmentSheetIndex ? "active" : "";
      return `<button class="sheet-tab-btn ${activeClass}" type="button" data-index="${idx}">#${idx + 1}</button>`;
    })
    .join("");

  el.adjustmentSheetTabs.querySelectorAll("button[data-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      adjustmentScope = "single";
      activeAdjustmentSheetIndex = Number(btn.dataset.index);
      renderAdjustmentSheetTabs();
      renderDraftMiniBoard();
    });
  });

  renderAdjustmentSheetGrid(adjustmentDrafts[activeAdjustmentSheetIndex], activeAdjustmentSheetIndex);
}

function getBoardTone(index) {
  return BOARD_TONES[index % BOARD_TONES.length];
}

function renderAdjustmentDraftList() {
  if (!el.adjustmentDraftList) return;
  if (!adjustmentDrafts.length) {
    el.adjustmentDraftList.innerHTML = '<div class="adjustment-empty">尚無待匯出的調動清單</div>';
    renderDraftMiniBoard();
    renderAdjustmentSheetTabs();
    return;
  }

  el.adjustmentDraftList.innerHTML = adjustmentDrafts
    .map((draft, idx) => {
      const chain = Array.isArray(draft.chain) ? draft.chain : [];
      const { outcomes } = resolveAdjustmentOutcomes(chain);
      const lines = outcomes.length
        ? outcomes.map((item) => formatResolvedOutcomeLine(item)).join("<br>")
        : "尚無可顯示異動結果";
      return `
        <div class="draft-item">
          <div class="draft-title">#${idx + 1} ${draft.createdAt}</div>
          <div class="draft-meta">ID：${draft.id}</div>
          <div>${lines}</div>
          <div class="draft-actions-row">
            <button class="btn draft-btn" type="button" data-action="edit" data-index="${idx}">編輯</button>
            <button class="btn danger draft-btn" type="button" data-action="delete" data-index="${idx}">刪除</button>
          </div>
        </div>
      `;
    })
    .join("");

  el.adjustmentDraftList.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      if (button.dataset.action === "edit") {
        editAdjustmentDraft(index);
      } else if (button.dataset.action === "delete") {
        deleteAdjustmentDraft(index);
      }
    });
  });

  el.adjustmentDraftList.querySelectorAll(".draft-item").forEach((item, idx) => {
    item.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      adjustmentScope = "single";
      activeAdjustmentSheetIndex = idx;
      renderDraftMiniBoard();
    });
  });

  renderDraftMiniBoard();
  renderAdjustmentSheetTabs();
}

function renderAdjustmentResult() {
  const resultEl = document.getElementById("adjustment-result");
  if (!resultEl) return;

  const chain = computeAdjustmentChain();
  if (!chain.length) {
    resultEl.innerHTML = '<div class="adjustment-empty">尚未產生調課</div>';
    return;
  }

  const { outcomes } = resolveAdjustmentOutcomes(chain);
  renderMiniGridTo(resultEl, outcomes);
}

function triggerBlobDownload(fileName, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function sanitizeFileNameBase(name) {
  return String(name || "")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function buildExportFileBaseName(meta) {
  const teacher = sanitizeFileNameBase(meta && meta.applicantTeacher ? meta.applicantTeacher : "");
  const serial = sanitizeFileNameBase(meta && meta.serial ? meta.serial : "");
  const leaveType = sanitizeFileNameBase(meta && meta.leaveType ? meta.leaveType : "");
  return sanitizeFileNameBase(`C${teacher}${serial}${leaveType}`) || `C${today().replace(/-/g, "")}`;
}

function buildExportSheetEntries() {
  const entries = [];
  const allPayload = getPerspectivePayload({ type: "all", value: "" });
  entries.push({
    sheetName: "教務處",
    title: "教務處",
    retainLabel: "教務處",
    payload: allPayload
  });

  const targets = getAllPerspectiveTargets();
  targets.teachers.forEach((teacher) => {
    const payload = getPerspectivePayload({ type: "teacher", value: teacher });
    const sheetName = sanitizeSheetName(`教師_${teacher}`);
    const retainLabel = String(teacher || "").trim() || "老師";
    entries.push({
      sheetName,
      title: `教師視角：${teacher}`,
      retainLabel,
      payload
    });
  });

  targets.classes.forEach((className) => {
    const payload = getPerspectivePayload({ type: "class", value: className });
    const sheetName = sanitizeSheetName(`班級_${className}`);
    const retainLabel = String(className || "").trim() || "班級";
    entries.push({
      sheetName,
      title: `班級視角：${className}`,
      retainLabel,
      payload
    });
  });

  return entries;
}

function buildExportOutcomeRows() {
  const rows = [];
  adjustmentDrafts.forEach((draft, idx) => {
    const chain = Array.isArray(draft.chain) ? draft.chain : [];
    const firstFrom = chain.length && chain[0] ? chain[0].from || null : null;
    const applyTeacher = firstFrom && firstFrom.teacher ? String(firstFrom.teacher).trim() : "";
    const applyClass = firstFrom && firstFrom.className ? String(firstFrom.className).trim() : "";
    const { outcomes } = resolveAdjustmentOutcomes(chain);
    outcomes.forEach((o) => {
      rows.push({
        draftIndex: idx + 1,
        draftId: draft.id || "",
        createdAt: draft.createdAt || "",
        applyTeacher,
        applyClass,
        date: o.date,
        period: o.period,
        className: o.className,
        beforeSubject: o.originalSubject || "",
        beforeTeacher: o.originalTeacher || "",
        afterSubject: o.subject,
        afterTeacher: o.teacher,
        action: o.lastAction || ""
      });
    });
  });
  return rows;
}

function getAllPerspectiveTargets() {
  const entities = buildAllDraftEntities();
  return {
    teachers: entities.teachers || [],
    classes: entities.classes || []
  };
}

function getPerspectivePayload(filter) {
  const outcomes = filterOutcomesByEntity(buildAllDraftOutcomes(), filter);
  const links = buildMovementLinks(buildAllDraftChainItems(), filter);
  return { outcomes, links };
}

function formatMiniCellText(item) {
  const mark = item.lastAction === "代" ? "(代)" : item.lastAction === "調" ? "(調)" : "";
  return [
    formatDateShort(item.date),
    String(item.className || "").trim(),
    String(item.subject || "").trim(),
    `${String(item.teacher || "").trim()}${mark}`
  ].join("\n");
}

function buildPerspectiveCellMap(outcomes) {
  const map = new Map();
  const dayIdxMap = { "一": 1, "二": 2, "三": 3, "四": 4, "五": 5 };
  (outcomes || []).forEach((item) => {
    const dayText = getDayTextFromDate(item.date);
    const dayIdx = dayIdxMap[dayText] || 0;
    const period = Number(item.period || 0);
    if (!dayIdx || !period) return;
    const key = `${dayIdx}-${period}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(formatMiniCellText(item));
  });
  return map;
}

function buildOfficialCellMap(outcomes) {
  const map = new Map();
  (outcomes || []).forEach((item) => {
    if (!item || !item.date) return;
    const weekday = new Date(`${item.date}T00:00:00`).getDay();
    const period = Number(item.period || 0);
    if (!weekday || weekday < 1 || weekday > 6 || !period) return;
    const key = `${weekday}-${period}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(formatMiniCellText(item));
  });
  return map;
}

function getOfficialPeriods(outcomes) {
  const maxPeriod = (outcomes || []).reduce((max, item) => Math.max(max, Number(item && item.period ? item.period : 0)), 0);
  const upper = Math.max(8, Math.min(9, maxPeriod || 8));
  return Array.from({ length: upper }, (_, idx) => idx + 1);
}

function applyAllBorders(ws, startRow, endRow, startCol, endCol) {
  for (let r = startRow; r <= endRow; r += 1) {
    for (let c = startCol; c <= endCol; c += 1) {
      ws.getCell(r, c).border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } }
      };
    }
  }
}

function buildOfficialReasonText(meta) {
  return `${meta.leaveType || ""}\n調(代)課原因：${meta.reasonDoc || ""}`.trim();
}

function measureCellTextWidth(value) {
  const text = String(value || "");
  if (!text) return 0;
  return text
    .split("\n")
    .reduce((max, line) => Math.max(max, Array.from(String(line || "")).length), 0);
}

function estimateRowHeight(value, { fontSize = 11, widthChars = 12, minHeight = 15, maxHeight = 90 } = {}) {
  const text = String(value || "");
  if (!text) return minHeight;
  const safeWidth = Math.max(1, widthChars);
  const lines = text.split("\n").reduce((sum, line) => {
    const len = Array.from(String(line || "")).length;
    return sum + Math.max(1, Math.ceil(len / safeWidth));
  }, 0);
  const estimated = Math.ceil(lines * (fontSize * 1.7));
  return Math.max(minHeight, Math.min(maxHeight, estimated));
}

function clonePlainObject(obj) {
  if (!obj || typeof obj !== "object") return obj;
  return JSON.parse(JSON.stringify(obj));
}

function copyTemplateBlockWithinSheet(ws, {
  srcStartRow,
  srcEndRow,
  srcStartCol,
  srcEndCol,
  dstStartRow,
  dstStartCol,
  copyValues = true
}) {
  const rowCount = srcEndRow - srcStartRow + 1;
  const colCount = srcEndCol - srcStartCol + 1;

  for (let r = 0; r < rowCount; r += 1) {
    const srcRowNum = srcStartRow + r;
    const dstRowNum = dstStartRow + r;
    const srcHeight = ws.getRow(srcRowNum).height;
    if (srcHeight != null) ws.getRow(dstRowNum).height = srcHeight;

    for (let c = 0; c < colCount; c += 1) {
      const srcColNum = srcStartCol + c;
      const dstColNum = dstStartCol + c;
      const srcCell = ws.getCell(srcRowNum, srcColNum);
      const dstCell = ws.getCell(dstRowNum, dstColNum);
      dstCell.style = clonePlainObject(srcCell.style) || {};
      if (copyValues) {
        dstCell.value = srcCell.value;
      }
    }
  }

  for (let c = 0; c < colCount; c += 1) {
    const srcColNum = srcStartCol + c;
    const dstColNum = dstStartCol + c;
    const srcWidth = ws.getColumn(srcColNum).width;
    if (srcWidth != null) ws.getColumn(dstColNum).width = srcWidth;
  }
}

function copyTemplateLayoutToSheet(fromWs, toWs, {
  startRow = 1,
  endRow = 22,
  startCol = 1,
  endCol = 8
} = {}) {
  const rowCount = endRow - startRow + 1;
  const colCount = endCol - startCol + 1;

  for (let r = 0; r < rowCount; r += 1) {
    const srcRowNum = startRow + r;
    const dstRowNum = startRow + r;
    const srcHeight = fromWs.getRow(srcRowNum).height;
    if (srcHeight != null) toWs.getRow(dstRowNum).height = srcHeight;

    for (let c = 0; c < colCount; c += 1) {
      const srcColNum = startCol + c;
      const dstColNum = startCol + c;
      const srcCell = fromWs.getCell(srcRowNum, srcColNum);
      const dstCell = toWs.getCell(dstRowNum, dstColNum);
      dstCell.style = clonePlainObject(srcCell.style) || {};
      dstCell.value = srcCell.value;
    }
  }

  for (let c = 0; c < colCount; c += 1) {
    const srcColNum = startCol + c;
    const srcWidth = fromWs.getColumn(srcColNum).width;
    if (srcWidth != null) toWs.getColumn(srcColNum).width = srcWidth;
  }

  toWs.pageSetup = clonePlainObject(fromWs.pageSetup) || {};
  toWs.pageSetup.margins = clonePlainObject(fromWs.pageSetup && fromWs.pageSetup.margins) || toWs.pageSetup.margins;
}

function writeTemplateFormBlock(ws, payload, meta, retainLabel, {
  startRow = 1,
  startCol = 1,
  periods = [1, 2, 3, 4, 5, 6, 7, 8, 9],
  titleText = ""
} = {}) {
  const row = (n) => startRow + n - 1;
  const col = (n) => startCol + n - 1;
  const cellMap = buildOfficialCellMap(payload.outcomes);
  const reasonRow = row(9 + periods.length);

  const safeMerge = (r1, c1, r2, c2) => {
    try {
      ws.mergeCells(r1, c1, r2, c2);
    } catch (_) {
      // ignore already-merged range errors
    }
  };

  const setWrappedValue = (r, c, value) => {
    const cell = ws.getCell(r, c);
    cell.value = value;
    cell.alignment = {
      ...(cell.alignment || {}),
      wrapText: true
    };
  };

  const setMergedCenteredValue = (r1, c1, r2, c2, value) => {
    safeMerge(r1, c1, r2, c2);
    const cell = ws.getCell(r1, c1);
    cell.value = value;
    cell.alignment = {
      ...(cell.alignment || {}),
      horizontal: "center",
      vertical: "center",
      wrapText: true
    };
  };

  const setMergedAlignedValue = (r1, c1, r2, c2, value, horizontal, vertical) => {
    safeMerge(r1, c1, r2, c2);
    const cell = ws.getCell(r1, c1);
    cell.value = value;
    cell.alignment = {
      ...(cell.alignment || {}),
      horizontal,
      vertical,
      wrapText: true
    };
  };

  // 指定跨欄：表頭 1x8
  setMergedCenteredValue(row(2), col(1), row(2), col(8), meta.headerTitle);

  // 指定跨欄：流水代碼 1x3
  setMergedAlignedValue(row(3), col(2), row(3), col(4), meta.serial, "left", "center");

  // 指定跨欄：留存 1x3
  setMergedCenteredValue(row(4), col(2), row(4), col(4), `${retainLabel} 留存`);

  // 指定跨欄：申請調課教師（標題/值）各 1x2
  setMergedCenteredValue(row(4), col(7), row(4), col(8), "申請調課師");
  setMergedCenteredValue(row(5), col(7), row(5), col(8), meta.applicantTeacher || "");

  // 指定跨欄：時間區間 1x3
  setMergedCenteredValue(row(5), col(2), row(5), col(4), meta.dateRangeText || "");

  setWrappedValue(row(8), col(1), "節次");
  setWrappedValue(row(8), col(2), "時間");
  ["週一", "週二", "週三", "週四", "週五", "週六"].forEach((day, idx) => {
    setWrappedValue(row(8), col(3 + idx), day);
  });

  periods.forEach((period, idx) => {
    const rowNum = row(9 + idx);
    setWrappedValue(rowNum, col(1), period);
    setWrappedValue(rowNum, col(2), String(PERIOD_TIME_MAP[period] || "").replace("-", "\n|\n"));
    for (let weekday = 1; weekday <= 6; weekday += 1) {
      const lines = cellMap.get(`${weekday}-${period}`) || [];
      setWrappedValue(rowNum, col(weekday + 2), lines.join("\n\n"));
    }
  });

  // 指定跨欄：假別/原因 1x8
  setMergedAlignedValue(reasonRow, col(1), reasonRow, col(8), buildOfficialReasonText(meta), "left", "top");
  if (titleText) {
    setWrappedValue(reasonRow + 1, col(1), titleText);
  }
}

function writePerspectiveGridToSheet(ws, title, payload, meta, retainLabel, options = {}) {
  const startRow = Number(options.startRow || 1);
  const startCol = Number(options.startCol || 1);
  const applyColumnWidths = options.applyColumnWidths !== false;
  const applyRowHeights = options.applyRowHeights !== false;
  const row = (n) => startRow + n - 1;
  const col = (n) => startCol + n - 1;
  const days = ["週一", "週二", "週三", "週四", "週五", "週六"];
  const periods = Array.isArray(options.periods) && options.periods.length
    ? options.periods
    : getOfficialPeriods(payload.outcomes);
  const cellMap = buildOfficialCellMap(payload.outcomes);
  const reasonRow = row(9 + periods.length);
  const weekdayColumnWidth = 15.5;
  const periodColumnWidth = Math.max(2.25, measureCellTextWidth("節次") + 1.5);
  const timeColumnWidth = Math.max(4.625, Math.max(...periods.map((period) => measureCellTextWidth(String(PERIOD_TIME_MAP[period] || "").replace("-", "\n|\n"))), 0) + 1.75);
  const reasonText = buildOfficialReasonText(meta);

  if (applyColumnWidths) {
    ws.getColumn(col(1)).width = periodColumnWidth;
    ws.getColumn(col(2)).width = timeColumnWidth;
    for (let i = 3; i <= 8; i += 1) {
      ws.getColumn(col(i)).width = weekdayColumnWidth;
    }
  }

  ws.mergeCells(row(2), col(1), row(2), col(8));
  ws.getCell(row(2), col(1)).value = meta.headerTitle;
  ws.getCell(row(2), col(1)).font = { name: "標楷體", size: 12 };
  ws.getCell(row(2), col(1)).alignment = { horizontal: "center", vertical: "center" };
  if (applyRowHeights) {
    ws.getRow(row(2)).height = estimateRowHeight(meta.headerTitle, { fontSize: 12, widthChars: 40, minHeight: 18, maxHeight: 30 });
  }

  ws.getCell(row(3), col(2)).value = meta.serial;
  ws.getCell(row(3), col(2)).font = { name: "標楷體", size: 6 };
  ws.getCell(row(3), col(2)).alignment = { horizontal: "left", vertical: "center" };
  if (applyRowHeights) {
    ws.getRow(row(3)).height = estimateRowHeight(meta.serial, { fontSize: 6, widthChars: 26, minHeight: 9, maxHeight: 16 });
  }

  ws.mergeCells(row(4), col(2), row(4), col(4));
  ws.getCell(row(4), col(2)).value = `${retainLabel} 留存`;
  ws.getCell(row(4), col(2)).font = { name: "標楷體", size: 11 };
  ws.getCell(row(4), col(2)).alignment = { horizontal: "center", vertical: "center" };

  ws.mergeCells(row(4), col(7), row(4), col(8));
  ws.getCell(row(4), col(7)).value = "申請調課師";
  ws.getCell(row(4), col(7)).font = { name: "標楷體", size: 8 };
  ws.getCell(row(4), col(7)).alignment = { horizontal: "center", vertical: "center" };
  if (applyRowHeights) {
    ws.getRow(row(4)).height = estimateRowHeight(`${retainLabel} 留存申請調課師`, { fontSize: 10, widthChars: 20, minHeight: 18, maxHeight: 26 });
  }

  ws.mergeCells(row(5), col(2), row(5), col(4));
  ws.getCell(row(5), col(2)).value = meta.dateRangeText || "";
  ws.getCell(row(5), col(2)).font = { name: "標楷體", size: 9 };
  ws.getCell(row(5), col(2)).alignment = { horizontal: "center", vertical: "center" };

  ws.mergeCells(row(5), col(7), row(5), col(8));
  ws.getCell(row(5), col(7)).value = meta.applicantTeacher || "";
  ws.getCell(row(5), col(7)).font = { name: "標楷體", size: 10 };
  ws.getCell(row(5), col(7)).alignment = { horizontal: "center", vertical: "center" };
  if (applyRowHeights) {
    ws.getRow(row(5)).height = estimateRowHeight(`${meta.dateRangeText || ""}${meta.applicantTeacher || ""}`, { fontSize: 10, widthChars: 18, minHeight: 18, maxHeight: 28 });
  }

  ws.getCell(row(8), col(1)).value = "節次";
  ws.getCell(row(8), col(2)).value = "時間";
  [1, 2].forEach((n) => {
    ws.getCell(row(8), col(n)).font = { name: "標楷體", size: n === 1 ? 6 : 8 };
    ws.getCell(row(8), col(n)).alignment = { horizontal: "center", vertical: "center" };
  });
  days.forEach((day, idx) => {
    const cell = ws.getCell(row(8), col(idx + 3));
    cell.value = day;
    cell.font = { name: "標楷體", size: 9 };
    cell.alignment = { horizontal: "center", vertical: "center" };
  });
  if (applyRowHeights) {
    ws.getRow(row(8)).height = 15;
  }

  periods.forEach((period, idx) => {
    const rowNum = row(9 + idx);
    ws.getCell(rowNum, col(1)).value = period;
    ws.getCell(rowNum, col(1)).font = { name: "標楷體", size: 12 };
    ws.getCell(rowNum, col(1)).alignment = { horizontal: "center", vertical: "center" };

    const timeCell = ws.getCell(rowNum, col(2));
    timeCell.value = String(PERIOD_TIME_MAP[period] || "").replace("-", "\n|\n");
    timeCell.font = { name: "標楷體", size: 8 };
    timeCell.alignment = { horizontal: "center", vertical: "center", wrapText: true };

    for (let weekday = 1; weekday <= 6; weekday += 1) {
      const cell = ws.getCell(rowNum, col(weekday + 2));
      const lines = cellMap.get(`${weekday}-${period}`) || [];
      cell.value = lines.join("\n\n");
      cell.font = { name: "標楷體", size: 9 };
      cell.alignment = { horizontal: "center", vertical: "center", wrapText: true };
    }
    if (applyRowHeights) {
      ws.getRow(rowNum).height = 48.75;
    }
  });

  applyAllBorders(ws, row(8), row(8 + periods.length), col(1), col(8));

  ws.mergeCells(reasonRow, col(1), reasonRow, col(8));
  ws.getCell(reasonRow, col(1)).value = reasonText;
  ws.getCell(reasonRow, col(1)).font = { name: "標楷體", size: 12 };
  ws.getCell(reasonRow, col(1)).alignment = { horizontal: "left", vertical: "center", wrapText: true };
  if (applyRowHeights) {
    ws.getRow(reasonRow).height = estimateRowHeight(reasonText, { fontSize: 12, widthChars: 44, minHeight: 43.15, maxHeight: 96 });
  }

  return { endRow: reasonRow, endCol: col(8) };
}

async function loadExportLibraries() {
  if (!exportLibsPromise) {
    exportLibsPromise = (async () => {
      const ExcelJSGlobal = window && window.ExcelJS ? window.ExcelJS : null;
      const JSZipGlobal = window && window.JSZip ? window.JSZip : null;
      const htmlToImageGlobal = window && window.htmlToImage ? window.htmlToImage : null;

      if (!ExcelJSGlobal || !JSZipGlobal || !htmlToImageGlobal) {
        throw new Error("本地匯出套件未完整載入，請確認 app.runtime.js 已完整載入");
      }

      return {
        ExcelJS: ExcelJSGlobal,
        JSZip: JSZipGlobal,
        htmlToImage: htmlToImageGlobal
      };
    })();
  }
  return exportLibsPromise;
}

function writeSheetTableXlsx(ws, title, headers, rows) {
  ws.getCell("A1").value = title;
  ws.getCell("A1").font = { bold: true, size: 14 };
  headers.forEach((h, i) => {
    const cell = ws.getCell(3, i + 1);
    cell.value = h;
    cell.font = { bold: true };
  });
  rows.forEach((row, rIdx) => {
    row.forEach((v, cIdx) => {
      ws.getCell(4 + rIdx, cIdx + 1).value = v;
    });
  });
  ws.columns = headers.map(() => ({ width: 18 }));
}

function sanitizeSheetName(name) {
  return String(name || "Sheet")
    .replace(/[\\/*?:\[\]]/g, "_")
    .slice(0, 31) || "Sheet";
}

function columnNumberToName(num) {
  let n = Number(num || 0);
  if (!n) return "A";
  let name = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

async function buildWorkbookBufferFromDrafts(meta) {
  const { ExcelJS } = await loadExportLibraries();
  const workbook = new ExcelJS.Workbook();

  let printWs = null;
  let singleTemplateWs = null;
  try {
    const res = await fetch("./A4.xlsx");
    if (res.ok) {
      const buf = await res.arrayBuffer();
      await workbook.xlsx.load(buf);
      printWs = workbook.getWorksheet("列印A4") || workbook.worksheets[0] || null;
      singleTemplateWs = workbook.getWorksheet("教務處") || workbook.worksheets[1] || null;
    }
  } catch (_) {
    // fallback below
  }
  if (!printWs) {
    printWs = workbook.addWorksheet("列印A4");
  }
  if (!singleTemplateWs) {
    singleTemplateWs = workbook.addWorksheet("教務處");
  }
  printWs.name = "列印A4";
  singleTemplateWs.name = "教務處";

  const entries = buildExportSheetEntries();

  // 先清掉模板原教務處內容，填入最新教務處
  for (let r = 1; r <= 22; r += 1) {
    for (let c = 1; c <= 8; c += 1) {
      singleTemplateWs.getCell(r, c).value = null;
    }
  }
  writeTemplateFormBlock(singleTemplateWs, entries[0].payload, meta, entries[0].retainLabel, {
    startRow: 1,
    startCol: 1,
    periods: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    titleText: entries[0].title
  });

  // 保留並新增原本每個視角工作表（以教務處模板複製）
  for (let i = 1; i < entries.length; i += 1) {
    const entry = entries[i];
    const ws = workbook.addWorksheet(entry.sheetName);
    copyTemplateLayoutToSheet(singleTemplateWs, ws, { startRow: 1, endRow: 22, startCol: 1, endCol: 8 });
    writeTemplateFormBlock(ws, entry.payload, meta, entry.retainLabel, {
      startRow: 1,
      startCol: 1,
      periods: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      titleText: entry.title
    });
    ws.pageSetup = {
      paperSize: 9,
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: {
        left: 0.1968503937007874,
        right: 0.1968503937007874,
        top: 0.1968503937007874,
        bottom: 0.1968503937007874,
        header: 0,
        footer: 0
      },
      printArea: "A1:H22"
    };
  }

  // 列印A4：維持模板格式，但頁面只向右延展
  const pageBlockHeight = 22;
  const pageBlockWidth = 18;
  const fixedPeriods = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const totalPages = Math.max(1, Math.ceil(entries.length / 2));

  // 先清除列印模板區域的舊值
  const clearCols = Math.max(17, totalPages * pageBlockWidth - 1);
  for (let r = 1; r <= pageBlockHeight; r += 1) {
    for (let c = 1; c <= clearCols; c += 1) {
      printWs.getCell(r, c).value = null;
    }
  }

  for (let i = 0; i < entries.length; i += 2) {
    const pageIndex = Math.floor(i / 2);
    const pageStartRow = 1;
    const pageStartCol = 1 + (pageIndex * pageBlockWidth);
    const left = entries[i];
    const right = entries[i + 1];

    if (pageIndex > 0) {
      copyTemplateBlockWithinSheet(printWs, {
        srcStartRow: 1,
        srcEndRow: 22,
        srcStartCol: 1,
        srcEndCol: 17,
        dstStartRow: pageStartRow,
        dstStartCol: pageStartCol,
        copyValues: false
      });
    }

    writeTemplateFormBlock(printWs, left.payload, meta, left.retainLabel, {
      startRow: pageStartRow,
      startCol: pageStartCol,
      periods: fixedPeriods,
      titleText: left.title
    });

    if (right) {
      writeTemplateFormBlock(printWs, right.payload, meta, right.retainLabel, {
        startRow: pageStartRow,
        startCol: pageStartCol + 9,
        periods: fixedPeriods,
        titleText: right.title
      });
    }
  }

  printWs.pageSetup = {
    paperSize: 9,
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    pageOrder: "overThenDown",
    margins: {
      left: 0.12,
      right: 0.12,
      top: 0.12,
      bottom: 0.12,
      header: 0,
      footer: 0
    },
    horizontalCentered: true,
    verticalCentered: false
  };
  const lastCol = totalPages * pageBlockWidth - 1;
  printWs.pageSetup.printArea = `A1:${columnNumberToName(lastCol)}22`;

  return workbook.xlsx.writeBuffer();
}

async function buildJpgPreviewsFromDrafts(meta, workbookBuffer = null) {
  const { htmlToImage, ExcelJS } = await loadExportLibraries();
  const outputs = [];
  const entries = buildExportSheetEntries();
  const PAGE_GAP = 10;
  const BOARD_PADDING_X = 12;

  const excelColumnWidthToPixels = (width) => {
    const w = Number(width);
    if (!Number.isFinite(w) || w <= 0) return 64;
    // Excel 欄寬轉像素近似公式（與桌面 Excel 一致）
    return Math.floor(((256 * w + Math.floor(128 / 7)) / 256) * 7);
  };

  const resolveOfficialColumnPixelWidths = async () => {
    const fallbackUnits = [2.25, 4.625, 15.5, 15.5, 15.5, 15.5, 15.5, 15.5];
    try {
      const wb = new ExcelJS.Workbook();
      if (workbookBuffer) {
        await wb.xlsx.load(workbookBuffer);
      } else {
        const res = await fetch("./A4.xlsx");
        if (!res.ok) throw new Error("template fetch failed");
        const buf = await res.arrayBuffer();
        await wb.xlsx.load(buf);
      }

      const ws = wb.getWorksheet("教務處") || wb.getWorksheet("列印A4") || wb.worksheets[0] || null;
      if (!ws) throw new Error("template worksheet missing");

      const units = [];
      for (let i = 1; i <= 8; i += 1) {
        const raw = Number(ws.getColumn(i).width);
        units.push(Number.isFinite(raw) && raw > 0 ? raw : fallbackUnits[i - 1]);
      }
      return units.map((u) => excelColumnWidthToPixels(u));
    } catch (_) {
      return fallbackUnits.map((u) => excelColumnWidthToPixels(u));
    }
  };

  const COL_PX = await resolveOfficialColumnPixelWidths();
  const PERIOD_CELL_WIDTH = COL_PX[0];
  const TIME_CELL_WIDTH = COL_PX[1];
  const DAY_WIDTHS = COL_PX.slice(2, 8);
  const TABLE_INNER_WIDTH = COL_PX.reduce((acc, v) => acc + v, 0);
  const BOARD_CAPTURE_WIDTH = TABLE_INNER_WIDTH + (BOARD_PADDING_X * 2);
  const KEEP_BLOCK_WIDTH = COL_PX[1] + COL_PX[2] + COL_PX[3];
  const APPLICANT_BLOCK_WIDTH = COL_PX[6] + COL_PX[7];

  const setupCaptureHost = (el, width) => {
    el.style.position = "relative";
    el.style.left = "0";
    el.style.top = "0";
    el.style.width = `${width}px`;
    el.style.background = "#fff";
    el.style.transform = "none";
    el.style.display = "block";
    el.style.pointerEvents = "none";
    el.style.zIndex = "1";
  };

  const createCaptureStage = () => {
    const stage = document.createElement("div");
    stage.style.position = "fixed";
    stage.style.left = "0";
    stage.style.top = "0";
    stage.style.width = "0";
    stage.style.height = "0";
    stage.style.overflow = "visible";
    stage.style.zIndex = "-1";
    stage.style.pointerEvents = "none";
    stage.style.background = "transparent";
    document.body.appendChild(stage);
    return stage;
  };

  const isLikelyBlankCanvas = (canvas) => {
    const w = Math.max(1, canvas.width);
    const h = Math.max(1, canvas.height);
    if (w < 50 || h < 50) return true;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return true;

    const sampleCols = 18;
    const sampleRows = 18;
    let nonWhiteCount = 0;
    let opaqueCount = 0;
    for (let iy = 0; iy < sampleRows; iy += 1) {
      const y = Math.min(h - 1, Math.floor((iy / (sampleRows - 1)) * (h - 1)));
      for (let ix = 0; ix < sampleCols; ix += 1) {
        const x = Math.min(w - 1, Math.floor((ix / (sampleCols - 1)) * (w - 1)));
        const px = ctx.getImageData(x, y, 1, 1).data;
        const r = px[0];
        const g = px[1];
        const b = px[2];
        const a = px[3];
        if (a > 8) opaqueCount += 1;
        if (a > 8 && (r < 246 || g < 246 || b < 246)) {
          nonWhiteCount += 1;
        }
      }
    }

    if (opaqueCount < 30) return true;
    return nonWhiteCount < 8;
  };

  const captureAsJpeg = async (el, quality = 0.95) => {
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (_) {
        // ignore fonts loading error
      }
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const attempts = [
      { pixelRatio: 2, cacheBust: true, backgroundColor: "#ffffff", skipAutoScale: true },
      { pixelRatio: 1.5, cacheBust: true, backgroundColor: "#ffffff", skipAutoScale: false },
      { pixelRatio: 1, cacheBust: true, backgroundColor: "#ffffff", skipAutoScale: false }
    ];

    let lastCanvas = null;
    for (const opts of attempts) {
      const canvas = await htmlToImage.toCanvas(el, opts);
      lastCanvas = canvas;
      if (!isLikelyBlankCanvas(canvas)) {
        return canvas.toDataURL("image/jpeg", quality);
      }
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }

    return lastCanvas ? lastCanvas.toDataURL("image/jpeg", quality) : "";
  };

  const renderOfficialBoard = (host, title, retainLabel, payload) => {
    const periods = getOfficialPeriods(payload.outcomes);
    const cellMap = buildOfficialCellMap(payload.outcomes);
    const colGroup = `
      <colgroup>
        <col style="width:${PERIOD_CELL_WIDTH}px;">
        <col style="width:${TIME_CELL_WIDTH}px;">
        <col style="width:${DAY_WIDTHS[0]}px;">
        <col style="width:${DAY_WIDTHS[1]}px;">
        <col style="width:${DAY_WIDTHS[2]}px;">
        <col style="width:${DAY_WIDTHS[3]}px;">
        <col style="width:${DAY_WIDTHS[4]}px;">
        <col style="width:${DAY_WIDTHS[5]}px;">
      </colgroup>
    `;
    const tableRows = periods.map((period) => {
      const timeText = String(PERIOD_TIME_MAP[period] || "").replace("-", "<br>|<br>");
      const dayCells = Array.from({ length: 6 }, (_, offset) => {
        const weekday = offset + 1;
        const lines = cellMap.get(`${weekday}-${period}`) || [];
        return `<td data-day="${weekday}" data-period="${period}" style="border:1px solid #000;height:48px;text-align:center;vertical-align:middle;white-space:pre-line;padding:4px;">${lines.map((line) => String(line).replace(/\n/g, "<br>")).join("<br><br>")}</td>`;
      }).join("");
      return `<tr><td style="border:1px solid #000;text-align:center;vertical-align:middle;">${period}</td><td style="border:1px solid #000;text-align:center;vertical-align:middle;line-height:1.1;">${timeText}</td>${dayCells}</tr>`;
    }).join("");

    host.innerHTML = `
      <div style="font-family:'DFKai-SB','BiauKai',serif;color:#000;width:${BOARD_CAPTURE_WIDTH}px;background:#fff;padding:12px ${BOARD_PADDING_X}px;">
        <div style="text-align:center;font-size:22px;line-height:1.2;">${meta.headerTitle}</div>
        <div style="font-size:11px;line-height:1.1;margin-top:4px;margin-left:${PERIOD_CELL_WIDTH}px;">${meta.serial}</div>
        <div style="display:flex;justify-content:space-between;align-items:stretch;margin-top:6px;width:${TABLE_INNER_WIDTH}px;">
          <div style="width:${KEEP_BLOCK_WIDTH}px;">
            <div style="border:1px solid #000;text-align:center;font-size:18px;padding:2px 0;">${retainLabel} 留存</div>
            <div style="border:1px solid #000;border-top:none;text-align:center;font-size:16px;padding:4px 0;min-height:28px;">${meta.dateRangeText || ""}</div>
          </div>
          <div style="width:${APPLICANT_BLOCK_WIDTH}px;">
            <div style="border:1px solid #000;text-align:center;font-size:14px;padding:2px 0;">申請調課師</div>
            <div style="border:1px solid #000;border-top:none;text-align:center;font-size:16px;padding:4px 0;min-height:28px;">${meta.applicantTeacher || ""}</div>
          </div>
        </div>
        <div style="margin-top:10px;">
          <div class="mini-grid-wrap" style="position:relative;">
          <table class="adjustment-grid mini-grid" style="border-collapse:collapse;width:${TABLE_INNER_WIDTH}px;table-layout:fixed;font-size:14px;">
            ${colGroup}
            <thead>
              <tr>
                <th style="border:1px solid #000;padding:2px 0;">節次</th>
                <th style="border:1px solid #000;padding:2px 0;">時間</th>
                <th style="border:1px solid #000;">週一</th>
                <th style="border:1px solid #000;">週二</th>
                <th style="border:1px solid #000;">週三</th>
                <th style="border:1px solid #000;">週四</th>
                <th style="border:1px solid #000;">週五</th>
                <th style="border:1px solid #000;">週六</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          </div>
        </div>
        <div style="margin-top:8px;width:${TABLE_INNER_WIDTH}px;font-size:18px;white-space:pre-line;">${buildOfficialReasonText(meta)}</div>
        <div style="margin-top:6px;width:${TABLE_INNER_WIDTH}px;font-size:12px;display:flex;justify-content:space-between;align-items:flex-end;">
          <span>${title}</span>
          <span style="display:inline-flex;align-items:center;justify-content:center;width:112px;height:112px;border:2.5px solid rgba(185,28,28,0.95);border-radius:999px;color:rgba(185,28,28,0.95);font-size:10px;line-height:1.25;text-align:center;background:transparent;">臺北市私立復興實驗高級中學<br>教學組<br>${meta.exportDateText}<br>課務專用</span>
        </div>
      </div>
    `;

    if (meta.arrowAssist) {
      renderMiniGridArrows(host, payload.links || []);
    }
  };

  const makeSheetJpg = async (entry) => {
    const stage = createCaptureStage();
    const host = document.createElement("div");
    setupCaptureHost(host, BOARD_CAPTURE_WIDTH + 28);
    stage.appendChild(host);
    renderOfficialBoard(host, entry.title, entry.retainLabel, entry.payload);

    const dataUrl = await captureAsJpeg(host, 0.95);
    stage.remove();
    const fileName = `${sanitizeFileNameBase(entry.sheetName) || "Sheet"}.jpg`;
    outputs.push({ name: fileName, b64: dataUrl.split(",")[1] || "" });
  };

  for (const entry of entries) {
    await makeSheetJpg(entry);
  }

  // 對應列印A4：每頁各輸出一張，避免超寬縮圖導致不可讀
  const totalPages = Math.max(1, Math.ceil(entries.length / 2));
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
    const leftEntry = entries[pageIndex * 2];
    const rightEntry = entries[pageIndex * 2 + 1] || null;
    const stage = createCaptureStage();
    const pageHost = document.createElement("div");
    setupCaptureHost(pageHost, (BOARD_CAPTURE_WIDTH * 2) + PAGE_GAP + 36);
    pageHost.style.display = "grid";
    pageHost.style.gridTemplateColumns = `${BOARD_CAPTURE_WIDTH}px ${BOARD_CAPTURE_WIDTH}px`;
    pageHost.style.columnGap = `${PAGE_GAP}px`;
    pageHost.style.alignItems = "start";
    pageHost.style.padding = "8px";

    const left = document.createElement("div");
    renderOfficialBoard(left, leftEntry.title, leftEntry.retainLabel, leftEntry.payload);
    pageHost.appendChild(left);

    const right = document.createElement("div");
    if (rightEntry) {
      renderOfficialBoard(right, rightEntry.title, rightEntry.retainLabel, rightEntry.payload);
    }
    pageHost.appendChild(right);

    stage.appendChild(pageHost);
    const pageDataUrl = await captureAsJpeg(pageHost, 0.95);
    stage.remove();
    const pageFileName = totalPages === 1 ? "列印A4.jpg" : `列印A4_p${pageIndex + 1}.jpg`;
    outputs.push({ name: pageFileName, b64: pageDataUrl.split(",")[1] || "" });
  }

  return outputs;
}

async function exportWorkbookOnly() {
  const meta = buildExportMetaFromForm();
  const suggest = buildExportFileBaseName(meta);
  const userName = prompt("請輸入 Excel 檔名（不含副檔名）", suggest);
  if (userName === null) return;
  const safeName = String(userName || suggest).trim() || suggest;

  const buffer = await buildWorkbookBufferFromDrafts(meta);
  triggerBlobDownload(`${safeName}.xlsx`, new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  }));
}

async function exportWorkbookAndJpgZip() {
  const { JSZip } = await loadExportLibraries();
  const meta = buildExportMetaFromForm();
  const suggest = buildExportFileBaseName(meta);
  const userName = prompt("請輸入下載壓縮檔檔名（不含副檔名）", suggest);
  if (userName === null) return;
  const safeName = String(userName || suggest).trim() || suggest;

  const zip = new JSZip();
  const xlsxBuffer = await buildWorkbookBufferFromDrafts(meta);
  zip.file(`${safeName}.xlsx`, xlsxBuffer);

  const jpgs = await buildJpgPreviewsFromDrafts(meta, xlsxBuffer);
  jpgs.forEach((img) => {
    zip.file(`jpg/${img.name}`, img.b64, { base64: true });
  });

  const zipBlob = await zip.generateAsync({ type: "blob" });
  triggerBlobDownload(`${safeName}.zip`, zipBlob);

  return { meta, safeName };
}

function hasTeacherClassCourse(teacherName, className, targetDate) {
  const boardData = buildWeeklyBoard({
    viewMode: "teacher",
    target: teacherName,
    anchorDate: targetDate,
    events: getAppliedEvents({ includeDraftSimulation: true }),
    baseScheduleData
  });

  for (const items of Object.values(boardData.cells)) {
    for (const item of items) {
      if (item.className === className) {
        return true;
      }
    }
  }
  return false;
}

function computeAdjustmentChain() {
  const chain = [];
  if (!boardSequence.length) return chain;

  const selectedSlots = boardSelections.map((slot, idx) => ({ slot, idx })).filter(item => item.slot);
  if (!selectedSlots.length) return chain;

  const anchorDate = el.anchorDate.value || today();

  for (let i = 0; i < boardSequence.length; i += 1) {
    const slot = boardSelections[i] || null;
    if (!slot) continue;

    let fromLabel = formatSlotLabel(slot);
    let toLabel = "";
    let type = "";

    const nextBoard = boardSequence[i + 1] || null;
    const nextSlot = boardSelections[i + 1] || null;

    if (nextSlot) {
      // 跨班或被標記時，強制以代課處理
      const nextTeacher = nextBoard.target;
      const currentClass = slot.className;
      const isForcedSubstitute = forcedSubstituteLinks.has(i) || currentClass !== nextSlot.className;

      if (isForcedSubstitute) {
        toLabel = nextTeacher;
        type = "代課";
      } else {
        // 檢查下一個老師是否有當前班級的課程
        const hasCommonClass = hasTeacherClassCourse(nextTeacher, currentClass, anchorDate);

        if (hasCommonClass) {
          // 兩個老師都有同班課程，可以調課
          toLabel = formatSlotLabel(nextSlot);
          type = "調課";
        } else {
          // 下一個老師沒有該班課程，只能代課
          toLabel = nextTeacher;
          type = "代課";
        }
      }
    } else if (nextBoard) {
      // 下一個課表存在但沒被選中，代課
      toLabel = nextBoard.target;
      type = "代課";
    } else if (i === boardSequence.length - 1) {
      // 最後一個課表不再自動回頭串接到第1個課表，避免二次交換把結果覆蓋回去
      // 若需要回圈異動，應由使用者明確再新增下一步操作。
    }

    if (type) {
      chain.push({
        boardIndex: i,
        boardTarget: boardSequence[i].target,
        from: slot,
        fromLabel,
        to: nextSlot || (i === boardSequence.length - 1 && selectedSlots.length > 1 ? boardSelections[0] : null),
        toLabel,
        type
      });
    }
  }

  return chain;
}

function renderAdjustmentSummary() {
  renderAdjustmentResult();

  const entries = [];
  const chain = computeAdjustmentChain();
  const chainMap = new Map(chain.map((item) => [item.boardIndex, item]));
  const { outcomeByKey } = resolveAdjustmentOutcomes(chain);

  if (!boardSequence.length) {
    el.adjustmentSummary.innerHTML = '<div class="adjustment-empty">尚未產生課表</div>';
    return;
  }

  for (let i = 0; i < boardSequence.length; i += 1) {
    const board = boardSequence[i];
    const slot = boardSelections[i] || null;
    const nextBoard = boardSequence[i + 1] || null;
    let detail = '尚未選課';
    const chainItem = chainMap.get(i) || null;
    const resolved = slot ? outcomeByKey.get(getAdjustmentSlotKey(slot)) : null;

    if (!slot) {
      if (nextBoard) {
        detail = `等待第${i + 1}個課表點選課程`;
      }
    } else if (resolved) {
      const simpleText = formatResolvedOutcomeLine(resolved);
      const changed = slot.subject !== resolved.subject || slot.teacher !== resolved.teacher;
      let detailText = `${formatDateMD(slot.date)} ${slot.className} ${slot.period}節 ${slot.subject} ${slot.teacher}`;
      if (changed) {
        detailText += ` 調課為 ${resolved.subject} ${resolved.teacher}`;
      }
      const actionTag = resolved.lastAction ? ` (${resolved.lastAction})` : "";
      detail = adjustmentViewMode === "detail"
        ? `<span class="adjustment-detail">${detailText}${actionTag}</span>`
        : simpleText;
    } else if (chainItem) {
      detail = `${chainItem.fromLabel} ${chainItem.type === "調課" ? "調課為" : "由"} ${chainItem.toLabel || "代課"}`;
    } else if (nextBoard) {
      detail = `${formatSlotLabel(slot)} 由${nextBoard.target}代課`;
    } else {
      detail = `${formatSlotLabel(slot)} 代課處理`;
    }

    entries.push(`
      <div class="adjustment-item">
        <strong>第${i + 1}個課表：${board.target}</strong>
        <div>${detail}</div>
      </div>
    `);
  }

  el.adjustmentSummary.innerHTML = entries.join('');
}

function updateSlotCandidatePanel(context) {
  if (!context || !context.className || !context.date || !context.period) {
    if (el.slotCandidateTitle) {
      el.slotCandidateTitle.textContent = "UF2 操控面板";
    }
    renderTeacherItems(el.slotSameSubject, [], { clickable: false });
    renderTeacherItems(el.slotHomeroom, [], { clickable: false });
    renderTeacherItems(el.slotClassFree, [], { clickable: false });
    renderTeacherItems(el.slotClassBusy, [], { clickable: false });
    renderTeacherItems(el.slotCampusFree, [], { clickable: false });
    renderTeacherItems(el.slotCampusBusy, [], { clickable: false });
    if (el.slotCandidatePanel) {
      el.slotCandidatePanel.classList.remove("hidden");
      if (slotPanelPinned) {
        resetSlotPanelPosition();
      }
    }
    return;
  }

  const teacherMap = getTeacherAssignmentsAtSlot(context.date, context.period);
  const allTeachers = getAllTeacherNames();
  const classTeachers = getClassTeacherList(context.className);
  const homeroom = getHomeroomTeacher(context.className);
  const classTeacherSet = new Set(classTeachers);
  const classTeachersNoHomeroom = classTeachers.filter((teacher) => teacher !== homeroom);
  const classFree = classTeachersNoHomeroom.filter((teacher) => !teacherMap.has(teacher));
  const classBusy = classTeachersNoHomeroom.filter((teacher) => teacherMap.has(teacher));
  const campusTeachers = allTeachers.filter((teacher) => !classTeacherSet.has(teacher));
  const campusFree = campusTeachers.filter((teacher) => !teacherMap.has(teacher));
  const campusBusy = campusTeachers.filter((teacher) => teacherMap.has(teacher));

  const mainSubject = String(el.mainSubjectSelect && el.mainSubjectSelect.value || "").trim();
  const mainTeacher = String(el.mainTeacherSelect && el.mainTeacherSelect.value || "").trim();
  const applySubject = mainSubject || String(context.subject || "").trim();
  const applyTeacher = mainTeacher || String(context.teacher || "").trim();
  const sameSubjectTeachers = applySubject && dbTeacherCatalog.has(applySubject)
    ? Array.from(dbTeacherCatalog.get(applySubject)).filter((teacher) => teacher !== applyTeacher).sort((a, b) => a.localeCompare(b, "zh-Hant"))
    : [];

  const dateText = context.date.replace(/-/g, "/");
  const boardText = context.boardIndex >= 0 ? `第${context.boardIndex + 1}個課表` : "目前課表";
  el.slotCandidateTitle.textContent = `時段候選老師（${boardText}｜${context.className} / ${dateText} 第${context.period}節）`;

  const compactCourseMeta = (courseItems, emptyText) => {
    if (!courseItems.length) return emptyText;
    return courseItems
      .slice(0, 3)
      .map((item) => `${item.className}${item.subject ? `-${item.subject}` : ""}`)
      .join("、");
  };

  renderTeacherItems(
    el.slotSameSubject,
    sameSubjectTeachers.map((teacher) => {
      const busyCourses = teacherMap.get(teacher) || [];
      const isFree = busyCourses.length === 0;
      return {
        teacher,
        label: teacher,
        meta: applySubject
          ? `同科:${applySubject}｜${isFree ? "無課務" : compactCourseMeta(busyCourses, "無課務")}`
          : ""
      };
    })
  );

  const homeroomItems = [];
  if (homeroom) {
    const homeroomBusyCourses = teacherMap.get(homeroom) || [];
    const isFree = homeroomBusyCourses.length === 0;
    homeroomItems.push({
      teacher: homeroom,
      label: homeroom,
      meta: isFree ? "導師｜無課務" : `導師｜${compactCourseMeta(homeroomBusyCourses, "有課務")}`
    });
  }
  renderTeacherItems(el.slotHomeroom, homeroomItems);

  const classFreeItems = [];
  for (const teacher of classFree) {
    classFreeItems.push({ teacher, label: teacher, meta: "同班任課｜無課務" });
  }
  renderTeacherItems(el.slotClassFree, classFreeItems);

  const classBusyItems = classBusy.map((teacher) => ({
    teacher,
    label: teacher,
    meta: compactCourseMeta(teacherMap.get(teacher) || [], "同班任課｜有課務")
  }));
  renderTeacherItems(el.slotClassBusy, classBusyItems);

  renderTeacherItems(
    el.slotCampusFree,
    campusFree.map((teacher) => ({ teacher, label: teacher, meta: "全校(扣除同班)｜無課務" }))
  );

  renderTeacherItems(
    el.slotCampusBusy,
    campusBusy.map((teacher) => ({
      teacher,
      label: teacher,
      meta: compactCourseMeta(teacherMap.get(teacher) || [], "全校(扣除同班)｜有課務")
    }))
  );

  if (slotPanelPinned) {
    resetSlotPanelPosition();
  }
  el.slotCandidatePanel.classList.remove("hidden");
}

function getEventSubjectTeacher(eventItem) {
  const subject = (eventItem.toSubject || eventItem.fromSubject || "").trim();
  const teacher = (eventItem.toTeacher || eventItem.fromTeacher || "").trim();
  return { subject, teacher };
}

function buildTeacherCatalog() {
  const subjectMap = new Map();
  for (const eventItem of getAppliedEvents({ includeDraftSimulation: false })) {
    const { subject, teacher } = getEventSubjectTeacher(eventItem);
    if (!subject || !teacher) continue;
    if (!subjectMap.has(subject)) subjectMap.set(subject, new Set());
    subjectMap.get(subject).add(teacher);
  }
  return subjectMap;
}

function extractCatalogFromSchedule(scheduleData) {
  const map = new Map();
  const subjectTeachers = scheduleData && scheduleData.subjectTeachers ? scheduleData.subjectTeachers : {};
  const classMaps = Object.values(subjectTeachers);

  for (const classMap of classMaps) {
    if (!classMap || typeof classMap !== "object") continue;
    for (const [subjectRaw, teacherRaw] of Object.entries(classMap)) {
      const subject = String(subjectRaw || "").trim();
      const teacher = String(teacherRaw || "").trim();
      if (!subject || !teacher) continue;
      if (!map.has(subject)) map.set(subject, new Set());
      map.get(subject).add(teacher);
    }
  }

  return map;
}

function extractClassesFromSchedule(scheduleData) {
  const schedules = scheduleData && scheduleData.schedules ? scheduleData.schedules : {};
  return Object.keys(schedules).sort((a, b) => a.localeCompare(b, "zh-Hant"));
}

async function loadTeacherCatalogFromDatabase() {
  if (baseScheduleData && baseScheduleData.schedules) {
    dbTeacherCatalog = extractCatalogFromSchedule(baseScheduleData);
    dbClasses = extractClassesFromSchedule(baseScheduleData);
    if (!currentScheduleSourceLabel || currentScheduleSourceLabel === "尚未設定原始課表") {
      currentScheduleSourceLabel = "目前學期原始課表";
    }
    return;
  }

  baseScheduleData = null;
  dbTeacherCatalog = new Map();
  dbClasses = [];
  currentScheduleSourceLabel = "尚未設定原始課表";
}

function mergeCatalog(baseMap, extraMap) {
  const merged = new Map();

  for (const [subject, teachers] of baseMap.entries()) {
    merged.set(subject, new Set(teachers));
  }

  for (const [subject, teachers] of extraMap.entries()) {
    if (!merged.has(subject)) merged.set(subject, new Set());
    for (const teacher of teachers) {
      merged.get(subject).add(teacher);
    }
  }

  return merged;
}

function updateMainTargetDisplay() {
  if (el.viewMode.value === "teacher") {
    const subject = el.mainSubjectSelect.value.trim();
    const teacher = el.mainTeacherSelect.value.trim();
    el.mainTargetDisplay.value = subject && teacher ? `${subject} / ${teacher}` : "";
    el.mainTargetDisplay.placeholder = "請先選擇科目與教師";
    return;
  }

  el.mainTargetDisplay.value = el.mainClassSelect.value.trim();
  el.mainTargetDisplay.placeholder = "請先選擇班級";
}

function setOpsCompactMode(enabled) {
  isOpsCompactMode = Boolean(enabled);
  const opsGrid = document.querySelector(".ops-grid");
  if (opsGrid) {
    opsGrid.classList.toggle("hidden", isOpsCompactMode);
  }
  if (el.conflictBanner) {
    el.conflictBanner.classList.toggle("hidden", isOpsCompactMode || !el.conflictBanner.textContent.trim());
  }
  if (el.opsCompactBar) {
    el.opsCompactBar.classList.toggle("hidden", !isOpsCompactMode);
  }
  if (el.opsCompactText) {
    const modeText = el.viewMode.value === "teacher" ? "教師" : "班級";
    const targetText = el.mainTargetDisplay && el.mainTargetDisplay.value ? el.mainTargetDisplay.value : "未設定";
    el.opsCompactText.textContent = `${modeText}主查詢：${targetText}`;
  }
}

function beginSlotPanelDrag(event) {
  if (!el.slotCandidatePanel || !el.slotCandidateHeader) return;
  if (event.target.closest("button")) return;
  const rect = el.slotCandidatePanel.getBoundingClientRect();
  slotPanelDragState = {
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top
  };
  slotPanelPinned = false;
  if (el.slotCandidatePinBtn) {
    el.slotCandidatePinBtn.textContent = "取消置頂";
  }
  event.preventDefault();
}

function moveSlotPanel(event) {
  if (!slotPanelDragState || !el.slotCandidatePanel) return;
  const left = Math.max(8, event.clientX - slotPanelDragState.offsetX);
  const top = Math.max(8, event.clientY - slotPanelDragState.offsetY);
  el.slotCandidatePanel.style.left = `${left}px`;
  el.slotCandidatePanel.style.top = `${top}px`;
  el.slotCandidatePanel.style.right = "auto";
}

function endSlotPanelDrag() {
  slotPanelDragState = null;
}

function resetSlotPanelPosition() {
  if (!el.slotCandidatePanel) return;
  el.slotCandidatePanel.style.left = "";
  el.slotCandidatePanel.style.top = "";
  el.slotCandidatePanel.style.right = "18px";
}

function populateMainClassSelector() {
  const classSet = new Set(dbClasses);
  for (const eventItem of getAppliedEvents({ includeDraftSimulation: false })) {
    if (eventItem.className) classSet.add(String(eventItem.className).trim());
  }

  const classes = Array.from(classSet).filter(Boolean).sort((a, b) => a.localeCompare(b, "zh-Hant"));
  const current = el.mainClassSelect.value;
  el.mainClassSelect.innerHTML = [
    "<option value=\"\">請先選擇班級</option>",
    ...classes.map((c) => `<option value=\"${c}\">${c}</option>`)
  ].join("");

  if (classes.includes(current)) {
    el.mainClassSelect.value = current;
  }

  updateMainTargetDisplay();
}

function populateMainTeacherSelectors() {
  const eventCatalog = buildTeacherCatalog();
  const catalog = mergeCatalog(dbTeacherCatalog, eventCatalog);
  const subjects = Array.from(catalog.keys()).sort((a, b) => a.localeCompare(b, "zh-Hant"));
  const currentSubject = el.mainSubjectSelect.value;
  const currentTeacher = el.mainTeacherSelect.value;

  el.mainSubjectSelect.innerHTML = [
    "<option value=\"\">請先選擇科目</option>",
    ...subjects.map((s) => `<option value=\"${s}\">${s}</option>`)
  ].join("");

  if (subjects.includes(currentSubject)) {
    el.mainSubjectSelect.value = currentSubject;
  }

  const selectedSubject = el.mainSubjectSelect.value;
  const teachers = selectedSubject && catalog.has(selectedSubject)
    ? Array.from(catalog.get(selectedSubject)).sort((a, b) => a.localeCompare(b, "zh-Hant"))
    : [];

  el.mainTeacherSelect.innerHTML = [
    "<option value=\"\">請先選擇教師</option>",
    ...teachers.map((t) => `<option value=\"${t}\">${t}</option>`)
  ].join("");

  if (teachers.includes(currentTeacher)) {
    el.mainTeacherSelect.value = currentTeacher;
  }

  updateMainTargetDisplay();
}

function syncMainTargetVisibility() {
  const isTeacherMode = el.viewMode.value === "teacher";
  el.mainTargetTeacherWrap.classList.toggle("hidden", !isTeacherMode);
  el.mainClassWrap.classList.toggle("hidden", isTeacherMode);
  updateMainTargetDisplay();
  if (isOpsCompactMode) {
    setOpsCompactMode(true);
  }
}

function getMainTargetValue() {
  if (el.viewMode.value === "teacher") {
    return el.mainTeacherSelect.value.trim();
  }
  return el.mainClassSelect.value.trim();
}

function setTeacherMainTarget(subject, teacher) {
  if (el.viewMode.value !== "teacher") return;

  populateMainTeacherSelectors();
  let effectiveSubject = subject;
  if (!effectiveSubject && teacher) {
    effectiveSubject = pickSubjectForTeacher(teacher);
  }

  if (effectiveSubject) {
    const hasSubject = Array.from(el.mainSubjectSelect.options).some((opt) => opt.value === effectiveSubject);
    if (hasSubject) {
      el.mainSubjectSelect.value = effectiveSubject;
      populateMainTeacherSelectors();
    }
  }

  if (teacher) {
    const hasTeacher = Array.from(el.mainTeacherSelect.options).some((opt) => opt.value === teacher);
    if (hasTeacher) {
      el.mainTeacherSelect.value = teacher;
    }
  }

  updateMainTargetDisplay();
}

function setClassMainTarget(className) {
  const value = String(className || "").trim();
  if (!value) return;
  const exists = Array.from(el.mainClassSelect.options).some((opt) => opt.value === value);
  if (exists) {
    el.mainClassSelect.value = value;
    updateMainTargetDisplay();
  }
}

function resetBoardSequence() {
  const target = getMainTargetValue();
  boardSequence = target ? [{ target, kind: el.viewMode.value }] : [];
  boardSelections = boardSequence.map(() => null);
  activeBoardIndex = 0;
  forcedSubstituteLinks.clear();
}

function appendTeacherBoard(teacher) {
  const target = String(teacher || "").trim();
  if (!target) return;

  if (el.viewMode.value !== "teacher") {
    el.viewMode.value = "teacher";
    syncMainTargetVisibility();
  }

  if (!boardSequence.length) {
    resetBoardSequence();
  }

  if (!boardSequence.length) return;

  if (activeBoardIndex < boardSequence.length - 1) {
    boardSequence = boardSequence.slice(0, activeBoardIndex + 1);
    boardSelections = boardSelections.slice(0, activeBoardIndex + 1);
    forcedSubstituteLinks.clear();
  }

  const currentSlot = boardSelections[activeBoardIndex] || null;
  const previousSlot = activeBoardIndex > 0 ? boardSelections[activeBoardIndex - 1] || null : null;
  if (currentSlot && previousSlot && currentSlot.className !== previousSlot.className) {
    alert("此筆已判定為代課處理，不能再繼續選擇下一位老師。");
    return;
  }

  const lastBoard = boardSequence.length ? boardSequence[boardSequence.length - 1] : null;
  const lastTarget = lastBoard && lastBoard.target ? lastBoard.target : "";
  if (lastTarget === target) {
    activeBoardIndex = boardSequence.length - 1;
    renderBoards();
    return;
  }

  const selectedSlot = boardSelections[activeBoardIndex] || null;
  if (!selectedSlot && activeBoardIndex > 0) {
    // 當前課表未選課，且不是第一個課表，則替換老師而非新增
    boardSequence[activeBoardIndex] = { target, kind: "teacher" };
  } else {
    // 添加新課表
    boardSequence.push({ target, kind: "teacher" });
    boardSelections.push(null);
  }
  activeBoardIndex = boardSequence.length - 1;
  renderBoards();

  requestAnimationFrame(() => {
    const card = document.querySelector(`.board-card[data-board-index="${activeBoardIndex}"]`);
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  });
}

function updateBoardChainFromMainTarget() {
  const target = getMainTargetValue();
  if (!target) {
    boardSequence = [];
    activeBoardIndex = 0;
    forcedSubstituteLinks.clear();
    return;
  }

  const first = boardSequence[0];
  if (!first || first.target !== target || first.kind !== el.viewMode.value) {
    resetBoardSequence();
  }
}

function renderBoardStrip() {
  const viewMode = el.viewMode.value;
  const anchorDate = el.anchorDate.value || today();

  // 收集所有已選課程的班級名稱
  const selectedClasses = new Set();
  boardSelections.forEach((slot) => {
    if (slot && slot.className) {
      selectedClasses.add(slot.className);
    }
  });

  el.boardsContainer.innerHTML = boardSequence
    .map((board, index) => {
      const tone = getBoardTone(index);
      const selectedSlot = boardSelections[index] || null;
      const selectedHint = selectedSlot
        ? `｜已選 ${selectedSlot.period}節 ${selectedSlot.subject || ""}`
        : "";
      return `<article class="board-card ${index === activeBoardIndex ? "active" : ""}" data-board-index="${index}" style="--board-soft:${tone.soft}; --board-deep:${tone.deep};"><div class="board-header"><h3>第${index + 1}個${viewMode === "teacher" ? "教師" : "班級"}課表：${board.target}${selectedHint}</h3><div class="board-nav"><button class="btn-nav prev" data-index="${index}" title="上一周">◀</button><span class="week-display" data-index="${index}"></span><button class="btn-nav next" data-index="${index}" title="下一周">▶</button></div></div><div class="board-wrap" id="board-wrap-${index}"></div></article>`;
    })
    .join("");

  // 綁定上一周/下一周按鈕事件
  document.querySelectorAll(".btn-nav").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const boardIndex = Number(btn.dataset.index);
      const direction = btn.classList.contains("prev") ? -1 : 1;
      const currentDate = new Date(`${anchorDate}T00:00:00`);
      currentDate.setDate(currentDate.getDate() + direction * 7);
      const newDate = currentDate.toISOString().slice(0, 10);
      el.anchorDate.value = newDate;
      renderBoards();
    });
  });

  boardSequence.forEach((board, index) => {
    const container = document.getElementById(`board-wrap-${index}`);
    if (!container) return;

    const boardData = buildWeeklyBoard({
      viewMode,
      target: board.target,
      anchorDate,
      events: getAppliedEvents({ includeDraftSimulation: true }),
      baseScheduleData
    });

    // 更新週別顯示
    const weekDisplay = document.querySelector(`.week-display[data-index="${index}"]`);
    if (weekDisplay && boardData.weekDates && boardData.weekDates.length > 0) {
      const startDate = boardData.weekDates[0];
      const endDate = boardData.weekDates[boardData.weekDates.length - 1];
      weekDisplay.textContent = `${startDate} ~ ${endDate}`;
    }

    const selectedSlot = boardSelections[index] || null;
    const prevSlot = index > 0 ? boardSelections[index - 1] : null;

    renderWeeklyBoard(container, boardData, (chip) => {
      activeBoardIndex = index;
      const prevSlot = index > 0 ? boardSelections[index - 1] : null;
      if (prevSlot) {
        if (prevSlot.className !== chip.className) {
          alert(`提醒：您選取了不同班級（${formatDateMD(prevSlot.date)} ${prevSlot.className} -> ${formatDateMD(chip.date)} ${chip.className}），本次將以代課處理。`);
          forcedSubstituteLinks.add(index - 1);
        } else {
          forcedSubstituteLinks.delete(index - 1);
        }
      }
      boardSelections[index] = chip;
      lastClickedSlot = {
        boardIndex: index,
        boardTarget: board.target,
        className: chip.className,
        date: chip.date,
        period: chip.period,
        subject: chip.subject,
        teacher: chip.teacher
      };
      setFloatingTab("candidate");
      updateSlotCandidatePanel(lastClickedSlot);
      renderBoards();
    }, {
      focusClassName: selectedSlot ? selectedSlot.className : "",
      focusSlotKey: selectedSlot ? `${selectedSlot.date}-${selectedSlot.period}` : "",
      boardTone: index,
      prevFocusClassName: prevSlot ? prevSlot.className : "",
      prevFocusSlotKey: prevSlot ? `${prevSlot.date}-${prevSlot.period}` : "",
      softFocusClasses: Array.from(selectedClasses)
    });
  });

  renderAdjustmentSummary();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function refreshTable() {
  if (!el.eventList || !el.filterClass || !el.filterDate) return;

  const classFilter = el.filterClass.value.trim();
  const dateFilter = el.filterDate.value;

  const filtered = events.filter((eventItem) => {
    const classMatch = !classFilter || eventItem.className.includes(classFilter);
    const dateMatch = !dateFilter || eventItem.date === dateFilter;
    return classMatch && dateMatch;
  });

  renderEventTable(el.eventList, filtered);
}

function renderBoards() {
  if (!getMainTargetValue()) {
    alert(el.viewMode.value === "teacher" ? "請先選擇主查詢科目與教師" : "請先選擇主查詢班級");
    return;
  }

  updateBoardChainFromMainTarget();
  renderBoardStrip();
  updateSlotCandidatePanel(lastClickedSlot);
  setOpsCompactMode(true);
}

function loadSeed() {
  const seed = [
    createEvent({
      className: "七仁",
      date: today(),
      period: 3,
      eventType: "A",
      fromSubject: "數學",
      fromTeacher: "王老師",
      toSubject: "理化",
      toTeacher: "林老師",
      reason: "校外活動調整"
    }),
    createEvent({
      className: "七仁",
      date: today(),
      period: 5,
      eventType: "B",
      fromSubject: "英文",
      fromTeacher: "張老師",
      toSubject: "英文",
      toTeacher: "代課老師",
      reason: "教師公假"
    })
  ];

  events = [...seed, ...events];
  EventStorage.saveAll(events);
  refreshTable();
  refreshMainTargetControls();
}

async function init() {
  currentSchoolBinding = SchoolBindingStorage.loadBinding();
  populateAcademicYearOptions();
  await hydrateSchoolBindings();
  EventStorage.setActiveSchool(currentSchoolBinding.schoolId);
  syncSchoolBindingControls();
  renderSchoolBindingStatus();

  if (el.period) {
    renderPeriodOptions(el.period, PERIODS);
  }
  if (el.eventDate) {
    el.eventDate.value = today();
  }
  el.anchorDate.value = today();
  await loadStateFromActiveSchoolStorage();
  await autoSyncFromCloudOnStartup();
  autoCloudSyncEnabled = Boolean(String(currentSchoolBinding.backendUrl || "").trim());
  promptInitialScheduleUploadIfNeeded();
  setOpsCompactMode(false);
  renderStakeholderButtons();

  if (el.editMainTargetBtn) {
    el.editMainTargetBtn.addEventListener("click", () => {
      setOpsCompactMode(false);
    });
  }

  if (el.slotCandidateHeader) {
    el.slotCandidateHeader.addEventListener("mousedown", beginSlotPanelDrag);
  }
  document.addEventListener("mousemove", moveSlotPanel);
  document.addEventListener("mouseup", endSlotPanelDrag);

  if (el.slotCandidatePinBtn) {
    el.slotCandidatePinBtn.addEventListener("click", () => {
      slotPanelPinned = !slotPanelPinned;
      if (slotPanelPinned) {
        resetSlotPanelPosition();
        el.slotCandidatePinBtn.textContent = "置頂";
      } else {
        el.slotCandidatePinBtn.textContent = "取消置頂";
      }
    });
  }

  if (el.slotCandidateCloseBtn) {
    el.slotCandidateCloseBtn.addEventListener("click", () => {
      el.slotCandidatePanel.classList.add("hidden");
    });
  }

  if (el.floatingTabMainBtn) {
    el.floatingTabMainBtn.addEventListener("click", () => setFloatingTab("main"));
  }
  if (el.floatingTabCandidateBtn) {
    el.floatingTabCandidateBtn.addEventListener("click", () => setFloatingTab("candidate"));
  }
  if (el.floatingTabAdjustmentBtn) {
    el.floatingTabAdjustmentBtn.addEventListener("click", () => setFloatingTab("adjustment"));
  }
  if (el.floatingTabOutputBtn) {
    el.floatingTabOutputBtn.addEventListener("click", () => {
      syncOutputFormDefaults();
      setFloatingTab("output");
    });
  }
  if (el.floatingTabSettingsBtn) {
    el.floatingTabSettingsBtn.addEventListener("click", () => {
      renderScheduleSourceStatus();
      syncSchoolBindingControls();
      renderSchoolBindingStatus();
      setFloatingTab("settings");
    });
  }
  if (el.floatingTabHistoryBtn) {
    el.floatingTabHistoryBtn.addEventListener("click", () => {
      renderHistoryList();
      setFloatingTab("history");
    });
  }
  setFloatingTab(floatingActiveTab);
  syncOutputFormDefaults();

  if (el.historySearchBtn && el.historySearchInput) {
    el.historySearchBtn.addEventListener("click", () => {
      historySearchKeyword = String(el.historySearchInput.value || "").trim();
      renderHistoryList();
    });
  }
  if (el.historySearchInput) {
    el.historySearchInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      historySearchKeyword = String(el.historySearchInput.value || "").trim();
      renderHistoryList();
    });
  }
  if (el.historyResetBtn && el.historySearchInput) {
    el.historyResetBtn.addEventListener("click", () => {
      historySearchKeyword = "";
      el.historySearchInput.value = "";
      renderHistoryList();
    });
  }
  if (el.historyClearBtn) {
    el.historyClearBtn.addEventListener("click", () => {
      if (!adjustmentHistory.length) {
        alert("目前沒有歷史異動可清空。");
        return;
      }
      const ok = confirm("確定清空全部歷史異動資料？此動作無法復原。");
      if (!ok) return;
      adjustmentHistory = [];
      historyExpandedIds = new Set();
      EventStorage.saveAdjustmentHistory(adjustmentHistory);
      renderHistoryList();
      alert("歷史異動資料已清空。");
    });
  }

  if (el.settingsApplySchoolBtn) {
    el.settingsApplySchoolBtn.addEventListener("click", async () => {
      try {
        const binding = readSchoolBindingFromForm();
        await applySchoolBinding(binding, { saveBinding: true, reloadState: true });
        alert(`已切換到 ${getSchoolLabel(currentSchoolBinding.schoolId)}，原始課表與歷史異動會使用這個學期資料夾。`);
      } catch (err) {
        console.error(err);
        alert(`套用學期綁定失敗：${err && err.message ? err.message : "未知錯誤"}`);
      }
    });
  }

  if (el.settingsPullCloudBtn) {
    el.settingsPullCloudBtn.addEventListener("click", async () => {
      try {
        renderSchoolBindingStatus("雲端同步中");
        await pullSchoolDataFromCloud();
        renderSchoolBindingStatus("雲端同步完成");
        alert("已從雲端同步目前學期資料夾資料。");
      } catch (err) {
        console.error(err);
        renderSchoolBindingStatus("雲端同步失敗");
        alert(`雲端同步失敗：${err && err.message ? err.message : "未知錯誤"}`);
      }
    });
  }

  if (el.settingsPushCloudBtn) {
    el.settingsPushCloudBtn.addEventListener("click", async () => {
      try {
        renderSchoolBindingStatus("雲端推送中");
        await pushSchoolDataToCloud();
        renderSchoolBindingStatus("雲端推送完成");
        alert("已推送目前校別資料到雲端。\n包含原始課表、歷史異動與調動草稿。");
      } catch (err) {
        console.error(err);
        renderSchoolBindingStatus("雲端推送失敗");
        alert(`雲端推送失敗：${err && err.message ? err.message : "未知錯誤"}`);
      }
    });
  }

  if (el.settingsLoadFileBtn) {
    el.settingsLoadFileBtn.addEventListener("click", async () => {
      const file = el.settingsScheduleFile && el.settingsScheduleFile.files && el.settingsScheduleFile.files[0]
        ? el.settingsScheduleFile.files[0]
        : null;
      if (!file) {
        alert("請先選擇 xls 或 xlsx 檔案。");
        return;
      }

      const originalLabel = el.settingsLoadFileBtn.textContent;
      setElementDisabled(el.settingsLoadFileBtn, true);
      el.settingsLoadFileBtn.textContent = "處理中...";

      try {
        const nextTermId = readNewTermIdFromForm({ required: true });
        const targetSchoolId = nextTermId;
        if (nextTermId !== currentSchoolBinding.schoolId) {
          const binding = normalizeSchoolBinding({
            schoolId: nextTermId,
            backendUrl: el.settingsBackendUrl ? el.settingsBackendUrl.value : currentSchoolBinding.backendUrl
          });
          await applySchoolBinding(binding, { saveBinding: true, reloadState: false });
          await loadStateFromActiveSchoolStorage();
        }

        const arrayBuffer = await file.arrayBuffer();
        const data = await parseScheduleWorkbookArrayBuffer(arrayBuffer);
        applyBaseScheduleData(data, {
          persist: true,
          sourceLabel: `自訂上傳課表：${file.name}（${currentSchoolBinding.schoolId}）`
        });

        renderSchoolBindingStatus("檢查雲端資料夾中");
        await ensureSchoolFolderExistsInCloud(currentSchoolBinding.schoolId);

        renderSchoolBindingStatus("上傳原始課表中");
        await pushSchoolDataToCloud();

        await refreshTermFoldersFromCloud();
        const folderDetected = availableSchoolBindings.some((item) => String(item && item.schoolId ? item.schoolId : "") === targetSchoolId);
        if (!folderDetected) {
          throw new Error(`雲端尚未偵測到學期資料夾 ${targetSchoolId}，請檢查 Apps Script 權限與資料夾建立邏輯。`);
        }
        await loadStateFromActiveSchoolStorage();
        renderSchoolBindingStatus("原始課表已上傳");

        alert(`已完成課表載入與雲端上傳：${file.name}\n學期資料夾：${getSchoolLabel(currentSchoolBinding.schoolId)}\n已將原始課表 JSON 寫入雲端。`);
      } catch (err) {
        console.error(err);
        renderSchoolBindingStatus("課表上傳失敗");
        alert(`課表載入失敗：${err && err.message ? err.message : "未知錯誤"}`);
      } finally {
        setElementDisabled(el.settingsLoadFileBtn, false);
        el.settingsLoadFileBtn.textContent = originalLabel;
      }
    });
  }

  if (el.settingsScheduleFile && el.settingsLoadFileBtn) {
    el.settingsScheduleFile.addEventListener("change", () => {
      const file = el.settingsScheduleFile.files && el.settingsScheduleFile.files[0]
        ? el.settingsScheduleFile.files[0]
        : null;
      if (!file) return;
      if (el.settingsSourceStatus) {
        el.settingsSourceStatus.textContent = `已選擇檔案：${file.name}（尚未載入）`;
      }
    });
  }

  el.viewMode.addEventListener("change", () => {
    syncMainTargetVisibility();
    updateSlotCandidatePanel(lastClickedSlot);
    resetBoardSequence();
    if (getMainTargetValue()) {
      renderBoards();
    }
  });

  el.mainSubjectSelect.addEventListener("change", () => {
    populateMainTeacherSelectors();
    updateSlotCandidatePanel(lastClickedSlot);
  });

  el.mainTeacherSelect.addEventListener("change", () => {
    updateMainTargetDisplay();
    updateSlotCandidatePanel(lastClickedSlot);
    if (el.viewMode.value === "teacher" && getMainTargetValue()) {
      resetBoardSequence();
      renderBoards();
    }
  });

  el.mainClassSelect.addEventListener("change", () => {
    updateMainTargetDisplay();
    if (el.viewMode.value === "class" && getMainTargetValue()) {
      resetBoardSequence();
      renderBoards();
    }
  });

  if (el.form) {
    el.form.addEventListener("submit", (event) => {
      event.preventDefault();

      const input = {
        className: el.className.value,
        date: el.eventDate.value,
        period: el.period.value,
        eventType: el.eventType.value,
        fromSubject: el.fromSubject.value,
        fromTeacher: el.fromTeacher.value,
        toSubject: el.toSubject.value,
        toTeacher: el.toTeacher.value,
        reason: el.reason.value
      };

      const err = validateEventInput(input);
      if (err) {
        alert(err);
        return;
      }

      const conflicts = detectConflicts(input, events);
      renderConflictBanner(el.conflictBanner, conflicts);
      if (conflicts.length > 0) {
        const ok = confirm(`偵測到 ${conflicts.length} 個衝突，仍要新增嗎？`);
        if (!ok) {
          return;
        }
      }

      const eventItem = createEvent(input);
      events = EventStorage.add(eventItem);
      el.form.reset();
      el.eventDate.value = today();
      populateMainTeacherSelectors();
      refreshTable();
      updateSlotCandidatePanel(lastClickedSlot);
      renderAdjustmentSummary();
      renderBoards();
    });
  }

  if (el.filterBtn) {
    el.filterBtn.addEventListener("click", refreshTable);
  }

  if (el.resetBtn && el.filterClass && el.filterDate) {
    el.resetBtn.addEventListener("click", () => {
      el.filterClass.value = "";
      el.filterDate.value = "";
      refreshTable();
    });
  }

  el.renderBoardsBtn.addEventListener("click", renderBoards);

  el.swapTargetsBtn.addEventListener("click", () => {
    resetBoardSequence();
    renderBoards();
  });

  if (el.seedBtn) {
    el.seedBtn.addEventListener("click", loadSeed);
  }

  if (el.exportBtn) {
    el.exportBtn.addEventListener("click", () => {
      downloadAsJson(`tcv6-events-${today()}.json`, events);
    });
  }

  if (el.clearBtn) {
    el.clearBtn.addEventListener("click", () => {
      const ok = confirm("確定要清空全部事件嗎？");
      if (!ok) return;
      EventStorage.clear();
      events = [];
      lastClickedSlot = null;
      boardSequence = [];
      activeBoardIndex = 0;
      forcedSubstituteLinks.clear();
      adjustmentDrafts = [];
      adjustmentHistory = [];
      activeAdjustmentSheetIndex = 0;
      EventStorage.saveAdjustmentDrafts(adjustmentDrafts);
      EventStorage.saveAdjustmentHistory(adjustmentHistory);
      populateMainTeacherSelectors();
      populateMainClassSelector();
      refreshTable();
      renderAdjustmentDraftList();
      renderAdjustmentSheetTabs();
      renderHistoryList();
      el.boardsContainer.innerHTML = "";
      el.adjustmentSummary.innerHTML = '<div class="adjustment-empty">尚未產生課表</div>';
      updateSlotCandidatePanel(null);
      renderConflictBanner(el.conflictBanner, []);
      syncOutputFormDefaults();
    });
  }

  if (el.addAdjustmentBtn) {
    el.addAdjustmentBtn.addEventListener("click", () => {
      const chain = computeAdjustmentChain();
      if (!chain.length) {
        alert("目前沒有可加入的課程異動。請先完成課程選取。");
        return;
      }

      const preview = chain
        .map((item) => `${item.fromLabel} ${item.type === "調課" ? "調課為" : "由"} ${item.toLabel || "代課"}`)
        .join("\n");
      const ok = confirm(`確認加入調動清單？\n\n${preview}`);
      if (!ok) return;

      adjustmentDrafts.push({
        id: createAdjustmentId(),
        createdAt: new Date().toLocaleString("zh-TW"),
        anchorDate: el.anchorDate.value || today(),
        chain: chain.map((item, idx) => ({
          ...item,
          id: item.id || createAdjustmentId(`adj_chain_${adjustmentDrafts.length}_${idx}`)
        }))
      });
      activeAdjustmentSheetIndex = adjustmentDrafts.length - 1;
      syncAdjustmentDraftState();
      renderAdjustmentDraftList();
      setFloatingTab("adjustment");
      renderBoards();
      syncOutputFormDefaults();
    });
  }

  if (el.outputLeaveType) {
    el.outputLeaveType.addEventListener("change", () => {
      const leaveType = String(el.outputLeaveType.value || "").trim();
      if (!el.outputReasonDoc) return;
      const current = String(el.outputReasonDoc.value || "").trim();
      if (!current || current === outputReasonDocAutoValue) {
        el.outputReasonDoc.value = leaveType;
        outputReasonDocAutoValue = leaveType;
      }
    });
  }

  if (el.outputDateRange) {
    el.outputDateRange.addEventListener("blur", () => {
      const raw = String(el.outputDateRange.value || "").trim();
      if (!raw) return;
      const normalized = normalizeDateRangeText(raw);
      if (!normalized) {
        alert("調課區間格式需為 mm/dd-mm/dd，例如 05/15-05/25");
        return;
      }
      el.outputDateRange.value = normalized;
    });
  }

  if (el.outputConfirmExport) {
    el.outputConfirmExport.addEventListener("click", async () => {
      if (!adjustmentDrafts.length) {
        alert("尚無調動清單可產生調課單包。");
        return;
      }
      try {
        const exportResult = await exportWorkbookAndJpgZip();
        const committed = commitCurrentDraftsToHistory(exportResult && exportResult.meta ? exportResult.meta : null);
        if (committed.archived > 0) {
          refreshTable();
          populateMainTeacherSelectors();
          populateMainClassSelector();
          renderAdjustmentDraftList();
          renderAdjustmentSheetTabs();
          renderHistoryList();
          renderBoards();
          syncOutputFormDefaults();
          alert(`已封存 ${committed.archived} 筆到歷史異動資料。`);
        }
      } catch (err) {
        console.error(err);
        alert(`調課單包匯出失敗：${err && err.message ? err.message : "未知錯誤"}\n請確認網路可載入前端匯出套件。`);
      }
    });
  }

  if (el.exportAdjustmentBtn) {
    el.exportAdjustmentBtn.addEventListener("click", async () => {
      if (!adjustmentDrafts.length) {
        alert("尚無調動清單可匯出。");
        return;
      }
      try {
        await exportWorkbookOnly();
      } catch (err) {
        console.error(err);
        alert(`Excel 匯出失敗：${err && err.message ? err.message : "未知錯誤"}\n請確認網路可載入前端匯出套件。`);
      }
    });
  }

  if (el.buildAdjustmentWorkbookBtn) {
    el.buildAdjustmentWorkbookBtn.addEventListener("click", async () => {
      if (!adjustmentDrafts.length) {
        alert("尚無調動清單可產生調課單包。");
        return;
      }
      try {
        const exportResult = await exportWorkbookAndJpgZip();
        const committed = commitCurrentDraftsToHistory(exportResult && exportResult.meta ? exportResult.meta : null);
        if (committed.archived > 0) {
          refreshTable();
          populateMainTeacherSelectors();
          populateMainClassSelector();
          renderAdjustmentDraftList();
          renderAdjustmentSheetTabs();
          renderHistoryList();
          renderBoards();
          syncOutputFormDefaults();
          alert(`已封存 ${committed.archived} 筆到歷史異動資料。`);
        }
      } catch (err) {
        console.error(err);
        alert(`調課單包匯出失敗：${err && err.message ? err.message : "未知錯誤"}\n請確認網路可載入前端匯出套件。`);
      }
    });
  }

  if (el.stakeholderAdminBtn) {
    el.stakeholderAdminBtn.addEventListener("click", () => {
      stakeholderView = "admin";
      renderStakeholderButtons();
      renderDraftMiniBoard();
    });
  }

  if (el.stakeholderClassBtn) {
    el.stakeholderClassBtn.addEventListener("click", () => {
      stakeholderView = "class";
      renderStakeholderButtons();
      renderDraftMiniBoard();
    });
  }

  if (el.stakeholderTeacherBtn) {
    el.stakeholderTeacherBtn.addEventListener("click", () => {
      stakeholderView = "teacher";
      renderStakeholderButtons();
      renderDraftMiniBoard();
    });
  }

  if (el.adjustmentViewSimpleBtn && el.adjustmentViewDetailBtn) {
    const syncButtons = () => {
      el.adjustmentViewSimpleBtn.classList.toggle("active", adjustmentViewMode === "simple");
      el.adjustmentViewDetailBtn.classList.toggle("active", adjustmentViewMode === "detail");
    };

    el.adjustmentViewSimpleBtn.addEventListener("click", () => {
      adjustmentViewMode = "simple";
      syncButtons();
      renderAdjustmentSummary();
    });

    el.adjustmentViewDetailBtn.addEventListener("click", () => {
      adjustmentViewMode = "detail";
      syncButtons();
      renderAdjustmentSummary();
    });

    syncButtons();
  }
}

try {
  const initResult = init();
  if (initResult && typeof initResult.catch === "function") {
    initResult.catch((err) => {
      console.error("TCv6 init failed:", err);
      alert("TCv6 初始化失敗，請改用 Chrome 開啟，或用 Go Live。\n\n詳細錯誤請查看瀏覽器主控台（F12）。");
    });
  }
} catch (err) {
  console.error("TCv6 init failed:", err);
  alert("TCv6 初始化失敗，請改用 Chrome 開啟，或用 Go Live。\n\n詳細錯誤請查看瀏覽器主控台（F12）。");
}



;

