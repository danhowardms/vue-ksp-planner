import {porkchopCalculate} from "./porkchop-calculate";

self.onmessage = function(event) {
    porkchopCalculate(event.data, (progress) => {
        self.postMessage({progress});
    }, (result) => {
        try {
            // Try to use transferable objects first to save about 1 MB memcpy
            self.postMessage({
                deltaVs: result.deltaVs.buffer,
                minDeltaV: result.minDeltaV,
                minDeltaVPoint: result.minDeltaVPoint,
                maxDeltaV: result.maxDeltaV,
                deltaVCount: result.deltaVCount,
                sumLogDeltaV: result.sumLogDeltaV,
                sumSqLogDeltaV: result.sumSqLogDeltaV,
            }, [result.deltaVs.buffer]);
        } catch (error) {
            self.postMessage({
                deltaVs: result.deltaVs,
                minDeltaV: minDeltaV,
                minDeltaVPoint: result.minDeltaVPoint,
                maxDeltaV: result.maxDeltaV,
                deltaVCount: result.deltaVCount,
                sumLogDeltaV: result.sumLogDeltaV,
                sumSqLogDeltaV: result.sumSqLogDeltaV,
            });
        }
    });
};
