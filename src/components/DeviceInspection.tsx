import { useEffect, useRef, useState } from 'react';
import { BatteryFull, ScanEye, Plug, Camera, ShieldCheck, Wifi, Mic, Fingerprint, Droplets, Cpu, HardDrive, Signal, MapPin, Lightbulb, Settings2, ChevronLeft, ChevronRight } from 'lucide-react';

const checks = [
  { name: 'Battery health', detail: 'Battery performance and reliability.', icon: BatteryFull },
  { name: 'Screen & appearance', detail: 'Display clarity, discoloration and exterior cleanliness.', icon: ScanEye },
  { name: 'Charging & ports', detail: 'Charging connector, cables and input/output ports.', icon: Plug },
  { name: 'Cameras', detail: 'Photo, video and video-call functionality.', icon: Camera },
  { name: 'Data & identity', detail: 'Factory reset, device identity and blacklist checks.', icon: ShieldCheck },
  { name: 'Wi-Fi & Bluetooth', detail: 'Wireless connections and signal.', icon: Wifi },
  { name: 'Microphones & speakers', detail: 'Sound capture and playback.', icon: Mic },
  { name: 'Buttons & biometrics', detail: 'Physical controls and supported unlock sensors.', icon: Fingerprint },
  { name: 'Water damage', detail: 'Oxidation indicator and signs of moisture.', icon: Droplets },
  { name: 'SIM & carrier', detail: 'Card reader and network compatibility.', icon: Signal },
  { name: 'GPS & sensors', detail: 'Location, proximity and supported sensors.', icon: MapPin },
  { name: 'Flash & lights', detail: 'Flash and indicator operation.', icon: Lightbulb },
  { name: 'Mechanical parts', detail: 'Frame, screws and replacement-part compatibility.', icon: Settings2 },
  { name: 'Storage & features', detail: 'Device-specific functions and storage.', icon: HardDrive },
  { name: 'Internal components', detail: 'Functional hardware checks.', icon: Cpu },
];

export default function DeviceInspection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const perView = useRef(3);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const card = track.querySelector<HTMLElement>('[data-card]');
      if (!card) return;
      perView.current = Math.max(1, Math.round(track.clientWidth / (card.offsetWidth + 16)));
      setIndex(Math.round(track.scrollLeft / (card.offsetWidth + 16)));
    };
    measure();
    track.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => { track.removeEventListener('scroll', measure); window.removeEventListener('resize', measure); };
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const track = trackRef.current;
    const card = track?.querySelector<HTMLElement>('[data-card]');
    if (!track || !card) return;
    track.scrollBy({ left: dir * (card.offsetWidth + 16), behavior: 'smooth' });
  };

  const maxIndex = Math.max(0, checks.length - perView.current);

  return <section className="py-12 border-t border-border" aria-labelledby="inspection-title">
    <div className="flex items-end justify-between gap-4 mb-6">
      <div>
        <h2 id="inspection-title" className="text-3xl mb-2">Device inspection</h2>
        <p className="text-sm text-muted-foreground">Swipe or use the arrows to browse every check. Individual test results are not yet available for catalog listings.</p>
      </div>
      <div className="hidden sm:flex gap-2 shrink-0">
        <button type="button" aria-label="Previous checks" onClick={() => scrollBy(-1)} disabled={index === 0}
          className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-foreground transition-colors hover:bg-accent disabled:opacity-30 disabled:pointer-events-none">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button type="button" aria-label="Next checks" onClick={() => scrollBy(1)} disabled={index >= maxIndex}
          className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-foreground transition-colors hover:bg-accent disabled:opacity-30 disabled:pointer-events-none">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
    <div ref={trackRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {checks.map(({ name, detail, icon: Icon }) => (
        <div key={name} data-card className="snap-start shrink-0 w-[78%] sm:w-[46%] lg:w-[31.5%] xl:w-[23.5%] rounded-lg border border-border bg-card/50 p-5 flex flex-col gap-3">
          <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-medium">{name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{detail}</p>
          </div>
        </div>
      ))}
    </div>
    <div className="flex sm:hidden justify-center gap-2 mt-3">
      <button type="button" aria-label="Previous checks" onClick={() => scrollBy(-1)} disabled={index === 0} className="h-9 w-9 rounded-full border border-border flex items-center justify-center disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
      <div className="flex items-center gap-1.5 px-1">
        {Array.from({ length: checks.length }).map((_, i) => (
          <span key={i} className={`h-1.5 rounded-full transition-all ${i >= index && i < index + perView.current ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/30'}`} />
        ))}
      </div>
      <button type="button" aria-label="Next checks" onClick={() => scrollBy(1)} disabled={index >= maxIndex} className="h-9 w-9 rounded-full border border-border flex items-center justify-center disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
    </div>
  </section>;
}
