export type SDRData = {
    start_mhz: number,
    end_mhz: number,
    bandwidth_mhz: number,
    sdrs: Array<RadioData>
}

export type FrequencyNoise = {
    frequency: number,
    noise: number
}

export type RadioData = {
    address: string,
    latitude: number,
    longitude: number,
    datetime: string,
    data: Array<FrequencyNoise>
}

export type FrequencyRange = {
    startMhz: number,
    endMhz: number,
    bandwidthMhz: number
}

export type Radio = {
    address: string,
    lalitude: number,
    longitude: number
}