import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { formatDate, toIsoDate } from "../../src/lib/dates";

describe("date formatting", () => {
  let originalTimezone: string | undefined;

  beforeEach(() => {
    originalTimezone = process.env.TZ;
    process.env.TZ = "America/Los_Angeles";
  });

  afterEach(() => {
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  });

  it("keeps calendar dates stable across build-machine time zones", () => {
    const value = new Date("2026-08-04T00:00:00.000Z");

    expect(formatDate(value)).toBe("Aug 4, 2026");
    expect(toIsoDate(value)).toBe("2026-08-04T00:00:00.000Z");
  });
});
