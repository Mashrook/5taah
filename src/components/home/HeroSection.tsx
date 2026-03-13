import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plane, Hotel, Users, Search, Minus, Plus, Car, Map, ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import CityAutocomplete from "@/components/search/CityAutocomplete";
import HotelAutocomplete from "@/components/search/HotelAutocomplete";
import DatePickerInput from "@/components/ui/date-picker-input";
import { useToast } from "@/hooks/use-toast";

type SearchTab = "flights" | "hotels" | "cars" | "tours" | "transfers";

const tabs = [
  { key: "flights" as SearchTab, icon: Plane, label: "ط·ظٹط±ط§ظ†" },
  { key: "hotels" as SearchTab, icon: Hotel, label: "ظپظ†ط§ط¯ظ‚" },
  { key: "cars" as SearchTab, icon: Car, label: "ط³ظٹط§ط±ط§طھ" },
  { key: "tours" as SearchTab, icon: Map, label: "ط¬ظˆظ„ط§طھ" },
  { key: "transfers" as SearchTab, icon: ArrowRightLeft, label: "ظ†ظ‚ظ„" },
];

export default function HeroSection() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchTab, setSearchTab] = useState<SearchTab>("flights");
  const [tripType, setTripType] = useState<"roundtrip" | "oneway">("roundtrip");

  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState(1);

  const [hotelCity, setHotelCity] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);

  const [carCity, setCarCity] = useState("");
  const [carPickup, setCarPickup] = useState("");
  const [carReturn, setCarReturn] = useState("");

  const [tourCity, setTourCity] = useState("");
  const [tourDate, setTourDate] = useState("");
  const [tourGuests, setTourGuests] = useState(2);

  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferDate, setTransferDate] = useState("");
  const [transferPassengers, setTransferPassengers] = useState(2);

  const disablePast = (date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0));

  const handleSearch = () => {
    if (searchTab === "flights") {
      if (!fromCity || !toCity || !departDate) {
        toast({ title: "ط¨ظٹط§ظ†ط§طھ ظ†ط§ظ‚طµط©", description: "ظٹط±ط¬ظ‰ طھط­ط¯ظٹط¯ ظ…ط¯ظٹظ†ط© ط§ظ„ظ…ط؛ط§ط¯ط±ط© ظˆط§ظ„ظˆطµظˆظ„ ظˆطھط§ط±ظٹط® ط§ظ„ط°ظ‡ط§ط¨", variant: "destructive" });
        return;
      }
      const params = new URLSearchParams({ from: fromCity, to: toCity, depart: departDate, passengers: String(passengers), tripType });
      if (tripType === "roundtrip" && returnDate) params.set("return", returnDate);
      navigate(`/flights?${params.toString()}`);
    } else if (searchTab === "hotels") {
      if (!hotelCity || !checkIn || !checkOut) {
        toast({ title: "ط¨ظٹط§ظ†ط§طھ ظ†ط§ظ‚طµط©", description: "ظٹط±ط¬ظ‰ طھط­ط¯ظٹط¯ ط§ظ„ظ…ط¯ظٹظ†ط© ظˆطھظˆط§ط±ظٹط® ط§ظ„ط¥ظ‚ط§ظ…ط©", variant: "destructive" });
        return;
      }
      navigate(`/hotels?${new URLSearchParams({ city: hotelCity, checkIn, checkOut, guests: String(guests) })}`);
    } else if (searchTab === "cars") {
      if (!carCity || !carPickup) {
        toast({ title: "ط¨ظٹط§ظ†ط§طھ ظ†ط§ظ‚طµط©", description: "ظٹط±ط¬ظ‰ طھط­ط¯ظٹط¯ ط§ظ„ظ…ط¯ظٹظ†ط© ظˆطھط§ط±ظٹط® ط§ظ„ط§ط³طھظ„ط§ظ…", variant: "destructive" });
        return;
      }
      const params = new URLSearchParams({ city: carCity, pickup: carPickup });
      if (carReturn) params.set("return", carReturn);
      navigate(`/cars?${params.toString()}`);
    } else if (searchTab === "tours") {
      const params = new URLSearchParams();
      if (tourCity) params.set("city", tourCity);
      if (tourDate) params.set("date", tourDate);
      if (tourGuests) params.set("guests", String(tourGuests));
      navigate(`/activities?${params.toString()}`);
    } else if (searchTab === "transfers") {
      if (!transferFrom || !transferDate) {
        toast({ title: "ط¨ظٹط§ظ†ط§طھ ظ†ط§ظ‚طµط©", description: "ظٹط±ط¬ظ‰ طھط­ط¯ظٹط¯ ظ…ظˆظ‚ط¹ ط§ظ„ط§ظ†ط·ظ„ط§ظ‚ ظˆط§ظ„طھط§ط±ظٹط®", variant: "destructive" });
        return;
      }
      const params = new URLSearchParams({ from: transferFrom, date: transferDate, passengers: String(transferPassengers) });
      if (transferTo) params.set("to", transferTo);
      navigate(`/transfers?${params.toString()}`);
    }
  };

  return (
    <section className="relative">
      {/* Klook-style Hero Banner */}
      <div className="bg-gradient-to-br from-primary via-primary to-orange-600 pb-20 pt-6">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3">
              ط§ظƒطھط´ظپ ظˆط¬ظ‡طھظƒ ط§ظ„ظ‚ط§ط¯ظ…ط© ظ…ط¹ ط®طھظ‡
            </h1>
            <p className="text-white/80 text-base lg:text-lg max-w-2xl mx-auto">
              ط§ط­ط¬ط² ط±ط­ظ„ط§طھ ط§ظ„ط·ظٹط±ط§ظ†طŒ ط§ظ„ظپظ†ط§ط¯ظ‚طŒ ط§ظ„ط³ظٹط§ط±ط§طھ ظˆط§ظ„ط¬ظˆظ„ط§طھ ط¨ط£ظپط¶ظ„ ط§ظ„ط£ط³ط¹ط§ط± ظ…ظ† ظ…ظƒط§ظ† ظˆط§ط­ط¯
            </p>
          </div>
        </div>
      </div>

      {/* Search Widget - overlapping the banner */}
      <div className="container mx-auto px-4 lg:px-8 -mt-14 relative z-10 pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl shadow-xl overflow-hidden border border-border">
            {/* Tabs */}
            <div className="flex border-b border-border overflow-x-auto scrollbar-hide bg-secondary/30">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSearchTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors relative ${
                    searchTab === tab.key
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {searchTab === tab.key && (
                    <span className="absolute bottom-0 inset-x-0 h-0.5 bg-primary rounded-t" />
                  )}
                </button>
              ))}
            </div>

            {/* Search Fields */}
            <div className="p-5">
              {searchTab === "flights" && (
                <>
                  <div className="flex gap-2 justify-end mb-4">
                    <button
                      onClick={() => { setTripType("oneway"); setReturnDate(""); }}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        tripType === "oneway" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      ط°ظ‡ط§ط¨ ظپظ‚ط·
                    </button>
                    <button
                      onClick={() => setTripType("roundtrip")}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        tripType === "roundtrip" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      ط°ظ‡ط§ط¨ ظˆط¹ظˆط¯ط©
                    </button>
                  </div>
                  <div className={`grid grid-cols-2 ${tripType === "roundtrip" ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-3`}>
                    <CityAutocomplete value={fromCity} onChange={setFromCity} placeholder="ظ…ظ† ط£ظٹظ†طں" showCode inputClassName="bg-secondary border-border text-sm text-right" />
                    <CityAutocomplete value={toCity} onChange={setToCity} placeholder="ط¥ظ„ظ‰ ط£ظٹظ†طں" showCode inputClassName="bg-secondary border-border text-sm text-right" />
                    <DatePickerInput value={departDate} onChange={setDepartDate} placeholder="طھط§ط±ظٹط® ط§ظ„ط°ظ‡ط§ط¨" disabled={disablePast} className="bg-secondary border-border text-sm" />
                    {tripType === "roundtrip" && (
                      <DatePickerInput value={returnDate} onChange={setReturnDate} placeholder="طھط§ط±ظٹط® ط§ظ„ط¹ظˆط¯ط©" disabled={(d) => disablePast(d) || (departDate ? d < new Date(departDate) : false)} className="bg-secondary border-border text-sm" />
                    )}
                  </div>
                </>
              )}

              {searchTab === "hotels" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <HotelAutocomplete value={hotelCity} onChange={setHotelCity} placeholder="ط§ظ„ظ…ط¯ظٹظ†ط© ط£ظˆ ط§ط³ظ… ط§ظ„ظپظ†ط¯ظ‚" inputClassName="bg-secondary border-border text-sm text-right" />
                  <DatePickerInput value={checkIn} onChange={setCheckIn} placeholder="طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„" disabled={disablePast} className="bg-secondary border-border text-sm" />
                  <DatePickerInput value={checkOut} onChange={setCheckOut} placeholder="طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬" disabled={(d) => disablePast(d) || (checkIn ? d <= new Date(checkIn) : false)} className="bg-secondary border-border text-sm" />
                </div>
              )}

              {searchTab === "cars" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <CityAutocomplete value={carCity} onChange={setCarCity} placeholder="ظ…ط¯ظٹظ†ط© ط§ظ„ط§ط³طھظ„ط§ظ…" inputClassName="bg-secondary border-border text-sm text-right" />
                  <DatePickerInput value={carPickup} onChange={setCarPickup} placeholder="طھط§ط±ظٹط® ط§ظ„ط§ط³طھظ„ط§ظ…" disabled={disablePast} className="bg-secondary border-border text-sm" />
                  <DatePickerInput value={carReturn} onChange={setCarReturn} placeholder="طھط§ط±ظٹط® ط§ظ„ط¥ط±ط¬ط§ط¹" disabled={(d) => disablePast(d) || (carPickup ? d <= new Date(carPickup) : false)} className="bg-secondary border-border text-sm" />
                </div>
              )}

              {searchTab === "tours" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <CityAutocomplete value={tourCity} onChange={setTourCity} placeholder="ط§ظ„ظ…ط¯ظٹظ†ط©" inputClassName="bg-secondary border-border text-sm text-right" />
                  <DatePickerInput value={tourDate} onChange={setTourDate} placeholder="طھط§ط±ظٹط® ط§ظ„ط¬ظˆظ„ط©" disabled={disablePast} className="bg-secondary border-border text-sm" />
                  <div className="bg-muted/40 rounded-xl px-3 py-2 flex items-center gap-2 border border-border h-10">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground flex-1 text-right">ط¹ط¯ط¯ ط§ظ„ط£ط´ط®ط§طµ</span>
                    <button type="button" onClick={() => setTourGuests(Math.max(1, tourGuests - 1))} className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                    <span className="text-sm font-medium min-w-[16px] text-center">{tourGuests}</span>
                    <button type="button" onClick={() => setTourGuests(Math.min(20, tourGuests + 1))} className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                  </div>
                </div>
              )}

              {searchTab === "transfers" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <CityAutocomplete value={transferFrom} onChange={setTransferFrom} placeholder="ظ…ظ† (ظ…ط·ط§ط± / ظ…ط¯ظٹظ†ط©)" showCode inputClassName="bg-secondary border-border text-sm text-right" />
                  <CityAutocomplete value={transferTo} onChange={setTransferTo} placeholder="ط¥ظ„ظ‰ (ط§ط®طھظٹط§ط±ظٹ)" showCode inputClassName="bg-secondary border-border text-sm text-right" />
                  <DatePickerInput value={transferDate} onChange={setTransferDate} placeholder="طھط§ط±ظٹط® ط§ظ„ط±ط­ظ„ط©" disabled={disablePast} className="bg-secondary border-border text-sm" />
                </div>
              )}

              {/* Bottom row: passengers + search */}
              <div className="flex items-center justify-between mt-4">
                <Button onClick={handleSearch} className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-2.5 rounded-xl font-bold">
                  <Search className="w-4 h-4 ml-2" />
                  ط§ط¨ط­ط« ط§ظ„ط¢ظ†
                </Button>
                {(searchTab === "flights" || searchTab === "hotels" || searchTab === "transfers") && (
                  <div className="bg-muted/40 rounded-xl px-3 py-2 flex items-center gap-2 border border-border">
                    <button type="button" onClick={() => {
                      if (searchTab === "flights") setPassengers(Math.min(9, passengers + 1));
                      else if (searchTab === "hotels") setGuests(Math.min(9, guests + 1));
                      else setTransferPassengers(Math.min(20, transferPassengers + 1));
                    }} className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-medium text-foreground min-w-[20px] text-center">
                      {searchTab === "flights" ? passengers : searchTab === "hotels" ? guests : transferPassengers}
                    </span>
                    <button type="button" onClick={() => {
                      if (searchTab === "flights") setPassengers(Math.max(1, passengers - 1));
                      else if (searchTab === "hotels") setGuests(Math.max(1, guests - 1));
                      else setTransferPassengers(Math.max(1, transferPassengers - 1));
                    }} className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-muted/80 transition-colors">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

