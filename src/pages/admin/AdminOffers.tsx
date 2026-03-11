import { Tag } from "lucide-react";

export default function AdminOffers() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">إدارة العروض</h1>
      <div className="text-center py-16 text-muted-foreground">
        <Tag className="w-12 h-12 mx-auto mb-4 opacity-40" />
        <p>قريباً - إدارة العروض والخصومات</p>
      </div>
    </div>
  );
}
