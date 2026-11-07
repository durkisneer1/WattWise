import React from "react";
import { Info } from "lucide-react";

type Props = {
  title: string;
  children: React.ReactNode;
};

export function PhaseNote({ title, children }: Props) {
  return (
    <div className="phase-note">
      <Info size={18} aria-hidden />
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </div>
  );
}
