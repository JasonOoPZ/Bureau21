import Image from "next/image";
import { getStarterCharacter } from "@/lib/starter-characters";

interface StarterCharacterPortraitProps {
  slug?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: { width: 88, height: 88 },
  md: { width: 124, height: 124 },
  lg: { width: 176, height: 176 },
  xl: { width: 260, height: 260 },
} as const;

export function StarterCharacterPortrait({ slug, size = "md" }: StarterCharacterPortraitProps) {
  const character = getStarterCharacter(slug);
  const dims = sizeMap[size];

  return (
    <Image
      src={character.image}
      alt={character.name}
      width={dims.width}
      height={dims.height}
      className="object-contain"
      draggable={false}
    />
  );
}
