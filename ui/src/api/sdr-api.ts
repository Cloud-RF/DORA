import type { SDRData, Radio, FrequencyRange } from "./radio-data";

export async function fetchData() {
    return new Promise<SDRData>(async (resolve, reject) => {
        try {
            fetch(`${import.meta.env.VITE_API_URL_BASE}/data`, {
                method: 'GET',
                mode: 'cors'
            })
                .then(async response => response.json())
                .then(json => { resolve(json as SDRData) })
                .catch(error => {
                    console.error(error);
                    reject(error)
                })
        } catch (e) { reject(e) }
    })
}

export async function addRadio(radio: Radio) {
    return new Promise<void>(async (resolve, reject) => {
        try {
            fetch(`${import.meta.env.VITE_API_URL_BASE}/node/add`, {
                method: 'POST',
                mode: 'cors',
                // headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(radio)
            })
                .then(() => { resolve() })
                .catch(error => {
                    console.error(error);
                    reject(error)
                })
        } catch (e) { reject(e) }
    })
}

export async function removeRadio(address: string) {
    return new Promise<void>(async (resolve, reject) => {
        try {
            fetch(`${import.meta.env.VITE_API_URL_BASE}/node/remove`, {
                method: 'POST',
                mode: 'cors',
                // headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address })
            })
                .then(() => { resolve() })
                .catch(error => {
                    console.error(error);
                    reject(error)
                })
        } catch (e) { reject(e) }
    })
}

export async function tasking(frequencyRange: FrequencyRange) {
    return new Promise<void>(async (resolve, reject) => {
        try {
            fetch(`${import.meta.env.VITE_API_URL_BASE}/tasking`, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    start_mhz: frequencyRange.startMhz,
                    end_mhz: frequencyRange.endMhz,
                    bandwidth_mhz: frequencyRange.bandwidthMhz
                })
            })
                .then(() => { resolve() })
                .catch(error => {
                    console.error(error);
                    reject(error)
                })
        } catch (e) { reject(e) }
    })
}
