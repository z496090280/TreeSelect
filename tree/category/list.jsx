/* eslint-disable react/no-did-update-set-state */
import React, { Component } from 'react';
import { Input, message } from 'antd';
import {
  backendAdd, frontedAdd, backendDelete, frontendDelete,
  channelAdd,
  channelDelete, getChannelListByPid,
} from 'common/category/service';
import { CategoryItem, ManageItem } from 'common/category/item';
import Icon from 'common/icon';
import { FormattedMessage } from 'react-intl';
import { CATEGORY_LEVEL_LABEL } from 'common/constants';
import { formatMessage } from 'utils/plugin-helper';
import { AuthConsumer } from '@terminus/react-auth';
import { showConfirmDialog } from 'common/helper';

/**
 * props<T>
 *  mode: select | backend | frontend
 *  refresh: () => void
 *  loading: (isLoading: boolean)=> void
 *  pid: number
 *  isSpu: boolean
 *  actives: T[]
 *  onActive: (data: T) => void
 */
export class CategoryList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      keyword: '',
      value: '',
      pid: props.pid,
      add: '',
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.pid !== prevState.pid) {
      nextProps.getData(nextProps.pid);
      return { pid: nextProps.pid };
    }
    return prevState;
  }

  timer = null;

  componentDidMount() {
    this.props.getData();
  }

  /**
   * 类目的筛选完全通过前端处理，
   * spu的筛选根使用后端查询
   */
  handleFilterInput = e => {
    this.setState({ value: e.target.value }, () => {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.filter();
      }, 500);
    });
  };

  filter() {
    const { value } = this.state;
    this.setState({ keyword: value });
    if (this.props.isSpu) {
      this.props.getData(value);
    }
  }

  // 如果当前选中的被删除，将选中状态往前移一级
  activePrevLevel = () => {
    const { onActive, actives } = this.props;
    onActive(actives[actives.length - 2]);
  };

  // 增加一个选项
  addItem = () => {
    const { mode, pid, loading, getData, list } = this.props;
    const { add } = this.state;
    const realName = add && add.trim();
    if (!realName) {
      message.warning(
        formatMessage({ id: 'common.category.inputNameTip', defaultMessage: '请输入名称' })
      );
      return;
    }

    let addRequest = frontedAdd;
    if (mode === 'backend') {
      addRequest = backendAdd;
    } else if (mode === 'channel') {
      addRequest = channelAdd;
    }
    loading(true);
    addRequest({ pid, name: realName })
      .then(() => {
        this.setState({ add: '' }, () => {
          if (list.length === 0) {
            // 刷新上一级
            this.props.refreshLevel(this.props.level - 1);
          }
          getData();
        });
      })
      .catch(() => {
        loading(false);
        this.setState({ add: '' });
      });
  };

  // 删除一个类目
  // 如果active则需要删除actives中的记录
  deleteItem = async (id, active) => {
    let resData = await getChannelListByPid(id);
    if (resData.length > 0) {
      message.warning('该类目下有二级类目不允许删除!');
    } else {
      showConfirmDialog(
        formatMessage({ id: 'common.category.deleteTitle', defaultMessage: '温馨提示' }),
        formatMessage({
          id: 'common.category.deleteConfirmTip',
          defaultMessage: '确认删除吗？删除后不可恢复',
        }),
        () => {
          const { loading, refreshLevel, level, mode, getData, list } = this.props;
          loading(true);
          let deleteRequest = frontendDelete;
          if (mode === 'backend') {
            deleteRequest = backendDelete;
          } else if (mode === 'channel') {
            deleteRequest = channelDelete;
          }
          deleteRequest(id)
            .then(() => {
              if (list.length === 1) {
                refreshLevel(level - 1);
              }
              getData();
              if (active) {
                this.activePrevLevel();
              }
            })
            .catch(() => getData());
        }
      );
    }
  };

  /**
   * 渲染列表
   */
  renderItemList() {
    const {
      onActive,
      actives,
      mode,
      loading,
      list = [],
      getData,
      multi,
      onSelect,
      disabled,
    } = this.props;
    const { keyword } = this.state;
    const Item = mode === 'select' ? CategoryItem : ManageItem;
    const result = [];
    list.forEach(item => {
      if (!keyword || item.name.includes(keyword)) {
        const { id } = item;
        const isActive = actives.some(active => active.id === id);
        result.push(
          <Item
            key={id}
            active={isActive}
            item={item}
            onActive={onActive}
            onSelect={onSelect}
            disabled={disabled}
            mode={mode}
            multi={multi}
            loading={loading}
            refresh={getData}
            activePrevLevel={this.activePrevLevel}
            deleteOne={() => this.deleteItem(id, isActive)}
          />
        );
      }
    });
    return result;
  }

  addonAfter = (
    <a onClick={this.addItem}>
      <FormattedMessage id="common.btn.add" defaultMessage="添加" />
    </a>
  );

  render() {
    const { level, isSpu, mode } = this.props;
    const { add, value } = this.state;
    const isSelect = mode === 'select';
    let addAuth = null;
    if (mode === 'backend') {
      addAuth = 'backendCategory.add';
    } else if (mode === 'channel') {
      addAuth = 'itemsChannel.add';
    } else {
      addAuth = 'frontendCategory.add';
    }
    return (
      <div className="category-list">
        <div className="category-header">
          <h3>{isSpu ? 'SPU' : <FormattedMessage {...CATEGORY_LEVEL_LABEL[level]} />}</h3>
          <div className="search-wrap">
            <Input
              value={value}
              placeholder={formatMessage({
                id: 'common.category.search.placeholder',
                defaultMessage: '搜索关键字',
              })}
              onChange={this.handleFilterInput}
              suffix={<Icon type="icon-tmall-search" />}
            />
          </div>
        </div>
        <div className="category-body">
          <ul className={`category-list-wrap${isSelect ? '' : ' with-select'}`}>
            {this.renderItemList()}
          </ul>
          {isSelect ? null : (
            <AuthConsumer
              name={addAuth}
            >
              <div className="category-add">
                <Input
                  value={add}
                  onChange={e => this.setState({ add: e.target.value })}
                  onPressEnter={this.addItem}
                  addonAfter={this.addonAfter}
                  maxLength={20}
                />
              </div>
            </AuthConsumer>
          )}
        </div>
      </div>
    );
  }
}
