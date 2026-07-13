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
    <div className="bg-white relative size-full" data-name="MacBook Pro 14' - 4">
      <p className="[word-break:break-word] absolute font-['Public_Sans:Light',sans-serif] font-light leading-[normal] left-[37px] text-[40px] text-black top-[30px] tracking-[-1.2px] whitespace-nowrap">Nalar</p>
      <Group />
      <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Public_Sans:Light',sans-serif] font-light leading-[normal] left-[calc(50%-0.5px)] text-[96px] text-black text-center top-[287px] tracking-[-2.88px] w-[1345px]">Nalar Labs is a World Class firm of AI-native professionals helping you Implement AI strategy, bespoke software, and agentic deployment.</p>
      <p className="[word-break:break-word] absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[530px] not-italic text-[24px] text-black top-[748px] whitespace-nowrap">Book a call</p>
      <p className="[word-break:break-word] absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[756px] not-italic text-[24px] text-black top-[748px] whitespace-nowrap">Refer someone-else</p>
    </div>
  );
}