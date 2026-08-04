import { describe, expect, it } from "vitest";

import { pageHref, paginate } from "../../src/lib/pagination";

describe("paginate", () => {
  it("keeps an empty collection on a valid first page", () => {
    expect(paginate([], 1)).toEqual({
      items: [],
      currentPage: 1,
      totalPages: 1,
      previousPage: undefined,
      nextPage: undefined,
    });
  });

  it("slices entries without mutating the source", () => {
    const entries = [1, 2, 3, 4, 5];

    expect(paginate(entries, 2, 2)).toMatchObject({
      items: [3, 4],
      currentPage: 2,
      totalPages: 3,
      previousPage: 1,
      nextPage: 3,
    });
    expect(entries).toEqual([1, 2, 3, 4, 5]);
  });

  it("rejects invalid page requests", () => {
    expect(() => paginate([1], 0)).toThrow(RangeError);
    expect(() => paginate([1], 2)).toThrow(RangeError);
    expect(() => paginate([1], 1, 0)).toThrow(RangeError);
  });
});

describe("pageHref", () => {
  it("uses the canonical collection URL for page one", () => {
    expect(pageHref("studio", 1)).toBe("/studio/");
    expect(pageHref("journal", 2)).toBe("/journal/page/2/");
  });
});
