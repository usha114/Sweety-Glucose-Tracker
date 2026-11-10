export const SLOTS = ["morning_fasting", "after_breakfast", "after_lunch", "after_dinner"];

export function validateReading({ date, slot, value }) {
  if (!date || !slot || value === "" || value === null || value === undefined) {
    return "Please enter a date, time slot and glucose value.";
  }
  if (!SLOTS.includes(slot)) return "Please select a valid time slot.";
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 40 || parsed > 600) {
    return "Value must be a whole number between 40 and 600 mg/dl.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    return "Please enter a valid date.";
  }
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  if (date > todayString) return "Date cannot be in the future.";
  return null;
}
