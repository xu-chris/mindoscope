<?php 

$ds          = DIRECTORY_SEPARATOR;  //1
 
$storeFolder = 'upload';   //2
 
if (!empty($_FILES)) {
  $tempFile = $_FILES['file']['tmp_name'];          //3             
  $targetPath = dirname( __FILE__ ) . $ds. $storeFolder . $ds;  //4
  $targetFile =  $targetPath. $_FILES['file']['name'];  //5
  move_uploaded_file($tempFile,$targetFile); //6 
  rename ($targetFile, $targetPath.'file.mm');
}

/*----------  OPTIONS  ----------*/

$url         = $targetPath. 'file.mm';
$cachePath   = 'content/';
$enableCache = true;

/*=========================================
=            JSON file builder            =
=========================================*/

function getJSONHash($url) {
 
  global $cachePath;
  global $enableCache;

  // If there's no file: return error
  $fileContents= file_get_contents($url);
  if (!file_exists($url)) return error_log('File not found');

  // If file exists already: return content from file
  $hash = hash_file('md5', $url);
  
  $cacheFilename = $cachePath.$hash.'.json';

  if ($enableCache && file_exists($cacheFilename)) {
    // DEV: echo to console
    //echo '<script>console.log("Found cachefile.")</script>';
    // Return the cache filename
    return $hash;
  }

  // read the file contents and convert JSON from Freemind XML structure
  $xml = simplexml_load_string($fileContents);

  $array = recursiveXML($xml)[0]; 
    // The calculated array is packed in an array, so we're taking it out of it.
  $json = json_encode($array);

  // Write result to file
  file_put_contents($cacheFilename, $json);

  // DEV: echo to console
  //echo '<script>console.log("Built new cachefile.")</script>';

  // Return the cache filename
  return $hash;
}

/*=====================================================
=            Freemind-XML to readable JSON            =
=====================================================*/

function recursiveXML($xml) 
{

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
      $children = recursiveXML($node);
      $arr[] = array(
        "name" => $name,
        "children" => $children
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

echo getJSONHash($url);
die();