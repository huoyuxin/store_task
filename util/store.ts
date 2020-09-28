import {IRecord} from "../src/record";

export const fetchAllFromRemote = async (
  params: Store.Params
): Promise<IRecord[]> => {
  const url = new URL("http://www.ifeng.com/recordList");
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  return new Promise((resolve, reject) => {
    fetch(url.toJSON())
      .then(res =>
        res.json().then(body => {
          if (body.code !== 0) {
            throw new Error(body.msg);
          }
          return resolve(body.data);
        })
      )
      .catch(e => {
        console.error("fetchAllFromRemote", e);
        return reject(e);
      });
  });
};
