"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

const petals = [
  [4, 1, 7.8, 28, -18, 0.78], [9, 0.3, 8.6, 20, 26, 0.5], [14, 1.8, 9.4, 34, -40, 0.7],
  [20, 0.8, 7.1, 18, 12, 0.46], [26, 2.2, 8.9, 30, 34, 0.64], [32, 1.1, 7.6, 22, -28, 0.58],
  [39, 2.7, 9.1, 31, 18, 0.66], [45, 0.2, 8.2, 19, -14, 0.5], [51, 1.6, 7.5, 27, 42, 0.6],
  [57, 2.4, 8.8, 23, -32, 0.56], [63, 0.9, 9.5, 35, 21, 0.72], [69, 1.3, 7.2, 18, -22, 0.5],
  [75, 2.6, 8.4, 29, 16, 0.62], [81, 0.4, 9.2, 24, -36, 0.58], [87, 1.9, 7.9, 32, 28, 0.68],
  [93, 1.2, 8.7, 20, -12, 0.48], [17, 3.1, 9.8, 25, 45, 0.48], [36, 3.5, 8.1, 16, -26, 0.4],
  [54, 3.2, 9.6, 26, 14, 0.5], [72, 3.8, 8.4, 18, -42, 0.42], [90, 3.4, 9.2, 24, 22, 0.46],
] as const;

export function CinematicIntro() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const forced = useMemo(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("intro") === "1", []);
  const skipRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => setVisible(false), 1050);
  }, [closing]);

  useEffect(() => {
    // /verify/* es un tap de NFC o un QR: la persona quiere ver su certificado
    // al instante, no una intro de marca de 6s. Se salta siempre ahí, aunque
    // sea la primera visita de la sesión.
    const isVerifyRoute = window.location.pathname.startsWith("/verify/");
    if (isVerifyRoute && !forced) return;

    const alreadySeen = window.sessionStorage.getItem("gara-intro-v4") === "seen";
    if (!alreadySeen || forced) {
      window.sessionStorage.setItem("gara-intro-v4", "seen");
      document.body.style.overflow = "hidden";
      const raf = window.requestAnimationFrame(() => setVisible(true));
      const timer = window.setTimeout(close, 6200);
      return () => {
        window.cancelAnimationFrame(raf);
        window.clearTimeout(timer);
      };
    }
  }, [close, forced]);

  useEffect(() => {
    if (!visible) document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const onKey = () => close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, visible]);

  useEffect(() => {
    if (visible) skipRef.current?.focus();
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`gara-intro ${closing ? "gara-intro--closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Introducción de GARA"
      onClick={close}
    >
      <div className="gara-intro__grain" />
      <div className="gara-intro__halo" />
      <div className="gara-intro__petals" aria-hidden="true">
        {petals.map(([left, delay, duration, size, rotate, opacity], index) => (
          <span
            key={index}
            className="gara-petal"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${Math.round(size * 1.35)}px`,
              opacity,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              "--petal-rotate": `${rotate}deg`,
            } as CSSProperties}
          />
        ))}
      </div>

      <div className="gara-intro__content">
        <div className="gara-intro__flower-wrap">
          <Image
            src="/brand/gara-flower-official.png"
            alt="Flor oficial de GARA"
            width={282}
            height={260}
            priority
            className="gara-intro__flower"
          />
        </div>

        <Image
          src="/brand/gara-lockup-official.png"
          alt="GARA Handbags & Leather Goods"
          width={1110}
          height={545}
          priority
          className="gara-intro__lockup"
        />

        <div className="gara-intro__line"><span /></div>
        <p className="gara-intro__material">Fine Full-Grain Cowhide · Handcrafted in Mexico</p>
      </div>

      <button ref={skipRef} type="button" className="gara-intro__skip" onClick={(event) => { event.stopPropagation(); close(); }}>
        Saltar intro
      </button>
    </div>
  );
}
