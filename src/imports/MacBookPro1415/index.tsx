import imgImage50 from "./15cd34f6f07b82a0b9da0ec25bb5a5f82849256c.png";

function Frame1() {
  return (
    <div className="flex-[1_0_0] h-[420px] min-w-px relative rounded-[30px]" style={{ backgroundImage: "linear-gradient(rgba(60, 60, 60, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(90deg, rgb(248, 248, 248) 0%, rgb(248, 248, 248) 100%)" }}>
      <div className="flex flex-col justify-center overflow-clip rounded-[inherit] size-full">
        <div className="[word-break:break-word] content-stretch flex flex-col items-start justify-between p-[30px] relative size-full">
          <p className="font-['Public_Sans:Medium',sans-serif] font-medium leading-[normal] relative shrink-0 text-[32px] text-black tracking-[-0.96px] w-full">Internal Tool Building</p>
          <div className="flex flex-col font-['Public_Sans:Light',sans-serif] font-light h-[134px] justify-end leading-[0] relative shrink-0 text-[#9a9a9a] text-[24px] tracking-[-0.72px] w-full">
            <p className="leading-[normal]">Migrate your team off paid SaaS subscriptions and replace them with custom in-house tools you own.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="bg-[#f8f8f8] flex-[1_0_0] h-[300px] min-w-px relative rounded-[30px]">
      <div className="flex flex-col justify-center overflow-clip rounded-[inherit] size-full">
        <div className="[word-break:break-word] content-stretch flex flex-col items-start justify-between p-[30px] relative size-full">
          <p className="font-['Public_Sans:Medium',sans-serif] font-medium leading-[normal] relative shrink-0 text-[32px] text-black tracking-[-0.96px] w-full">External Product Development</p>
          <div className="flex flex-col font-['Public_Sans:Light',sans-serif] font-light h-[134px] justify-end leading-[0] relative shrink-0 text-[#9a9a9a] text-[24px] tracking-[-0.72px] w-full">
            <p className="leading-[normal]">Build customer-facing products architected to scale to millions of users.</p>
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
          <p className="font-['Public_Sans:Medium',sans-serif] font-medium leading-[normal] relative shrink-0 text-[32px] text-black tracking-[-0.96px] w-full">Agentic Deployment</p>
          <div className="flex flex-col font-['Public_Sans:Light',sans-serif] font-light h-[134px] justify-end leading-[0] relative shrink-0 text-[#9a9a9a] text-[24px] tracking-[-0.72px] w-full">
            <p className="leading-[normal]">Design and deploy AI agents that automate workflows across your business.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="-translate-x-1/2 absolute content-stretch flex gap-[27px] items-center left-1/2 top-[450px] w-[1414px]">
      <Frame1 />
      <Frame />
      <Frame3 />
    </div>
  );
}

function Group() {
  return (
    <div className="absolute h-[17.5px] left-[1430px] top-[38px] w-[37px]">
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

export default function MacBookPro() {
  return (
    <div className="bg-white relative size-full" data-name="MacBook Pro 14' - 15">
      <div className="absolute h-[118px] left-[23px] mix-blend-hard-light top-[-4px] w-[95px]" data-name="image 50">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage50} />
      </div>
      <p className="[word-break:break-word] absolute font-['Public_Sans:Light',sans-serif] font-light leading-[normal] left-[108px] text-[40px] text-black top-[30px] tracking-[-1.2px] whitespace-nowrap">Nalar</p>
      <p className="[word-break:break-word] absolute font-['Public_Sans:Light',sans-serif] font-light leading-[normal] left-[47px] text-[96px] text-black top-[133px] tracking-[-2.88px] whitespace-nowrap">Key Services</p>
      <p className="[word-break:break-word] absolute font-['Public_Sans:Light',sans-serif] font-light leading-[normal] left-[47px] text-[64px] text-black top-[265px] tracking-[-1.92px] whitespace-nowrap">End-to-End Implementation</p>
      <Frame2 />
      <Group />
    </div>
  );
}