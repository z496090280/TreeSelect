/*
 * @Author: lee
 * @Date: 2022-04-02 17:19:03
 * @LastEditTime: 2022-04-02 17:23:01
 */
import React, { useState, useEffect } from 'react';
import { Row, Col, Card } from 'antd';
import TagsCondition from './component'
import { Pagination } from 'antd';
import { PAGINATION_OPTIONS, PAGINATION, CHANNELTYPES } from 'components/common/constants'
import { browserHistory  } from '@terminus/mall-utils';
import _pick from 'lodash/pick';
import { useCommonData } from '@terminus/mall-base';

import { channelFindCities, findChannelTypes, getPagingList } from 'components/channelMgt/services';
import 'channelMgt/index.scss';

const { Meta } = Card;

// 渠道申请入驻列表
export default function ChannelApplyPage(props) {
  const [data, setData] = useState({});
  const [types, setTypes] = useState([]);
  const [cities, setCities] = useState([]);
  const commonData = useCommonData()
  let vendorId = commonData.user.affiliations.filter(item => {
    if (item.type == 'SELLER') {
      return item
    }
  })
  const dataSrc = [
    {
      "screenTypeId": "1",
      "screenTypeName": "渠道类型",
      "values": [
        {
          "id": "",
          "name": "全部"
        }
      ]
    },
    {
      "screenTypeId": "2",
      "screenTypeName": "所在地区",
      "values": [
        {
          "id": "",
          "name": "全部"
        }
      ]
    },
  ]
  const [conditionData, setConditionData] = useState([]);
  const [queryParams, setQueryParams] = useState({
    pageNo: PAGINATION.pageNo,
    pageSize: PAGINATION.pageSize,
    // pageSize: 1,
    channelType: '',
    cityId: '',
    shopId: vendorId[0].shopId
  })

  useEffect(() => {
    getCities()
    getTypes()
    refreshData(queryParams)
  }, [])

  useEffect(() => {
    if (types.length && cities.length) {
      dataSrc[0].values = dataSrc[0].values.concat(types)
      dataSrc[1].values = dataSrc[1].values.concat(cities)
      setConditionData(dataSrc)
    }
  }, [types, cities])



  function getCities() {
    channelFindCities().then(res => {
      if (res.success) {
        setCities(res.result)
      }
    }).catch(err => console.log(err))
  }

  function getTypes() {
    findChannelTypes().then(res => {
      if (res.success) {
        setTypes(res.result)
      }
    }).catch(err => console.log(err))
  }

  function getPaging(query) {
    getPagingList(query).then(res => {
      if (res.success) {
        setData(res.result)
      }
    }).catch(err => console.log(err))
  }


  function refreshData(query) {
    getPaging(query)
  }

  function handleChangeItems(value) {
    let one = value['0']
    let two = value['1']
    let query = {
      ...queryParams,
      channelType: one,
      cityId: two,
      pageNo: 1
    }
    setQueryParams(query)
    refreshData(query)
  }

  function handleChange(page, size) {
    let query = {
      ...queryParams,
      pageNo: page
    }
    setQueryParams(query)
    refreshData(query)
  }

  function handleToDetail(id, order) {
    browserHistory.push({
      pathname: `/channel-detail/${id}`,
      state: order
    });
  }

  const { total } = data
  const { pageNo, pageSize } = queryParams
  return (
    <div>
      <TagsCondition
        data={conditionData}
        multiple={false}
        onSelectItems={handleChangeItems}
      />

      <div className="channel-content">
        <Row gutter={16}>
          {
            data.data && data.data.map((item, idx) => {
              let type = CHANNELTYPES[item.channelType]
              let text = item.entryFee === 0 ? '限时免费' : `${item.entryFee}元/年`
              return <Col className="gutter-row" span={6} key={idx}>
                <Card
                  className="gutter-box"
                  hoverable
                  style={{ width: 240 }}
                  cover={<img alt="example" src={item.mainImage} />}
                  onClick={() => handleToDetail(item.id, item)}
                >
                  <Meta title={`${item.city}-${type}`} description={text} />
                </Card>
              </Col>
            })
          }
        </Row>
      </div>

      {
        data.data ? <Pagination
          {...PAGINATION_OPTIONS}
          total={total}
          current={+pageNo}
          pageSize={+pageSize}
          onChange={handleChange}
        /> : null
      }
    </div>
  )
}
