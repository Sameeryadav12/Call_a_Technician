import Section from "../../layout/Section";
import { H2 } from "../../ui/Heading";
import Input from "../../atoms/Input";
import Textarea from "../../atoms/Textarea";
import Button from "../../atoms/Button";

export default function RequestCallForm() {
  return (
    <section className="relative bg-brand-lightblue/10">
      {/* Top curved divider */}
      <div className="absolute top-0 left-0 right-0 -translate-y-full">
        <svg
          viewBox="0 0 1440 150"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-[80px] fill-brand-lightblue/10"
          preserveAspectRatio="none"
        >
          <path d="M0,150 C480,0 960,300 1440,150 L1440,0 L0,0 Z"></path>
        </svg>
      </div>

      <Section className="relative z-10">
        <div className="container-app grid md:grid-cols-2 gap-10 items-center">
          {/* Left: form card */}
          <div className="rounded-2xl border bg-white p-6 md:p-8 shadow-sm hover:shadow-md transition">
            <H2 className="text-center md:text-left">Request a Call</H2>
            <p className="text-center md:text-left muted mt-1">
              We’ll get back to you within business hours — usually faster.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("Demo only — hook to backend later.");
              }}
              className="mt-6 grid gap-4"
            >
              <Input label="Full name" placeholder="Your name" required />
              <Input
                label="Phone"
                placeholder="e.g., 04xx xxx xxx"
                required
              />
              <Input
                label="Email (optional)"
                type="email"
                placeholder="you@example.com"
              />
              <Textarea
                label="How can we help?"
                rows={4}
                placeholder="Briefly describe the issue"
              />

              <div className="flex justify-center md:justify-start">
                <Button type="submit" className="min-w-40">
                  Request a Call
                </Button>
              </div>

              <p className="text-xs text-slate-500 text-center md:text-left mt-2">
                No fix, no fee · Same-day service available
              </p>
            </form>
          </div>

          {/* Right: visual */}
          <div className="aspect-video flex items-center justify-center p-6 bg-transparent">
  <img
    src={"/src/assets/Smiling Businesswoman with Tablet _ Premium…-Photoroom.png"}
    alt="Support team"
    className="max-h-max w-auto object-contain drop-shadow-xl"
    style={{ maxWidth: "100%" }}
  />
</div>

        </div>
      </Section>

      {/* Bottom curved divider */}
      <div className="absolute bottom-0 left-0 right-0 translate-y-full rotate-180">
        <svg
          viewBox="0 0 1440 150"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-[80px] fill-brand-lightblue/10"
          preserveAspectRatio="none"
        >
          <path d="M0,150 C480,0 960,300 1440,150 L1440,0 L0,0 Z"></path>
        </svg>
      </div>
    </section>
  );
}
