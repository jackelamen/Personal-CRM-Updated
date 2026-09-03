import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="font-display mt-2 text-4xl tracking-[-0.015em] text-ink">
        This page does not exist
      </h1>
      <Link href="/" className="btn btn-primary mt-8">
        Back to Today
      </Link>
    </div>
  );
}
