import type { Metadata } from "next";
import Link from "next/link";
import { StatusScreen, statusActionClass, statusSecondaryActionClass } from "@/components/layout/status-screen";

export const metadata: Metadata = {
  title: "Sector not found | Bureau 21",
};

export default function NotFound() {
  return (
    <StatusScreen
      code="Error 404"
      title="Sector not found"
      tone="warn"
      actions={
        <>
          <Link href="/lobby" className={statusActionClass}>
            Back to lobby
          </Link>
          <Link href="/primaris" className={statusSecondaryActionClass}>
            Primaris
          </Link>
        </>
      }
    >
      <p>No deck, pilot, or corridor is charted at this address. The link may be old, or the sector may have been sealed off.</p>
    </StatusScreen>
  );
}
