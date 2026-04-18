import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Smartphone, RefreshCcw, Truck, MessageCircle } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Smartphone,
    title: 'Wide Device Selection',
    desc: 'Browse a curated catalog of iPhones, Samsungs and more.',
  },
  {
    icon: RefreshCcw,
    title: 'Easy Trade-In',
    desc: 'Get an instant quote for your old device in minutes.',
  },
  {
    icon: Truck,
    title: 'Fast Shipping to Jamaica',
    desc: 'Reliable delivery island-wide with live tracking.',
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Gradient background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-purple via-brand-pink-deep to-brand-pink opacity-95" />
          {/* Geometric overlay */}
          <div
            className="absolute inset-0 opacity-20 mix-blend-overlay"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 1px, transparent 1px), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.3) 1px, transparent 1px)',
              backgroundSize: '40px 40px, 60px 60px',
            }}
          />
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-brand-purple-deep/40 blur-3xl" />
        </div>

        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="text-white space-y-6 animate-fade-in">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-medium uppercase tracking-widest">
              Phone Matrix · Jamaica
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
              Your Next Device <br />
              <span className="bg-gradient-to-r from-white to-pink-100 bg-clip-text text-transparent">
                Starts Here.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-white/85 max-w-xl leading-relaxed">
              Phone Matrix makes it effortless to buy, sell and trade premium smartphones — fair prices, fast shipping, real humans.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button asChild size="lg" className="bg-white text-brand-pink-deep hover:bg-white/90 rounded-full font-semibold shadow-xl">
                <Link to="/price-list">Browse Devices <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full font-semibold bg-white/10 backdrop-blur border-white/30 text-white hover:bg-white/20 hover:text-white">
                <Link to="/trade-in">Start a Trade-In</Link>
              </Button>
            </div>
          </div>

          {/* Floating phone mockup */}
          <div className="hidden lg:flex justify-center relative">
            <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl" />
            <div className="relative animate-float">
              <div className="w-[280px] h-[560px] rounded-[3rem] bg-gradient-to-b from-gray-900 to-black border-[10px] border-gray-800 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-3xl z-10" />
                <div className="absolute inset-2 rounded-[2.5rem] bg-gradient-to-br from-brand-purple via-brand-pink to-brand-pink-deep flex items-center justify-center">
                  <div className="text-white text-center px-6">
                    <Smartphone className="h-16 w-16 mx-auto mb-4 opacity-90" />
                    <div className="text-2xl font-bold">Phone Matrix</div>
                    <div className="text-sm opacity-80 mt-1">Premium devices</div>
                  </div>
                </div>
              </div>
              {/* Floating chips */}
              <div className="absolute -left-8 top-20 px-4 py-2 rounded-2xl bg-white/95 backdrop-blur shadow-xl text-sm font-semibold text-brand-pink-deep animate-float" style={{ animationDelay: '1s' }}>
                ⚡ Instant quote
              </div>
              <div className="absolute -right-6 bottom-24 px-4 py-2 rounded-2xl bg-white/95 backdrop-blur shadow-xl text-sm font-semibold text-brand-purple animate-float" style={{ animationDelay: '2s' }}>
                ✓ Verified
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-6 relative">
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
              Everything you need, <span className="bg-gradient-brand bg-clip-text text-transparent">in one place.</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              From discovery to delivery, we built Phone Matrix around speed, trust and simplicity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative rounded-3xl p-8 bg-card/50 backdrop-blur-xl border border-brand-pink/20 hover:border-brand-pink/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_-15px_hsl(var(--brand-pink)/0.4)]"
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-brand-soft opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center mb-5 shadow-lg">
                  <f.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="px-6 pb-24">
        <div className="container mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-purple via-brand-pink-deep to-brand-pink p-10 sm:p-16 text-center shadow-[0_30px_80px_-20px_hsl(var(--brand-pink)/0.5)]">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/15 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
                Ready to upgrade?
              </h2>
              <p className="text-lg text-white/85 max-w-2xl mx-auto mb-8">
                Browse our price list or start your trade-in today — it only takes a minute.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg" className="bg-white text-brand-pink-deep hover:bg-white/90 rounded-full font-semibold">
                  <Link to="/price-list">Browse Devices <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full font-semibold bg-white/10 backdrop-blur border-white/30 text-white hover:bg-white/20 hover:text-white">
                  <Link to="/trade-in">Start a Trade-In</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-950 text-gray-300">
        <div className="container mx-auto px-6 py-14">
          <div className="grid md:grid-cols-3 gap-10 items-start">
            <div>
              <img src="https://i.imgur.com/dAkmFGF.png" alt="PhoneMatrix" className="h-10 mb-4" />
              <p className="text-sm text-gray-400 max-w-xs">
                Buy, sell and trade premium smartphones in Jamaica with confidence.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Navigation</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="hover:text-brand-pink transition-colors">Home</Link></li>
                <li><Link to="/trade-in" className="hover:text-brand-pink transition-colors">Trade-In</Link></li>
                <li><Link to="/price-list" className="hover:text-brand-pink transition-colors">Price List</Link></li>
                <li><Link to="/login" className="hover:text-brand-pink transition-colors">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Contact</h4>
              <a
                href="https://wa.me/18765472061"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-brand text-white font-medium hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp Us
              </a>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-white/10 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Phone Matrix. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
