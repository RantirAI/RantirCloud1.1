import { Plugin } from '../application/Plugin';

import { InheritanceCollectionMixin } from './mixins/InheritanceCollectionMixin';
import {
  CheckboxFieldInterface,
  CheckboxGroupFieldInterface,
  ChinaRegionFieldInterface,
  CollectionSelectFieldInterface,
  ColorFieldInterface,
  CreatedAtFieldInterface,
  CreatedByFieldInterface,
  DatetimeFieldInterface,
  EmailFieldInterface,
  IconFieldInterface,
  IdFieldInterface,
  InputFieldInterface,
  IntegerFieldInterface,
  JsonFieldInterface,
  LinkToFieldInterface,
  M2MFieldInterface,
  M2OFieldInterface,
  MarkdownFieldInterface,
  MultipleSelectFieldInterface,
  NumberFieldInterface,
  O2MFieldInterface,
  O2OFieldInterface,
  OHOFieldInterface,
  OBOFieldInterface,
  PasswordFieldInterface,
  PercentFieldInterface,
  PhoneFieldInterface,
  RadioGroupFieldInterface,
  RichTextFieldInterface,
  SelectFieldInterface,
  SubTableFieldInterface,
  TableoidFieldInterface,
  TextareaFieldInterface,
  TimeFieldInterface,
  UpdatedAtFieldInterface,
  UpdatedByFieldInterface,
  UrlFieldInterface,
} from './interfaces';
import {
  GeneralCollectionTemplate,
  ExpressionCollectionTemplate,
  SqlCollectionTemplate,
  TreeCollectionTemplate,
  ViewCollectionTemplate,
} from './templates';
import { DEFAULT_DATA_SOURCE_NAME, DEFAULT_DATA_SOURCE_TITLE } from '../data-source/data-source/DataSourceManager';
import { DataSourceV2 } from '../data-source/data-source/DataSource';

class MainDataSource extends DataSourceV2 {
  async getRemoteCollections() {
    const service = await this.app.apiClient.request({
      resource: 'collections',
      action: 'list',
      params: {
        paginate: false,
        appends: ['fields', 'category'],
        filter: {
          // inherit: false,
        },
        sort: ['sort'],
      },
    });
    return service?.data?.data || [];
  }
}

export class CollectionPlugin extends Plugin {
  async load() {
    this.dataSourceManager.addCollectionMixins([InheritanceCollectionMixin]);
    this.addFieldInterfaces();
    this.addCollectionTemplates();
    this.addFieldInterfaces();
    this.addFieldInterfaceGroups();

    this.dataSourceManager.addDataSource(MainDataSource, {
      key: DEFAULT_DATA_SOURCE_NAME,
      displayName: DEFAULT_DATA_SOURCE_TITLE,
    });
  }

  addFieldInterfaceGroups() {
    this.dataSourceManager.addFieldInterfaceGroups({
      basic: {
        label: '{{t("Basic")}}',
      },
      choices: {
        label: '{{t("Choices")}}',
      },
      media: {
        label: '{{t("Media")}}',
      },
      datetime: {
        label: '{{t("Date & Time")}}',
      },
      relation: {
        label: '{{t("Relation")}}',
      },
      advanced: {
        label: '{{t("Advanced type")}}',
      },
      systemInfo: {
        label: '{{t("System info")}}',
      },
      others: {
        label: '{{t("Others")}}',
      },
    });
  }

  addFieldInterfaces() {
    this.dataSourceManager.addFieldInterfaces([
      CheckboxFieldInterface,
      CheckboxGroupFieldInterface,
      ChinaRegionFieldInterface,
      CollectionSelectFieldInterface,
      ColorFieldInterface,
      CreatedAtFieldInterface,
      CreatedByFieldInterface,
      DatetimeFieldInterface,
      EmailFieldInterface,
      IconFieldInterface,
      IdFieldInterface,
      InputFieldInterface,
      IntegerFieldInterface,
      JsonFieldInterface,
      LinkToFieldInterface,
      M2MFieldInterface,
      M2OFieldInterface,
      MarkdownFieldInterface,
      MultipleSelectFieldInterface,
      NumberFieldInterface,
      O2MFieldInterface,
      O2OFieldInterface,
      OHOFieldInterface,
      OBOFieldInterface,
      PasswordFieldInterface,
      PercentFieldInterface,
      PhoneFieldInterface,
      RadioGroupFieldInterface,
      RichTextFieldInterface,
      SelectFieldInterface,
      SubTableFieldInterface,
      TableoidFieldInterface,
      TextareaFieldInterface,
      TimeFieldInterface,
      UpdatedAtFieldInterface,
      UpdatedByFieldInterface,
      UrlFieldInterface,
    ]);
  }

  addCollectionTemplates() {
    this.dataSourceManager.addCollectionTemplates([
      GeneralCollectionTemplate,
      ExpressionCollectionTemplate,
      SqlCollectionTemplate,
      TreeCollectionTemplate,
      ViewCollectionTemplate,
    ]);
  }
}
