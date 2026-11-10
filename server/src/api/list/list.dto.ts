import Type from "typebox";
import {
	CreateListUnitRequestPayload,
	ListUnitResponse,
} from "./list.schema";

export type CreateListUnitRequestPayloadType = Type.Static<typeof CreateListUnitRequestPayload>;
export type ListUnitResponseType = Type.Static<typeof ListUnitResponse>;