const chalk = require('chalk');
const crypto = require('crypto');
const { existsSync } = require('fs');
const { join, resolve } = require('path');
const { Generator } = require('@umijs/utils');
const { downloadPackageFromNpm, updateJsonFile } = require('./util');

const cacheStorePackageAndVersion = {
  'cache-manager-redis': '^0.6.0',
  'cache-manager-redis-store': '^2.0.0',
  'cache-manager-ioredis ': '^2.1.0',
  'cache-manager-mongodb': '^0.3.0',
  'cache-manager-mongoose': '^1.0.1',
  'cache-manager-fs-binary': '^1.0.4',
  'cache-manager-fs-hash': '^1.0.0',
  'cache-manager-hazelcast': '^0.2.1',
  'cache-manager-memcached-store': '^4.0.0',
  'cache-manager-couchbase': '^0.1.5',
};

class AppGenerator extends Generator {
  constructor(options) {
    const { context = {}, ...opts } = options;
    super(opts);
    this.context = context;
    this.env = this.parseEnvs();
  }

  parseEnvs() {
    const envs = this.args.env;
    const items = {};
    for (const env of envs) {
      const keys = env.split('=');
      if (keys.length !== 2) {
        console.log(`${chalk.red(env)} is not a valid environment value`);
        process.exit(1);
      }
      items[keys[0]] = keys[1];
    }
    return items;
  }

  checkDbEnv() {
    const dialect = this.args.dbDialect;
    const env = this.env;
    if (dialect === 'sqlite') {
      return;
    }
    if (!env.DB_DATABASE || !env.DB_USER || !env.DB_PASSWORD) {
      console.log(
        chalk.red(
          `Please set DB_HOST, DB_PORT, DB_DATABASE, DB_USER, DB_PASSWORD in .env file to complete database settings`,
        ),
      );
    }
  }

  checkProjectPath() {
    if (existsSync(this.cwd)) {
      console.log(chalk.red('Project directory already exists'));
      process.exit(1);
    }
  }

  checkDialect() {
    const dialect = this.args.dbDialect;
    const supportDialects = ['mysql', 'sqlite', 'postgres'];
    if (!supportDialects.includes(dialect)) {
      console.log(
        `dialect ${chalk.red(dialect)} is not supported, currently supported dialects are ${chalk.green(
          supportDialects.join(','),
        )}.`,
      );
      process.exit(1);
    }
  }

  getContext() {
    const env = this.env;
    const envs = [];
    const dependencies = [];
    const { dbDialect, allDbDialect, cacheStorePackage } = this.args;

    if (allDbDialect) {
      dependencies.push(`"mysql2": "^2.3.3"`);
      dependencies.push(`"pg": "^8.7.3"`);
      dependencies.push(`"pg-hstore": "^2.3.4"`);
      dependencies.push(`"sqlite3": "^5.0.8"`);
    }

    switch (dbDialect) {
      case 'sqlite':
        if (!allDbDialect) {
          dependencies.push(`"sqlite3": "^5.0.8"`);
        }
        envs.push(`DB_STORAGE=${env.DB_STORAGE || 'storage/db/nocobase.sqlite'}`);
        break;
      case 'mysql':
        if (!allDbDialect) {
          dependencies.push(`"mysql2": "^2.3.3"`);
        }
        envs.push(`DB_HOST=${env.DB_HOST || 'localhost'}`);
        envs.push(`DB_PORT=${env.DB_PORT || 3306}`);
        envs.push(`DB_DATABASE=${env.DB_DATABASE || ''}`);
        envs.push(`DB_USER=${env.DB_USER || ''}`);
        envs.push(`DB_PASSWORD=${env.DB_PASSWORD || ''}`);
        break;
      case 'postgres':
        if (!allDbDialect) {
          dependencies.push(`"pg": "^8.7.3"`);
          dependencies.push(`"pg-hstore": "^2.3.4"`);
        }
        envs.push(`DB_HOST=${env.DB_HOST || 'localhost'}`);
        envs.push(`DB_PORT=${env.DB_PORT || 5432}`);
        envs.push(`DB_DATABASE=${env.DB_DATABASE || ''}`);
        envs.push(`DB_USER=${env.DB_USER || ''}`);
        envs.push(`DB_PASSWORD=${env.DB_PASSWORD || ''}`);
        break;
    }

    // handle cache store package
    let envCacheStorePackage = '';
    if (cacheStorePackage === 'all') {
      for (const key in cacheStorePackageAndVersion) {
        dependencies.push(`"${key}": "${cacheStorePackageAndVersion[key]}"`);
      }
      dependencies.push(`"memcache-pp": "^0.3.3"`);
    } else if (!!cacheStorePackage ) {
      envCacheStorePackage = cacheStorePackage;
      dependencies.push(`"${cacheStorePackage}": "${cacheStorePackageAndVersion[cacheStorePackage]}"`);
      if (cacheStorePackage === 'cache-manager-memcached-store') {
        dependencies.push(`"memcache-pp": "^0.3.3"`);
      }
    }
    console.log(`cacheStorePackage is  ${cacheStorePackage}`)
    console.log(dependencies)

    return {
      ...this.context,
      dependencies: dependencies.join(`,\n    `),
      envs: envs.join(`\n`),
      env: {
        APP_PORT: 13000,
        APP_ENV: 'development',
        DB_DIALECT: dbDialect,
        CACHE_STORE_PACKAGE: envCacheStorePackage,
        APP_KEY: crypto.randomBytes(256).toString('base64'),
        ...env,
      },
    };
  }

  async downloadServerPackage() {
    const { name } = this.context;
    console.log('Download: @nocobase/app-server');
    const serverPackageDir = resolve(this.cwd, 'packages/app/server');
    await downloadPackageFromNpm('@nocobase/app-server', serverPackageDir);
    await updateJsonFile(resolve(serverPackageDir, 'package.json'), (data) => {
      data['name'] = `@${name}/app-server`;
      data['version'] = '0.1.0';
      return data;
    });
  }

  async downloadClientPackage() {
    const { name } = this.context;
    console.log('Download: @nocobase/app-client');
    const clientPackageDir = resolve(this.cwd, 'packages/app/client');
    await downloadPackageFromNpm('@nocobase/app-client', clientPackageDir);
    await updateJsonFile(resolve(clientPackageDir, 'package.json'), (data) => {
      data['name'] = `@${name}/app-client`;
      data['version'] = '0.1.0';
      return data;
    });
  }

  async writing() {
    this.checkProjectPath();
    this.checkDialect();

    const { name } = this.context;

    console.log(`Creating a new NocoBase application at ${chalk.green(name)}`);
    console.log('Creating files');

    this.copyDirectory({
      context: this.getContext(),
      path: join(__dirname, '../templates/app'),
      target: this.cwd,
    });

    await this.downloadServerPackage();
    await this.downloadClientPackage();

    this.checkDbEnv();

    console.log('');
    console.log(chalk.green(`$ cd ${name}`));
    console.log(chalk.green(`$ yarn install`));
    console.log(chalk.green(`$ yarn nocobase install`));
    console.log(chalk.green(`$ yarn dev`));
    console.log('');
  }
}

exports.AppGenerator = AppGenerator;
