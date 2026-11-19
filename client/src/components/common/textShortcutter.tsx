import type React from "react";
import { useState } from "react";

export default function TextShortcutter({ children, linesLimit }: {
  children: React.ReactElement,
  linesLimit: number
}) {
  const [unfolded, setUnfolded] = useState(false);

  return (
    <span 
      className="overflow-y-hidden text-ellipsis"
      style={{
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        lineClamp: unfolded || linesLimit < 1 ? undefined : linesLimit,
        WebkitLineClamp: unfolded || linesLimit < 1 ? undefined : linesLimit,
      }}
      onClick={() => { setUnfolded(fs => !fs) }}
    >{ children }</span>
  );
}
