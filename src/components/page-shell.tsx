import { Reveal } from "@/components/reveal";

export function PageShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="pt-16 pb-24 relative grain overflow-hidden">
      <div className="container-x relative z-10">
        <Reveal>
          <div className="text-xs uppercase tracking-[0.3em] text-forest-700 font-medium">
            {eyebrow}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="mt-5 font-serif font-light text-[clamp(2.25rem,5.5vw,5rem)] leading-[0.98] text-balance max-w-5xl">
            {title}
          </h1>
        </Reveal>
        {subtitle && (
          <Reveal delay={0.2}>
            <p className="mt-7 max-w-2xl text-lg md:text-xl text-ink-700 leading-relaxed">
              {subtitle}
            </p>
          </Reveal>
        )}
      </div>
      <div className="absolute -right-32 -top-20 w-[500px] h-[500px] rounded-full bg-forest-300/25 blur-3xl pointer-events-none" />
    </section>
  );
}
