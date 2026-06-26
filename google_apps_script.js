/**
 * Google Apps Script for "Honor of Eco" Backend
 * 
 * Paste this script into your Google Apps Script editor (script.google.com) 
 * bound to your target Google Sheet. Depoloy it as a Web App to get your URL.
 */

function doPost(e) {
  try {
    // 1. Parse incoming solid actions from the React App
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action; // e.g., 'addEntry'
    var item = postData.data;     // Entry payload data
    
    // Open the Active Spreadsheet and target Sheets
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Entries") || ss.getSheets()[0];
    
    if (action === "addEntry" && item) {
      // 2. Extract input values
      var studentID   = item.studentID || "";
      var name        = item.name || "";
      var className   = item.className || "";
      var mixedWaste  = parseFloat(item.weight) || 0.0; // Mixed dry recyclables weight in KG
      
      // Check if Used Cooking Oil (ucoKg) or custom factor is submitted
      var ucoWaste    = parseFloat(item.ucoKg) || 0.0;   // Used Cooking Oil weight in KG
      
      // 3. Multiplier coefficients
      var mixedMultiplier = 2.65;
      var ucoMultiplier   = 2.50;
      
      // Calculate individual elements
      var avoidedFromMixed = mixedWaste * mixedMultiplier;
      var avoidedFromUco   = ucoWaste * ucoMultiplier;
      var totalCO2Saved    = avoidedFromMixed + avoidedFromUco;
      
      // 4. Append to Google Sheets
      // Columns: [ID, Student ID, Name, Class Name, Recycle Type, Teacher, Mixed Waste (KG), UCO (KG), Date Created, Total avoided CO2 (KG)]
      var rowData = [
        item.id || Utilities.getUuid(),
        studentID,
        name,
        className,
        item.type || "recycle",
        item.teacherName || "System",
        mixedWaste,
        ucoWaste,
        item.createdAt || new Date().toLocaleString(),
        totalCO2Saved // Automatically calculating total CO2 saved in a new column!
      ];
      
      sheet.appendRow(rowData);
      
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        message: "Entry logged successfully into Sheet!",
        co2Saved: totalCO2Saved
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Secondary fallback for general system synchronizations
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      message: "No specific action matching parsed criteria." 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    // Handle failures gracefully
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
