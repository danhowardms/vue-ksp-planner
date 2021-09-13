import {CelestialBody, TransferOptions, TransferType, findTransfer} from "../../ts-ksp/lib/index.js";

const WIDTH = 300;
const HEIGHT = 300;

const porkchopCalculate = (mission, progressCallback, deltaVCallback) => {
    const transferType = mission.transferType;
    const originBody = (mission.originBody instanceof  CelestialBody) ? mission.originBody : CelestialBody.fromJSON(mission.originBody);
    const initialOrbitalVelocity = mission.initialOrbitalVelocity;
    const destinationBody = (mission.destinationBody instanceof CelestialBody) ? mission.destinationBody : CelestialBody.fromJSON(mission.destinationBody);
    const finalOrbitalVelocity = mission.finalOrbitalVelocity;
    const earliestDeparture = mission.earliestDeparture;
    const shortestTimeOfFlight = mission.shortestTimeOfFlight;
    const xResolution = mission.xScale / WIDTH;
    const yResolution = mission.yScale / HEIGHT;
    const originOrbit = originBody.orbit;
    const destinationOrbit = destinationBody.orbit;
    const n1 = originOrbit.normalVector();
    const originPositions = [];
    const originVelocities = [];

    // Pre-calculate origin positions and velocities
    for (let x = 0; x <= WIDTH; x++) {
        const departureTime = earliestDeparture + x * xResolution;
        const trueAnomaly = originOrbit.trueAnomalyAt(departureTime);
        originPositions[x] = originOrbit.positionAtTrueAnomaly(trueAnomaly);
        originVelocities[x] = originOrbit.velocityAtTrueAnomaly(trueAnomaly);
    }

    const iterateTransfers = (fn) => {
        let i = 0;
        for (let y = 0; y < HEIGHT; y++) {
            const timeOfFlight = shortestTimeOfFlight + ((HEIGHT - 1) - y) * yResolution;
            for (let x = 0; x < WIDTH; x++) {
                const departureTime = earliestDeparture + x * xResolution;
                const arrivalTime = departureTime + timeOfFlight;
                fn(i, y, x, timeOfFlight, departureTime, arrivalTime);
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

    iterateTransfers((i, y, x, timeOfFlight, departureTime, arrivalTime) => {
        const p1 = originPositions[x];
        const v1 = originVelocities[x];
        const trueAnomaly = destinationOrbit.trueAnomalyAt(arrivalTime);
        const p2 = destinationOrbit.positionAtTrueAnomaly(trueAnomaly);
        const v2 = destinationOrbit.velocityAtTrueAnomaly(trueAnomaly);
        const opts = new TransferOptions(originBody, destinationBody, departureTime, timeOfFlight, initialOrbitalVelocity, finalOrbitalVelocity, p1, v1, n1, p2, v2);
        const transfer = findTransfer(transferType, opts);
        const deltaV = transfer.deltaV;
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
            const now = Date.now();
            if (now - lastProgress > 100) {
                progressCallback((y + 1) / HEIGHT);
                lastProgress = now;
            }
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

export {porkchopCalculate};