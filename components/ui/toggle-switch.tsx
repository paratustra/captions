"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type ToggleSwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function ToggleSwitch({ checked, onCheckedChange }: ToggleSwitchProps) {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="translate"
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label="Translate captions to English"
      />
      <Label htmlFor="translate">
        <span role="img" aria-label="English translation">
          🇺🇸
        </span>
      </Label>
    </div>
  );
}
