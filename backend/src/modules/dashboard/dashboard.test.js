const {
  parsePagination,
} = require("../../utils/pagination");

describe("Pagination helper", () => {
  test("uses safe defaults", () => {
    expect(parsePagination({})).toEqual({
      page: 1,
      limit: 20,
      skip: 0,
    });
  });

  test("caps the maximum limit", () => {
    expect(
      parsePagination({
        page: "2",
        limit: "500",
      })
    ).toEqual({
      page: 2,
      limit: 100,
      skip: 100,
    });
  });
});