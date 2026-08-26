/**
 * Google Apps Script (GAS) 코드 템플릿
 * 구글 스프레드시트와 실시간 연동하기 위한 백엔드 스크립트입니다.
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * 교원 직무연수 마음 출석부 (Before & After) Google Apps Script
 * 구글 스프레드시트 [확장 프로그램] > [Apps Script] 에 붙여넣고 웹 앱으로 배포하세요.
 */

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Sheet 1: Responses (연수생 출석 및 감정 응답 기록)
  var sheet1 = ss.getSheetByName("Responses") || ss.insertSheet("Responses");
  if (sheet1.getLastRow() === 0) {
    sheet1.appendRow([
      "기록일시", 
      "연수일자", 
      "연수 과정명", 
      "연수생 성명", 
      "구분 (연수 전 / 연수 후)", 
      "감정 범주 (A열정/B평온/C부담)", 
      "선택 감정 단어", 
      "주관식 내용 (기대감 / 소감 및 배운점)"
    ]);
    var headerRange = sheet1.getRange(1, 1, 1, 8);
    headerRange.setFontWeight("bold")
               .setBackground("#FFF1ED")
               .setFontColor("#2D2A26")
               .setHorizontalAlignment("center");
    sheet1.setFrozenRows(1);
    sheet1.setColumnWidth(1, 170);
    sheet1.setColumnWidth(2, 110);
    sheet1.setColumnWidth(3, 240);
    sheet1.setColumnWidth(4, 110);
    sheet1.setColumnWidth(5, 130);
    sheet1.setColumnWidth(6, 160);
    sheet1.setColumnWidth(7, 130);
    sheet1.setColumnWidth(8, 350);
  }
  
  // Sheet 2: Roster (연수생 명단 관리)
  var sheet2 = ss.getSheetByName("Roster") || ss.insertSheet("Roster");
  if (sheet2.getLastRow() === 0) {
    sheet2.appendRow(["연수 과정명", "연수생 명단"]);
    sheet2.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#F5EFE6");
    sheet2.setFrozenRows(1);
  }
}

// 웹앱 doGet (연결 테스트용)
function doGet(e) {
  setupSheets();
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "마음 출석부 구글 시트 연동 백엔드가 정상 작동 중입니다."
  })).setMimeType(ContentService.MimeType.JSON);
}

// 웹앱 doPost (데이터 제출 수신)
function doPost(e) {
  try {
    setupSheets();
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Responses");
    
    // 1. 단일 응답 제출
    if (data.action === "SUBMIT_RESPONSE") {
      var row = [
        data.timestamp || new Date().toISOString(),
        data.date || Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd"),
        data.sessionTitle || "",
        data.studentName || "",
        data.type === "BEFORE" ? "연수 시작 전" : "연수 종료 후",
        data.categoryName || (data.categoryKey === 'A' ? '열정·기대(A)' : data.categoryKey === 'B' ? '평온·안정(B)' : '부담·피로(C)'),
        data.emotion || "",
        data.comment || ""
      ];
      sheet.appendRow(row);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "성공적으로 구글 스프레드시트에 기록되었습니다."
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 2. 전체 응답 일괄 동기화 (배치 전송)
    if (data.action === "BATCH_SYNC" && Array.isArray(data.responses)) {
      var rows = data.responses.map(function(item) {
        return [
          item.timestamp || new Date().toISOString(),
          item.date || "",
          item.sessionTitle || "",
          item.studentName || "",
          item.type === "BEFORE" ? "연수 시작 전" : "연수 종료 후",
          item.categoryName || (item.categoryKey === 'A' ? '열정·기대(A)' : item.categoryKey === 'B' ? '평온·안정(B)' : '부담·피로(C)'),
          item.emotion || "",
          item.comment || ""
        ];
      });
      
      if (rows.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 8).setValues(rows);
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        count: rows.length,
        message: rows.length + "건의 응답이 일괄 저장되었습니다."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. 연결 테스트 핑
    if (data.action === "TEST_CONNECTION") {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "구글 시트 웹앱 연결 테스트 성공!"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "ignored",
      message: "알 수 없는 요청입니다."
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
