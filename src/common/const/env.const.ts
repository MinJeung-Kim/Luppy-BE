const env = 'ENV';
const dbType = 'DB_TYPE';
const dbHost = 'DB_HOST';
const dbPort = 'DB_PORT';
const dbUsername = 'DB_USERNAME';
const dbPassword = 'DB_PASSWORD';
const dbDatabase = 'DB_DATABASE';
// 운영 환경용 DB 설정
const prodDbHost = 'MYSQL_PUBLIC_URL';
const prodDbPort = 'MYSQLPORT';
const prodDbUsername = 'MYSQLUSER';
const prodDbPassword = 'MYSQL_ROOT_PASSWORD';
const prodDbDatabase = 'MYSQL_DATABASE';
const hashRounds = 'HASH_ROUNDS';
const accessTokenSecret = 'ACCESS_TOKEN_SECRET';
const refreshTokenSecret = 'REFRESH_TOKEN_SECRET';

export const envVariables = {
  env,
  dbType,
  dbHost,
  dbPort,
  dbUsername,
  dbPassword,
  dbDatabase,
  prodDbHost,
  prodDbPort,
  prodDbUsername,
  prodDbPassword,
  prodDbDatabase,
  hashRounds,
  accessTokenSecret,
  refreshTokenSecret,
};
