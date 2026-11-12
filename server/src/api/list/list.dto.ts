import Type from "typebox";
import {
	CreateListUnitRequestPayload,
	ListUnitResponse,
	UpdateListUnitRequestPayload,
} from "./list.schema";

export type CreateListUnitRequestPayloadType = Type.Static<typeof CreateListUnitRequestPayload>;
export type UpdateListUnitRequestPayloadType = Type.Static<typeof UpdateListUnitRequestPayload>;
export type ListUnitResponseType = Type.Static<typeof ListUnitResponse>;