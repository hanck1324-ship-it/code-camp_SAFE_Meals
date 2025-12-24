import { Camera } from 'lucide-react';

interface ScanButtonProps {
  onClick: () => void;
  label: string;
}

export function ScanButton({ onClick, label }: ScanButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        relative w-40 h-40 rounded-full
        bg-gradient-to-br from-[#2ECC71] to-[#27AE60]
        hover:from-[#27AE60] hover:to-[#229954]
        active:scale-95
        transition-all duration-200
        shadow-[0_10px_40px_rgba(46,204,113,0.3)]
        hover:shadow-[0_15px_50px_rgba(46,204,113,0.4)]
        flex flex-col items-center justify-center gap-2
        group
      "
    >
      <Camera className="w-16 h-16 text-white group-hover:scale-110 transition-transform" />
      <span className="text-white">{label}</span>
    </button>
  );
}
