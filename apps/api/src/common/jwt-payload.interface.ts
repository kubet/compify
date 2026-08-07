export interface JwtPayload {
  id: string;
  plan: string;
  sessionVersion: number;
  valid?: boolean;
}
