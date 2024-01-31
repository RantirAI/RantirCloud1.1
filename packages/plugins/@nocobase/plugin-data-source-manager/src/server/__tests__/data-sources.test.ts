import { createMockServer, MockServer, waitSecond } from '@nocobase/test';
import { CollectionManager, DataSource } from '@nocobase/data-source-manager';

describe('data source', async () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase', 'data-source-manager'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should load datasource async', async () => {
    class MockDataSource extends DataSource {
      static testConnection(options?: any): Promise<boolean> {
        return Promise.resolve(true);
      }

      async load(): Promise<void> {
        await waitSecond(1000);
      }

      createCollectionManager(options?: any): any {
        return undefined;
      }
    }

    app.dataSourceManager.factory.register('mock', MockDataSource);

    await app.db.getRepository('dataSources').create({
      values: {
        key: 'mockInstance1',
        type: 'mock',
        displayName: 'Mock',
        options: {},
      },
    });

    const listResp = await app.agent().resource('dataSources').list();

    const item1 = listResp.body.data[0];

    expect(item1.status).toBe('loading');
    await waitSecond(2000);

    const listResp2 = await app.agent().resource('dataSources').list();
    expect(listResp2.body.data[0].status).toBe('loaded');
  });

  it('should not load connection after change enabled status', async () => {
    const testConnectionFn = vi.fn();

    class MockDataSource extends DataSource {
      static testConnection(options?: any): Promise<boolean> {
        testConnectionFn();
        return Promise.resolve(true);
      }
      async load(): Promise<void> {}

      createCollectionManager(options?: any): any {
        return undefined;
      }
    }

    app.dataSourceManager.factory.register('mock', MockDataSource);

    await app
      .agent()
      .resource('dataSources')
      .create({
        values: {
          options: {},
          type: 'mock',
          key: 'mockInstance1',
          enabled: true,
        },
      });

    testConnectionFn.mockClear();

    const findDataSourceInstance = async () => {
      return await app.db.getRepository('dataSources').findOne({
        filterByTk: 'mockInstance1',
      });
    };

    expect((await findDataSourceInstance()).get('enabled')).toBeTruthy();

    await app
      .agent()
      .resource('dataSources')
      .update({
        filterByTk: 'mockInstance1',
        values: {
          enabled: false,
        },
      });

    expect(testConnectionFn).toBeCalledTimes(0);
    expect((await findDataSourceInstance()).get('enabled')).toBeFalsy();
  });

  it('should call test connection after options change', async () => {
    const testConnectionFn = vi.fn();

    class MockDataSource extends DataSource {
      static testConnection(options?: any): Promise<boolean> {
        testConnectionFn();
        return Promise.resolve(true);
      }
      async load(): Promise<void> {}

      createCollectionManager(options?: any): any {
        return undefined;
      }
    }

    app.dataSourceManager.factory.register('mock', MockDataSource);

    const testArgs = {
      test: '123',
    };

    await app
      .agent()
      .resource('dataSources')
      .create({
        values: {
          options: {
            ...testArgs,
          },
          type: 'mock',
          key: 'mockInstance1',
        },
      });

    testConnectionFn.mockClear();

    await app
      .agent()
      .resource('dataSources')
      .update({
        filterByTk: 'mockInstance1',
        values: {
          options: {
            otherOptions: 'test',
          },
        },
      });

    await waitSecond(1000);
    expect(testConnectionFn).toBeCalledTimes(1);
  });

  it('should test datasource connection', async () => {
    const testConnectionFn = vi.fn();

    class MockDataSource extends DataSource {
      static testConnection(options?: any): Promise<boolean> {
        testConnectionFn();
        return Promise.resolve(true);
      }
      async load(): Promise<void> {}

      createCollectionManager(options?: any): any {
        return undefined;
      }
    }

    app.dataSourceManager.factory.register('mock', MockDataSource);

    const testArgs = {
      test: '123',
    };

    await app
      .agent()
      .resource('dataSources')
      .testConnection({
        values: {
          options: testArgs,
          type: 'mock',
        },
      });

    expect(testConnectionFn).toBeCalledTimes(1);
  });

  it('should create data source', async () => {
    const loadFn = vi.fn();

    class MockDataSource extends DataSource {
      async load(): Promise<void> {
        loadFn();
      }

      createCollectionManager(options?: any): any {
        return undefined;
      }
    }

    app.dataSourceManager.factory.register('mock', MockDataSource);

    await app.db.getRepository('dataSources').create({
      values: {
        key: 'mockInstance1',
        type: 'mock',
        displayName: 'Mock',
        options: {},
      },
    });

    expect(loadFn).toBeCalledTimes(1);

    const mockDataSource = app.dataSourceManager.dataSources.get('mockInstance1');
    expect(mockDataSource).toBeInstanceOf(MockDataSource);
  });

  describe('data source collections', () => {
    beforeEach(async () => {
      class MockCollectionManager extends CollectionManager {}
      class MockDataSource extends DataSource {
        async load(): Promise<void> {
          this.collectionManager.defineCollection({
            name: 'posts',
            fields: [
              {
                type: 'string',
                name: 'title',
              },
              {
                type: 'hasMany',
                name: 'comments',
              },
            ],
          });

          this.collectionManager.defineCollection({
            name: 'comments',
            fields: [
              {
                type: 'string',
                name: 'content',
              },
            ],
          });
        }

        createCollectionManager(options?: any) {
          return new MockCollectionManager();
        }
      }

      app.dataSourceManager.factory.register('mock', MockDataSource);

      await app.db.getRepository('dataSources').create({
        values: {
          key: 'mockInstance1',
          type: 'mock',
          displayName: 'Mock',
          options: {
            password: '123456',
          },
        },
      });
    });

    it('should get data source collections', async () => {
      const listResp = await app.agent().resource('dataSources').list({
        appends: 'collections',
      });
      expect(listResp.status).toBe(200);

      const listEnabledResp = await app.agent().resource('dataSources').listEnabled({});
      expect(listEnabledResp.status).toBe(200);
      const data = listEnabledResp.body.data;
      const item = data[0];
      expect(item.collections).toBeDefined();
    });

    it('should get collections from datasource', async () => {
      const listResp = await app.agent().resource('dataSources').list();
      expect(listResp.status).toBe(200);

      // get collections
      const collectionsResp = await app.agent().resource('dataSources.collections', 'mockInstance1').list();
      expect(collectionsResp.status).toBe(200);
      const data = collectionsResp.body.data;

      expect(data.length).toBe(2);
    });

    it('should edit datasource collections', async () => {
      // edit collections
      const editResp = await app
        .agent()
        .resource('dataSources.collections', 'mockInstance1')
        .update({
          filterByTk: 'posts',
          values: {
            title: '标题 Collection',
          },
        });

      expect(editResp.status).toBe(200);

      const dataSource = app.dataSourceManager.dataSources.get('mockInstance1');
      const collection = dataSource.collectionManager.getCollection('posts');
      expect(collection.options.title).toBe('标题 Collection');
    });

    it('should get collection fields', async () => {
      const fieldListResp = await app.agent().resource('dataSourcesCollections.fields', 'mockInstance1.posts').list();
      expect(fieldListResp.status).toBe(200);

      expect(fieldListResp.body.data.length).toBe(2);

      // detail
      const fieldDetailResp = await app.agent().resource('dataSourcesCollections.fields', 'mockInstance1.posts').get({
        filterByTk: 'title',
      });
      expect(fieldDetailResp.status).toBe(200);
    });

    it('should update collection field', async () => {
      const fieldUpdateResp = await app
        .agent()
        .resource('dataSourcesCollections.fields', 'mockInstance1.posts')
        .update({
          filterByTk: 'title',
          values: {
            title: '标题 Field',
          },
        });

      expect(fieldUpdateResp.status).toBe(200);

      const dataSource = app.dataSourceManager.dataSources.get('mockInstance1');
      const collection = dataSource.collectionManager.getCollection('posts');
      const field = collection.getField('title');
      expect(field.options.title).toBe('标题 Field');
    });

    it('should create collection field', async () => {
      const dataSource = app.dataSourceManager.dataSources.get('mockInstance1');
      const collection = dataSource.collectionManager.getCollection('comments');

      expect(collection.getField('post')).toBeFalsy();

      const createResp = await app
        .agent()
        .resource('dataSourcesCollections.fields', 'mockInstance1.comments')
        .create({
          values: {
            type: 'belongsTo',
            name: 'post',
            target: 'posts',
            foreignKey: 'post_id',
          },
        });

      expect(createResp.status).toBe(200);

      expect(collection.getField('post')).toBeTruthy();

      // destroy field
      const destroyResp = await app
        .agent()
        .resource('dataSourcesCollections.fields', 'mockInstance1.comments')
        .destroy({
          filterByTk: 'post',
        });

      expect(destroyResp.status).toBe(200);
      expect(collection.getField('post')).toBeFalsy();
    });
  });
});
