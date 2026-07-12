import imgImage50 from "./15cd34f6f07b82a0b9da0ec25bb5a5f82849256c.png";

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

function Frame() {
  return (
    <div className="bg-[#f8f8f8] flex-[1_0_0] h-[300px] min-w-px relative rounded-[30px]">
      <div className="flex flex-col justify-center overflow-clip rounded-[inherit] size-full">
        <div className="[word-break:break-word] content-stretch flex flex-col items-start justify-between p-[30px] relative size-full">
          <p className="font-['Public_Sans:Medium',sans-serif] font-medium leading-[normal] mb-[-8px] relative shrink-0 text-[32px] text-black tracking-[-0.96px] w-full">{`AI Strategy & Implementation Roadmap`}</p>
          <div className="flex flex-col font-['Public_Sans:Light',sans-serif] font-light h-[134px] justify-end leading-[0] relative shrink-0 text-[#9a9a9a] text-[24px] tracking-[-0.72px] w-full">
            <p className="leading-[normal]">Plan where AI fits in your business, what to build, in what order, and how to measure success.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="flex-[1_0_0] h-[420px] min-w-px relative rounded-[30px]" style={{ backgroundImage: "linear-gradient(rgba(60, 60, 60, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(90deg, rgb(248, 248, 248) 0%, rgb(248, 248, 248) 100%)" }}>
      <div className="flex flex-col justify-center overflow-clip rounded-[inherit] size-full">
        <div className="[word-break:break-word] content-stretch flex flex-col items-start justify-between p-[30px] relative size-full">
          <p className="font-['Public_Sans:Medium',sans-serif] font-medium leading-[normal] relative shrink-0 text-[32px] text-black tracking-[-0.96px] w-full">Vibe-to-Production</p>
          <div className="flex flex-col font-['Public_Sans:Light',sans-serif] font-light h-[134px] justify-end leading-[0] relative shrink-0 text-[#9a9a9a] text-[24px] tracking-[-0.72px] w-full">
            <p className="leading-[normal]">Help you manage your prototype projects expectation into clean, production-ready applications.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="bg-[#f8f8f8] flex-[1_0_0] h-[300px] min-w-px relative rounded-[30px]">
      <div className="flex flex-col justify-center overflow-clip rounded-[inherit] size-full">
        <div className="[word-break:break-word] content-stretch flex flex-col items-start justify-between p-[30px] relative size-full">
          <p className="font-['Public_Sans:Medium',sans-serif] font-medium leading-[normal] relative shrink-0 text-[32px] text-black tracking-[-0.96px] w-full">Technical Cost Optimisation</p>
          <div className="flex flex-col font-['Public_Sans:Light',sans-serif] font-light h-[134px] justify-end leading-[0] relative shrink-0 text-[#9a9a9a] text-[24px] tracking-[-0.72px] w-full">
            <p className="leading-[normal]">Audit your current systems and recommend ways to reduce infrastructure, tooling, and operational costs.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="-translate-x-1/2 absolute content-stretch flex gap-[9px] items-center left-1/2 top-[284px] w-[1056px]">
      <Frame />
      <Frame1 />
      <Frame3 />
    </div>
  );
}

export default function IPhone1617Pro() {
  return (
    <div className="bg-white relative size-full" data-name="iPhone 16 & 17 Pro - 4">
      <Group />
      <div className="absolute h-[85.403px] left-0 mix-blend-hard-light top-[-6px] w-[68.323px]" data-name="image 50">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage50} />
      </div>
      <p className="[word-break:break-word] absolute font-['Public_Sans:Light',sans-serif] font-light leading-[normal] left-[61.52px] text-[28.95px] text-black top-[18.61px] tracking-[-0.8685px] whitespace-nowrap">Nalar</p>
      <Frame2 />
      <p className="[word-break:break-word] absolute font-['Public_Sans:Light',sans-serif] font-light leading-[normal] left-[34px] text-[48px] text-black top-[133px] tracking-[-1.44px] whitespace-nowrap">Key Services</p>
      <p className="[word-break:break-word] absolute font-['Public_Sans:Light',sans-serif] font-light leading-[normal] left-[36px] text-[36px] text-black top-[189px] tracking-[-1.08px] whitespace-nowrap">Consultation</p>
    </div>
  );
}