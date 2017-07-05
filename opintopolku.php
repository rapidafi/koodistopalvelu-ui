<?php
ini_set('display_errors', 'On');
error_reporting(E_ALL);

// parametrit / argumentit
$p_type = "html";
$p_showhtml = true;
$p_term = 'sukupuoli'; // sukupuoli-koodisto
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

  if (isset($_GET['term'])) {
    $p_term = $_GET['term'];
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
<select name="term" onchange="">
<?php
} // showhtml

$json = file_get_contents("https://virkailija.opintopolku.fi/koodisto-service/rest/json");
$array = json_decode($json, true);

foreach ($array as $entry) {
  if ($entry['id']==0) {
    if ($p_showhtml) {
      foreach ($entry['koodistos'] as $i => $item) {
        echo '<option value="'.$item['koodistoUri'].'" ';
        if ($p_term==$item['koodistoUri']) {
          echo 'selected="selected"';
        }
        foreach ($item['latestKoodistoVersio']['metadata'] as $meta) {
          if ($meta['kieli']=='FI') {
            echo '>'.$meta['nimi'].'</option>'.PHP_EOL;
          }
        }
      }
    }
    if ($p_list) {
      /*
      if ($p_type=='xml' || $p_type=='html') {
        $xml = new SimpleXMLElement('<root/>');
        array_walk_recursive($array, array ($xml, 'addChild'));
        $str = $xml->asXML();
        if ($p_showhtml) {
          echo htmlentities($str);
        } else {
          echo $str;
        }
      }
      */
      if ($p_type=='json') {
        //var_dump($entry);
        echo json_encode($entry['koodistos']);
      }
    }
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
  // now switch to codeset, regardless of mode (type), not in list mode though
  if (isset($p_term)) {
    if ($p_type=='json') {
      echo file_get_contents("https://virkailija.opintopolku.fi/koodisto-service/rest/json/".$p_term."/koodi");
    }
    else {
      $str = file_get_contents("https://virkailija.opintopolku.fi/koodisto-service/rest/".$p_term."/koodi");
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