import { Hero } from "@/components/landing/hero";
import { Answers, Closing, Problem, Steps } from "@/components/landing/sections";

export default function Home() {
  return (
    <div className="overflow-x-clip bg-cc-paper text-cc-ink">
      <Hero />
      <main>
        <Problem />
        <Answers />
        <Steps />
      </main>
      <Closing />
    </div>
  );
}
