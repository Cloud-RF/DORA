import { useRef, useEffect, useState } from "react";
import { Radio } from "./radio";
import { AddRadio } from "./add-radio";
import { removeRadio } from "./../api/sdr-api";
import type { SDRData } from "../api/radio-data";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';

export type RadioListProps = {
  data: SDRData | undefined,
  changed: () => void
}

export function RadioList(props: RadioListProps) {
  let addressRefs = useRef<{ [index: number]: HTMLDivElement }>([]);
  let addRadioModalRef = useRef<AddRadio>(null);
  let addressMarginPx = 12;
  let table = useRef<HTMLTableElement>(null);
  let [noiseBlockWidth, setNoiseBlockWidth] = useState(0);
  let [hoverText, setHoverText] = useState("");

  useEffect(() => {
    const handleResize = () => {
      if (table.current && addressRefs.current && props.data) {
        let tableWidth = table.current.getBoundingClientRect().width;
        let width = Math.max(...Object.values(addressRefs.current).map(addressRef => addressRef.getBoundingClientRect().width + 24));
        let noiseRange = ((props.data.end_mhz - props.data.start_mhz) / props.data.bandwidth_mhz);        
        let noiseDataWidth = tableWidth - width;
        noiseBlockWidth = (noiseDataWidth / noiseRange);
        setNoiseBlockWidth(noiseBlockWidth);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize) }
  });

  const handleRef = (element: any, index: number) => {
    if (addressRefs.current && element) {
      addressRefs.current[index] = element
    }
  };

  function addRadioClicked() {
    if (addRadioModalRef.current) { addRadioModalRef.current.show() }
  }

  function removeRadioClicked(address: string) {
    removeRadio(address).then(() => { props.changed() })
  }

  return (
    <>
      <div className={`relative rounded-md overflow-hidden`}>
        <div className={'w-full table'}>
          <div ref={table} className={'table-row'}>
            <div className={'table-cell bg-blue-200 pb-0'}>
              <div className={'inline-block font-bold align-bottom pl-3'}>Radio</div>
              <div className={`hover:bg-blue-300 rounded-sm m-0 cursor-pointer float-right pl-1 pr-1 mr-[2px] mt-[1px] mb-[1px]`}>
                <FontAwesomeIcon icon={faPlus} title="Add Radio" onClick={addRadioClicked} />
              </div>
            </div>
            <div className={'table-cell bg-blue-300'}>
              <div className={`w-full mb-0 pb-0`}>
                <div className={`inline-block absolute ml-1`}>
                  <div className={`inline-block text-center ml-1`}>
                    <div className={'text-xs font-bold mt-[5px]'}>{props.data?.start_mhz} MHZ</div>
                  </div>
                </div>
                <div className={`inline-block absolute text-center right-1`}>
                  <div className={'text-xs font-bold mt-[5px]'}>{props.data?.end_mhz} MHZ</div>
                </div>
                {hoverText.length > 0 ? <div className={`block text-center text-xs font-bold pt-[5px]`}>{hoverText}</div> : <>&nbsp;</>}
              </div>
            </div>
          </div>
          {props.data && props.data.sdrs.map((radioData, index) =>
            <div className={'table-row'} key={`${radioData.address}-row`}>
              <div className={'table-cell bg-blue-300 font-bold align-middle group relative'}>
                <div className={`inline-block align-middle`}
                  style={{ marginLeft: `${addressMarginPx}px`, marginRight: `${addressMarginPx}px` }}
                  ref={element => handleRef(element, index)}>
                  <div className={'inline-block'}>{radioData.address}</div>
                  <div className={'opacity-20 group-hover:opacity-100 absolute right-[2px] top-[2px] hover:bg-blue-200 pb-[3px] pl-[3px] pr-[3px] rounded-sm cursor-pointer'}>
                    <FontAwesomeIcon icon={faXmark} size="xs" title="Remove Radio" onClick={() => removeRadioClicked(radioData.address)} />
                  </div>
                </div>
              </div>
              <div className={'table-cell'}>
                <Radio
                  data={radioData}
                  key={radioData.address}
                  noiseBlockWidth={noiseBlockWidth}
                  bandwidth_mhz={props.data?.bandwidth_mhz}
                  setHoverText={(t: string) => setHoverText(t)}></Radio>
              </div>
            </div>
          )}
        </div>
        <AddRadio ref={addRadioModalRef} completed={() => { props.changed() }}></AddRadio>
      </div>
    </>
  )
}