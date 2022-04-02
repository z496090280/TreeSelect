/* eslint-disable no-param-reassign */
import React from 'react';
import {
  getCategoryListByPid,
  getgetCategoryListByPidBBC,
  getChannelListByPid,
  getFrontendCategoryListByPid,
  getSpuList,
  backendBatchAncestors,
} from 'common/category/service';
import { CategoryFormItemForFilter } from 'common/category/form-item';
import { FormattedMessage } from 'react-intl';

export const GET_DATA_MAP = {
  select: getCategoryListByPid,
  frontend: getFrontendCategoryListByPid,
  backend: getCategoryListByPid,
  channel: getChannelListByPid,
  isBBC: getgetCategoryListByPidBBC
};

export function getActivesFromExpands(expands, active) {
  const actives = [];
  expands.forEach((expand, index) => {
    if (index) {
      actives.push(expand);
    }
  });
  if (active) {
    actives.push(active);
  }
  return actives;
}

export async function getSpu(pid, keyword = '') {
  return await getSpuList(pid, keyword).then((result) => {
    const { data } = result;
    return data;
  });
}

/**
 * 类目选中是数据梳理
 *
 * 选中操作
 * 当前展开的 类目 类型 (+展开， -未选中， v选中，*展开并选中)
 ***  1   2   3   4
 *a*  +   +   +   v
 *b*  -   v   v   -
 *c*  -   v
 *d*  -   -
 ***
 * 一、勾选 4.b
 ***  1   2   3   4
 *a*  +   +   +   v
 *b*  -   v   v   V
 *c*  -   v
 *d*  -   -
 * 二、此时 4 被全选 需要将 3.a 选中
 ***  1   2   3   4
 *a*  +   +   *   v
 *b*  -   v   v   V
 *c*  -   v
 *d*  -   -
 * 三、此时 3 被全选 需要将 2.a 选中， 此步骤与 上一步重复
 ***  1   2   3   4
 *a*  +   *   *   v
 *b*  -   v   v   V
 *c*  -   v
 *d*  -   -
 * 四、此时 状态稳定
 ***  1   2   3   4
 *a*  +   *   *   v
 *b*  -   v   v   V
 *c*  -   v
 *d*  -   -
 * 五、若1被全选，则不需冒泡，此时可通过1的pid或者level做出判断
 *
 * 取消选中操作
 * 初始状态
 ***  1   2   3   4
 *a*  +   *   *   v
 *b*  -   v   v   V
 *c*  -   v
 *d*  -   -
 * 一、勾选 3.1
 ***  1   2   3   4
 *a*  *   *   +   v
 *b*  -   v   v   V
 *c*  -   v
 *d*  -   -
 * 二、3 未被全选 2.a 部分选中, 4.a、4.b 需要置为未选中
 ***  1   2   3   4
 *a*  *   +   +   -
 *b*  -   v   v   -
 *c*  -   v
 *d*  -   -
 * 三、状态稳定
 ***  1   2   3   4
 *a*  *   +   +   -
 *b*  -   v   v   -
 *c*  -   v
 *d*  -   -
 * 总结：
 *  选中时，需要冒泡选择
 *  取消选中时，需要将所有子级元素选中状态置空
 * 新需求：
 *  所有被选中的子元素须被移除
 */

// 数据整理
/**
 * @description: 
 * @param {*} hasBeenSelected
 * @param {*} expands
 * @return {*}
 */
export function checkedData(hasBeenSelected, expands) {
  console.log('整理数据')
  const hasSelected = [...hasBeenSelected];
  const ancestorMap = {};
  // 祖先or父级对照表，为后面半选状态做铺垫
  hasBeenSelected.forEach((item) => {
    (item.ancestorIds || []).forEach((id) => {
      ancestorMap[id] = true;
    });
  });
  // 遍历展开数据
  return expands.map((expand) => {
    // 若选中数据里有一个的id等于展开项id则全选
    // 因为我们这个逻辑是子集全选则只保留父级id
    const allSelected = hasSelected.some(item => expand.id === item.id);
    const list = expand.listData || [];
    let listData = [];
    if (allSelected) {
      listData = list.map((item) => {
        item.selected = true;
        hasSelected.push(item);
        return item;
      });
    } else {
      listData = list.map((item) => {
        // 同上
        if (hasBeenSelected.some(selectedItem => selectedItem.id === item.id)) {
          item.selected = true;
        } else {
          item.selected = false;
          // 非全选再去判断是否属于祖先or父级里的
          item.indeterminate = ancestorMap[item.id] || false;
        }
        return item;
      });
    }

    return { ...expand, allSelected, listData };
  });
}

/**
 * 处理选中一个类目的操作
 * @param {Category}} newOne 选中的对象
 * @param {Category[]} hasBeenSelected 已经被选中的
 * @param {{[key:number]:Category[]}} expands 展开的
 */
export function selectedOne(newOne, hasBeenSelected, expands) {
  console.log('+1')
  const { level, id, pid, hasChildren } = newOne;
  const currentLevelExpand = expands[level - 1] || {};
  let newSelected = hasBeenSelected;
  let currentLevelSelectAll = false;
  const ids = [];

  if (pid !== 0) {
    // 当前level是否已全选
    // 当前展开层级是否全部属于已选中
    currentLevelSelectAll = currentLevelExpand.listData.every((item) => {
      const isSelect = hasBeenSelected.some(it => it.id === item.id);
      if (isSelect) {
        ids.push(item.id);
      }
      // 是全选中的情况还包括当前点击的id
      return isSelect || id === item.id;
    });
  }

  // 如果全选了，相当于执行父级的选中
  if (currentLevelSelectAll) {
    return selectedOne(
      {
        id: pid,
        pid: currentLevelExpand.pid,
        hasChildren: currentLevelExpand.hasChildren,
        level: currentLevelExpand.level,
        hasSpu: currentLevelExpand.hasSpu,
        name: currentLevelExpand.name,
        ancestorIds: currentLevelExpand.ancestorIds,
      },
      newSelected,
      expands
    );
  }

  newSelected.push(newOne);

  // 如果有子元素，应当把选中的子元素的全部移除
  if (hasChildren) {
    newSelected = newSelected.filter(selected => {
      return !selected.ancestorIds.includes(id);
    });
  }
  return newSelected;
}

// 移除一个已选中的元素
export function removeOne(one, hasBeenSelected, expands) {
  console.log('-1')
  const { level, id, ancestorIds } = one;
  // const currentLevelExpand = expands[level - 1] || {};
  // 在已选中数据中找到 删除项祖父id 的索引值（这种情况实际只有父级全选才会索引中！）
  // 如果不存在则直接删除，如果存在则走下面的if
  const pidIndex = hasBeenSelected.findIndex(item => ancestorIds.includes(item.id));

  if (pidIndex !== -1) {
    const ancestor = hasBeenSelected[pidIndex];
    const newSelected = [...hasBeenSelected];
    // 1.删除父级全选
    newSelected.splice(pidIndex, 1);
    let flag = false;
    // 2.遍历其他子项选中
    expands.some((expand) => {
      // 3.为当前父级id时候打开flag执行下边逻辑
      if (!flag && expand.id === ancestor.id) {
        flag = true;
      }
      if (flag) {
        // 跳出循环
        if (expand.level >= level) {
          return true;
        }
        // 遍历其子集
        expand.listData.forEach((item) => {
          // 当前id不push，及不存在祖先id的项都push
          if (item.id !== id && !ancestorIds.includes(item.id)) {
            newSelected.push(item);
          }
        });
      }
      return false;
    });

    return newSelected;
  }
  return hasBeenSelected.filter(item => item.id !== id);
}

// 获取一组 类目的信息 包括祖先
export async function getCategoryDataByIds(ids = []) {
  if (ids.length) {
    const data = await backendBatchAncestors(ids);
    return data.map((item) => {
      item.ancestorIds = item.categoryIds;
      return item;
    });
  }
  return [];
}

export function getSelectCategoryForTableFilterOption() {
  return {
    label: <FormattedMessage id="common.filter.category" defaultMessage="所属分类" />,
    name: 'categoryId',
    type: 'custom',
    labelSpan: 4,
    style: { width: 600 },
    render() {
      return <CategoryFormItemForFilter multi />;
    },
  };
}

export function valueIsEqual(value, prevValue) {
  value = value || [];
  prevValue = prevValue || [];
  if (value.length !== prevValue.length) {
    return false;
  }
  return !value.some(val => !prevValue.some(v => `${val}` === `${v}`));
}
