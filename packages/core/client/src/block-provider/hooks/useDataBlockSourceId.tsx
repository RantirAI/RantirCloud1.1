import { useFieldSchema } from '@formily/react';
import { useCollection, useCollectionManager, useParentRecordData, useRecordData } from '../..';

/**
 * 注意：这里有一个需要更改 schema 才能解决的问题，就是在获取 sourceId 的时候无法确定（在关系字段和当前表同表时）
 * 是需要从 recordData 还是 parentRecordData 中获取;解决方法是通过更改 schema，在不同类型的关系区块中
 * （`通过点击关系字段按钮打开的弹窗中创建的非关系字段区块`和`关系字段区块`）使用不同的 hook。
 * @param param0
 * @returns
 */
export const useDataBlockSourceId = ({ association }: { association: string }) => {
  const recordData = useRecordData();
  const parentRecordData = useParentRecordData();
  const cm = useCollectionManager();
  const collectionOutsideBlock = useCollection();

  if (!association) return;

  const associationField = cm.getCollectionField(association);
  const associationCollection = cm.getCollection(associationField.collectionName);

  if (collectionOutsideBlock.name === associationCollection.name) {
    return recordData?.[
      associationField.sourceKey ||
        associationCollection.filterTargetKey ||
        associationCollection.getPrimaryKey() ||
        'id'
    ];
  }

  return parentRecordData?.[
    associationField.sourceKey || associationCollection.filterTargetKey || associationCollection.getPrimaryKey() || 'id'
  ];
};
