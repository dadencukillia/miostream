import { generateTransformer } from "@lib/modelTransformer";
import { Plain } from "./types";

// Ok Status Transformation

export interface TransformOkInput { }

export interface TransformOkOutput {
    ok: true;
}

export const transformOk = generateTransformer({
    delete: [],
    map: (_data: Plain<TransformOkInput>): Plain<TransformOkOutput> => ({
        ok: true,
    }),
});
