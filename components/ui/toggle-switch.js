"use client";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function ToggleSwitch({ onCheckedChange }) {
  return (
    <div className="flex items-center space-x-2">
      <Switch id="translate" onCheckedChange={onCheckedChange} />
      <Label htmlFor="translate">🇺🇸</Label>
    </div>
  );
}
