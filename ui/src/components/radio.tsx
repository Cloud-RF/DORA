import type { RadioData } from "../api/radio-data";
import { NoiseBlock } from "./noise-block";

export type RadioProps = {
  data: RadioData,
  noiseBlockWidth: number,
  bandwidth_mhz: number | undefined,
  setHoverText: (hoverText: string) => void
}

export function Radio(props: RadioProps) {
  let blockSize = '50px';

  return (
    <>
      <div className={`whitespace-nowrap`} style={{height: blockSize}}>
        {props.data.data.map(freqNoise =>
          <NoiseBlock 
            key={`${props.data.address}-freq-${freqNoise.frequency}`} 
            radio={props.data} 
            frequencyNoise={freqNoise} 
            blockWidth={props.noiseBlockWidth}
            bandwidth_mhz={props.bandwidth_mhz}            
            setHoverText={props.setHoverText}></NoiseBlock>
        )}
      </div>
    </>
  )
}