import svgPaths from "./svg-ezhnfoelwt";
import imgImage50 from "./15cd34f6f07b82a0b9da0ec25bb5a5f82849256c.png";

function Group() {
  return (
    <div className="absolute h-[26.583px] left-[1447px] top-[40px] w-[26.578px]">
      <div className="absolute inset-[-2.66%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 27.9922 27.9972">
          <g id="Group 3">
            <path d={svgPaths.p39fbab00} id="Vector 16" stroke="var(--stroke-0, black)" strokeWidth="2" />
            <path d={svgPaths.p1a7cb400} id="Vector 18" stroke="var(--stroke-0, black)" strokeWidth="2" />
          </g>
        </svg>
      </div>
    </div>
  );
}

export default function MacBookPro() {
  return (
    <div className="bg-white relative size-full" data-name="MacBook Pro 14' - 13">
      <Group />
      <div className="[word-break:break-word] absolute font-['Public_Sans:Light',sans-serif] font-light leading-[0] left-[38px] text-[96px] text-black top-[387px] tracking-[-2.88px] whitespace-nowrap">
        <p className="leading-[normal] mb-0">Home (page anchor)</p>
        <p className="leading-[normal] mb-0">Key Services</p>
        <p className="leading-[normal] mb-0">Portfolio</p>
        <p className="leading-[normal] mb-0">{`FAQ // Should be ranamed`}</p>
        <p className="leading-[normal]">Book A Free Session</p>
      </div>
      <div className="absolute h-[118px] left-[23px] mix-blend-hard-light top-[-4px] w-[95px]" data-name="image 50">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage50} />
      </div>
      <p className="[word-break:break-word] absolute font-['Public_Sans:Light',sans-serif] font-light leading-[normal] left-[108px] text-[40px] text-black top-[30px] tracking-[-1.2px] whitespace-nowrap">Nalar</p>
    </div>
  );
}