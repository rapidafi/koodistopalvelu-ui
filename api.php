<?php

header('Content-Type: application/json; charset=utf-8');

// parametrit / argumentit
if ($_GET) {
  if (isset($_GET['uri']) && $_GET['uri']) {
    echo file_get_contents($_GET['uri']);
  }
}

// no end tag to ensure we don't mess up json