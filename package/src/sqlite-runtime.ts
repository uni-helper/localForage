declare const plus: any;

//使用plus的sqlite重新实现一遍localForage

/**
 * @name: 一层封装
 * 
 **/

// #ifdef APP-PLUS

//打开数据库
async function openDatabase(dbName: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    plus.sqlite.openDatabase({
      name: dbName,
      path: '_doc/localForage/' + dbName + '.db',
      success(e) {
        resolve(true);
      },
      fail(e) {
        reject(false);
      }
    });
  });
}

//数据库是否打开
const isOpenDatabase = (dbName: string) => {
  return plus.sqlite.isOpenDatabase({
    name: dbName,
    path: '_doc/localForage/' + dbName + '.db'
  })
}

//关闭数据库
async function closeDatabase(dbName: string) {
  return new Promise((resolve, reject) => {
    plus.sqlite.closeDatabase({
      name: dbName,
      success(e) {
        resolve(true);
      },
      fail(e) {
        reject(false);
      }
    });
  });
}

//执行事务
//operation ，类型为string，并且只有三个可选值：begin、commit、rollback
type operation = 'begin' | 'commit' | 'rollback';
async function transaction(dbName: string, operation: operation) {
  return new Promise((resolve, reject) => {
    plus.sqlite.transaction({
      name: dbName,
      operation: operation,
      success(e) {
        resolve(true);
      },
      fail(e) {
        reject(false);
      }
    });
  });
}

//执行sql语句
async function executeSql(dbName: string, sql: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    plus.sqlite.executeSql({
      name: dbName,
      sql: sql,
      success(e) {
        resolve(true);
      },
      fail(e) {
        reject(false);
      }
    });
  });
}

//执行查询的sql语句
async function selectSql(dbName: string, sql: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    plus.sqlite.selectSql({
      name: dbName,
      sql: sql,
      success(e) {
        resolve(e);
      },
      fail(e) {
        reject(null);
      }
    });
  });
}

// #endif

/**
 * @name: 二层封装
 * 
 **/

//往某数据库中执行sql语句的综合方法，包括打开数据库、执行sql语句、关闭数据库（其中关闭数据库要判断是否还有其他操作在执行）
let counter: counter;
interface counter {
  //每一个属性为string类型的属性都是一个数据库的名称，属性的值为一个数字，表示该数据库有多少个操作在执行，默认为0
  [key: string]: number;
}
async function execute(dbName: string, sql: string) {
  counter[dbName]++;
  let result = false;
  if (!isOpenDatabase(dbName)) {
    result = await openDatabase(dbName);
  }
  //开始事务
  await transaction(dbName, 'begin');
  result = await executeSql(dbName, sql);
  //根据执行结果决定是否提交事务
  if (result) {
    await transaction(dbName, 'commit');
  } else {
    await transaction(dbName, 'rollback');
  }
  counter[dbName]--;
  if (counter[dbName] === 0) {
    await closeDatabase(dbName);
  }
  if (result) {
    return true;
  } else {
    throw new Error();
  }
}
//往某数据库中执行查询的sql语句的综合方法，包括打开数据库、执行sql语句、关闭数据库（其中关闭数据库要判断是否还有其他操作在执行）
async function select(dbName: string, sql: string) {
  counter[dbName]++;
  let result: any = null;
  if (!isOpenDatabase(dbName)) {
    result = await openDatabase(dbName);
  }
  //开始事务
  result = await selectSql(dbName, sql);
  //根据执行结果决定是否提交事务
  counter[dbName]--;
  if (counter[dbName] === 0) {
    await closeDatabase(dbName);
  }
  if (result !== null) {
    return result;
  } else {
    throw new Error();
  }
}

//是否支持sqlite
export const isSupportSqlite = () => {
  let result = false;
  // #ifdef APP-PLUS
  let loading = true
  openDatabase('isSupportSqlite').then((res) => {
    res = result;
  }).catch((e) => {
    e = result;
  }).finally(() => {
    loading = false
  })
  while (loading) {
    //休眠100毫秒
    setTimeout(() => {
      loading = false
    }, 100)
  }
  // #endif
  return result;
}

//检查数据库中的表是否存在，如果不存在则创建，如果存在则不做任何操作
//创建成功或者表已存在返回true，创建失败返回false
export async function checkStore(dbName: string, storeName: string) {
  const sql = `SELECT name FROM sqlite_master WHERE type='table' AND name='${storeName}';`;
  const result = await select(dbName, sql);
  if (result.length > 0) {
    return true; // 表已存在
  } else {
    const createSql = `CREATE TABLE ${storeName} (id INT PRIMARY KEY, name TEXT);`;
    const createAction = await execute(dbName, createSql);
    return createAction;
  }
}

/**
 * @name: 最终封装
 * 
 **/

export async function setItem(key: string, value: any, dbName: string, storeName: string) {
  await checkStore(dbName, storeName);
  const sql = `INSERT OR REPLACE INTO ${storeName} (id, name) VALUES ('${key}', '${value}');`;
  const result = await execute(dbName, sql);
  if (result) {
    return true;
  } else {
    return false;
  }
}

export async function getItem(key: string, dbName: string, storeName: string) {
  await checkStore(dbName, storeName);
  const sql = `SELECT name FROM ${storeName} WHERE id='${key}';`;
  const result = await select(dbName, sql);
  if (result.length > 0) {
    return result[0].name;
  } else {
    return null;
  }
}

export async function removeItem(key: string, dbName: string, storeName: string) {
  await checkStore(dbName, storeName);
  const sql = `DELETE FROM ${storeName} WHERE id='${key}';`;
  const result = await execute(dbName, sql);
  if (result) {
    return true;
  } else {
    return false;
  }
}

export async function clear(dbName: string, storeName: string) {
  await checkStore(dbName, storeName);
  const sql = `DELETE FROM ${storeName};`;
  const result = await execute(dbName, sql);
  if (result) {
    return true;
  } else {
    return false;
  }
}

export async function key(index: number, dbName: string, storeName: string) {
  await checkStore(dbName, storeName);
  const sql = `SELECT id FROM ${storeName} LIMIT ${index}, 1;`;
  const result = await select(dbName, sql);
  if (result.length > 0) {
    return result[0].id;
  } else {
    return null;
  }
}

export async function keys(dbName: string, storeName: string) {
  await checkStore(dbName, storeName);
  const sql = `SELECT id FROM ${storeName};`;
  const result = await select(dbName, sql);
  if (result.length > 0) {
    return result.map((item: any) => {
      return item.id;
    });
  } else {
    return null;
  }
}

export async function length(dbName: string, storeName: string) {
  //根据keys函数的数组长度来判断
  const result = await keys(dbName, storeName);
  if (result !== null) {
    return result.length;
  } else {
    return 0;
  }
}

export async function iterate(callback: Function,dbName: string, storeName: string) {
  await checkStore(dbName, storeName);
  const sql = `SELECT id, name FROM ${storeName};`;
  const result = await select(dbName, sql);
  if (result.length > 0) {
    result.forEach((item: any) => {
      callback(item.name, item.id);
    });
    return result;
  }else{
    return []
  }
}