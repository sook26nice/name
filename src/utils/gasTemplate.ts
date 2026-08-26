/**
 * Google Apps Script (GAS) 코드 템플릿
 * 구글 스프레드시트와 실시간 연동하기 위한 백엔드 스크립트입니다.
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * 마음 출석부 (Before & After) Google Apps Script
 * 구글 스프레드시트 [확장 프로그램] > [Apps Script] 에 붙여넣고 배포하세요.
 */

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Sheet 1: Responses (응답 기록)
  var sheet1 = ss.getSheetByName("Responses") || ss.insertSheet("Responses");
  if (sheet1.getLastRow() === 0) {
    sheet1.appendRow(["타임스탬프", "날짜", "수업명", "이름", "구분(전/후)", "감정 카테고리", "상세 감정", "주관식 멘트(기대/소감)"]);
    sheet1.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#F3F4F6");
    sheet1.setFrozenRows(1);
  }
  
  // Sheet 2: Roster (명단 관리)
  var sheet2 = ss.getSheetByName("Roster") || ss.insertSheet("Roster");
  if (sheet2.getLastRow() === 0) {
    sheet2.appendRow(["수업명", "참여자 명단(쉼표 구분)"]);
    sheet2.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#F3F4F6");
    sheet2.setFrozenRows(1);
  }
  
  // Sheet 3: Emotion Dictionary (감정 사전)
  var sheet3 = ss.getSheetByName("Emotion Dictionary") || ss.insertSheet("Emotion Dictionary");
  if (sheet3.getLastRow() === 0) {
    sheet3.appendRow(["카테고리 코드", "카테고리명", "감정 단어"]);
    sheet3.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#F3F4F6");
    sheet3.setFrozenRows(1);
  }
}

// 웹앱 doGet
function doGet(e) {
  setupSheets();
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "마음 출석부 백엔드 API가 정상 작동 중입니다."
  })).setMimeType(ContentService.MimeType.JSON);
}

// 웹앱 doPost (데이터 제출 수신)
function doPost(e) {
  try {
    setupSheets();
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Responses");
    
    // action 분기
    if (data.action === "SUBMIT_RESPONSE") {
      var row = [
        new Date().toISOString(),
        data.date || Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd"),
        data.sessionTitle || "",
        data.studentName || "",
        data.type === "BEFORE" ? "수업 전" : "수업 후",
        data.categoryName || "",
        data.emotion || "",
        data.comment || ""
      ];
      sheet.appendRow(row);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "성공적으로 스프레드시트에 기록되었습니다."
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
