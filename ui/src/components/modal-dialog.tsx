import type { ReactElement } from "react"

export type ModalProps = {
    title: string,
    visible: boolean,
    children: ReactElement,
    okEnabled: boolean,
    okClicked: () => void,
    cancelClicked: () => void    
}

export function Modal(props: ModalProps) {
    return <>
        <div className={`${props.visible ? '' : 'hidden '} fixed inset-0 z-[999] grid h-screen w-screen bg-black opacity-60`}></div>
        <div className={`${props.visible ? '' : 'hidden '} fixed inset-0 z-[999] grid h-screen w-screen place-items-center`}>
            <div className="relative m-4 p-4 w-2/5 min-w-[40%] max-w-[40%] rounded-lg bg-white shadow-sm opacity-100">
                <div className="flex shrink-0 items-center pb-4 text-xl font-medium text-slate-800">
                    {props.title}
                </div>
                <div className="relative border-t border-slate-200 py-4 leading-normal text-slate-600 font-light">
                    {props.children}
                </div>
                <div className="flex shrink-0 flex-wrap items-center pt-4 justify-end">
                    <button onClick={props.cancelClicked} className="rounded-md border border-transparent py-2 px-4 text-center text-sm transition-all text-slate-600 hover:bg-slate-100 focus:bg-slate-100 active:bg-slate-100 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none cursor-pointer" type="button">
                        Cancel
                    </button>
                    <button onClick={props.okClicked} disabled={!props.okEnabled} className="rounded-md bg-green-600 py-2 px-4 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-green-700 focus:shadow-none active:bg-green-700 hover:bg-green-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none ml-2  cursor-pointer" type="button">
                        OK
                    </button>
                </div>
            </div>
        </div>        
    </>
}