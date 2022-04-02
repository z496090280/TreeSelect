import React from 'react';
import { openModal } from 'utils/solo-mount';
import { Category } from 'common/category/category';
import { formatMessage } from 'utils/plugin-helper';

/**
 * 选择弹窗
 * @param {Object} options { title: '选择类目',onOk (selected) => (Promise<any> | void),style,className,selectedIds }
 */
export function selectCategoryModal(options = {}) {
  const {
    title = formatMessage({ id: 'common.categoryTitle.select', defaultMessage: '选择类目' }),
    style,
    className,
    onOk = () => {},
    selected,
    multi,
    disabled,
  } = options;

  let tempSelected = selected || [];

  function handleChange(data) {
    tempSelected = data;
  }

  const { hide } = openModal({
    content: <Category multi={multi} disabled={disabled} value={selected} onChange={handleChange} mode="select" />,
    width: 720,
    style,
    title,
    className,
    destroyOnClose: true,
    async onOk() {
      await onOk(tempSelected);
      hide();
    },
  });
}
