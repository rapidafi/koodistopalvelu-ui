<?php
// parametrit / argumentit
$p_type = "html";
$p_showhtml = true;
$p_termSystemId = '1.2.246.537.5.1'; // sukupuoli-koodisto
$p_list = false;
if ($_GET) {
  if(isset($_GET['type'])) {
    if ($_GET['type']=='json') {
      $p_type = 'json';
      $p_showhtml = false;
      header('Content-Type: application/json; charset=utf-8');
    }
    if ($_GET['type']=='xml') {
      $p_type = 'xml';
      $p_showhtml = false;
      header('Content-Type: text/xml; charset=utf-8');
    }
  }

  if (isset($_GET['termSystemId'])) {
    $p_termSystemId = $_GET['termSystemId'];
  }
  if (isset($_GET['list'])) {
    $p_list = true;
    $p_type = "json";
    $p_showhtml = false;
    header('Content-Type: application/json; charset=utf-8');
  }
}

if ($p_showhtml) {
header('Content-Type: text/html; charset=utf-8');
?><!DOCTYPE html>
<html>
<head>
<!-- bootstrap :: the  first 3 must be first -->
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">

<link rel="stylesheet" href="http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css">

<link rel="stylesheet" type="text/css" href="//fonts.googleapis.com/css?family=Open+Sans" />
<link rel="stylesheet" href="rapida.css">

<script type="text/javascript">
   function toggle_visibility(id) {
       var e = document.getElementById(id);
       if(e.style.display == 'block')
          e.style.display = 'none';
       else
          e.style.display = 'block';
   }
</script>

<title>proxy for thl codeserver</title>
</head>
<body class="container-fluid">

<div class="row">
<div class="col-xs-12">

<form>
<table>
<tr>
<td>
<h4>Valitse koodisto</h4>
</td>
<td>
<select name="termSystemId" onchange="">
<?php
} // showhtml

// get list of all code systems
define("codeservice_wsdl","http://91.202.112.142/codeserver/ws/services/CodeserviceService?wsdl");
$wsdl = new SoapClient(codeservice_wsdl, array("trace"=>1));
$wsdl->__setLocation("http://91.202.112.142/codeserver/ws/services/CodeserviceService");

$result = $wsdl->GetSupportedCodeSystems();

$xml = simplexml_load_string($wsdl->__getLastResponse());
// "Pretty print": http://stackoverflow.com/questions/8615422/php-xml-how-to-output-nice-format
$dom = new DOMDocument('1.0');
$dom->preserveWhiteSpace = false;
$dom->formatOutput = true;
$dom->loadXML($xml->asXML());
if ($p_showhtml) {
  foreach ($dom->getElementsByTagName('termSystem') as $entry) {
    echo '<option value="'.$entry->getAttribute('id').'" ';
    if ($p_termSystemId==$entry->getAttribute('id')) {
      echo 'selected="selected"';
    }
    echo '>'.$entry->nodeValue.'</option>'.PHP_EOL;
  }
}
if ($p_list) {
  if ($p_type=='xml' || $p_type=='html') {
    $str = $dom->saveXML();
    if ($p_showhtml) {
      echo htmlentities($str);
    } else {
      echo $str;
    }
  }
  if ($p_type=='json') {
    //var_dump(json_encode($xml->asXML()));
    $tojson = array();
    foreach ($dom->getElementsByTagName('termSystem') as $entry) {
      //var_dump($entry);
      $tojson_item = array('id' => $entry->getAttribute('id'), 'name' => $entry->nodeValue);
      array_push($tojson, $tojson_item);
    }
    //var_dump($json);
    echo json_encode($tojson);
  }
}

if ($p_showhtml) {
?>
</select>
</td>
<tr>
    <td><input type="submit" value="Lähetä"></td>
</tr>
</table>
</form>

</div>
</div>

<div class="row">
<div class="col-xs-12">
<pre>
<?php
} // showhtml
if (!$p_list) {
  // now switch to codeset WS, regardless of mode (type), not in list mode though
  define("codeset_wsdl","http://91.202.112.142/codeserver/ws/services/CodesetService?wsdl");
  $wsdl = new SoapClient(codeset_wsdl, array("trace"=>1));
  $wsdl->__setLocation("http://91.202.112.142/codeserver/ws/services/CodesetService");

  if (isset($p_termSystemId)) {
    $termSystem = array('_' => null, 'id' => $p_termSystemId);
    $Hakuehdot = array('termSystem' => $termSystem);
    $result = $wsdl->ListCodes($Hakuehdot);
    //echo htmlentities(str_replace("><", ">\n<", $wsdl->__getLastResponse()));
    // http://php.net/manual/en/function.simplexml-load-string.php
    $xml = simplexml_load_string($wsdl->__getLastResponse());
    // "Pretty print": http://stackoverflow.com/questions/8615422/php-xml-how-to-output-nice-format
    $dom = new DOMDocument('1.0');
    $dom->preserveWhiteSpace = false;
    $dom->formatOutput = true;
    $dom->loadXML($xml->asXML());
    $str = $dom->saveXML();
    if ($p_type=='xml' || $p_type=='html') {
      if ($p_showhtml) {
        echo htmlentities($str);
      } else {
        echo $str;
      }
    }
    if ($p_type=='json') {
      //var_dump(json_encode($xml->asXML()));
      $tojson = array();
      foreach ($dom->getElementsByTagName('termItemEntry') as $entry) {
        //var_dump($entry);
        $tojson_item = array('id' => $entry->getAttribute('id'));
        foreach ($entry->getElementsByTagName('attribute') as $attr) {
          // todo choose fields? for example:
          // - shortname, longname, description, abbreviation
          // - begindate, expirationdate
          // - oid, parentid, hierarchylevel, status
          // - (and those other lang fields?)
          // basically not:
          // - createddate, lastmodifieddate, lastmodifiedby
          //if ($attr->getAttribute('type')=="shortname") {
          //  $tojson_item['shortname'] = $attr->nodeValue;
          //}
          if (!in_array($attr->getAttribute('type'),array("createddate", "lastmodifieddate", "lastmodifiedby"))) {
            // todo language?
            if ($attr->getAttribute('language')=="fi") {
              $tojson_item[$attr->getAttribute('type')] = $attr->nodeValue;
            }
          }
        }
        array_push($tojson, $tojson_item);
      }
      //var_dump($json);
      echo json_encode($tojson);
    }
  }
} // !list

if($p_showhtml) {
?>
</pre>

</div>
</div>

<div class="row">
<div class="col-xs-12">
<div>
<a href="javascript:toggle_visibility('wsdl_functions')">Näytä/piilota funktiot</a>
<div id="wsdl_functions" style="display:none;">
<pre><?php
var_dump($wsdl->__getFunctions());
?></pre>
</div>
<a href="javascript:toggle_visibility('wsdl_types')">Näytä/piilota tyypit</a>
<div id="wsdl_types" style="display:none;">
<pre><?php
var_dump($wsdl->__getTypes());
?></pre>
</div>
</div>
</div>
</div>

<div class="row">
<div class="col-xs-12 text-center">
<span class="color3">&copy; <a href="//rapida.fi">Rapida</a> 2017</span>
</div>
</div>

</body>
</html>
<?php
} // showhtml
?>