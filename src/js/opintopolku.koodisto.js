// Opintopolku / Koodisto Service:
function getLanguageSpecificValue(fieldArray, fieldName, language) {
  if (fieldArray) {
    for (var i = 0; i < fieldArray.length; i++) {
      if (fieldArray[i].kieli === language) {
        var result = eval("fieldArray[i]." + fieldName);
        return result == null ? "" : result;
      }
    }
  }
  return "";
}
function getLanguageSpecificValueOrValidValue(fieldArray, fieldName, language) {
  var specificValue = getLanguageSpecificValue(fieldArray, fieldName, language);

  if (specificValue == "" && language != "FI"){
    specificValue = getLanguageSpecificValue(fieldArray, fieldName, "FI");
  }
  if (specificValue == "" && language != "SV"){
    specificValue = getLanguageSpecificValue(fieldArray, fieldName, "SV");
  }
  if (specificValue == "" && language != "EN"){
    specificValue = getLanguageSpecificValue(fieldArray, fieldName, "EN");
  }
  return specificValue;
}
