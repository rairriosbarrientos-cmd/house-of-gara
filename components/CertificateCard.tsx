import Image from "next/image";
import Link from "next/link";
import { ProductVisual } from "@/components/ProductVisual";
import { CATEGORY_LABEL } from "@/lib/types";
import type { CodeLookupResult } from "@/lib/data";

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "long",
});

/** De dónde llegó la persona a este certificado — cambia el sello de entrada y la etiqueta. */
export type CertificateSource = "nfc" | "qr" | "search";

const SOURCE_LABEL: Record<CertificateSource, string> = {
  nfc: "Verificado por NFC",
  qr: "Verificado por código QR",
  search: "Verificado por código",
};

export function CertificateCard({
  result,
  source = "search",
}: {
  result: CodeLookupResult;
  source?: CertificateSource;
}) {
  const { product, code } = result;
  /** El sello de cera (anillo + destello) solo se justifica en el momento del tap/escaneo real. */
  const isTapMoment = source === "nfc" || source === "qr";
  const ownerFirstName = code.ownerName.trim().split(/\s+/)[0];

  return (
    <div className="stamp-reveal relative overflow-hidden rounded-lg border border-brass bg-charcoal">
      {source === "nfc" ? (
        /* Pantalla de verificación del tap: solo CSS, se desvanece sola (ver .nfc-verify en globals.css). */
        <div
          aria-hidden
          className="nfc-verify pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-charcoal"
        >
          <svg viewBox="0 0 64 64" className="h-20 w-20 text-brass-bright">
            <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              pathLength={100}
              className="nfc-verify-ring"
            />
            <path
              d="M21 33 l7 7 l15 -16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={100}
              className="nfc-verify-check"
            />
          </svg>
          <div className="relative h-4 w-full text-center font-data text-[11px] uppercase tracking-[0.22em]">
            <span className="nfc-verify-pending absolute inset-x-0 text-parchment-dim">
              Verificando autenticidad…
            </span>
            <span className="nfc-verify-done absolute inset-x-0 text-brass-bright">
              Pieza auténtica
            </span>
          </div>
        </div>
      ) : null}

      {isTapMoment ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
        >
          <span className="seal-ring block h-24 w-24 rounded-full border-2 border-brass-bright" />
        </div>
      ) : null}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-[0.05]"
      >
        <Image
          src="/brand/gara-flower-official.png"
          alt=""
          width={420}
          height={420}
          className="w-2/3 max-w-[360px]"
        />
      </div>

      <div className={isTapMoment ? "seal-drop relative z-10" : "relative z-10"}>
        <ProductVisual
          product={product}
          label={CATEGORY_LABEL[product.category]}
          className="aspect-[3/1]"
        />
        {isTapMoment ? (
          <span className="seal-sheen pointer-events-none absolute inset-y-0 left-0 z-10 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        ) : null}
      </div>

      <div className="relative z-10 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-data text-xs uppercase tracking-[0.2em] text-brass-bright">
            Pieza auténtica GARA
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brass/40 bg-brass/10 px-2.5 py-1 font-data text-[10px] uppercase tracking-[0.14em] text-brass-bright">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
              <path d="M10 2a1 1 0 0 1 1 1v1.1a5.9 5.9 0 0 1 4.9 4.9H17a1 1 0 1 1 0 2h-1.1a5.9 5.9 0 0 1-4.9 4.9V17a1 1 0 1 1-2 0v-1.1a5.9 5.9 0 0 1-4.9-4.9H3a1 1 0 1 1 0-2h1.1A5.9 5.9 0 0 1 9 4.1V3a1 1 0 0 1 1-1Zm0 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
            </svg>
            {SOURCE_LABEL[source]}
          </span>
        </div>
        <h2 className="mt-2 font-display text-2xl text-parchment sm:text-3xl">
          {product.name}
        </h2>
        {source === "nfc" && ownerFirstName ? (
          <p className="mt-2 text-sm text-parchment-dim">
            Hola, <span className="text-parchment">{ownerFirstName}</span>. Esta pieza es tuya y está registrada en el
            atelier.
          </p>
        ) : null}

        <dl className="mt-6 grid gap-3 border-t border-hairline pt-6 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-4 sm:block sm:space-y-1">
            <dt className="text-parchment-dim">No. de serie</dt>
            <dd className="font-data text-parchment">{code.serial}</dd>
          </div>
          <div className="flex justify-between gap-4 sm:block sm:space-y-1">
            <dt className="text-parchment-dim">Hecha el</dt>
            <dd className="text-parchment">
              {dateFormatter.format(new Date(code.craftedDate))}
            </dd>
          </div>
          <div className="flex justify-between gap-4 sm:block sm:space-y-1">
            <dt className="text-parchment-dim">Propietario registrado</dt>
            <dd className="font-medium text-parchment">{code.ownerName}</dd>
          </div>
          <div className="flex justify-between gap-4 sm:block sm:space-y-1">
            <dt className="text-parchment-dim">Taller</dt>
            <dd className="text-parchment">{code.artisan}</dd>
          </div>
          <div className="flex justify-between gap-4 sm:block sm:space-y-1">
            <dt className="text-parchment-dim">Materiales</dt>
            <dd className="text-right text-parchment sm:text-left">
              {product.materials.join(", ")}
            </dd>
          </div>
        </dl>

        {product.story ? (
          <div className="mt-6 border-t border-hairline pt-6">
            <p className="font-data text-[10px] uppercase tracking-[0.18em] text-brass-bright">Historia</p>
            <p className="mt-2 text-sm leading-relaxed text-parchment-dim">{product.story}</p>
          </div>
        ) : null}

        {product.care?.length ? (
          <div className="mt-6 border-t border-hairline pt-6">
            <p className="font-data text-[10px] uppercase tracking-[0.18em] text-brass-bright">Cuidados</p>
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-parchment-dim">
              {product.care.map((tip) => (
                <li key={tip} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brass" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {code.note ? (
          <p className="mt-6 border-t border-hairline pt-6 text-sm italic text-parchment-dim">
            “{code.note}”
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-hairline pt-6">
          <a
            href={`/certificates/${encodeURIComponent(code.code)}.pdf`}
            download={`GARA-Certificado-${code.serial}.pdf`}
            className="inline-flex items-center gap-2 rounded-full bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-brass-bright"
          >
            Descargar certificado (PDF)
          </a>
          <Link
            href={`/productos/${product.slug}`}
            className="text-sm text-brass-bright hover:underline"
          >
            Ver ficha completa de esta pieza →
          </Link>
        </div>
      </div>
    </div>
  );
}
