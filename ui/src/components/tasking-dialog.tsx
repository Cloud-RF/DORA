import { Component, type ReactElement } from "react";
import { Modal } from './modal-dialog';
import { tasking } from './../api/sdr-api';
import type { FrequencyRange } from './../api/radio-data';

export type TaskingDialogProps = {
    frequencyRange: FrequencyRange,
    completed: (frequencyRange: FrequencyRange) => void
}

export type TaskingDialogState = {
    visible: boolean,
    startMHz: string,
    endMHz: string,
    bandwidthMHz: string,
    hasvalidationErrors: boolean
    validationErrors: ReactElement
}

export class TaskingDialog extends Component<TaskingDialogProps, TaskingDialogState> {

    constructor(props: TaskingDialogProps) {
        super(props);
        this.state = {
            visible: false,
            startMHz: String(this.props.frequencyRange.startMhz),
            endMHz: String(this.props.frequencyRange.endMhz),
            bandwidthMHz: String(this.props.frequencyRange.bandwidthMhz),
            hasvalidationErrors: false,
            validationErrors: <></>
        }
    }

    clonseState() {
        return {
            visible: this.state.visible,
            startMHz: this.state.startMHz,
            endMHz: this.state.endMHz,
            bandwidthMHz: this.state.bandwidthMHz,
            hasvalidationErrors: this.state.hasvalidationErrors,
            validationErrors: this.state.validationErrors
        } as TaskingDialogState
    }

    updateState(update: (state: TaskingDialogState) => void) {
        let cloned = this.clonseState();
        update(cloned);
        this.state = cloned;
        this.setState(cloned)
    }

    show() {
        this.updateState(state => {
            state.visible = true;
            state.startMHz = String(this.props.frequencyRange.startMhz);
            state.endMHz = String(this.props.frequencyRange.endMhz);
            state.bandwidthMHz = String(this.props.frequencyRange.bandwidthMhz);
            state.hasvalidationErrors = false;
            state.validationErrors = <></>
        })
    }

    hide() { this.updateState(state => { state.visible = false }) }

    startChanged(e: any) {
        this.updateState(state => { state.startMHz = e.target.value });
        if (this.state.hasvalidationErrors) { this.validate() }
    }

    endChanged(e: any) {
        this.updateState(state => { state.endMHz = e.target.value });
        if (this.state.hasvalidationErrors) { this.validate() }
    }

    bandwidthChanged(e: any) {
        this.updateState(state => { state.bandwidthMHz = e.target.value });
        if (this.state.hasvalidationErrors) { this.validate() }
    }

    configureTask() {
        let frequencyRange = {
            startMhz: Number(this.state.startMHz),
            endMhz: Number(this.state.endMHz),
            bandwidthMhz: Number(this.state.bandwidthMHz)
        } as FrequencyRange;
        tasking(frequencyRange).then(() => { 
            this.updateState(state => { state.visible = false });
            this.props.completed(frequencyRange)
        })
    }

    okClicked() { if (this.validate()) { this.configureTask() } }

    validate() {
        let errors = [];
        let startMHz = parseFloat(this.state.startMHz);
        let endMHz = parseFloat(this.state.endMHz);
        let bandwidthMHz = parseFloat(this.state.bandwidthMHz);

        if (this.state.startMHz.trim().length == 0) { errors.push(`* Start is required`) }
        else if (isNaN(startMHz)) { errors.push(`* Start is not a vallid number`) }
        else if (startMHz < 1 || startMHz > 2000) { errors.push(`* Start should be between 1 and 2000`) }

        if (this.state.endMHz.trim().length == 0) { errors.push(`* End is required`) }
        else if (isNaN(endMHz)) { errors.push(`* End is not a vallid number`) }
        else if (endMHz < 1 || endMHz > 2000) { errors.push(`* End should be between 1 and 2000`) }
        
        if (this.state.bandwidthMHz.trim().length == 0) { errors.push(`* Bandwidth is required`) }
        else if (isNaN(bandwidthMHz)) { errors.push(`* Bandwidth is not a vallid number`) }
        else if (bandwidthMHz < 1 || bandwidthMHz > 20) { errors.push(`* Bandwidth should be between 1 and 20`) }
        
        if (errors.length > 0) {
            this.updateState(state => {
                state.hasvalidationErrors = true;
                state.validationErrors = <div>{errors.map(error => <div className={`block font-bold text-red-500`}>{error}</div>)}</div>
            })
        } else {
            this.updateState(state => {
                state.hasvalidationErrors = false;
                state.validationErrors = <></>
            })
        }

        return errors.length == 0
    }

    render() {
        return <>
            <Modal visible={this.state.visible} title='Configure Task' okClicked={() => { this.okClicked() }} cancelClicked={() => { this.updateState(state => { state.visible = false }) }} okEnabled={!this.state.hasvalidationErrors}>
                <div className={`relative items-center w-full`}>
                    <div className={`table  ml-18`}>
                        <div className={`table-row`}>
                            <div className={`table-cell`}>
                                <div className={`inline-block font-bold mr-3`}>Start:</div>
                            </div>
                            <div className={`table-cell`}>
                                <input type="text" onChange={e => this.startChanged(e)} id="start" value={this.state.startMHz} className="bg-gray-50 border border-gray-300 text-gray-900 rounded-xs focus:ring-blue-500 focus:border-blue-500 w-[50px] text-right pr-1 mb-1 mr-1" />
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
                                <input type="text" onChange={e => this.endChanged(e)} id="end" value={this.state.endMHz} className="bg-gray-50 border border-gray-300 text-gray-900 rounded-xs focus:ring-blue-500 focus:border-blue-500 w-[50px] text-right pr-1 mb-1 mr-1" />
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
                                <input type="text" onChange={e => this.bandwidthChanged(e)} id="bandwidth" value={this.state.bandwidthMHz} className="bg-gray-50 border border-gray-300 text-gray-900 rounded-xs focus:ring-blue-500 focus:border-blue-500 w-[50px] text-right pr-1 mb-1 mr-1" />
                            </div>
                            <div className={`table-cell`}>
                                <div className={`inline-block font-medium mr`}>MHz</div>
                            </div>
                        </div>
                    </div>
                    {!this.state.hasvalidationErrors ? <></> : <div className={`ml-8 mt-2`}>{this.state.validationErrors}</div>}
                </div>
            </Modal>
        </>
    }
}