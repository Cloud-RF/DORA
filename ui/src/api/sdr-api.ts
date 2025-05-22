import type { SDRData, Radio, FrequencyRange } from "./radio-data";

export const urlBase = "http://10.0.0.31:8080";

export async function fetchData() {
    return new Promise<SDRData>(async (resolve, reject) => {
        try {
            fetch(`${urlBase}/data`, {
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
            fetch(`${urlBase}/node/add`, {
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
            fetch(`${urlBase}/node/remove`, {
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
            fetch(`${urlBase}/tasking`, {
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