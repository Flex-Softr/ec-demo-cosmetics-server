/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { UserAgent } from "express-useragent";
import { JwtPayload } from "jsonwebtoken";
declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
      useragent: UserAgent;
      anyData: any | any[];
      ecSID: {
        id: string;
        newId: () => void;
      };
      uploadedFolders: Set<string>;
    }
  }
}
