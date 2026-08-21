import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Tent,
  CarTaxiFront,
  Car,
  Smartphone,
  TrainFront,
  Gift,
  Ticket,
  Search,
} from "lucide-react";

import tileHotels from "@/assets/tile-hotels.png";
import tileFlights from "@/assets/tile-flights.png";
import tileFlightHotel from "@/assets/tile-flighthotel.png";
import tileActivities from "@/assets/tile-activities.png";
import tileHomes from "@/assets/tile-homes.png";
import { ListingCard } from "@/components/ListingCard";
import { useAuth } from "@/hooks/useAuth";
import { homeFeedQuery } from "@/lib/queries";
import { Logo } from "../Logo";

const services = [
  { icon: Tent, label: "Attractions" },
  { icon: CarTaxiFront, label: "Airport Transfer" },
  { icon: Car, label: "Car Rentals" },
  { icon: Smartphone, label: "eSIM" },
  { icon: TrainFront, label: "Trains", muted: true },
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
    <Link
      to="/search"
      search={{ q: "", guests: 2 }}
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
    </Link>
  );
}

export function HomeScreen() {
  const { data } = useSuspenseQuery(homeFeedQuery);
  const { user } = useAuth();

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-5 pt-6">
        <Logo size="sm" />
        <Link
          to="/search"
          search={{ q: "", guests: 2 }}
          aria-label="Search stays"
          className="rounded-full border border-border p-2 text-muted-foreground"
        >
          <Search size={20} />
        </Link>
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

      {data.destinations.length ? (
        <section className="mt-6 border-t border-border pt-6">
          <h2 className="px-5 text-[22px] font-bold text-foreground">Explore Bangladesh</h2>
          <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-2">
            {data.destinations.map((d) => (
              <Link
                key={d.id}
                to="/search"
                search={{ q: d.name, guests: 2 }}
                className="relative h-[110px] w-[150px] shrink-0 overflow-hidden rounded-2xl bg-muted"
              >
                {d.hero_url ? (
                  <img
                    src={d.hero_url}
                    alt={`${d.name}, ${d.country}`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : null}
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-[15px] font-semibold text-white">
                  {d.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {data.listings.length ? (
        <section className="mt-6 border-t border-border pt-6">
          <h2 className="px-5 text-[26px] font-bold text-foreground">Popular stays</h2>
          <div className="mt-3 grid grid-cols-1 gap-6 px-5">
            {data.listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      ) : null}

      {!user ? (
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
              <Link
                to="/auth"
                className="rounded-full bg-brand px-6 py-3 text-[17px] font-semibold text-brand-foreground"
              >
                Login/Sign up
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {data.deals.length ? (
        <div className="mt-6 border-t border-border pt-6">
          <h2 className="px-5 text-[26px] font-bold text-foreground">Deals For You</h2>
          <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-2">
            {data.deals.map((deal) => (
              <div
                key={deal.id}
                className="flex min-w-[280px] items-center gap-3 rounded-xl border border-border p-4"
              >
                <Ticket size={30} className="shrink-0 text-dot-amber" />
                <div>
                  <p className="text-[17px] font-semibold text-foreground">{deal.title}</p>
                  <p className="text-[15px] text-muted-foreground">{deal.subtitle}</p>
                  <Link
                    to="/deals"
                    className="mt-1 block text-right text-[15px] font-medium text-brand"
                  >
                    Claim
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
