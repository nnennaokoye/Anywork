"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useMarketplace } from "@/hooks/useMarketplace";

export const ArtisanOnboarding = () => {
  const { address, isConnected } = useAccount();
  const {
    registerArtisan,
    verifyIdentity,
    getArtisan,
    isReady,
  } = useMarketplace();

  const [loadingStep, setLoadingStep] = useState<
    | "register"
    | "self-verify"
    | "onchain-verify"
    | "refresh-status"
    | null
  >(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [artisanInfo, setArtisanInfo] = useState<{
    registered: boolean;
    verified: boolean;
    metadataURI: string;
  } | null>(null);

  const handleRegister = async () => {
    if (!address) return;
    try {
      setError(null);
      setStatusMessage(null);
      setLoadingStep("register");
      // Simple static metadata for now; later this can be a form
      const metadataURI = "ipfs://artisan-metadata";
      await registerArtisan(metadataURI);
      setStatusMessage("Artisan registered on-chain.");
      await fetchStatus();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to register artisan");
    } finally {
      setLoadingStep(null);
    }
  };

  const handleSelfVerification = async () => {
    try {
      setError(null);
      setStatusMessage(null);
      setLoadingStep("self-verify");
      // Placeholder for Self Protocol integration
      // Here you would:
      // 1. Redirect/open Self widget/flow
      // 2. Wait for verification result
      // 3. Store verification proof off-chain (e.g. in your backend)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStatusMessage("Self Protocol verification simulated (placeholder).");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Self verification failed");
    } finally {
      setLoadingStep(null);
    }
  };

  const handleOnChainVerify = async () => {
    try {
      setError(null);
      setStatusMessage(null);
      setLoadingStep("onchain-verify");
      await verifyIdentity();
      setStatusMessage("On-chain verification tx confirmed.");
      await fetchStatus();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "On-chain verification failed");
    } finally {
      setLoadingStep(null);
    }
  };

  const fetchStatus = async () => {
    if (!address) return;
    try {
      setLoadingStep("refresh-status");
      const [registered, verified, metadataURI] = await getArtisan(address);
      setArtisanInfo({ registered, verified, metadataURI });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to fetch artisan status");
    } finally {
      setLoadingStep(null);
    }
  };

  if (!isConnected) {
    return (
      <div
        id="artisan-onboarding"
        className="mt-10 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-gray-900">
          Register as an Artisan
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Connect your wallet first using the button in the header.
        </p>
      </div>
    );
  }

  return (
    <section
      id="artisan-onboarding"
      className="mt-10 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-gray-900">
        Artisan Verification (Self + On-chain)
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        Connected wallet: <span className="font-mono text-xs">{address}</span>
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <h3 className="text-sm font-medium text-gray-800">Step 1: Register</h3>
          <p className="text-xs text-gray-500 mb-2">
            Register your wallet as an artisan on the Anywork smart contract.
          </p>
          <button
            onClick={handleRegister}
            disabled={!isReady || loadingStep !== null}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingStep === "register" ? "Registering..." : "Register as Artisan"}
          </button>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-800">
            Step 2: Self Protocol verification (off-chain)
          </h3>
          <p className="text-xs text-gray-500 mb-2">
            This is where we will integrate the Self Protocol identity flow. For
            now, this button simulates a successful verification.
          </p>
          <button
            onClick={handleSelfVerification}
            disabled={loadingStep !== null}
            className="rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {loadingStep === "self-verify"
              ? "Running Self verification..."
              : "Simulate Self verification"}
          </button>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-800">
            Step 3: Confirm on-chain
          </h3>
          <p className="text-xs text-gray-500 mb-2">
            After Self confirms you, call the smart contract&apos;s
            <code className="mx-1 rounded bg-gray-100 px-1 py-0.5 text-[10px]">
              verifyIdentity()
            </code>
            function.
          </p>
          <button
            onClick={handleOnChainVerify}
            disabled={!isReady || loadingStep !== null}
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loadingStep === "onchain-verify"
              ? "Submitting tx..."
              : "Verify on-chain"}
          </button>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-800">Status</h3>
            <button
              onClick={fetchStatus}
              disabled={loadingStep !== null}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              {loadingStep === "refresh-status" ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {artisanInfo && (
            <dl className="mt-2 grid grid-cols-1 gap-2 text-xs text-gray-700 sm:grid-cols-3">
              <div>
                <dt className="font-semibold">Registered</dt>
                <dd>{artisanInfo.registered ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="font-semibold">Verified</dt>
                <dd>
                  {artisanInfo.verified ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      Verified
                    </span>
                  ) : (
                    "Not verified"
                  )}
                </dd>
              </div>
              <div className="sm:col-span-3">
                <dt className="font-semibold">Metadata URI</dt>
                <dd className="truncate font-mono text-[11px] text-gray-500">
                  {artisanInfo.metadataURI || "-"}
                </dd>
              </div>
            </dl>
          )}

          {!artisanInfo && (
            <p className="mt-1 text-xs text-gray-500">
              No artisan info loaded yet. Use the buttons above to register or
              refresh.
            </p>
          )}
        </div>

        {statusMessage && (
          <p className="mt-3 text-xs text-emerald-700">{statusMessage}</p>
        )}

        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    </section>
  );
};
