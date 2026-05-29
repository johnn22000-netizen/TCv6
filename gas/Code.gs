/**
 * 課表查詢系統 Apps Script 後端
 *
 * 資料模型：GAS 專案所在的雲端資料夾底下 data 子資料夾中的學期資料夾，例如 114暑、1141、114寒、1142。
 * 每個資料夾內固定保存一份狀態檔 tcv6-state.json。
 */

const BACKEND_VERSION = "2.0.0";
const STATE_FILE_NAME = "tcv6-state.json";
const DATA_ROOT_FOLDER_NAME = "data";
const TERM_FOLDER_PATTERN = /^(\d{2,3})(暑|寒|1|2)$/;
const TERM_SORT_WEIGHT = {
  "暑": 1,
  "1": 2,
  "寒": 3,
  "2": 4
};

function doGet(e) {
  return handleRequest("GET", e, null);
}

function doPost(e) {
  return handleRequest("POST", e, readRequestBody(e));
}

function handleRequest(method, e, body) {
  try {
    const action = normalizeAction(getParam(e, "action") || (body && body.action));

    if (action === "health") {
      const rootFolder = getRootFolder();
      return jsonResponse(okResponse({
        version: BACKEND_VERSION,
        rootFolderName: rootFolder.getName(),
        rootFolderId: rootFolder.getId(),
        termCount: listTermFolders().length
      }));
    }

    if (action === "listTerms" || action === "listFolders" || action === "listSchools") {
      return jsonResponse(okResponse(listTermFolders()));
    }

    if (action === "loadAll") {
      const schoolId = resolveSchoolId(e, body);
      return jsonResponse(okResponse(loadAllByTerm(schoolId)));
    }

    if (action === "saveAll") {
      const schoolId = resolveSchoolId(e, body);
      const data = body && body.data ? body.data : {};
      return jsonResponse(okResponse(saveAllByTerm(schoolId, data)));
    }

    if (action === "ensureTerm" || action === "ensureFolder" || action === "ensureSchool" || action === "createTerm" || action === "createFolder") {
      const schoolId = resolveSchoolId(e, body);
      return jsonResponse(okResponse(ensureTermStateReady(schoolId)));
    }

    return jsonResponse(errorResponse(`Unknown action: ${action}`));
  } catch (error) {
    return jsonResponse(errorResponse(error && error.message ? error.message : String(error)));
  }
}

function ensureTermStateReady(schoolId) {
  const termId = resolveTargetTermId(schoolId);
  if (!termId) {
    throw new Error("請提供學期資料夾名稱，例如 1141、114暑、114寒、1142");
  }

  const folder = ensureTermFolder(termId);
  const stateFile = getStateFile(folder, true);
  const fileSize = stateFile.getSize();

  return {
    schoolId: termId,
    folderId: folder.getId(),
    folderName: folder.getName(),
    dataRootFolderId: getRootFolder().getId(),
    dataRootFolderName: getRootFolder().getName(),
    stateFileName: STATE_FILE_NAME,
    stateFileId: stateFile.getId(),
    stateFileSize: fileSize,
    stateReady: fileSize >= 0
  };
}

function listTermFolders() {
  const rootFolder = getRootFolder();
  const folders = [];
  const iterator = rootFolder.getFolders();

  while (iterator.hasNext()) {
    const folder = iterator.next();
    const termInfo = parseTermFolderName(folder.getName());
    if (!termInfo) continue;

    folders.push({
      schoolId: folder.getName(),
      termId: folder.getName(),
      name: formatTermLabel(folder.getName()),
      folderId: folder.getId()
    });
  }

  folders.sort(compareTermFolderInfoDesc);
  return folders;
}

function loadAllByTerm(schoolId) {
  const termId = resolveTargetTermId(schoolId);
  const folder = termId ? findTermFolder(termId) : null;

  if (!folder) {
    return makeEmptyState(termId, false);
  }

  const file = getStateFile(folder, false);
  if (!file) {
    return makeEmptyState(termId, true);
  }

  const rawText = file.getBlob().getDataAsString("UTF-8");
  const parsed = safeParseJson(rawText);
  const data = normalizeCloudData(parsed && parsed.data ? parsed.data : parsed);

  return {
    schoolId: termId,
    folderId: folder.getId(),
    folderName: folder.getName(),
    dataRootFolderId: getRootFolder().getId(),
    dataRootFolderName: getRootFolder().getName(),
    hasBaseSchedule: Boolean(data.baseScheduleData && data.baseScheduleData.schedules),
    updatedAt: parsed && parsed.updatedAt ? parsed.updatedAt : null,
    data: data
  };
}

function saveAllByTerm(schoolId, data) {
  const termId = resolveTargetTermId(schoolId);
  if (!termId) {
    throw new Error("請提供學期資料夾名稱，例如 1141、114暑、114寒、1142");
  }

  const folder = ensureTermFolder(termId);
  const normalizedData = normalizeCloudData(data);
  const payload = {
    schoolId: termId,
    updatedAt: new Date().toISOString(),
    data: normalizedData
  };

  const file = getStateFile(folder, true);
  file.setContent(JSON.stringify(payload, null, 2));

  return {
    schoolId: termId,
    folderId: folder.getId(),
    folderName: folder.getName(),
    dataRootFolderId: getRootFolder().getId(),
    dataRootFolderName: getRootFolder().getName(),
    updatedAt: payload.updatedAt,
    hasBaseSchedule: Boolean(normalizedData.baseScheduleData && normalizedData.baseScheduleData.schedules)
  };
}

function makeEmptyState(schoolId, folderExists) {
  return {
    schoolId: schoolId || "",
    folderExists: Boolean(folderExists),
    hasBaseSchedule: false,
    data: normalizeCloudData(null)
  };
}

function normalizeCloudData(data) {
  const source = data && typeof data === "object" ? data : {};
  return {
    events: Array.isArray(source.events) ? source.events : [],
    adjustmentDrafts: Array.isArray(source.adjustmentDrafts) ? source.adjustmentDrafts : [],
    adjustmentHistory: Array.isArray(source.adjustmentHistory) ? source.adjustmentHistory : [],
    baseScheduleData: source.baseScheduleData && typeof source.baseScheduleData === "object" ? source.baseScheduleData : null
  };
}

function resolveSchoolId(e, body) {
  return normalizeSchoolId(getParam(e, "schoolId") || (body && body.schoolId) || "");
}

function resolveTargetTermId(rawSchoolId) {
  const schoolId = normalizeSchoolId(rawSchoolId || "");
  if (schoolId) return schoolId;

  const folders = listTermFolders();
  return folders.length ? folders[0].schoolId : "";
}

function normalizeSchoolId(value) {
  return String(value || "").trim();
}

function normalizeAction(value) {
  return String(value || "").trim();
}

function parseTermFolderName(folderName) {
  const raw = normalizeSchoolId(folderName);
  const match = raw.match(TERM_FOLDER_PATTERN);
  if (!match) return null;
  return {
    year: match[1],
    term: match[2]
  };
}

function formatTermLabel(termId) {
  const parsed = parseTermFolderName(termId);
  if (!parsed) return termId || "未命名資料夾";

  const suffixMap = {
    "暑": "暑假",
    "1": "第一學期",
    "寒": "寒假",
    "2": "第二學期"
  };

  return `${parsed.year}學年度${suffixMap[parsed.term] || parsed.term}`;
}

function compareTermFolderInfoDesc(left, right) {
  const leftInfo = parseTermFolderName(left.schoolId || left.termId || "");
  const rightInfo = parseTermFolderName(right.schoolId || right.termId || "");

  if (!leftInfo && !rightInfo) return String(right.name || "").localeCompare(String(left.name || ""), "zh-Hant");
  if (!leftInfo) return 1;
  if (!rightInfo) return -1;

  const yearDiff = Number(rightInfo.year) - Number(leftInfo.year);
  if (yearDiff) return yearDiff;

  const leftWeight = TERM_SORT_WEIGHT[leftInfo.term] || 0;
  const rightWeight = TERM_SORT_WEIGHT[rightInfo.term] || 0;
  if (rightWeight !== leftWeight) return rightWeight - leftWeight;

  return String(right.schoolId || "").localeCompare(String(left.schoolId || ""), "zh-Hant");
}

function getRootFolder() {
  const projectFile = getScriptProjectFile();
  const parentIterator = projectFile.getParents();
  if (!parentIterator.hasNext()) {
    throw new Error("找不到 GAS 專案所在雲端資料夾，請確認此專案已放在 Google Drive 資料夾中。");
  }
  const projectFolder = parentIterator.next();
  return ensureChildFolderByName(projectFolder, DATA_ROOT_FOLDER_NAME);
}

function getScriptProjectFile() {
  const scriptId = String(ScriptApp.getScriptId() || "").trim();
  if (!scriptId) {
    throw new Error("無法取得 GAS Script ID，無法定位 data 資料夾。");
  }
  try {
    return DriveApp.getFileById(scriptId);
  } catch (error) {
    throw new Error("無法透過 Script ID 找到 GAS 專案檔案，請確認為獨立部署且位於 Google Drive。" +
      (error && error.message ? ` 原因：${error.message}` : ""));
  }
}

function ensureChildFolderByName(parentFolder, folderName) {
  const iterator = parentFolder.getFoldersByName(folderName);
  if (iterator.hasNext()) {
    return iterator.next();
  }
  return parentFolder.createFolder(folderName);
}

function findTermFolder(termId) {
  const rootFolder = getRootFolder();
  const iterator = rootFolder.getFoldersByName(termId);
  return iterator.hasNext() ? iterator.next() : null;
}

function ensureTermFolder(termId) {
  const existing = findTermFolder(termId);
  if (existing) return existing;
  return getRootFolder().createFolder(termId);
}

function getStateFile(folder, createIfMissing) {
  const iterator = folder.getFilesByName(STATE_FILE_NAME);
  if (iterator.hasNext()) {
    return iterator.next();
  }
  if (!createIfMissing) return null;
  return folder.createFile(STATE_FILE_NAME, JSON.stringify({ updatedAt: new Date().toISOString(), data: normalizeCloudData(null) }, null, 2), MimeType.PLAIN_TEXT);
}

function readRequestBody(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  const text = String(e.postData.contents || "").trim();
  if (!text) return {};
  return safeParseJson(text) || {};
}

function safeParseJson(text) {
  try {
    return JSON.parse(String(text || ""));
  } catch (_) {
    return null;
  }
}

function getParam(e, name) {
  if (!e || !e.parameter) return "";
  return e.parameter[name] || "";
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

function okResponse(data) {
  return {
    ok: true,
    data: data
  };
}

function errorResponse(message) {
  return {
    ok: false,
    message: message
  };
}