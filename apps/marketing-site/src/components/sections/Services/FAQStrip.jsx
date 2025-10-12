import { Disclosure } from "@headlessui/react";
import Section from "../../layout/Section";

export default function FAQStrip({ items = [] }) {
  return (
    <Section muted>
      <div className="container-app">
        <h2 className="text-center text-2xl font-semibold text-brand-navy">Common questions</h2>
        <div className="mx-auto mt-6 max-w-3xl divide-y rounded-xl border bg-white">
          {items.map((f, idx) => (
            <Disclosure key={idx}>
              {({ open }) => (
                <div className="p-4">
                  <Disclosure.Button className="flex w-full items-center justify-between text-left">
                    <span className="font-medium text-brand-navy">{f.q}</span>
                    <span className={`ml-4 text-brand-blue transition ${open ? "rotate-45" : ""}`}>+</span>
                  </Disclosure.Button>
                  <Disclosure.Panel className="mt-2 text-sm text-slate-700">
                    {f.a}
                  </Disclosure.Panel>
                </div>
              )}
            </Disclosure>
          ))}
        </div>
      </div>
    </Section>
  );
}
