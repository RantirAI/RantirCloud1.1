import { CollectionFieldOptionsV2, GetCollectionFieldPredicate } from '../../application';
import { CollectionV2 } from '../../application/collection/Collection';
import _, { filter, unionBy, uniq, uniqBy } from 'lodash';

export class InheritanceCollectionMixin extends CollectionV2 {
  protected parentCollections: string[];
  protected childrenCollections: string[];
  protected inheritsFields: CollectionFieldOptionsV2[];
  protected currentFields: CollectionFieldOptionsV2[];
  protected allFields: CollectionFieldOptionsV2[];
  protected parentCollectionFields: Record<string, CollectionFieldOptionsV2[]> = {};
  protected allCollectionsInheritChain: string[];
  protected inheritCollectionsChain: string[];
  protected foreignKeyFields: CollectionFieldOptionsV2[];

  getParentCollectionsName() {
    if (this.parentCollections?.length) {
      return this.parentCollections;
    }
    const parents: string[] = [];
    const getParentCollectionsInner = (collectionName: string) => {
      const collection = this.collectionManager.getCollection(collectionName);
      if (collection) {
        const { inherits } = collection;
        if (inherits) {
          for (let index = 0; index < inherits.length; index++) {
            const collectionKey = inherits[index];
            parents.push(collectionKey);
            getParentCollectionsInner(collectionKey);
          }
        }
      }
      return uniq(parents);
    };

    this.parentCollections = getParentCollectionsInner(this.name);
    return this.parentCollections;
  }

  getParentCollections() {
    return this.getParentCollectionsName().map((collectionName) => {
      return this.collectionManager.getCollection(collectionName);
    });
  }

  getChildrenCollectionsName(isSupportView = false) {
    if (this.childrenCollections?.length) {
      return this.childrenCollections;
    }

    const children: string[] = [];
    const collections = this.collectionManager.getCollections();
    const getChildrenCollectionsInner = (collectionName: string) => {
      const inheritCollections = collections.filter((v) => {
        return v.inherits?.includes(collectionName);
      });
      inheritCollections.forEach((v) => {
        const collectionKey = v.name;
        children.push(v.name);
        return getChildrenCollectionsInner(collectionKey);
      });
      if (isSupportView) {
        const sourceCollections = collections.filter((v) => {
          return v.sources?.length === 1 && v?.sources[0] === name;
        });
        sourceCollections.forEach((v) => {
          const collectionKey = v.name;
          children.push(v.name);
          return getChildrenCollectionsInner(collectionKey);
        });
      }
      return uniqBy(children, 'key');
    };

    this.childrenCollections = getChildrenCollectionsInner(this.name);
    return this.childrenCollections;
  }

  getChildrenCollections(isSupportView = false) {
    return this.getChildrenCollectionsName(isSupportView).map((collectionName) => {
      return this.collectionManager.getCollection(collectionName);
    });
  }

  getInheritedFields() {
    if (this.inheritsFields?.length) {
      return this.inheritsFields;
    }

    const parentCollections = this.getParentCollectionsName();
    this.inheritsFields = parentCollections
      .map((collectionName) => this.collectionManager.getCollection(collectionName)?.getFields())
      .flat()
      .filter(Boolean);

    return this.inheritsFields;
  }

  // override CollectionV2
  getFieldsMap() {
    if (!this.fieldsMap) {
      this.fieldsMap = this.getAllFields().reduce((memo, field) => {
        memo[field.name] = field;
        return memo;
      }, {});
    }
    return this.fieldsMap;
  }
  getCurrentFields(predicate?: GetCollectionFieldPredicate) {
    return super.getFields(predicate);
  }

  getParentCollectionFields(parentCollectionName: string) {
    if (!this.parentCollectionFields) {
      this.parentCollectionFields = {};
    }
    if (this.parentCollectionFields[parentCollectionName]) {
      return this.parentCollectionFields[parentCollectionName];
    }

    const currentFields = this.getCurrentFields();
    const parentCollections = this.getParentCollectionsName();
    const parentCollection = this.collectionManager.getCollection<InheritanceCollectionMixin>(parentCollectionName);
    const parentFields = parentCollection.getCurrentFields();
    const index = parentCollections.indexOf(parentCollectionName);
    let filterFields = currentFields;
    if (index > 0) {
      parentCollections.splice(index);
      parentCollections.forEach((collectionName) => {
        const collection = this.collectionManager.getCollection<InheritanceCollectionMixin>(collectionName);
        filterFields = filterFields.concat(collection.getCurrentFields());
      });
    }
    this.parentCollectionFields[parentCollectionName] = parentFields.filter((v) => {
      return !filterFields.find((k) => {
        return k.name === v.name;
      });
    });

    return this.parentCollectionFields[parentCollectionName];
  }

  getAllCollectionsInheritChain() {
    if (this.allCollectionsInheritChain?.length) {
      return this.allCollectionsInheritChain;
    }

    const collectionsInheritChain = [this.name];
    const getInheritChain = (name: string) => {
      const collection = this.collectionManager.getCollection<InheritanceCollectionMixin>(name);
      if (collection) {
        const { inherits } = collection;
        const children = collection.getChildrenCollectionsName();
        // 搜寻祖先表
        if (inherits) {
          for (let index = 0; index < inherits.length; index++) {
            const collectionKey = inherits[index];
            if (collectionsInheritChain.includes(collectionKey)) {
              continue;
            }
            collectionsInheritChain.push(collectionKey);
            getInheritChain(collectionKey);
          }
        }
        // 搜寻后代表
        if (children) {
          for (let index = 0; index < children.length; index++) {
            const collection = this.collectionManager.getCollection(children[index]);
            const collectionKey = collection.name;
            if (collectionsInheritChain.includes(collectionKey)) {
              continue;
            }
            collectionsInheritChain.push(collectionKey);
            getInheritChain(collectionKey);
          }
        }
      }
      return collectionsInheritChain;
    };

    this.allCollectionsInheritChain = getInheritChain(this.name);
    return this.allCollectionsInheritChain;
  }

  getInheritCollectionsChain() {
    if (this.inheritCollectionsChain?.length) {
      return this.inheritCollectionsChain;
    }
    const collectionsInheritChain = [this.name];
    const getInheritChain = (name: string) => {
      const collection = this.collectionManager.getCollection(name);
      if (collection) {
        const { inherits } = collection;
        if (inherits) {
          for (let index = 0; index < inherits.length; index++) {
            const collectionKey = inherits[index];
            if (collectionsInheritChain.includes(collectionKey)) {
              continue;
            }
            collectionsInheritChain.push(collectionKey);
            getInheritChain(collectionKey);
          }
        }
      }
      return collectionsInheritChain;
    };

    this.inheritCollectionsChain = getInheritChain(this.name);

    return this.inheritCollectionsChain;
  }

  getAllFields(predicate?: GetCollectionFieldPredicate) {
    if (this.allFields?.length) {
      return this.allFields;
    }
    const currentFields = this.getCurrentFields();
    const inheritedFields = this.getInheritedFields();
    const allFields = unionBy(currentFields?.concat(inheritedFields) || [], 'name').filter((v: any) => {
      return !v.isForeignKey;
    });

    this.allFields = allFields;

    return predicate ? filter(allFields, predicate) : allFields;
  }

  getForeignKeyFields() {
    if (this.foreignKeyFields?.length) {
      return this.foreignKeyFields;
    }
    const currentFields = this.getCurrentFields();
    const inheritedFields = this.getInheritedFields();
    const allFields = unionBy(currentFields?.concat(inheritedFields) || [], 'name').filter((v: any) => {
      return v.isForeignKey;
    });

    return allFields;
  }
}
