import * as React from "react";
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function toYmdLocal(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export interface DatePickerInputProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  className?: string;
  align?: React.ComponentProps<typeof PopoverContent>["align"];
  captionLayout?: "buttons" | "dropdown" | "dropdown-buttons";
  fromYear?: number;
  toYear?: number;
}

/** ─── Dropdown-based DOB Picker ─── */
function DropdownDatePicker({
  value,
  onChange,
  placeholder,
  className,
  align,
  fromYear = 1940,
  toYear = new Date().getFullYear(),
  disabled,
}: DatePickerInputProps) {
  const parsed = React.useMemo(() => {
    if (!value) return null;
    try {
      const d = parseISO(value);
      return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
    } catch {
      return null;
    }
  }, [value]);

  const [year, setYear] = React.useState<number | "">(parsed?.year ?? "");
  const [month, setMonth] = React.useState<number | "">(parsed?.month ?? "");
  const [day, setDay] = React.useState<number | "">(parsed?.day ?? "");
  const [open, setOpen] = React.useState(false);

  // Sync internal state when value prop changes
  React.useEffect(() => {
    if (parsed) {
      setYear(parsed.year);
      setMonth(parsed.month);
      setDay(parsed.day);
    }
  }, [parsed]);

  // Get days in month
  const daysInMonth = React.useMemo(() => {
    if (year === "" || month === "") return 31;
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  // Auto-correct day if exceeds month
  React.useEffect(() => {
    if (day !== "" && day > daysInMonth) {
      setDay(daysInMonth);
    }
  }, [daysInMonth, day]);

  // Emit onChange when all 3 are selected
  React.useEffect(() => {
    if (year !== "" && month !== "" && day !== "") {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      // Only check disabled if provided
      if (disabled) {
        const d = new Date(year, month, day);
        if (disabled(d)) return;
      }
      if (dateStr !== value) {
        onChange(dateStr);
      }
    }
  }, [year, month, day, disabled, onChange, value]);

  // Year options (newest first)
  const yearOptions = React.useMemo(() => {
    const years: number[] = [];
    for (let y = toYear; y >= fromYear; y--) years.push(y);
    return years;
  }, [fromYear, toYear]);

  // Day options
  const dayOptions = React.useMemo(() => {
    const days: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [daysInMonth]);

  const displayText = React.useMemo(() => {
    if (!value) return null;
    try {
      return format(parseISO(value), "d MMMM yyyy", { locale: ar });
    } catch {
      return null;
    }
  }, [value]);

  const selectClass =
    "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer text-foreground";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between bg-muted/30 h-10 px-3 font-normal",
            !displayText && "text-muted-foreground",
            className,
          )}
        >
          <span dir="rtl" className="truncate">
            {displayText || placeholder || "اختر تاريخ الميلاد"}
          </span>
          <CalendarIcon className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align={align || "start"}>
        <div className="space-y-3">
          <p className="text-sm font-medium text-center text-muted-foreground mb-2">اختر تاريخ الميلاد</p>

          {/* Year */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">السنة</label>
            <select
              title="اختر السنة"
              value={year}
              onChange={(e) => setYear(e.target.value ? Number(e.target.value) : "")}
              className={selectClass}
              dir="rtl"
            >
              <option value="">-- اختر السنة --</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">الشهر</label>
            <select
              title="اختر الشهر"
              value={month}
              onChange={(e) => setMonth(e.target.value !== "" ? Number(e.target.value) : "")}
              className={selectClass}
              dir="rtl"
            >
              <option value="">-- اختر الشهر --</option>
              {arabicMonths.map((name, idx) => (
                <option key={idx} value={idx}>{name}</option>
              ))}
            </select>
          </div>

          {/* Day */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">اليوم</label>
            <select
              title="اختر اليوم"
              value={day}
              onChange={(e) => setDay(e.target.value ? Number(e.target.value) : "")}
              className={selectClass}
              dir="rtl"
            >
              <option value="">-- اختر اليوم --</option>
              {dayOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Selected date display */}
          {displayText && (
            <div className="text-center pt-1 border-t border-border">
              <p className="text-sm text-primary font-medium mt-2">✓ {displayText}</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** ─── Standard Calendar Picker ─── */
function StandardDatePicker({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  align,
}: DatePickerInputProps) {
  const selected = React.useMemo(() => {
    if (!value) return undefined;
    try {
      return parseISO(value);
    } catch {
      return undefined;
    }
  }, [value]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between bg-muted/30 h-10 px-3 font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span dir="rtl" className="truncate">
            {selected ? format(selected, "d MMMM yyyy", { locale: ar }) : placeholder || "اختر تاريخاً"}
          </span>
          <CalendarIcon className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align || "start"}>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => onChange(d ? toYmdLocal(d) : "")}
          disabled={disabled}
          initialFocus
          dir="rtl"
          locale={ar}
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}

/** ─── Main Component ─── */
function DatePickerInput(props: DatePickerInputProps) {
  const hasDropdown = props.captionLayout === "dropdown" || props.captionLayout === "dropdown-buttons";

  if (hasDropdown) {
    return <DropdownDatePicker {...props} />;
  }

  return <StandardDatePicker {...props} />;
}

export default DatePickerInput;
