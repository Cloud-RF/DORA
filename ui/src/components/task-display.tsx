import { useState } from "react";
import { Modal } from './modal-dialog';
import { tasking } from './../api/sdr-api';
import type { FrequencyRange } from './../api/radio-data';

export type TaskDisplayProp = {
  frequencyRange: FrequencyRange,
  changed: (frequencyRange: FrequencyRange) => void
}

export function TaskDisplay(props: TaskDisplayProp) {
  let [modalVisible, setModalVisible] = useState(false);
  let [startMHz, setStartMHz] = useState<number>(0);
  let [endMHz, setEndMHz] = useState<number>(0);
  let [bandwidthMHz, setBandwidthMHz] = useState<number>(0);

  function showModal() { 
    startMHz = props.frequencyRange.startMhz;
    endMHz = props.frequencyRange.endMhz;
    bandwidthMHz = props.frequencyRange.bandwidthMhz;
    setStartMHz(startMHz);
    setEndMHz(endMHz);
    setBandwidthMHz(bandwidthMHz);
    setModalVisible(true)
  }

  function startChanged(e: any) {
    startMHz = e.target.value;
    setStartMHz(startMHz)
  }

  function endChanged(e: any) {
    endMHz = e.target.value;
    setEndMHz(endMHz)
  }

  function bandwidthChanged(e: any) {
    bandwidthMHz = e.target.value;
    setBandwidthMHz(bandwidthMHz)
  }

  function configureTask() {
    tasking({
      startMhz: startMHz,
      endMhz: endMHz,
      bandwidthMhz: bandwidthMHz
    }).then(() => { setModalVisible(false) })    
  }

  return (
    <>
      <div className={'w-full bg-blue-300 mb-3 rounded-md p-2 cursor-pointer hover:bg-blue-400'} title="Click to configure task" onClick={showModal}>
        <div className={`inline-block font-bold mr-1 float-left mt-2 pl-1`}>TASK</div>
        <div className={'w-full text-center'}>
          <div className={`inline-block rounded-md pt-2 pb-2 pl-4 pr-4`}>
            <div className={`inline-block font-bold mr-1`}>{props.frequencyRange.startMhz}</div>
            <div className={`inline-block font-medium mr-1`}>MHz</div>
            <div className={`inline-block font-medium mr-1`}>to</div>
            <div className={`inline-block font-bold mr-1`}>{props.frequencyRange.endMhz}</div>
            <div className={`inline-block font-medium mr-1`}>MHz, bandwidth: </div>
            <div className={`inline-block font-bold mr-1`}>{props.frequencyRange.bandwidthMhz}</div>
            <div className={`inline-block font-medium`}>MHz</div>
          </div>
        </div>
      </div>
      <Modal visible={modalVisible} title='Configure Task' okClicked={() => { configureTask() }} cancelClicked={() => { setModalVisible(false) }} okEnabled={true}>
        <div className={`relative items-center w-full`}>
          <div className={`table  ml-18`}>
            <div className={`table-row`}>
              <div className={`table-cell`}>
                <div className={`inline-block font-bold mr-3`}>Start:</div>
              </div>
              <div className={`table-cell`}>
                 <input type="text" onChange={startChanged} id="start" value={startMHz} className="bg-gray-50 border border-gray-300 text-gray-900 rounded-xs focus:ring-blue-500 focus:border-blue-500 w-[50px] text-right pr-1 mb-1 mr-1" />
              </div>
              <div className={`table-cell`}>
                <div className={`inline-block font-medium mr`}>MHz</div>
              </div>
            </div>
            <div className={`table-row`}>
              <div className={`table-cell`}>
                <div className={`inline-block font-bold mr-3`}>End:</div>
              </div>
              <div className={`table-cell`}>
                <input type="text" onChange={endChanged} id="end" value={endMHz} className="bg-gray-50 border border-gray-300 text-gray-900 rounded-xs focus:ring-blue-500 focus:border-blue-500 w-[50px] text-right pr-1 mb-1 mr-1" />
              </div>
              <div className={`table-cell`}>
                <div className={`inline-block font-medium mr`}>MHz</div>
              </div>
            </div>
            <div className={`table-row`}>
              <div className={`table-cell`}>
                <div className={`inline-block font-bold mr-3`}>Bandwidth:</div>
              </div>
              <div className={`table-cell`}>
                <input type="text" onChange={bandwidthChanged} id="bandwidth" value={bandwidthMHz} className="bg-gray-50 border border-gray-300 text-gray-900 rounded-xs focus:ring-blue-500 focus:border-blue-500 w-[50px] text-right pr-1 mb-1 mr-1" />
              </div>
              <div className={`table-cell`}>
                <div className={`inline-block font-medium mr`}>MHz</div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}