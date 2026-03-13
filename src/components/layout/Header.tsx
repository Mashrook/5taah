import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu, X, User, LogOut, Sun, Moon, Search,
  Plane, Hotel, Car, Map, ArrowRightLeft, BookOpen,
  GraduationCap, Tag, PartyPopper, Landmark, Newspaper,
  Globe, ChevronDown
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useTenantStore } from "@/stores/tenantStore";
import khattahLogo from "@/assets/khattah-logo.png";

const categoryLinks = [
  { href: "/flights", label: "طيران", icon: Plane },
  { href: "/hotels", label: "فنادق", icon: Hotel },
  { href: "/cars", label: "سيارات", icon: Car },
  { href: "/activities", label: "جولات", icon: Map },
  { href: "/tours", label: "المواسم", icon: Globe },
  { href: "/transfers", label: "مواصلات", icon: ArrowRightLeft },
  { href: "/offers", label: "العروض", icon: Tag },
  { href: "/festivals", label: "فعاليات", icon: PartyPopper },
  { href: "/saudi-tourism", label: "سياحة السعودية", icon: Landmark },
  { href: "/study-abroad", label: "الدراسة بالخارج", icon: GraduationCap },
];

const moreLinks = [
  { href: "/news", label: "الأخبار", icon: Newspaper },
  { href: "/destinations", label: "الوجهات", icon: Globe },
  { href: "/articles", label: "مقالات", icon: BookOpen },
  { href: "/about", label: "من نحن", icon: null },
  { href: "/contact", label: "اتصل بنا", icon: null },
];

const quickSearchItems = [
  { label: "رحلات طيران", href: "/flights", icon: Plane },
  { label: "حجز فنادق", href: "/hotels", icon: Hotel },
  { label: "تأجير سيارات", href: "/cars", icon: Car },
  { label: "جولات سياحية", href: "/activities", icon: Map },
  { label: "نقل المطار", href: "/transfers", icon: ArrowRightLeft },
  { label: "العروض الحالية", href: "/offers", icon: Tag },
  { label: "مواسم السعودية", href: "/tours", icon: Globe },
  { label: "فعاليات", href: "/festivals", icon: PartyPopper },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, profile, logout } = useAuthStore();
  const { branding, tenant } = useTenantStore();
  const { theme, setTheme } = useTheme();
  const searchRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  const logoUrl = branding?.logo_url || khattahLogo;
  const brandName = tenant?.name || "خته";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSearch = quickSearchItems.filter(
    (item) => searchQuery && item.label.includes(searchQuery)
  );

  const handleSearchSelect = (href: string) => {
    navigate(href);
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <header className={cn("fixed top-0 right-0 left-0 z-50 bg-background transition-shadow duration-200", scrolled ? "shadow-md" : "shadow-sm")}>
      {/* Row 1: Logo + Search + Auth */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img src={logoUrl} alt={brandName} className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl object-contain" />
              <span className="text-xl font-bold text-primary whitespace-nowrap">{brandName}</span>
            </Link>

            {/* Search Bar - Klook style */}
            <div ref={searchRef} className="hidden md:block flex-1 max-w-2xl relative">
              <div className={cn("flex items-center gap-3 bg-secondary rounded-full border px-5 h-11 transition-all", searchOpen ? "border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.15)]" : "border-transparent hover:border-border")}>
                <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                <input type="text" placeholder="ابحث عن رحلات، فنادق، أنشطة..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none text-right" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setSearchOpen(true)} />
              </div>

              {searchOpen && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-background rounded-2xl border border-border shadow-xl p-4 z-50">
                  {searchQuery && filteredSearch.length > 0 ? (
                    <div className="space-y-1">
                      {filteredSearch.map((item) => (
                        <button key={item.href} onClick={() => handleSearchSelect(item.href)} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors text-right">
                          <item.icon className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-sm text-foreground">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground mb-3 px-1 font-medium">بحث سريع</p>
                      <div className="grid grid-cols-2 gap-1">
                        {quickSearchItems.map((item) => (
                          <button key={item.href} onClick={() => handleSearchSelect(item.href)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors text-right">
                            <item.icon className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-sm text-foreground">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Auth + Theme */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="تبديل الوضع">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard/bookings"><Button variant="ghost" size="sm" className="text-[13px] rounded-full">حجوزاتي</Button></Link>
                  <Link to="/dashboard"><Button variant="ghost" size="sm" className="text-[13px] rounded-full"><User className="w-4 h-4 ml-1.5" />{profile?.full_name || user?.email || "حسابي"}</Button></Link>
                  <Button variant="outline" size="sm" className="text-[13px] rounded-full" onClick={() => logout()}><LogOut className="w-4 h-4 ml-1.5" />خروج</Button>
                </>
              ) : (
                <>
                  <Link to="/login"><Button variant="ghost" size="sm" className="text-[13px] rounded-full">تسجيل الدخول</Button></Link>
                  <Link to="/register"><Button size="sm" className="text-[13px] rounded-full bg-primary text-white hover:bg-primary/90">إنشاء حساب</Button></Link>
                </>
              )}
            </div>

            {/* Mobile buttons */}
            <div className="flex md:hidden items-center gap-1">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setSearchOpen(!searchOpen); setMobileMenuOpen(false); }}><Search className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setSearchOpen(false); }}>{mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Category Nav (Klook-style pills) */}
      <nav className="hidden lg:block bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center gap-0.5 h-11 overflow-x-auto scrollbar-hide">
            <Link to="/"><button className={cn("px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap", location.pathname === "/" ? "bg-primary text-white" : "text-foreground/70 hover:bg-secondary hover:text-foreground")}>الرئيسية</button></Link>
            {categoryLinks.map((link) => (
              <Link key={link.href} to={link.href}><button className={cn("flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap", location.pathname === link.href ? "bg-primary text-white" : "text-foreground/70 hover:bg-secondary hover:text-foreground")}><link.icon className="w-3.5 h-3.5" />{link.label}</button></Link>
            ))}
            <div ref={moreRef} className="relative mr-auto">
              <button onClick={() => setMoreOpen(!moreOpen)} className={cn("flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap", moreOpen ? "bg-primary text-white" : "text-foreground/70 hover:bg-secondary hover:text-foreground")}>المزيد<ChevronDown className={cn("w-3.5 h-3.5 transition-transform", moreOpen && "rotate-180")} /></button>
              {moreOpen && (
                <div className="absolute top-full mt-1 left-0 bg-background rounded-2xl border border-border shadow-xl py-2 min-w-[180px] z-50">
                  {moreLinks.map((link) => (
                    <Link key={link.href} to={link.href}><button className={cn("flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors text-right", location.pathname === link.href ? "text-primary bg-primary/5" : "text-foreground/70 hover:text-foreground hover:bg-secondary")}>{link.label}</button></Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Search */}
      {searchOpen && (
        <div className="md:hidden bg-background border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 bg-secondary rounded-full px-4 h-10">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input type="text" placeholder="ابحث عن رحلات، فنادق، أنشطة..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none text-right" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-1 mt-3">
            {(searchQuery ? filteredSearch : quickSearchItems).map((item) => (
              <button key={item.href} onClick={() => handleSearchSelect(item.href)} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-secondary transition-colors text-right">
                <item.icon className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm text-foreground">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      <div className={cn("lg:hidden overflow-hidden transition-all duration-300 bg-background", mobileMenuOpen ? "max-h-[80vh] overflow-y-auto" : "max-h-0")}>
        <div className="px-4 py-3 space-y-1">
          <p className="text-xs text-muted-foreground font-medium px-2 mb-1">الخدمات</p>
          {categoryLinks.map((link) => (
            <Link key={link.href} to={link.href}><button className={cn("flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-colors", location.pathname === link.href ? "bg-primary/10 text-primary font-medium" : "text-foreground/80 hover:bg-secondary")}><link.icon className="w-4 h-4" />{link.label}</button></Link>
          ))}
          <div className="border-t border-border my-2" />
          <p className="text-xs text-muted-foreground font-medium px-2 mb-1">المزيد</p>
          {moreLinks.map((link) => (
            <Link key={link.href} to={link.href}><button className={cn("flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-colors", location.pathname === link.href ? "bg-primary/10 text-primary font-medium" : "text-foreground/80 hover:bg-secondary")}>{link.label}</button></Link>
          ))}
          <div className="border-t border-border my-2" />
          <Button variant="ghost" className="w-full justify-start text-sm rounded-xl" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun className="w-4 h-4 ml-2" /> : <Moon className="w-4 h-4 ml-2" />}{theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}</Button>
          <div className="flex flex-col gap-2 pt-2">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard/bookings"><Button variant="ghost" className="w-full justify-start text-sm rounded-xl">حجوزاتي</Button></Link>
                <Link to="/dashboard"><Button variant="ghost" className="w-full justify-start text-sm rounded-xl"><User className="w-4 h-4 ml-2" />حسابي</Button></Link>
                <Button variant="outline" className="w-full justify-start text-sm rounded-xl" onClick={() => logout()}><LogOut className="w-4 h-4 ml-2" />خروج</Button>
              </>
            ) : (
              <>
                <Link to="/login"><Button variant="outline" className="w-full rounded-xl">تسجيل الدخول</Button></Link>
                <Link to="/register"><Button className="w-full rounded-xl bg-primary text-white hover:bg-primary/90">إنشاء حساب</Button></Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
