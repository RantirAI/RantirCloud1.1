import { Button, Drawer, Space, Table, TableProps } from 'antd';
import React, { useMemo, useState } from 'react';
import {
  CardItem,
  CollectionField,
  ColorFieldInterface,
  ColorPicker,
  DataBlockProvider,
  EmailFieldInterface,
  FormItem,
  IdFieldInterface,
  Input,
  InputFieldInterface,
  InputNumber,
  NumberFieldInterface,
  Plugin,
  RecordProvider,
  SchemaComponent,
  SchemaInitializer,
  SchemaInitializerItem,
  SchemaInitializerSwitch,
  SchemaSettings,
  SchemaToolbar,
  useCollection,
  useCompile,
  useCurrentSchema,
  useDataBlock,
  useDataBlockProps,
  useDataBlockRequest,
  useDataSource,
  useDataSourceManager,
  useDesignable,
  useSchemaInitializer,
  useSchemaInitializerItem,
  useSchemaInitializerRender,
  withDynamicSchemaProps,
} from '@nocobase/client';
import { Application } from '@nocobase/client';
import { uid } from '@formily/shared';
import { ISchema, observer, useFieldSchema } from '@formily/react';
import { mainCollections, TestDBCollections } from './collections';
import { mock } from './mockData';

const MyTable = withDynamicSchemaProps(Table, { displayName: 'MyTable' });

function useTableColumns() {
  const schema = useFieldSchema();
  const { designable } = useDesignable();
  const { render } = useSchemaInitializerRender(schema['x-initializer'], schema['x-initializer-props']);
  const columns = schema.mapProperties((field: any, name) => {
    return {
      title: field.title || name,
      dataIndex: name,
      key: name,
      render(value, record) {
        return (
          <RecordProvider record={record}>
            <SchemaComponent schema={field.toJSON()} />
          </RecordProvider>
        );
      },
    };
  });
  const tableColumns = useMemo(() => {
    return [
      ...columns,
      {
        title: render(),
        dataIndex: 'TABLE_COLUMN_INITIALIZER',
        key: 'TABLE_COLUMN_INITIALIZER',
        render: designable ? () => <div style={{ minWidth: 300 }} /> : null,
      },
    ];
  }, [columns, render, designable]);

  return tableColumns;
}

function useTableProps(): TableProps<any> {
  const { tableProps } = useDataBlockProps();
  const { data, loading } = useDataBlockRequest<any[]>();
  const dataSource = useMemo(() => data?.data || [], [data]);
  const columns = useTableColumns();

  return {
    ...tableProps,
    loading,
    dataSource,
    columns,
  };
}

const myTableSettings = new SchemaSettings({
  name: 'myTableSettings',
  items: [
    {
      name: 'bordered',
      type: 'switch',
      useComponentProps() {
        const { props: blockSettingsProps, dn } = useDataBlock();

        return {
          title: 'Bordered',
          checked: !!blockSettingsProps.tableProps?.bordered,
          onChange: (checked) => {
            // 修改 schema
            dn.deepMerge({ 'x-decorator-props': { tableProps: { bordered: checked } } });
          },
        };
      },
    },
  ],
});

const AddBlockButton = observer(() => {
  const fieldSchema = useFieldSchema();
  const { render } = useSchemaInitializerRender(fieldSchema['x-initializer']);
  return render();
});

const Page = observer(
  (props) => {
    return (
      <div>
        {props.children}
        <AddBlockButton />
      </div>
    );
  },
  { displayName: 'Page' },
);

function useCollectionMenuItems() {
  const dataSourceManager = useDataSourceManager();
  const allCollections = dataSourceManager.getAllCollections();
  const menus = useMemo(
    () =>
      allCollections.map((item) => {
        const { key, displayName, collections } = item;
        return {
          name: key,
          label: displayName,
          type: 'subMenu',
          children: collections.map((collection) => {
            return {
              name: collection.name,
              label: collection.title,
              collection: collection.name,
              dataSource: key,
            };
          }),
        };
      }),
    [allCollections],
  );

  return menus;
}

const CreateAction = () => {
  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const compile = useCompile();
  const collection = useCollection();
  const title = compile(collection.title);

  return (
    <>
      <Button type="primary" onClick={showDrawer}>
        Add New
      </Button>
      <Drawer title={`${title} | Add New`} onClose={onClose} open={open}>
        <p>Some contents...</p>
      </Drawer>
    </>
  );
};

const RefreshAction = () => {
  const { refresh } = useDataBlockRequest();
  return <Button onClick={refresh}>Refresh</Button>;
};

const ActionBar = ({ children }) => {
  const fieldSchema = useFieldSchema();
  const { render } = useSchemaInitializerRender(fieldSchema['x-initializer']);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 'var(--nb-spacing)',
      }}
    >
      <Space>
        {children}
        {render()}
      </Space>
    </div>
  );
};

const CreateActionInitializer = () => {
  const { insert } = useSchemaInitializer();
  const handleClick = () => {
    insert({
      type: 'void',
      'x-component': 'CreateAction',
    });
  };
  return <SchemaInitializerItem title={'Add New'} onClick={handleClick}></SchemaInitializerItem>;
};

const RefreshActionInitializer = () => {
  const { insert } = useSchemaInitializer();
  const handleClick = () => {
    insert({
      type: 'void',
      'x-component': 'RefreshAction',
    });
  };
  return <SchemaInitializerItem title={'Add New'} onClick={handleClick}></SchemaInitializerItem>;
};

const tableActionInitializers = new SchemaInitializer({
  name: 'tableActionInitializers',
  title: 'Configure actions',
  icon: 'SettingOutlined',
  style: {
    marginLeft: 8,
  },
  items: [
    {
      type: 'item',
      name: 'addNew',
      title: 'Add New',
      Component: CreateActionInitializer,
    },
    {
      type: 'item',
      name: 'refresh',
      title: 'Refresh',
      Component: RefreshActionInitializer,
    },
  ],
});

const TableDataBlockInitializer = () => {
  const { insert, setVisible } = useSchemaInitializer();

  const handleClick = ({ item }) => {
    const tableSchema = {
      type: 'void',
      'x-component': 'CardItem',
      'x-settings': 'myTableSettings',
      'x-decorator': 'DataBlockProvider',
      'x-toolbar': 'MyToolbar',
      'x-decorator-props': {
        collection: item.collection,
        dataSource: item.dataSource,
        action: 'list',
        tableProps: {
          bordered: true,
        },
      },
      properties: {
        actions: {
          type: 'void',
          'x-component': 'ActionBar',
          'x-initializer': 'tableActionInitializers',
        },
        [uid()]: {
          type: 'array',
          'x-component': 'MyTable',
          'x-use-component-props': 'useTableProps',
          'x-initializer': 'tableColumnInitializers',
        },
      },
    };
    insert(tableSchema);
    setVisible(false);
  };

  const menuItems = useCollectionMenuItems();

  return <SchemaInitializerItem title={'Table'} items={menuItems} onClick={handleClick} />;
};

const useTableColumnInitializerFields = () => {
  const collection = useCollection();
  return collection.fields.map((field) => {
    return {
      type: 'item',
      name: field.name,
      title: field?.uiSchema?.title || field.name,
      'x-collection-field': `${collection.name}.${field.name}`,
      Component: 'TableCollectionFieldInitializer',
      schema: {
        type: 'void',
        name: field.name,
        title: field?.uiSchema?.title || field.name,
        'x-component': 'CollectionField',
        'x-decorator': 'FormItem',
        'x-read-pretty': true,
        'x-decorator-props': {
          labelStyle: {
            display: 'none',
          },
        },
      },
    };
  });
};

export const TableCollectionFieldInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { insert } = useSchemaInitializer();
  const { exists, remove } = useCurrentSchema(itemConfig['x-collection-field'], 'x-collection-field');
  return (
    <SchemaInitializerSwitch
      checked={exists}
      title={itemConfig.title}
      onClick={() => {
        if (exists) {
          return remove();
        }
        insert(itemConfig.schema);
      }}
    />
  );
};

const tableColumnInitializers = new SchemaInitializer({
  name: 'tableColumnInitializers',
  insertPosition: 'beforeEnd',
  icon: 'SettingOutlined',
  title: 'Configure columns',
  items: [
    {
      name: 'displayFields',
      type: 'itemGroup',
      title: 'Display fields',
      useChildren: useTableColumnInitializerFields,
    },
  ],
});

const MyToolbar = (props) => {
  const collection = useCollection();
  const dataSource = useDataSource();
  const compile = useCompile();
  return <SchemaToolbar title={`${compile(dataSource.displayName)} > ${compile(collection.title)}`} {...props} />;
};

const myInitializer = new SchemaInitializer({
  name: 'myInitializer',
  title: 'Add Block',
  insertPosition: 'beforeEnd',
  items: [
    {
      name: 'table',
      Component: TableDataBlockInitializer,
    },
  ],
});

const rootSchema: ISchema = {
  type: 'void',
  name: 'root',
  'x-component': 'Page',
  'x-initializer': 'myInitializer',
};

class MyPlugin extends Plugin {
  async load() {
    this.app.addComponents({
      MyTable,
      MyToolbar,
      ActionBar,
      CreateAction,
      RefreshAction,
      TableCollectionFieldInitializer,
    });
    this.app.schemaInitializerManager.add(myInitializer);
    this.app.schemaSettingsManager.add(myTableSettings);
    this.app.addScopes({ useTableProps });
    this.app.schemaInitializerManager.add(tableActionInitializers);
    this.app.schemaInitializerManager.add(tableColumnInitializers);
  }
}

const Root = () => {
  return <SchemaComponent schema={rootSchema}></SchemaComponent>;
};

const app = new Application({
  plugins: [MyPlugin],
  components: {
    Page,
    AddBlockButton,
    CardItem,
    DataBlockProvider,
    InputNumber,
    Input,
    CollectionField,
    ColorPicker,
    FormItem,
  },
  router: {
    type: 'memory',
    initialEntries: ['/'],
  },
  designable: true,
  dataSourceManager: {
    collections: mainCollections,
    dataSources: [
      {
        key: 'test-db',
        displayName: 'TestDB',
        collections: TestDBCollections,
      },
    ],
    fieldInterfaces: [
      IdFieldInterface,
      InputFieldInterface,
      EmailFieldInterface,
      ColorFieldInterface,
      NumberFieldInterface,
    ],
  },
  apiClient: {
    baseURL: 'http://localhost:8000',
  },
});

app.router.add('home', {
  path: '/',
  Component: Root,
});

mock(app);

export default app.getRootComponent();