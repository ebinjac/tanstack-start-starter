import { Button } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

interface BackButtonProps {
  to?: string;
  label?: string;
  variant?: "ghost" | "outline" | "light" | "solid" | "bordered" | "flat" | "faded" | "shadow" | "danger";
  className?: string;
}

export function BackButton({
  to,
  label = "Back",
  variant = "outline",
  className = "",
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate({ to });
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant={variant}
      className={`p-1 px-2 text-muted hover:text-foreground text-sm flex items-center gap-1 cursor-pointer ${className}`}
      onPress={handleClick}
    >
      <ArrowLeft className="size-4" />
      {label}
    </Button>
  );
}
