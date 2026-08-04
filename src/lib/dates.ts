import { site } from "../config/site";

export function formatDate(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat(site.locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function toIsoDate(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString();
}
