import { dataUtil } from "./dataUtil";

describe("dataUtil", () => {
  test("removeLongPropertyValues returns input for falsy values", () => {
    expect(dataUtil.removeLongPropertyValues(null)).toBeNull();
    expect(dataUtil.removeLongPropertyValues(undefined)).toBeUndefined();
  });

  test("removeLongPropertyValues trims long nested strings and keeps thumbnail untouched", () => {
    const original = {
      title: "short",
      text: "x".repeat(21),
      nested: {
        keep: "ok",
        trim: "y".repeat(21),
      },
      list: ["z".repeat(22), { deep: "k".repeat(23) }],
      thumbnail: "thumb".repeat(100),
    };

    const result = dataUtil.removeLongPropertyValues(original, 20, "<removed>");

    expect(result.text).toBe("<removed>");
    expect(result.nested.keep).toBe("ok");
    expect(result.nested.trim).toBe("<removed>");
    expect(result.list[0]).toBe("<removed>");
    expect(result.list[1].deep).toBe("<removed>");
    expect(result.thumbnail).toBe(original.thumbnail);

    // Verify original object is not modified.
    expect(original.text).toBe("x".repeat(21));
    expect(original.nested.trim).toBe("y".repeat(21));
  });

  test("removeLongPropertyValues uses default placeholder when none is provided", () => {
    const input = { value: "a".repeat(600) };
    const result = dataUtil.removeLongPropertyValues(input);
    expect(result.value).toBe(dataUtil.getDefaultRemovedPlaceholder());
  });

  test("removeDatabaseProperties removes db fields from object and arrays", () => {
    const one = { _id: "1", _rev: "2", id: "3", keep: true };
    dataUtil.removeDatabaseProperties(one, true);
    expect(one).toEqual({ keep: true });

    const many = [
      { _id: "a", _rev: "b", id: "c", v: 1 },
      { _id: "d", _rev: "e", id: "f", v: 2 },
    ];
    dataUtil.removeDatabaseProperties(many, false);
    expect(many).toEqual([
      { id: "c", v: 1 },
      { id: "f", v: 2 },
    ]);
  });

  test("removeDatabaseProperties safely handles empty input", () => {
    expect(dataUtil.removeDatabaseProperties(null, true)).toBeUndefined();
  });
});
