import { ApexLoginForm } from "@/components/apex/ApexLoginForm";
import { ApexLogo } from "@/components/apex/ApexLogo";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col lg:flex-row">
      <section className="apex-login-hero relative flex flex-1 flex-col justify-between overflow-hidden p-8 text-white lg:max-w-[48%] lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage: "url('/assets/signup.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative z-10 flex items-center gap-4">
          <ApexLogo size={56} priority className="drop-shadow-[0_0_24px_oklch(0.68_0.13_180/0.45)]" />
          <div>
            <p className="text-lg font-bold tracking-tight">Apex Solution</p>
            <p className="text-sm text-white/80">VoloSync operations</p>
          </div>
        </div>
        <div className="relative z-10 mt-16 max-w-md space-y-5 lg:mt-0">
          <p className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
            Operations console
          </p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Manage every wholesaler from one colorful, focused command center
          </h1>
          <p className="text-base text-pretty text-white/90 sm:text-lg">
            Approve payments, review subscriptions, handle module requests, and monitor
            access — a warm, precise workspace built for daily operations.
          </p>
        </div>
        <p className="relative z-10 mt-8 text-xs text-white/55">
          Authorized Apex operations only
        </p>
      </section>

      <section className="flex flex-1 items-center justify-center bg-muted/30 p-6 sm:p-10 dark:bg-[oklch(0.14_0.02_265)]">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
          <ApexLoginForm />
        </div>
      </section>
    </div>
  );
}
