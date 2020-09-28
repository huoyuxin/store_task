import {Store} from "./store";

// 对表 event 进行 增、删、查、改操作。
// 创建一个 Store
let store = new Store();

// 定义 event 数据模型
store.defineModel("event", {
  name: "",
  description: "",
  creator: {},
  create_time: 0,
  update_time: 0
});

// 查询并缓存 ID 为 1 的活动记录
// 未命中缓存则发起请求 GET /event
store
  .findRecord("event", "1")
  .then(myRecord => {
    console.log(myRecord.data.id); // 返回 1
    console.log(myRecord.data.name); // 返回 'shopee'
    try {
      myRecord.data.id = 2; // 抛出异常，id 不允许修改
    } catch (e) {
      console.error("id不可编辑");
    }
    console.log("id不变", myRecord.data.id);
    // 将活动名称更改为 'Bye World'，此时尚未保存在服务端
    myRecord.data.name = "Hi shopee";
    console.log("修改name：", myRecord.data.name);
    // 放弃所有更改，此时 name 变回 'Hello World'
    myRecord.rollback();
    console.log("回滚name：", myRecord.data.name);
    myRecord.data.name = "shopee task";

    // 将最新的结果保存到服务器（不同的操作要求不同的 http 请求类型）
    // 对于已存在的记录（ID不为空） 发出 PUT /event
    // 对于新记录 发出 POST /event 请求
    return myRecord.save();
  })
  .then(req => {
    console.log("返回保存结果：", req);
    // 多条查询并缓存
    return store.find("event", {name: "shopee"});
  })
  .then(req => {
    //打印查询数据集并缓存
    console.log("返回数据集并缓存：", req);
    // 检测单条缓存
    // 因为已经缓存这条记录，所以不会发出 HTTP 请求
    return store.findRecord("event", "1");
  })
  .then(req => {
    console.log("返回缓存单条数据：", req);
    // 检测数据集缓存后包含的单条缓存
    // 不查询缓存，发出 HTTP 请求 对缓存数据进行更新
    return store.queryRecord("event", "55");
  })
  .then(req => {
    console.log("返回缓存数据集中的一条数据：", req);
    // 检测数据集缓存后包含的单条缓存
    // 发出 HTTP 请求 更新缓存数据
    return store.query("event", {name: "shopee"});
  })
  .then(req => {
    console.log("返回缓存数据集：", req);
    // 在服务器端删除这条记录，发送 DELETE /event
    return req[0].destroyRecord();
  })
  .then(req => {
    //对删除结果进行打印
    console.log("打印删除结果：", req);
    // 清空所有缓存数据
    store.unloadAll();
    // 发起HTTP请求（不通过缓存直接发起请求）
    return store.queryRecord("event", "1");
  })
  .then(req => {
    console.log("发起请求查询单条数据并更新缓存：", req);
  });
