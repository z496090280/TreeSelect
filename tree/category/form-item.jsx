/* eslint-disable max-classes-per-file */

import React, { Component } from 'react';
import { getCategoryDataByIds, valueIsEqual } from 'common/category/helper';
import { selectCategoryModal } from 'common/category/modal';
import { FormattedMessage } from 'react-intl';
import { formatMessage } from 'utils/plugin-helper';
import { Button } from 'antd';

function renderSelected(selected) {
  const arr = [];
  const length = selected.length;
  selected.every((item, index) => {
    if (index < 5) {
      arr.push(item.name);
      return true;
    }
    return false;
  });
  return (
    <React.Fragment>
      <span className="selected-category-show">
        {formatMessage(
          { id: 'common.category.hasSelected', defaultMessage: '已选择{value}' },
          { value: arr.join(', ') }
        )}
      </span>
      {length > 5 ? (
        <FormattedMessage id="common.category.andEtc" defaultMessage="...等{length}个类目" values={{ length }} />
      ) : null}
    </React.Fragment>
  );
}

export class CategoryFormItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      status: 'done',
      value: props.value,
      selected: [],
    };
  }

  static defaultProps = {
    multi: true,
    onChange() {},
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    const { value: nextValue = [] } = nextProps;
    const { value: prevValue = [], selected } = prevState;
    if (valueIsEqual(nextValue, prevValue)) {
      return prevState;
    }
    const isEqual = valueIsEqual(nextValue, selected.map((item) => `${item.id}`));

    return {
      value: nextValue,
      selected: isEqual ? selected : [],
      status: isEqual ? 'done' : 'init',
    };
  }

  componentDidMount() {
    const { value = [] } = this.props;
    if (value.length) {
      this.setState({ status: 'init' });
    }
  }

  async getSelectedData() {

    console.log('getSelectedData')
    const selected = await getCategoryDataByIds(this.props.value);
    this.setState({ selected, status: 'done' }, () => {
      if (this.waitingOpenModal) {
        this.openModal();
      }
    });
  }

  componentDidUpdate() {
    if (this.state.status === 'init') {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        status: 'pending',
      });
      this.getSelectedData();
    }
  }

  openModal = () => {
    const { selected, status } = this.state;
    if (status !== 'done') {
      this.waitingOpenModal = true;
      return;
    }
    selectCategoryModal({
      selected,
      disabled: this.props.disabled,
      multi: true,
      onOk: (newSelected) => {
        const newValue = newSelected.map((item) => item.id);
        this.setState({ selected: newSelected }, () => {
          this.props.onChange(newValue);
        });
      },
    });
  };

  render() {
    const { selected } = this.state;
    const { buttonType = 'a', buttonProps } = this.props;
    const buttonText = selected.length
      ? { id: 'common.categoryTitle.reselect', defaultMessage: '重新选择' }
      : { id: 'common.categoryTitle.select', defaultMessage: '选择类目' };
    return (
      <div>
        {buttonType === 'button' ? (
          <Button {...buttonProps} onClick={this.openModal}>
            <FormattedMessage {...buttonText} />
          </Button>
        ) : (
          <a className="mr4" onClick={this.openModal}>
            <FormattedMessage {...buttonText} />
          </a>
        )}
        {selected.length ? renderSelected(selected) : null}
      </div>
    );
  }
}

export class CategoryFormItemForFilter extends Component {
  render() {
    const { value, onChange, ...props } = this.props;
    return (
      <CategoryFormItem
        {...props}
        value={value ? value.split('_') : []}
        onChange={(selected) => onChange(selected.join('_'))}
      />
    );
  }
}
