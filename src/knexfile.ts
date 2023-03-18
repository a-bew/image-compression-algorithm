import path from 'path';

const config = {
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, './data/mydatabase.sqlite'),
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.join(__dirname, './migrations'),
  },
  seeds: {
    directory: path.join(__dirname, './seeds'),
  },
};


export default config;