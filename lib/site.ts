export const siteConfig = {
  name: "Tambola Zone",
  shortName: "Tambola",
  tagline: "The complete house party Tambola / Housie experience",
  description:
    "Play Tambola online with a professional number caller, auto-call mode, Hindi & Telugu voice, and a certified 3x9 ticket generator that follows official Housie rules. Free, no sign-up.",
  url: "https://tambola.vercel.app",
  keywords: [
    "tambola",
    "housie",
    "bingo",
    "tambola ticket generator",
    "online tambola",
    "house party games",
    "hindi tambola",
    "telugu tambola",
  ],
  links: [
    { href: "/", label: "Home" },
    { href: "/game", label: "Number Caller" },
    { href: "/tickets", label: "Tickets" },
    { href: "/rules", label: "Rules" },
  ],
};

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/play", label: "Play" },
  { href: "/game", label: "Number Caller" },
  { href: "/tickets", label: "Tickets" },
  { href: "/history", label: "My Games" },
  { href: "/rules", label: "Rules" },
];

export const audioLanguages = [
  { value: "en-IN", label: "English (India)", flag: "🇮🇳" },
  { value: "hi-IN", label: "Hindi", flag: "हिं" },
  { value: "te-IN", label: "Telugu", flag: "తె" },
] as const;

export type AudioLang = (typeof audioLanguages)[number]["value"];

export const voiceTones = [
  { value: "natural", label: "Natural", rate: 0.85, pitch: 1 },
  { value: "deep", label: "Deep", rate: 0.75, pitch: 0.7 },
  { value: "bright", label: "Bright", rate: 0.85, pitch: 1.4 },
  { value: "quick", label: "Quick", rate: 1.2, pitch: 1 },
] as const;

export type VoiceTone = (typeof voiceTones)[number]["value"];
