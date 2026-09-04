import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <p className="label">404</p>
      <h1 className="text-title font-semibold">
        This page does not exist
      </h1>
      <Link href="/" className="btn btn-primary">
        Back to Today
      </Link>
    </div>
  );
}
