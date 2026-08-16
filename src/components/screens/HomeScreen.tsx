import {
  Home,
  Briefcase,
  Tag,
  Heart,
  User,
  Tent,
  CarTaxiFront,
  Car,
  Signal,
  TrainFront,
  Gift,
  Ticket,
  Star,
} from "lucide-react";

import tileHotels from "@/assets/tile-hotels.png";
import tileFlights from "@/assets/tile-flights.png";
import tileFlightHotel from "@/assets/tile-flighthotel.png";
import tileActivities from "@/assets/tile-activities.png";
import tileHomes from "@/assets/tile-homes.png";
import { BrandMark } from "../BrandMark";
import { StatusBar } from "../StatusBar";

const services = [
  { icon: Tent, label: "Attractions" },
  { icon: CarTaxiFront, label: "Airport Transfer" },
  { icon: Car, label: "Car Rentals" },
  { icon: Signal, label: "eSIM" },
  { icon: TrainFront, label: "Trains", muted: true },
];

const tabs = [
  { icon: Home, label: "Home", active: true },
  { icon: Briefcase, label: "My Trips" },
  { icon: Tag, label: "Deals", badge: true },
  { icon: Heart, label: "Saved" },
  { icon: User, label: "More" },
];

function Tile({
  title,
  bg,
  img,
  alt,
  className = "",
}: {
  title: string;
  bg: string;
  img: string;
  alt: string;
  className?: string;
}) {
  return (
    <button
      className={`relative flex h-[110px] overflow-hidden rounded-2xl p-4 text-left ${bg} ${className}`}
    >
      <span className="relative z-10 whitespace-pre-line text-[22px] font-bold leading-tight text-foreground">
        {title}
      </span>
      <img
        src={img}
        alt={alt}
        loading="lazy"
        width={512}
        height={512}
        className="absolute -bottom-1 right-0 h-[70px] w-[70px] object-contain"
      />
    </button>
  );
}

export function HomeScreen() {
  return (
    <div className="flex min-h-dvh flex-col bg-background pb-24">
      <StatusBar />
      <div className="px-5 pt-3">
        <BrandMark size="sm" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 px-5">
        <Tile title="Hotels" bg="bg-tile-hotels" img={tileHotels} alt="Hotel building" />
        <Tile title="Flights" bg="bg-tile-flights" img={tileFlights} alt="Airplane" />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 px-5">
        <Tile
          title={"Flight\n+ Hotel"}
          bg="bg-tile-fh"
          img={tileFlightHotel}
          alt="Plane and hotel"
          className="[&_span]:text-[17px]"
        />
        <Tile
          title="Activities"
          bg="bg-tile-activities"
          img={tileActivities}
          alt="Ferris wheel"
          className="[&_span]:text-[17px]"
        />
        <Tile
          title={"Homes\n& Apts"}
          bg="bg-tile-homes"
          img={tileHomes}
          alt="Houses"
          className="[&_span]:text-[17px]"
        />
      </div>

      <div className="mx-5 mt-4 grid grid-cols-5 gap-1 rounded-2xl border border-border px-2 py-4">
        {services.map(({ icon: Icon, label, muted }) => (
          <button key={label} className="flex flex-col items-center gap-2">
            <Icon size={26} className={muted ? "text-muted-foreground" : "text-brand"} />
            <span
              className={`text-center text-[13px] leading-tight ${
                muted ? "text-muted-foreground" : "text-foreground"
              }`}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 border-t border-border pt-6">
        <h2 className="px-5 text-[22px] font-bold text-foreground">VIP status</h2>
        <div className="mx-5 mt-3 rounded-2xl border border-border p-4">
          <div className="flex gap-3">
            <Gift size={26} className="mt-1 shrink-0 text-brand" />
            <p className="text-[17px] leading-snug text-foreground">
              Members can save more! Login or register for free to unlock special deals and lower
              prices on selected properties
            </p>
          </div>
          <div className="mt-3 flex justify-end">
            <button className="rounded-full bg-brand px-6 py-3 text-[17px] font-semibold text-brand-foreground">
              Login/Sign up
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-6">
        <h2 className="px-5 text-[26px] font-bold text-foreground">Deals For You</h2>
        <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-2">
          <div className="flex min-w-[280px] items-center gap-3 rounded-xl border border-border p-4">
            <Ticket size={30} className="shrink-0 text-dot-amber" />
            <div>
              <p className="text-[17px] font-semibold text-foreground">Up to 8% off</p>
              <p className="text-[15px] text-muted-foreground">First hotel booking</p>
              <p className="mt-1 text-right text-[15px] font-medium text-brand">Claim</p>
            </div>
          </div>
          <div className="flex min-w-[280px] items-center gap-3 rounded-xl border border-border p-4">
            <Star size={30} className="shrink-0 text-dot-amber" />
            <div>
              <p className="text-[17px] font-semibold text-foreground">VIP Gold trial</p>
              <p className="text-[15px] text-muted-foreground">Up to 18% off</p>
              <p className="mt-1 text-right text-[15px] font-medium text-brand">Claim</p>
            </div>
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 mx-auto grid max-w-[440px] grid-cols-5 border-t border-border bg-background pb-5 pt-2">
        {tabs.map(({ icon: Icon, label, active, badge }) => (
          <button key={label} className="relative flex flex-col items-center gap-1">
            <span className="relative">
              <Icon
                size={24}
                className={active ? "text-brand" : "text-muted-foreground"}
                fill="currentColor"
                fillOpacity={active ? 0.15 : 0.12}
              />
              {badge ? (
                <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-dot-red" />
              ) : null}
            </span>
            <span
              className={`text-[12px] ${active ? "font-medium text-brand" : "text-muted-foreground"}`}
            >
              {label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}