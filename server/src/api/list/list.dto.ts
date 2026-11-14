import Type from "typebox";
import {
	CreateListUnitRequestPayload,
	GetListUnitsRequestQueries,
	ListUnitResponse,
	ListUnitWithAnimeResponse,
	ListUnitsPageResponse,
	UpdateListUnitRequestPayload,
} from "./list.schema";

export type CreateListUnitRequestPayloadType = Type.Static<typeof CreateListUnitRequestPayload>;
export type UpdateListUnitRequestPayloadType = Type.Static<typeof UpdateListUnitRequestPayload>;
export type ListUnitResponseType = Type.Static<typeof ListUnitResponse>;
export type GetListUnitsRequestQueriesType = Type.Static<typeof GetListUnitsRequestQueries>;
export type ListUnitWithAnimeResponseType = Type.Static<typeof ListUnitWithAnimeResponse>;
export type ListUnitsPageResponseType = Type.Static<typeof ListUnitsPageResponse>;