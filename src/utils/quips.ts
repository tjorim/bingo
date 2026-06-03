const QUIPS = [
  "Zero Trust? More like Zero Fun.",
  "IT called, they want their MFA back.",
  "Certified 2FA Survivor. 🏅",
  "You didn't choose the 2FA life. The 2FA life chose you.",
  "Authentication is temporary. Bingo is forever.",
  "Your identity has been verified… and then some.",
  "That's enough security theatre for one day.",
  "Okta: keeping you employed one push at a time.",
  "MFA fatigue? More like MFA VICTORY. 💪",
  "They said 'Zero Trust'. We said 'Zero Chill'.",
  "Single sign-on? More like single sign-WIN.",
  "Push approved. Dopamine released. 🧠",
  "Congratulations — you are who you say you are.",
  "Your session may expire. This glory will not.",
];

export function randomQuip(): string {
  return QUIPS[Math.floor(Math.random() * QUIPS.length)];
}
