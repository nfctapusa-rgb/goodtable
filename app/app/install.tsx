"use client";
import { useEffect, useState } from "react";
// Shows "Add to Home Screen" help once, on phones that aren't already running the installed app.
export function InstallHint() {
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);
  useEffect(() => {
    const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    let seen = false; try { seen = !!localStorage.getItem("lokly_install_hint"); } catch {}
    setIos(/iphone|ipad/i.test(navigator.userAgent));
    setShow(!standalone && !seen && /mobi|iphone|android/i.test(navigator.userAgent));
  }, []);
  if (!show) return null;
  const close = () => { try { localStorage.setItem("lokly_install_hint", "1"); } catch {} setShow(false); };
  return (
    <section className="rapp-card rapp-install">
      <b>Keep your results one tap away</b>
      <p>{ios ? <>Tap <b>Share</b> at the bottom of Safari, then <b>Add to Home Screen</b>.</> : <>Tap the <b>⋮ menu</b>, then <b>Add to Home screen</b>.</>}</p>
      <button className="btn ghost sm" onClick={close}>Got it</button>
    </section>
  );
}
