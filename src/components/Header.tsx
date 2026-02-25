"use client";

import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

interface HeaderProps {
  showLogout?: boolean;
  onLogoutClick?: () => void;
  rightContent?: React.ReactNode;
}

export default function Header({
  showLogout = false,
  onLogoutClick,
  rightContent,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-surface)] border-b border-white/10 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-18 lg:h-20">
          {/* Left Section */}
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
            <Logo />
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
            {rightContent}
            {showLogout && onLogoutClick && (
              <Button
                onClick={onLogoutClick}
                variant="outline"
                size="sm"
                className="text-white/70 border-white/20 hover:bg-white/10 hover:text-white text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Out</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
