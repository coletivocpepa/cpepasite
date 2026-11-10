import Hero from "@/components/sections/Hero";
import Sobre from "@/components/sections/Sobre";
import Escuta from "@/components/sections/Escuta";
import ParaPais from "@/components/sections/ParaPais";
import EbookBanner from "@/components/sections/EbookBanner";
import ComoFunciona from "@/components/sections/ComoFunciona";
import ValorSimbolico from "@/components/sections/ValorSimbolico";
import Posicao from "@/components/sections/Posicao";
import Faq from "@/components/sections/Faq";
import CtaFinal from "@/components/sections/CtaFinal";

export default function Home() {
  return (
    <>
      <Hero />
      <Sobre />
      <Escuta />
      <ParaPais />
      <EbookBanner />
      <ComoFunciona />
      <ValorSimbolico />
      <Posicao />
      <Faq />
      <CtaFinal />
    </>
  );
}