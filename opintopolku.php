<?php
// parametrit / argumentit
$p_type = "html";
$p_showhtml = true;
$p_list = false;
$p_test = "";
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

  if (isset($_GET['codeset'])) {
    $p_codeset = $_GET['codeset'];
  }
  if (isset($_GET['code'])) {
    $p_code = $_GET['code'];
  }

  if (isset($_GET['test'])) {
    $p_test = "testi.";
  }
}

// alternatively get more api like from URI, e.g. .../[self].php/[codeset]/[code]
// no special handling for both, so order matters here
// 2018-03-05: more opintopolku like: .../[self].php/codeelement/latest/[codeset]_[code]
//   --''--  : also added .../[self].php/json and ..../list for listing
if (isset($_SERVER['PATH_INFO'])) {
  $p_type = 'json';
  $p_showhtml = false;
  $request = array();
  $request = explode('/', trim($_SERVER['PATH_INFO'],'/'));
  $const = array_shift($request);//test | list|json | codeelement
  if ($const=='test') {
    $p_test = "testi.";
    $const = array_shift($request);//list|json | codeelement
  }
  if ($const=='json' || $const=='list') {
    $p_list = true;
  } else {
    $const = array_shift($request);//latest
    $p_codeset = array_shift($request);
    $codesetcode = explode('_', $p_codeset);
    $p_codeset = $codesetcode[0];
    if (count($codesetcode)>1) {
      $p_code = $codesetcode[1];
    }
  }
  //$p_codeset = preg_replace('/[^a-z0-9_]+/i','',array_shift($request));
  //$p_code = array_shift($request);
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
<link rel="stylesheet" href="css/rapida.css">

<title>proxy for opintopolku koodisto-service rest</title>
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
<?php
} // showhtml

if ($p_list) {
  echo file_get_contents("https://".$p_test."virkailija.opintopolku.fi/koodisto-service/rest/json");
}
elseif ($p_showhtml) {
  $json = file_get_contents("https://".$p_test."virkailija.opintopolku.fi/koodisto-service/rest/json");
  $array = json_decode($json, true);

  foreach ($array as $entry) {
    if ($entry['id']==0) {
      foreach ($entry['koodistos'] as $i => $item) {
        echo '<option value="'.$item['koodistoUri'].'" ';
        if (isset($p_codeset) && $p_codeset==$item['koodistoUri']) {
          echo 'selected="selected"';
        }
        foreach ($item['latestKoodistoVersio']['metadata'] as $meta) {
          if ($meta['kieli']=='FI') {
            echo '>'.$meta['nimi'].'</option>'.PHP_EOL;
          }
        }
      }
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
  // now switch to codeset, regardless of mode (type), not in list mode though
  if (isset($p_codeset)) {
    if ($p_type=='json') {
      if (isset($p_code)) {
        echo file_get_contents("https://".$p_test."virkailija.opintopolku.fi/koodisto-service/rest/json/".$p_codeset."/koodi/".$p_codeset."_".$p_code);
      } else {
        echo file_get_contents("https://".$p_test."virkailija.opintopolku.fi/koodisto-service/rest/json/".$p_codeset."/koodi");
      }
    }
    else {
      if (isset($p_code)) {
        $str = file_get_contents("https://".$p_test."virkailija.opintopolku.fi/koodisto-service/rest/".$p_codeset."/koodi/".$p_codeset."_".$p_code);
      } else {
        $str = file_get_contents("https://".$p_test."virkailija.opintopolku.fi/koodisto-service/rest/".$p_codeset."/koodi");
      }
      if ($p_showhtml) {
        $xml = simplexml_load_string($str);
        $dom = new DOMDocument('1.0');
        $dom->preserveWhiteSpace = false;
        $dom->formatOutput = true;
        $dom->loadXML($xml->asXML());
        echo htmlentities($dom->saveXML());
      } else {
        echo $str;
      }
    }
  }
} // !list

if($p_showhtml) {
?>
</pre>

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