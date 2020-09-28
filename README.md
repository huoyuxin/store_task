## 任务拆分

- 一般任务
  - 新建项目 + ts/babel/webpack 等配置
  - store
  - record
  - server 测试: 测试用例 + jest 配置
  - client 测试: mock 接口 whistle 配置
- 注意点：
  - object 覆盖
  - read-only:
    - record.id
    - defineModel

## 运行测试用例

- server(推荐)

```bash
  npm run test
```

- browser

```bash
  npm run build
  whistle/charles mock 接口返回
  打开__test__/test.html
```
