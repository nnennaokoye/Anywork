"use client";

import React, { useEffect, useState } from "react";
import { getUniversalLink } from "@selfxyz/core";
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  type SelfApp,
} from "@selfxyz/qrcode";
import { ethers } from "ethers";

interface SelfVerificationWidgetProps {
  onSuccess: () => void;
  onError?: (message: string) => void;
}

export const SelfVerificationWidget: React.FC<SelfVerificationWidgetProps> = ({
  onSuccess,
  onError,
}) => {
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState("");
  // You can decide what to use as userId; for now we keep ZeroAddress as in the quickstart
  const [userId] = useState(ethers.ZeroAddress);

  useEffect(() => {
    try {
      const app = new SelfAppBuilder({
        version: 2,
        appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || "Anywork Artisan Verification",
        scope: process.env.NEXT_PUBLIC_SELF_SCOPE || "anywork-artisan-verification",
        endpoint: `${process.env.NEXT_PUBLIC_SELF_ENDPOINT || "https://playground.self.xyz/api/verify"}`,
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: userId,
        endpointType: "staging_https",
        userIdType: "hex",
        userDefinedData: "Anywork artisan identity verification",
        disclosures: {
          // IMPORTANT: must match backend config if/when you add backend verification
          minimumAge: 18,
          nationality: true,
          gender: true,
        },
      }).build();

      setSelfApp(app);
      setUniversalLink(getUniversalLink(app));
    } catch (error) {
      console.error("Failed to initialize Self app:", error);
      onError?.("Failed to initialize Self verification");
    }
  }, [onError, userId]);

  const handleSuccess = () => {
    // Self has successfully verified the user according to the disclosures
    onSuccess();
  };

  const handleError = () => {
    console.error("Error: Failed to verify identity");
    onError?.("Self verification failed");
  };

  return (
    <div className="mt-3 rounded-md border border-dashed border-purple-300 bg-purple-50 p-4 text-center">
      <p className="text-xs text-gray-700 mb-2">
        Scan this QR code with the <span className="font-semibold">Self</span> app
        to complete your identity verification.
      </p>
      {selfApp ? (
        <div className="flex flex-col items-center gap-2">
          <SelfQRcodeWrapper
            selfApp={selfApp}
            onSuccess={handleSuccess}
            onError={handleError}
          />
          {universalLink && (
            <a
              href={universalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-purple-700 underline"
            >
              Open in Self app
            </a>
          )}
        </div>
      ) : (
        <div className="text-xs text-gray-500">Loading QR Code...</div>
      )}
    </div>
  );
};
