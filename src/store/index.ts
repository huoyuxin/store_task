import _ from "lodash";
import {IRecord} from "../record";
import {fetchAllFromRemote} from "../../util/store";

export interface IRecordObj {
  [key: string]: IRecord[];
}
export interface ModelMapper {
  [type: string]: IRecord;
}

export class Store {
  // record 缓存
  recordObj: IRecordObj = {};
  // model 存储
  modalObj: ModelMapper = {};

  // 从 store 中匹配单条
  private fetchOneFromStore(type: string, id: string): IRecord | undefined {
    const recordList = this.recordObj[type] || [];
    // r查找 id 相同的记录
    let res: IRecord | undefined = recordList.find(
      (record: IRecord) => record.data.id === id
    );
    return res;
  }

  // 从 store 中匹配多条
  private fetchAllFromStore(type: string, params: Store.Params): IRecord[] {
    const paramKeys = Object.keys(params);
    const recordList = this.recordObj[type] || [];
    // 查找 params 相同的记录
    const res: IRecord[] = recordList.filter((record: IRecord) => {
      let flag = true;
      for (let i = 0; i < paramKeys.length; i++) {
        const key = paramKeys[i];
        if ((record as any)[key] !== params[key]) {
          flag = false;
          break;
        }
      }
      return flag;
    });
    return res;
  }

  // 为 服务端返回数据 创建 本地 映射
  private massCreate(
    type: string,
    res: Store.IResponse[]
  ): {newList: IRecord[]; idObj: {[key: string]: any}} {
    const idObj: {[key: string]: any} = {};
    const newList = res.map((item: Store.IResponse) => {
      idObj[item.id] = true;
      return this.createRecord(type, {data: item, initData: item});
    });
    return {
      newList,
      idObj
    };
  }

  // 更新缓存
  private updateList(
    type: string,
    newList: IRecord[],
    idObj: {[key: string]: boolean}
  ) {
    const allList = [...newList];
    const storeList = this.recordObj[type] || [];
    storeList.forEach((item: IRecord) => {
      // 去重：去掉 store 中 id 相同的元素
      if (idObj[item.data.id]) {
        return;
      }
      allList.push(item);
    });
    this.recordObj[type] = allList;
  }

  /**
   * 创建一个指定类型的 Record2
   * @param type 要创建的记录类型
   * @param attr 新纪录各个字段的值
   */
  createRecord(type: string, attr: any): IRecord {
    const data = {
      // 在 model 基础上
      ..._.cloneDeep(this.modalObj[type].data || {}),
      ...attr.data
    };
    const record = new IRecord({
      type,
      data,
      initData: attr.initData
    });
    return record;
  }
  /**
   * 定义一个记录模型返回一条默认数据（可以理解成创建一个映射后端表的模型,当 createRecord 的 attr 参数不全时补足默认字段，初始化后不可变动）
   * @param type 要创建的类型名称
   * @param attr 记录包含的字段及默认值
   */
  defineModel(type: string, attr: Object): IRecord {
    if (this.modalObj[type]) {
      throw Error("model has been defined, can not edit");
    }
    Object.defineProperty(this.modalObj, type, {
      value: new IRecord({type, data: attr}),
      writable: false
    });
    return this.modalObj[type];
  }

  /**
   * 查询一个符合条件的数据集合（查询缓存，无缓存发起请求，更新缓存）
   * @param type 需要查询的类型名称
   * @param params 查询的记录的条件
   */
  async find(type: string, params: Object): Promise<IRecord[]> {
    const store_res: IRecord[] = await this.fetchAllFromStore(type, params);
    if (store_res.length) {
      return store_res;
    }
    const remote_res = await fetchAllFromRemote(params);
    const {newList, idObj} = this.massCreate(type, remote_res);
    this.updateList(type, newList, idObj);
    return newList;
  }

  /**
   * 根据ID查询一条数据记录（查询缓存，无缓存发起请求，更新缓存）
   * @param type 需要查询的类型名称
   * @param id 查询记录的 ID
   */
  async findRecord(type: string, id: string): Promise<IRecord> {
    const store_res = await this.fetchOneFromStore(type, id);
    if (store_res) {
      return store_res;
    }
    const remote_res: IRecord[] = await fetchAllFromRemote({id});
    const {newList, idObj} = this.massCreate(type, remote_res);
    this.updateList(type, newList, idObj);
    return newList[0];
  }

  /**
   * 查询一个符合条件的数据集合（不查询缓存，获取最新数据并更新缓存）
   * @param type
   * @param id
   */
  async query(type: string, params: Object): Promise<IRecord[]> {
    const remote_res: IRecord[] = await fetchAllFromRemote(params);
    const {newList, idObj} = this.massCreate(type, remote_res);
    this.updateList(type, newList, idObj);
    return newList;
  }

  /**
   * 根据ID查询一条数据记录（不查询缓存，获取最新数据并更新缓存）
   * @param type 需要查询的类型名称
   * @param id 查询记录的 ID
   */
  async queryRecord(type: string, id: string): Promise<IRecord> {
    const remote_res: IRecord[] = await fetchAllFromRemote({id});
    const {newList, idObj} = this.massCreate(type, remote_res);
    this.updateList(type, newList, idObj);
    return newList[0];
  }

  /**
   * 清空所有缓存
   */
  unloadAll(): void {
    this.recordObj = {};
  }
}
