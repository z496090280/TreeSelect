import React from "react";
import { Tag } from 'antd';

function Item(props) {
  const { color, order} = props;
  
  function changeItem() {
    const { changeSrc } = props
    if(changeSrc)
    changeSrc(order.uuid)
  }

  return(
    <>
      <Tag className="tag-item" onClick={changeItem} color={color}>{order.name}</Tag>
    </>
  )
}

export default Item