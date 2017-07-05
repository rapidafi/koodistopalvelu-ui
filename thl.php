<?php
// parametrit / argumentit
$p_type = "html";
$p_showhtml = true;
$p_list = false;
if ($_GET) {
  if(isset($_GET['type'])) {
    if ($_GET['type']=='json') {
      $p_type = 'json';
      $p_showhtml = false;
    }
    if ($_GET['type']=='xml') {
      $p_type = 'xml';
      $p_showhtml = false;
    }
  }

  if (isset($_GET['list'])) {
    $p_list = true;
    $p_type = "json";
    $p_showhtml = false;
  }

  if (isset($_GET['codeset']) && $_GET['codeset']) {
    $p_codeset = $_GET['codeset'];
  }
  // not supported by THL codeserver but for generalization we'll provide this
  // nb! for type json only!
  if (isset($_GET['code'])) {
    $p_code = $_GET['code'];
  }
}

// alternatively get more api like from URI, e.g. .../[self].php/[codeset]/[code]
// no special handling for both, so order matters here
if (isset($_SERVER['PATH_INFO'])) {
  $p_type = 'json';
  $p_showhtml = false;
  $request = array();
  $request = explode('/', trim($_SERVER['PATH_INFO'],'/'));
  $p_codeset = preg_replace('/[^a-z0-9_.]+/i','',array_shift($request));
  $p_code = array_shift($request);
}

switch ($p_type) {
  case 'json':
    header('Content-Type: application/json; charset=utf-8');
    break;
  case 'xml':
    header('Content-Type: text/xml; charset=utf-8');
    break;
  case 'html':
    header('Content-Type: text/html; charset=utf-8');
    break;
  default:
    $p_type = 'html';
    header('Content-Type: text/html; charset=utf-8');
    break;
}

if ($p_showhtml) {
?><!DOCTYPE html>
<html>
<head>
<!-- bootstrap :: the  first 3 must be first -->
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">

<link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css">

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
<select name="codeset" onchange="">
  <option></option>
<?php
} // showhtml

if ($p_showhtml || $p_list) {
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
      if (isset($p_codeset) && $p_codeset==$entry->getAttribute('id')) {
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
} // showhtml or list

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

  if (isset($p_codeset)) {
    $termSystem = array('_' => null, 'id' => $p_codeset);
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
      //*
      $tojson = array();
      foreach ($dom->getElementsByTagName('termItemEntry') as $entry) {
        //var_dump($entry);
        // we'll loop all fields so we can make json and drop some not needed fields at the same price
        if (!isset($p_code) || (isset($p_code) && $p_code==$entry->getAttribute('id'))) {
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
      }
      //var_dump($json);
      echo json_encode($tojson);
      //*/
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