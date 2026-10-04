import { describe, expect, it } from "vitest";
import { isEmail, parseCsv, readContacts, toContactsCsv } from "./contacts-csv";

describe("parseCsv", () => {
  it("handles quoted cells, doubled quotes, and Windows line endings", () => {
    expect(parseCsv('email,name\r\n"a@x.com","Smith, ""Jr."""\r\n')).toEqual([
      ["email", "name"],
      ["a@x.com", 'Smith, "Jr."'],
    ]);
  });

  it("ignores Excel's invisible marker at the start", () => {
    expect(parseCsv("﻿email\na@x.com")).toEqual([["email"], ["a@x.com"]]);
  });
});

describe("readContacts", () => {
  it("finds email and name columns by header, in any order and casing", () => {
    const { contacts, skipped } = readContacts("First Name,Email Address,Surname\nMaria,maria@x.com,Lopez");
    expect(contacts).toEqual([{ email: "maria@x.com", firstName: "Maria", lastName: "Lopez" }]);
    expect(skipped).toEqual([]);
  });

  it("works without a header row", () => {
    expect(readContacts("a@x.com\nb@x.com").contacts.map((c) => c.email)).toEqual(["a@x.com", "b@x.com"]);
  });

  it("skips missing, invalid, and duplicate emails, with line numbers", () => {
    // Line 3 is blank (ignored quietly); line 4 has a name but no email.
    const { contacts, skipped } = readContacts("email,name\na@x.com,A\n\n,Maria\nbanana,B\nA@X.com,C\nb@x.com,D");
    expect(contacts.map((c) => c.email)).toEqual(["a@x.com", "b@x.com"]);
    expect(skipped).toEqual([
      { line: 4, reason: "no email" },
      { line: 5, reason: '"banana" isn\'t a valid email' },
      { line: 6, reason: "A@X.com is a duplicate" },
    ]);
  });

  it("explains an empty file or a missing email column", () => {
    expect(readContacts("").error).toBe("The file is empty.");
    expect(readContacts("name,phone\nMaria,555").error).toBe("Couldn't find an email column.");
  });

  it("refuses very large lists", () => {
    const big = ["email", ...Array.from({ length: 10_001 }, (_, i) => `p${i}@x.com`)].join("\n");
    expect(readContacts(big).error).toContain("over 10,000");
  });
});

describe("toContactsCsv", () => {
  it("writes a clean CSV, quoting where needed and defusing spreadsheet formulas", () => {
    expect(
      toContactsCsv([
        { email: "a@x.com", firstName: "Smith, Jr.", lastName: "=HYPERLINK(1)" },
        { email: "b@x.com", firstName: "", lastName: "" },
      ]),
    ).toBe('email,first_name,last_name\na@x.com,"Smith, Jr.",\'=HYPERLINK(1)\nb@x.com,,');
  });
});

describe("isEmail", () => {
  it.each(["a@x.com", " a@x.co.uk "])("accepts %j", (v) => expect(isEmail(v)).toBe(true));
  it.each(["", "a@x", "a b@x.com", "a@x.com,b@x.com", "@x.com"])("rejects %j", (v) => expect(isEmail(v)).toBe(false));
});
