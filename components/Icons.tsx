type P = { className?: string };
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const InboxIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 13h4l1.5 3h7L17 13h4" />
    <path d="M4.5 5.5h15L21 13v5.5H3V13z" />
  </svg>
);
export const PeopleIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19c.6-3.1 2.9-4.8 5.5-4.8s4.9 1.7 5.5 4.8" />
    <path d="M16 5.6a3.2 3.2 0 010 5.6M17.5 14.6c2 .6 3.3 2.2 3.8 4.4" />
  </svg>
);
export const ImportIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3.5v10m0 0l-3.5-3.5M12 13.5l3.5-3.5" />
    <path d="M4 15.5v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
  </svg>
);
export const PlusIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
export const SearchIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
);
export const BackIcon = (p: P) => (
  <svg {...base} {...p}><path d="M15 5l-7 7 7 7" /></svg>
);
export const CheckIcon = (p: P) => (
  <svg {...base} {...p}><path d="M5 12.5l4.5 4.5L19 7" /></svg>
);
export const ClockIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 1.8" /></svg>
);
export const StarIcon = ({ filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base} {...p} fill={filled ? "currentColor" : "none"}>
    <path d="M12 4l2.5 5.4 5.9.7-4.4 4 1.2 5.8L12 17l-5.2 2.9L8 14.1l-4.4-4 5.9-.7z" />
  </svg>
);
