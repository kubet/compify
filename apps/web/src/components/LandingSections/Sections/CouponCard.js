import { Clock } from "lucide-react";

function CouponCard({ text, value, bottomText }) {
    const maskSVG = encodeURIComponent(`
      <svg width="100%" height="100%" viewBox="0 0 400 150" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="cutouts">
            <rect width="100%" height="100%" fill="white"/>
            <circle cx="-10" cy="75" r="24" fill="black"/>
            <circle cx="410" cy="75" r="24" fill="black"/>
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="white" mask="url(#cutouts)"/>
      </svg>
    `);

    return (
        <div className="w-[370px] mx-auto p-4">
            <div
                className="relative overflow-hidden w-full"
                style={{
                    mask: `url("data:image/svg+xml,${maskSVG}") center/100% 100% no-repeat`,
                    WebkitMask: `url("data:image/svg+xml,${maskSVG}") center/100% 100% no-repeat`,
                }}
            >
                {/* Half circle borders */}
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-[50%] w-[42px] h-[42px] border-2 border-zinc-800 rounded-full pointer-events-none" />
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-[50%] w-[42px] h-[42px] border-2 border-zinc-800 rounded-full pointer-events-none" />

                <div className="bg-zinc-900 rounded-3xl">
                    <div className="flex relative">
                        {/* Left section */}
                        <div className="w-1/3 relative">
                            <div className="absolute -right-px top-0 bottom-0 w-[1px] border-l border-dashed border-zinc-700"></div>
                            <div className="px-6 h-full flex justify-center items-center">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center">
                                    <span className="text-4xl font-extrabold text-white/50 leading-none">%</span>
                                </div>
                            </div>
                            <div className="absolute bottom-2 left-3 text-[11px] text-gray-500/60 font-light tracking-wide">
                                Click to reveal
                            </div>
                        </div>

                        {/* Right section */}
                        <div className="w-2/3">
                            <div className="p-6">
                                <span className="text-sm text-gray-400/80 mr-1">FOREVER</span>

                                <div className="flex items-baseline">
                                    <span className="text-base text-gray-400/80 mr-1">$</span>
                                    <span className="text-[32px] font-black tracking-tight text-white">{value}</span>
                                    <span className="ml-2.5 text-gray-400/90 uppercase text-xs tracking-[0.2em] font-medium">{text}</span>
                                </div>
                                <div className="text-gray-400 text-xs mt-2.5 font-light flex items-center gap-1.5 select-text cursor-text">
                                    <Clock className="w-3 h-3 stroke-[1.5]" />
                                    <span className="text-gray-300 font-medium whitespace-nowrap">{bottomText}</span>
                                    <span className="text-gray-400/80 text-[11px] whitespace-nowrap">PROMO CODE</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Border overlay */}
                    <div
                        className="absolute top-0 left-0 w-full h-full border-2 border-zinc-800 rounded-3xl pointer-events-none"
                    />
                </div>
            </div>
        </div>
    );
}

export default CouponCard;