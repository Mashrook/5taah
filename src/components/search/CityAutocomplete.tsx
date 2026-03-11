import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

const saudiCities = [
  { name: "الرياض", nameEn: "Riyadh", code: "RUH", country: "المملكة العربية السعودية" },
  { name: "جدة", nameEn: "Jeddah", code: "JED", country: "المملكة العربية السعودية" },
  { name: "الدمام", nameEn: "Dammam", code: "DMM", country: "المملكة العربية السعودية" },
  { name: "المدينة المنورة", nameEn: "Madinah", code: "MED", country: "المملكة العربية السعودية" },
  { name: "مكة المكرمة", nameEn: "Makkah", code: "MKX", country: "المملكة العربية السعودية" },
  { name: "أبها", nameEn: "Abha", code: "AHB", country: "المملكة العربية السعودية" },
  { name: "تبوك", nameEn: "Tabuk", code: "TUU", country: "المملكة العربية السعودية" },
  { name: "الطائف", nameEn: "Taif", code: "TIF", country: "المملكة العربية السعودية" },
  { name: "القصيم", nameEn: "Qassim", code: "ELQ", country: "المملكة العربية السعودية" },
  { name: "حائل", nameEn: "Hail", code: "HAS", country: "المملكة العربية السعودية" },
  { name: "نجران", nameEn: "Najran", code: "EAM", country: "المملكة العربية السعودية" },
  { name: "جازان", nameEn: "Jazan", code: "GIZ", country: "المملكة العربية السعودية" },
  { name: "ينبع", nameEn: "Yanbu", code: "YNB", country: "المملكة العربية السعودية" },
  { name: "الباحة", nameEn: "Al Baha", code: "ABT", country: "المملكة العربية السعودية" },
  { name: "دبي", nameEn: "Dubai", code: "DXB", country: "الإمارات العربية المتحدة" },
  { name: "أبوظبي", nameEn: "Abu Dhabi", code: "AUH", country: "الإمارات العربية المتحدة" },
  { name: "القاهرة", nameEn: "Cairo", code: "CAI", country: "مصر" },
  { name: "إسطنبول", nameEn: "Istanbul", code: "IST", country: "تركيا" },
  { name: "لندن", nameEn: "London", code: "LHR", country: "المملكة المتحدة" },
  { name: "باريس", nameEn: "Paris", code: "CDG", country: "فرنسا" },
  { name: "كوالالمبور", nameEn: "Kuala Lumpur", code: "KUL", country: "ماليزيا" },
  { name: "بانكوك", nameEn: "Bangkok", code: "BKK", country: "تايلاند" },
  { name: "عمّان", nameEn: "Amman", code: "AMM", country: "الأردن" },
  { name: "بيروت", nameEn: "Beirut", code: "BEY", country: "لبنان" },
  { name: "الكويت", nameEn: "Kuwait", code: "KWI", country: "الكويت" },
  { name: "البحرين", nameEn: "Bahrain", code: "BAH", country: "البحرين" },
  { name: "مسقط", nameEn: "Muscat", code: "MCT", country: "عُمان" },
  { name: "الدوحة", nameEn: "Doha", code: "DOH", country: "قطر" },
];

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  showCode?: boolean;
  className?: string;
  inputClassName?: string;
}

export default function CityAutocomplete({ value, onChange, placeholder, label, showCode = false, className, inputClassName }: CityAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState(saudiCities);
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

  const handleChange = (val: string) => {
    onChange(val);
    if (val.length > 0) {
      const lower = val.toLowerCase();
      const results = saudiCities.filter(
        (c) =>
          c.name.includes(val) ||
          c.nameEn.toLowerCase().includes(lower) ||
          c.code.toLowerCase().includes(lower) ||
          c.country.includes(val)
      );
      setFiltered(results);
      setOpen(true);
    } else {
      setFiltered(saudiCities);
      setOpen(true);
    }
  };

  const handleSelect = (city: typeof saudiCities[0]) => {
    onChange(city.name);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className || ""}`}>
      {label && <label className="text-sm text-muted-foreground block mb-1">{label}</label>}
      <Input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={inputClassName || "bg-muted/30"}
        onFocus={() => { setFiltered(value.length > 0 ? filtered : saudiCities); setOpen(true); }}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {filtered.map((city) => (
            <button
              key={city.code}
              type="button"
              onClick={() => handleSelect(city)}
              className="flex items-center gap-3 w-full px-4 py-3 text-right hover:bg-muted/50 transition-colors border-b border-border/30 last:border-b-0"
            >
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">{city.name}</p>
                <p className="text-xs text-muted-foreground">{city.nameEn} · {city.country}</p>
              </div>
              <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{city.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
