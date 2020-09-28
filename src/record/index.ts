import _ from "lodash";

export class IRecord {
  type: string;
  // 本地数据
  data: Store.IResponse;
  // 服务端数据
  initData: any;

  constructor(attr: any) {
    this.type = attr.type;
    this.data = _.cloneDeep(attr.data);
    this.initData = _.cloneDeep(attr.initData);
    Object.defineProperties(this.data, {
      id: {
        value: this.data.id,
        writable: false
      }
    });
  }

  /**
   * 从服务端删除该记录
   */
  destroyRecord(): Promise<any> {
    //   delete
    return new Promise((resolve, reject) => {
      fetch("http://www.ifeng.com/record", {
        method: "delete",
        body: JSON.stringify(this.data)
      })
        .then(res =>
          res.json().then(body => {
            resolve(body);
          })
        )
        .catch(e => {
          console.error("destroyRecord", e);
          reject(e);
        });
    });
  }
  /**
   * 放弃所有未保存的修改
   */
  rollback() {
    // 恢复成服务端的版本
    this.data = _.cloneDeep(this.initData);
  }

  /**
   * 将记录保存或更新到服务端
   */
  save(): Promise<any> {
    return new Promise((resolve, reject) => {
      fetch("http://www.ifeng.com/record", {
        method: this.initData ? "put" : "post",
        body: JSON.stringify(this.data)
      })
        .then(res =>
          res.json().then(body => {
            resolve(body);
          })
        )
        .catch(e => {
          console.error("save", e);
          reject(e);
        });
    });
  }
}
