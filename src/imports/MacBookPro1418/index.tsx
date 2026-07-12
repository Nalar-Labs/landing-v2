import svgPaths from "./svg-f6thk5uodz";
import imgImage50 from "./15cd34f6f07b82a0b9da0ec25bb5a5f82849256c.png";
import imgFrame12 from "./409700847209c26bd26fe3aa77ca5441a1ae1906.png";

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

function Frame() {
  return (
    <div className="relative shrink-0 size-[36px]" data-name="Frame">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 36 36">
        <g id="Frame">
          <path d={svgPaths.p1fdcc1c0} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame1() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-[#ff5900] content-stretch flex gap-[10px] items-center left-1/2 px-[30px] py-[15px] rounded-[60px] top-[calc(50%+146px)]">
      <p className="[word-break:break-word] font-['Public_Sans:Light',sans-serif] font-light leading-[normal] relative shrink-0 text-[36px] text-center text-white tracking-[-1.08px] whitespace-nowrap">Book a call</p>
      <Frame />
    </div>
  );
}

function Frame2() {
  return (
    <div className="-translate-x-1/2 absolute h-[628px] left-[calc(50%+0.5px)] overflow-clip rounded-[30px] top-[211px] w-[1403px]">
      <div aria-hidden className="absolute inset-0 pointer-events-none rounded-[30px]">
        <div className="absolute bg-black inset-0 rounded-[30px]" />
        <div className="absolute inset-0 overflow-hidden rounded-[30px]">
          <img alt="" className="absolute h-[-2967977856.71%] left-[1394336669%] max-w-none top-[-1071984171.12%] w-[-1328503240.38%]" src={imgFrame12} />
        </div>
        <div className="absolute bg-[rgba(0,0,0,0.52)] inset-0 rounded-[30px]" />
      </div>
      <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Public_Sans:Regular',sans-serif] font-normal leading-none left-[701.5px] text-[96px] text-center text-white top-[calc(50%-139px)] tracking-[-2.88px] w-[981px]">Let’s make your tool your hardest worker</p>
      <Frame1 />
    </div>
  );
}

export default function MacBookPro() {
  return (
    <div className="bg-white relative size-full" data-name="MacBook Pro 14' - 18">
      <div className="absolute h-[118px] left-[23px] mix-blend-hard-light top-[-4px] w-[95px]" data-name="image 50">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage50} />
      </div>
      <p className="[word-break:break-word] absolute font-['Public_Sans:Light',sans-serif] font-light leading-[normal] left-[108px] text-[40px] text-black top-[30px] tracking-[-1.2px] whitespace-nowrap">Nalar</p>
      <Group />
      <Frame2 />
    </div>
  );
}