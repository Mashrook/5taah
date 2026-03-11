import { Settings } from "lucide-react";

export default function AdminSettings() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">الإعدادات العامة</h1>
      <div className="text-center py-16 text-muted-foreground">
        <Settings className="w-12 h-12 mx-auto mb-4 opacity-40" />
        <p>قريباً - الإعدادات العامة للنظام</p>
      </div>
    </div>
  );
}
