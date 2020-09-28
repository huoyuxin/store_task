import {IRecord} from "../src/record";

declare namespace Store {
  export interface Params {
    // todo: 细化
    [key: string]: any;
  }
  export interface IResponse {
    [key: string]: any;
  }
}
