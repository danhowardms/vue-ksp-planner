import {
    CelestialBody,
    findSlingshotRoute,
    angleBetween
} from "../../ts-ksp/lib/index.js";

const WIDTH = 300;
const HEIGHT = 300;

const slingshotPorkchopCalculate = (mission, progressCallback, deltaVCallback) => {

    const originBody = (mission.originBody instanceof  CelestialBody) ? mission.originBody : CelestialBody.fromJSON(mission.originBody);
    const initialOrbitalVelocity = mission.initialOrbitalVelocity;
    const slingshotBody = mission.slingshotBody;
    const destinationBody = (mission.destinationBody instanceof CelestialBody) ? mission.destinationBody : CelestialBody.fromJSON(mission.destinationBody);
    const finalOrbitalVelocity = mission.finalOrbitalVelocity;
    const earliestDeparture = mission.earliestDeparture;
    const shortestTimeOfFlight = mission.shortestTimeOfFlight;
    const xResolution = mission.xScale / WIDTH;
    const yResolution = mission.yScale / HEIGHT;

    const iterateJourneys = (fn) => {
        let i = 0;
        for (let y = 0; y < HEIGHT; y++) {
            const timeOfFlight = shortestTimeOfFlight + ((HEIGHT - 1) - y) * yResolution;
            for (let x = 0; x < WIDTH; x++) {
                const departureTime = earliestDeparture + x * xResolution;
                fn(i, y, x, timeOfFlight, departureTime);
                i++;
            }
        }
    };

    const deltaVs = new Float64Array(WIDTH * HEIGHT);
    let minDeltaV = Infinity;
    let maxDeltaV = 0;
    let sumLogDeltaV = 0;
    let sumSqLogDeltaV = 0;
    let deltaVCount = 0;
    let lastProgress = 0;
    let minDeltaVPoint = null;

    iterateJourneys((i, y, x, timeOfFlight, departureTime) => {
        //console.log(i);
        const opts = {
            startTime: departureTime,
            originBody: originBody,
            slingshotBody: slingshotBody,
            destinationBody: destinationBody,
            totalDuration: timeOfFlight,
            originOrbitalSpeed: initialOrbitalVelocity,
            destinationOrbitalSpeed: finalOrbitalVelocity,
        };
        const slingshot = findSlingshotRoute(opts);
        let deltaV;
        try {
            deltaV = slingshot.totalDeltaV;
            // deltaV = slingshot.deltaVMan;
            // deltaV = angleBetween(slingshot.vT1EndSs, slingshot.vT2StartSs);
        } catch (e) {
            deltaV = NaN;
        }
        deltaVs[i] = deltaV;
        if (deltaV < minDeltaV) {
            minDeltaV = deltaV;
            minDeltaVPoint = {x: x, y: (HEIGHT - 1) - y};
        }
        if (deltaV > maxDeltaV) {
            maxDeltaV = deltaV;
        }
        if (! isNaN(deltaV)) {
            const logDeltaV = Math.log(deltaV);
            sumLogDeltaV += logDeltaV;
            sumSqLogDeltaV += logDeltaV * logDeltaV;
            deltaVCount++;
        }

        if (x === 0) {
            console.log(i);
        }
        const now = Date.now();
        if (now - lastProgress > 100) {
            progressCallback((y + 1) / HEIGHT);
            lastProgress = now;
        }
    });

    deltaVCallback({
        deltaVs: deltaVs,
        minDeltaV: minDeltaV,
        minDeltaVPoint: minDeltaVPoint,
        maxDeltaV: maxDeltaV,
        deltaVCount: deltaVCount,
        sumLogDeltaV: sumLogDeltaV,
        sumSqLogDeltaV: sumSqLogDeltaV
    });

};

export {slingshotPorkchopCalculate};