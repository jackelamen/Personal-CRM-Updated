/** Favourite marker. Filled when on, outlined when off. */
export default function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    >
      <path d="M12 3.5l2.6 5.7 6.2.7-4.6 4.2 1.2 6.1L12 17.2 6.6 20.2l1.2-6.1L3.2 9.9l6.2-.7z" />
    </svg>
  );
}
