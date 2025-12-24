import { Camera } from 'lucide-react';

interface ScanButtonProps {
  onClick: () => void;
  label: string;
}

export function ScanButton({ onClick, label }: ScanButtonProps) {
  return (
    <button
      onClick={onClick}
      className="group relative flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#2ECC71] to-[#27AE60] shadow-[0_10px_40px_rgba(46,204,113,0.3)] transition-all duration-200 hover:from-[#27AE60] hover:to-[#229954] hover:shadow-[0_15px_50px_rgba(46,204,113,0.4)] active:scale-95"
    >
      <Camera className="h-16 w-16 text-white transition-transform group-hover:scale-110" />
      <span className="text-white">{label}</span>
    </button>
  );
}
