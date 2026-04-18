import { Link } from 'react-router-dom';
import { useSiteLogo } from '@/hooks/useSiteLogo';

const Footer = () => {
  const logoSrc = useSiteLogo();
  return (
    <footer className="border-t border-border/60 bg-background text-foreground">
      <div className="container mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoSrc} alt="PhoneMatrix" className="h-8 transition-opacity duration-300" />
        </Link>
        <nav className="flex flex-wrap items-center gap-5 text-sm text-foreground/70">
          <Link to="/price-list" className="hover:text-foreground">Price List</Link>
          <Link to="/trade-in" className="hover:text-foreground">Trade-In</Link>
          <Link to="/faq" className="hover:text-foreground">FAQ</Link>
          <Link to="/reviews" className="hover:text-foreground">Reviews</Link>
        </nav>
        <p className="text-xs text-foreground/50">© {new Date().getFullYear()} PhoneMatrix</p>
      </div>
    </footer>
  );
};

export default Footer;
