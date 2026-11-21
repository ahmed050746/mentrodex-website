type Stylesheet = {
  href: string;
  media?: string;
};

/** Mobile: small critical sheet first, then full CSS in document order (blocking = stable paint). */
const homeStyles: Stylesheet[] = [
  { href: "/styles/design-tokens.css" },
  { href: "/styles/design-system.css" },
  { href: "/styles/mobile-critical.css", media: "(max-width: 899px)" },
  { href: "/styles/style.css" },
  { href: "/styles/mobile-bundle.css", media: "(max-width: 899px)" },
  { href: "/styles/desktop-hero-fallback.css", media: "(min-width: 900px)" },
  { href: "/styles/testimonial-player.css" },
];

const pageStyles: Record<string, readonly Stylesheet[]> = {
  home: homeStyles,
  pay: [
    { href: "/styles/design-tokens.css" },
    { href: "/styles/design-system.css" },
    { href: "/styles/style.css" },
    { href: "/styles/pay-page.css" },
  ],
  contact: [
    { href: "/styles/design-tokens.css" },
    { href: "/styles/design-system.css" },
    { href: "/styles/style.css" },
    { href: "/styles/contact-page.css" },
  ],
};

export function LegacyStyles({ page }: { page: keyof typeof pageStyles }) {
  return (
    <>
      {pageStyles[page].map(({ href, media }) => (
        <link
          key={href}
          rel="stylesheet"
          href={href}
          {...(media ? { media } : {})}
        />
      ))}
    </>
  );
}