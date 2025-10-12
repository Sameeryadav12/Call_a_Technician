import {
  Bug, ShieldCheck, Cpu, Wifi, HardDrive, Wrench,
  Cloud, Lock, MonitorUp, Network
} from "lucide-react";

export const SERVICE_CATEGORIES = [
  { id: "home", label: "Home" },
  { id: "business", label: "Business" },
  { id: "network", label: "Wi-Fi & Network" },
  { id: "security", label: "Security" },
];

export const SERVICES_BY_CATEGORY = {
  home: [
    {
      icon: Bug,
      title: "Virus & Malware Removal",
      blurb: "Identify, remove and secure against threats.",
      bullets: ["Full scan & cleanup", "Browser hijack fixes", "Protection setup"],
      price: "from $99",
      href: "/contact",
    },
    {
      icon: Cpu,
      title: "Speed Up Slow Computers",
      blurb: "Performance tune-up for Windows & macOS.",
      bullets: ["Startup optimisation", "App cleanup", "Thermal checks"],
      price: "from $89",
      href: "/contact",
    },
    {
      icon: MonitorUp,
      title: "New PC & Device Setup",
      blurb: "Unbox, migrate and configure everything right.",
      bullets: ["Data transfer", "Printer setup", "Email & apps"],
      price: "from $109",
      href: "/contact",
    },
    {
      icon: HardDrive,
      title: "Backup & Data Recovery",
      blurb: "Protect files and recover when possible.",
      bullets: ["Backup plan", "External & cloud", "Attempted recovery"],
      price: "from $129",
      href: "/contact",
    },
  ],
  business: [
    {
      icon: Network,
      title: "Business IT Support",
      blurb: "On-call help for small offices and teams.",
      bullets: ["Onsite & remote", "Networking/servers", "Security basics"],
      price: "plans available",
      href: "/contact",
    },
    {
      icon: Cloud,
      title: "Cloud & Email Setup",
      blurb: "Microsoft 365 / Google Workspace done right.",
      bullets: ["Domains & mail", "Calendar/contacts", "Drive/OneDrive"],
      price: "from $129",
      href: "/contact",
    },
  ],
  network: [
    {
      icon: Wifi,
      title: "Wi-Fi & Coverage Fix",
      blurb: "Fix dropouts, extend coverage, secure your network.",
      bullets: ["Mesh setup", "Speed & coverage test", "Guest network"],
      price: "from $129",
      href: "/contact",
    },
    {
      icon: Wrench,
      title: "Network Hardware Install",
      blurb: "Routers, switches, cabling, tidy & label.",
      bullets: ["Placement & mounting", "Config & testing", "Documentation"],
      price: "quote",
      href: "/contact",
    },
  ],
  security: [
    {
      icon: ShieldCheck,
      title: "Secure Hacked Devices",
      blurb: "Recover compromised accounts & devices safely.",
      bullets: ["Account recovery", "2FA setup", "Ongoing security tips"],
      price: "from $119",
      href: "/contact",
    },
    {
      icon: Lock,
      title: "Security Hardening",
      blurb: "MFA, password managers, backup + update strategy.",
      bullets: ["Audit & quick wins", "Best-practice setup", "Follow-up report"],
      price: "from $149",
      href: "/contact",
    },
  ],
};

// Small FAQ for the page
export const SERVICES_FAQ = [
  {
    q: "Do you charge a call-out fee?",
    a: "No separate call-out fee. We quote up-front before work begins. If we can’t fix it, you don’t pay.",
  },
  {
    q: "Do you offer same-day service?",
    a: "Yes—same-day in Adelaide & nearby suburbs, subject to availability. Call early for best choice of times.",
  },
  {
    q: "Is my data safe?",
    a: "We work in front of you where possible. Backup and privacy are always part of the conversation.",
  },
];
