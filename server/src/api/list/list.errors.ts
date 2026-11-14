import { ErrorsSet } from "@utils/errorsCollection";

export const ListErrors = new ErrorsSet("list", {
	"list-not-found": [404, "list unit not found"],
	"list-already-exists": [409, "list unit already exists"],
	"list-invalid": [400, "invalid list unit data"],
});
