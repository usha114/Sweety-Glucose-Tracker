import test from "node:test";
import assert from "node:assert/strict";
import { validateReading } from "../src/utils/validation.js";

const today = new Date();
const date = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

test("accepts a valid reading", () => {
  assert.equal(validateReading({ date, slot: "morning_fasting", value: 100 }), null);
});
test("rejects a missing value", () => {
  assert.match(validateReading({ date, slot: "morning_fasting", value: "" }), /required/i);
});
test("rejects values outside 40 to 600", () => {
  assert.match(validateReading({ date, slot: "morning_fasting", value: 39 }), /between 40 and 600/i);
});
test("rejects decimal values", () => {
  assert.match(validateReading({ date, slot: "morning_fasting", value: 100.5 }), /whole number/i);
});
test("rejects invalid slots", () => {
  assert.match(validateReading({ date, slot: "night", value: 100 }), /valid time slot/i);
});
