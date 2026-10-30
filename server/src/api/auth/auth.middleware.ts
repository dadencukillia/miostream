import { FastifyReply, FastifyRequest } from "fastify";
import "../../context";

export class AuthInfo {
  private _userId: string;
  private _nickname: string;
  private _fullName: string;
  private _avatarUrl: string;

  public constructor(userId: string, nickname: string, fullName: string, avatarUrl: string) {
    this._userId = userId.trim().toLowerCase();
    this._nickname = nickname.trim();
    this._fullName = fullName.trim();
    this._avatarUrl = avatarUrl.trim();
  }

  public get userId(): string {
    return this._userId;
  }

  public get nickname(): string {
    return this._nickname;
  }

  public get fullName(): string {
    return this._fullName;
  }

  public get avatarUrl(): string {
    return this._avatarUrl;
  }

  public updateUserData() {
    // TODO: update nickname, fullName, avatarUrl fields according
    // to the database's state
  }
};

export function authMiddleware(req: FastifyRequest, _resp: FastifyReply, done: () => void) {
  // TODO: replace onto the real auth operations
  req.auth = new AuthInfo("00000000-0000-0000-0000-000000000000", "exampleUser", "Jack Jackson", "https://i.pravatar.cc/256");

  done();
}
