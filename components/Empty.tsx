import Link from "next/link";

export default function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="rounded-xl border border-dashed border-rule-strong bg-paper-2/50 px-6 py-14 text-center">
      <p className="font-display text-xl font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
        {body}
      </p>
      {action ? (
        <Link href={action.href} className="btn btn-primary mt-6">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
