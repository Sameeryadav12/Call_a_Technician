import ContactHero from "../components/sections/Contact/ContactHero";
import ContactFormBlock from "../components/sections/Contact/ContactFormBlock";
import ContactTrustStrip from "../components/sections/Contact/ContactTrustStrip";

export default function Contact() {
  return (
    <div className="text-slate-800">
      <ContactHero />
      <ContactFormBlock />
      <ContactTrustStrip />
    </div>
  );
}
