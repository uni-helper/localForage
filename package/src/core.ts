import * as sqlite from './sqlite-runtime';

//本项目在于用sqlite重新实现localForage的API
//sqlite-runtime.ts是plus.sqlite的封装，用于在plus环境下使用sqlite
//core.ts是本项目的核心代码，用于实现localForage的API


export const INDEXEDDB = 'SQLite';
export const WEBSQL = 'SQLite';
export const LOCALSTORAGE = 'uniStorage';
export const SQLITE = 'SQLite';
export const UNISTORAGE = 'uniStorage';

//配置
const coreConfig = {
  name: 'localforage',//数据库的名称。可能会在在数据库的提示中会出现。一般使用你的应用程序的名字。在 uniStorage 中，它作为存储在 uniStorage 中的所有 key 的前缀。
  driver: [SQLITE, UNISTORAGE] as String[] | String,//要使用的首选驱动。
  size: 4980736,//用作兼容，实际上sqlite不需要这个参数
  storeName: 'keyvaluepairs',//仅含字母和数字和下划线。任何非字母和数字字符都将转换为下划线。
  description: '',//数据库的描述，一般是提供给开发者的。
  version: '1.0'//数据库的版本号。实际上sqlite不需要这个参数
}

//设置配置
export function config(options: {
  name?: string,
  driver?: string | string[],
  size?: number,
  storeName?: string,
  description?: string
  version?: string
}) {
  Object.assign(coreConfig, options);
}

//设置驱动器
export function setDriver(driver: string | string[]) {
  coreConfig.driver = driver;
}

//获取第一个驱动器
export function driver(): String {
  if (typeof coreConfig.driver === 'string') {
    return coreConfig.driver;
  } else {
    return coreConfig.driver[0];
  }
}

//getItem，从数据库中获取某个key的值
export async function getItem(key: string, successCallback: (err, value) => void): Promise<any> {
  let result = {
    status: false,
    data: null as any
  }
  if (driver() === SQLITE) {
    //使用sqlite.select()方法从数据库中获取某个key的值
    result.data = await sqlite.select(coreConfig.name, `select value from ${coreConfig.storeName} where key = '${key}'`);
    if (result.data.length > 0) {
      result.status = true;
      result.data = result.data[0].value;
    }
  } else if (driver() === UNISTORAGE) {
    //return uniStorage.getItem(key);
  }
  successCallback(result.status, result.data);
  if (result.status === true) {
    return result.data;
  } else {
    throw new Error();
  }
}

//setItem，往数据库中存储某个key的值
export async function setItem(key: string, value: any, successCallback: (e) => void): Promise<any> {
  let result = false;
  if (driver() === SQLITE) {
    //使用sqlite.execute()方法往数据库中存储某个key的值
    result = await sqlite.execute(coreConfig.name, `insert or replace into ${coreConfig.storeName} (key, value) values ('${key}', '${value}')`);
  } else if (driver() === UNISTORAGE) {
    //return uniStorage.setItem(key, value);
  }
  successCallback(result);
  if (result === true) {
    return value;
  } else {
    throw new Error();
  }
}

//removeItem，从数据库中删除某个key的值
export async function removeItem(key: string, successCallback: () => void): Promise<any> {
  let result = false;
  if (driver() === SQLITE) {
    //使用sqlite.execute()方法从数据库中删除某个key的值
    result = await sqlite.execute(coreConfig.name, `delete from ${coreConfig.storeName} where key = '${key}'`);
  } else if (driver() === UNISTORAGE) {
    //return uniStorage.removeItem(key);
  }
  successCallback();
  if (result === true) {
    return;
  } else {
    throw new Error();
  }
}

//clear，清空数据库
export async function clear(successCallback: () => void): Promise<any> {
  let result = false;
  if (driver() === SQLITE) {
    //获取所有表的名称
    const tables = await sqlite.select(coreConfig.name, `SELECT name FROM sqlite_master WHERE type='table'`);
    //删除所有表
    for (const table of tables) {
      await sqlite.execute(coreConfig.name, `DELETE FROM ${table.name}`);
    }
    result = true;
  } else if (driver() === UNISTORAGE) {
    //return uniStorage.clear();
  }
  successCallback();
  if (result === true) {
    return;
  } else {
    throw new Error();
  }
}

//length，获取数据库中的key的数量
export async function length(successCallback: (numberOfKeys) => void): Promise<any> {
  let result = {
    status: false,
    data: 0
  }
  if (driver() === SQLITE) {
    //使用sqlite.select()方法获取数据库中的key的数量
    const data = await sqlite.select(coreConfig.name, `select count(*) as count from ${coreConfig.storeName}`);
    if (data.length > 0) {
      result.status = true;
      result.data = data[0].count;
    }
  } else if (driver() === UNISTORAGE) {
    //return uniStorage.length();
  }
  successCallback(result.data);
  if (result.status === true) {
    return result.data;
  } else {
    throw new Error();
  }
}

//key，获取数据库根据 key 的索引获取其名
export async function key(n: number, successCallback: (key) => void): Promise<any> {
  let result = {
    status: false,
    data: ''
  }
  if (driver() === SQLITE) {
    //使用sqlite.select()方法获取数据库中的key的数量
    const data = await sqlite.select(coreConfig.name, `select key from ${coreConfig.storeName} limit ${n}, 1`);
    if (data.length > 0) {
      result.status = true;
      result.data = data[0].key;
    }
  } else if (driver() === UNISTORAGE) {
    //return uniStorage.key(n);
  }
  successCallback(result);
  if (result.status) {
    return result;
  } else {
    throw new Error();
  }
}

//keys，获取数据库中的所有key
export async function keys(successCallback: (keys: string[]) => void): Promise<string[]> {
  let result = {
    data: [] as string[],
    status: false
  };
  if (driver() === SQLITE) {
    //使用sqlite.select()方法获取数据库中的所有key
    const data: any = await sqlite.select(coreConfig.name, `select key from ${coreConfig.storeName}`);
    if (data !== null) {
      result.status = true;
      //将所有key放入数组中
      for (const item of data) {
        result.data.push(item.key);
      }
    }
  } else if (driver() === UNISTORAGE) {
    //return uniStorage.keys();
  }
  successCallback(result.data);
  if (result.status === true) {
    return result.data;
  } else {
    throw new Error();
  }
}

//iterate，迭代数据仓库中的所有 value/key 键值对。
export async function iterate(iteratorCallback: (value: any, key: string, iterationNumber: number) => void, successCallback: () => void): Promise<any> {
  let result = {
    data: [] as string[],
    status: false
  };
  if (driver() === SQLITE) {
    //使用sqlite.select()方法获取数据库中的所有key
    const data: any = await sqlite.select(coreConfig.name, `select key, value from ${coreConfig.storeName}`);
    if (data !== null) {
      result.status = true;
      //将所有key放入数组中
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        iteratorCallback(item.value, item.key, i);
      }
    }
  } else if (driver() === UNISTORAGE) {
    //return uniStorage.keys();
  }
  successCallback();
  if (result.status === true) {
    return result.data;
  } else {
    throw new Error();
  }
}

