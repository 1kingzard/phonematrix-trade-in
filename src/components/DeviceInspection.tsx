import { BatteryFull, ScanEye, Plug, Camera, ShieldCheck, Wifi, Mic, Fingerprint, Droplets, Cpu, HardDrive, Signal, MapPin, Lightbulb, Settings2 } from 'lucide-react';
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
  return <section className="py-12 border-t border-border" aria-labelledby="inspection-title">
    <h2 id="inspection-title" className="text-3xl mb-2">Device inspection</h2>
    <p className="text-sm text-muted-foreground mb-6">What to verify when inspecting a device. Individual test results are not yet available for catalog listings.</p>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-0">{checks.map(({ name, detail, icon: Icon }) => <div key={name} className="flex gap-3 py-4 border-b border-border/70"><Icon className="h-5 w-5 text-primary shrink-0" /><div><h3 className="text-base">{name}</h3><p className="text-sm text-muted-foreground">{detail}</p></div></div>)}</div>
  </section>;
}
