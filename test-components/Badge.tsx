interface BadgeProps {
  text: string;
}

export function Badge({ text }: BadgeProps) {
  return (
    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
      {text}
    </span>
  );
}
