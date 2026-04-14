import Image from "next/image";
import { getStarterCharacter } from "@/lib/starter-characters";

interface StarterCharacterPortraitProps {
  slug?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: { width: 160, height: 160 },
  md: { width: 200, height: 200 },
  lg: { width: 280, height: 280 },
  xl: { width: 400, height: 400 },
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
      unoptimized
      draggable={false}
    />
  );
}
