import { toggleSaleCancel } from "@/app/actions/sales";
import { ToggleButton } from "./toggle-button";

/** Satışı iptal eder / iptali geri alır */
export function SaleCancelButton({ id, isCancelled, short }: { id: number; isCancelled: boolean; short?: boolean }) {
  return (
    <ToggleButton
      action={toggleSaleCancel}
      id={id}
      on={!isCancelled}
      labels={short ? { on: "İptal Et", off: "Geri Al" } : { on: "Satışı İptal Et", off: "İptali Geri Al" }}
      confirm={`Satış #${id} iptal edilsin mi? İptal edilen satış toplamlara ve müşteri bakiyesine girmez.`}
      variant="button"
    />
  );
}
