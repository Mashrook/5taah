import * as React from "react";
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

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
  /** Enable year/month dropdown navigation (useful for DOB). */
  captionLayout?: "buttons" | "dropdown" | "dropdown-buttons";
  fromYear?: number;
  toYear?: number;
}

function DatePickerInput({
  value,
  onChange,
  placeholder = "اختر تاريخاً",
  disabled,
  className,
  align = "start",
  captionLayout,
  fromYear,
  toYear,
}: DatePickerInputProps) {
  const selected = React.useMemo(() => {
    if (!value) return undefined;
    try {
      return parseISO(value);
    } catch {
      return undefined;
    }
  }, [value]);

  const hasDropdown = captionLayout === "dropdown" || captionLayout === "dropdown-buttons";

  // Default month: selected date, or middle of range, or current month
  const defaultMonth = React.useMemo(() => {
    if (selected) return selected;
    if (hasDropdown && fromYear && toYear) {
      const midYear = Math.round((fromYear + toYear) / 2);
      return new Date(midYear, 0, 1);
    }
    return new Date();
  }, [selected, hasDropdown, fromYear, toYear]);

  const [displayMonth, setDisplayMonth] = React.useState<Date>(defaultMonth);

  // Sync display month when selected changes
  React.useEffect(() => {
    if (selected) setDisplayMonth(selected);
  }, [selected]);

  const handleMonthChange = (monthIdx: number) => {
    setDisplayMonth(new Date(displayMonth.getFullYear(), monthIdx, 1));
  };

  const handleYearChange = (year: number) => {
    setDisplayMonth(new Date(year, displayMonth.getMonth(), 1));
  };

  const handlePrevMonth = () => {
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1));
  };

  // Generate year options (reversed so newest first)
  const yearOptions = React.useMemo(() => {
    const from = fromYear ?? 1940;
    const to = toYear ?? new Date().getFullYear();
    const years: number[] = [];
    for (let y = to; y >= from; y--) years.push(y);
    return years;
  }, [fromYear, toYear]);

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
          <span dir="rtl" className="truncate">{selected ? format(selected, "d MMMM yyyy", { locale: ar }) : placeholder}</span>
          <CalendarIcon className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        {hasDropdown ? (
          <div className="p-3 pointer-events-auto">
            {/* Custom Year/Month Selectors */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={handlePrevMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2 flex-1 justify-center">
                {/* Month Select */}
                <select
                  title="اختر الشهر"
                  value={displayMonth.getMonth()}
                  onChange={(e) => handleMonthChange(Number(e.target.value))}
                  className="appearance-none bg-background border border-border rounded-md px-2 py-1 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
                  dir="rtl"
                >
                  {arabicMonths.map((name, idx) => (
                    <option key={idx} value={idx}>{name}</option>
                  ))}
                </select>

                {/* Year Select */}
                <select
                  title="اختر السنة"
                  value={displayMonth.getFullYear()}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                  className="appearance-none bg-background border border-border rounded-md px-2 py-1 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
                  dir="rtl"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={handleNextMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar (days only, no built-in caption) */}
            <Calendar
              mode="single"
              selected={selected}
              onSelect={(d) => onChange(d ? toYmdLocal(d) : "")}
              disabled={disabled}
              month={displayMonth}
              onMonthChange={setDisplayMonth}
              dir="rtl"
              locale={ar}
              classNames={{
                caption: "hidden",
                nav: "hidden",
              }}
            />
          </div>
        ) : (
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
        )}
      </PopoverContent>
    </Popover>
  );
}

export default DatePickerInput;
