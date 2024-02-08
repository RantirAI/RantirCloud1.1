import { App, Button, Result, Typography } from 'antd';
import React, { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CardItem, useCompile, useDesignable } from '../../schema-component';
import { useDataSourceV2 } from '../data-source/DataSourceProvider';
import { useDataSourceManagerV2 } from '../data-source';
import { useCollection } from '../../collection-manager';
import { DEFAULT_DATA_SOURCE_NAME } from '../../data-source/data-source/DataSourceManager';

export interface CollectionDeletedPlaceholderProps {
  type: 'Collection' | 'Field' | 'DataSource';
  name?: string | number;
  message?: string;
}

const { Text } = Typography;

export const CollectionDeletedPlaceholder: FC<CollectionDeletedPlaceholderProps> = ({ type, name, message }) => {
  const { designable, dn } = useDesignable();
  const { modal } = App.useApp();
  const { t } = useTranslation();
  const dataSource = useDataSourceV2();
  const compile = useCompile();
  const collection = useCollection();
  const dataSourceManager = useDataSourceManagerV2();
  const nameValue = useMemo(() => {
    if (type === 'DataSource') {
      return name;
    }
    const dataSourcePrefix =
      dataSourceManager?.getDataSources().length >= 1 && dataSource && dataSource.key !== DEFAULT_DATA_SOURCE_NAME
        ? `${compile(dataSource.displayName || dataSource.key)} > `
        : '';
    if (type === 'Collection') {
      return `${dataSourcePrefix}${name}`;
    }
    const collectionPrefix = collection
      ? `${compile(collection.title) || collection.name || collection.tableName} > `
      : '';
    return `${dataSourcePrefix}${collectionPrefix}${name}`;
  }, []);

  const blockType = useMemo(() => {
    if (type === 'Field') {
      return 'Field';
    }
    return 'Block';
  }, [type]);

  const messageValue = useMemo(() => {
    if (message) {
      return message;
    }
    if (!name) {
      return `${t(type)} ${'name is required'}`;
    }

    return t(`The {{type}} "{{name}}" may have been deleted. Please remove this {{blockType}}.`, {
      type: t(type).toLocaleLowerCase(),
      name: nameValue,
      blockType: t(blockType),
    }).replaceAll('&gt;', '>');
  }, [message, nameValue, type, t, blockType]);

  if (designable || process.env.NODE_ENV === 'development') {
    if (type === 'Field') {
      return <Text type="secondary">{messageValue}</Text>;
    }

    return (
      <CardItem>
        <Result
          status="404"
          subTitle={messageValue}
          extra={
            <Button
              key="Delete"
              onClick={() =>
                modal.confirm({
                  title: t('Delete block'),
                  content: t('Are you sure you want to delete it?'),
                  ...confirm,
                  onOk() {
                    dn.remove(null, { removeParentsIfNoChildren: true, breakRemoveOn: { 'x-component': 'Grid' } });
                  },
                })
              }
            >
              {t('Delete')}
            </Button>
          }
        />
      </CardItem>
    );
  }

  return null;
};