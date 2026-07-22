import { Plus } from "lucide-react";

interface FabProps {
  onClick: () => void;
  label?: string;
}

export function Fab({ onClick, label = "Tambah" }: FabProps) {
  return (
    <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-full max-w-md z-30 pointer-events-none">
      <button
        onClick={onClick}
        className="pointer-events-auto absolute right-4 w-14 h-14 bg-linear-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-shadow cursor-pointer"
        aria-label={label}
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
