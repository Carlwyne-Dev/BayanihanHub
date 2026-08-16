import Link from 'next/link';

export function Footer() {
  const LINKS = [
    { label: 'Privacy',      href: '/privacy' },
    { label: 'Terms',        href: '/terms' },
    { label: 'Guidelines',   href: '/guidelines' },
    { label: 'Trust & Safety', href: '/safety' },
  ];

  return (
    <footer className="w-full bg-surface-container border-t border-outline-variant mt-auto pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-center py-10 px-6 md:px-12 gap-8 max-w-screen-2xl mx-auto text-center md:text-left">
        {/* Branding */}
        <div className="flex flex-col items-center md:items-start gap-1.5">
          <span className="text-xl font-bold tracking-tight text-primary" style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
            BayanihanHub
          </span>
          <p className="text-xs text-on-surface-variant">
            Built for the community, by the community.
          </p>
        </div>
        
        {/* Links */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium">
          {LINKS.map(({ label, href }) => (
            <Link key={label} href={href} className="text-on-surface-variant hover:text-primary transition-colors">
              {label}
            </Link>
          ))}
        </div>
        
        {/* Copyright */}
        <div className="text-xs text-on-surface-variant/80">
          © {new Date().getFullYear()} BayanihanHub
        </div>
      </div>
    </footer>
  );
}
