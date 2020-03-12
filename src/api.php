<?php

header('Content-Type: application/json; charset=utf-8');

// Caller-Id header (Opintopolku dictated)
$request_headers=stream_context_create(
  array(
    'http'=>array(
      'method'=>'GET',
      'header'=>"Caller-Id: 1.2.246.10.27977962.koodistopalvelu\r\n"
    )
  )
);

// parametrit / argumentit
if ($_GET) {
  if (isset($_GET['uri']) && $_GET['uri']) {
    echo file_get_contents($_GET['uri'], false, $request_headers);
  }
}

// no end tag to ensure we don't mess up json