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
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => onChange(d ? toYmdLocal(d) : "")}
          disabled={disabled}
          initialFocus
          dir="rtl"
          locale={ar}
          className={cn("p-3 pointer-events-auto")}
          {...(captionLayout ? { captionLayout } : {})}
          {...(fromYear !== undefined ? { fromYear } : {})}
          {...(toYear !== undefined ? { toYear } : {})}
        />
      </PopoverContent>
    </Popover>
  );
}

export default DatePickerInput;
