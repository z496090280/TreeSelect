<!--
 * @Author: lee
 * @Date: 2022-04-02 14:28:13
 * @LastEditTime: 2022-04-02 17:23:59
-->
<center>🌲这是一个多级选择树插件🌲</center>

![image](https://github.com/z496090280/TreeSelect/blob/master/img/1648889432982720%202.gif?raw=true "树选择")

首先接口方面是一级级获取，并非一次性拉取。
这样做有利于加载优化，其中ancestorIds字段再「编辑」情况下需要后端带出

1级别数据如下：
<pre>
{
    "id":1143, 
    "pid":0,  <font color="red">// 父级id</font> 
    "name":"饮料酒水",
    "level":1, 
    "hasChildren":true, <font color="red">// 是否有子集</font>
    "hasSpu":false, <font color="green">// 其他需求字段</font>
    "updatedBy":"f7974635a7974b829d709bc865e6882d",
    "cateCode":null,
    "sourceType":null,
    "ancestorIds": [] <font color="blue">// 此字段为前端自己添加，便于查找祖父实现全/半选，多个祖先</font>
},
</pre>

2级别数据如下
<pre>
{
    "id":1144,
    "pid":1143,
    "name":"矿泉水/纯净水",
    "level":2,
    "hasChildren":true,
    "hasSpu":false,
    "updatedBy":"4fa6cece1cdd47509312541151f074a3",
    "cateCode":null,
    "sourceType":null
},
</pre>
以此类推。。。

我们需要做三级选择必须要明确3个参数的数据贯彻始终

1.item  即点击当行数据

2.selected  即选中的平铺数据

3.expands   即展开数据

    注意：

    这个参数3最为重要，逻辑要明白，因为我们需要半选逻辑，所以是每点击一下子集项目，是整个tree都需要去做更新
    所以我们触发了checkedData函数维护expands保持组件更新

    其中expands[0]级别下listData存放1级数据

    expands[1]为选中的1级数据某项，listData为其子集以此类推
    


另外需要一个回显接口也就是查询已选中的接口，
返回数据是<font color="red">平铺</font>的已选中数据
ancestorIds字段需带上

---
## *主要函数均在category.jsx及helper.jsx里面，其他弹窗类不做赘述*



