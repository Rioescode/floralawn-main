export const MIX_SERVICES = [
  { name: "Lawn Mowing", form: "Lawn Mowing" },
  { name: "Leaf Removal", form: "Leaf Removal" },
  { name: "Spring Cleanup", form: "Spring Cleanup" },
  { name: "Lawn Dethatching", form: "Lawn Dethatching" },
  { name: "Mulching", form: "Mulching" },
  { name: "Hedge Trimming", form: "Hedge Trimming" },
  { name: "Core Aeration", form: "Lawn Aeration" },
  { name: "Overseeding", form: "Overseeding" },
  { name: "Fertilization", form: "Lawn Fertilization" },
  { name: "Weed Control", form: "Weed Control" },
];

export const CONTACT_SERVICES = [
  ...MIX_SERVICES,
  { name: "Fall Cleanup", form: "Fall Cleanup" },
  { name: "Snow Removal", form: "Snow Removal" },
];

const SERVICE_ALIASES = {
  "Core Aeration": "Lawn Aeration",
  Fertilization: "Lawn Fertilization",
  "Complete Fall Cleanup": "Fall Cleanup",
  "Weekly Lawn Mowing": "Lawn Mowing",
  "Weekly mowing": "Lawn Mowing",
  "Snow removal": "Snow Removal",
  "spring-dethatch": "Spring Cleanup",
  "first-cut-special": "Lawn Mowing",
  "prepay-unlock": "Lawn Mowing",
  "honor-service": "Lawn Mowing",
};

export function canonicalService(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return SERVICE_ALIASES[trimmed] || trimmed;
}

export function resolveServiceList(serviceParam, servicesParam) {
  const known = new Set(CONTACT_SERVICES.map((service) => service.form));
  const raw = [];
  if (serviceParam) raw.push(serviceParam);
  String(servicesParam || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => raw.push(part));

  const picked = [];
  raw.forEach((item) => {
    const form = canonicalService(item);
    if (known.has(form) && !picked.includes(form)) picked.push(form);
  });
  return picked;
}

export function serviceDisplayName(form) {
  return CONTACT_SERVICES.find((service) => service.form === form)?.name || form;
}
