export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
  offsetMinutes: number;
  group: string;
}

const OFFSET_REGEX = /UTC([+-])(\d{1,2}):?(\d{2})?/;
const OFFSET_CLEANUP_REGEX = /\s*\(UTC[^)]+\)/;

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "America/Buenos_Aires",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Brussels",
  "Europe/Vienna",
  "Europe/Stockholm",
  "Europe/Warsaw",
  "Europe/Moscow",
  "Europe/Istanbul",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Pacific/Auckland",
  "Pacific/Fiji",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Nairobi",
  "Africa/Lagos",
];

export function getTimezoneOptions(): TimezoneOption[] {
  const timezones: TimezoneOption[] = [];

  timezones.push({
    value: "UTC",
    label: "UTC (Coordinated Universal Time)",
    offset: "UTC+00:00",
    offsetMinutes: 0,
    group: "UTC",
  });

  for (const tz of COMMON_TIMEZONES) {
    const offsetData = getTimezoneOffset(tz);
    const parts = tz.split("/");
    const group = parts[0];
    const label = formatTimezoneLabel(tz);

    timezones.push({
      value: tz,
      label: `${label} (${offsetData.offset})`,
      offset: offsetData.offset,
      offsetMinutes: offsetData.offsetMinutes,
      group,
    });
  }

  return timezones.sort((a, b) => {
    if (a.value === "UTC") {
      return -1;
    }
    if (b.value === "UTC") {
      return 1;
    }

    if (a.offsetMinutes !== b.offsetMinutes) {
      return a.offsetMinutes - b.offsetMinutes;
    }
    return a.label.localeCompare(b.label);
  });
}

function formatTimezoneLabel(timezone: string): string {
  const parts = timezone.split("/");

  const city =
    parts
      .at(-1)
      ?.replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .trim() || timezone;

  const region = parts[0];

  return `${city} (${region})`;
}

export function getTimezoneOffset(timezone: string): {
  offset: string;
  offsetMinutes: number;
} {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    });

    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find((p) => p.type === "timeZoneName");

    if (offsetPart?.value.startsWith("GMT")) {
      const offset = offsetPart.value.replace("GMT", "UTC");
      const offsetMinutes = parseOffsetToMinutes(offset);
      return { offset, offsetMinutes };
    }

    const utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
    const tzDate = new Date(
      now.toLocaleString("en-US", { timeZone: timezone })
    );
    const offsetMinutes = (tzDate.getTime() - utcDate.getTime()) / 60_000;

    const sign = offsetMinutes >= 0 ? "+" : "-";
    const abs = Math.abs(offsetMinutes);
    const hours = Math.floor(abs / 60);
    const minutes = abs % 60;

    const offset = `UTC${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    return { offset, offsetMinutes };
  } catch {
    return { offset: "UTC+00:00", offsetMinutes: 0 };
  }
}

function parseOffsetToMinutes(offset: string): number {
  const match = offset.match(OFFSET_REGEX);
  if (!match) {
    return 0;
  }

  const sign = match[1] === "+" ? 1 : -1;
  const hours = Number.parseInt(match[2], 10);
  const minutes = match[3] ? Number.parseInt(match[3], 10) : 0;

  return sign * (hours * 60 + minutes);
}

export function getGroupedTimezoneOptions(): Record<string, TimezoneOption[]> {
  const options = getTimezoneOptions();
  const grouped: Record<string, TimezoneOption[]> = {};

  for (const option of options) {
    if (!grouped[option.group]) {
      grouped[option.group] = [];
    }
    grouped[option.group].push(option);
  }

  return grouped;
}

export function formatTimezoneDisplay(
  timezone: string,
  options?: { includeOffset?: boolean }
): string {
  const optionsList = getTimezoneOptions();
  const tz = optionsList.find((t) => t.value === timezone);

  if (!tz) {
    return timezone;
  }

  return options?.includeOffset
    ? tz.label // Already includes offset in our new format
    : tz.label.replace(OFFSET_CLEANUP_REGEX, "");
}

export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export function getDefaultTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export function searchTimezones(query: string): TimezoneOption[] {
  const options = getTimezoneOptions();
  const lowerQuery = query.toLowerCase();

  return options.filter(
    (option) =>
      option.label.toLowerCase().includes(lowerQuery) ||
      option.value.toLowerCase().includes(lowerQuery) ||
      option.offset.includes(lowerQuery)
  );
}
