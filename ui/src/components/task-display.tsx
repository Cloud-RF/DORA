import { useRef } from "react";
import { TaskingDialog } from './tasking-dialog';
import type { FrequencyRange } from './../api/radio-data';

export type TaskDisplayProp = {
  frequencyRange: FrequencyRange,
  changed: (frequencyRange: FrequencyRange) => void
}

export function TaskDisplay(props: TaskDisplayProp) {
  let taskingDialog = useRef<TaskingDialog>(null);

  function showModal() { if (taskingDialog.current) { taskingDialog.current.show() } }

  return (
    <>
      <div>
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
        <TaskingDialog ref={taskingDialog} frequencyRange={props.frequencyRange} completed={frequencyRange => { props.changed(frequencyRange) }}></TaskingDialog>
      </div>
    </>
  )
}