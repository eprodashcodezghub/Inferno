import { Link } from 'wouter';
import { Flame, Shield, Zap, HardDrive } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-primary/4 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Flame className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-mono font-bold text-xl tracking-widest text-foreground">INFERNO</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <button className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-md hover:bg-secondary">
              Sign in
            </button>
          </Link>
          <Link href="/sign-up">
            <button className="font-mono text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-semibold transition-all shadow-md shadow-primary/20 active:scale-95">
              Get started
            </button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-xs text-primary tracking-widest uppercase">Cloud File Storage</span>
        </div>

        <h1 className="font-sans font-bold text-5xl md:text-7xl text-foreground tracking-tight mb-6 max-w-3xl leading-tight">
          Your files,<br />
          <span className="text-primary glow-text-primary">burning fast.</span>
        </h1>

        <p className="text-muted-foreground text-lg max-w-xl mb-10 font-sans leading-relaxed">
          Inferno is a dark, powerful cloud file manager built for people who mean business. Upload, organize, and access your files with the precision of a professional tool.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/sign-up">
            <button className="font-mono text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3.5 rounded-md font-semibold transition-all shadow-lg shadow-primary/25 active:scale-95 tracking-wide">
              START FOR FREE
            </button>
          </Link>
          <Link href="/sign-in">
            <button className="font-mono text-sm border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground px-8 py-3.5 rounded-md transition-all tracking-wide">
              SIGN IN
            </button>
          </Link>
        </div>

        {/* Path bar preview */}
        <div className="mt-12 px-4 py-2.5 rounded-md bg-card border border-border font-mono text-sm">
          <span className="text-primary font-bold glow-text-primary">inferno</span>
          <span className="text-muted-foreground/60 mx-1">--</span>
          <span className="text-muted-foreground">Documents</span>
          <span className="text-muted-foreground/40 mx-1">|</span>
          <span className="text-muted-foreground">Projects</span>
          <span className="text-muted-foreground/40 mx-1">|</span>
          <span className="text-foreground">Q4-Report.pdf</span>
        </div>
      </main>

      {/* Features */}
      <section className="relative z-10 border-t border-border/50 px-8 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { icon: Zap, title: "Lightning fast", desc: "Presigned uploads go directly to storage — zero latency bottlenecks." },
            { icon: HardDrive, title: "Nested folders", desc: "Organize everything in deep hierarchies with full path navigation." },
            { icon: Shield, title: "Secure by default", desc: "Every file is private. Access controlled by your account only." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col gap-3">
              <div className="w-9 h-9 rounded-md bg-accent border border-accent-border flex items-center justify-center">
                <Icon className="w-4.5 h-4.5 text-accent-foreground" />
              </div>
              <h3 className="font-mono font-semibold text-foreground text-sm tracking-wide">{title}</h3>
              <p className="text-muted-foreground text-sm font-sans leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
