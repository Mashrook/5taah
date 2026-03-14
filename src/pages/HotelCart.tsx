import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, Calendar, Moon, Users, Tag, CreditCard, ChevronLeft, Hotel, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useHotelCartStore } from "@/stores/hotelCartStore";
import { useTenantStore } from "@/stores/tenantStore";
import BookingStepper from "@/components/ui/BookingStepper";
import MoyasarPayment from "@/components/payment/MoyasarPayment";
import { createPaymentSession } from "@/lib/paymentSessionClient";

const bookingSteps = [{ label: "اختيار الغرفة" }, { label: "مراجعة السلة" }, { label: "الدفع" }, { label: "التأكيد" }];

type CartStep = "review" | "payment";

export default function HotelCart() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tenant } = useTenantStore();
  const { items, coupon, discount, removeItem, setCoupon, applyCoupon, getSubtotal, getTotal, clearCart } = useHotelCartStore();

  const [step, setStep] = useState<CartStep>("review");
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [paymentPreparing, setPaymentPreparing] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast({ title: "السلة فارغة", description: "أضف غرفة واحدة على الأقل قبل الدفع", variant: "destructive" });
      return;
    }

    if (!paymentSessionId) {
      setPaymentPreparing(true);
      try {
        const created = await createPaymentSession({
          flow: "hotel",
          amount: getTotal(),
          currency: "SAR",
          payment_provider: "moyasar",
          tenant_id: tenant?.id || null,
          travelers_count: items.reduce((sum, item) => sum + Math.max(item.guests || 1, 1), 0),
          details_json: {
            source: "hotel_cart",
            coupon,
            discount,
            subtotal: getSubtotal(),
            total: getTotal(),
            items: items.map((item) => ({
              hotel_id: item.hotelId,
              hotel_name: item.hotelName,
              room_id: item.roomId,
              room_name: item.roomName,
              check_in: item.checkIn,
              check_out: item.checkOut,
              nights: item.nights,
              guests: item.guests,
              price_per_night: item.pricePerNight,
              total_price: item.totalPrice,
            })),
          },
        });
        setPaymentSessionId(created.id);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "تعذر تجهيز الدفع";
        toast({ title: "خطأ", description: message, variant: "destructive" });
        return;
      } finally {
        setPaymentPreparing(false);
      }
    }

    setStep("payment");
  };

  return (
    <div className="min-h-screen section-padding">
      <div className="container mx-auto px-4 lg:px-8">
        <BookingStepper steps={bookingSteps} currentStep={step === "review" ? 1 : 2} className="max-w-2xl mx-auto mb-12" />

        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">سلة الحجوزات</h2>
                <p className="text-sm text-muted-foreground">{items.length} عنصر</p>
              </div>
            </div>
            <Button variant="ghost" onClick={() => navigate("/hotels")} className="gap-2">
              متابعة التصفح
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-20 rounded-3xl bg-card/50 border border-border">
              <Hotel className="w-20 h-20 mx-auto mb-4 text-muted-foreground/20" />
              <p className="text-xl font-bold mb-2">السلة فارغة</p>
              <p className="text-muted-foreground mb-6">لم تقم بإضافة أي حجوزات بعد</p>
              <Button variant="gold" size="lg" onClick={() => navigate("/hotels")}>
                تصفح الفنادق
              </Button>
            </div>
          ) : step === "payment" && paymentSessionId ? (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="rounded-2xl bg-card border border-border p-5">
                <h3 className="font-bold mb-2">الدفع</h3>
                <p className="text-sm text-muted-foreground mb-4">أكمل الدفع لتأكيد حجوزات الفنادق.</p>
                <MoyasarPayment
                  amount={getTotal()}
                  description={`Hotel cart (${items.length} items)`}
                  callbackUrl={`${window.location.origin}/hotels/payment-callback?session=${paymentSessionId}`}
                  methods={["creditcard", "applepay", "samsungpay"]}
                />
              </div>
              <Button variant="outline" className="w-full" onClick={() => setStep("review")}>
                رجوع لمراجعة السلة
              </Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div key={item.roomId} className="rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/20 transition-all">
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-44 h-36 sm:h-auto shrink-0 overflow-hidden">
                        <img src={item.roomImage} alt={item.roomName} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-lg">{item.hotelName}</h3>
                            <p className="text-sm text-muted-foreground">{item.roomName}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeItem(item.roomId)}
                            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                          <span className="flex items-center gap-1.5 bg-muted/30 px-2.5 py-1 rounded-lg">
                            <Calendar className="w-3.5 h-3.5" /> {item.checkIn}
                          </span>
                          <span className="flex items-center gap-1.5 bg-muted/30 px-2.5 py-1 rounded-lg">
                            <Calendar className="w-3.5 h-3.5" /> {item.checkOut}
                          </span>
                          <span className="flex items-center gap-1.5 bg-muted/30 px-2.5 py-1 rounded-lg">
                            <Moon className="w-3.5 h-3.5" /> {item.nights} {item.nights > 1 ? "ليالي" : "ليلة"}
                          </span>
                          <span className="flex items-center gap-1.5 bg-muted/30 px-2.5 py-1 rounded-lg">
                            <Users className="w-3.5 h-3.5" /> {item.guests}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-primary">{item.totalPrice.toLocaleString()}</span>
                          <span className="text-sm text-muted-foreground">ر.س</span>
                          <span className="text-xs text-muted-foreground mr-1">
                            ({item.pricePerNight.toLocaleString()} × {item.nights})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-card border border-border p-5">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" /> كوبون الخصم
                  </h3>
                  <div className="flex gap-2">
                    <Input placeholder="أدخل الكوبون" value={coupon} onChange={(e) => setCoupon(e.target.value)} className="bg-muted/20" />
                    <Button variant="outline" onClick={applyCoupon} className="shrink-0">
                      تطبيق
                    </Button>
                  </div>
                  {discount > 0 && <p className="text-sm text-emerald-400 mt-2">✓ خصم {discount}% مطبق</p>}
                </div>

                <div className="rounded-2xl bg-card border border-border p-5">
                  <h3 className="font-bold mb-4">ملخص الحجز</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الإجمالي الفرعي</span>
                      <span>{getSubtotal().toLocaleString()} ر.س</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>الخصم ({discount}%)</span>
                        <span>- {((getSubtotal() * discount) / 100).toLocaleString()} ر.س</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>الضرائب</span>
                      <span>شاملة</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between text-lg font-bold">
                      <span>الإجمالي</span>
                      <span className="text-primary">{getTotal().toLocaleString()} ر.س</span>
                    </div>
                  </div>
                  <Button variant="gold" size="lg" className="w-full mt-5 gap-2" onClick={handleCheckout} disabled={paymentPreparing}>
                    {paymentPreparing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        تجهيز الدفع...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        المتابعة للدفع
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-3">🔒 الدفع آمن ومشفّر</p>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground mt-2 w-full"
                    onClick={() => {
                      clearCart();
                      toast({ title: "تم مسح السلة" });
                    }}
                  >
                    مسح السلة
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
