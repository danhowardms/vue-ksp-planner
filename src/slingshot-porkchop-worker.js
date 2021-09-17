import {slingshotPorkchopCalculate} from "./slingshot-porkchop-calculate";

self.onmessage = function(event) {
    slingshotPorkchopCalculate(event.data, (progress) => {
        self.postMessage({progress});
    }, (result) => {
        const delvaVs = new ArrayBuffer(result.deltaVs.buffer.byteLength);
        new Uint8Array(delvaVs).set(new Uint8Array(result.deltaVs.buffer));
        self.postMessage({
            deltaVs: delvaVs,
            minDeltaV: result.minDeltaV,
            minDeltaVPoint: result.minDeltaVPoint,
            maxDeltaV: result.maxDeltaV,
            deltaVCount: result.deltaVCount,
            sumLogDeltaV: result.sumLogDeltaV,
            sumSqLogDeltaV: result.sumSqLogDeltaV,
        }, [delvaVs]);
    });
};
