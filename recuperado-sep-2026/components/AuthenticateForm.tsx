"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CertificateCard, type CertificateSource } from "@/components/CertificateCard";
import { lookupCodeSync, type CodeLookupResult } from "@/lib/data";

type AuthenticateState =
  | { status: "idle" }
  | { status: "not_found"; attempted: string }
  | { status: "success"; result: CodeLookupResult };

export function AuthenticateForm() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code") ?? "";
  const normalizedUrlCode = codeFromUrl.trim().toUpperCase();
  const initialResult = normalizedUrlCode ? lookupCodeSync(normalizedUrlCode) : null;
  const [code, setCode] = useState(normalizedUrlCode);
  const [state, setState] = useState<AuthenticateState>(() =>
    normalizedUrlCode
      ? initialResult
        ? { status: "success", result: initialResult }
        : { status: "not_found", attempted: normalizedUrlCode }
      : { status: "idle" }
  );
  /** Un link con ?code= viene de un NFC (?via=nfc) o de un QR/link compartido; escribir y buscar es "search". */
  const [source, setSource] = useState<CertificateSource>(() =>
    !normalizedUrlCode ? "search" : searchParams.get("via") === "nfc" ? "nfc" : "qr"
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const attempted = code.trim().toUpperCase();
    const result = lookupCodeSync(attempted);
    setSource("search");
    setState(
      result
        ? { status: "success", result }
        : { status: "not_found", attempted }
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          name="code"
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="GARA-0000"
          required
          className="flex-1 rounded-md border border-hairline bg-ink px-4 py-3 font-data uppercase tracking-wider text-parchment placeholder:text-parchment-dim/60 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
        />
        <button
          type="submit"
          className="rounded-md bg-brass px-6 py-3 text-sm font-medium text-ink transition hover:bg-brass-bright"
        >
          Autenticar
        </button>
      </form>

      {state.status === "not_found" && (
        <div className="mt-4 rounded-md border border-oxblood/60 bg-oxblood/10 px-4 py-3 text-sm text-parchment">
          No encontramos el código{" "}
          <span className="font-data">“{state.attempted}”</span>. Revisa que
          esté completo, tal como aparece en tu ticket.
        </div>
      )}

      {state.status === "success" && (
        <div className="mt-8">
          <CertificateCard result={state.result} source={source} />
        </div>
      )}
    </div>
  );
}
