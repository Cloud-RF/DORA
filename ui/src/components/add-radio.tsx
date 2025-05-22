import { Component, type ReactElement } from "react";
import { Modal } from './modal-dialog';
import { addRadio } from './../api/sdr-api';

export type AddRadioProps = {
    completed: () => void
}

export type AddRadioState = {
    visible: boolean,
    address: string,
    latitude: string,
    longitude: string,
    hasvalidationErrors: boolean
    validationErrors: ReactElement
}

export class AddRadio extends Component<AddRadioProps, AddRadioState> {

    constructor(props: AddRadioProps) {
        super(props);
        this.state ={
            visible: false,
            address: "",
            latitude: "",
            longitude: "",
            hasvalidationErrors: false,
            validationErrors: <></>
        }
    }

    clonseState() {
        return {
            visible: this.state.visible,
            address: this.state.address,
            latitude: this.state.latitude,
            longitude: this.state.longitude,
            hasvalidationErrors: this.state.hasvalidationErrors,
            validationErrors: this.state.validationErrors
        } as AddRadioState
    }

    updateState(update: (state: AddRadioState) => void) {
        let cloned = this.clonseState();
        update(cloned);
        this.state = cloned;
        this.setState(cloned)
    }

    show() { 
        this.updateState(state => { 
            state.visible = true;
            state.address = "";
            state.latitude = "";
            state.longitude = "";
            state.hasvalidationErrors = false;
            state.validationErrors = <></>
        }) 
    }

    hide() { this.updateState(state => { state.visible = false }) }

    addressChanged(e: any) { 
        this.updateState(state => { state.address = e.target.value }) 
        if (this.state.hasvalidationErrors) { this.validate() }
    }

    latitudeChanged(e: any) { 
        this.updateState(state => { state.latitude = e.target.value });
        if (this.state.hasvalidationErrors) { this.validate() }
    }

    longitudeChanged(e: any) { 
        this.updateState(state => { state.longitude = e.target.value });
        if (this.state.hasvalidationErrors) { this.validate() }
    }

    okClicked() { if (this.validate()) { this.addRadio() } }

    isValidURL(url: string) {
        const urlRegex = /^(https?:\/\/)?((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(:[0-9]{1,5})?(\/.*)?$|^((https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})(:[0-9]{1,5})?(\/.*)?)$/i;
        return urlRegex.test(url);
    }

    validate() {
        let errors = [];
        let latitude = parseFloat(this.state.latitude);
        let longitude = parseFloat(this.state.longitude);

        if (this.state.address.trim().length == 0) { errors.push(`* Address is required`) }
        else if (!this.isValidURL(this.state.address)) { errors.push(`* Address should be a valid URL`) }

        if (this.state.latitude.trim().length == 0) { errors.push(`* Latitude is required`) }
        else if (isNaN(latitude)) { errors.push(`* Latitude is not a vallid number`) }
        else if (latitude < -90 || latitude > 90) { errors.push(`* Latitude should be between -90 and 90`) }

        if (this.state.longitude.trim().length == 0) { errors.push(`* Longitude is required`) }
        else if (isNaN(longitude)) { errors.push(`* Longitude is not a vallid number`) }
        else if (longitude < -180 || longitude > 180) { errors.push(`* Longitude should be between -90 and 90`) }

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

    addRadio() {
        addRadio({
            address: this.state.address,
            lalitude: Number(this.state.latitude),
            longitude: Number(this.state.longitude)
        }).then(() => { 
            this.hide()
            this.props.completed() 
        })
    }

    render() {
        return <>
            <Modal visible={this.state.visible} title='Add Radio' okClicked={() => { this.okClicked() }} cancelClicked={() => { this.hide() }} okEnabled={!this.state.hasvalidationErrors}>
                <div className={`relative items-center w-full`}>
                    <div className={`table  ml-8`}>
                        <div className={`table-row`}>
                            <div className={`table-cell`}>
                                <div className={`inline-block font-bold mr-3`}>Address:</div>
                            </div>
                            <div className={`table-cell`}>
                                <input type="text" onChange={e => this.addressChanged(e)} id="start" value={this.state.address} className="bg-gray-50 border border-gray-300 text-gray-900 rounded-xs focus:ring-blue-500 focus:border-blue-500 w-[250px] text-right pr-1 mb-1 mr-1" />
                            </div>
                            <div className={`table-cell`}>
                            </div>
                        </div>
                        <div className={`table-row`}>
                            <div className={`table-cell`}>
                                <div className={`inline-block font-bold mr-3`}>Latitude:</div>
                            </div>
                            <div className={`table-cell`}>
                                <input type="text" onChange={e => this.latitudeChanged(e)} id="end" value={this.state.latitude} className="bg-gray-50 border border-gray-300 text-gray-900 rounded-xs focus:ring-blue-500 focus:border-blue-500 w-[250px] text-right pr-1 mb-1 mr-1" />
                            </div>
                            <div className={`table-cell`}>
                                <div className={`inline-block font-medium mr`}>°</div>
                            </div>
                        </div>
                        <div className={`table-row`}>
                            <div className={`table-cell`}>
                                <div className={`inline-block font-bold mr-3`}>Longitude:</div>
                            </div>
                            <div className={`table-cell`}>
                                <input type="text" onChange={e => this.longitudeChanged(e)} id="bandwidth" value={this.state.longitude} className="bg-gray-50 border border-gray-300 text-gray-900 rounded-xs focus:ring-blue-500 focus:border-blue-500 w-[250px] text-right pr-1 mb-1 mr-1" />
                            </div>
                            <div className={`table-cell`}>
                                <div className={`inline-block font-medium mr`}>°</div>
                            </div>
                        </div>                        
                    </div>
                    {!this.state.hasvalidationErrors ? <></> : <div className={`ml-8 mt-2`}>{this.state.validationErrors}</div>}
                    
                </div>
            </Modal>
        </>
    }
}