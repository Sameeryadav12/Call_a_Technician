import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, X } from "lucide-react";
import Button from "../atoms/Button";

/**
 * Floating ribbon (light surface) that sits under the fixed NavBar.
 * - White/glass interior (NOT navy), brand text, gradient border
 * - Centered, rounded-2xl, shadow, subtle animation
 * - Dismiss (no persistence by default)
 */
export default function UrgentCallout({ persist = "none" }) {
  const KEY = "urgent_callout_dismissed_ts";
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (persist === "none") { setOpen(true); return; }
    const ts = (persist === "session")
      ? sessionStorage.getItem(KEY)
      : localStorage.getItem(KEY);
    if (!ts) { setOpen(true); return; }
    if (persist === "day") {
      const age = Date.now() - Number(ts);
      setOpen(age > 24 * 60 * 60 * 1000);
    } else {
      setOpen(false);
    }
  }, [persist]);

  const dismiss = () => {
    if (persist === "session") sessionStorage.setItem(KEY, String(Date.now()));
    if (persist === "day") localStorage.setItem(KEY, String(Date.now()));
    setOpen(false);
  };

return (
    <AnimatePresence>
        {open && (
            <motion.div
                key="urgent-floating"
                initial={{ y: -18, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -18, opacity: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="fixed inset-x-0 mx-auto flex justify-center z-40"
                style={{ top: "86px" }} // adjust if your nav is taller/shorter
                role="region"
                aria-label="Urgent assistance"
            >
                {/* Gradient border frame */}
                <div className="bg-gradient-to-r from-brand-blue via-brand-lightblue to-brand-green p-[1.5px] rounded-2xl shadow-xl">
                    {/* Light/glass interior (distinct from navy navbar) */}
                    <div className="relative rounded-2xl bg-white/90 backdrop-blur-md text-brand-navy">
                        <div className="px-4 sm:px-6 py-3 flex items-center gap-3">
                            {/* Icon chip */}
                            <div className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-brand-lightblue/25 text-brand-blue">
                                <Phone className="w-4 h-4" />
                            </div>

                            {/* Message */}
                            <p className="text-sm md:text-[15px] leading-6 flex-1">
                                <span className="font-semibold">Need urgent help today?</span>{" "}
                                Book a same-day technician in Adelaide or call us now.
                            </p>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <a
                                    href="tel:1300551350"
                                    className="hidden md:inline-block border border-brand-blue/40 hover:border-brand-blue
                                                         text-brand-blue rounded-md px-3 py-1.5 text-sm transition"
                                >
                                    Call 1300 551 350
                                </a>
                                <Button
                                    variant="primary"
                                    className="px-3 py-1.5 text-sm md:text-base"
                                    onClick={() => (window.location.href = "/contact")}
                                >
                                    Book Now
                                </Button>
                                <button
                                    aria-label="Dismiss"
                                    onClick={dismiss}
                                    className="ml-1 p-1 rounded-md hover:bg-black/5"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Width constraints so it never looks full-width like a navbar */}
                <style>{`
                    /* keep it clearly "floating" */
                    [aria-label="Urgent assistance"] > div {
                        width: min(92vw, 880px);
                    }
                `}</style>
            </motion.div>
        )}
    </AnimatePresence>
);
}
