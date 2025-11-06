import { inject, injectable } from "inversify";
import Store from "./Store";
import { Result, Ok, Err, isErr } from "../../../shared/Result";
import { ErrorCode } from "../../../shared/errors";

@injectable()
export default class GameService {
    constructor(@inject("Store") private store: Store) { }
}