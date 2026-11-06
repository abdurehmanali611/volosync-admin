export type ModuleChangeKind = "add" | "remove" | "unknown";

export type ParsedModuleChangeRequest = {
  changeType: ModuleChangeKind;
  changedModules: string[];
  currentModules: string[];
  projectedModules: string[];
  freeNote: string | null;
};

function parseModuleList(line: string, prefix: string): string[] {
  if (!line.toLowerCase().startsWith(prefix.toLowerCase())) return [];
  const raw = line.slice(prefix.length).trim();
  if (!raw || raw.toLowerCase() === "none") return [];
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function normalizeModuleList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      return value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
    }
  }
  return [];
}

export function parseModuleChangeRequestNote(
  requestNote: string | null | undefined,
  requestedModules: unknown,
): ParsedModuleChangeRequest {
  const projectedModules = normalizeModuleList(requestedModules);
  const note = String(requestNote || "").trim();
  if (!note) {
    return {
      changeType: "unknown",
      changedModules: projectedModules,
      currentModules: [],
      projectedModules,
      freeNote: null,
    };
  }

  const lines = note.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  let changeType: ModuleChangeKind = "unknown";
  let changedModules: string[] = [];
  let currentModules: string[] = [];
  let projectedFromNote: string[] = [];
  let freeNoteStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const changeMatch = /^\[Module change:\s*(add|remove)\]$/i.exec(line);
    if (changeMatch) {
      changeType = changeMatch[1].toLowerCase() as ModuleChangeKind;
      continue;
    }
    if (/^Changed modules:/i.test(line)) {
      changedModules = parseModuleList(line, "Changed modules:");
      continue;
    }
    if (/^Current modules:/i.test(line)) {
      currentModules = parseModuleList(line, "Current modules:");
      continue;
    }
    if (/^Projected modules:/i.test(line)) {
      projectedFromNote = parseModuleList(line, "Projected modules:");
      continue;
    }
    if (line === "---") {
      freeNoteStart = i + 1;
      break;
    }
    if (/^Requested by:/i.test(line)) continue;
    if (freeNoteStart < 0 && !line.startsWith("[")) {
      freeNoteStart = i;
      break;
    }
  }

  const freeNote =
    freeNoteStart >= 0
      ? lines.slice(freeNoteStart).join("\n").trim() || null
      : null;

  return {
    changeType,
    changedModules:
      changedModules.length > 0 ? changedModules : projectedModules,
    currentModules,
    projectedModules:
      projectedFromNote.length > 0 ? projectedFromNote : projectedModules,
    freeNote,
  };
}
