declare const plus: any;

//使用plus的sqlite重新实现一遍localForage

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

//往某数据库中执行sql语句的综合方法，包括打开数据库、执行sql语句、关闭数据库（其中关闭数据库要判断是否还有其他操作在执行）
let counter = 0;
export async function execute(dbName: string, sql: string) {
  counter++;
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
  counter--;
  if (counter === 0) {
    await closeDatabase(dbName);
  }
  if(result){
    return true;
  }else{
    throw new Error();
  }
}
//往某数据库中执行查询的sql语句的综合方法，包括打开数据库、执行sql语句、关闭数据库（其中关闭数据库要判断是否还有其他操作在执行）
export async function select(dbName: string, sql: string) {
  counter++;
  let result: any = null;
  if (!isOpenDatabase(dbName)) {
    result = await openDatabase(dbName);
  }
  //开始事务
  await transaction(dbName, 'begin');
  result = await selectSql(dbName, sql);
  //根据执行结果决定是否提交事务
  if (result !== null) {
    await transaction(dbName, 'commit');
  } else {
    await transaction(dbName, 'rollback');
  }
  counter--;
  if (counter === 0) {
    await closeDatabase(dbName);
  }
  if(result !== null){
    return result;
  }else{
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
