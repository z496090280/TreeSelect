import React, { useEffect, useState } from "react";
import TagItem from './children/tagItem'
import { Row, Col } from 'antd'
import _cloneDeep from 'lodash/cloneDeep';

import '../index.scss'

// 🌰数据
// const dataSrc = [
//   {
//     "screenTypeId": "1",
//     "screenTypeName": "渠道类型",
//     "values": [
//       {
//         "id": "",
//         "name": "全部"
//       }
//     ]
//   },
//   {
//     "screenTypeId": "2",
//     "screenTypeName": "所在地区",
//     "values": [
//       {
//         "id": "",
//         "name": "全部"
//       }
//     ]
//   },
// ]

function TagsCondition(props) {
  const { data, multiple, onSelectItems } = props;
  const [dataSrc, setDataSrc] = useState([])
  const [renderCount, setRenderCount] = useState(0)
  const [isMore, setIsMore] = useState(false)

  useEffect(() => {
    handleBackEndData(data)
  }, [data])

  useEffect(() => {
      let eles = document.querySelectorAll('.element-ldp')
      handleMore(eles)
  }, [renderCount])

  // 前端整理必要字段
  function handleBackEndData(data) {
    
    let uuid = 0
    let idx = -1
    let frontData = data && data.map(item => {
      return {
        ...item,
        idx: idx++,
        values: item.values.map((val) => {
          return {
            ...val,
            uuid: `${idx}_${uuid++}`, // 便于找索引
            selected: val.selected ? val.selected : false // 选中状态
          }
        })
      }
    })
    setDataSrc(frontData)
    setRenderCount(renderCount => renderCount+1)
  }

  function handleMore(doms) {
    // 判断是否显示 展开/收起
    for(let i = 0; i < doms.length; i++) {
      let el = doms[i]
      if (el.children[el.children.length - 1].offsetTop > 22) {
        setIsMore(true)
        break
      }  
    }
  }

  function handleChangeSrc(uuid) {
    // 触发选择逻辑
    handleSelect(uuid, multiple)
    
  }
  function handleSelect(uuid, multiple){
    let idx = uuid.split('_') 
    let handleData = dataSrc[idx[0]].values && dataSrc[idx[0]].values.map(item => {
      return {
        ...item,
        selected: uuid === item.uuid ? !(item.selected) : multiple ? item.selected : false
      }
    })

    let cloneData = _cloneDeep(dataSrc)
    cloneData[idx[0]].values = handleData

    setDataSrc(cloneData)

    handleParams(cloneData)
  }

  function handleParams(data){
    let newData ={}
    data.map((item, idx) => {
      newData[idx] = item.values.reduce(function(total, current){
        if(current.selected) total.push(current.id)
        return total
      } , [])
    })
    // console.log(newData)
    // fix:编辑重现已选中，携带第二个完整参数
    onSelectItems(newData, data)
  }

  function renderFilters() {
    return dataSrc.map((item, idx) => {
      return <Row key={idx}>
        <Col span={4} className="tag-titile">
          {item.screenTypeName}:
        </Col>
        <Col span={20}  className="element-ldp">
          
          {
            item.values
            ? item.values.map((value, index) => {
              return <TagItem order={value} color={value.selected ? 'blue' : ''} changeSrc={handleChangeSrc}  key={index} />
            })
            : null
          }
        </Col>
      </Row>
    })
  }

  return (
    <div className="tagsCondition">

      <input id="check" type="checkbox"></input>
      <label htmlFor="check" className="check-in el-icon-arrow-down">{isMore ? '更多' : ''} </label>
      <label htmlFor="check" className="check-out el-icon-arrow-up">{isMore ? '收起' : ''} </label>
      {
        dataSrc.length
        ? renderFilters()
        : null
      }

    </div>
  )
}

export default TagsCondition;