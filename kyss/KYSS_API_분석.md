# 국양로지텍 KYSS 전산시스템 — 시스템/API 완전 분석 (커넥터 개발용)

> 생성: Claude · 대상: https://www.kyss.co.kr · 로그인 계정: 안계문(국양로지텍) · 소속: 평택사무소(BRANCH=B6, DEPT=F10)
> 규모: API 엔드포인트 1333개 / 모듈 36개 / 화면 146개

---
## 1. 아키텍처 개요
- **프론트엔드**: Vue.js SPA(webpack, 청크 1153개 lazy-load). 데이터 그리드는 **AG-Grid**. 화면은 탭 방식.
- **백엔드**: REST API. 모든 업무 호출은 `https://www.kyss.co.kr/api/...` 로 **HTTP POST**, 본문은 JSON.
- **모듈 네임스페이스**: `/api/<모듈>/<서브>/<동사+명사>` 형태. 동사 접두어 = select(조회)/save(등록·수정)/delete(삭제)/update/insert/cancel/valid/issue/send/trans/process.
- **화면↔라우트**: Vue 라우트 경로가 곧 화면 식별자. 예: `outputs/statistics/pointByPFMSt` = "점소별 영업이익 현황".

## 2. 인증 (커넥터 필수)
- 로그인: `POST /api/login`, 로그아웃: `POST /api/logout`, 세션확인: `POST /api/session`.
- 세션은 **서버 세션 + 쿠키 기반**(JS에서 document.cookie로 안 보이는 HttpOnly 쿠키 / 보호된 sessionStorage 사용). 커넥터는 로그인 후 받은 **쿠키를 유지**해 후속 요청에 그대로 전송하면 됩니다(`credentials: include`).
- 브라우저에 이미 로그인돼 있으면 같은 세션에서 `fetch(url,{method:"POST",credentials:"include"})` 로 바로 호출 가능(본 분석도 이 방식).

## 3. 요청·응답 공통 규약
- **조회(select) 요청 본문**: 대부분 `{"SEARCH": { ...검색조건 }}` 형태. (팝업/코드 조회는 `{"SEARCH":{"POP_TP","SCH_CD","title",...}}`)
- **저장(save) 요청 본문**: `{"MAIN": {...헤더}, "<GRID>": [ {...행}, ... ]}` 형태(그리드 포함 화면).
- **응답 공통 봉투**: `{ "message": null|string, "data": <payload> }`. 목록형 payload는 `{ "DATA":[...], "PAGE_LENGTH": n }` 또는 `{ "<이름>_LIST":[...] }` / `{ "<이름>_GRID":[...] }`.
- **날짜**: 화면엔 `YYYY-MM`으로 보여도 서버엔 `YYYY-MM-01`(전체 날짜)로 전송되는 경우 많음. 플래그는 `"Y"/"N"`.

**범용 호출 템플릿(JS, 브라우저 세션 재사용):**
```js
async function kyss(path, search){
  const r = await fetch("https://www.kyss.co.kr/api/"+path, {
    method:"POST", credentials:"include",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify(search ? {SEARCH: search} : {})
  });
  return (await r.json()).data;
}
```

## 4. 실전 예제 — "6월 평택사무소 점소별이익 다운로드"
사용자가 위처럼 지시하면 아래로 해석·실행됩니다.

| 요소 | 값 |
|---|---|
| 화면 | **점소별 영업이익 현황** (TMS > 실적관리 > 통계) |
| 라우트 | `outputs/statistics/pointByPFMSt` |
| 조회 API | `POST /api/outputs/statssales/selectPointByPFMStList` |
| 상세 API | `POST /api/outputs/statssales/selectPointByPFMStDetail` |
| "평택사무소" | BRANCH 코드 = **`B6`** |
| "6월" | DATE_FM=`2026-06-01`, DATE_TO=`2026-06-01` (연월 범위, 1일자로 전송) |

**요청 본문:**
```json
{ "SEARCH": {
  "DATE_FM": "2026-06-01",   // 하불확정연월 시작
  "DATE_TO": "2026-06-01",   // 하불확정연월 종료
  "BRANCH": "B6",            // 영업소(평택사무소)
  "OP_DEPT": null,           // 부서(선택). null=전체
  "PAY_ZERO": "Y",           // 하불 0원 포함
  "BF_DATE_FM": "2025-06-01",// 전년동월 비교 시작(자동계산)
  "BF_DATE_TO": "2025-06-01" // 전년동월 비교 종료
} }
```
**응답(요약 그리드) `data.GRID_LIST[]`:**

| 필드 | 의미 |
|---|---|
| BRANCH / BRANCH_NM | 영업소 코드 / 명 |
| MONTH | 연월 (YYYY-MM) |
| M_BILL_AMOUNT | 청구금액 |
| M_PAY_AMOUNT | 하불금액 |
| M_PROFIT | 이익금액 |
| M_PROFIT_PER | 이익율(%) |
| M_ALLO_CNT | 배차건수 |
| DEPT_CD | 부서코드 |

> 검증됨(2026-07-20): 평택사무소 2026-04 → 청구 412,524,174 / 하불 386,767,066 / 이익 25,757,108 / 이익율 6.2% / 배차 994건.
> "다운로드" = 결과목록 우측 상단 초록 엑셀 아이콘(AG-Grid → xlsx, 클라이언트 내보내기). 상세행은 하단 "결과 상세" 그리드(BL/BKG·컨번호·화주·청구처·운송권역·상/하차지 등).

**영업소(BRANCH) 코드**: B6=평택사무소. 그 외 영업소명: 본사 / 울산사무소 / 인천사무소 / 의왕사무소 / 중부사무소 (코드는 화면 영업소 드롭다운 또는 공통코드로 확인). 로그인 사용자 담당자코드(OP_PIC)=`legendan200`.

## 5. 화면 인벤토리 (146개, 메뉴경로 > 화면명 :: 라우트)

- 고객서비스관리 :: `db/request`
- 공통 기준정보 > 거래처 계약관리 :: `mdm/customer/MdmContract`
- 공통 기준정보 > 모선 관리 :: `mdm/code/MdmVslMgt`
- 공통 기준정보 > 배차차량 관리 :: `mdm/code/MdmDspVhcMgt`
- 공통 기준정보 > 보관소 관리대장 :: `mdm/others/MdmStorage`
- 공통 기준정보 > 선사 관리 :: `mdm/code/MdmLineMgt`
- 공통 기준정보 > 위수탁 및 장기용차 계약관리 :: `mdm/customer/MdmVhcContract`
- 공통 기준정보 > 위험물 관리 :: `mdm/code/MdmImdgMgt`
- 공통 기준정보 > 장치장 관리 :: `mdm/facl/MdmBndFaclMgt`
- 공통 기준정보 > 터미널 관리 :: `mdm/terminal/MdmTerminalMgt`
- 공통 기준정보 > 특이사항 관리대장 :: `mdm/others/MdmInternalNote`
- 공통 기준정보 > 포트 코드 관리 :: `mdm/code/MdmPortMgt`
- 법제도이행관리 > 실적신고관리 :: `legal/PerformDeclareMgt`
- 법제도이행관리 > 차량위치추적 :: `legal/VhcLocTrckMgt`
- 시스템 > 대시보드 > Main :: `dsh/dashboard/Dsh01`
- 시스템 > 사용자 관리 > 고객사 직원 관리 :: `cms/comm/CmsFwdUserMgt`
- 시스템 > 사용자 관리 > 국양 직원 관리 :: `cms/comm/CmsUserMgt`
- 시스템 > 사용자 관리 > 사용자별 권한설정 :: `mdm/user/MdmUserSetting`
- 시스템 > 사용자 관리 > 협력사 직원 관리 :: `cms/comm/CmsPtnUserMgt`
- 시스템 > 사용자 관리 > 회사 관리 :: `mdm/organization/MdmCorpMgt`
- 시스템 > 팝업관리(CM) > 배차현황 팝업 :: `allocation/popup/AlloStatusPopup`
- 시스템 > 팝업관리(CM) > 파일관리팝업 :: `cms/popup/CmsFileAgentPopup`
- CFS > 공통업무 > (CFS) CFS 영업사원 실적현황 :: `bws/BwsPicPFList`
- CFS > 공통업무 > 기타 거래명세서 관리 :: `cfs/FOtherTransSttMgt`
- CFS > 공통업무 > 매출세금계산서 관리 :: `cfs/FSalesTaxMgt`
- CFS > 공통업무 > 청구 및 수금현황 :: `cfs/FBillCollStatus`
- CFS > 공통업무 > 컨테이너 Movement :: `cfs/FCntrDailyMov`
- CFS > 공통업무 > 통합 매출 조회 :: `cfs/FTotSaleStatus`
- CFS > 공통업무 > CFS 기준정보 > 국가코드 관리 :: `mdm/code/MdmCountryMgt`
- CFS > 공통업무 > CFS 기준정보 > 선사/항공사 관리 :: `mdm/code/MdmCarrierMgt`
- CFS > 공통업무 > CFS 기준정보 > 영업창고 상품코드 :: `cfs/FCfsSalesItemMgt`
- CFS > 공통업무 > CFS 기준정보 > 창고 코드 관리 :: `mdm/code/MdmWarehouseMgt`
- CFS > 공통업무 > CFS 기준정보 > 통화코드 관리 :: `mdm/code/MdmCurrencyMgt`
- CFS > 공통업무 > CFS 기준정보 > CFS 권역관리 :: `mdm/code/MdmCfsRegionMgt`
- CFS > 공통업무 > CFS 기준정보 > CFS 타리프 관리 :: `mdm/tariff/MdmCfsTariffMgt`
- CFS > 공통업무 > CFS 기준정보 > CFS 화주 관리 :: `cfs/FShprMgt`
- CFS > 공통업무 > CFS 요율관리 :: `cfs/FCfsTariffMgt`
- CFS > 배차관리 > 게이트로그 프리즘 3.0 :: `cfs/FPrismGateLogMgt`
- CFS > 배차관리 > 배차관리(수입) :: `cfs/FImAlloMgt`
- CFS > 배차관리 > 배차관리(수출) 반입 :: `cfs/FExAlloMgtR`
- CFS > 배차관리 > 배차관리(수출) 픽업 :: `cfs/FExAlloMgtP`
- CFS > 배차관리 > Shipping Order 관리 :: `cfs/FShipOrdMgt`
- CFS > 수입업무[내국화물] > 내장통관 거래명세서 관리 :: `cfs/FBltCustTransSttMgt`
- CFS > 수입업무[내국화물] > 내장통관직상차 관리 :: `cfs/FOrdMgt`
- CFS > 수입업무[내국화물] > 컨테이너 DB 등록 :: `cfs/FCntrDBRgstMgt`
- CFS > 수입업무[내국화물] > 컨테이너 DB리스트 :: `cfs/FCntrDBListMgt`
- CFS > 수출업무[FCL] > 거래명세서 관리(현수) :: `cfs/FRcvHOrdTransSttMgt`
- CFS > 수출업무[FCL] > 입고오더관리 (현수) :: `cfs/FRcvHOrdMgt`
- CFS > 수출업무[FCL] > 입고오더등록 (현수) :: `cfs/FRcvHOrdReqMgt`
- CFS > 수출업무[FCL] > 입고컨테이너관리 (현수) :: `cfs/FRcvHOrdSchMgt`
- CFS > 수출업무[FCL] > 컨테이너 반출입 관리 :: `cfs/FCntrCarryMgt`
- CFS > 수출업무[LCL] > 기타이고반출 관리 :: `cfs/FTrfCrgIsuMgt`
- CFS > 수출업무[LCL] > 입고오더등록 (클락) :: `cfs/FRcvCOrdReqMgt`
- CFS > 수출업무[LCL] > 입고오더조회 (클락) :: `cfs/FRcvCOrdSchMgt`
- CFS > 수출업무[LCL] > 입고현황조회(고객용) :: `cfs/FRcvCOrdSchList`
- CFS > 수출업무[LCL] > 컨테이너적입관리 (FCL) :: `cfs/FClpFclMgt`
- CFS > 수출업무[LCL] > 컨테이너적입관리 (LCL) :: `cfs/FClpLclMgt`
- CFS > 수출업무[LCL] > 컨테이너적입현황 조회 :: `cfs/FClpSchMgt`
- CFS > 수출업무[LCL] > CERTIFICATE 관리 :: `cfs/FCertMgt`
- CFS > CFS영업창고 > 반입관리(영업창고) :: `cfs/FCfsSalesInMgt`
- CFS > CFS영업창고 > 반입조회(영업창고) :: `cfs/FCfsSalesInSearch`
- CFS > CFS영업창고 > 반출관리(영업창고) :: `cfs/FCfsSalesOutMgt`
- CFS > CFS영업창고 > 반출조회(영업창고) :: `cfs/FCfsSalesOutSearch`
- CFS > CFS영업창고 > 보관료 정산관리(영업창고) :: `cfs/FCfsSalesAcct`
- CFS > CFS영업창고 > 재고조회(영업창고) :: `cfs/FCfsSalesStock`
- TMS > 간편 오더 > 간편 오더 등록 :: `order/door/simple/ordSimRequest`
- TMS > 간편 오더 > 간편 오더 조회 :: `order/door/simple/ordSimSearch`
- TMS > 고객센터 > 고객사 공지사항 :: `dsh/dashboard/customNoticeList`
- TMS > 고객센터 > 공지사항 :: `db/notice`
- TMS > 고객센터 > 안전운임제 :: `db/tariff`
- TMS > 고객센터 > 컨테이너 정보 :: `db/containerInfo`
- TMS > 고객센터 > FAQ :: `db/faq`
- TMS > 배차 관리 > 도어배차 :: `allocation/door/directAlloAndCopinoV2`
- TMS > 배차 관리 > 배차 현황 조회 :: `allocation/door/alloStatusSearch`
- TMS > 배차 관리 > 직접 배차 및 코피노 :: `allocation/door/directAlloAndCopino`
- TMS > 배차 관리 > 차량 할당 (수입) :: `allocation/door/allocationTruckImport`
- TMS > 배차 관리 > 차량 할당 (수출) :: `allocation/door/allocationTruck`
- TMS > 보세운송 > 보세운송 전송 및 관리 :: `bnd/BndTransMgt`
- TMS > 보세운송 > 적하목록 업로드 :: `bnd/MfcsUpload`
- TMS > 보세운송 > 적하목록 조회 :: `bnd/MfcsSearch`
- TMS > 보세운송 > 정정신고 송수신 :: `bnd/BndUpdate`
- TMS > 보세운송_V2 > 보세운송 전송 및 관리_V2 :: `bnd-v2/BndTransMgt-v2`
- TMS > 보세운송_V2 > 임시개청신청 :: `bnd-v2/BndOpenTrans`
- TMS > 보세운송_V2 > 정정신고 송수신_V2 :: `bnd-v2/BndUpdate-v2`
- TMS > 셔틀 오더 > 그룹오더 진행상태 및 변경 :: `allocation/shuttle/GroupOrderStatus`
- TMS > 셔틀 오더 > 그룹오더배차 :: `allocation/shuttle/GroupOrderAllocation`
- TMS > 셔틀 오더 > 그룹오더생성 :: `allocation/shuttle/GroupOrderRegist`
- TMS > 셔틀 오더 > 셔틀 Daily Closing List :: `order/shuttle/orderClosingList`
- TMS > 셔틀 오더 > 셔틀배차 :: `allocation/shuttle/allocationTruck`
- TMS > 셔틀 오더 > 셔틀오더 등록 및 조회 :: `order/shuttle/orderRequestMgt`
- TMS > 셔틀 오더 > 실적통합관리(셔틀) :: `outputs/shutTotalOutputMgt`
- TMS > 셔틀 오더 > 전배보세 등록 :: `order/shuttle/BndCntrMgt`
- TMS > 수입 오더 > 고객사 수입 오더 상세 :: `order/door/import/orderRequestMgt`
- TMS > 수입 오더 > 고객사 수입 오더 조회 :: `order/door/import/orderSearchMgt`
- TMS > 수입 오더 > 수입오더등록 :: `order/door/import/orderRequest`
- TMS > 수입 오더 > 수입오더조회 :: `order/door/import/orderSearch`
- TMS > 수출 오더 > 고객사 수출 오더 상세 :: `order/door/export/orderRequestMgt`
- TMS > 수출 오더 > 고객사 수출 오더 조회 :: `order/door/export/orderSearchMgt`
- TMS > 수출 오더 > 수출오더등록 :: `order/door/export/orderRequest`
- TMS > 수출 오더 > 수출오더조회 :: `order/door/export/orderSearch`
- TMS > 실적관리 > 거래처별 청구집계 :: `outputs/billingTot/billTotByAcc`
- TMS > 실적관리 > 경영정보 > 손익현황 :: `outputs/management/profitNLossStat`
- TMS > 실적관리 > 경영정보 > 실시간 차량 매출 현황 :: `outputs/management/rtVhcRevSt`
- TMS > 실적관리 > 경영정보 > 오더접수현황 :: `outputs/management/orderRecvSt`
- TMS > 실적관리 > 경영정보 > 용차사 매출입현황 :: `outputs/management/hiredCarCorpBillPaySt`
- TMS > 실적관리 > 경영정보 > 차량매출 :: `outputs/management/vhcSales`
- TMS > 실적관리 > 경영정보 > 차량별 운행실적 (배차형평성) :: `outputs/management/vhcTrcStat`
- TMS > 실적관리 > 경영정보 > 차량별 지급 공제관리 :: `outputs/management/vhcPayDdcMgt`
- TMS > 실적관리 > 당월 포인트 현황 :: `outputs/monPointSt`
- TMS > 실적관리 > 실적통합관리 :: `outputs/totalOutputMgt`
- TMS > 실적관리 > 통계 > (영업) 영업사원 실적현황 :: `outputs/statistics/opOpPicPFMSt`
- TMS > 실적관리 > 통계 > (영업) 월별&업체별 실적현황 :: `outputs/statistics/opMonNCorpPFMSt`
- TMS > 실적관리 > 통계 > 기간별&업체별 하불현황 :: `outputs/statistics/termNCorpPaySt`
- TMS > 실적관리 > 통계 > 영업담당자별 매출현황 :: `outputs/statistics/opPicByBillSt`
- TMS > 실적관리 > 통계 > 영업사원 실적현황 :: `outputs/statistics/opPicPFMSt`
- TMS > 실적관리 > 통계 > 월별&업체별 매출현황 :: `outputs/statistics/monNCorpBillSt`
- TMS > 실적관리 > 통계 > 월별&업체별 실적현황 :: `outputs/statistics/monNCorpPFMSt`
- TMS > 실적관리 > 통계 > 점소별 영업이익 현황 :: `outputs/statistics/pointByPFMSt`
- TMS > 실적관리 > 통계 > 청구처별 미수현황 :: `outputs/statistics/billCorpByUnpaidSt`
- TMS > 실적관리 > 통합 오더 조회 :: `order/door/total/orderSearchMgt`
- TMS > 실적관리 > 하불승인 :: `outputs/payApprMgt`
- TMS > 실적관리 > 하불집계 > 매입처현황 :: `outputs/payTot/payCorpStatus`
- TMS > 실적관리 > 하불집계 > 차량별 정산서 :: `outputs/payTot/stateOfAccByVehicle`
- TMS > 정산관리 > 거래명세서 :: `sm/TransSpec`
- TMS > 정산관리 > 거래명세서(협력사) :: `sm/TransSpecPtn`
- TMS > 정산관리 > 대납리스트 :: `sm/proxy/proxyList`
- TMS > 정산관리 > 선사BILL > BILL청구 :: `sm/lineBill/billMgt`
- TMS > 정산관리 > 수금관리 > 거래처별 청구수금 명세서 :: `sm/collect/billCollectByAcc`
- TMS > 정산관리 > 일반청구 > 미청구 및 이월청구 조회 :: `sm/generalBilling/carrybillingList`
- TMS > 정산관리 > 일반청구 > 전자세금계산서 관리 :: `sm/generalBilling/taxMgt`
- TMS > 정산관리 > 일반청구 > 청구마감 :: `sm/generalBilling/billingClosing`
- TMS > 정산관리 > 일반청구 > 청구마감(대용량) :: `sm/generalBilling/LargeBillingClosing`
- TMS > 정산관리 > 일반청구 > 청구현황 :: `sm/generalBilling/billingStatus`
- TMS > 정산관리 > 일반하불 > 매입세금계산서 :: `sm/generalPayment/taxMgt`
- TMS > 정산관리 > 일반하불 > 하불마감 및 현황 :: `sm/generalPayment/paymentClosing`
- TMS > 정산관리 > 일반하불 > 하불확정(대용량) :: `sm/generalPayment/paymentConf`
- TMS > TMS 기준정보 > 배차 기준정보 > 배차 팀 관리 :: `mdm/code/MdmAlloMgt`
- TMS > TMS 기준정보 > 배차 기준정보 > 장비관리 :: `mdm/code/MdmEqpMgt`
- TMS > TMS 기준정보 > 배차 기준정보 > 장비내역 수리관리 :: `mdm/code/MdmEqpRepairMgt`
- TMS > TMS 기준정보 > 오더 기준정보 > 고객사 메일관리 :: `mdm/customer/MdmCustomerMail`
- TMS > TMS 기준정보 > 오더 기준정보 > 셔틀 권역관리 :: `mdm/code/MdmShtlRegionMgt`
- TMS > TMS 기준정보 > 오더 기준정보 > 오더 공유팀 관리 :: `mdm/code/MdmOrdTeamMgt`
- TMS > TMS 기준정보 > 오더 기준정보 > 작업지 관리 :: `mdm/customer/MdmWorkPlace`
- TMS > TMS 기준정보 > 오더 기준정보 > 즐겨찾기 :: `cms/comm/CmsFavoritesMgt`
- TMS > TMS 기준정보 > 오더 기준정보 > 타리프 관리 :: `mdm/tariff/MdmTariffMgtV2`
- TMS > TMS 기준정보 > 오더 기준정보 > 화주 관리 :: `mdm/customer/MdmShipper`

## 6. 전체 API 카탈로그 (1333개 / 모듈별)
모든 호출은 `POST`. 경로는 `/api/` 이하만 표기.

### [cfs] CFS 창고·통관 업무(반입/반출/적입/배차/거래명세/세금)  (248)
- **BltCust**: deleteSmMgt, saveSmMgt, selectBillChgList, selectBillCntrClpList, selectBillCntrList, selectBndTarrifList, selectBndTarrifMinList, selectBndTransList, selectDomesticTransList, selectNoBillChgList, selectNoBillClpChgList, selectNoBillClpCntrList, selectNoBillClpCntrMgtInfo, selectNoBillCntrList, selectNoBillCntrMgtInfo, selectOtherTarrifList, selectOtherTransList, selectPrintBndTransList, selectPrintOtherTransList, selectPrintSmMgtClpList, selectPrintSmMgtList, selectSmMgtClpList, selectSmMgtList, selectStcTotAmount, selectTariffCalc, selectThcTotAmount
- **Tariff**: saveCfsTariff, selectCfsTariffDetailCopyList, selectCfsTariffDetailList, selectCfsTariffHdList
- **allo**: autoReturnEmptyCntr, cancelAllo, cancelAlloP, copino, extAllo, saveAllo, saveAlloDtl, saveAlloPartnerOrLine, saveAlloStrange, saveExAlloP, saveExAlloR, savePayment, searchStdPayTariff, searchStdPayTariffList, selectAlloImDtlList, selectAlloStrange, selectExAlloCntrPList, selectExAlloPList, selectExAlloRList, selectImAlloList, selectPaymentList, updateEmptyCntrReturnDate, updateEx, updateIm
- **bndTransMgt**: cargoEntryStatusCfs, deleteCusmovList, insertListBndMapOut, insertListBndSend, saveBnd, saveBndAlloEstTrans, saveBndAlloEstTrans_V2, saveBnd_V2, selectBndErrList, selectCusdmrList, selectCusdmrList_V2, selectCusmovDtlList, selectCusmovList, selectCusmovList_V2
- **bndUpdate**: insertBondModi, insertMapOut, saveBndUpdate, selectBndUpdate, selectBndUpdatePopup, selectBndUpdate_V2
- **cntr**: callCntrMgtList, deleteImCntrMgt, saveCntrMgt, saveCntrMgtUp, saveManualIO, selectCntrMgtLogList, selectExCntrMgtList, selectImCntrMgtList
- **cntrhis**: selectCntrMgtHisList
- **customApi**: cargoEntryStatusSearch
- **exClp**: checkClpStatus, deleteCntrNo, deleteExClp, reUpdateExBookingInfo, requestCancelClp, saveExFclClp, saveExLclClp, selectExBookingInfo, selectExBookingListInfo, selectExClpFcl, selectExClpLcl, selectExcClpList, selectExcRcvList, selectPrintFcl, selectPrintLcl, tranferClp, updateCargoInfo, updateExBookingInfo, updateLclCrg, updateLclRcv, validExClp
- **exOrd**: cancelWrng, deleteExcOrd, deleteExhCntrListMgt, deleteExhOrdMgt, saveExBkgOrdCrg, saveExcOrd, saveExhCntrMgt, saveExhOrd, saveExhOrdMgt, saveLkcYn, saveWrkYn, saveWrkYnAtOnce, selectExBkgOrdCrg, selectExBkgOrdCrgHis, selectExcOrd, selectExcOrdList, selectExhOrd, selectExhOrdCntrList, selectExhOrdList, selectExhOrdMgtList, selectRcvOrdSchDtlList, selectRcvOrdSchList, updateAlloExcp, updateExhOrd, validExcOrd, validExhOrd
- **exShipOrdMgt**: deleteExShipOrd, saveExShipOrd, saveExShipOrdDtl, selectExShipOrdCntrList, selectExShipOrdList, updateExhOrd, updateShipOrdCntr
- **fAcsNotiMgt**: deleteAcsNotiMgt, saveAcsNotiMgt, selectAcsNotiMgtList, selectEcgList, transAcsNotiMgt
- **fBillCollStatus**: cancelGroupBilling, groupBilling, selectBillList, selectBillingData, selectBillingList, sendBillingData
- **fCrtfMgt**: cancelGrpSm, deleteSmBill, saveGrpSm, saveSmBill, selectFCrtfCntrList, selectFCrtfMgtList, selectPrintBillList, selectPrintCertList, updateCrtfNoMgt
- **fSalesTaxMgt**: cancelAccounting, cancelTaxBill, issueModiBill, issueTaxBill, resendMail, saveAccounting, saveRemark, selectBillList, selectBillTaxCntrList, selectLogisBill, selectTaxMgtList
- **fShprMgt**: insertFShprMgt, saveFShprMgt, selectFShprMgt
- **fStcStt**: selectInOutStockStatusList, selectPrintInOutStockStatusList, selectStockStatusList
- **fTotSaleStatus**: selectTotalSalesList
- **im**: deleteImOut, saveDomesticOutCor, saveImOut, saveImOutCor, selectDomesticOutCorList, selectDomesticOutCorLogList, selectDomesticOutCorrectDtlList, selectDomesticOutList, selectImOutCorList, selectImOutCorLogList, selectImOutCorrectDtlList, selectImOutDetail, selectImOutList, transDomesticOut, transDomesticOutCor, transImOut, transImOutCor
- **imagree**: deleteImAgrMgt, saveImAgrMgt, selectImAgrMgtList, updateAgreeFile
- **imcord**: saveImcOrd, selectImcOrdList
- **imorder**: deleteImIn, saveDomesticInCor, saveImIn, saveImInCor, selectDomesticInCorList, selectDomesticInCorLogList, selectDomesticInCorrectDtlList, selectDomesticInList, selectErrList, selectImInCorList, selectImInCorLogList, selectImInCorrectDtlList, selectImInDtl, selectImInList, selectNotInCntrList, transDomesticIn, transDomesticInCor, transImIn, transImInCor
- **inplan**: deleteCePlan, saveCePlan, selectCePlanDetailList, selectCePlanHdList, selectCePlanList, selectInPlanList
- **prism**: saveGateLog, saveStTrmn, selectGateLogList, updateStTrmn
- **sales**: deleteAcct, deleteIn, deleteOut, printAcct, saveAcct, saveIn, saveOut, saveZCfsItemMgt, selectAcct, selectAcctList, selectIn, selectInList, selectOut, selectOutList, selectStockList, selectZCfsItemMgt
- **trfCrgIsuMgt**: deleteTrfCrgIsu, saveTrfCrgIsu, selectCrgIsuLog, selectTrfCrgIsuList

### [cy] 컨테이너 야드(CY) 터미널 운영 — 화면코드 E71xxx  (142)
- **(직접)**: blockChk, cntrChk, positionChk
- **E71A001C**: delete, save, select, selectCarrierCd, selectCustCd, selectShipperCd, updateChkYn, updateErrYn
- **E71A002C**: save, select
- **E71A003C**: save, select
- **E71A004C**: delete, save, select, selectBlockBay, selectInfo, updateSeq
- **E71A005C**: delete, save, select
- **E71A008C**: saveTerminalMgt, selectTerminalMgt
- **E71A009C**: saveTerminalMgt, selectTerminalMgt
- **E71A011C**: select
- **E71A012C**: save, select
- **E71A013C**: save, select
- **E71A014C**: save, select
- **E71A015C**: delete, save, select
- **E71A016C**: delete, save, select
- **E71A101C**: delete, insert, select, update
- **E71A102C**: save, select
- **E71A103C**: select
- **E71A104C**: select
- **E71A105C**: select
- **E71A106C**: select
- **E71A107C**: select, selectListDtl
- **E71A108C**: select
- **E71B001C**: refresh, save
- **E71C001C**: UpdateEq, cancelComplete, cancelOrderList, cntrEOrderData, cntrFromChk, cntrInfoOne, cntrOrderList, cntrStckList, login, orderComplete, positionChk, select, setInfo, vhcOrderSearch
- **E71D001C**: deleteYardInfo, saveYardInfo, selectYardInfo
- **E71E001C**: delete, save, select
- **E71E002C**: delete, paste, save, select
- **E71E003C**: save, select
- **E71E004C**: delete, save, select, selectDetail
- **E71E005C**: delete, save, select, selectDetail
- **E71E006C**: billUpdate, calculation, delete, deleteCntr, process, selectCnaccList, selectInvCn, selectInvLine, selectInvoiceList, selectTamtList
- **E71E007C**: process, selectInvcnList, selectInvlineList, selectInvoiceList, updateAppDt
- **E71E008C**: process, selectInvcnList, selectInvlineList, selectInvoiceList
- **E71F001C**: delete, insert, select, update
- **E71F002C**: select
- **E71F003C**: select
- **E71F004C**: select
- **E71F005C**: select
- **E71F006C**: select
- **E71F007C**: select
- **E71F008C**: select
- **E71F009C**: select
- **E71F010C**: select
- **E71J001C**: deleteYardOrder, insertYardOrder, selectOrderInfo, selectRowInfo, selectYardInfo, updateHot, updateYardOrder
- **config**: info, saveInfo
- **inv**: billingBlBndLicInv, cancelBlBndLicInv, selectBlBndLicInvList
- **order**: deleteCyOrder, saveCyOrder, selectOrderList
- **statics/E71A021C**: selectTimeList, selectWeekList
- **statics/E71A022C**: selectList
- **statics/E71A023C**: selectList, selectListDtl

### [mdm] 기준정보(Master Data) — 거래처·차량·선사·포트·타리프  (132)
- **bnd**: saveMdmBndFacl, selectMdmBndFacl
- **code**: deleteMdmCarrierMgt, deleteMdmLineMgt, deleteMdmSelPchMgt, excelUploadMdmEqpRepairMgt, getReadLine, restMdmDspVhcMgt, saerchEqpHistory, saveMdmCarrierMgt, saveMdmCfsItemMgt, saveMdmCountryMgt, saveMdmCurrencyMgt, saveMdmDspVhcMgt, saveMdmDspVhcPrtnMgt, saveMdmEqpCost, saveMdmEqpMgt, saveMdmEqpRepairMgt, saveMdmExrateMgt, saveMdmHscodeMgt, saveMdmImdgMgt, saveMdmInternalNote, saveMdmLineMgt, saveMdmManifestItem, saveMdmPackageUnit, saveMdmPortMgt, saveMdmRegionMgt, saveMdmRpaAccountMgt, saveMdmSelPchMgt, saveMdmShTransRectMgt, saveMdmStorage, saveMdmVesselMgt, saveMdmVslMgt, saveMdmWarehouseMgt, selectCorpBillPicList, selectEqpHistoryList, selectMdmCarrierMgt, selectMdmCfsItemMgt, selectMdmCfsTransRectMgt, selectMdmCountryMgt, selectMdmCurrencyMgt, selectMdmDspVhcMgt, selectMdmDspVhcPrtnMgt, selectMdmEqpCostList, selectMdmEqpMgt, selectMdmEqpRepairMgt, selectMdmExrateMgt, selectMdmHscodeMgt, selectMdmImdgMgt, selectMdmInternalNote, selectMdmLineMgt, selectMdmManifestItem, selectMdmPackageUnit, selectMdmPortMgt, selectMdmRegionMgt, selectMdmRpaAccountMgt, selectMdmSelPchJobTax, selectMdmSelPchMgt, selectMdmShTransRectMgt, selectMdmStorage, selectMdmVesselMgt, selectMdmVslMgt, selectMdmWarehouseMgt, updateEqpFileUpload, validMdmDspVhcMgt
- **code/dstrate**: save, upload
- **code/stdrate**: save, upload
- **comm**: savetMdmAlloUserMgt, savetMdmOrdUserMgt, selectMdmAlloMgt, selectMdmAlloUserMgt, selectMdmOrdTeamMgt, selectMdmOrdUserMgt
- **container**: saveMdmContainer, selectMdmContainer
- **contract**: renewlContract, saveMdmContract, saveMdmVhcContract, selectContractHistory, selectMdmContract, selectMdmVhcContract, selectVhcContractHistory, updateFileDoc, updateFileDoc_VHC
- **customer**: deleteMdmCustomerMgt, saveMdmCustomerMgt, selectMdmCustomerMgt, selectMdmCustomerMgtDetail
- **customerMail**: saveMdmContract, selectMdmCustomerMail
- **organization**: deleteMdmCorpMgt, saveMdmCorpMgt, selectCmsCorpInfo, selectMainInfo, selectMdmCorpMail, selectMdmCorpMgt, updateCorpUse, validCorpBsnLcnNmb, validMdmCorpMgt
- **shipper**: deleteMdmShipperMgt, save, saveMdmShipperMgt, selectList, selectMgrList, validationBln, validationShipper
- **tariff**: deleteMdmTariffMgt, saveMdmTariff, saveMdmTariffMgt, selectMdmTariffMgt
- **tariff2**: deleteMdmTariffMgt, saveMdmTariffMgt, selectMdmTariffMgt
- **terminal**: saveMdmTerminalMgt, selectMdmTerminalMgt
- **user**: saveMdmUserSetting, selectMdmUserList, selectMdmUserSetting
- **workplace**: deleteMdmWorkPlace, regionSet, saveMdmWorkPlace, saveMdmWorkPlaceAddPopup, selectChkLikeValue, selectMdmWorkPlace, selectMdmWorkPlaceCity, selectMdmWorkPlaceDetail, selectMdmWorkPlaceDo, selectMdmWorkPlaceDong, selectMdmWorkPlaceDongList, selectWorkPlace

### [wms] 창고관리(WMS) — 재고/입출고/인보이스  (117)
- **Tariff**: saveCfsTariff, selectCfsTariffDetailCopyList, selectCfsTariffDetailList, selectCfsTariffHdList, selectTariffList_v2
- **WmsInvEndMgt**: saveInvEndMgt, selectInvEndMgt
- **configuration**: deleteWareHouseConfigInfo, saveGateInfoByWhId, saveWareHouseConfigInfo, selectGateInfoByWhId, selectWareHouseConfig
- **monitoring**: selectInventoryInfo, selectWareHouseInfo, selectWhStatusList
- **wmsAgiMgt**: deleteAgiMgt, saveAgiInvDtl, saveAgiMgt, selectAgiDtlList, selectAgiInvDtlList, selectAgiMgtList
- **wmsAgrMgt**: deleteAgrMgt, saveAgrDim, saveAgrInvDtl, saveAgrMgt, saveAgrMgtAtWrk, saveInventoryLocation, selectAgrDimList, selectAgrDtlList, selectAgrInvDtlList, selectAgrMgtList, selectAgrWrkList, selectWhDetailInfo, selectWhList, updateAgrInvenInfo
- **wmsClpMgt**: deleteClpMgt, saveClpMgt, selectAgiWrkList, selectClpMgtDtlList, selectClpMgtList, selectClpMgtNotDtlList, updateClpNotState, updateClpState, updatePick
- **wmsEgiMgt**: deleteEgiMgt, saveEgiMgt, selectEgiDtlList, selectEgiMgtList
- **wmsEgrMgt**: callCntrMgtList, copyEgrMgt, deleteEgrMgt, saveEgrMgt, selectEgrDtlList, selectEgrMgtList, selectEgrTrkList
- **wmsEtcInvMgt**: deleteEtcInvMgt, saveEtcInvMgt, selectEtcInvMgtDtlList, selectEtcInvMgtList, selectEtcInvMgtPrintList
- **wmsGrgiList**: selectGrgiList
- **wmsInvConfrimMgt**: delete, save, selectGrpInvPrintList, selectInvList, selectInvPrintList, updateInvPrintDt
- **wmsInvList**: delete, save, selectGrpInvPrintList, selectInvList, selectInvPrintList, selectPrchsTotalInvPrintList, updateFileDoc, updateInvPrintDt
- **wmsInvMgt**: deleteInvMgt, saveInvMgt, selectInvMgtList, selectInvMgtPrintList
- **wmsInvPrchsgMgt**: deleteInvPrchsMgt, saveInvPrchsMgt, selectInvPrchsMgtDtlList, selectInvPrchsMgtList, selectInvPrchsMgtPrintList, selectStDayCalc, updateFileDoc
- **wmsInvStrgMgt**: deleteInvStrgMgt, saveInvStrgMgt, selectInvStrgMgtDtlList, selectInvStrgMgtList, selectInvStrgMgtPrintList, selectStDayCalc
- **wmsIvnList**: selectIvnList, selectLocationDtlList, selectLocationList
- **wmsPerformance**: selectCustSaleList, selectFrtSaleList, selectMonPtnList, selectTotalsaleList
- **wmsPftCustList**: selectBuyDetailList, selectDetailList, selectList
- **wmsTaxMgt**: cancelAccounting, cancelTaxBill, issueModiBill, issueTaxBill, saveAccounting, saveRemark, selectBillList, selectLogisBill, selectTaxMgtList
- **wmsTrfInvMgt**: delete, searchInvDtlList, searchTariffList, selectTariff, selectTrfInvList, updateInvDtl

### [bws] 보세창고(BWS) — AGI/AGR/적하목록/보세  (104)
- **Report**: PeriodPerformanceSelectList
- **Tariff**: saveCfsTariff, selectCfsTariffDetailCopyList, selectCfsTariffDetailList, selectCfsTariffHdList
- **TransStt**: checkBillNoForAgi, checkBillNoForAgr, deleteSmMgt, saveSmMgt, selectAgrTransList, selectBillChgList, selectBondedTransList, selectDomesticTransList, selectNewTransList, selectOtherTarrifList, selectOtherTransList, selectPrintOtherTransList, selectPrintTransList, selectTariff, selectTariffCalc, selectTariffList, selectTariffList_v2
- **UniCrossChk**: saveUniinfo, selectList
- **acsNoti**: deleteAcsNoti, saveAcsNoti, selectAcsCrgLdgList, selectAcsNotiList, transAcsNoti
- **agi**: deleteAgi, processAgiRcv, saveAgi, selectAgiDetatil, selectAgiList, transAgi, updateDt, updateEcgOff, updateEgiDlAlertOff
- **agi/alert**: selectNotOutAlertList, selectTransDeadLineAlertList
- **agiCorr**: deleteAgiCorr, saveAgiCorr, selectAgiCorrList, selectAgiCorrLogDtlList, selectAgiCorrLogList, transAgiCorr
- **agr**: deleteAgr, deleteFreeAgr, processAgrRcv, saveAgr, saveFreeAgr, selectAgrList, sendAgr, updateEgrDlAlertOff
- **agrAgiSt**: selectAgrAgiStList, selectCloseStCrgList, selectCustCrgList, selectDetailStockList, selectMonthAgrAgiList, selectPrintAgrAgiStList, selectTotStockList
- **agrCorr**: deleteAgrCorr, saveAgrCorr, selectAgrCorrList, selectAgrCorrLogDtlList, selectAgrCorrLogList, transAgrCorr
- **agree**: deleteAgree, saveAgree, selectAgreeList, updateAgreeFile
- **bwsList**: selectAgrAgiDivList, selectEcgList, selectOPManSttList
- **bwsPftCustList**: selectDetailList, selectList
- **cfsBillCollStatus**: cancelGroupBilling, groupBilling, selectBillList, selectBillingList
- **cfsSalesTaxMgt**: cancelTaxBill, issueTaxBill, resendMail, saveRemark, selectBillList, selectLogisBill, selectTaxMgtList
- **cfsTotSaleMgt**: selectTotalSalesList
- **dailyCrgReport**: selectDailyAgiCrgReportList, selectDailyAgrCrgReportList
- **egr**: callCntrMgtList, deleteEgrInfo, deleteEgrListInfo, saveEgrImportPrint, saveEgrInfo, saveEgrPrintRemark, selectEgrCntr, selectEgrList, selectEgrSearchList
- **scd**: saveAgrCrgScdMgt, selectAgrCrgScdMgt
- **undeclared**: deleteUnDeclaredAgriMgt, saveUnDeclaredAgriMgt, selectUnDeclaredAgriMgt

### [cms] 공통관리(메뉴/권한/사용자/코드/팝업)  (72)
- **comm**: changeCmsUserMgtPwd, changeMenuId, checkMenuId, copyCmsRoleMenuMgt, deleteCmsFavoritesMgt, deleteCmsUserMgt, deleteMenuMgt, saveCmsCdUserRank, saveCmsCorpPicMgt, saveCmsErrorLog, saveCmsFavoritesAddPopup, saveCmsFavoritesMgt, saveCmsKakaoTalkMgt, saveCmsRoleButtonMgt, saveCmsRoleMenuMgt, saveCmsRoleUserMgt, saveCmsUserMgt, saveCommonCode, saveDataDicMgt, saveLangMgt, saveMenuMgt, saveScreenMgt, selectCmsButtonRoleList, selectCmsCorpList, selectCmsCorpPicMgt, selectCmsDelLog, selectCmsEdiLog, selectCmsErrorLog, selectCmsFavoritesMgt, selectCmsKakaoTalkSkillMgt, selectCmsKakaoTalkTemplateMgt, selectCmsMenuRoleList, selectCmsRoleButtonAuth, selectCmsRoleButtonMgt, selectCmsRoleButtonSet, selectCmsRoleMenuAuth, selectCmsRoleMgt, selectCmsRoleUserMgt, selectCmsUserBranch, selectCmsUserMgt, selectCommonCode, selectCommonCodeDetail, selectCommonWorkPlace, selectCsmUserInfo, selectDataDicMgt, selectLangMgt, selectMenuMgt, selectScreenMgt, validCmsUserMgtId, validFavoritesCode
- **history**: selectCmsOrderHistory, selectCmsVisitLog
- **popup**: deleteTemplateBoardMgt, saveDocumentMgt, saveTemplateBoardMgt, selectCommonPopup, selectCommonPopupAlloTeam, selectCommonPopupAlloTeamUserList, selectCommonPopupAllocationTruck, selectCommonPopupBilling, selectCommonPopupCorp, selectCommonPopupCorpUser, selectCommonPopupCpWrk, selectCommonPopupGroupOrderVhcReg, selectCommonPopupPic, selectDocumentMgt, selectTemplateBoardMgt, selectTextSearchCommonPopup, updateTemplateBoardMgt
- **setting**: saveCmsAutonoRuleMgt, selectCmsAutonoRuleList, selectCmsAutonoTypeList

### [sm] 정산(청구/하불/대납/거래명세/세금계산서)  (70)
- **TrkPaymentList**: selectTrkPaymentList
- **carryBill**: carryBillListApprSave, carryBillListRmkSave, carryBillListSearch
- **collect**: selectBillCollectByAccDtlList, selectBillCollectByAccList
- **generalBilling**: billingClosingExcel, cancelAccounting, cancelBillingClose, cancelSKClosing, cancelSkInvList, changeMergeBilling, executeSKClosing, issueSkInvList, saveAccounting, saveTax, selectBillingClosingBillPicList, selectBillingClosingCorpList, selectBillingClosingList, selectBillingDetailList, selectBillingStatusDetail, selectBillingStatusList, selectSkBillingStatusList, selectTaxInfo, sendMonthlyBillingStatement, updateBillDt, updateBillngClosing, updateCarryOver, updateRargeBillngClosing, updateTaxInfo, updatewrkDt, validBilling
- **generalPayment**: cancelAccounting, cancelPaymentClose, changeMergePayment, saveAccounting, saveMergeAccounting, saveTax, selectPayDivList, selectPaymentClosingDetailList, selectPaymentClosingList, selectPaymentConfirmList, selectPaymentTaxDetail, selectPaymentTaxDetailList, selectPaymentTaxList, updatePaymentClosing, updatePaymentConfirm
- **lineBillMgt**: applyForeignBillAmount, cancelLineBill, saveLineBill, selectCntrDetail, selectLineBillMgtList, selectLineBillPrintCntrList, updateForeignBillAmount, updateTotalBillingAmount
- **proxy**: proxyApprovalCancel, proxyApprovalSave, proxyConfirmCancel, proxyConfirmSave, proxyDepositCancel, proxyDepositSave, proxyDivSave, proxyListSearch, proxyListSearchDetail, proxyRmkSave, selectProxyPrintList, updateFileDoc
- **transSpec**: selectTransSpecList, selectTransSpecPtnList, selectTransSpecShpList

### [outputs] 실적(매출/하불/이익/포인트/통계) ★점소별이익  (66)
- **(직접)**: cancelPayCf, deleteBilling, deletePayment, getDept, save, saveBillInfo, saveMultiPayAppr, savePayApprList, savePayApprRemark, savePayCf, savePayCf_ALL, savePayInfo, selectBillList, selectBillingHistory, selectPayApprDetail, selectPayApprList, selectPayHistory, selectPayHistory_only, selectPayList, selectTotalOutputsList, updateTotalOutputModi, validMultiPayAppr, validPayAppr, validTotalOutputsPayAppr, validationPay
- **billingTotal**: selectBillTotByAccList
- **management**: SendEtransDrv, checkSendTalkClPay, deleteVhcTrcMemo, insertVhcTrcMemo, saveMgtRmkMgt, saveRtVhcRevSt, selectHiredCarCorpBillPayStList, selectOrdersList, selectProfitDetailList, selectProfitNLossStatList, selectRtVhcRevStList, selectVhcPayDdcMgtList, selectVhcTrcMemo, selectVhcTrcMemoDetail, selectVhcTrcStatList, selectVhcsalesList, selectordStPopupList, sendTalkClPay
- **paymentTotal**: selectPayCorpStatusList, selectStateOfAccByVehicleList, selectStateOfDtl1List, selectStateOfDtl2List
- **point**: saveMonPointSt, selectMonPointStList, selectPoint, selectPointLogList, selectPointMgtList, selectUsePointLogList, updateUsePoint, validSalesPic
- **statssales**: selectCorpUnpaidList, selectManOutsList, selectManSalesList, selectMonCorpOutsList, selectMonCorpSalesList, selectOPManOutsList, selectOPMonCorpOutsList, selectPointByPFMStDetail, selectPointByPFMStList, selectTermNCorpPayStList

### [order] TMS 오더(간편/수출/수입/셔틀 CRUD)  (59)
- **(직접)**: , confirmExportOrder, confirmImportOrder, deleteExportOrder, deleteImportOrder, deleteSimpleOrder, deleteUserOrder, getExportCargoView, getExportEtrans, getImportCargoView, getImportEtrans, getImportEtransEmptyCntr, saveBillingList, saveCstmExportOrder, saveCstmImportOrder, saveExportExcel, saveExportOrder, saveImportOrder, saveSimpleOrder, saveUserOrder, saveXrayCorpInfo, saveXrayInfoList, selectBillingList, selectBillngTariffList, selectCstmExportOrder, selectCstmImportOrder, selectExportOrder, selectImportOrder, selectSimpleOrder, selectTransTariffList, sendCofirmMail, sendSimpleOrder, updateOrderFileDoc, updateSearchOrderMgt, validUnpayUser
- **excelUpload**: selectExcelUpload
- **shuttle**: cancelShuttleOrderCntrPtn, deleteShuttleOrder, getBptCntrList, saveBndCntrList, saveShuttleBpt, saveShuttleExcel, saveShuttleOrder, saveShuttleSkr, selectBndCntrList, selectHasDailyClosing, selectHasShuttleOrder, selectShuttleCntr, selectShuttleOrder, selectShuttleOrderCntrPtn, selectShuttleVesselList, selectSkrDailyClosing, selectSkrShuttleOrder, selectSuttleOrderDetail, shuttleCntrValidation, updateShuttleOrderBillModi, updateShuttleOrderCntrPtn, updateShuttleOrderModi, updateShuttleOrderWeigthType

### [shuttle] 셔틀 그룹오더/배차  (52)
- **allocation**: copino, deleteShuttleCntr, getShuttleBillTariff, getShuttlePayTariff, saveAllocationTruck, saveCopinoId, saveOutTmInfo, saveShutAlloGroupOrder, saveShutMultiAllo, saveShutMultiModi, searchInTmlVslVoy, searchOutTmlVslVoy, searchTerminalEta, searchTerminalYardLoc, searchTmlInOutTime, selectAllocationTruckList, selectOutTmInfo, selectShutAlloInfo, selectShutAlloStatusList, sendTssCopino, sendTssCopinoV2, updateAlloCancel, updateAlloStatus, updateHoldingOff, updateHoldingOn
- **groupOrder**: deleteGroupOrder, deleteGroupOrderRegistCntr, deleteGroupOrderVhcList, groupOrderModifyValidation, groupOrderValidation, removeGroupOrderModCntrValid, saveBundle, saveGroupOrderRegist, saveGroupOrderVhcReg, savePreExImInfo, selectGroupOrderAlloList, selectGroupOrderCntrList, selectGroupOrderRegistCntrList, selectGroupOrderRegistList, selectGroupOrderRegistVhcList, selectGroupOrderStatusList, selectGroupOrderVhcList, updateGroupOrderList, updateGroupOrderStatus, updateTssGroupOrder, validGroupOrder, validGroupOrderCntrRemove, validGroupOrderMultiCntrRemove, validGroupOrderVhcRemove, validModify, validRegist, validRegistVhcList

### [bnd] 보세운송(적하목록/개청/정정)  (47)
- **bndTransMgt**: ForceBndComplete_V2, cargoEntryStatusCfs, cargoEntryStatusLcNoSearch, cargoEntryStatusUnInPlcCheck, deleteCusmovList, insertListBndMapOut, insertListBndMapOut_V2, saveBnd, saveBndAlloEstTrans, saveBndAlloEstTrans_V2, saveBndArrivalReport, saveBndArrivalReport_V2, saveBndOpenTrans, saveBndPrintSetup, saveBnd_V2, selectBndErrList, selectBndOpenTrans, selectBndOpenTransDtl, selectBndPrintSetup, selectCusdmrList, selectCusdmrList_V2, selectCusinf, selectCusinf_V2, selectCusmovCntDmrList, selectCusmovCntDmrList_V2, selectCusmovDtlList, selectCusmovDtlPrint, selectCusmovList, selectCusmovList_V2, selectCusmovUnInPlcList, sendOpenTrans
- **bndUpdate**: insertBondModi, insertMapOut, saveBndUpdate, selectBndUpdate, selectBndUpdatePopup, selectBndUpdatePrintList, selectBndUpdate_V2
- **customApi**: cargoEntryStatusSearch
- **mfcsSearch**: deleteMfcsList, selectMfcsList, selectMfcsPrintList, selectMfcsUploadList, updateMfcs
- **mfcsUpload**: deleteMfcsFiles, getMfcs, saveMfcs

### [allocation] 배차(도어/셔틀/차량할당/하불)  (42)
- **(직접)**: PopselectTransDriving, cancelDoorOrderCntrPtn, checkOrderCntr, clipBoardAlloAlertMsg, confirmAllocationTruck, deleteAllocation, deleteInputAllo, registShuttleOrder, saveAlloMultiModi, saveAllocation, saveAllocationTruck, saveAllocationTruckList, saveAllocationTruckListV2, saveCntr, saveInputAllo, saveMultiAllo, saveMultiAlloPayList, saveMultiPaymentList, savePaymentList, searchStdPayTariff, searchTerminalYardLoc, selectAlloPicHis, selectAlloSeqList, selectAllocation, selectAllocationTruckDetail, selectAllocationTruckList, selectAllocationTruckListPn, selectAllocationTruckTariffList, selectDirectAlloPayment, selectDirectAllocationTruckList, selectDoorAlloInfo, selectInstUltOrderPartner, selectPayPicList, selectPaymentList, selectTrainList, updateAlloPic, updateAlloStatus, updateCntrReturnChk, updateCntrReturnChk2, updateDoorOrderCntrPtn, updateEmptyCntrReturnDate, validSelfTransAppr

### [db] 고객서비스(공지/FAQ/요청/템플릿)  (27)
- **faq**: selectFaqList
- **notice**: deleteDBNoticePopup, naverOpen, saveDBNotice, saveDBNoticePopup, selectDBNotice, selectDriverNotice, selectDriverNoticeView
- **popup**: deleteFaqPopUp, deleteTmpDownPopUp, saveFaqPopUp, saveTmpDownPopUp, selectFaqPopUp, selectTmpDownPopUp, updateFaqPopUp, updateTmpDownPopUp
- **request**: deleteCfsDBRequestPopup, deleteDBRequestPopup, saveCfsDBRequest, saveCfsDBRequestPopup, saveDBRequest, saveDBRequestPopup, selectCfsDBRequest, selectDBRequest, updateCfsRequestFile, updateRequestFile
- **tmpDown**: selectTemplateDownloadList

### [(root)] 프레임워크 공통(로그인/메뉴/세션/알림)  (24)
- **(직접)**: BoardList, contractnotiList, custnotiList, findMyId, findMyPassword, headerMap, insertVisitLog, languageMap, login, logout, menuList, menuMap, notiList, openOnlyPage, picList, popButtonMap, registMyMenu, reorderMyMenu, saveHeaderMap, session, updateChgPwTm, updatePassword, updateUser, withdrawalUser

### [intStt] 실적신고 세금·회계  (13)
- **(직접)**: cancelAccounting, cancelIntSttList, cancelTaxBill, deleteTaxList, issueRsdnRgstTaxBill, issueTaxBill, resendMail, saveAccounting, saveIntSttList, saveTaxList, selectBranchTaxList, selectLogisBill, selectTaxList

### [orderList] 오더 목록 조회  (13)
- **(직접)**: searchXrayInfoList, selectCstmExportOrderCntr, selectCstmImportOrderCntr, selectCstmOrderList, selectExportOrderCntr, selectExportOrderList, selectImportOrderCntr, selectImportOrderList, selectKakaoExportOrder, selectKakaoImportOrder, selectOrderBookList, selectSimOrderCntr, selectTotalOrderList

### [code] 공통코드/드롭다운  (10)
- **(직접)**: selectAlloPartnerCorp, selectBlock, selectCmsShipperMgt, selectCntrLine, selectCommonCode, selectContainerList, selectLanguageCode, selectUserCode, selectUserCorpCode, selectWhzone

### [dsh] 대시보드  (10)
- **dashboard**: CustomNotinaverOpen, deleteCustomNoticePopup, saveCustomNoticePopup, searchFileList, selectCustomNotice, selectCustomNoticeView, selectExcahgneRate, selectMyDashboard, selectOrderByShipper, updateCusNoticeFile

### [dev] 개발/템플릿(내부)  (9)
- **excel**: upload
- **template**: createJsonWebToken, savetTemplateLayout01, selectDevTestProcedure, selectTemplateLayout01, selectTemplateMexg, sendMail, sendMessage, transKoreanToEngTest

### [intro] 소개/요율(비로그인)  (9)
- **code**: selectCorpCode, selectNoticeList
- **tariff**: selectIntroTariff, selectIntroTariffBlock, selectIntroTariffBlock_v2, selectIntroTariffCity, selectIntroTariffDong, selectIntroTariffSettingData, selectIntroTariff_v2

### [file] 파일 업/다운로드  (8)
- **(직접)**: , base64ImageDownload, fileDownload, fileUpload, logoImageDownload, multiFileUpload, multiFileUploadForRequest, selectFileList

### [taxMgt] 세금계산서 관리  (8)
- **(직접)**: cancelAccounting, cancelTaxBill, issueModiBill, saveAccounting, saveRemark, selectBillList, selectBillTaxCntrList, selectMgtList

### [auth] 인증(아이디/비번찾기)  (7)
- **(직접)**: authorized, clearLoginParam, findMyId, findMyPassword, registerUser, validUserId, validUserMbilNo

### [mobile] 모바일 교육  (6)
- **(직접)**: deleteMobilEdu, saveMobilEdu, selectMobilEduDetail, selectMobilEduList, selectMobileAciList, updateMobileEduFile

### [orderTemplate] 오더 템플릿  (6)
- **(직접)**: deleteOrderTemplate, saveOrderTemplate, selectOrderTemplate, selectOrderTemplateDetail, selectOrderTemplateDetailByDashBoard, validRepresentativeUser

### []   (4)
- **db/notice**: deleteDriverNoticePopup, saveDriverNoticePopup, selectDriverNotice, updateDrvNoticeFile

### [dr] 기사 배차  (4)
- **allo**: cancelUltOrder, completeUltOrder, sendUltAllocation, sendUltOrder

### [tax] 세금계산서 발행  (4)
- **(직접)**: issueRsdnRgstTaxBill, issueTaxBill, resendMail, selectLogisBill

### [template] 게시판 템플릿  (4)
- **board**: excelUpTemplateBoardMgt, saveTemplateBoardMgt, selectTemplateBoardMgt, sendTemplateBoardMgtEmail

### [admin] 관리자 사용자  (3)
- **(직접)**: userList, userOne, userSave

### [copino] COPINO  (3)
- **(직접)**: cancelBookingCopino, saveBookingCopino, selectCopinoHdSch

### [legal] 법제도(실적신고/차량위치)  (3)
- **perform**: selectPerfromDeclare, selectPerfromDeclareCntr
- **vhcLocTrck**: selectVhcLocTrckMgtList

### [requestApi] 외부연계 API  (3)
- **(직접)**: E71B001Csave, findMyPayList, findMyPayList_Car

### [tms] TMS 도어배차  (2)
- **dr/allo**: selectDoorAlloInfo
- **st/allo**: copino

### [sso] SSO  (1)
- **(직접)**: ssoLogin

### [webpush] 웹푸시  (1)
- **(직접)**: register

## 7. 주요 워크플로우별 핵심 엔드포인트 (커넥터 우선순위)

### 오더 등록/조회
- 간편오더: 조회 `order/selectSimpleOrder` · 저장 `order/saveSimpleOrder` · 삭제 `order/deleteSimpleOrder` · 전송 `order/sendSimpleOrder`
- 수출오더: `orderList/selectExportOrderList`, `order/selectExportOrder`, `order/saveExportOrder`, `order/confirmExportOrder`, `order/deleteExportOrder`
- 수입오더: `orderList/selectImportOrderList`, `order/selectImportOrder`, `order/saveImportOrder`, `order/confirmImportOrder`
- 통합조회: `orderList/selectTotalOrderList`
- 셔틀오더: `order/shuttle/selectShuttleOrder`, `order/shuttle/saveShuttleOrder`
- **saveSimpleOrder 요청 구조**(실측): `{ MAIN:{ ORDER_TYPE, ORD_REG_TYPE, LINE_CD, LINE_NM, SHIPPER, SHIPPER_CD, BKG_NO, OP_PIC, ETD_DT/TIME, DOC_CLOSING_DT/TIME, PCK_DT/TIME, PLC_BRNG_END_DT/TIME, ALERT_T_MNG, ALERT_T_TEL, CNTR:[...] }, CNTR_GRID:[ { WRK_DATE, WRK_TIME, WRK_PLC, WRK_PLC_NM, WRK_PLC_ADDR, CNTR_TYPE, CNTR_SPEC, CNTR_ISO, CNTR_TEMP_TYPE, TRANS_REGION_TXT, ITEM_SEQ, GRID_INDEX, SPCL_CONT, ... } ] }` → 응답 `{ data:{ ORD_SEQ } }`

### 실적/이익 (outputs)
- 점소별 영업이익: `outputs/statssales/selectPointByPFMStList` (§4 참조)
- 손익현황: `outputs/management/selectProfitNLossStatList`, 상세 `selectProfitDetailList`
- 월별·업체별 매출/실적/하불: `outputs/statssales/selectMonCorpSalesList` / `selectMonCorpOutsList`, 영업사원 `selectManSalesList`/`selectManOutsList`
- 실적통합관리: `outputs/selectTotalOutputsList`, 수정 `outputs/updateTotalOutputModi`
- 하불승인/확정: `outputs/selectPayApprList`, `outputs/savePayApprList`, `outputs/validTotalOutputsPayAppr`
- 포인트: 당월 `outputs/point/selectMonPointStList`, 이력 `selectPointLogList`, 관리 `selectPointMgtList`
- 청구집계: `outputs/billingTotal/selectBillTotByAccList`

### 정산 (sm)
- 청구현황/마감: `sm/generalBilling/selectBillingStatusList`, `updateBillngClosing`, `billingClosingExcel`
- 하불마감/확정: `sm/generalPayment/selectPaymentClosingList`, `updatePaymentConfirm`
- 세금계산서: `sm/generalBilling/saveTax`, 매입 `sm/generalPayment/selectPaymentTaxList`
- 거래명세서: `sm/transSpec/selectTransSpecList`, 대납 `sm/proxy/proxyListSearch`, BILL청구 `sm/lineBillMgt/selectLineBillMgtList`

### 대시보드 (dsh) / 정보 확인
- 내 대시보드: `dsh/dashboard/selectMyDashboard`, 화주별 오더 `selectOrderByShipper`, 환율 `selectExcahgneRate`, 공지 `selectCustomNotice`
- 공통코드: `code/selectCommonCode`(그룹코드 파라미터 필요), 컨테이너 `code/selectContainerList`, 사용자 `code/selectUserCode`
- 공통검색팝업: `cms/popup/selectCommonPopupCorp`(거래처), `selectCommonPopupPic`(담당자), `selectCommonPopupBilling`(청구처) 등

### 배차 (allocation)
- 배차조회/저장: `allocation/selectAllocationTruckList`, `allocation/saveAllocationTruck`, `confirmAllocationTruck`
- 배차현황: `allocation/door/alloStatusSearch`, 하불 `allocation/selectPaymentList`, `savePaymentList`

## 8. 커넥터 개발 가이드
1. **인증**: 서비스 계정으로 `POST /api/login` → 쿠키 저장 → 모든 요청에 쿠키 재사용(`credentials:include`). 세션 만료 시 `/api/session` 401/500이면 재로그인.
2. **조회 커넥터**: `{SEARCH:{...}}` 본문으로 select 호출 → `data.*_LIST`/`data.DATA` 파싱. 페이징은 `CURR_PAGE`,`PER_PAGE` 지원 화면 존재.
3. **코드 매핑**: 영업소/거래처/선사/포트/담당자 등은 코드값 사용. `code/*`,`cms/popup/*` 로 코드↔명 사전 구성 후 캐시.
4. **쓰기 커넥터**(save/update/delete): 반드시 사내 승인 후. 요청 본문은 해당 화면에서 1건 실행해 네트워크 캡처로 정확한 스키마 확보 권장(화면별 필드 다수).
5. **엑셀/실적 다운로드**: 대부분 그리드를 서버에서 조회 후 클라이언트가 xlsx 생성. 커넥터는 조회 JSON을 받아 자체적으로 원하는 포맷으로 저장.
6. **주의**: 실 서버·실 데이터. 테스트는 조회(select)만. 대량 반복 호출은 서버 부하 고려.

---
*본 문서는 로그인 세션에서 화면 탐색 + JS 번들 정적분석 + 실호출 캡처로 작성되었으며, 개인정보(직원명 등)는 제외했습니다.*