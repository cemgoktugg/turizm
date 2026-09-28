"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { BookingForm, type BookingTexts } from "@/components/site/booking-form";
import { cn } from "@/lib/utils";

type OpenFn = (message?: string) => void;

const BookingContext = createContext<OpenFn | null>(null);

/**
 * Tur detay sayfasındaki tüm "Rezervasyon Yap" / "Teklif İste" butonları
 * aynı başvuru penceresini açar.
 */
export function TourBookingProvider({
  tourId,
  tourTitle,
  title,
  subtitle,
  texts,
  children,
}: {
  tourId: string;
  tourTitle: string;
  title: string;
  subtitle?: string;
  texts: BookingTexts;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<{ open: boolean; message?: string }>({ open: false });
  const open = useCallback<OpenFn>((message) => setState({ open: true, message }), []);
  const close = useCallback(() => setState({ open: false }), []);

  return (
    <BookingContext.Provider value={open}>
      {children}
      <Modal open={state.open} onClose={close} title={title} size="md">
        {subtitle && <p className="-mt-1 mb-4 text-sm text-muted">{subtitle}</p>}
        <BookingForm
          tourId={tourId}
          tourTitle={tourTitle}
          variant="bare"
          source="tur-detay"
          texts={texts}
          defaultMessage={state.message}
        />
      </Modal>
    </BookingContext.Provider>
  );
}

export function BookingTrigger({
  message,
  className,
  children,
}: {
  message?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const open = useContext(BookingContext);
  return (
    <button type="button" onClick={() => open?.(message)} className={cn(className)}>
      {children}
    </button>
  );
}
