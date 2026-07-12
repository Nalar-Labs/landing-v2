import svgPaths from "./svg-l6jsyvcvea";

function Frame() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Frame">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Frame">
          <path d={svgPaths.p38e89380} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame1() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-[#3c3c3c] content-stretch flex gap-[6px] items-center left-[calc(50%-0.5px)] px-[20px] py-[8px] rounded-[60px] top-[calc(50%+121.5px)]">
      <p className="[word-break:break-word] font-['Public_Sans:Light',sans-serif] font-light leading-[normal] relative shrink-0 text-[16px] text-center text-white tracking-[-0.48px] whitespace-nowrap">Explore Nalar</p>
      <Frame />
    </div>
  );
}

function Group() {
  return (
    <div className="absolute h-[17.5px] left-[341px] top-[28px] w-[37px]">
      <div className="absolute inset-[-5.71%_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 37 19.5">
          <g id="Group 4">
            <path d="M37 1H0" id="Vector 16" stroke="var(--stroke-0, black)" strokeWidth="2" />
            <path d="M37 9.5H0" id="Vector 17" stroke="var(--stroke-0, black)" strokeWidth="2" />
            <path d="M37 18.5H0" id="Vector 18" stroke="var(--stroke-0, black)" strokeWidth="2" />
          </g>
        </svg>
      </div>
    </div>
  );
}

export default function IPhone1617Pro() {
  return (
    <div className="bg-white relative size-full" data-name="iPhone 16 & 17 Pro - 1">
      <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Public_Sans:Light',sans-serif] font-light leading-[normal] left-1/2 text-[36px] text-black text-center top-[311px] tracking-[-1.08px] w-[342px]">Nalar Labs Manifesto Strong Copywriting, kinetic typography p5.js</p>
      <Frame1 />
      <p className="[word-break:break-word] absolute font-['Public_Sans:Light',sans-serif] font-light leading-[normal] left-[15px] text-[40px] text-black top-[13px] tracking-[-1.2px] whitespace-nowrap">Nalar</p>
      <Group />
    </div>
  );
}