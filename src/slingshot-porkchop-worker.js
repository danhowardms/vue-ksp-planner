import {slingshotPorkchopCalculate} from "./slingshot-porkchop-calculate";

self.onmessage = function(event) {
    slingshotPorkchopCalculate(event.data, (progress) => {
        self.postMessage({progress});
    }, (values) => {
        self.postMessage({values});
    });
};
