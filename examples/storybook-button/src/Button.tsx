import React from "react";
import "./button.css";

type ButtonProps = { label: string; disabled?: boolean };

export function Button({ label, disabled = false }: ButtonProps) {
  return <button className="example-button" disabled={disabled}>{label}</button>;
}
