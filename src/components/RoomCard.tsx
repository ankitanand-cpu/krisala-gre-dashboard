import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Room {
  id: string;
  name: string;
  status: "available" | "occupied" | "maintenance" | "premium";
  floor: number;
  area: number;
  lastUpdated: string;
  client?: string;
}

interface RoomCardProps {
  room: Room;
  isSelected?: boolean;
  onSelect: (room: Room) => void;
  onManage: (room: Room) => void;
}

export default function RoomCard({
  room,
  isSelected,
  onSelect,
  onManage,
}: RoomCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "status-selected";
      case "occupied":
        return "status-unselected";
      case "maintenance":
        return "status-unselected";
      case "premium":
        return "status-selected";
      default:
        return "status-selected";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Available";
      case "occupied":
        return "Occupied";
      case "maintenance":
        return "Maintenance";
      case "premium":
        return "Premium";
      default:
        return "Unknown";
    }
  };

  return (
    <Card
      className={`bg-[var(--bg-surface)] border-white/20 cursor-pointer transition-all duration-300 hover:scale-105 ${
        isSelected ? "ring-2 ring-[var(--accent-green)]" : ""
      }`}
      onClick={() => onSelect(room)}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-lg sm:text-xl mb-1 sm:mb-2 text-white truncate">
              {room.name}
            </h3>
            <p className="text-xs sm:text-sm text-white/60">
              Floor {room.floor} • {room.area} sq ft
            </p>
          </div>
          <div
            className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0 ${getStatusColor(
              room.status
            )}`}
          ></div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-white/60">
              Status:
            </span>
            <Badge
              className={`text-xs sm:text-sm ${
                room.status === "available" || room.status === "premium"
                  ? "bg-[var(--accent-green)] text-[var(--bg-primary)]"
                  : "bg-[var(--bg-secondary)] text-white border border-white"
              }`}
            >
              {getStatusText(room.status)}
            </Badge>
          </div>

          {room.client && (
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-white/60">
                Client:
              </span>
              <span className="text-xs sm:text-sm font-medium glow-gold-text truncate ml-2">
                {room.client}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-white/60">
              Updated:
            </span>
            <span className="text-xs sm:text-sm text-white/60">
              {room.lastUpdated}
            </span>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/10">
          <Button
            variant="secondary"
            className="w-full bg-[var(--bg-secondary)] text-white hover:bg-white/10 text-xs sm:text-sm py-2 sm:py-2.5"
            onClick={(e) => {
              e.stopPropagation();
              onManage(room);
            }}
          >
            Manage Room
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
