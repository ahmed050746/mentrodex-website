const styles = [
  "/styles/design-tokens.css",
  "/styles/design-system.css",
  "/styles/style.css",
  "/styles/mobile-bundle.css",
  "/styles/style-desktop-hero.css",
  "/styles/desktop-hero-fallback.css",
] as const;

const pageStyles: Record<string, readonly string[]> = {
  home: styles,
  pay: [
    "/styles/design-tokens.css",
    "/styles/design-system.css",
    "/styles/style.css",
    "/styles/pay-page.css",
  ],
  contact: [
    "/styles/design-tokens.css",
    "/styles/design-system.css",
    "/styles/style.css",
    "/styles/contact-page.css",
  ],
};

export function LegacyStyles({ page }: { page: keyof typeof pageStyles }) {
  return (
    <>
      {pageStyles[page].map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
    </>
  );
}