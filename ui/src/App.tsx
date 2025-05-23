import './App.css'
import { useEffect, useState } from 'react';
import { TaskDisplay } from "./components/task-display";
import { Timeline } from "./components/timeline";
import { RadioList } from "./components/radio-list";
import { fetchData } from "./api/sdr-api";
import type { FrequencyRange, SDRData } from './api/radio-data';

function App() {
  const REFRESH_MS = 5000;
  let [initialFetchRequested, setInitialFetchRequested] = useState(false);
  let [data, setData] = useState<SDRData | null>(null);
  let [frequencyRange, setFrequencyRange] = useState<FrequencyRange>({ startMhz: 0, endMhz: 0, bandwidthMhz: 0 });

  function fetchRadioData() {
    fetchData().then(fetchedData => {
      data = fetchedData;
      setData(data);
      frequencyRange.startMhz = data.start_mhz;
      frequencyRange.endMhz = data.end_mhz;
      frequencyRange.bandwidthMhz = data.bandwidth_mhz;
      setFrequencyRange(frequencyRange)
    })
  }

  useEffect(() => {
    if (!initialFetchRequested) {
      initialFetchRequested = true;
      setInitialFetchRequested(true);
      fetchRadioData();
    }
  });

  useEffect(() => {
    const intervalId = setInterval(() => { fetchRadioData() }, REFRESH_MS);
    return () => clearInterval(intervalId);
  }, []);

  function frequencyRangeChanged(freqRange: FrequencyRange) { setFrequencyRange(freqRange) }

  function radioListChanged() { fetchRadioData() }

  return (
    <>
      <div className={`m-3 relative overflow-hidden`}>
        <div className={'w-full mb-1 rounded-md p-2 text-center'}>
          <img src='/cloudrf.png' className={`inline-block w-[50px] h-[50px] mr-1`}></img>
          <div className={`inline-block font-bold text-lg top-0.5 relative`}>SDR Noise Data Collector</div>
        </div>
        <TaskDisplay frequencyRange={frequencyRange} changed={frequencyRangeChanged}></TaskDisplay>
        <Timeline></Timeline>
        {data && <RadioList data={data} changed={radioListChanged}></RadioList>}
      </div>
    </>
  )
}

export default App