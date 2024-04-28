import { LoadingOutlined } from '@ant-design/icons';
import { ArrayField } from '@formily/core';
import { connect, mapProps, mapReadPretty, useField } from '@formily/react';
import { toArr } from '@formily/shared';
import { Cascader as AntdCascader, Space, CascaderProps as AntdCascaderProps } from 'antd';
import { isBoolean, omit } from 'lodash';
import React from 'react';
import { UseRequestResult, useRequest } from '../../../api-client';
import { ReadPretty } from './ReadPretty';
import { defaultFieldNames } from './defaultFieldNames';
import { BaseOptionType } from 'antd/es/select';
import { withDynamicSchemaProps } from '../../../application/hoc/withDynamicSchemaProps';

const useDefDataSource = (options, props: any) => {
  const field = useField<ArrayField>();
  return useRequest(() => Promise.resolve({ data: field.dataSource || props.options || [] }), {
    ...options,
    refreshDeps: [field.dataSource, props.options],
  });
};

const useDefLoadData = (props: any) => {
  return props?.loadData;
};

export type CascaderProps<DataNodeType extends BaseOptionType = any> = AntdCascaderProps<DataNodeType> & {
  /**
   * @deprecated use `x-use-component-props` instead
   */
  useLoadData: (props: CascaderProps) => AntdCascaderProps['loadData'];
  /**
   * @deprecated use `x-use-component-props` instead
   */
  useDataSource?: (options: any) => UseRequestResult<unknown>;
  /**
   * Whether to wrap the label of option into the value
   */
  labelInValue?: boolean;
  /**
   * must select the last level
   */
  changeOnSelectLast?: boolean;
  onChange?: (value: any) => void;
  maxLevel?: number;
};

export const Cascader = withDynamicSchemaProps(
  connect(
    (props: CascaderProps) => {
      const field = useField<ArrayField>();
      const {
        value,
        onChange,
        labelInValue,
        options,
        // fieldNames = defaultFieldNames,
        useDataSource = useDefDataSource,
        useLoadData = useDefLoadData,
        changeOnSelectLast,
        changeOnSelect,
        maxLevel,
        ...others
      } = props;
      const fieldNames = { ...defaultFieldNames, ...props.fieldNames };
      const loadData = useLoadData(props);
      const { loading, run } = useDataSource(
        {
          onSuccess(data) {
            field.dataSource = data?.data || [];
          },
        },
        props,
      );
      // 兼容值为 object[] 的情况
      const toValue = () => {
        return toArr(value).map((item) => {
          if (typeof item === 'object') {
            return item[fieldNames.value];
          }
          return item;
        });
      };
      const displayRender = (labels: string[], selectedOptions: any[]) => {
        return (
          <Space split={'/'}>
            {labels.map((label, index) => {
              if (selectedOptions[index]) {
                return <span key={index}>{label}</span>;
              }
              const item = toArr(value)
                .filter(Boolean)
                .find((item) => item[fieldNames.value] === label);
              return <span key={index}>{item?.[fieldNames.label] || label}</span>;
            })}
          </Space>
        );
      };
      const handelDropDownVisible = (value) => {
        if (value && !field.dataSource?.length) {
          run();
        }
      };

      return (
        <AntdCascader
          loading={loading}
          {...others}
          options={field.dataSource}
          loadData={loadData}
          changeOnSelect={isBoolean(changeOnSelectLast) ? !changeOnSelectLast : changeOnSelect}
          value={toValue()}
          fieldNames={fieldNames}
          displayRender={displayRender}
          onDropdownVisibleChange={handelDropDownVisible}
          onChange={(value, selectedOptions: any) => {
            if (value && labelInValue) {
              onChange(selectedOptions.map((option) => omit(option, [fieldNames.children])));
            } else {
              onChange(value);
            }
          }}
        />
      );
    },
    mapProps(
      {
        dataSource: 'options',
      },
      (props, field) => {
        return {
          ...props,
          suffixIcon: field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffixIcon,
        };
      },
    ),
    mapReadPretty(ReadPretty),
  ),
);

export default Cascader;
