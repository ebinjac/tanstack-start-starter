import { Avatar } from "@heroui/react";

interface AvatarWithInitialsProps {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0284c7&color=fff`;
}

export function AvatarWithInitials({
  name,
  src,
  size = "md",
  className = "",
}: AvatarWithInitialsProps) {
  const imageUrl = src ?? getAvatarUrl(name);
  const initials = getInitials(name);

  return (
    <Avatar className={className}>
      <Avatar.Image src={imageUrl} alt={name} />
      <Avatar.Fallback delayMs={600}>{initials}</Avatar.Fallback>
    </Avatar>
  );
}
