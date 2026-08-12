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
  { href: "/rules", label: "Rules" },
];

export const audioLanguages = [
  { value: "en-IN", label: "English", flag: "🇬🇧" },
  { value: "hi-IN", label: "Hindi", flag: "🇮🇳" },
  { value: "te-IN", label: "Telugu", flag: "🇮🇳" },
] as const;

export type AudioLang = (typeof audioLanguages)[number]["value"];
