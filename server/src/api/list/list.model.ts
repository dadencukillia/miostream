import { generateTransformer } from "@lib/modelTransformer";
import type { LIST_UNIT_STATUSES } from "./list.schema";

export type ListUnitStatus = (typeof LIST_UNIT_STATUSES)[number];

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseListUnitDate(value: string): Date {
	const match = DATE_RE.exec(value);
	if (!match) return new Date(Number.NaN);
	return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function toDateString(value: Date): string {
	const month = String(value.getMonth() + 1).padStart(2, "0");
	const day = String(value.getDate()).padStart(2, "0");
	return `${value.getFullYear()}-${month}-${day}`;
}

const toCoverUrl = (_coverId: string | null): string => {
	// Cover URL resolution is not available yet.
	return "";
};

export type ListUnitTransformInput = {
	startedWatching: Date;
	listUnitStatus: string;
};

export const toListUnitModel = generateTransformer({
	map: (row: ListUnitTransformInput) => ({
		startedWatching: toDateString(row.startedWatching),
		listUnitStatus: row.listUnitStatus as ListUnitStatus,
	}),
});

export type ListUnitWithAnimeTransformInput = ListUnitTransformInput & {
	coverId: string | null;
};

export const toListUnitWithAnimeModel = generateTransformer({
	delete: ["coverId"],
	map: (row: ListUnitWithAnimeTransformInput) => ({
		coverUrl: toCoverUrl(row.coverId),
		startedWatching: toDateString(row.startedWatching),
		listUnitStatus: row.listUnitStatus as ListUnitStatus,
	}),
});
