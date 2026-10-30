import { Battery, BatteryCharging, Droplet } from 'lucide-react';

const ICONS = { pilhas: Battery, baterias: BatteryCharging, 'oleo-vegetal': Droplet };

export default function MaterialIcon({ slug, size = 16 }) {
  const Icon = ICONS[slug] || Battery;
  return <Icon size={size} aria-hidden="true" />;
}
