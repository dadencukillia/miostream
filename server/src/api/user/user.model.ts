import { generateTransformer } from "@utils/modelTransformer";

export const toPublicUserModel = generateTransformer({
    delete: ["email"],
    map: (_user: { email: string }) => ({}),
});

export const toUserWithoutOldAvatarModel = generateTransformer({
    delete: ["oldAvatarId"],
    map: (_row: { oldAvatarId: string | null }) => ({}),
});