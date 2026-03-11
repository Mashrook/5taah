import { Globe } from "lucide-react";

export default function AdminDestinations() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">إدارة الوجهات</h1>
      <div className="text-center py-16 text-muted-foreground">
        <Globe className="w-12 h-12 mx-auto mb-4 opacity-40" />
        <p>قريباً - إدارة الوجهات السياحية</p>
      </div>
    </div>
  );
}
