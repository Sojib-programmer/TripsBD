import { BrandMark } from "../BrandMark";
import { StatusBar } from "../StatusBar";

export function SplashScreen() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <StatusBar />
      <div className="flex flex-1 items-center justify-center">
        <BrandMark size="lg" />
      </div>
    </div>
  );
}