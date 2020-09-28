import {IRecord} from "../src/record";
import {Store} from "../src/store";
import fetch from "jest-fetch-mock";

// 对表 event 进行 增、删、查、改操作。
describe("store test", () => {
  let myRecord: IRecord;
  // 创建一个 Store
  const store = new Store();

  beforeEach(() => {
    fetch.resetMocks();
  });

  beforeAll(async () => {
    fetch.enableMocks();
    // 定义 event 数据模型
    store.defineModel("event", {
      name: "",
      description: "",
      creator: {},
      create_time: 0,
      update_time: 0
    });
    expect(Object.keys(store.modalObj.event.data).length).toBe(5);
    const t = () => {
      store.defineModel("event", {
        name: "_"
      });
    };
    expect(t).toThrow(Error);

    fetch.mockResponseOnce(
      JSON.stringify({
        code: 0,
        msg: "success",
        data: [
          {
            id: "1",
            name: "shopee_1",
            description: "description"
          }
        ]
      })
    );
    // 查询并缓存 ID 为 1 的活动记录, 未命中缓存
    const beforeStore = store.recordObj.event;
    expect(beforeStore).toBe(undefined);
    // 则发起请求 GET /event
    myRecord = await store.findRecord("event", "1");
    expect(fetch).toBeCalledTimes(1);
  });

  it("find record", async () => {
    expect(myRecord.data.id).toBe("1");
    expect(myRecord.data.name).toBe("shopee_1");
    expect(myRecord.data.description).toBe("description");
    expect(myRecord.data.creator).not.toBeUndefined();
    expect(myRecord.data.create_time).not.toBeUndefined();
    expect(myRecord.data.update_time).not.toBeUndefined();
    const afterStore = store.recordObj.event;
    expect(afterStore[0].data.id).toBe("1");
  });

  it("change id: throw error", () => {
    const t = () => {
      myRecord.data.id = 2; // 抛出异常，id 不允许修改
    };
    expect(t).toThrow(Error);
    expect(myRecord.data.id).toBe("1");
  });

  it("change name & roll back: name will not be saved", () => {
    // 将活动名称更改为 'Hi shopee'，此时尚未保存在服务端
    myRecord.data.name = "Hi shopee";
    expect(myRecord.data.name).toBe("Hi shopee");
    // 放弃所有更改，此时 name 变回 'shopee_1'
    myRecord.rollback();
    expect(myRecord.data.name).toBe("shopee_1");
  });

  it("save (put)", async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        code: 0,
        msg: "success"
      })
    );
    myRecord.data.name = "shopee_1_updated_1";
    // 将最新的结果保存到服务器（不同的操作要求不同的 http 请求类型）
    const res = await myRecord.save();
    console.log("返回保存结果：", res);
    // 对于已存在的记录（ID不为空） 发出 PUT /event
    expect(fetch).toHaveBeenNthCalledWith(1, "http://www.ifeng.com/record", {
      method: "put",
      body: JSON.stringify(myRecord.data)
    });
    expect(res.code).toBe(0);
  });

  it("save (post)", async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        code: 0,
        msg: "success"
      })
    );
    const newRecord = store.createRecord("event", {
      data: {
        id: "100",
        description: "a new record that is not in server"
      }
    });
    const res = await newRecord.save();
    console.log("返回保存结果：", res);
    // 对于新记录 发出 POST /event 请求
    expect(fetch).toHaveBeenNthCalledWith(1, "http://www.ifeng.com/record", {
      method: "post",
      body: JSON.stringify(newRecord.data)
    });
    expect(res.code).toBe(0);
  });

  it("find", async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        code: 0,
        msg: "success",
        data: [
          {
            id: "2",
            name: "shopee",
            description: "description"
          },
          {id: "3", name: "shopee"}
        ]
      })
    );
    const beforeStoreLen = store.recordObj.event.length;
    const res = await store.find("event", {
      name: "shopee"
    });
    const afterStoreLen = store.recordObj.event.length;
    //打印查询数据集并缓存
    console.log("返回数据集并缓存：", res);
    // 发出 HTTP 请求
    expect(fetch).toBeCalledTimes(1);
    // store: 1
    expect(beforeStoreLen).toBe(1);
    expect(res.length).toBe(2);
    expect(res[0].data.name).toBe("shopee");
    expect(res[1].data.name).toBe("shopee");
    // store: 1、2、3
    expect(afterStoreLen).toBe(3);
  });

  it("findRecord", async () => {
    const res = await store.findRecord("event", "1");
    console.log("返回缓存单条数据：", res);
    // 因为已经缓存这条记录，所以不会发出 HTTP 请求
    expect(fetch).toBeCalledTimes(0);
    // 检测单条缓存
    expect(res).not.toBeUndefined();
    expect(res.data.id).toBe("1");
  });

  it("queryRecord new record", async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        code: 0,
        msg: "success",
        data: [
          {
            id: "55",
            name: "shopee_55"
          }
        ]
      })
    );
    // 不查询缓存，发出 HTTP 请求 对缓存数据进行更新
    const res = await store.queryRecord("event", "55");
    console.log("返回网络请求数据集中的一条数据：", res);

    // 发出 HTTP 请求
    expect(fetch).toBeCalledTimes(1);
    // 检测单条缓存
    expect(res.data.id).toBe("55");
    expect(res.data.name).toBe("shopee_55");
  });

  it("queryRecord to update store", async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        code: 0,
        msg: "success",
        data: [
          {
            id: "1",
            name: "shopee_1_updated_2",
            description: "updated description"
          }
        ]
      })
    );
    const toQueryId = "1";
    const beforeDescription = (store.recordObj.event.find(
      (record: IRecord) => record.data.id === toQueryId
    ) as IRecord).data.description;

    // 不查询缓存，发出 HTTP 请求 对缓存数据进行更新
    const res = await store.queryRecord("event", toQueryId);
    console.log("返回网络请求数据集中的一条数据：", res);

    const afterDescription = (store.recordObj.event.find(
      (record: IRecord) => record.data.id === toQueryId
    ) as IRecord).data.description;
    // 发出 HTTP 请求
    expect(fetch).toBeCalledTimes(1);
    // 检测单条缓存
    expect(res.data.id).toBe("1");
    expect(res.data.name).toBe("shopee_1_updated_2");
    // store 中 id=1 记录被更新
    expect(beforeDescription).toBe("description");
    expect(afterDescription).toBe("updated description");
  });

  it("query", async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        code: 0,
        msg: "success",
        data: [
          {id: "2", name: "shopee", description: "updated description"},
          {id: "3", name: "shopee"},
          {id: "4", name: "shopee"}
        ]
      })
    );
    const beforeStoreLen = store.recordObj.event.length;
    const beforeDescription = (store.recordObj.event.find(
      (record: IRecord) => record.data.id === "2"
    ) as IRecord).data.description;

    // 发出 HTTP 请求 更新缓存数据
    const res = await store.query("event", {
      name: "shopee"
    });
    console.log("返回缓存数据集：", res);

    const afterStoreLen = store.recordObj.event.length;
    const afterDescription = (store.recordObj.event.find(
      (record: IRecord) => record.data.id === "2"
    ) as IRecord).data.description;
    //打印查询数据集并缓存
    console.log("返回数据集并缓存：", res);
    // 发出 HTTP 请求
    expect(fetch).toBeCalledTimes(1);
    // 检测数据集
    // before: 1、2、3、55
    expect(beforeStoreLen).toBe(4);
    expect(res.length).toBe(3);
    // after: 1、2、3、4、55
    expect(afterStoreLen).toBe(5);

    // store 中 id=2 记录被更新
    expect(beforeDescription).toBe("description");
    expect(afterDescription).toBe("updated description");
  });

  describe("record.destory", () => {
    let res: IRecord[];
    beforeAll(async () => {
      fetch.mockResponseOnce(
        JSON.stringify({
          code: 0,
          msg: "success",
          data: [{id: "2", name: "shopee_2_updated_1"}]
        })
      );
      res = await store.query("event", {
        name: "shopee"
      });
    });

    beforeEach(() => {
      fetch.resetMocks();
    });
    it("record.destory", async () => {
      fetch.mockResponseOnce(
        JSON.stringify({
          code: 0,
          msg: "success"
        })
      );
      // 在服务器端删除这条记录，发送 DELETE /event
      const destoryRes = await res[0].destroyRecord();
      //对删除结果进行打印
      console.log("打印删除结果：", destoryRes);
      expect(fetch).toBeCalledTimes(1);
      expect(destoryRes.code).toBe(0);
    });
  });

  it("unloadAll", async () => {
    // 清空所有缓存数据
    store.unloadAll();
    expect(store.recordObj.event).toBe(undefined);
    expect(Object.keys(store.recordObj).length).toBe(0);
  });

  it("findRecord will fetch remote when store is empty", async () => {
    // 发起HTTP请求（没有缓存，直接发起请求）
    fetch.mockResponseOnce(
      JSON.stringify({
        code: 0,
        msg: "success",
        data: [{id: "1", name: "shopee_1"}]
      })
    );
    const toQueryId = "1";

    // 不查询缓存，发出 HTTP 请求 对缓存数据进行更新
    const res = await store.findRecord("event", toQueryId);
    console.log("返回网络请求数据集中的一条数据：", res);

    // 发出 HTTP 请求
    expect(fetch).toBeCalledTimes(1);
    // 检测单条数据
    expect(res.data.id).toBe("1");
    expect(res.data.name).toBe("shopee_1");
    // id=1 被缓存
    expect(
      store.recordObj.event.find(
        (record: IRecord) => record.data.id === toQueryId
      ) as IRecord
    ).not.toBeUndefined();
  });
});
