import { useState } from "react";
import type { RadioData, FrequencyNoise } from "../api/radio-data";

export type NoiseBlockProps = {
    radio: RadioData,
    frequencyNoise: FrequencyNoise,
    blockWidth: number,
    bandwidth_mhz: number | undefined,
    setHoverText: (hoverText: string) => void
}

function noiseColorClass(props: NoiseBlockProps) {

    // Good noise is relative to the bandwidth which is why narrow signals cut through the noise
    // More bandwidth = More channel noise!

    let noise = props.frequencyNoise.noise

    if (props.bandwidth_mhz != undefined) {
        let thermalNoise = Math.round(-173.8 + 10 * Math.log10(props.bandwidth_mhz)) // eg. -104dBm for 10MHz
        if (noise > thermalNoise + 20) { return "bg-red-500" }
        else if (noise > thermalNoise + 10) { return "bg-amber-500" }
        else { return "bg-green-500" }
    }

}

export function NoiseBlock(props: NoiseBlockProps) {
    let blockSize = '50px';
    let [tooltipVisible, setTooltipVisible] = useState<boolean>(false);

    function handleMouseEnter() { 
        setTooltipVisible(true)
        if (props.bandwidth_mhz != undefined) {
            let startMhz = props.frequencyNoise.frequency - (props.bandwidth_mhz / 2);
            let endMhz = props.frequencyNoise.frequency + (props.bandwidth_mhz / 2);
            props.setHoverText(`${startMhz} - ${endMhz} MHZ : ${props.frequencyNoise.noise} dBm`)
        }
    }

    function handleMouseLeave() { 
        setTooltipVisible(false);
        props.setHoverText("")
    }

    return (
        <>
            <div
                className={`inline-block relative ${noiseColorClass(props)} cursor-pointer overflow-visible${tooltipVisible ? ' border-1 border-white' : ''}`}
                style={{ width: `${props.blockWidth}px`, height: blockSize }}
                onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            </div>
        </>
    )
}