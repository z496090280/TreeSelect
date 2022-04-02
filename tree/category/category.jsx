/* eslint-disable no-param-reassign */
import { Spin } from 'antd';
import PropTypes from 'prop-types';
import React, { PureComponent, useState } from 'react';
import { CategoryList } from 'common/category/list';
import { _DEV_ } from 'common/constants';
import {
  GET_DATA_MAP,
  getActivesFromExpands,
  checkedData,
  selectedOne,
  removeOne,
} from 'common/category/helper';
import 'common/category/index.scss';
import { FormattedMessage } from 'react-intl';

/**
 * 类目选择
 * 支持多选单选
 * 支持自定义 获取数据 getNextLevelData
 * 支持带有spu的类目选择
 * 支持选择其他类 层级 数据【务必包含 children, hasChildren, id, name, 等信息】
 * 通过数据控制单个name显示的props<Props of span>
 *    demoData: getNextLevel() =>  [{ id: 1, name: '名称', itemProps: { style: { color: 'red' }, onClick()=>alert('Hello world')  } }]
 * 支持children传入，当children传入 仅当 mode === 'select' && !multi children 会渲染到右边
 */
export class Category extends PureComponent {
  constructor(props) {
    super(props);
    const { multi, value } = props;

    const expands = [
      {
        id: 0,
        level: 0,
        listData: [],
        allSelected: false,
      },
    ];
    const actives = [];

    if (!multi && value && value.length) {
      const vLen = value.length;
      value.forEach((item, index) => {
        if (index < vLen - 1) {
          expands.push(item);
        }
        actives.push(item);
      });
    }

    this.state = {
      // 显示父类目
      expands,
      // 展开选中的类目
      actives,
      // 选中的类目, multi 时
      selected: (multi ? [...value] : []) || [],
      isLoading: true,
    };
  }

  static defaultProps = {
    maxLevel: 4,
    withSpu: false,
    onChange() { },
    multi: false,
  };

  /**
   * 处理选中下一级事件
   */
  handleActive = (category, isSpu) => {
    const { maxLevel, withSpu, onChange, mode = 'select', multi } = this.props;
    const { expands } = this.state;
    const { level: categoryLevel, hasChildren, hasSpu } = category;
    const expandLength = expands.length;
    let newActives = [];
    let newExpands = expands;
    if (!category) {
      this.setState({
        actives: [],
        expands: [expands[0]],
      });
      return;
    }

    const isSelectMode = mode === 'select';

    const canExpand = hasChildren || (withSpu && hasSpu) || !isSelectMode;
    const maxLevelWithSpu = (withSpu ? 1 : 0) + maxLevel;

    // 通过判断 categoryId 区分选中的是否是spu
    const level = isSpu ? expandLength : categoryLevel;
    /**
     * 已经展开了 n级 类目 expandLength
     * 选择了第n级的类目 level
     * 判断：
     *   如果已展开的 数量 与 当前选中类目级别相等
     *   需要根据情况增加一个展开类目
     */
    if (expandLength === level) {
      /**
       * 当前类目级别小于最大级别类目限制
       *  或者
       * 当前支持选择spu，且下一级支持选择spu, 则展开一组
       */
      if (maxLevelWithSpu > level && canExpand) {
        newExpands = [...expands, category];
        newActives = getActivesFromExpands(newExpands);
      } else {
        newActives = getActivesFromExpands(expands, category);
      }
    } else {
      newExpands = [];
      expands.some((expand, idx) => {
        if (idx < level) {
          newExpands.push(expand);
          return false;
        }
        if (idx === level) {
          if (canExpand) {
            newExpands.push(category.id === expand.id ? expand : category);
          }
          return false;
        }
        return true;
      });
      newActives = getActivesFromExpands(newExpands, !canExpand && category);
    }
    if (!multi) {
      onChange(newActives);
    }
    this.setState({
      actives: newActives,
      expands: newExpands,
    });
  };

  // 选中，取消的情况
  handleSelect = (category, checked) => {
    const { expands, selected } = this.state;
    const newSelected = checked ? selectedOne(category, selected, expands) : removeOne(category, selected, expands);
    const newExpands = checkedData(newSelected, expands);
    this.setState({ selected: newSelected, expands: newExpands }, () => {
      this.props.onChange(newSelected);
    });
  };

  // 获取 list 数据
  getData = async (pid, isSpu, keyword) => {
    const { getListByPid, mode = 'select', multi, isBBC } = this.props;

    const newExpands = [];
    if (!keyword) {
      this.setState({ isLoading: true });
    }

    const dataRequest = getListByPid || GET_DATA_MAP[mode];
    // || (isSpu ? getSpu : GET_DATA_MAP[mode]); // 后端说没有SPU

    try {
      let listData = null
      if (isBBC === true) {
        listData = await GET_DATA_MAP['isBBC'](pid)
      } else {
        listData = mode === 'frontend' ? await dataRequest(pid, this.props.shopId) : await dataRequest(pid, keyword);
      }

      const { expands, selected } = this.state;
      console.log(selected,'selected')
      const ancestorIds = [];
      expands.forEach((item) => {
        // 因为expands的数据逻辑原因（详见自述文件）；id非0则为其添加祖父id集合
        if (item.id) {
          ancestorIds.push(item.id);
        }
        // 对应上pid则为其添加接口数据
        if (item.id === pid) {
          newExpands.push({ ...item, listData });
        } else {
          newExpands.push(item);
        }
      });
      if (multi) {
        // eslint-disable-next-line no-return-assign
        // 添加上面处理好的祖父id集合
        listData.forEach((item) => (item.ancestorIds = ancestorIds));
      }
      this.setState({
        expands: multi && selected.length ? checkedData(selected, newExpands) : newExpands,
        isLoading: false,
      });
    } catch (e) {
      this.setState({ isLoading: false });
    }
  };

  /**
   * 加载中状态切换
   */
  loading = (isLoading) => {
    this.setState({ isLoading });
  };

  refreshLevel = (level) => {
    const levelNo = parseInt(level, 10);
    if (levelNo > 0) {
      const expand = this.state.expands[levelNo - 1];
      if (expand) {
        this.getData(expand.id, expand.categoryId);
      }
    }
  };

  render() {
    const { multi = false, mode = 'select', children, disabled, isBBC } = this.props;
    const { expands, actives, isLoading, selected } = this.state;
    return (
      <Spin spinning={isLoading}>
        <div className="category">
          {expands.map((parentCategory) => {
            const { id, level: parentLevel, hasChildren, hasSpu, listData = [] } = parentCategory;
            const isSpu = hasSpu && !hasChildren && mode === 'select';
            return (
              <CategoryList
                key={id}
                pid={id}
                mode={mode}
                isBBC={isBBC}
                multi={multi}
                level={parentLevel + 1}
                disabled={disabled}
                loading={this.loading}
                actives={actives}
                selected={selected}
                isSpu={isSpu && mode === 'select'}
                onActive={(data) => this.handleActive(data, isSpu)}
                refreshLevel={this.refreshLevel}
                list={listData}
                getData={(keyword) => this.getData(id, isSpu, keyword)}
                onSelect={this.handleSelect}
              />
            );
          })}
          {!multi && children ? <div className="edit-area">{children}</div> : null}
        </div>
      </Spin>
    );
  }
}

if (_DEV_) {
  Category.propsType = {
    maxLevel: PropTypes.number,
    withSpu: PropTypes.bool,
    onChange: PropTypes.func,
    multi: PropTypes.bool,
    getNextLevelData: PropTypes.func,
    mode: PropTypes.string,
  };
}

/**
 * 生成一个带有选中类目的组件
 * @param {Component} Component 组件
 * @param { getListByPid,mode,title} options 配置
 *
 * 为组件增加
 *  selected:  category[]
 *  currentCategory: category
 * 属性
 */
export function getWrappedComponentWithCategory(Component, options = {}) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { mode, getListByPid, title, maxLevel, isBBC } = options;


  return function WrappedComponentWithCategory(props) {
    const [actives, setActives] = useState([]);
    const currentCategory = actives[actives.length - 1];
    const ref = React.createRef();

    function refreshLevel(category) {
      // eslint-disable-next-line no-nested-ternary
      const level = category ? category.level : currentCategory ? currentCategory.level : undefined;
      if (ref.current && level) {
        ref.current.refreshLevel(level);
      }
    }
    return (
      <React.Fragment>
        <div className="category-header">
          <span className="category-title">{title}</span>
          <span className="category-id-desc">
            <em className="has-colon">
              <FormattedMessage id="common.category.currentCategoryId" defaultMessage="当前类目ID" />
            </em>
            {[currentCategory ? currentCategory.id : '']}
          </span>
        </div>
        <Category
          ref={ref}
          isBBC={isBBC}
          mode={mode}
          shopId={props.shopId}
          maxLevel={maxLevel}
          getListByPid={getListByPid}
          onChange={(data) => setActives(data)}
        >
          <Component {...props} refreshLevel={refreshLevel} selected={actives} currentCategory={currentCategory} />
        </Category>
      </React.Fragment>
    );
  };
}
