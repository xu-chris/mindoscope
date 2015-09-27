<?php

$ds   = DIRECTORY_SEPARATOR;
$path = 'uploaded';

if (!empty($_FILES)) {
  $tempFile = $_FILES['file']['tmp_name'];
  $targetPath = dirname( __FILE__ ) . $ds. $path . $ds;
  $targetFile =  $targetPath. $_FILES['file']['name'];
  $hash = hash_file('md5', $tempFile);
  move_uploaded_file($tempFile,$targetFile);
  rename ($targetFile, $targetPath.$hash.'.mm');
}

/*----------  OPTIONS  ----------*/

$url         = $targetPath.$hash.'.mm';
$enableCache = true;

/*=========================================
=            JSON file builder            =
=========================================*/

function buildJSON($url) {

  global $path;
  global $enableCache;
  global $hash;
  global $ds;

  // If there's no file: return error
  $fileContents= file_get_contents($url);
  if (!file_exists($url)) return error_log('File not found');

  // If file exists already: return content from file
  $cacheFilename = $path . $ds. $hash.'.json';

  if ($enableCache && file_exists($cacheFilename)) {
    return;
  }

  // read the file contents and convert JSON from Freemind XML structure
  $xml = simplexml_load_string($fileContents);

  $array = XMLtoArray($xml)[0];
    // The calculated array is packed in an array, so we're taking it out of it.
  $json = json_encode($array);

  // Write result to file
  file_put_contents($cacheFilename, $json);
}

/*=====================================================
=            Freemind-XML to readable JSON            =
=====================================================*/

function XMLtoArray($xml)
{
  global $id;
  // Kill the recursive loop if needed variables are null
  if ($xml == null) return false;

  /*----------  DYNAMIC VARIABLES  ----------*/
  $arr = null;

  foreach($xml->node as $key => $node)
  {
    // Save results to variables
    $name = ($node['TEXT'] == null ? (string)$node['text'] : (string)$node['TEXT']);

    // Check if node has children. If yes, explore them and save them as an array of children
    // ATTENTION: This function is recursive.
    if(count($node->children()) == 0) // Found leaf node
    {
      $arr[] = array(
        "name" => $name
      );
    }
    else { // Has children
      $arr[] = array(
        "name" => $name,
        "children" => XMLtoArray($node)
      );
    }
  }
  return $arr;
}

/*============================================
=            XML depth calculator            =
============================================*/

function getXMLDepth($xml) {
  $max_depth = 1;

  // count depth up
  foreach ($xml->node as $value) {
    if ($value->children() != null) {
      $depth = getXMLDepth($value) + 1;

      // change max_depth if depth is higher
      if ($depth > $max_depth) {
          $max_depth = $depth;
      }
    }
  }

  return $max_depth;
}

/*----------  Returning area  ----------*/
buildJSON($url);
echo $hash;

// fclose($url);
// unlink($url);
die();