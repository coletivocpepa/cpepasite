type DecorVariant = "hero" | "section" | "aside" | "cta";

interface DecorProps {
  variant?: DecorVariant;
  className?: string;
}

function Heart({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 21s-7.5-4.9-10-9.3C.3 8.3 2 4.5 6 4.5c2.2 0 3.7 1.2 4.6 2.4h2.8C14.3 5.7 15.8 4.5 18 4.5c4 0 5.7 3.8 4 7.2C19.5 16.1 12 21 12 21z" />
    </svg>
  );
}

function Flower({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="2.4" />
      <ellipse cx="12" cy="5.6" rx="3.1" ry="4.4" />
      <ellipse cx="12" cy="18.4" rx="3.1" ry="4.4" />
      <ellipse cx="5.6" cy="12" rx="4.4" ry="3.1" />
      <ellipse cx="18.4" cy="12" rx="4.4" ry="3.1" />
    </svg>
  );
}

function Leaf({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M4 20C4 11 11 4 20 4c0 9-7 16-16 16z" />
    </svg>
  );
}

const opacity = "opacity-[0.15]";

export default function Decor({ variant = "section", className }: DecorProps) {
  const wrap = (
    <div
      aria-hidden="true"
      className={
        "pointer-events-none absolute inset-0 overflow-hidden text-accent " +
        (className ?? "")
      }
    >
      {variant === "hero" && (
        <>
          <Heart
            className={`absolute -top-10 right-[6%] h-36 w-36 ${opacity} hidden sm:block`}
          />
          <Flower
            className={`absolute bottom-[10%] right-[22%] h-24 w-24 ${opacity}`}
          />
          <Leaf
            className={`absolute top-[28%] -left-6 h-32 w-32 ${opacity} hidden lg:block`}
          />
          <Heart
            className={`absolute bottom-[6%] left-[5%] h-20 w-20 ${opacity}`}
          />
        </>
      )}

      {variant === "section" && (
        <>
          <Flower
            className={`absolute -top-12 -right-12 h-48 w-48 ${opacity} hidden sm:block`}
          />
          <Heart
            className={`absolute -bottom-10 -left-10 h-36 w-36 ${opacity}`}
          />
        </>
      )}

      {variant === "aside" && (
        <>
          <Heart
            className={`absolute -top-8 -right-8 h-32 w-32 ${opacity} hidden sm:block`}
          />
          <Leaf
            className={`absolute -bottom-6 left-4 h-24 w-24 ${opacity}`}
          />
        </>
      )}

      {variant === "cta" && (
        <>
          <Heart
            className={`absolute top-[10%] left-[8%] h-24 w-24 ${opacity}`}
          />
          <Flower
            className={`absolute bottom-[14%] right-[10%] h-32 w-32 ${opacity}`}
          />
          <Leaf
            className={`absolute top-[48%] right-[26%] h-20 w-20 ${opacity} hidden sm:block`}
          />
        </>
      )}
    </div>
  );

  return wrap;
}
