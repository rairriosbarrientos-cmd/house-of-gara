import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CertificateCard, type CertificateSource } from "@/components/CertificateCard";
import { codes } from "@/data/codes";
import { getProductByCode } from "@/lib/data";

export const dynamicParams = false;

/** Sufijo que llevan las URLs grabadas en los tags NFC (ver instrucciones de NFC). */
const NFC_SUFFIX = "-NFC";

/**
 * Separa el sufijo -NFC (si viene) del código real, sin tocar lookupCodeSync
 * ni el buscador manual de /autentica -- ahí un código tecleado nunca debería
 * llevar -NFC.
 */
function splitNfcSuffix(rawCode: string): { code: string; source: CertificateSource } {
  const decoded = decodeURIComponent(rawCode);
  if (decoded.toUpperCase().endsWith(NFC_SUFFIX)) {
    return { code: decoded.slice(0, -NFC_SUFFIX.length), source: "nfc" };
  }
  return { code: decoded, source: "qr" };
}

export function generateStaticParams() {
  const unique = Array.from(new Set(codes.map((item) => item.code)));
  // Cada código real genera DOS páginas estáticas: la normal (para el QR de
  // los PDFs) y la -NFC (para grabar en los tags físicos), con el mismo
  // certificado pero el sello marcado como "Verificado por NFC".
  return unique.flatMap((code) => [{ code }, { code: `${code}${NFC_SUFFIX}` }]);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code: rawCode } = await params;
  const { code } = splitNfcSuffix(rawCode);
  const result = await getProductByCode(code);

  if (!result) {
    return { title: "Pieza no encontrada — GARA" };
  }

  return {
    title: `${result.product.name} · ${result.code.serial} — GARA Registry`,
    description: `Registro oficial de autenticidad de ${result.product.name}, propiedad de ${result.code.ownerName}.`,
  };
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  const { code, source } = splitNfcSuffix(rawCode);
  const result = await getProductByCode(code);

  if (!result) notFound();

  return (
    <main className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-data text-xs uppercase tracking-[0.22em] text-brass-bright">
            GARA Atelier Registry
          </p>
          <h1 className="mt-3 font-display text-3xl text-parchment sm:text-4xl">
            Verificación de autenticidad
          </h1>
        </div>
        <Link href="/autentica" className="text-sm text-brass-bright hover:underline">
          Consultar otro código →
        </Link>
      </div>

      <CertificateCard result={result} source={source} />
    </main>
  );
}
