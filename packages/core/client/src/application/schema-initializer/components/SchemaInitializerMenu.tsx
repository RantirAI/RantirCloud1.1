import Icon, { RightOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { uid } from '@formily/shared';
import { Menu, MenuProps, theme } from 'antd';
import React, { FC, ReactNode, useMemo } from 'react';
import { useCompile } from '../../../schema-component';
import { useSchemaInitializerItem } from '../context';
import { useSchemaInitializerMenuItems } from '../hooks';
import { SchemaInitializerOptions } from '../types';
import { useSchemaInitializerStyles } from './style';

export interface SchemaInitializerMenuProps {
  title: string;
  name: string;
  onClick: (args: any) => void;
  icon: string | ReactNode;
  children?: SchemaInitializerOptions['items'];
}

const SchemaInitializerMenuContext = React.createContext<{ isInMenu?: true }>({});
const SchemaInitializerMenuProvider = (props) => {
  return (
    <SchemaInitializerMenuContext.Provider value={{ isInMenu: true }}>
      {props.children}
    </SchemaInitializerMenuContext.Provider>
  );
};
export const useSchemaInitializerMenuContext = () => {
  return React.useContext(SchemaInitializerMenuContext);
};

export const SchemaInitializerInternalMenu: FC<MenuProps> = (props) => {
  const { componentCls, hashId } = useSchemaInitializerStyles();
  const { items, ...others } = props;
  const { token } = theme.useToken();
  const itemsWithPopupClass = useMemo(
    () => items.map((item) => ({ ...item, popupClassName: `${hashId} ${componentCls}-menu-sub` })),
    [componentCls, hashId, items],
  );
  // selectedKeys 为了不让有选中效果
  return (
    <SchemaInitializerMenuProvider>
      <Menu
        expandIcon={<RightOutlined style={{ fontSize: token.fontSizeSM, color: token.colorTextDescription }} />}
        rootClassName={css`
          box-shadow: none !important;
          border-inline-end: 0 !important;
          .ant-menu-root {
            margin: 0 -${token.margin}px;
            .ant-menu-submenu-title {
              margin-inline: 0;
              margin-block: 0;
              width: 100%;
            }
          }
        `}
        items={itemsWithPopupClass}
        {...others}
      />
    </SchemaInitializerMenuProvider>
  );
};

export const SchemaInitializerMenu = (props) => {
  const { children, title, name = uid(), icon, ...others } = useSchemaInitializerItem<SchemaInitializerMenuProps>();
  const { children: _unUse, ...otherProps } = props;
  const compile = useCompile();
  const childrenItems = useSchemaInitializerMenuItems(children, name);
  const items = useMemo(() => {
    return [
      {
        ...others,
        key: name,
        label: compile(title),
        icon: typeof icon === 'string' ? <Icon type={icon as string} /> : icon,
        children: childrenItems,
      },
    ];
  }, [childrenItems, compile, icon, name, others, title]);
  return <SchemaInitializerInternalMenu items={items} {...otherProps}></SchemaInitializerInternalMenu>;
};
