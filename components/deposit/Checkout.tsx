import { CrossmintEmbeddedCheckout, useCrossmintCheckout } from "@crossmint/client-sdk-react-ui";
import { useEffect, useState } from "react";
import { AmountBreakdown } from "./AmountBreakdown";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT;
const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID;
const USDC_LOCATOR = `${CHAIN_ID}:${USDC_MINT}${CHAIN_ID === "solana" ? "" : `:${USDC_MINT}`}`;

type CheckoutProps = {
  amount: string;
  walletAddress: string;
  onPaymentCompleted: () => void;
  receiptEmail: string;
  onProcessingPayment: () => void;
  isAmountValid: boolean;
  step: "options" | "processing" | "completed";
  goBack: () => void;
};

export function Checkout({
  amount,
  walletAddress,
  onPaymentCompleted,
  receiptEmail,
  onProcessingPayment,
  isAmountValid,
  step,
  goBack,
}: CheckoutProps) {
  const { order } = useCrossmintCheckout();
  const [checkoutAppearance, setCheckoutAppearance] = useState<any>(null);

  console.log("order", order);

  useEffect(() => {
    // Get CSS variables on client side only
    const primaryColor = window.getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#000000";
    const primaryHoverColor = window.getComputedStyle(document.documentElement).getPropertyValue("--primary-hover").trim() || "#333333";

    const appearance = {
      rules: {
        Label: {
          font: {
            family: "Inter, sans-serif",
            size: "14px",
            weight: "500",
          },
          colors: {
            text: "#374151",
          },
        },
        Input: {
          borderRadius: "8px",
          font: {
            family: "Inter, sans-serif",
            size: "16px",
            weight: "400",
          },
          colors: {
            text: "#000000",
            background: "#FFFFFF",
            border: "#E0E0E0",
            boxShadow: "none",
            placeholder: "#999999",
          },
          hover: {
            colors: {
              border: "#0074D9",
            },
          },
          focus: {
            colors: {
              border: "#0074D9",
              boxShadow: "none",
            },
          },
        },
        PrimaryButton: {
          font: {
            family: "Inter, sans-serif",
          },
          colors: {
            background: primaryColor,
          },
          hover: {
            colors: {
              background: primaryHoverColor,
            },
          },
          disabled: {
            colors: {
              background: "#F1F5F9",
            },
          },
        },
        DestinationInput: {
          display: "hidden",
        },
        ReceiptEmailInput: {
          display: "hidden",
        },
      },
      variables: {
        colors: {
          accent: primaryColor,
        },
      },
    } as const;

    setCheckoutAppearance(appearance);
  }, []);

  useEffect(() => {
    if (order?.phase === "completed") {
      onPaymentCompleted();
    }
    if (order?.phase === "delivery") {
      onProcessingPayment();
    }
  }, [order, onPaymentCompleted, onProcessingPayment]);

  // @ts-ignore - Library types are incorrect, "requires-kyc" is a valid status
  const requiresKYC = order?.payment.status === "requires-kyc";

  return (
    <div
      className={cn(
        "w-full flex-grow space-y-4",
        step !== "options" && "flex items-center justify-center"
      )}
    >
      {step === "options" && (
        <AmountBreakdown
          quote={order?.lineItems[0].quote}
          inputAmount={amount ? Number.parseFloat(amount) : 0}
          isAmountValid={isAmountValid}
        />
      )}
      {amount && isAmountValid && checkoutAppearance && (
        <div
          className={cn(
            requiresKYC &&
              "fixed left-0 top-0 z-30 !mt-0  h-screen w-full items-center justify-center overflow-x-auto bg-white lg:relative lg:block lg:h-auto"
          )}
        >
          <div className={cn(requiresKYC && "w-100 flex h-full items-end")}>
            {requiresKYC && (
              <button onClick={goBack} className="absolute left-5 top-5 z-40 lg:hidden">
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
            )}
            <CrossmintEmbeddedCheckout
              recipient={{ walletAddress }}
              lineItems={{
                tokenLocator: USDC_LOCATOR,
                executionParameters: {
                  mode: "exact-in",
                  amount: amount || "0.00",
                  maxSlippageBps: "500",
                },
              }}
              payment={{
                crypto: { enabled: false },
                fiat: {
                  enabled: true,
                  allowedMethods: {
                    card: true,
                    applePay: false,
                    googlePay: false,
                  },
                },
                receiptEmail,
              }}
              appearance={checkoutAppearance}
            />
          </div>
        </div>
      )}
    </div>
  );
}