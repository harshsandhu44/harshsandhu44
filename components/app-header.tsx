import { Navbar } from "@/components/navbar";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function AppHeader() {
  return (
    <header className="bg-transparent backdrop-blur-lg fixed top-0 inset-x-0 z-20">
      <div className="px-4 max-w-7xl mx-auto h-24 grid grid-cols-2 items-center gap-4">
        <span className="font-black">Harsh Sandhu</span>

        <div className="place-self-end self-center flex flex-row-reverse md:flex-row items-center gap-6">
          <Navbar />
          <ThemeToggle showLabel />
        </div>
      </div>
    </header>
  );
}

AppHeader.displayName = "AppHeader";
