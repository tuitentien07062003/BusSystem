import { AVATAR_GRADIENTS } from "./employeeConstants";

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function getInitials(fullName) {
  if (!fullName) return "?";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[parts.length - 1][0] + parts[0][0]).toUpperCase();
}

export function EmployeeAvatar({ employee, size = "md", ring = false }) {
  const initials = getInitials(employee?.full_name);
  const hash = hashString(
    employee?.employee_code || String(employee?.id || ""),
  );
  const gradient = AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];

  const sizes = {
    sm: "w-9 h-9 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-lg",
    xl: "w-20 h-20 text-2xl",
  };

  return (
    <div
      className={`${sizes[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0 ${
        ring ? "ring-2 ring-white" : ""
      }`}
    >
      {initials}
    </div>
  );
}
