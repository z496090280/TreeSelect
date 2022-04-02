/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState, useEffect, createRef } from 'react';
import Icon from 'common/icon';
import { Input, Checkbox, message } from 'antd';
import { ImageComp } from 'common/image';
import image from 'images/image.png';
import { upload } from 'common/upload';
import { backendRename, frontendRename, channelRename, changeLogo } from 'common/category/service';
import { FormattedMessage } from 'react-intl';
import { formatMessage } from 'utils/plugin-helper';
import { AuthConsumer } from '@terminus/react-auth';

// 因为使用频率问题，将后台类目管理的item单独拎出去，以提高选择类目的执行效率

/**
 * props<T>
 *  refresh: () => void
 *  mode: select
 *  loading: (isLoading: boolean)=> void
 *  onActive: (data: T) => void
 *  active: boolean
 *  item: T
 */
export function CategoryItem(props) {
  const { item, active, onActive, multi, onSelect, disabled } = props;
  const { name, hasChildren, itemProps = {}, selected, indeterminate } = item;

  function handleSelected(e) {
    e.stopPropagation();
    onSelect(item, e.target.checked);
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <li className={`category-item${active ? ' active' : ''}`} onClick={() => onActive(item)}>
      <div {...itemProps} className={`category-item-name ${itemProps.className ? itemProps.className : ''}`}>
        {multi ? (
          <Checkbox
            style={{ marginRight: 4 }}
            checked={selected}
            indeterminate={selected ? false : indeterminate}
            onChange={handleSelected}
            disabled={disabled}
          />
        ) : null}
        {name}
      </div>
      <div className="operation-wrap">{hasChildren ? <Icon type="icon-tmall-right" /> : null}</div>
    </li>
  );
}

/**
 * props<T>
 *  mode: backend | frontend
 *  refresh: () => void∏
 *  loading: (isLoading: boolean)=> void
 *  onActive: (data: T) => void
 *  active: boolean
 *  item: T
 */
export function ManageItem(props) {
  const { item, active, onActive, mode, loading, refresh, deleteOne } = props;
  const { name, hasChildren, logo, id } = item;

  const [value, setValue] = useState(name);
  const [onRename, setOnRename] = useState(false);

  const ref = createRef();

  // 修改名字
  function rename() {
    const realName = value && value.trim();

    if (!realName) {
      message.error(formatMessage({ id: 'common.category.inputNameTip', defaultMessage: '请输入名称' }));
      return;
    }
    loading(true);
    let renameRequest = frontendRename;
    if (mode === 'backend') {
      renameRequest = backendRename;
    } else if (mode === 'channel') {
      renameRequest = channelRename;
    }
    renameRequest(id, realName)
      .then(() => {
        setOnRename(false);
        refresh();
      })
      .catch(() => refresh());
  }

  function stopPropagation(e) {
    e.stopPropagation();
  }

  async function uploadLogo(e) {
    const file = e.target.files[0];
    loading(true);
    try {
      const src = await upload(file);
      await changeLogo({ id, logo: src });
      refresh();
      // eslint-disable-next-line no-shadow
    } catch (e) {
      loading(false);
    }
  }

  // 取消编辑状态
  useEffect(() => {
    function hideRename(e) {
      if (ref.current) {
        const position = ref.current.compareDocumentPosition(e.target);
        if (position >= 16 && position < 32) {
          return;
        }
      }
      setValue(name);
      setOnRename(false);
    }
    if (onRename) {
      document.body.addEventListener('click', hideRename);
      return () => {
        document.body.removeEventListener('click', hideRename);
      };
    }
    return undefined;
  }, [name, onRename, ref]);

  if (onRename) {
    const addonAfter = (
      <a onClick={rename}>
        <FormattedMessage id="common.btn.modify" defaultMessage="修改" />
      </a>
    );
    return (
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
      <li className="category-rename" ref={ref}>
        <Input
          pattern="[^\s]"
          value={value}
          onClick={stopPropagation}
          onPressEnter={rename}
          onChange={e => setValue(e.target.value)}
          addonAfter={addonAfter}
          maxLength={20}
        />
      </li>
    );
  }

  const isFrontend = mode === 'frontend';

  return (
    <li className={`category-item manage-item${active ? ' active' : ''}`} onClick={() => onActive(item)}>
      <div className="category-item-name">
        {isFrontend ? (
          <AuthConsumer name="frontendCategory.editCategoryLogo">
            <label className="img-con" onClick={stopPropagation}>
              <input type="file" onChange={uploadLogo} />
              <ImageComp src={logo || image} width={20} height={20} />
              <Icon type={`${logo ? 'icon-tmall-bianji' : 'icon-tmall-tianjia'}`} />
            </label>
          </AuthConsumer>
        ) : null}
        {name}
      </div>
      <div className="operation-wrap" onClick={e => e.stopPropagation()}>
        <AuthConsumer name={isFrontend ? 'frontendCategory.rename' : 'backendCategory.rename'}>
          <Icon className="icon-operation mr4" onClick={() => setOnRename(true)} type="icon-tmall-bianji" />
        </AuthConsumer>
        {hasChildren ? (
          <Icon className="icon-next" type="icon-tmall-right" />
        ) : (
          <AuthConsumer name={isFrontend ? 'frontendCategory.delete' : 'backendCategory.delete'}>
            <Icon className="icon-operation" onClick={deleteOne} type="icon-tmall-shanchu" />
          </AuthConsumer>
        )}
      </div>
    </li>
  );
}
