import oracledb from 'oracledb';
import dotenv from "dotenv";

export {executeCommands, connectDB};

dotenv.config();

const dbConfig = {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_DBNAME}`,
    poolMin: 1,
    poolMax: 3,
    poolIncrement: 1,
    poolTimeout: 60
};

let CONNECTION:oracledb.Connection;

async function connectDB() {
    console.log(process.env.ORACLE_USER);
    console.log(process.env.ORACLE_PASSWORD);
    console.log(process.env.ORACLE_HOST);
    CONNECTION = await oracledb.getConnection (dbConfig);
    console.log("connected to db");
}


async function executeCommands() {
    const result1 = await CONNECTION.execute(
        `CREATE TABLE mytable (
         id       NUMBER NOT NULL
         )`
    );

    const result2 = await CONNECTION.execute(
        `DESC mytable`
    );

    
    console.log(result2.rows);
    await CONNECTION.close();
    
}
// // initialize connection pool
// async function initializeConnectionPool() {
//     try {
//         await oracledb.createPool(dbConfig);
//         console.log('Connection pool started');
//     } catch (err) {
//         console.error('Initialization error: (1)');
//     }
// }

// async function closePoolAndExit() {
//     console.log('\nTerminating');
//     try {
//         await oracledb.getPool().close(10); // 10 seconds grace period for connections to finish
//         console.log('Pool closed');
//         process.exit(0);
//     } catch (err) {
//         console.log('closing error: (2)')
//         process.exit(1);
//     }
// }

// process
//     .once('SIGTERM', closePoolAndExit)
//     .once('SIGINT', closePoolAndExit);

// async function withOracleDB(action:Function) {
//     let connection;
//     try {
//         connection = await oracledb.getConnection(); // Gets a connection from the default pool 
//         return await action(connection);
//     } catch (err) {
//         console.error(err);
//         throw err;
//     } finally {
//         if (connection) {
//             try {
//                 await connection.close();
//             } catch (err) {
//                 console.error(err);
//             }
//         }
//     }
// }

// async function fetchDemotableFromDb(): Promise<unknown[] | undefined> {
//     return await withOracleDB(async (connection:oracledb.Connection) => {
//         const result = await connection.execute('SELECT * FROM DEMOTABLE');
//         return result.rows;
//     }).catch(() => {
//         return [];
//     });
// }

// async function initiateDemotable() {
//     return await withOracleDB(async (connection:oracledb.Connection) => {
//         try {
//             await connection.execute(`DROP TABLE DEMOTABLE`);
//         } catch(err) {
//             console.log('Table might not exist, proceeding to create...');
//         }

//         const result = await connection.execute(`
//             CREATE TABLE DEMOTABLE (
//                 id NUMBER PRIMARY KEY,
//                 name VARCHAR2(20)
//             )
//         `);
//         return true;
//     }).catch(() => {
//         return false;
//     });
// }

// async function insertDemotable(id:number, name:string) {
//     return await withOracleDB(async (connection:oracledb.Connection) => {
//         const result = await connection.execute(
//             `INSERT INTO DEMOTABLE (id, name) VALUES (:id, :name)`,
//             [id, name],
//             { autoCommit: true }
//         );

//         return result.rowsAffected && result.rowsAffected > 0;
//     }).catch(() => {
//         return false;
//     });
// }

// initializeConnectionPool();
// setTimeout(initiateDemotable,5000);
