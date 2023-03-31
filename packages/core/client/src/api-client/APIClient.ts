import { APIClient as APIClientSDK } from '@nocobase/sdk';
import { Result } from 'ahooks/lib/useRequest/src/types';
import { notification } from 'antd';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import React from 'react';
import { ResourceActionOptions } from './hooks';

const handleErrorMessage = (error, isNotificationsEnabled: boolean) => {
  const reader = new FileReader();
  reader.readAsText(error?.response?.data, 'utf-8');
  reader.onload = function () {
    if (!isNotificationsEnabled) return;
    notification.error({
      message: JSON.parse(reader.result as string).errors?.map?.((error: any) => {
        return React.createElement('div', { children: error.message });
      }),
    });
  };
};
export class APIClient extends APIClientSDK {
  services: Record<string, Result<any, any>> = {};
  private isNotificationsEnabled = true;

  enabledNotifications(value: boolean) {
    this.isNotificationsEnabled = value;
  }

  request<T = any, R = AxiosResponse<T>, D = any>(
    config: (AxiosRequestConfig<D> | ResourceActionOptions) & {
      /** 报错时是否弹出错误通知 */
      isNotificationsEnabled?: boolean;
    },
  ): Promise<R> {
    const { isNotificationsEnabled, ...others } = config;
    if (typeof isNotificationsEnabled === 'boolean') {
      this.enabledNotifications(isNotificationsEnabled);
    }
    return super.request(others);
  }

  service(uid: string) {
    return this.services[uid];
  }

  interceptors() {
    this.axios.interceptors.request.use((config) => {
      config.headers['X-With-ACL-Meta'] = true;
      const match = location.pathname.match(/^\/apps\/([^/]*)\//);
      if (match) {
        config.headers['X-App'] = match[1];
      }
      return config;
    });
    super.interceptors();
    this.notification();
  }

  notification() {
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const redirectTo = error?.response?.data?.redirectTo;
        if (redirectTo) {
          return (window.location.href = redirectTo);
        }
        if (error?.response?.data?.type === 'application/json') {
          handleErrorMessage(error, this.isNotificationsEnabled);
        } else if (this.isNotificationsEnabled) {
          notification.error({
            message: error?.response?.data?.errors?.map?.((error: any) => {
              return React.createElement('div', { children: error.message });
            }),
          });
        }
        throw error;
      },
    );
  }
}
