/** Injects non-critical CSS on mobile after first paint (does not block LCP). */
export function MobileDeferredStyles() {
  const sheets = [
    "/styles/style.css",
    "/styles/mobile-bundle.css",
    "/styles/testimonial-player.css",
  ];

  const loader = `(function(){
  if (!window.matchMedia("(max-width: 899px)").matches) return;
  var list = ${JSON.stringify(sheets)};
  function load(i){
    if (i >= list.length) return;
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = list[i];
    l.onload = function(){ load(i + 1); };
    l.onerror = function(){ load(i + 1); };
    document.head.appendChild(l);
  }
  if ("requestIdleCallback" in window) {
    requestIdleCallback(function(){ load(0); }, { timeout: 2000 });
  } else {
    setTimeout(function(){ load(0); }, 1);
  }
})();`;

  return (
    <>
      <noscript>
        {sheets.map((href) => (
          <link key={href} rel="stylesheet" href={href} media="(max-width: 899px)" />
        ))}
      </noscript>
      <script dangerouslySetInnerHTML={{ __html: loader }} />
    </>
  );
}