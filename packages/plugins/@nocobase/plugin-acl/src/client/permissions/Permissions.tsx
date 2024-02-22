import React, { useContext, useEffect, useMemo } from 'react';
import { Tabs } from 'antd';
import { useACLTranslation } from '../locale';
import { GeneralPermissions } from './GeneralPermissions';
import { AvailableActionsProvider } from './AvailableActions';
import { ActionPermissions } from './ActionPermissions';
import { MenuPermissions } from './MenuPermissions';
import { MenuItemsProvider } from './MenuItemsProvider';
import { PluginPermissions } from './PluginPermissions';
import { RolesManagerContext } from '../RolesManagerProvider';

export const Permissions: React.FC<{ active: boolean }> = ({ active }) => {
  const { t } = useACLTranslation();
  const [activeKey, setActiveKey] = React.useState('general');
  const { role } = useContext(RolesManagerContext);
  const pm = role?.snippets?.includes('pm.*');
  const items = useMemo(
    () => [
      {
        key: 'general',
        label: t('General permissions'),
        children: <GeneralPermissions active={activeKey === 'general' && active} />,
      },
      {
        key: 'action',
        label: t('Action permissions'),
        children: <ActionPermissions active={activeKey === 'action' && active} />,
      },
      {
        key: 'menu',
        label: t('Menu permissions'),
        children: (
          <MenuItemsProvider>
            <MenuPermissions active={activeKey === 'menu' && active} />
          </MenuItemsProvider>
        ),
      },
      ...(pm
        ? [
            {
              key: 'plugin',
              label: t('Plugin settings permissions'),
              children: <PluginPermissions active={activeKey === 'plugin' && active} />,
            },
          ]
        : []),
    ],
    [pm, activeKey, active, t],
  );

  useEffect(() => {
    setActiveKey('general');
  }, [role?.name]);

  return (
    <AvailableActionsProvider>
      <Tabs type="card" activeKey={activeKey} onChange={(key) => setActiveKey(key)} items={items} />
    </AvailableActionsProvider>
  );
};
