# KYSS 전체 메뉴 · API 맵

- 대상: https://www.kyss.co.kr/ (국양로지텍 KYSS)
- 계정 기준: 안계문 / 국양로지텍(주) — menuMap은 **이 계정에 보이는 메뉴만** 포함
- 메뉴 181개(그룹 포함), 화면 연결 메뉴 146개
- 프론트 소스 전수 분석: 청크 1153개 / 화면모듈(req2svr) 528개 / API 엔드포인트 1333개 / 호출정의 1770개

각 화면 폴더의 `req2svr.js`가 그 화면의 서버 호출을 모두 정의한다. 아래 `함수 → METHOD 경로` 는 그 파일에서 추출한 것이다.

---

## TMS  
`TMS`

### 간편 오더  
`SIM`

#### 간편 오더 조회  
`ordSimSearch` · 화면 `order/door/simple/ordSimSearch`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/orderList/selectCstmOrderList` |
| `searchCntr` | POST | `/api/orderList/selectSimOrderCntr` |

#### 간편 오더 등록  
`ordSimRequest` · 화면 `order/door/simple/ordSimRequest`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `searchOrder` | POST | `/api/order/selectSimpleOrder` |
| `save` | POST | `/api/order/saveSimpleOrder` |
| `delete` | POST | `/api/order/deleteSimpleOrder` |
| `selectCommonPopupPic` | POST | `/api/cms/popup/selectCommonPopupPic` |
| `getExportEtrans` | POST | `/api/order/getExportEtrans` |
| `getExportCargoView` | POST | `/api/order/getExportCargoView` |
| `getImportEtrans` | POST | `/api/order/getImportEtrans` |
| `getImportCargoView` | POST | `/api/order/getImportCargoView` |
| `MailSend` | POST | `/api/order/sendSimpleOrder` |

### 수출 오더  
`EO`

#### 수출오더조회  
`EO_100010` · 화면 `order/door/export/orderSearch`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/orderList/selectCstmOrderList` |
| `searchCntr` | POST | `/api/orderList/selectCstmExportOrderCntr` |
| `delete` | POST | `/api/order/deleteExportOrder` |

#### 수출오더등록  
`EO_100030` · 화면 `order/door/export/orderRequest`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/orderList/selectCstmOrderList` |
| `searchCntr` | POST | `/api/orderList/selectCstmExportOrderCntr` |
| `searchOrder` | POST | `/api/order/selectCstmExportOrder` |
| `tmpSave` | POST | `/api/order/saveUserOrder` |
| `save` | POST | `/api/order/saveCstmExportOrder` |
| `deleteOrder` | POST | `/api/order/deleteExportOrder` |
| `deleteUserOrder` | POST | `/api/order/deleteUserOrder` |
| `confirm` | POST | `/api/order/confirmExportOrder` |
| `getExportEtrans` | POST | `/api/order/getExportEtrans` |
| `getExportCargoView` | POST | `/api/order/getExportCargoView` |
| `selectCommonPopupPic` | POST | `/api/cms/popup/selectCommonPopupPic` |
| `updateOrderFileDoc` | POST | `/api/order/updateOrderFileDoc` |
| `selectOrderTemplateDetail` | POST | `/api/orderTemplate/selectOrderTemplateDetail` |
| `validUnpayUser` | POST | `/api/order/validUnpayUser` |

#### 고객사 수출 오더 조회  
`EO_100040` · 화면 `order/door/export/orderSearchMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/orderList/selectExportOrderList` |
| `searchCntr` | POST | `/api/orderList/selectExportOrderCntr` |
| `delete` | POST | `/api/order/deleteExportOrder` |
| `searchOrderBook` | POST | `/api/orderList/selectOrderBookList` |

#### 고객사 수출 오더 상세  
`EO_100020` · 화면 `order/door/export/orderRequestMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/orderList/selectExportOrderList` |
| `searchCntr` | POST | `/api/orderList/selectExportOrderCntr` |
| `searchOrder` | POST | `/api/order/selectExportOrder` |
| `save` | POST | `/api/order/saveExportOrder` |
| `delete` | POST | `/api/order/deleteExportOrder` |
| `confirm` | POST | `/api/order/confirmExportOrder` |
| `getExportEtrans` | POST | `/api/order/getExportEtrans` |
| `getExportCargoView` | POST | `/api/order/getExportCargoView` |
| `selectCommonPopupBilling` | POST | `/api/cms/popup/selectCommonPopupBilling` |
| `updateOrderFileDoc` | POST | `/api/order/updateOrderFileDoc` |
| `selectBillngTariffList` | POST | `/api/order/selectBillngTariffList` |
| `selectBillPic` | POST | `/api/sm/generalBilling/selectBillingClosingBillPicList` |
| `MailSend` | POST | `/api/order/sendCofirmMail` |

### 수입 오더  
`IO`

#### 수입오더조회  
`IO_100010` · 화면 `order/door/import/orderSearch`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/orderList/selectCstmOrderList` |
| `searchCntr` | POST | `/api/orderList/selectCstmImportOrderCntr` |
| `delete` | POST | `/api/order/deleteImportOrder` |

#### 수입오더등록  
`IO_100030` · 화면 `order/door/import/orderRequest`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/orderList/selectCstmOrderList` |
| `searchCntr` | POST | `/api/orderList/selectCstmImportOrderCntr` |
| `searchOrder` | POST | `/api/order/selectCstmImportOrder` |
| `tmpSave` | POST | `/api/order/saveUserOrder` |
| `save` | POST | `/api/order/saveCstmImportOrder` |
| `delete` | POST | `/api/order/deleteImportOrder` |
| `deleteUserOrder` | POST | `/api/order/deleteUserOrder` |
| `getImportEtrans` | POST | `/api/order/getImportEtrans` |
| `getImportCargoView` | POST | `/api/order/getImportCargoView` |
| `selectCommonPopupPic` | POST | `/api/cms/popup/selectCommonPopupPic` |
| `updateOrderFileDoc` | POST | `/api/order/updateOrderFileDoc` |
| `selectOrderTemplateDetail` | POST | `/api/orderTemplate/selectOrderTemplateDetail` |
| `validUnpayUser` | POST | `/api/order/validUnpayUser` |

#### 고객사 수입 오더 조회  
`IO_100020` · 화면 `order/door/import/orderSearchMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/orderList/selectImportOrderList` |
| `searchCntr` | POST | `/api/orderList/selectImportOrderCntr` |
| `delete` | POST | `/api/order/deleteImportOrder` |
| `searchOrderBook` | POST | `/api/orderList/selectOrderBookList` |

#### 고객사 수입 오더 상세  
`IO_100040` · 화면 `order/door/import/orderRequestMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/orderList/selectImportOrderList` |
| `searchCntr` | POST | `/api/orderList/selectImportOrderCntr` |
| `searchOrder` | POST | `/api/order/selectImportOrder` |
| `save` | POST | `/api/order/saveImportOrder` |
| `delete` | POST | `/api/order/deleteImportOrder` |
| `confirm` | POST | `/api/order/confirmImportOrder` |
| `getImportEtrans` | POST | `/api/order/getImportEtrans` |
| `getImportEtransEmptyCntr` | POST | `/api/order/getImportEtransEmptyCntr` |
| `getImportCargoView` | POST | `/api/order/getImportCargoView` |
| `selectCommonPopupBilling` | POST | `/api/cms/popup/selectCommonPopupBilling` |
| `updateOrderFileDoc` | POST | `/api/order/updateOrderFileDoc` |
| `selectBillngTariffList` | POST | `/api/order/selectBillngTariffList` |
| `selectBillPic` | POST | `/api/sm/generalBilling/selectBillingClosingBillPicList` |
| `selectCmsWorkPlace` | POST | `/api/cms/comm/selectCommonWorkPlace` |
| `MailSend` | POST | `/api/order/sendCofirmMail` |

### 배차 관리  
`TM`

#### 배차 현황 조회  
`TM_100010` · 화면 `allocation/door/alloStatusSearch`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/allocation/selectAllocationTruckList` |
| `checkOrderCntr` | POST | `/api/allocation/checkOrderCntr` |
| `updateEmptyCntrReturnDate` | POST | `/api/allocation/updateEmptyCntrReturnDate` |
| `updateCntrReturnChk` | POST | `/api/allocation/updateCntrReturnChk` |
| `updateCntrReturnChk2` | POST | `/api/allocation/updateCntrReturnChk2` |
| `searchAlloList` | POST | `/api/allocation/selectAlloSeqList` |
| `searchTerminalYardLoc` | POST | `/api/allocation/searchTerminalYardLoc` |

#### 차량 할당 (수출)  
`TM_100030` · 화면 `allocation/door/allocationTruck`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `searchOrder` | POST | `/api/allocation/selectAllocationTruckDetail` |
| `save` | POST | `/api/allocation/saveAllocationTruck` |
| `confirm` | POST | `/api/allocation/confirmAllocationTruck` |
| `cancelDoorOrderCntrPtn` | POST | `/api/allocation/cancelDoorOrderCntrPtn` |

#### 차량 할당 (수입)  
`TM_100020` · 화면 `allocation/door/allocationTruckImport`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `searchOrder` | POST | `/api/allocation/selectAllocationTruckDetail` |
| `save` | POST | `/api/allocation/saveAllocationTruck` |
| `cancelDoorOrderCntrPtn` | POST | `/api/allocation/cancelDoorOrderCntrPtn` |

#### 직접 배차 및 코피노  
`TM_100012` · 화면 `allocation/door/directAlloAndCopino`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/allocation/selectAllocationTruckList` |
| `save` | POST | `/api/allocation/saveAllocationTruckList` |
| `cancelDoorOrderCntrPtn` | POST | `/api/allocation/cancelDoorOrderCntrPtn` |
| `searchTariffList` | POST | `/api/allocation/selectAllocationTruckTariffList` |
| `checkOrderCntr` | POST | `/api/allocation/checkOrderCntr` |

#### 도어배차  
`TM_1000013` · 화면 `allocation/door/directAlloAndCopinoV2`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/allocation/selectDirectAllocationTruckList` |
| `save` | POST | `/api/allocation/saveAllocationTruckListV2` |
| `saveInputAllo` | POST | `/api/allocation/saveInputAllo` |
| `deleteInputAllo` | POST | `/api/allocation/deleteInputAllo` |
| `cancelDoorOrderCntrPtn` | POST | `/api/allocation/cancelDoorOrderCntrPtn` |
| `searchTariffList` | POST | `/api/allocation/selectAllocationTruckTariffList` |
| `checkOrderCntr` | POST | `/api/allocation/checkOrderCntr` |
| `openOnlyPage` | POST | `/api/openOnlyPage` |
| `cancelUltOrder` | POST | `/api/dr/allo/cancelUltOrder` |
| `completeUltOrder` | POST | `/api/dr/allo/completeUltOrder` |

### 셔틀 오더  
`SO`

#### 셔틀오더 등록 및 조회  
`SO_110000` · 화면 `order/shuttle/orderRequestMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `searchOrder` | POST | `/api/order/shuttle/selectShuttleOrder` |
| `selectShuttleCntr` | POST | `/api/order/shuttle/selectShuttleCntr` |
| `save` | POST | `/api/order/shuttle/saveShuttleOrder` |
| `delete` | POST | `/api/order/shuttle/deleteShuttleOrder` |
| `selectSuttleOrderDetail` | POST | `/api/order/shuttle/selectSuttleOrderDetail` |
| `updateShuttleOrderWeigthType` | POST | `/api/order/shuttle/updateShuttleOrderWeigthType` |
| `getShuttleBillTariff` | POST | `/api/shuttle/allocation/getShuttleBillTariff` |

#### 셔틀배차  
`SO_120000` · 화면 `allocation/shuttle/allocationTruck`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/shuttle/allocation/selectAllocationTruckList` |
| `save` | POST | `/api/shuttle/allocation/saveAllocationTruck` |
| `alloCancel` | POST | `/api/shuttle/allocation/updateAlloCancel` |
| `alloStatus` | POST | `/api/shuttle/allocation/updateAlloStatus` |
| `getShuttlePayTariff` | POST | `/api/shuttle/allocation/getShuttlePayTariff` |
| `getShuttleBillTariff_BILL` | POST | `/api/shuttle/allocation/getShuttleBillTariff` |
| `copino` | POST | `/api/shuttle/allocation/copino` |
| `updateHoldingOn` | POST | `/api/shuttle/allocation/updateHoldingOn` |
| `updateHoldingOff` | POST | `/api/shuttle/allocation/updateHoldingOff` |
| `saveCopinoId` | POST | `/api/shuttle/allocation/saveCopinoId` |
| `cancelShuttleOrderCntrPtn` | POST | `/api/order/shuttle/cancelShuttleOrderCntrPtn` |
| `deleteShuttleCntr` | POST | `/api/shuttle/allocation/deleteShuttleCntr` |
| `sendTssCopino` | POST | `/api/shuttle/allocation/sendTssCopino` |
| `searchTerminalEta` | POST | `/api/shuttle/allocation/searchTerminalEta` |
| `searchTerminalYardLoc` | POST | `/api/shuttle/allocation/searchTerminalYardLoc` |
| `searchInTmlVslVoy` | POST | `/api/shuttle/allocation/searchInTmlVslVoy` |
| `searchOutTmlVslVoy` | POST | `/api/shuttle/allocation/searchOutTmlVslVoy` |
| `searchTmlInOutTime` | POST | `/api/shuttle/allocation/searchTmlInOutTime` |

#### 실적통합관리(셔틀)  
`ShutTotalOutputMgt` · 화면 `outputs/shutTotalOutputMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/outputs/selectTotalOutputsList` |
| `save` | POST | `/api/outputs/save` |
| `searchBillInfo` | POST | `/api/outputs/selectBillList` |
| `searchPayInfo` | POST | `/api/outputs/selectPayList` |
| `savePayCf` | POST | `/api/outputs/savePayCf` |
| `cancelPayCf` | POST | `/api/outputs/cancelPayCf` |
| `deleteBilling` | POST | `/api/outputs/deleteBilling` |
| `deletePayment` | POST | `/api/outputs/deletePayment` |
| `selectBillPic` | POST | `/api/sm/generalBilling/selectBillingClosingBillPicList` |
| `validationPay` | POST | `/api/outputs/validationPay` |

#### 그룹오더생성  
`GroupOrderRegist` · 화면 `allocation/shuttle/GroupOrderRegist`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/shuttle/groupOrder/selectGroupOrderRegistList` |
| `cntrSearch` | POST | `/api/shuttle/groupOrder/selectGroupOrderRegistCntrList` |
| `vhcSearch` | POST | `/api/shuttle/groupOrder/selectGroupOrderRegistVhcList` |
| `vhcDelete` | POST | `/api/shuttle/groupOrder/deleteGroupOrderVhcList` |
| `regist` | POST | `/api/shuttle/groupOrder/saveGroupOrderRegist` |
| `trans` | POST | `/api/shuttle/groupOrder/savePreExImInfo` |
| `validRegistVhcList` | POST | `/api/shuttle/groupOrder/validRegistVhcList` |
| `delete` | POST | `/api/shuttle/groupOrder/deleteGroupOrderRegistCntr` |
| `groupOrderValidation` | POST | `/api/shuttle/groupOrder/groupOrderValidation` |
| `validGroupOrder` | POST | `/api/shuttle/groupOrder/validGroupOrder` |
| `validRegist` | POST | `/api/shuttle/groupOrder/validRegist` |

#### 그룹오더배차  
`GroupOrderAllocation` · 화면 `allocation/shuttle/GroupOrderAllocation`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/shuttle/groupOrder/selectGroupOrderAlloList` |
| `updateGroupOrderList` | POST | `/api/shuttle/groupOrder/updateGroupOrderList` |
| `updateGroupOrderStatus` | POST | `/api/shuttle/groupOrder/updateGroupOrderStatus` |
| `saveBundle` | POST | `/api/shuttle/groupOrder/saveBundle` |
| `deleteGroupOrder` | POST | `/api/shuttle/groupOrder/deleteGroupOrder` |

#### 그룹오더 진행상태 및 변경  
`GroupOrderStatus` · 화면 `allocation/shuttle/GroupOrderStatus`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/shuttle/groupOrder/selectGroupOrderStatusList` |
| `selectGroupOrderCntrList` | POST | `/api/shuttle/groupOrder/selectGroupOrderCntrList` |
| `selectGroupOrderVhcList` | POST | `/api/shuttle/groupOrder/selectGroupOrderVhcList` |
| `cntrSearch` | POST | `/api/shuttle/groupOrder/selectGroupOrderRegistCntrList` |
| `vhcSearch` | POST | `/api/shuttle/groupOrder/selectGroupOrderRegistVhcList` |
| `updateGroupOrderStatus` | POST | `/api/shuttle/groupOrder/updateGroupOrderStatus` |
| `updateGroupOrder` | POST | `/api/shuttle/groupOrder/updateTssGroupOrder` |
| `validGroupOrderCntrRemove` | POST | `/api/shuttle/groupOrder/validGroupOrderCntrRemove` |
| `validGroupOrderMultiCntrRemove` | POST | `/api/shuttle/groupOrder/validGroupOrderMultiCntrRemove` |
| `validGroupOrderVhcRemove` | POST | `/api/shuttle/groupOrder/validGroupOrderVhcRemove` |
| `validRegistVhcList` | POST | `/api/shuttle/groupOrder/validRegistVhcList` |
| `groupOrderValidation` | POST | `/api/shuttle/groupOrder/groupOrderValidation` |
| `validRegist` | POST | `/api/shuttle/groupOrder/validRegist` |
| `validModify` | POST | `/api/shuttle/groupOrder/validModify` |
| `groupOrderModifyValidation` | POST | `/api/shuttle/groupOrder/groupOrderModifyValidation` |
| `removeGroupOrderModCntrValid` | POST | `/api/shuttle/groupOrder/removeGroupOrderModCntrValid` |

#### 셔틀 Daily Closing List  
`shuttleOrderClosingList` · 화면 `order/shuttle/orderClosingList`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `searchSkrList` | POST | `/api/order/shuttle/selectSkrDailyClosing` |
| `searchHasList` | POST | `/api/order/shuttle/selectHasDailyClosing` |

#### 전배보세 등록  
`BndCntrMgt` · 화면 `order/shuttle/BndCntrMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `selectBndCntrList` | POST | `/api/order/shuttle/selectBndCntrList` |
| `saveBndCntrList` | POST | `/api/order/shuttle/saveBndCntrList` |

### 실적관리  
`OP`

#### 통합 오더 조회  
`OP_100020` · 화면 `order/door/total/orderSearchMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/orderList/selectTotalOrderList` |
| `searchCntr` | POST | `/api/orderList/selectImportOrderCntr` |
| `delete` | POST | `/api/order/deleteImportOrder` |
| `searchOrderBook` | POST | `/api/orderList/selectOrderBookList` |

#### 실적통합관리  
`OP_100010` · 화면 `outputs/totalOutputMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/outputs/selectTotalOutputsList` |
| `save` | POST | `/api/outputs/save` |
| `searchBillInfo` | POST | `/api/outputs/selectBillList` |
| `searchPayInfo` | POST | `/api/outputs/selectPayList` |
| `savePayCf` | POST | `/api/outputs/savePayCf` |
| `savePayCf_ALL` | POST | `/api/outputs/savePayCf_ALL` |
| `cancelPayCf` | POST | `/api/outputs/cancelPayCf` |
| `deleteBilling` | POST | `/api/outputs/deleteBilling` |
| `deletePayment` | POST | `/api/outputs/deletePayment` |
| `selectBillPic` | POST | `/api/sm/generalBilling/selectBillingClosingBillPicList` |
| `validationPay` | POST | `/api/outputs/validationPay` |

#### 거래처별 청구집계  
`OP_110010` · 화면 `outputs/billingTot/billTotByAcc`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/outputs/billingTotal/selectBillTotByAccList` |

#### 하불승인  
`PayApprMgt` · 화면 `outputs/payApprMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/outputs/selectPayApprList` |
| `getDept` | POST | `/api/outputs/getDept` |
| `payApprCntr` | POST | `/api/outputs/savePayApprList` |
| `selectPayApprDetail` | POST | `/api/outputs/selectPayApprDetail` |
| `savePayApprRemark` | POST | `/api/outputs/savePayApprRemark` |

#### 하불집계  
`OP_120000`

##### 매입처현황  
`OP_120010` · 화면 `outputs/payTot/payCorpStatus`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/outputs/paymentTotal/selectPayCorpStatusList` |

##### 차량별 정산서  
`OP_120020` · 화면 `outputs/payTot/stateOfAccByVehicle`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/outputs/paymentTotal/selectStateOfAccByVehicleList` |
| `searchDtl1` | POST | `/api/outputs/paymentTotal/selectStateOfDtl1List` |
| `searchDtl2` | POST | `/api/outputs/paymentTotal/selectStateOfDtl2List` |

#### 경영정보  
`OP_130000`

##### 차량매출  
`OP_130010` · 화면 `outputs/management/vhcSales`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/outputs/management/selectVhcsalesList` |

##### 손익현황  
`OP_130020` · 화면 `outputs/management/profitNLossStat`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/outputs/management/selectProfitNLossStatList` |
| `searchDtl` | POST | `/api/outputs/management/selectProfitDetailList` |

##### 오더접수현황  
`OP_130050` · 화면 `outputs/management/orderRecvSt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/outputs/management/selectOrdersList` |

##### 용차사 매출입현황  
`OP_130060` · 화면 `outputs/management/hiredCarCorpBillPaySt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/outputs/management/selectHiredCarCorpBillPayStList` |
| `save` | POST | `/api/outputs/management/saveMgtRmkMgt` |

##### 차량별 지급 공제관리  
`OP_130070` · 화면 `outputs/management/vhcPayDdcMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/outputs/management/selectVhcPayDdcMgtList` |
| `save` | POST | `/api/outputs/management/saveMgtRmkMgt` |
| `SendEtransDrv` | POST | `/api/outputs/management/SendEtransDrv` |
| `checkSendTalkClPay` | POST | `/api/outputs/management/checkSendTalkClPay` |
| `sendTalkClPay` | POST | `/api/outputs/management/sendTalkClPay` |

##### 차량별 운행실적 (배차형평성)  
`OP_130080` · 화면 `outputs/management/vhcTrcStat`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/outputs/management/selectVhcTrcStatList` |

##### 실시간 차량 매출 현황  
`OP_130090` · 화면 `outputs/management/rtVhcRevSt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/outputs/management/selectRtVhcRevStList` |
| `save` | POST | `/api/outputs/management/saveRtVhcRevSt` |

#### 통계  
`OP_140000`

##### 월별&업체별 매출현황  
`OP_140010` · 화면 `outputs/statistics/monNCorpBillSt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/outputs/statssales/selectMonCorpSalesList` |

##### 월별&업체별 실적현황  
`OP_140020` · 화면 `outputs/statistics/monNCorpPFMSt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/outputs/statssales/selectMonCorpOutsList` |

##### 기간별&업체별 하불현황  
`OP_140040` · 화면 `outputs/statistics/termNCorpPaySt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/outputs/statssales/selectTermNCorpPayStList` |

##### 청구처별 미수현황  
`OP_140080` · 화면 `outputs/statistics/billCorpByUnpaidSt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/outputs/statssales/selectCorpUnpaidList` |

##### 점소별 영업이익 현황  
`OP_140090` · 화면 `outputs/statistics/pointByPFMSt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/outputs/statssales/selectPointByPFMStList` |
| `searchDtl` | POST | `/api/outputs/statssales/selectPointByPFMStDetail` |

##### 영업담당자별 매출현황  
`OP_140110` · 화면 `outputs/statistics/opPicByBillSt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/outputs/statssales/selectManSalesList` |

##### 영업사원 실적현황  
`OP_140120` · 화면 `outputs/statistics/opPicPFMSt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/outputs/statssales/selectManOutsList` |

##### (영업) 월별&업체별 실적현황  
`OP_140130` · 화면 `outputs/statistics/opMonNCorpPFMSt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/outputs/statssales/selectOPMonCorpOutsList` |

##### (영업) 영업사원 실적현황  
`OP_140140` · 화면 `outputs/statistics/opOpPicPFMSt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/outputs/statssales/selectOPManOutsList` |

#### 당월 포인트 현황  
`monPointSt` · 화면 `outputs/monPointSt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/outputs/point/selectMonPointStList` |
| `save` | POST | `/api/outputs/point/saveMonPointSt` |
| `validSalesPic` | POST | `/api/outputs/point/validSalesPic` |

### 정산관리  
`SM`

#### 일반청구  
`SM_110000`

##### 청구마감  
`SM_110010` · 화면 `sm/generalBilling/billingClosing`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/sm/generalBilling/selectBillingClosingCorpList` |
| `searchBilling` | POST | `/api/sm/generalBilling/selectBillingClosingList` |
| `selectBillPic` | POST | `/api/sm/generalBilling/selectBillingClosingBillPicList` |
| `updateBillngClosing` | POST | `/api/sm/generalBilling/updateBillngClosing` |
| `updateCarryOver` | POST | `/api/sm/generalBilling/updateCarryOver` |
| `saveTax` | POST | `/api/sm/generalBilling/saveTax` |

추가 참조 엔드포인트: `/api/sm/generalBilling/billingClosingExcel`

##### 청구마감(대용량)  
`LargeBillingClosing` · 화면 `sm/generalBilling/LargeBillingClosing`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/sm/generalBilling/selectBillingClosingCorpList` |
| `searchBilling` | POST | `/api/sm/generalBilling/selectBillingClosingList` |
| `selectBillPic` | POST | `/api/sm/generalBilling/selectBillingClosingBillPicList` |
| `updateBillngClosing` | POST | `/api/sm/generalBilling/updateBillngClosing` |
| `updateRargeBillngClosing` | POST | `/api/sm/generalBilling/updateRargeBillngClosing` |
| `updateCarryOver` | POST | `/api/sm/generalBilling/updateCarryOver` |
| `saveTax` | POST | `/api/sm/generalBilling/saveTax` |
| `validBilling` | POST | `/api/sm/generalBilling/validBilling` |

##### 청구현황  
`SM_110020` · 화면 `sm/generalBilling/billingStatus`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/sm/generalBilling/selectBillingStatusList` |
| `selectBillPic` | POST | `/api/sm/generalBilling/selectBillingClosingBillPicList` |
| `selectBillingStatusDetail` | POST | `/api/sm/generalBilling/selectBillingStatusDetail` |
| `cancelBillingClose` | POST | `/api/sm/generalBilling/cancelBillingClose` |
| `saveAccounting` | POST | `/api/sm/generalBilling/saveAccounting` |
| `cancelAccounting` | POST | `/api/sm/generalBilling/cancelAccounting` |
| `executeSKClosing` | POST | `/api/sm/generalBilling/executeSKClosing` |
| `cancelSKClosing` | POST | `/api/sm/generalBilling/cancelSKClosing` |

##### 전자세금계산서 관리  
`SM_110030` · 화면 `sm/generalBilling/taxMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/taxMgt/selectMgtList` |
| `save` | POST | `/api/taxMgt/saveRemark` |
| `searchBillDiv` | POST | `/api/taxMgt/selectBillList` |
| `searchLogisBill` | POST | `/api/tax/selectLogisBill` |
| `issueTaxBill` | POST | `/api/tax/issueTaxBill` |
| `issueRsdnRgstTaxBill` | POST | `/api/tax/issueRsdnRgstTaxBill` |
| `cancelTaxBill` | POST | `/api/taxMgt/cancelTaxBill` |
| `saveAccounting` | POST | `/api/taxMgt/saveAccounting` |
| `cancelAccounting` | POST | `/api/taxMgt/cancelAccounting` |
| `selectBillTaxCntrList` | POST | `/api/taxMgt/selectBillTaxCntrList` |
| `resendMail` | POST | `/api/tax/resendMail` |

##### 미청구 및 이월청구 조회  
`SM_110050` · 화면 `sm/generalBilling/carrybillingList`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/sm/carryBill/carryBillListSearch` |
| `ApprSave` | POST | `/api/sm/carryBill/carryBillListApprSave` |
| `rmkSave` | POST | `/api/sm/carryBill/carryBillListRmkSave` |

#### 일반하불  
`SM_120000`

##### 하불확정(대용량)  
`SM_120005` · 화면 `sm/generalPayment/paymentConf`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/sm/generalPayment/selectPaymentConfirmList` |
| `updatePaymentConfirm` | POST | `/api/sm/generalPayment/updatePaymentConfirm` |

##### 하불마감 및 현황  
`SM_120010` · 화면 `sm/generalPayment/paymentClosing`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/sm/generalPayment/selectPaymentClosingList` |
| `searchPayment` | POST | `/api/sm/generalPayment/selectPaymentClosingList` |
| `selectPayDivList` | POST | `/api/sm/generalPayment/selectPayDivList` |
| `updatePaymentClosing` | POST | `/api/sm/generalPayment/updatePaymentClosing` |
| `saveTax` | POST | `/api/sm/generalPayment/saveTax` |

##### 매입세금계산서  
`SM_120020` · 화면 `sm/generalPayment/taxMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/sm/generalPayment/selectPaymentTaxList` |
| `selectPaymentTaxDetail` | POST | `/api/sm/generalPayment/selectPaymentTaxDetail` |
| `cancelPaymentClose` | POST | `/api/sm/generalPayment/cancelPaymentClose` |
| `saveAccounting` | POST | `/api/sm/generalPayment/saveAccounting` |
| `saveMergeAccounting` | POST | `/api/sm/generalPayment/saveMergeAccounting` |
| `cancelAccounting` | POST | `/api/sm/generalPayment/cancelAccounting` |

#### 선사BILL  
`SM_130000`

##### BILL청구  
`SM_130010` · 화면 `sm/lineBill/billMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/sm/lineBillMgt/selectLineBillMgtList` |
| `selectBillPic` | POST | `/api/sm/generalBilling/selectBillingClosingBillPicList` |
| `selectCntrDetail` | POST | `/api/sm/lineBillMgt/selectCntrDetail` |
| `saveLineBill` | POST | `/api/sm/lineBillMgt/saveLineBill` |
| `cancelLineBill` | POST | `/api/sm/lineBillMgt/cancelLineBill` |
| `updateTotalBillingAmount` | POST | `/api/sm/lineBillMgt/updateTotalBillingAmount` |
| `applyForeignBillAmount` | POST | `/api/sm/lineBillMgt/applyForeignBillAmount` |
| `updateForeignBillAmount` | POST | `/api/sm/lineBillMgt/updateForeignBillAmount` |
| `selectLineBillPrintCntrList` | POST | `/api/sm/lineBillMgt/selectLineBillPrintCntrList` |

#### 거래명세서  
`TransSpec` · 화면 `sm/TransSpec`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/sm/transSpec/selectTransSpecList` |
| `selectBillingStatusDetail` | POST | `/api/sm/generalBilling/selectBillingStatusDetail` |
| `selectMainInfo` | POST | `/api/mdm/organization/selectMainInfo` |
| `selectBillingDetailList` | POST | `/api/sm/generalBilling/selectBillingDetailList` |

#### 거래명세서(협력사)  
`TransSpecPtn` · 화면 `sm/TransSpecPtn`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/sm/transSpec/selectTransSpecPtnList` |
| `selectPaymentClosingDetailList` | POST | `/api/sm/generalPayment/selectPaymentClosingDetailList` |
| `selectMainInfo` | POST | `/api/mdm/organization/selectMainInfo` |
| `selectPayDivList` | POST | `/api/sm/generalPayment/selectPayDivList` |

#### 수금관리  
`SM_160000`

##### 거래처별 청구수금 명세서  
`SM_160020` · 화면 `sm/collect/billCollectByAcc`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/sm/collect/selectBillCollectByAccList` |
| `searchDtl` | POST | `/api/sm/collect/selectBillCollectByAccDtlList` |
| `selectBillPic` | POST | `/api/sm/generalBilling/selectBillingClosingBillPicList` |

#### 대납리스트  
`ProxyList` · 화면 `sm/proxy/proxyList`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/sm/proxy/proxyListSearch` |
| `searchDetail` | POST | `/api/sm/proxy/proxyListSearchDetail` |
| `proxyDivSave` | POST | `/api/sm/proxy/proxyDivSave` |
| `proxyRmkSave` | POST | `/api/sm/proxy/proxyRmkSave` |
| `proxyConfirmSave` | POST | `/api/sm/proxy/proxyConfirmSave` |
| `proxyConfirmCancel` | POST | `/api/sm/proxy/proxyConfirmCancel` |
| `proxyDepositSave` | POST | `/api/sm/proxy/proxyDepositSave` |
| `proxyDepositCancel` | POST | `/api/sm/proxy/proxyDepositCancel` |
| `selectProxyPrintList` | POST | `/api/sm/proxy/selectProxyPrintList` |
| `updateFileDoc` | POST | `/api/sm/proxy/updateFileDoc` |
| `proxyApprovalSave` | POST | `/api/sm/proxy/proxyApprovalSave` |
| `proxyApprovalCancel` | POST | `/api/sm/proxy/proxyApprovalCancel` |

### 보세운송  
`BT`

#### 보세운송 전송 및 관리  
`BT_130000` · 화면 `bnd/BndTransMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `selectCusmovList` | POST | `/api/bnd/bndTransMgt/selectCusmovList` |
| `selectCusmovCntDmrList` | POST | `/api/bnd/bndTransMgt/selectCusmovCntDmrList` |
| `selectMfcsPrintList` | POST | `/api/bnd/mfcsSearch/selectMfcsPrintList` |
| `insertListBndMapOut` | POST | `/api/bnd/bndTransMgt/insertListBndMapOut` |
| `deleteCusmovList` | POST | `/api/bnd/bndTransMgt/deleteCusmovList` |

#### 정정신고 송수신  
`BT_140000` · 화면 `bnd/BndUpdate`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `selectBndUpdate` | POST | `/api/bnd/bndUpdate/selectBndUpdate` |
| `selectBndUpdatePrintList` | POST | `/api/bnd/bndUpdate/selectBndUpdatePrintList` |
| `insertMapOut` | POST | `/api/bnd/bndUpdate/insertMapOut` |

#### 적하목록 업로드  
`BT_110000` · 화면 `bnd/MfcsUpload`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `selectMfcsUploadList` | POST | `/api/bnd/mfcsSearch/selectMfcsUploadList` |
| `saveUploadFile` | POST | `/api/bnd/mfcsUpload/saveMfcs` |
| `deleteMfcsFiles` | POST | `/api/bnd/mfcsUpload/deleteMfcsFiles` |
| `getMfcs` | POST | `/api/bnd/mfcsUpload/getMfcs` |

#### 적하목록 조회  
`BT_120000` · 화면 `bnd/MfcsSearch`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `serachMfcs` | POST | `/api/bnd/mfcsSearch/selectMfcsList` |
| `selectMfcsPrintList` | POST | `/api/bnd/mfcsSearch/selectMfcsPrintList` |
| `updateMfcs` | POST | `/api/bnd/mfcsSearch/updateMfcs` |
| `deleteMfcs` | POST | `/api/bnd/mfcsSearch/deleteMfcsList` |

### 보세운송_V2  
`BT_V2`

#### 보세운송 전송 및 관리_V2  
`BndTransMgt-v2` · 화면 `bnd-v2/BndTransMgt-v2`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `selectCusmovList_V2` | POST | `/api/bnd/bndTransMgt/selectCusmovList_V2` |
| `selectCusmovCntDmrList_V2` | POST | `/api/bnd/bndTransMgt/selectCusmovCntDmrList_V2` |
| `selectMfcsPrintList` | POST | `/api/bnd/mfcsSearch/selectMfcsPrintList` |
| `insertListBndMapOut_V2` | POST | `/api/bnd/bndTransMgt/insertListBndMapOut_V2` |
| `deleteCusmovList` | POST | `/api/bnd/bndTransMgt/deleteCusmovList` |

#### 정정신고 송수신_V2  
`BndUpdate-v2` · 화면 `bnd-v2/BndUpdate-v2`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `selectBndUpdate_V2` | POST | `/api/bnd/bndUpdate/selectBndUpdate_V2` |
| `selectBndUpdatePrintList` | POST | `/api/bnd/bndUpdate/selectBndUpdatePrintList` |
| `insertBondModi` | POST | `/api/bnd/bndUpdate/insertBondModi` |

#### 임시개청신청  
`BndOpenTrans` · 화면 `bnd-v2/BndOpenTrans`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `selectBndOpenTrans` | POST | `/api/bnd/bndTransMgt/selectBndOpenTrans` |
| `saveBndOpenTrans` | POST | `/api/bnd/bndTransMgt/saveBndOpenTrans` |
| `selectBndOpenTransDtl` | POST | `/api/bnd/bndTransMgt/selectBndOpenTransDtl` |
| `sendOpenTrans` | POST | `/api/bnd/bndTransMgt/sendOpenTrans` |

### 고객센터  
`DB`

#### 공지사항  
`DB_100010` · 화면 `db/notice`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/db/notice/selectDBNotice` |
| `save` | POST | `/api/db/notice/saveDBNotice` |

#### 고객사 공지사항  
`DB_100011` · 화면 `dsh/dashboard/customNoticeList`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/dsh/dashboard/selectCustomNotice` |
| `searchView` | POST | `/api/dsh/dashboard/selectCustomNoticeView` |

#### FAQ  
`DB_100020` · 화면 `db/faq`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/db/faq/selectFaqList` |

#### 안전운임제  
`DB_100040` · 화면 `db/tariff`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `settingData` | POST | `/api/intro/tariff/selectIntroTariffSettingData` |
| `search` | POST | `/api/intro/tariff/selectIntroTariff` |
| `search_v2` | POST | `/api/intro/tariff/selectIntroTariff_v2` |
| `searchCity` | POST | `/api/intro/tariff/selectIntroTariffCity` |
| `searchDong` | POST | `/api/intro/tariff/selectIntroTariffDong` |
| `searchBlock` | POST | `/api/intro/tariff/selectIntroTariffBlock` |
| `searchBlock_v2` | POST | `/api/intro/tariff/selectIntroTariffBlock_v2` |
| `clearLoginParam` | POST | `/api/auth/clearLoginParam` |

#### 컨테이너 정보  
`DB_100050` · 화면 `db/containerInfo`

> API 정의 없음 (정적 화면)

### TMS 기준정보  
`TMS_MA`

#### 오더 기준정보  
`MA_1100000`

##### 셔틀 권역관리  
`MA_1100090` · 화면 `mdm/code/MdmShtlRegionMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/code/selectMdmShTransRectMgt` |
| `save` | POST | `/api/mdm/code/saveMdmShTransRectMgt` |

##### 작업지 관리  
`MA_1100020` · 화면 `mdm/customer/MdmWorkPlace`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/workplace/selectMdmWorkPlace` |
| `searchDetail` | POST | `/api/mdm/workplace/selectMdmWorkPlaceDetail` |
| `save` | POST | `/api/mdm/workplace/saveMdmWorkPlace` |
| `delete` | POST | `/api/mdm/workplace/deleteMdmWorkPlace` |
| `selectMdmWorkPlaceDo` | POST | `/api/mdm/workplace/selectMdmWorkPlaceDo` |
| `selectMdmWorkPlaceCity` | POST | `/api/mdm/workplace/selectMdmWorkPlaceCity` |
| `selectMdmWorkPlaceDong` | POST | `/api/mdm/workplace/selectMdmWorkPlaceDong` |
| `selectMdmWorkPlaceDongList` | POST | `/api/mdm/workplace/selectMdmWorkPlaceDongList` |

##### 화주 관리  
`MA_1100070` · 화면 `mdm/customer/MdmShipper`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/shipper/selectList` |
| `searchDetail` | POST | `/api/mdm/shipper/selectMgrList` |
| `save` | POST | `/api/mdm/shipper/saveMdmShipperMgt` |
| `validationShipper` | POST | `/api/mdm/shipper/validationShipper` |
| `validationBln` | POST | `/api/mdm/shipper/validationBln` |
| `delete` | POST | `/api/mdm/shipper/deleteMdmShipperMgt` |

##### 고객사 메일관리  
`MA_1100120` · 화면 `mdm/customer/MdmCustomerMail`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/customerMail/selectMdmCustomerMail` |
| `save` | POST | `/api/mdm/customerMail/saveMdmContract` |

##### 오더 공유팀 관리  
`MA_1100110` · 화면 `mdm/code/MdmOrdTeamMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/comm/selectMdmOrdTeamMgt` |
| `searchTeamUser` | POST | `/api/mdm/comm/selectMdmOrdUserMgt` |
| `save` | POST | `/api/mdm/comm/savetMdmOrdUserMgt` |

##### 즐겨찾기  
`MA_1100050` · 화면 `cms/comm/CmsFavoritesMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cms/comm/selectCmsFavoritesMgt` |
| `save` | POST | `/api/cms/comm/saveCmsFavoritesMgt` |
| `delete` | POST | `/api/cms/comm/deleteCmsFavoritesMgt` |
| `selectCommonPopupBilling` | POST | `/api/cms/popup/selectCommonPopupBilling` |

##### 타리프 관리  
`MA_1100100` · 화면 `mdm/tariff/MdmTariffMgtV2`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/tariff2/selectMdmTariffMgt` |
| `save` | POST | `/api/mdm/tariff2/saveMdmTariffMgt` |
| `delete` | POST | `/api/mdm/tariff2/deleteMdmTariffMgt` |

#### 배차 기준정보  
`MA_1200000`

##### 장비관리  
`MA_1200030` · 화면 `mdm/code/MdmEqpMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/code/selectMdmEqpMgt` |
| `save` | POST | `/api/mdm/code/saveMdmEqpMgt` |
| `saerchEqpHistory` | POST | `/api/mdm/code/saerchEqpHistory` |
| `updateEqpFileUpload` | POST | `/api/mdm/code/updateEqpFileUpload` |

##### 장비내역 수리관리  
`MA_1200031` · 화면 `mdm/code/MdmEqpRepairMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/code/selectMdmEqpRepairMgt` |
| `save` | POST | `/api/mdm/code/saveMdmEqpRepairMgt` |

##### 배차 팀 관리  
`MA_1200040` · 화면 `mdm/code/MdmAlloMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/comm/selectMdmAlloMgt` |
| `searchTeamUser` | POST | `/api/mdm/comm/selectMdmAlloUserMgt` |
| `save` | POST | `/api/mdm/comm/savetMdmAlloUserMgt` |

## CFS  
`CFS`

### 수출업무[LCL]  
`CFS_CLERK`

#### 입고오더등록 (클락)  
`FRcvCOrdReqMgt` · 화면 `cfs/FRcvCOrdReqMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/exOrd/selectExcOrd` |
| `save` | POST | `/api/cfs/exOrd/saveExcOrd` |
| `delete` | POST | `/api/cfs/exOrd/deleteExcOrd` |
| `validExcOrd` | POST | `/api/cfs/exOrd/validExcOrd` |

#### 입고오더조회 (클락)  
`FRcvCOrdSchMgt` · 화면 `cfs/FRcvCOrdSchMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/exOrd/selectExcOrdList` |
| `cancelWrng` | POST | `/api/cfs/exOrd/cancelWrng` |

#### 컨테이너적입관리 (FCL)  
`FClpFclMgt` · 화면 `cfs/FClpFclMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/exClp/selectExClpFcl` |
| `selectExBookingInfo` | POST | `/api/cfs/exClp/selectExBookingInfo` |
| `validExClp` | POST | `/api/cfs/exClp/validExClp` |
| `save` | POST | `/api/cfs/exClp/saveExFclClp` |
| `delete` | POST | `/api/cfs/exClp/deleteExClp` |
| `selectPrintFcl` | POST | `/api/cfs/exClp/selectPrintFcl` |
| `selectContainerList` | POST | `/api/code/selectContainerList` |
| `selectCntrLine` | POST | `/api/code/selectCntrLine` |
| `tranferClp` | POST | `/api/cfs/exClp/tranferClp` |
| `checkClpStatus` | POST | `/api/cfs/exClp/checkClpStatus` |
| `requestCancelClp` | POST | `/api/cfs/exClp/requestCancelClp` |

#### 컨테이너적입관리 (LCL)  
`FClpLclMgt` · 화면 `cfs/FClpLclMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/exClp/selectExClpLcl` |
| `selectExBookingInfo` | POST | `/api/cfs/exClp/selectExBookingInfo` |
| `validExClp` | POST | `/api/cfs/exClp/validExClp` |
| `save` | POST | `/api/cfs/exClp/saveExLclClp` |
| `delete` | POST | `/api/cfs/exClp/deleteExClp` |
| `searchRcvList` | POST | `/api/cfs/exClp/selectExcRcvList` |
| `updateCargoInfo` | POST | `/api/cfs/exClp/updateCargoInfo` |
| `updateCrg` | POST | `/api/cfs/exClp/updateLclCrg` |
| `updateRcv` | POST | `/api/cfs/exClp/updateLclRcv` |
| `selectPrintLcl` | POST | `/api/cfs/exClp/selectPrintLcl` |
| `selectContainerList` | POST | `/api/code/selectContainerList` |
| `selectCntrLine` | POST | `/api/code/selectCntrLine` |
| `deleteCntrNo` | POST | `/api/cfs/exClp/deleteCntrNo` |
| `tranferClp` | POST | `/api/cfs/exClp/tranferClp` |
| `checkClpStatus` | POST | `/api/cfs/exClp/checkClpStatus` |
| `requestCancelClp` | POST | `/api/cfs/exClp/requestCancelClp` |

#### 컨테이너적입현황 조회  
`FClpSchMgt` · 화면 `cfs/FClpSchMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/exClp/selectExcClpList` |

#### CERTIFICATE 관리  
`FCertMgt` · 화면 `cfs/FCertMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/fCrtfMgt/selectFCrtfMgtList` |
| `searchCntr` | POST | `/api/cfs/fCrtfMgt/selectFCrtfCntrList` |
| `saveCrtf` | POST | `/api/cfs/fCrtfMgt/updateCrtfNoMgt` |
| `saveSmBill` | POST | `/api/cfs/fCrtfMgt/saveSmBill` |
| `deleteSmBill` | POST | `/api/cfs/fCrtfMgt/deleteSmBill` |
| `saveGrpSm` | POST | `/api/cfs/fCrtfMgt/saveGrpSm` |
| `cancelGrpSm` | POST | `/api/cfs/fCrtfMgt/cancelGrpSm` |
| `selectPrintBillList` | POST | `/api/cfs/fCrtfMgt/selectPrintBillList` |
| `selectPrintCertList` | POST | `/api/cfs/fCrtfMgt/selectPrintCertList` |

#### 기타이고반출 관리  
`FTrfCrgIsuMgt` · 화면 `cfs/FTrfCrgIsuMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/trfCrgIsuMgt/selectTrfCrgIsuList` |
| `save` | POST | `/api/cfs/trfCrgIsuMgt/saveTrfCrgIsu` |
| `delete` | POST | `/api/cfs/trfCrgIsuMgt/deleteTrfCrgIsu` |

#### 입고현황조회(고객용)  
`FRcvCOrdSchList` · 화면 `cfs/FRcvCOrdSchList`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/exOrd/selectRcvOrdSchList` |
| `searchDtl` | POST | `/api/cfs/exOrd/selectRcvOrdSchDtlList` |

### 수출업무[FCL]  
`CFS_FCL`

#### 입고오더등록 (현수)  
`FRcvHOrdReqMgt` · 화면 `cfs/FRcvHOrdReqMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/exOrd/selectExhOrd` |
| `save` | POST | `/api/cfs/exOrd/saveExhOrd` |
| `delete` | POST | `/api/cfs/exOrd/deleteExhOrdMgt` |
| `validExhOrd` | POST | `/api/cfs/exOrd/validExhOrd` |
| `selectExBookingInfo` | POST | `/api/cfs/exClp/selectExBookingInfo` |
| `updateAlloExcp` | POST | `/api/cfs/exOrd/updateAlloExcp` |
| `selectCorpBillPic` | POST | `/api/mdm/code/selectCorpBillPicList` |

#### 입고오더관리 (현수)  
`FRcvHOrdMgt` · 화면 `cfs/FRcvHOrdMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/exOrd/selectExhOrdMgtList` |
| `searchCntr` | POST | `/api/cfs/exOrd/selectExhOrdCntrList` |
| `updateExBookingInfo` | POST | `/api/cfs/exClp/updateExBookingInfo` |
| `checkExBookingInfo` | POST | `/api/cfs/exClp/selectExBookingListInfo` |
| `updateAlloExcp` | POST | `/api/cfs/exOrd/updateAlloExcp` |
| `save` | POST | `/api/cfs/exOrd/saveExhOrdMgt` |
| `delete` | POST | `/api/cfs/exOrd/deleteExhOrdMgt` |
| `saveWrkYn` | POST | `/api/cfs/exOrd/saveWrkYn` |
| `saveLkcYn` | POST | `/api/cfs/exOrd/saveLkcYn` |
| `saveWrkYnAtOnce` | POST | `/api/cfs/exOrd/saveWrkYnAtOnce` |

#### 입고컨테이너관리 (현수)  
`FRcvHOrdSchMgt` · 화면 `cfs/FRcvHOrdSchMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/exOrd/selectExhOrdList` |
| `selectExBookingInfo` | POST | `/api/cfs/exClp/selectExBookingInfo` |
| `updateAlloExcp` | POST | `/api/cfs/exOrd/updateAlloExcp` |
| `saveWrkYn` | POST | `/api/cfs/exOrd/saveWrkYn` |
| `save` | POST | `/api/cfs/exOrd/saveExhCntrMgt` |
| `updateExhOrd` | POST | `/api/cfs/exOrd/updateExhOrd` |
| `delete` | POST | `/api/cfs/exOrd/deleteExhCntrListMgt` |

#### 거래명세서 관리(현수)  
`FRcvHOrdTransSttMgt` · 화면 `cfs/FRcvHOrdTransSttMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `searchNoBillClpCntrMgtInfo` | POST | `/api/cfs/BltCust/selectNoBillClpCntrMgtInfo` |
| `searchNoBillClpChgList` | POST | `/api/cfs/BltCust/selectNoBillClpChgList` |
| `searchNoBillClpCntrList` | POST | `/api/cfs/BltCust/selectNoBillClpCntrList` |
| `searchSmMgtClpList` | POST | `/api/cfs/BltCust/selectSmMgtClpList` |
| `searchBillChgList` | POST | `/api/cfs/BltCust/selectBillChgList` |
| `searchBillCntrClpList` | POST | `/api/cfs/BltCust/selectBillCntrClpList` |
| `save` | POST | `/api/cfs/BltCust/saveSmMgt` |
| `delete` | POST | `/api/cfs/BltCust/deleteSmMgt` |
| `selectCorpBillPic` | POST | `/api/mdm/code/selectCorpBillPicList` |
| `selectTariffCalc` | POST | `/api/cfs/BltCust/selectTariffCalc` |
| `selectPrintSmMgtClpList` | POST | `/api/cfs/BltCust/selectPrintSmMgtClpList` |

#### 컨테이너 반출입 관리  
`FCntrCarryMgt` · 화면 `cfs/FCntrCarryMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/cntr/selectExCntrMgtList` |
| `save` | POST | `/api/cfs/cntr/saveCntrMgt` |
| `selectExBookingInfo` | POST | `/api/cfs/exClp/selectExBookingInfo` |
| `saveManualIO` | POST | `/api/cfs/cntr/saveManualIO` |

### 수입업무[내국화물]  
`CFS_DOMESTIC`

#### 컨테이너 DB 등록  
`FCntrDBRgstMgt` · 화면 `cfs/FCntrDBRgstMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/cntr/selectImCntrMgtList` |
| `callAPi` | POST | `/api/cfs/cntr/callCntrMgtList` |
| `save` | POST | `/api/cfs/cntr/saveCntrMgtUp` |

#### 컨테이너 DB리스트  
`FCntrDBListMgt` · 화면 `cfs/FCntrDBListMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/cntr/selectImCntrMgtList` |
| `save` | POST | `/api/cfs/cntr/saveCntrMgt` |
| `delete` | POST | `/api/cfs/cntr/deleteImCntrMgt` |

#### 내장통관직상차 관리  
`FOrdMgt` · 화면 `cfs/FOrdMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/imcord/selectImcOrdList` |
| `exit` | POST | `/api/cfs/allo/extAllo` |
| `save` | POST | `/api/cfs/imcord/saveImcOrd` |

#### 내장통관 거래명세서 관리  
`FBltCustTransSttMgt` · 화면 `cfs/FBltCustTransSttMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `searchNoBillCntrMgtInfo` | POST | `/api/cfs/BltCust/selectNoBillCntrMgtInfo` |
| `searchNoBillChgList` | POST | `/api/cfs/BltCust/selectNoBillChgList` |
| `searchNoBillCntrList` | POST | `/api/cfs/BltCust/selectNoBillCntrList` |
| `searchSmMgtList` | POST | `/api/cfs/BltCust/selectSmMgtList` |
| `searchBillChgList` | POST | `/api/cfs/BltCust/selectBillChgList` |
| `searchBillCntrList` | POST | `/api/cfs/BltCust/selectBillCntrList` |
| `save` | POST | `/api/cfs/BltCust/saveSmMgt` |
| `delete` | POST | `/api/cfs/BltCust/deleteSmMgt` |
| `selectCorpBillPic` | POST | `/api/mdm/code/selectCorpBillPicList` |
| `selectTariffCalc` | POST | `/api/cfs/BltCust/selectTariffCalc` |
| `selectPrintSmMgtList` | POST | `/api/cfs/BltCust/selectPrintSmMgtList` |

### 배차관리  
`CFS_ALLO`

#### Shipping Order 관리  
`FShipOrdMgt` · 화면 `cfs/FShipOrdMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/exShipOrdMgt/selectExShipOrdList` |
| `searchCntr` | POST | `/api/cfs/exShipOrdMgt/selectExShipOrdCntrList` |
| `save` | POST | `/api/cfs/exShipOrdMgt/saveExShipOrd` |
| `saveDtl` | POST | `/api/cfs/exShipOrdMgt/saveExShipOrdDtl` |
| `delete` | POST | `/api/cfs/exShipOrdMgt/deleteExShipOrd` |
| `updateExhOrd` | POST | `/api/cfs/exShipOrdMgt/updateExhOrd` |
| `selectExBookingInfo` | POST | `/api/cfs/exClp/selectExBookingInfo` |
| `selectExBookingListInfo` | POST | `/api/cfs/exClp/selectExBookingListInfo` |
| `saveWrkYn` | POST | `/api/cfs/exOrd/saveWrkYn` |

#### 배차관리(수출) 픽업  
`FExAlloMgtP` · 화면 `cfs/FExAlloMgtP`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/allo/selectExAlloPList` |
| `searchCntr` | POST | `/api/cfs/allo/selectExAlloCntrPList` |
| `updateAlloExcp` | POST | `/api/cfs/exOrd/updateAlloExcp` |
| `delete` | POST | `/api/cfs/exOrd/deleteExhOrdMgt` |
| `saveWrkYn` | POST | `/api/cfs/exOrd/saveWrkYn` |
| `exit` | POST | `/api/cfs/allo/extAllo` |
| `update` | POST | `/api/cfs/allo/updateEx` |
| `updatePay` | POST | `/api/cfs/allo/searchStdPayTariffList` |
| `save` | POST | `/api/cfs/allo/saveExAlloP` |

#### 배차관리(수출) 반입  
`FExAlloMgtR` · 화면 `cfs/FExAlloMgtR`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/allo/selectExAlloRList` |
| `exit` | POST | `/api/cfs/allo/extAllo` |
| `update` | POST | `/api/cfs/allo/updateEx` |
| `updatePay` | POST | `/api/cfs/allo/searchStdPayTariffList` |
| `save` | POST | `/api/cfs/allo/saveExAlloR` |

#### 배차관리(수입)  
`FImAlloMgt` · 화면 `cfs/FImAlloMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/allo/selectImAlloList` |
| `searchDtl` | POST | `/api/cfs/allo/selectAlloImDtlList` |
| `exit` | POST | `/api/cfs/allo/extAllo` |
| `update` | POST | `/api/cfs/allo/updateIm` |
| `updatePay` | POST | `/api/cfs/allo/searchStdPayTariffList` |
| `save` | POST | `/api/cfs/allo/saveAllo` |
| `saveDtl` | POST | `/api/cfs/allo/saveAlloDtl` |
| `selectPartner` | POST | `/api/cms/popup/selectCommonPopupCorp` |
| `autoReturnEmptyCntr` | POST | `/api/cfs/allo/autoReturnEmptyCntr` |
| `updateEmptyCntrReturnDate` | POST | `/api/cfs/allo/updateEmptyCntrReturnDate` |

#### 게이트로그 프리즘 3.0  
`FPrismGateLogMgt` · 화면 `cfs/FPrismGateLogMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/prism/selectGateLogList` |
| `save` | POST | `/api/cfs/prism/saveGateLog` |
| `updateStTrmn` | POST | `/api/cfs/prism/updateStTrmn` |
| `saveStTrmn` | POST | `/api/cfs/prism/saveStTrmn` |

### 공통업무  
`CFS_COMMON`

#### CFS 요율관리  
`FCfsTariffMgt` · 화면 `cfs/FCfsTariffMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/Tariff/selectCfsTariffHdList` |
| `searchDetail` | POST | `/api/cfs/Tariff/selectCfsTariffDetailList` |
| `save` | POST | `/api/cfs/Tariff/saveCfsTariff` |
| `searchDetailCopy` | POST | `/api/cfs/Tariff/selectCfsTariffDetailCopyList` |

#### 컨테이너 Movement  
`FCntrDailyMov` · 화면 `cfs/FCntrDailyMov`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/cntr/selectCntrMgtLogList` |
| `save` | POST | `/api/cfs/cntr/saveCntrMgt` |

#### 청구 및 수금현황  
`FBillCollStatus` · 화면 `cfs/FBillCollStatus`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/fBillCollStatus/selectBillingList` |
| `cancelGroupBilling` | POST | `/api/cfs/fBillCollStatus/cancelGroupBilling` |
| `selectCorpBillPic` | POST | `/api/mdm/code/selectCorpBillPicList` |

#### 기타 거래명세서 관리  
`FOtherTransSttMgt` · 화면 `cfs/FOtherTransSttMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/BltCust/selectOtherTransList` |
| `searchBillChgList` | POST | `/api/cfs/BltCust/selectBillChgList` |
| `save` | POST | `/api/cfs/BltCust/saveSmMgt` |
| `delete` | POST | `/api/cfs/BltCust/deleteSmMgt` |
| `selectCorpBillPic` | POST | `/api/mdm/code/selectCorpBillPicList` |
| `selectOtherTarrifList` | POST | `/api/cfs/BltCust/selectOtherTarrifList` |
| `selectTariffCalc` | POST | `/api/cfs/BltCust/selectTariffCalc` |
| `selectPrintOtherTransList` | POST | `/api/cfs/BltCust/selectPrintOtherTransList` |

#### 통합 매출 조회  
`FTotSaleStatus` · 화면 `cfs/FTotSaleStatus`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/fTotSaleStatus/selectTotalSalesList` |

#### 매출세금계산서 관리  
`FSalesTaxMgt` · 화면 `cfs/FSalesTaxMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/fSalesTaxMgt/selectTaxMgtList` |
| `save` | POST | `/api/cfs/fSalesTaxMgt/saveRemark` |
| `searchBillDiv` | POST | `/api/cfs/fSalesTaxMgt/selectBillList` |
| `searchLogisBill` | POST | `/api/cfs/fSalesTaxMgt/selectLogisBill` |
| `issueTaxBill` | POST | `/api/cfs/fSalesTaxMgt/issueTaxBill` |
| `cancelTaxBill` | POST | `/api/cfs/fSalesTaxMgt/cancelTaxBill` |
| `saveAccounting` | POST | `/api/cfs/fSalesTaxMgt/saveAccounting` |
| `cancelAccounting` | POST | `/api/cfs/fSalesTaxMgt/cancelAccounting` |
| `selectBillTaxCntrList` | POST | `/api/cfs/fSalesTaxMgt/selectBillTaxCntrList` |
| `resendMail` | POST | `/api/cfs/fSalesTaxMgt/resendMail` |
| `selectCorpBillPic` | POST | `/api/mdm/code/selectCorpBillPicList` |

#### (CFS) CFS 영업사원 실적현황  
`BwsPicPFList` · 화면 `bws/BwsPicPFList`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/bws/bwsList/selectOPManSttList` |

#### CFS 기준정보  
`CFS_MA`

##### CFS 권역관리  
`MdmCfsRegionMgt` · 화면 `mdm/code/MdmCfsRegionMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/code/selectMdmCfsTransRectMgt` |
| `save` | POST | `/api/mdm/code/saveMdmShTransRectMgt` |

##### CFS 타리프 관리  
`MdmCfsTariffMgt` · 화면 `mdm/tariff/MdmCfsTariffMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/tariff2/selectMdmTariffMgt` |
| `save` | POST | `/api/mdm/tariff2/saveMdmTariffMgt` |
| `delete` | POST | `/api/mdm/tariff2/deleteMdmTariffMgt` |

##### 국가코드 관리  
`MdmCountry` · 화면 `mdm/code/MdmCountryMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/code/selectMdmCountryMgt` |
| `save` | POST | `/api/mdm/code/saveMdmCountryMgt` |

##### 선사/항공사 관리  
`MdmCarrier` · 화면 `mdm/code/MdmCarrierMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/code/selectMdmCarrierMgt` |
| `save` | POST | `/api/mdm/code/saveMdmCarrierMgt` |
| `delete` | POST | `/api/mdm/code/deleteMdmCarrierMgt` |

##### 통화코드 관리  
`MdmCurrency` · 화면 `mdm/code/MdmCurrencyMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/code/selectMdmCurrencyMgt` |
| `save` | POST | `/api/mdm/code/saveMdmCurrencyMgt` |

##### 창고 코드 관리  
`MdmWarehouseMgt` · 화면 `mdm/code/MdmWarehouseMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/code/selectMdmWarehouseMgt` |
| `save` | POST | `/api/mdm/code/saveMdmWarehouseMgt` |

##### CFS 화주 관리  
`FShprMgt` · 화면 `cfs/FShprMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/fShprMgt/selectFShprMgt` |
| `save` | POST | `/api/cfs/fShprMgt/saveFShprMgt` |

##### 영업창고 상품코드  
`FCfsSalesItemMgt` · 화면 `cfs/FCfsSalesItemMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/sales/selectZCfsItemMgt` |
| `save` | POST | `/api/cfs/sales/saveZCfsItemMgt` |

### CFS영업창고  
`CFS_SALES`

#### 반입관리(영업창고)  
`FCfsSalesInMgt` · 화면 `cfs/FCfsSalesInMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/sales/selectIn` |
| `save` | POST | `/api/cfs/sales/saveIn` |
| `delete` | POST | `/api/cfs/sales/deleteIn` |

#### 반입조회(영업창고)  
`FCfsSalesInSearch` · 화면 `cfs/FCfsSalesInSearch`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/sales/selectInList` |

#### 반출관리(영업창고)  
`FCfsSalesOutMgt` · 화면 `cfs/FCfsSalesOutMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/sales/selectOut` |
| `save` | POST | `/api/cfs/sales/saveOut` |
| `delete` | POST | `/api/cfs/sales/deleteOut` |
| `searchStock` | POST | `/api/cfs/sales/selectInList` |

#### 반출조회(영업창고)  
`FCfsSalesOutSearch` · 화면 `cfs/FCfsSalesOutSearch`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/sales/selectOutList` |

#### 재고조회(영업창고)  
`FCfsSalesStock` · 화면 `cfs/FCfsSalesStock`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/sales/selectStockList` |
| `searchOut` | POST | `/api/cfs/sales/selectOutList` |

#### 보관료 정산관리(영업창고)  
`FCfsSalesAcct` · 화면 `cfs/FCfsSalesAcct`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cfs/sales/selectAcct` |
| `searchDetail` | POST | `/api/cfs/sales/selectAcctList` |
| `save` | POST | `/api/cfs/sales/saveAcct` |
| `delete` | POST | `/api/cfs/sales/deleteAcct` |
| `print` | POST | `/api/cfs/sales/printAcct` |

## 공통 기준정보  
`MA`

### 거래처 계약관리  
`MA_1200060` · 화면 `mdm/customer/MdmContract`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/contract/selectMdmContract` |
| `save` | POST | `/api/mdm/contract/saveMdmContract` |
| `updateFileDoc` | POST | `/api/mdm/contract/updateFileDoc` |

### 배차차량 관리  
`MA_1200010` · 화면 `mdm/code/MdmDspVhcMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/code/selectMdmDspVhcMgt` |
| `save` | POST | `/api/mdm/code/saveMdmDspVhcMgt` |
| `valid` | POST | `/api/mdm/code/validMdmDspVhcMgt` |
| `rest` | POST | `/api/mdm/code/restMdmDspVhcMgt` |

### 위험물 관리  
`MA_103000` · 화면 `mdm/code/MdmImdgMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/code/selectMdmImdgMgt` |
| `save` | POST | `/api/mdm/code/saveMdmImdgMgt` |

### 선사 관리  
`MA_101400` · 화면 `mdm/code/MdmLineMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/code/selectMdmLineMgt` |
| `save` | POST | `/api/mdm/code/saveMdmLineMgt` |
| `delete` | POST | `/api/mdm/code/deleteMdmLineMgt` |
| `getReadLine` | POST | `/api/mdm/code/getReadLine` |

### 포트 코드 관리  
`MA_102000` · 화면 `mdm/code/MdmPortMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/code/selectMdmPortMgt` |
| `save` | POST | `/api/mdm/code/saveMdmPortMgt` |

### 위수탁 및 장기용차 계약관리  
`MA_1200062` · 화면 `mdm/customer/MdmVhcContract`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/contract/selectMdmVhcContract` |
| `save` | POST | `/api/mdm/contract/saveMdmVhcContract` |
| `updateFileDoc` | POST | `/api/mdm/contract/updateFileDoc_VHC` |

### 특이사항 관리대장  
`MA_1200071` · 화면 `mdm/others/MdmInternalNote`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/code/selectMdmInternalNote` |
| `save` | POST | `/api/mdm/code/saveMdmInternalNote` |

### 보관소 관리대장  
`MA_1200072` · 화면 `mdm/others/MdmStorage`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/code/selectMdmStorage` |
| `save` | POST | `/api/mdm/code/saveMdmStorage` |

### 장치장 관리  
`MA_1400010` · 화면 `mdm/facl/MdmBndFaclMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/bnd/selectMdmBndFacl` |
| `save` | POST | `/api/mdm/bnd/saveMdmBndFacl` |
| `selectMdmWorkPlaceDo` | POST | `/api/mdm/workplace/selectMdmWorkPlaceDo` |
| `selectMdmWorkPlaceCity` | POST | `/api/mdm/workplace/selectMdmWorkPlaceCity` |
| `selectMdmWorkPlaceDong` | POST | `/api/mdm/workplace/selectMdmWorkPlaceDong` |

### 터미널 관리  
`MA_1100040` · 화면 `mdm/terminal/MdmTerminalMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/terminal/selectMdmTerminalMgt` |
| `save` | POST | `/api/mdm/terminal/saveMdmTerminalMgt` |

### 모선 관리  
`MdmVslMgt` · 화면 `mdm/code/MdmVslMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/code/selectMdmVslMgt` |
| `save` | POST | `/api/mdm/code/saveMdmVslMgt` |

## 시스템  
`CM`

### 사용자 관리  
`CM_1100000`

#### 회사 관리  
`CM_1100010` · 화면 `mdm/organization/MdmCorpMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/organization/selectMdmCorpMgt` |
| `save` | POST | `/api/mdm/organization/saveMdmCorpMgt` |
| `delete` | POST | `/api/mdm/organization/deleteMdmCorpMgt` |
| `validCorpCd` | POST | `/api/mdm/organization/validMdmCorpMgt` |
| `validCorpBsnLcnNmb` | POST | `/api/mdm/organization/validCorpBsnLcnNmb` |
| `searchInfo` | POST | `/api/mdm/organization/selectCmsCorpInfo` |
| `updateCorpUse` | POST | `/api/mdm/organization/updateCorpUse` |

#### 국양 직원 관리  
`CM_1100020` · 화면 `cms/comm/CmsUserMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cms/comm/selectCmsUserMgt` |
| `save` | POST | `/api/cms/comm/saveCmsUserMgt` |
| `delete` | POST | `/api/cms/comm/deleteCmsUserMgt` |
| `validUserId` | POST | `/api/cms/comm/validCmsUserMgtId` |
| `changeUserPassword` | POST | `/api/cms/comm/changeCmsUserMgtPwd` |
| `searchBranch` | POST | `/api/cms/comm/selectCmsUserBranch` |

#### 고객사 직원 관리  
`CM_1100030` · 화면 `cms/comm/CmsFwdUserMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cms/comm/selectCmsUserMgt` |
| `save` | POST | `/api/cms/comm/saveCmsUserMgt` |
| `delete` | POST | `/api/cms/comm/deleteCmsUserMgt` |
| `validUserId` | POST | `/api/cms/comm/validCmsUserMgtId` |
| `changeUserPassword` | POST | `/api/cms/comm/changeCmsUserMgtPwd` |

#### 협력사 직원 관리  
`CM_1100040` · 화면 `cms/comm/CmsPtnUserMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/cms/comm/selectCmsUserMgt` |
| `save` | POST | `/api/cms/comm/saveCmsUserMgt` |
| `delete` | POST | `/api/cms/comm/deleteCmsUserMgt` |
| `validUserId` | POST | `/api/cms/comm/validCmsUserMgtId` |
| `changeUserPassword` | POST | `/api/cms/comm/changeCmsUserMgtPwd` |

#### 사용자별 권한설정  
`CM_1100050` · 화면 `mdm/user/MdmUserSetting`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/mdm/user/selectMdmUserList` |
| `searchSetting` | POST | `/api/mdm/user/selectMdmUserSetting` |
| `save` | POST | `/api/mdm/user/saveMdmUserSetting` |

### 팝업관리(CM)  
`CM_990000`

#### 파일관리팝업  
`CmsFileAgentPopup` · 화면 `cms/popup/CmsFileAgentPopup`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/file/selectFileList` |

추가 참조 엔드포인트: `/api/file/fileDownload`, `/api/file/multiFileUpload`, `/api/file/multiFileUploadForRequest`

#### 배차현황 팝업  
`AlloStatusPopup` · 화면 `allocation/popup/AlloStatusPopup`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/allocation/selectAllocation` |
| `selectWorkPlace` | POST | `/api/mdm/workplace/selectWorkPlace` |
| `updateOrderFileDoc` | POST | `/api/order/updateOrderFileDoc` |
| `updateAlloStatus` | POST | `/api/allocation/updateAlloStatus` |
| `save` | POST | `/api/allocation/saveAllocation` |
| `saveCntr` | POST | `/api/allocation/saveCntr` |
| `selectTrainList` | POST | `/api/allocation/selectTrainList` |
| `deleteAllocation` | POST | `/api/allocation/deleteAllocation` |
| `validSelfTransAppr` | POST | `/api/allocation/validSelfTransAppr` |
| `clipBoardAlloAlertMsg` | POST | `/api/allocation/clipBoardAlloAlertMsg` |
| `cancelUltOrder` | POST | `/api/dr/allo/cancelUltOrder` |

### 대시보드  
`DV_160000`

#### Main  
`Dsh01` · 화면 `dsh/dashboard/Dsh01`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `selectMyDashboard` | POST | `/api/dsh/dashboard/selectMyDashboard` |
| `settingData` | POST | `/api/intro/tariff/selectIntroTariffSettingData` |
| `selectExcahgneRate` | POST | `/api/dsh/dashboard/selectExcahgneRate` |
| `search` | POST | `/api/dsh/dashboard/selectCustomNotice` |
| `searchView` | POST | `/api/dsh/dashboard/selectCustomNoticeView` |

## 법제도이행관리  
`LG`

### 실적신고관리  
`PerformDeclareMgt` · 화면 `legal/PerformDeclareMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/legal/perform/selectPerfromDeclare` |
| `selectCntr` | POST | `/api/legal/perform/selectPerfromDeclareCntr` |

### 차량위치추적  
`VhcLocTrckMgt` · 화면 `legal/VhcLocTrckMgt`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/legal/vhcLocTrck/selectVhcLocTrckMgtList` |

## 고객서비스관리  
`DV_170000` · 화면 `db/request`

| 함수 | METHOD | 엔드포인트 |
|---|---|---|
| `search` | POST | `/api/db/request/selectDBRequest` |
| `save` | POST | `/api/db/request/saveDBRequest` |

