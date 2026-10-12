export class ConflictError extends Error { constructor() { super("다른 사람이 먼저 수정했습니다. 최신 내용으로 다시 불러왔어요."); this.name = "ConflictError"; } }
export class NotFoundError extends Error { constructor(what: string) { super(`${what}을(를) 찾을 수 없습니다.`); this.name = "NotFoundError"; } }
