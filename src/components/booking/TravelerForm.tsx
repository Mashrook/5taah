import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Phone, CreditCard, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { z } from "zod";

export interface TravelerData {
  firstName: string;
  lastName: string;
  idType: "national_id" | "passport";
  idNumber: string;
  passportExpiry?: string;
  dateOfBirth: string;
  phone: string;
}

const travelerSchema = z.object({
  firstName: z.string().min(2, "الاسم الأول يجب أن يكون حرفين على الأقل"),
  lastName: z.string().min(2, "اسم العائلة يجب أن يكون حرفين على الأقل"),
  idType: z.enum(["national_id", "passport"]),
  idNumber: z.string().min(5, "رقم الهوية / الجواز غير صحيح"),
  passportExpiry: z.string().optional(),
  dateOfBirth: z.string().min(1, "تاريخ الميلاد مطلوب"),
  phone: z.string().regex(/^[+\d\s-]{9,15}$/, "رقم الجوال غير صحيح"),
});

interface TravelerFormProps {
  onSubmit: (data: TravelerData) => void;
  onBack?: () => void;
  title?: string;
  submitLabel?: string;
}

export default function TravelerForm({ onSubmit, onBack, title = "بيانات المسافر", submitLabel = "التالي — الدفع" }: TravelerFormProps) {
  const [form, setForm] = useState<TravelerData>({
    firstName: "",
    lastName: "",
    idType: "national_id",
    idNumber: "",
    passportExpiry: "",
    dateOfBirth: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof TravelerData, string>>>({});

  const set = (field: keyof TravelerData, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  };

  const handleSubmit = () => {
    const result = travelerSchema.safeParse(form);
    if (!result.success) {
      const errs: Partial<Record<string, string>> = {};
      result.error.errors.forEach((e) => { errs[e.path[0]] = e.message; });
      if (form.idType === "passport" && !form.passportExpiry) {
        errs.passportExpiry = "تاريخ انتهاء الجواز مطلوب";
      }
      setErrors(errs);
      return;
    }
    if (form.idType === "passport" && !form.passportExpiry) {
      setErrors((p) => ({ ...p, passportExpiry: "تاريخ انتهاء الجواز مطلوب" }));
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="p-6 rounded-2xl bg-card border border-border/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-lg">{title}</h2>
          <p className="text-sm text-muted-foreground">أدخل بيانات المسافر لإتمام الحجز</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Name Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium mb-1.5 block">الاسم الأول *</Label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                placeholder="محمد"
                className={`pr-10 bg-muted/30 ${errors.firstName ? "border-destructive" : ""}`}
              />
            </div>
            {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">اسم العائلة *</Label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                placeholder="العلي"
                className={`pr-10 bg-muted/30 ${errors.lastName ? "border-destructive" : ""}`}
              />
            </div>
            {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName}</p>}
          </div>
        </div>

        {/* ID Type */}
        <div>
          <Label className="text-sm font-medium mb-1.5 block">نوع الوثيقة *</Label>
          <div className="flex gap-3">
            {[
              { value: "national_id", label: "هوية وطنية" },
              { value: "passport", label: "جواز سفر" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("idType", opt.value)}
                className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
                  form.idType === opt.value
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ID Number */}
        <div>
          <Label className="text-sm font-medium mb-1.5 block">
            {form.idType === "national_id" ? "رقم الهوية الوطنية *" : "رقم جواز السفر *"}
          </Label>
          <div className="relative">
            <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={form.idNumber}
              onChange={(e) => set("idNumber", e.target.value)}
              placeholder={form.idType === "national_id" ? "1XXXXXXXXX" : "A1234567"}
              dir="ltr"
              className={`pr-10 bg-muted/30 ${errors.idNumber ? "border-destructive" : ""}`}
            />
          </div>
          {errors.idNumber && <p className="text-xs text-destructive mt-1">{errors.idNumber}</p>}
        </div>

        {/* Passport Expiry (conditional) */}
        {form.idType === "passport" && (
          <div>
            <Label className="text-sm font-medium mb-1.5 block">تاريخ انتهاء الجواز *</Label>
            <div className="relative">
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={form.passportExpiry}
                onChange={(e) => set("passportExpiry", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className={`pr-10 bg-muted/30 ${errors.passportExpiry ? "border-destructive" : ""}`}
              />
            </div>
            {errors.passportExpiry && <p className="text-xs text-destructive mt-1">{errors.passportExpiry}</p>}
          </div>
        )}

        {/* Date of Birth */}
        <div>
          <Label className="text-sm font-medium mb-1.5 block">تاريخ الميلاد *</Label>
          <div className="relative">
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => set("dateOfBirth", e.target.value)}
              max={new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000).toISOString().split("T")[0]}
              className={`pr-10 bg-muted/30 ${errors.dateOfBirth ? "border-destructive" : ""}`}
            />
          </div>
          {errors.dateOfBirth && <p className="text-xs text-destructive mt-1">{errors.dateOfBirth}</p>}
        </div>

        {/* Phone */}
        <div>
          <Label className="text-sm font-medium mb-1.5 block">رقم الجوال *</Label>
          <div className="relative">
            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+966 5X XXX XXXX"
              dir="ltr"
              className={`pr-10 bg-muted/30 ${errors.phone ? "border-destructive" : ""}`}
            />
          </div>
          {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-8">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex-1">
            <ChevronRight className="w-4 h-4 ml-1" />
            رجوع
          </Button>
        )}
        <Button variant="gold" onClick={handleSubmit} className="flex-1">
          {submitLabel}
          <ChevronLeft className="w-4 h-4 mr-1" />
        </Button>
      </div>
    </div>
  );
}
