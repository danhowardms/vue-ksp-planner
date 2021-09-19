import { PropType } from "vue";
import { SlingshotMissionParams } from "../slingshot-porkchop-calculate";
import { Porkchop } from "../porkchop";
declare const _default: import("vue").DefineComponent<{
    mission: {
        type: PropType<SlingshotMissionParams>;
        required: true;
    };
    useWorker: {
        type: BooleanConstructor;
        default: boolean;
    };
}, {
    porkchop: Porkchop;
    xAxis: import("vue").ComputedRef<{
        title: string;
        min: number;
        max: number;
    }>;
    yAxis: import("vue").ComputedRef<{
        title: string;
        min: number;
        max: number;
    }>;
    zAxis: import("vue").ComputedRef<{
        title: string;
        unit: string;
    }>;
    selectedQtyPoint: import("vue").Ref<{
        x: number;
        y: number;
    } | null>;
    updateKey: import("vue").Ref<number>;
    working: import("vue").Ref<boolean>;
    progress: import("vue").Ref<number | null>;
    onPointSelected: (event: {
        qp: {
            x: number;
            y: number;
        };
    }) => void;
}, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, Record<string, any>, string, import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<{
    mission?: unknown;
    useWorker?: unknown;
} & {
    mission: SlingshotMissionParams;
    useWorker: boolean;
} & {}>, {
    useWorker: boolean;
}>;
export default _default;
