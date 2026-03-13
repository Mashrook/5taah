import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Hotel, MapPin } from "lucide-react";
import { hotels } from "@/data/hotelsData";

const cities = [
  { name: "الرياض", nameEn: "Riyadh", type: "city" as const },
  { name: "جدة", nameEn: "Jeddah", type: "city" as const },
  { name: "مكة المكرمة", nameEn: "Makkah", type: "city" as const },
  { name: "المدينة المنورة", nameEn: "Madinah", type: "city" as const },
  { name: "الدمام", nameEn: "Dammam", type: "city" as const },
  { name: "أبها", nameEn: "Abha", type: "city" as const },
  { name: "الطائف", nameEn: "Taif", type: "city" as const },
  { name: "تبوك", nameEn: "Tabuk", type: "city" as const },
];

type Suggestion = { name: string; nameEn?: string; type: "city" | "hotel"; subtext?: string };

interface HotelAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  inputClassName?: string;
}

export default function HotelAutocomplete({ value, onChange, placeholder, label, className, inputClassName }: HotelAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const buildSuggestions = (val: string): Suggestion[] => {
    const lower = val.toLowerCase();
    const cityResults: Suggestion[] = cities
      .filter((c) => c.name.includes(val) || c.nameEn.toLowerCase().includes(lower))
      .map((c) => ({ name: c.name, nameEn: c.nameEn, type: "city", subtext: c.nameEn }));
    const hotelResults: Suggestion[] = hotels
      .filter((h) => h.name.includes(val) || h.city.includes(val) || h.name.toLowerCase().includes(lower))
      .slice(0, 5)
      .map((h) => ({ name: h.name, type: "hotel", subtext: h.city }));
    return [...cityResults, ...hotelResults];
  };

  const handleChange = (val: string) => {
    onChange(val);
    if (val.length > 0) {
      setSuggestions(buildSuggestions(val));
      setOpen(true);
    } else {
      const defaultSuggestions: Suggestion[] = cities.map(c => ({ name: c.name, nameEn: c.nameEn, type: "city", subtext: c.nameEn }));
      setSuggestions(defaultSuggestions);
      setOpen(true);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className || ""}`}>
      {label && <label className="text-sm text-muted-foreground block mb-1">{label}</label>}
      <Input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={inputClassName || "bg-muted/30"}
        onFocus={() => {
          const s = value.length > 0 ? buildSuggestions(value) : cities.map(c => ({ name: c.name, nameEn: c.nameEn, type: "city" as const, subtext: c.nameEn }));
          setSuggestions(s);
          setOpen(true);
        }}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={`${s.name}-${i}`}
              type="button"
              onClick={() => { onChange(s.name); setOpen(false); }}
              className="flex items-center gap-3 w-full px-4 py-3 text-right hover:bg-muted/50 transition-colors border-b border-border/30 last:border-b-0"
            >
              {s.type === "city" ? (
                <MapPin className="w-4 h-4 text-primary shrink-0" />
              ) : (
                <Hotel className="w-4 h-4 text-secondary shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.subtext}</p>
              </div>
              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                {s.type === "city" ? "مدينة" : "فندق"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
